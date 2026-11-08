"""Exercise the real shell entry point with local git/gcloud/password fixtures."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SHA = "1" * 40
PASSWORD = "0123456789abcdef" * 3
DB_URL = (
    f"postgresql://studytrack:{PASSWORD}@localhost/studytrack"
    "?host=/cloudsql/studytrack-cpe334:asia-southeast1:studytrack-pg"
    "&schema=public&connection_limit=3"
)


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="studytrack-bootstrap-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.state_file = self.root / "state.json"
        self.save({"accounts": [], "users": {}, "secrets": {}})
        self.env = {
            **os.environ,
            "PATH": str(self.bin) + os.pathsep + os.environ["PATH"],
            "PROJECT_ID": "studytrack-cpe334",
            "REGION": "asia-southeast1",
            "SQL_TIER": "db-f1-micro",
            "DRY_RUN": "0",
            "TEST_STATE": str(self.root),
            "TEST_BIN": str(self.bin),
            "TEST_PYTHON": sys.executable,
            "TEST_STUB": str(Path(__file__).with_name("gcloud_stub.py").resolve()),
            "MSYS2_ARG_CONV_EXCL": "*",
        }
        self.wrapper("gcloud", 'exec "$TEST_PYTHON" "$TEST_STUB" "$@"')
        self.wrapper("openssl", f"printf '%s\\n' '{PASSWORD}'")
        self.wrapper("git", f"""
case "$1 $2" in
  'rev-parse HEAD') printf '%s\\n' '{SHA}' ;;
  'branch --show-current') printf '%s\\n' "${{TEST_BRANCH:-main}}" ;;
  'status --porcelain') printf '%s' "${{TEST_DIRTY:-}}" ;;
  'ls-remote origin') printf '%s\\trefs/heads/main\\n' "${{TEST_REMOTE_SHA:-{SHA}}}" ;;
  *) exit 2 ;;
esac
""")
        self.wrapper("python3", """
if [[ "$1" == deploy/smoke_test.py ]]; then
  exec "$TEST_PYTHON" "$TEST_STUB" --smoke "$@"
