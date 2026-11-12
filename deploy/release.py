"""Update pre-provisioned StudyTrack resources; never bootstrap IAM/SQL/secrets."""

import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.error import URLError
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen


class ReleaseError(RuntimeError):
    pass


def command(args, runner):
    try:
        result = runner(args, capture_output=True, text=True, check=False, timeout=600)
    except (OSError, subprocess.TimeoutExpired) as error:
        raise ReleaseError(f"Could not complete {args[0]} {args[1]}.") from error
    if result.returncode:
        # Do not dump configuration JSON, credentials or arbitrary tool output.
        operation = " ".join(args[:4] if args[0] == "gcloud" else args[:2])
        raise ReleaseError(f"{operation} failed (exit {result.returncode}); inspect that resource's logs before retrying.")
    return result.stdout.strip()


def settings(env, runner):
    required = ("PROJECT_ID", "REGION", "IMAGE_TAG", "GITHUB_SHA", "GITHUB_REF",
                "GITHUB_EVENT_NAME", "GITHUB_RUN_ID", "WIF_PROVIDER", "WIF_SERVICE_ACCOUNT")
    if any(not env.get(key) for key in required):
        raise ReleaseError("Missing release settings or GitHub main-run context.")
    s = {key: env[key] for key in required}
    s["ROLLBACK"] = env.get("ROLLBACK", "false")
    s["GITHUB_RUN_ATTEMPT"] = env.get("GITHUB_RUN_ATTEMPT", "1")
    patterns = {"PROJECT_ID": r"[a-z][a-z0-9-]{4,28}[a-z0-9]",
                "REGION": r"[a-z]+-[a-z]+[0-9]+", "IMAGE_TAG": r"[0-9a-f]{40}",
                "GITHUB_SHA": r"[0-9a-f]{40}", "GITHUB_RUN_ID": r"[1-9][0-9]{0,19}",
                "GITHUB_RUN_ATTEMPT": r"[1-9][0-9]{0,5}",
                "WIF_PROVIDER": r"projects/[0-9]+/locations/global/workloadIdentityPools/github-actions/providers/github-main"}
    if any(not re.fullmatch(pattern, s[key]) for key, pattern in patterns.items()):
        raise ReleaseError("Invalid release identifier or WIF provider.")
    if s["WIF_SERVICE_ACCOUNT"] != f"studytrack-deployer@{s['PROJECT_ID']}.iam.gserviceaccount.com":
        raise ReleaseError("Unexpected deployment service account.")
    if (s["GITHUB_REF"] != "refs/heads/main" or
            s["GITHUB_EVENT_NAME"] not in ("push", "workflow_dispatch") or
            s["ROLLBACK"] not in ("true", "false")):
        raise ReleaseError("Only a reviewed main push or main workflow_dispatch is allowed.")
    if env.get("SERVICE_NAME", "studytrack") != "studytrack" or env.get("MIGRATE_JOB_NAME", "studytrack-migrate") != "studytrack-migrate":
        raise ReleaseError("Resource names differ from the reviewed StudyTrack contract.")
    if s["ROLLBACK"] == "true":
        if s["GITHUB_EVENT_NAME"] != "workflow_dispatch":
            raise ReleaseError("Rollback requires a main workflow_dispatch.")
    elif s["IMAGE_TAG"] != s["GITHUB_SHA"]:
        raise ReleaseError("A normal release must build the workflow's exact commit.")
    if command(["git", "rev-parse", "HEAD"], runner) != s["GITHUB_SHA"] or command(["git", "status", "--porcelain"], runner):
        raise ReleaseError("Release requires the clean checked-out workflow commit.")
    remote = command(["git", "ls-remote", "origin", "refs/heads/main"], runner).split()
    if remote != [s["GITHUB_SHA"], "refs/heads/main"]:
        raise ReleaseError("Main advanced; release the current reviewed main instead.")
    if s["ROLLBACK"] == "true":
        command(["git", "merge-base", "--is-ancestor", s["IMAGE_TAG"], s["GITHUB_SHA"]], runner)
    return s


def container_env(container):
    values = container.get("env", [])
    result = {entry["name"]: entry for entry in values}
    if len(result) != len(values):
        raise ReleaseError("Duplicate container environment setting.")
    return result


def database_ref(values):
    ref = values.get("DATABASE_URL", {}).get("valueFrom", {}).get("secretKeyRef", {})
    if ("value" in values.get("DATABASE_URL", {}) or ref.get("name") != "studytrack-database-url" or
            not re.fullmatch(r"[1-9][0-9]*|latest", str(ref.get("key", "")))):
        raise ReleaseError("Unexpected database secret binding; review existing configuration.")
    return ref


