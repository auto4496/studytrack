"""Exercise actual release orchestration against a stateful command double."""

import copy
import io
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from urllib.error import HTTPError, URLError
from unittest.mock import patch

from deploy import release

SHA = "1" * 40
OLD_SHA = "2" * 40
REGISTRY = "asia-southeast1-docker.pkg.dev/studytrack-cpe334/studytrack"
RUNTIME = REGISTRY + "/studytrack@sha256:" + "a" * 64
TOOLS = REGISTRY + "/studytrack-tools@sha256:" + "b" * 64
PLATFORM = REGISTRY + "/studytrack@sha256:" + "c" * 64
ATTESTATION = "sha256:" + "d" * 64
ORIGIN = "https://studytrack-123456789012.asia-southeast1.run.app"
ENV = {
    "PROJECT_ID": "studytrack-cpe334", "REGION": "asia-southeast1",
    "IMAGE_TAG": SHA, "ROLLBACK": "false", "GITHUB_SHA": SHA,
    "GITHUB_REF": "refs/heads/main", "GITHUB_EVENT_NAME": "push",
    "GITHUB_RUN_ID": "12345", "GITHUB_RUN_ATTEMPT": "1",
    "WIF_PROVIDER": "projects/123456789012/locations/global/workloadIdentityPools/github-actions/providers/github-main",
    "WIF_SERVICE_ACCOUNT": "studytrack-deployer@studytrack-cpe334.iam.gserviceaccount.com",
}


def secret():
    return {"name": "DATABASE_URL", "valueFrom": {"secretKeyRef": {
        "name": "studytrack-database-url", "key": "1"}}}


