# EP7 release A: actual execution evidence

12 November 2026. B / Datakung assisted by Codex. [Issue22](https://github.com/auto4496/studytrack/issues/22) remains open. This records the first successful automated release A after the OCI correction; it does not complete the later visible-change release B, human domain acceptance or EP8.

## Accepted source and successful run

A independently approved correction PR45 at800d642, then separately approved release PR46 at25b97ae and merged it normally into main `3570cd4a7bca17567d30817565d5bb3aa107a672`. B fetched main and verified its full tree equals both reviewed sources: `3e76a55bfdac1ccd3c0ae7ecaa5cc551a98ffa23`. The [accepted PR/reviews](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/accepted-pr46.json) retain exact source, actor and links; [peer reviews](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/peer-reviews.json) retain the release approval.

Actual [Deploy demo43233683592, attempt1](https://github.com/auto4496/studytrack/actions/runs/43233683592) is SUCCESS on that main SHA. It completed at2026-11-12T14:11:33Z (21:11:33 Asia/Bangkok). B independently fetched the actual GitHub metadata/logs rather than relying solely on A's status message. [Run](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/run.json), [jobs/steps](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/jobs.json) and [CI excerpt](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/ci-summary-excerpt.txt) distinguish hosted41 offline/152 API-unit/38 browser checks and image builds from the real subsequent cloud operations.

| Field | Actual successful helper output |
| --- | --- |
| Source/workflow SHA | 3570cd4a7bca17567d30817565d5bb3aa107a672 |
| Runtime pinned index digest | sha256:3e4e18fd392de678076ebec06464a61eca4912b49f783a418c99abf3b3fb26a3 |
| Verified runtime platform digest | sha256:6127e4e53c2b9b8a747fd8af42216cb7879b4d5175c5f5178d4bc33f0bb18f7d |
| Tools digest | sha256:d827dc9492e3c01f7892ef89e03edca23a1784fb066b78aa2610c414d0d505c9 |
| Serving revision | studytrack-g3570cd4a7bca-r43233683592-1 |
| Migration execution | studytrack-migrate-rlh7z |
| Origin | https://studytrack-981693883236.asia-southeast1.run.app |

Complete references are in the [nine selected helper output fields](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/release-helper-output.json). The actual workflow passed keyless authentication, both pushes, pinned registry lineage, waited migration, revision verification, exact100% traffic/configuration and [public DB-health/UI smoke](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/automated-smoke.txt), followed by its success summary. These are actual automated cloud outcomes, not offline fixture results. B did not manually rerun or mutate cloud resources to produce this record.

## Subsequent operator corroboration

The B-side user ran the requested read-only Cloud Shell checks and pasted selected safe results. [First output](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/operator-service-revision-readback.txt) confirms the expected revision, Ready=True, Active=True,100% traffic, runner account and the same persistent Cloud SQL connection `studytrack-cpe334:asia-southeast1:studytrack-pg`. The runtime account is `studytrack-runner@studytrack-cpe334.iam.gserviceaccount.com`.

B's initial gcloud projection omitted the image fields inside container arrays; omission was not treated as empty containers. A corrected read-only Python projection over gcloud JSON supplied [explicit image/count results](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/operator-container-images.json): service and revision each have one container; service spec retains the pinned index above, while revision spec and resolved status use the exact platform image above. Both representations match the corrected verification contract and the actual run.

The [assessment/provenance](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/operator-assessment.json) attributes these observations to the human operator, not a direct authenticated agent GCP session or a native Console screenshot. The exact command execution time was not supplied. Condition transition times are retained as transition times, not invented readback timestamps. Terminal prompts/commands are omitted; selected output text is LF-normalized and no original-file byte identity is claimed. Computer Use could not confidently validate the browser URL in the preceding turn; no access bypass or browser mutation was attempted.

## Separate public HTTP and remaining acceptance

B tooling subsequently made [independent unauthenticated health/root reads](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/member-b-public-http.json): both HTTP200, expected DB-backed StudyTrack API status and built UI markers. [A's success comment](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/member-a-success-comment.json) separately records A's automated observations/public HTTP checks. Neither is a new authenticated human domain journey, screenshot or EP8 data-persistence comparison. HTTP alone does not prove the serving commit/digest/traffic; the source/run and operator records provide that correlation.

The [actual EP7 record](ep7-record.json) is a separate partially completed execution record. The master NOT_RUN template is unchanged. Human domain acceptance and peer acceptance of this evidence remain pending. A can capture EP8 P0 after successful release A; Issues22/23 do not yet contain a baseline-complete confirmation at this writing. A's actual authenticated baseline/domain evidence can be referenced when available with its real actor/date/outcomes. B waits for that confirmation before any restart/replacement or a distinct later visible-change release B. The corrective deployment is still release A; PR40 wording was already included and cannot count as the later change.

This evidence increment targets staging only. Merging staging evidence does not deploy. Do not release it into main ahead of A's baseline/operation coordination: every main merge starts the deploy workflow. No restart, replacement, rollback, new release or private domain-data mutation is authorized or performed by this documentation increment.

The original [failed run43197450278](https://github.com/auto4496/studytrack/actions/runs/43197450278) on d92f945 remains FAILED; [its diagnosis and observation limits](ep7-oci-digest-fix.md) remain unchanged. No failure is rewritten into success. Safe metadata/output files are retained with [hashes](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/manifest.json) and [source/provenance](../../../artifacts/evidence/lab5-cloud/ep7/2026-11-12-release-a/provenance.json); full downloaded debug logs and credentials are excluded.