def service_config(resource, s):
    try:
        template = resource["spec"]["template"]
        spec = template["spec"]
        containers = spec["containers"]
        if len(containers) != 1:
            raise ReleaseError("The reviewed service has one container.")
        values = container_env(containers[0])
        origin = values.get("APP_ORIGIN", {}).get("value", "")
        parsed = urlsplit(origin)
        if (spec.get("serviceAccountName") != f"studytrack-runner@{s['PROJECT_ID']}.iam.gserviceaccount.com" or
                template.get("metadata", {}).get("annotations", {}).get("run.googleapis.com/cloudsql-instances") !=
                f"{s['PROJECT_ID']}:{s['REGION']}:studytrack-pg" or
                values.get("NODE_ENV", {}).get("value") != "production" or
                any(key.startswith("SEED_") for key in values) or
                not re.fullmatch(r"https://studytrack-[a-z0-9.-]+\.run\.app", origin) or
                parsed.scheme != "https" or not parsed.hostname or not parsed.hostname.startswith("studytrack-") or
                not parsed.hostname.endswith(".run.app") or parsed.username or parsed.password or parsed.port or
                parsed.path or parsed.query or parsed.fragment):
            raise ReleaseError("Existing runtime identity, origin or database attachment differs from the contract.")
        database_ref(values)
        return origin, values
    except (KeyError, TypeError, ValueError) as error:
        raise ReleaseError("Unexpected existing service configuration.") from error


def platform_image(runtime, s, env, runner):
    """Resolve only the pinned index's unique linux/amd64 manifest, never a tag."""
    token = env.get("CLOUDSDK_AUTH_ACCESS_TOKEN") or command(
        ["gcloud", "auth", "print-access-token"], runner)
    if not token or "\n" in token or "\r" in token:
        raise ReleaseError("Could not obtain the registry read credential.")
    image_id = quote(runtime.rsplit("/", 1)[1], safe="")
    url = ("https://artifactregistry.googleapis.com/v1/"
           f"projects/{s['PROJECT_ID']}/locations/{s['REGION']}/"
           f"repositories/studytrack/dockerImages/{image_id}")
    request = Request(url, headers={"Authorization": "Bearer " + token})
    try:
        with urlopen(request, timeout=30) as response:
            image = json.load(response)
    except (URLError, OSError, ValueError) as error:
        # Neither the token nor arbitrary HTTP response bodies belong in logs.
        raise ReleaseError("Could not read pinned runtime image metadata; no cloud updates made.") from error
    if not isinstance(image, dict) or image.get("uri") != runtime:
        raise ReleaseError("Registry metadata does not identify the pinned runtime image.")
    media_type = image.get("mediaType")
    if media_type in ("application/vnd.oci.image.manifest.v1+json",
                      "application/vnd.docker.distribution.manifest.v2+json"):
        return runtime
    if media_type not in ("application/vnd.oci.image.index.v1+json",
                          "application/vnd.docker.distribution.manifest.list.v2+json"):
        raise ReleaseError("Unsupported runtime manifest type; no cloud updates made.")
    manifests = image.get("imageManifests")
    if not isinstance(manifests, list) or any(not isinstance(item, dict) for item in manifests):
        raise ReleaseError("Runtime index has no verifiable platform manifests.")
    candidates = [item for item in manifests
                  if item.get("os") == "linux" and item.get("architecture") == "amd64"]
    if (len(candidates) != 1 or
            not isinstance(candidates[0].get("digest"), str) or
            not re.fullmatch(r"sha256:[0-9a-f]{64}", candidates[0]["digest"])):
        raise ReleaseError("Runtime index must identify exactly one linux/amd64 digest.")
    return runtime.split("@", 1)[0] + "@" + candidates[0]["digest"]