fi
exec "$TEST_PYTHON" "$@"
""")

    def wrapper(self, name, body):
        path = self.bin / name
        path.write_text("#!/bin/bash\nset -eu\n" + body + "\n", newline="\n")
        path.chmod(0o755)

    def save(self, state):
        self.state_file.write_text(json.dumps(state))

    def state(self):
        return json.loads(self.state_file.read_text())

    def calls(self):
        path = self.root / "calls.jsonl"
        return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []

    def run_deploy(self, expected=0, **overrides):
        # Git Bash's Windows launcher prepends its own git before inherited PATH.
        # Install the offline fixtures after the launcher initializes the shell.
        command = '''
fixture_bin="$TEST_BIN"
if command -v cygpath >/dev/null; then fixture_bin="$(cygpath -u "$fixture_bin")"; fi
export PATH="$fixture_bin:$PATH"
exec /bin/bash deploy/deploy.sh
'''
        result = subprocess.run(
            [os.environ.get("BASH", "bash"), "-c", command],
            cwd=ROOT, env={**self.env, **overrides}, capture_output=True, text=True, timeout=30,
        )
        self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
        self.assertNotIn(PASSWORD, result.stdout + result.stderr)
        self.assertNotIn(DB_URL, result.stdout + result.stderr)
        return result

    def test_dry_run_makes_no_gcloud_calls(self):
        result = self.run_deploy(DRY_RUN="1")
        self.assertEqual(self.calls(), [])
        self.assertIn("Dry-run plan complete", result.stdout)
        self.assertIn("--no-storage-auto-increase", result.stdout)

    def test_first_run_preserves_runtime_and_migration_boundaries(self):
        self.run_deploy()
        calls = self.calls()
        self.assertEqual(self.state()["users"]["studytrack"], PASSWORD)
        self.assertEqual(self.state()["secrets"]["studytrack-database-url"]["1"], DB_URL)
        build = next(call for call in calls if call[:2] == ["builds", "submit"])
        self.assertIn("--ignore-file=.dockerignore", build)
        sql = next(call for call in calls if call[:3] == ["sql", "instances", "create"])
        self.assertLess(calls.index(build), calls.index(sql))
        self.assertIn("--edition=enterprise", sql)
        self.assertIn("--database-version=POSTGRES_17", sql)
        self.assertIn("--no-storage-auto-increase", sql)
        service = next(call for call in calls if call[:2] == ["run", "deploy"])
        job = next(call for call in calls if call[:3] == ["run", "jobs", "deploy"])
        self.assertIn("--image=asia-southeast1-docker.pkg.dev/studytrack-cpe334/studytrack/studytrack@sha256:" + "a" * 64, service)
        self.assertIn("--image=asia-southeast1-docker.pkg.dev/studytrack-cpe334/studytrack/studytrack-tools@sha256:" + "a" * 64, job)
        self.assertIn("--set-secrets=DATABASE_URL=studytrack-database-url:1", service)
        self.assertIn("--port=8080", service)
        self.assertIn("APP_ORIGIN=https://studytrack-123456789012.asia-southeast1.run.app", " ".join(service))
        self.assertIn("SEED_MANAGER_PASSWORD=studytrack-manager-password:1", " ".join(job))
        self.assertIn("SEED_PARTICIPANT_PASSWORD=studytrack-participant-password:1", " ".join(job))
        self.assertNotIn("SEED_", " ".join(service))
        grants = [call for call in calls if call[:2] == ["secrets", "add-iam-policy-binding"]]
        self.assertEqual(len(grants), 4)
        self.assertFalse(any("roles/secretmanager.secretAccessor" in call for call in calls if call[:2] == ["projects", "add-iam-policy-binding"]))
        for grant in grants:
            if grant[2] != "studytrack-database-url":
                self.assertIn("--member=serviceAccount:studytrack-migrator@studytrack-cpe334.iam.gserviceaccount.com", grant)

    def test_rerun_preserves_credentials(self):
        self.run_deploy()
        original = self.state()
        count = len(self.calls())
        self.run_deploy()
        self.assertEqual(self.state(), original)
        for call in self.calls()[count:]:
            self.assertNotEqual(call[:2], ["secrets", "create"])
            self.assertNotIn(call[:3], (["sql", "users", "create"], ["sql", "users", "set-password"]))

    def test_retry_after_user_creation_failure_reuses_saved_password(self):
        self.run_deploy(expected=1, TEST_MODE="user-fail")
        self.assertEqual(self.state()["users"], {})
        self.assertIn("studytrack-database-url", self.state()["secrets"])
        self.run_deploy()
        self.assertEqual(self.state()["users"]["studytrack"], PASSWORD)

    def test_existing_user_without_secret_requires_recovery(self):
        state = self.state()
        state["users"]["studytrack"] = "existing-password"
        self.save(state)
        self.run_deploy(expected=1)
        self.assertEqual(self.state()["users"]["studytrack"], "existing-password")
        self.assertNotIn("studytrack-database-url", self.state()["secrets"])
        self.assertFalse(self.state().get("service"))

    def test_interrupted_empty_secret_requires_recovery(self):
        state = self.state()
        state["secrets"]["studytrack-database-url"] = {}
        self.save(state)
        self.run_deploy(expected=1)
        self.assertEqual(self.state()["secrets"]["studytrack-database-url"], {})
        self.assertEqual(self.state()["users"], {})

    def test_build_failure_stops_before_database_creation(self):
        self.run_deploy(expected=1, TEST_MODE="build-fail")
        self.assertFalse(self.state().get("instance"))
        self.assertFalse(self.state().get("service"))

    def test_missing_digest_stops_before_database_creation(self):
        self.run_deploy(expected=1, TEST_MODE="missing-image")
        self.assertFalse(self.state().get("instance"))

    def test_migration_failure_stops_before_service_update(self):
        self.run_deploy(expected=1, TEST_MODE="job-fail")
        self.assertFalse(self.state().get("service"))

    def test_wrong_existing_sql_settings_are_preserved_and_rejected(self):
        state = self.state()
        state["instance"] = "POSTGRES_17,asia-southeast1,ENTERPRISE,db-f1-micro,True"
        self.save(state)
        self.run_deploy(expected=1)
        self.assertEqual(self.state()["instance"], state["instance"])
        self.assertFalse(self.state().get("service"))

    def test_wrong_saved_connection_is_rejected_without_logging_value(self):
        state = self.state()
        wrong_url = DB_URL.replace("studytrack-cpe334:asia", "other-project:asia")
        state["secrets"]["studytrack-database-url"] = {"1": wrong_url}
        self.save(state)
        result = self.run_deploy(expected=1)
        self.assertNotIn(wrong_url, result.stdout + result.stderr)
        self.assertEqual(self.state()["users"], {})

    def test_release_and_billing_preconditions_block_cloud_mutations(self):
        for overrides in (
            {"TEST_BRANCH": "feature/bootstrap"},
            {"TEST_DIRTY": " M Dockerfile"},
            {"TEST_REMOTE_SHA": "2" * 40},
            {"TEST_MODE": "billing-off"},
            {"TEST_MODE": "wrong-project"},
        ):
            with self.subTest(overrides=overrides):
                self.run_deploy(expected=1, **overrides)
                self.assertFalse(self.state().get("repository"))
                self.assertFalse(self.state().get("instance"))

    def test_failed_public_smoke_fails_the_deployment_result(self):
        result = self.run_deploy(expected=1, TEST_MODE="smoke-fail")
        self.assertTrue(self.state()["service"])
        self.assertNotIn("Deployment complete", result.stdout)