class Cloud:
    def __init__(self):
        self.calls = []
        self.fail = None
        self.dirty = False
        self.stale = False
        self.ancestor = True
        self.runtime = RUNTIME
        self.tools = TOOLS
        self.ready = True
        self.revision_image = RUNTIME
        self.resolved_image = RUNTIME
        self.service_image = RUNTIME
        self.revision_count = 1
        self.revision_name_override = None
        self.metadata = {"uri": RUNTIME, "mediaType": "application/vnd.oci.image.manifest.v1+json"}
        self.http_calls = []
        self.http_error = None
        self.traffic_percent = 100
        self.service = {"spec": {"template": {"metadata": {"annotations": {
            "run.googleapis.com/cloudsql-instances": "studytrack-cpe334:asia-southeast1:studytrack-pg"}},
            "spec": {"serviceAccountName": "studytrack-runner@studytrack-cpe334.iam.gserviceaccount.com",
                     "containers": [{"image": "old", "env": [secret(),
                         {"name": "APP_ORIGIN", "value": ORIGIN},
                         {"name": "NODE_ENV", "value": "production"}]}]}}},
            "status": {"url": "https://different-canonical-url.run.app"}}
        self.job = {"spec": {"template": {"spec": {"template": {"spec": {
            "serviceAccountName": "studytrack-migrator@studytrack-cpe334.iam.gserviceaccount.com",
            "containers": [{"env": [secret()]}]}}}}}}
        self.job["spec"]["template"]["metadata"] = {"annotations": {
            "run.googleapis.com/cloudsql-instances": "studytrack-cpe334:asia-southeast1:studytrack-pg"}}
        self.revision = None
        self.after_env_drift = False

    def run(self, args, **kwargs):
        self.calls.append(args)
        if self.fail and args[1:1 + len(self.fail)] == self.fail:
            return subprocess.CompletedProcess(args, 1, "", "fixture failure")
        text = "{}"
        if args[0] == "git":
            if args[1:3] == ["rev-parse", "HEAD"]:
                text = SHA
            elif args[1:3] == ["status", "--porcelain"]:
                text = " M tracked-file" if self.dirty else ""
            elif args[1:3] == ["ls-remote", "origin"]:
                text = (OLD_SHA if self.stale else SHA) + "\trefs/heads/main"
            elif args[1] == "merge-base":
                return subprocess.CompletedProcess(args, 0 if self.ancestor else 1, "", "")
            else:
                raise AssertionError(args)
        elif args[1:5] == ["artifacts", "docker", "images", "describe"]:
            text = self.tools if "/studytrack-tools:" in args[5] else self.runtime
        elif args[1:3] == ["auth", "print-access-token"]:
            text = "fixture-token"
        elif args[1:4] == ["run", "jobs", "describe"]:
            text = json.dumps(self.job)
        elif args[1:4] == ["run", "jobs", "execute"]:
            text = json.dumps({"metadata": {"name": "studytrack-migrate-fixture"}})
        elif args[1:4] == ["run", "services", "update"]:
            self.revision = "studytrack-" + next(x.split("=", 1)[1] for x in args if x.startswith("--revision-suffix="))
            self.service["spec"]["template"]["spec"]["containers"][0]["image"] = self.service_image
        elif args[1:4] == ["run", "services", "describe"]:
            state = copy.deepcopy(self.service)
            if self.revision:
                state["status"]["latestReadyRevisionName"] = self.revision
                state["status"]["traffic"] = [{"revisionName": self.revision, "percent": self.traffic_percent}]
                if self.after_env_drift:
                    state["spec"]["template"]["spec"]["containers"][0]["env"][1]["value"] = "https://changed.run.app"
            text = json.dumps(state)
        elif args[1:4] == ["run", "revisions", "describe"]:
            text = json.dumps({"metadata": {"name": self.revision_name_override or self.revision},
                "spec": {"containers": [{"image": self.revision_image}] * self.revision_count},
                "status": {"imageDigest": self.resolved_image,
                           "conditions": [{"type": "Ready", "status": "True" if self.ready else "False"}]}})
        elif args[1:4] not in (["run", "jobs", "update"], ["run", "services", "update-traffic"]):
            raise AssertionError(args)
        return subprocess.CompletedProcess(args, 0, text, "")

    def open(self, request, **kwargs):
        if self.writes():
            raise AssertionError("Registry lineage must be read before any cloud update")
        self.http_calls.append((request, kwargs))
        if self.http_error:
            raise self.http_error
        return io.BytesIO(json.dumps(self.metadata).encode())

    def use_index(self, media_type="application/vnd.oci.image.index.v1+json"):
        self.metadata = {"uri": RUNTIME, "mediaType": media_type, "imageManifests": [
            {"os": "linux", "architecture": "amd64", "digest": PLATFORM.split("@", 1)[1]},
            {"os": "unknown", "architecture": "unknown", "digest": ATTESTATION},
        ]}
        self.revision_image = PLATFORM
        self.resolved_image = PLATFORM

    def operations(self):
        return [x[1:4] for x in self.calls if x[0] == "gcloud"]

    def writes(self):
        return [x for x in self.calls if x[0] == "gcloud" and
                x[1:4] in (["run", "jobs", "update"], ["run", "jobs", "execute"],
                            ["run", "services", "update"], ["run", "services", "update-traffic"])]


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.cloud = Cloud()
        opener = patch.object(release, "urlopen", side_effect=lambda *a, **kw: self.cloud.open(*a, **kw))
        opener.start()
        self.addCleanup(opener.stop)

    def run_release(self, **changes):
        return release.execute({**ENV, **changes}, self.cloud.run)

    def test_normal_migrates_tools_before_traffic(self):
        result = self.run_release()
        ops = self.cloud.operations()
        self.assertIn(["run", "jobs", "execute"], ops)
        self.assertLess(ops.index(["run", "jobs", "execute"]), ops.index(["run", "services", "update"]))
        self.assertLess(ops.index(["run", "revisions", "describe"]), ops.index(["run", "services", "update-traffic"]))
        job = next(x for x in self.cloud.writes() if x[1:4] == ["run", "jobs", "update"])
        self.assertIn("--image=" + TOOLS, job)
        self.assertIn("--command=npm", job)
        self.assertIn("--args=run,db:migrate", job)
        execute = next(x for x in self.cloud.writes() if x[1:4] == ["run", "jobs", "execute"])
        self.assertIn("--wait", execute)
        service = next(x for x in self.cloud.writes() if x[1:4] == ["run", "services", "update"])
        self.assertIn("--image=" + RUNTIME, service)
        self.assertIn("--no-traffic", service)
        traffic = next(x for x in self.cloud.writes() if x[1:4] == ["run", "services", "update-traffic"])
        self.assertIn("--to-revisions=" + self.cloud.revision + "=100", traffic)
        self.assertEqual(result["SERVICE_URL"], ORIGIN)
        self.assertEqual(result["DEPLOYED_IMAGE"], RUNTIME)
        self.assertEqual(result["DEPLOYED_PLATFORM_IMAGE"], RUNTIME)
        self.assertEqual(result["TOOLS_IMAGE"], TOOLS)
        self.assertEqual(result["DEPLOYED_REVISION"], self.cloud.revision)
        self.assertEqual(result["MIGRATION_EXECUTION"], "studytrack-migrate-fixture")

    def test_rollback_reuses_image_without_tools_or_jobs(self):
        result = self.run_release(ROLLBACK="true", IMAGE_TAG=OLD_SHA, GITHUB_EVENT_NAME="workflow_dispatch")
        self.assertIn(["run", "services", "update"], self.cloud.operations())
        self.assertFalse(any(x[1:3] == ["run", "jobs"] for x in self.cloud.calls))
        self.assertFalse(any("/studytrack-tools:" in " ".join(x) for x in self.cloud.calls))
        self.assertEqual(result["RELEASE_SOURCE_SHA"], OLD_SHA)
        self.assertEqual(result["WORKFLOW_SOURCE_SHA"], SHA)

    def test_index_platform_resolution_and_attestation_for_normal_and_rollback(self):
        for media_type in ("application/vnd.oci.image.index.v1+json",
                           "application/vnd.docker.distribution.manifest.list.v2+json"):
            for rollback in (False, True):
                for spec_image in (RUNTIME, PLATFORM):
                    with self.subTest(media_type=media_type, rollback=rollback, spec_image=spec_image):
                        self.cloud = Cloud()
                        self.cloud.use_index(media_type)
                        self.cloud.revision_image = spec_image
                        self.cloud.service_image = spec_image
                        changes = ({"ROLLBACK": "true", "IMAGE_TAG": OLD_SHA,
                                    "GITHUB_EVENT_NAME": "workflow_dispatch"} if rollback else {})
                        result = self.run_release(**changes)
                        self.assertEqual(result["DEPLOYED_IMAGE"], RUNTIME)
                        self.assertEqual(result["DEPLOYED_PLATFORM_IMAGE"], PLATFORM)
                        self.assertEqual(len(self.cloud.http_calls), 1)
                        update = next(x for x in self.cloud.writes() if x[1:4] == ["run", "services", "update"])
                        self.assertIn("--image=" + RUNTIME, update)
                        self.assertIn(["run", "services", "update-traffic"], self.cloud.operations())
                        if rollback:
                            self.assertFalse(any(x[1:3] == ["run", "jobs"] for x in self.cloud.calls))

    def test_docker_single_manifest_remains_supported(self):
        self.cloud.metadata["mediaType"] = "application/vnd.docker.distribution.manifest.v2+json"
        self.assertEqual(self.run_release()["DEPLOYED_PLATFORM_IMAGE"], RUNTIME)

    def test_registry_get_is_pinned_and_uses_existing_workflow_token(self):
        result = self.run_release(CLOUDSDK_AUTH_ACCESS_TOKEN="fixture-workflow-token")
        request, options = self.cloud.http_calls[0]
        self.assertEqual(request.get_method(), "GET")
        self.assertEqual(request.full_url, "https://artifactregistry.googleapis.com/v1/"
                         "projects/studytrack-cpe334/locations/asia-southeast1/"
                         "repositories/studytrack/dockerImages/studytrack%40sha256%3A" + "a" * 64)
        self.assertEqual(request.get_header("Authorization"), "Bearer fixture-workflow-token")
        self.assertEqual(options, {"timeout": 30})
        self.assertNotIn(["auth", "print-access-token"], self.cloud.operations())
        self.assertNotIn("fixture-workflow-token", json.dumps(result))

    def test_registry_read_failures_never_write_or_expose_response(self):
        errors = [HTTPError("https://artifactregistry.googleapis.com", 403,
                            "PRIVATE_TOKEN_BODY", {}, io.BytesIO(b"PRIVATE_TOKEN_BODY")),
                  URLError("PRIVATE_TOKEN_BODY"), TimeoutError("PRIVATE_TOKEN_BODY"),
                  ValueError("PRIVATE_TOKEN_BODY")]
        for error in errors:
            with self.subTest(error=type(error).__name__):
                self.cloud = Cloud()
                self.cloud.http_error = error
                with self.assertRaises(release.ReleaseError) as raised:
                    self.run_release()
                self.assertNotIn("PRIVATE_", str(raised.exception))
                self.assertEqual(self.cloud.writes(), [])

    def test_unverifiable_metadata_never_writes(self):
        invalid_metadata = [None, [], {}, {"uri": TOOLS},
                            {"uri": RUNTIME, "mediaType": "unknown"}]
        for manifests in (None, {}, [], [None],
                          [{"os": "linux", "architecture": "arm64", "digest": "sha256:" + "c" * 64}],
                          [{"os": "unknown", "architecture": "unknown", "digest": ATTESTATION}],
                          [{"os": "linux", "architecture": "amd64", "digest": "not-a-digest"}],
                          [{"os": "linux", "architecture": "amd64", "digest": None}],
                          [{"os": "linux", "architecture": "amd64", "digest": PLATFORM}],
                          [{"os": "linux", "architecture": "amd64", "digest": "sha256:" + "c" * 64}] * 2):
            invalid_metadata.append({"uri": RUNTIME, "mediaType": "application/vnd.oci.image.index.v1+json",
                                     "imageManifests": manifests})
        for metadata in invalid_metadata:
            with self.subTest(metadata=metadata):
                self.cloud = Cloud()
                self.cloud.metadata = metadata
                with self.assertRaises(release.ReleaseError):
                    self.run_release()
                self.assertEqual(self.cloud.writes(), [])

    def test_registry_invalid_json_never_writes(self):
        with patch.object(release, "urlopen", return_value=io.BytesIO(b"not-json")):
            with self.assertRaises(release.ReleaseError):
                self.run_release()
        self.assertEqual(self.cloud.writes(), [])

    def test_registry_credential_failure_never_writes(self):
        self.cloud.fail = ["auth", "print-access-token"]
        with self.assertRaises(release.ReleaseError):
            self.run_release()
        self.assertEqual(self.cloud.http_calls, [])
        self.assertEqual(self.cloud.writes(), [])

    def test_invalid_registry_token_never_sends_request(self):
        with self.assertRaises(release.ReleaseError):
            self.run_release(CLOUDSDK_AUTH_ACCESS_TOKEN="fixture-token\nINJECT=x")
        self.assertEqual(self.cloud.http_calls, [])
        self.assertEqual(self.cloud.writes(), [])

    def test_index_never_accepts_unrelated_cross_repository_or_attestation_image(self):
        for image in (TOOLS, PLATFORM.replace("studytrack-cpe334", "another-project"),
                      REGISTRY + "/studytrack@" + ATTESTATION,
                      REGISTRY + "/studytrack@sha256:" + "e" * 64):
            for field in ("revision_image", "resolved_image"):
                with self.subTest(image=image, field=field):
                    self.cloud = Cloud()
                    self.cloud.use_index()
                    setattr(self.cloud, field, image)
                    with self.assertRaises(release.ReleaseError):
                        self.run_release()
                    self.assertNotIn(["run", "services", "update-traffic"], self.cloud.operations())

    def test_index_digest_alone_is_not_proof_of_resolved_platform(self):
        for image in (RUNTIME, None, ""):
            with self.subTest(image=image):
                self.cloud = Cloud()
                self.cloud.use_index()
                self.cloud.resolved_image = image
                with self.assertRaises(release.ReleaseError):
                    self.run_release()
                self.assertNotIn(["run", "services", "update-traffic"], self.cloud.operations())

    def test_revision_name_count_and_ready_guards_still_apply_to_index(self):
        for field, value in (("ready", False), ("revision_count", 0), ("revision_count", 2),
                             ("revision_name_override", "studytrack-wrong-revision")):
            with self.subTest(field=field, value=value):
                self.cloud = Cloud()
                self.cloud.use_index()
                setattr(self.cloud, field, value)
                with self.assertRaises(release.ReleaseError):
                    self.run_release()
                self.assertNotIn(["run", "services", "update-traffic"], self.cloud.operations())

    def test_post_update_unrelated_image_does_not_report_success(self):
        self.cloud.use_index()
        self.cloud.service_image = TOOLS
        with self.assertRaises(release.ReleaseError):
            self.run_release()

    def test_invalid_tag_stops_before_any_command(self):
        with self.assertRaises(release.ReleaseError):
            self.run_release(IMAGE_TAG="bad;tag")
        self.assertEqual(self.cloud.calls, [])

    def test_untrusted_settings_and_non_main_context_never_call_cloud(self):
        changes = [
            {"PROJECT_ID": "bad;project"}, {"REGION": "bad\nregion"},
            {"IMAGE_TAG": "A" * 40}, {"GITHUB_SHA": "bad"},
            {"GITHUB_REF": "refs/heads/feature/test"}, {"GITHUB_EVENT_NAME": "pull_request"},
            {"GITHUB_RUN_ID": "1\nINJECT=x"}, {"GITHUB_RUN_ATTEMPT": "-1"},
            {"ROLLBACK": "maybe"}, {"IMAGE_TAG": OLD_SHA},
            {"ROLLBACK": "true"}, {"SERVICE_NAME": "other-service"},
            {"WIF_PROVIDER": "projects/1/locations/global/workloadIdentityPools/other/providers/provider"},
            {"WIF_SERVICE_ACCOUNT": "owner@studytrack-cpe334.iam.gserviceaccount.com"},
        ]
        for change in changes:
            with self.subTest(change=change):
                self.cloud = Cloud()
                with self.assertRaises(release.ReleaseError):
                    self.run_release(**change)
                self.assertEqual(self.cloud.calls, [])

    def test_dirty_stale_and_non_ancestor_sources_stop_before_cloud(self):
        for mode in ("dirty", "stale", "ancestor"):
            with self.subTest(mode=mode):
                self.cloud = Cloud()
                setattr(self.cloud, mode, mode != "ancestor")
                with self.assertRaises(release.ReleaseError):
                    self.run_release(ROLLBACK="true", IMAGE_TAG=OLD_SHA, GITHUB_EVENT_NAME="workflow_dispatch")
                self.assertFalse(any(x[0] == "gcloud" for x in self.cloud.calls))

    def test_missing_or_cross_repository_digest_never_writes(self):
        for field in ("runtime", "tools"):
            for invalid in ("", "not-a-digest", RUNTIME.replace("studytrack-cpe334", "another-project"), RUNTIME[:-1]):
                with self.subTest(field=field, invalid=invalid):
                    self.cloud = Cloud()
                    setattr(self.cloud, field, invalid)
                    with self.assertRaises(release.ReleaseError):
                        self.run_release()
                    self.assertEqual(self.cloud.writes(), [])

    def test_existing_configuration_drift_stops_before_any_write(self):
        for change in ("runtime-account", "database", "origin", "origin-newline", "seed-runtime", "job-account", "job-database", "job-sql"):
            with self.subTest(change=change):
                self.cloud = Cloud()
                spec = self.cloud.service["spec"]["template"]["spec"]
                job = self.cloud.job["spec"]["template"]["spec"]["template"]["spec"]
                if change == "job-sql":
                    self.cloud.job["spec"]["template"]["metadata"]["annotations"] = {}
                if change == "runtime-account":
                    spec["serviceAccountName"] = "wrong-account"
                elif change == "database":
                    spec["containers"][0]["env"][0] = {"name": "DATABASE_URL", "value": "PRIVATE_DATABASE_VALUE"}
                elif change == "origin":
                    spec["containers"][0]["env"][1]["value"] = "http://localhost:3000"
                elif change == "origin-newline":
                    spec["containers"][0]["env"][1]["value"] = ORIGIN + "\nINJECT=x"
                elif change == "seed-runtime":
                    spec["containers"][0]["env"].append({"name": "SEED_MANAGER_PASSWORD", "value": "PRIVATE_SEED_VALUE"})
                elif change == "job-account":
                    job["serviceAccountName"] = "wrong-account"
                elif change == "job-database":
                    job["containers"][0]["env"][0]["valueFrom"]["secretKeyRef"]["key"] = "2"
                with self.assertRaises(release.ReleaseError) as raised:
                    self.run_release()
                self.assertNotIn("PRIVATE_", str(raised.exception))
                self.assertEqual(self.cloud.writes(), [])

    def test_job_update_or_migration_failure_never_updates_service(self):
        for operation in (["run", "jobs", "update"], ["run", "jobs", "execute"]):
            with self.subTest(operation=operation):
                self.cloud = Cloud()
                self.cloud.fail = operation
                with self.assertRaises(release.ReleaseError):
                    self.run_release()
                self.assertNotIn(["run", "services", "update"], self.cloud.operations())

    def test_unready_or_wrong_digest_revision_never_switches_traffic(self):
        for mode in ("unready", "digest", "read-failure", "service-update-failure"):
            with self.subTest(mode=mode):
                self.cloud = Cloud()
                if mode == "unready":
                    self.cloud.ready = False
                elif mode == "digest":
                    self.cloud.revision_image = TOOLS
                else:
                    self.cloud.fail = ["run", "revisions", "describe"] if mode == "read-failure" else ["run", "services", "update"]
                with self.assertRaises(release.ReleaseError):
                    self.run_release()
                self.assertNotIn(["run", "services", "update-traffic"], self.cloud.operations())

    def test_traffic_or_post_update_drift_never_reports_success(self):
        for mode in ("traffic-failure", "percent", "environment"):
            with self.subTest(mode=mode):
                self.cloud = Cloud()
                if mode == "traffic-failure":
                    self.cloud.fail = ["run", "services", "update-traffic"]
                elif mode == "percent":
                    self.cloud.traffic_percent = 50
                else:
                    self.cloud.after_env_drift = True
                with self.assertRaises(release.ReleaseError):
                    self.run_release()

    def test_only_reviewed_update_operations_and_no_config_reset_flags(self):
        self.run_release()
        allowed = {("artifacts", "docker", "images"), ("auth", "print-access-token"), ("run", "services", "describe"),
                   ("run", "jobs", "describe"), ("run", "jobs", "update"),
                   ("run", "jobs", "execute"), ("run", "services", "update"),
                   ("run", "revisions", "describe"), ("run", "services", "update-traffic")}
        for args in self.cloud.calls:
            if args[0] == "gcloud":
                self.assertIn(tuple(args[1:4]), allowed)
                self.assertFalse(any(x.startswith(("--set-env", "--set-secret", "--allow-unauthenticated", "--service-account")) for x in args))
                self.assertNotIn("seed", " ".join(args))

    def test_validate_only_never_calls_cloud(self):
        release.settings(ENV, self.cloud.run)
        self.assertFalse(any(x[0] == "gcloud" for x in self.cloud.calls))

    def test_environment_export_happens_only_after_success(self):
        for failure in (False, True):
            with self.subTest(failure=failure), tempfile.TemporaryDirectory() as directory:
                self.cloud = Cloud()
                if failure:
                    self.cloud.fail = ["run", "jobs", "execute"]
                output = Path(directory) / "github-env"
                with (patch.dict(release.os.environ, {**ENV, "GITHUB_ENV": str(output)}, clear=True),
                      patch.object(release.sys, "argv", ["release.py"]),
                      patch.object(release.subprocess, "run", self.cloud.run)):
                    if failure:
                        with self.assertRaises(release.ReleaseError):
                            release.main()
                        self.assertFalse(output.exists())
                    else:
                        with patch("builtins.print"):
                            release.main()
                        text = output.read_text()
                        self.assertIn("DEPLOYED_REVISION=" + self.cloud.revision, text)
                        self.assertIn("SERVICE_URL=" + ORIGIN, text)
                        self.assertIn("RELEASE_SOURCE_SHA=" + SHA, text)
                        self.assertIn("DEPLOYED_PLATFORM_IMAGE=" + RUNTIME, text)