def execute(env, runner):
    s = settings(env, runner)
    common = [f"--project={s['PROJECT_ID']}", f"--region={s['REGION']}", "--quiet"]
    registry = f"{s['REGION']}-docker.pkg.dev/{s['PROJECT_ID']}/studytrack"

    def cloud(parts):
        raw = command(["gcloud", *parts, *common, "--format=json"], runner)
        try:
            return json.loads(raw)
        except ValueError as error:
            raise ReleaseError("Cloud command returned an invalid JSON result.") from error

    def digest(image):
        value = command(["gcloud", "artifacts", "docker", "images", "describe",
                         f"{registry}/{image}:{s['IMAGE_TAG']}", f"--project={s['PROJECT_ID']}",
                         "--format=value(image_summary.fully_qualified_digest)"], runner)
        if not re.fullmatch(re.escape(f"{registry}/{image}@sha256:") + r"[0-9a-f]{64}", value):
            raise ReleaseError("An image is missing or its immutable repository/digest differs from the contract.")
        return value

    runtime = digest("studytrack")
    tools = digest("studytrack-tools") if s["ROLLBACK"] == "false" else "not-used"
    resolved_runtime = platform_image(runtime, s, env, runner)
    # Cloud Run may retain the index in spec or normalize it to its platform image.
    expected_images = (runtime, resolved_runtime)
    before = cloud(["run", "services", "describe", "studytrack"])
    origin, values = service_config(before, s)
    if s["ROLLBACK"] == "false":
        job = cloud(["run", "jobs", "describe", "studytrack-migrate"])
        try:
            job_template = job["spec"]["template"]
            task = job_template["spec"]["template"]["spec"]
            if (task.get("serviceAccountName") != f"studytrack-migrator@{s['PROJECT_ID']}.iam.gserviceaccount.com" or
                    job_template.get("metadata", {}).get("annotations", {}).get("run.googleapis.com/cloudsql-instances") !=
                    f"{s['PROJECT_ID']}:{s['REGION']}:studytrack-pg" or
                    len(task["containers"]) != 1 or
                    database_ref(container_env(task["containers"][0])) != database_ref(values)):
                raise ReleaseError("Migration identity/database differs from the serving configuration.")
        except (KeyError, TypeError) as error:
            raise ReleaseError("Unexpected existing migration job configuration.") from error
        cloud(["run", "jobs", "update", "studytrack-migrate", f"--image={tools}",
               "--command=npm", "--args=run,db:migrate"])
        execution = cloud(["run", "jobs", "execute", "studytrack-migrate", "--wait"])
        execution_name = execution.get("metadata", {}).get("name") or execution.get("name", "")
        execution_name = execution_name.split("/")[-1]
        if not re.fullmatch(r"studytrack-migrate-[a-z0-9-]+", execution_name):
            raise ReleaseError("Waited migration did not return an identifiable execution.")
    else:
        execution_name = "skipped-rollback"

    suffix = f"g{s['IMAGE_TAG'][:12]}-r{s['GITHUB_RUN_ID']}-{s['GITHUB_RUN_ATTEMPT']}"
    revision_name = "studytrack-" + suffix
    cloud(["run", "services", "update", "studytrack", f"--image={runtime}",
           f"--revision-suffix={suffix}", "--no-traffic"])
    revision = cloud(["run", "revisions", "describe", revision_name])
    try:
        ready = any(x.get("type") == "Ready" and str(x.get("status")).lower() == "true"
                    for x in revision.get("status", {}).get("conditions", []))
        if (not ready or revision["metadata"]["name"].split("/")[-1] != revision_name or
                len(revision["spec"]["containers"]) != 1 or
                revision["spec"]["containers"][0]["image"] not in expected_images or
                revision["status"].get("imageDigest") != resolved_runtime):
            raise ReleaseError("Created revision is not Ready with the expected immutable image; traffic unchanged.")
    except (KeyError, TypeError) as error:
        raise ReleaseError("Could not verify the created revision; traffic unchanged.") from error
    cloud(["run", "services", "update-traffic", "studytrack", f"--to-revisions={revision_name}=100"])
    after = cloud(["run", "services", "describe", "studytrack"])
    after_origin, after_values = service_config(after, s)
    traffic = [x for x in after.get("status", {}).get("traffic", []) if x.get("percent", 0)]
    if (after_origin != origin or after_values != values or len(traffic) != 1 or
            traffic[0].get("revisionName") != revision_name or traffic[0].get("percent") != 100 or
            after["spec"]["template"]["spec"]["containers"][0]["image"] not in expected_images):
        raise ReleaseError("Serving traffic/image/configuration does not match this release; success not recorded.")
    return {"SERVICE_URL": origin, "DEPLOYED_IMAGE": runtime,
            "DEPLOYED_PLATFORM_IMAGE": resolved_runtime, "TOOLS_IMAGE": tools,
            "DEPLOYED_REVISION": revision_name, "MIGRATION_EXECUTION": execution_name,
            "RELEASE_SOURCE_SHA": s["IMAGE_TAG"], "WORKFLOW_SOURCE_SHA": s["GITHUB_SHA"],
            "RELEASE_ROLLBACK": s["ROLLBACK"]}


def main():
    if sys.argv[1:] == ["--validate-only"]:
        settings(os.environ, subprocess.run)
        print("Release settings and current main validated; no cloud call made.")
    elif sys.argv[1:]:
        raise ReleaseError("Usage: python3 deploy/release.py [--validate-only]")
    else:
        result = execute(os.environ, subprocess.run)
        if os.environ.get("GITHUB_ENV"):
            with Path(os.environ["GITHUB_ENV"]).open("a", encoding="utf-8") as target:
                target.write("".join(f"{key}={value}\n" for key, value in result.items()))
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    try:
        main()
    except ReleaseError as error:
        sys.exit(str(error))
