# EP7 implementation verification

12 November 2026, B / Datakung assisted by Codex. Base: accepted staging `86b0b3e222b364a7ad4e2ea2fae20ed7148073b2` (A-approved PR38); main is still `5c04cd4bf7a7a28ff5c429f3770efc42da6bd7e0`. [Contract/test plan](ep7-release-contract.md) was written before implementation; its inherited identity interface was accepted in PR34. A must review this new implementation before its protected staging acceptance and a separate main release.

## Actual local results

| Check | Observed result | Scope |
| --- | --- | --- |
| Initial release tests | 3 failed assertions | Scaffold `execute` returned `{}`: absent invalid-tag rejection, normal migration orchestration and rollback service update. These were behavior failures, not missing libraries. |
| Final offline suite | 29 passed, 0 failed/errors | Existing bootstrap/smoke plus13 release tests with multiple failure/configuration subcases. Command/HTTP fixtures only; public-health `PASS` lines in this log are simulated, not fresh cloud probes. |
| Workflow syntax | actionlint1.7.12 exit0 for all workflows | Official Windows amd64 release downloaded and checksum matched upstream; zip SHA256 `6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9`. Shellcheck was not installed, so Bash syntax was checked separately. |
| Shell and diff | Both scripts `bash -n` and `git diff --check` passed | Release wrapper/bootstrap syntax; credentials filename is Git-ignored and Docker build inputs remain allowlisted. |
| Docker/product regression | Not run locally | User reports Docker Desktop closed. Hosted CI must test API/browser/build and actually build both Docker targets on the submitted head. |
| Live EP7 | NOT_RUN | No WIF exchange, authenticated GCP command, migration, deployment, traffic switch, rollback or human domain acceptance was performed. |

Captured [initial red](../../../artifacts/evidence/lab5-cloud/ep7-offline/initial-red.txt), [final green](../../../artifacts/evidence/lab5-cloud/ep7-offline/final-green.txt), [static checks](../../../artifacts/evidence/lab5-cloud/ep7-offline/static-checks.txt), and [file hashes/provenance](../../../artifacts/evidence/lab5-cloud/ep7-offline/manifest.json) are retained. Text line endings are normalized to LF for Git; assertion/result text is unchanged and the original red-file hash is also retained. The original pre-implementation scaffold was not separately committed; the red log records its actual observed failures and is not presented as a reproducible committed red revision. The manifest identifies tested final file bytes rather than inventing an initial source hash.

During implementation the first JSON fake returned empty output for successful mutation commands; it was corrected to return valid JSON. An unprivileged Windows temporary-directory run then encountered filesystem permission errors; the suite was rerun with a writable task-specific temporary directory. Neither intermediate environment/fixture error is counted as the meaningful initial red or a passing test. actionlint found the existing numeric PostgreSQL port object key; both uses now use string key `'5432'` without changing the selected port.

## Behavior verified by the release tests

Normal release resolves both exact-repository digests, preserves APP_ORIGIN, checks runtime/migrator identity, database secret reference and Cloud SQL attachment, waits for migration-only execution before service update, creates a no-traffic revision, verifies Ready/digest, routes100% to the exact revision and checks serving configuration before exporting output. Rollback resolves runtime only, skips all job/tools/migration commands, validates the accepted-ancestor source and records target/workflow SHAs separately.

Negative cases cover invalid settings/main context, dirty/stale source and non-ancestor rollback before cloud access; missing/cross-repository digests and existing-resource drift before mutation; migration/update failures before service change; failed/unready/wrong-digest revision before traffic; failed/wrong traffic or post-update environment drift without recording success. Export values are constrained to safe identifiers/HTTPS origin and are written only after successful verification. Command output/configuration is not dumped on failures. The command allowlist assertions check that no bootstrap, IAM, secret payload, environment reset, public-IAM or seed operation is introduced.

Test command (repository root):

```text
python3 -B -m unittest discover -s deploy/tests -p 'test_*.py' -v
bash -n deploy/deploy.sh
bash -n deploy/release.sh
actionlint
git diff --check
```

Windows used Git Bash through `BASH`, bundled Python3.14 and a task-local TEMP/TMP directory. CI uses Ubuntu's installed Python/Bash; it does not depend on the local validator download. [Runbook](ep7-release.md) defines the remaining release A/B, Console and human evidence. Code/CI alone cannot close Issue22/23; [live record template](ep7-record.template.json) remains unexecuted.
