# Answer Part 0
## Team and Evidence Index

**StudyTrack - Lab5 evidence-index draft | 13 November 2026**

Team **TH-057** | Section **B** | LEB2 submission group **TH-057_P8**

Group name: **กำลังปั้นเครดิตครับ**

Topic **8: Habit and Activity Tracking System**. Manager activity templates, personal daily reading goals and saved minutes/progress, with private ownership boundaries.

:::widths 0.36 0.22 0.24 0.18
| Student | Student ID | GitHub | Role |
| --- | --- | --- | --- |
| Pitchai Chadchuangchot | 67070501068 | Datakung | B |
| Phanuwit Butchari | 67070501070 | auto4496 | A |

**Public repository:** [auto4496/studytrack](https://github.com/auto4496/studytrack). **Public application:** [open StudyTrack](https://studytrack-981693883236.asia-southeast1.run.app).

Application source selected for assessment: **6d30aefece55b3a83194010a2e0e62c9b8b1dbfc** ([main release](https://github.com/auto4496/studytrack/commit/6d30aefece55b3a83194010a2e0e62c9b8b1dbfc)), observed serving via [Deploy43410699104](https://github.com/auto4496/studytrack/actions/runs/43410699104). Accepted evidence snapshot: **c6b63f733489b8390c9b278351944b67937f0d84**, after [PR53/B acceptance](https://github.com/auto4496/studytrack/pull/53#pullrequestreview-5890141901). This draft is not a final submission receipt.

### Evidence index (direct checks)

:::widths 0.14 0.42 0.44
| Check / part | Primary direct evidence | Actual result |
| --- | --- | --- |
| C-01 / Part1 | [PR52](https://github.com/auto4496/studytrack/pull/52), [CI43409691975](https://github.com/auto4496/studytrack/actions/runs/43409691975) | Meaningful CI SUCCESS:41 offline, 152 API/unit, 38 browser cases; app/both image builds. |
| C-02 / Part1 | [PR36](https://github.com/auto4496/studytrack/pull/36), [failed run42781653763](https://github.com/auto4496/studytrack/actions/runs/42781653763) | Peer approval present; required failure still blocked merge. Closed unmerged. |
| C-03 / Part2 | [Container manifest](../../../artifacts/evidence/lab5-container/manifest.json), [PR15](https://github.com/auto4496/studytrack/pull/15) | Fresh clone/no-cache build,35 actual production/lifecycle checks; later guarded correction. |
| C-04 / Part3 | [P0](../../labs/lab-05/ep8-baseline-2026-11-12.md), [P2/privacy](../../labs/lab-05/ep8-p2-2026-11-13.md) | Own save/read/refresh; user-operated second account cannot read private record. |
| C-05 / Part3 | [P1 same-image run](https://github.com/auto4496/studytrack/actions/runs/43402554551), [P2 comparison](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/p2-domain-comparison.json) | Full original DTOs equal after process replacement and distinct visible redeploy. |
| C-06 / Part4 | [PR51](https://github.com/auto4496/studytrack/pull/51) -> [PR52](https://github.com/auto4496/studytrack/pull/52) -> [Deploy43410699104](https://github.com/auto4496/studytrack/actions/runs/43410699104) | Separate peer-reviewed staging/main path, actual pipeline and serving revision. |

Complete per-requirement links and evidence limits are in the [source evidence index](evidence-index.md). The following page maps R-01 through R-12 and actual contributions.

:::page
## Answer Part 0 - traceability and contribution

:::widths 0.13 0.40 0.47
| Requirement | Evidence | Result / limit |
| --- | --- | --- |
| R-01 | C-03; [clean build log](../../../artifacts/evidence/lab5-container/final/build-output.txt) | Historical exact source ee56d91, not relabelled as a new build of today's checkout. |
| R-02 | C-03; [settings table/runbook](../../labs/lab-05/deployment.md#settings-purpose-secrecy-and-source) | Placeholders/private settings separated; runtime/tools/config isolation documented. |
| R-03 | C-04; public URL, Figures3-4 | Business save and owner-boundary denial on the live service. |
| R-04 | C-05; Figures5-9, full DTO comparison | Same original IDs,stored date,count,timestamps,20/30 and66.67% at P0/P1/P2. |
| R-05 | C-01; [CI workflow](../../../.github/workflows/ci-docker.yml) | PR CI runs meaningful isolated unit/API/browser/build checks. |
| R-06 | C-02; Figures1-2 | Required failure blocked an approved normal PR; no bypass attempt. |
| R-07 | C-06; [deploy workflow](../../../.github/workflows/deploy.yml) | Reviewed main push built/migrated/deployed/smoked real releaseB. |
| R-08 | C-06; [procedure](../../labs/lab-05/deployment.md#repeatable-reviewed-main-release) | Full source/tree/digest/run/revision mapping and repeatable steps. |
| R-09 | [Lab5 Issues](https://github.com/auto4496/studytrack/issues?q=label%3Alab5), [board](https://github.com/users/auto4496/projects/2), PR51/52 | Actual Issue/Development/peer paths retained. Current board fields need owner final check. |
| R-10 | Labelled Issues14/20/21/22/23/24; C-02/C-06 | Gate and failure/review history retained; CI remains mandatory. |
| R-11 | Contributions below; [AI disclosure](../../ai-use.md) | Both members' linked work/reviews; AI assistance is explicit, not independent human UAT. |
| R-12 | [Public repo](https://github.com/auto4496/studytrack), [dated preflight](report-preflight.json) | Public on13Nov. Team must retain access and service until grading ends. |

### Actual contribution examples

:::widths 0.12 0.44 0.44
| Member | Engineering / preparation | Peer review / operations |
| --- | --- | --- |
| A | SRS/auth/goals; Docker [Issue14/PR15](https://github.com/auto4496/studytrack/pull/15); lifecycle work [PR35](https://github.com/auto4496/studytrack/pull/35); P0/P1/P2 evidence [PR48](https://github.com/auto4496/studytrack/pull/48),[PR50](https://github.com/auto4496/studytrack/pull/50),[PR53](https://github.com/auto4496/studytrack/pull/53) | B bootstrap/gate/release [PR26](https://github.com/auto4496/studytrack/pull/26),[PR34](https://github.com/auto4496/studytrack/pull/34),[PR41](https://github.com/auto4496/studytrack/pull/41),[PR51](https://github.com/auto4496/studytrack/pull/51),[PR52](https://github.com/auto4496/studytrack/pull/52) reviews; owner protections and supervised deployment/evidence. |
| B | Feature/Sprint/UI/API contracts, templates and entries [PR6](https://github.com/auto4496/studytrack/pull/6),[PR7](https://github.com/auto4496/studytrack/pull/7); CI/bootstrap/gate/release work; date guidance PR51; Issue24 index/runbook/PDF draft | A packaging/digest/P0/preflight/P1/P2 reviews [PR15](https://github.com/auto4496/studytrack/pull/15),[PR45](https://github.com/auto4496/studytrack/pull/45),[PR48](https://github.com/auto4496/studytrack/pull/48),[PR49](https://github.com/auto4496/studytrack/pull/49),[PR50](https://github.com/auto4496/studytrack/pull/50),[PR53](https://github.com/auto4496/studytrack/pull/53); human Cloud Shell bootstrap/readbacks. |

**Attribution:** Codex assisted source/testing/reviews/document assembly. P1 was dispatched by Codex through auto4496 at A's explicit start instruction; student2 credentials were entered directly by the user. These are assisted observations. Both students must read, verify and explain their work; commit counts do not establish participation.

:::page
# Answer Part 1
## CI and Quality Gate

**C-01 / R-05:** [CI workflow](../../../.github/workflows/ci-docker.yml) handles relevant PRs to main/staging, using an isolated PostgreSQL17 database. [PR52 CI43409691975](https://github.com/auto4496/studytrack/actions/runs/43409691975), source b8eb8c9, passed 41 offline tests, 152 API/unit tests in 10 files,38 desktop/mobile browser cases, app build and both Docker targets. Test/migration failure stops later stages; CI success is not live persistence proof.

**C-02 / R-06:** Active main/staging rules require strict **test-and-docker**, one peer approval, resolved threads and stale-review dismissal. Figure1 shows the native empty bypass/targets; [retained gate readbacks](../../labs/lab-05/ep6-evidence.md) establish the lower settings not visible in that crop. Figure2 isolates failed CI after peer approval.

:::figure {"file":"artifacts/evidence/lab5-cloud/ep6/2026-11-12-finalization/github-settings-redacted.pdf#page=2","panels":[[490,165,900,44,1],[490,500,900,81,1],[490,712,900,106,1]],"caption":"Figure1. C-02 / R-06: owner settings capture shows Active ruleset26925123, empty bypass and main/staging targets. Source: accepted EP6 finalization,12Nov; document panels omit intervening whitespace.","url":"https://github.com/auto4496/studytrack/blob/c6b63f733489b8390c9b278351944b67937f0d84/artifacts/evidence/lab5-cloud/ep6/2026-11-12-finalization/github-settings-redacted.pdf#page=2"}

:::figure {"file":"artifacts/evidence/lab5-cloud/ep6/2026-11-10-c02/pr36-approved-required-failure-blocked.png","panels":[[100,5,950,38,1],[406,750,775,295,1]],"caption":"Figure2. C-02 / R-06: native PR36 URL, Changes approved, failed Required test-and-docker and disabled Merge. Exact probe f6330b8; run42781653763. Closed unmerged after capture; no bypass, main change or auto-merge.","url":"https://github.com/auto4496/studytrack/blob/c6b63f733489b8390c9b278351944b67937f0d84/artifacts/evidence/lab5-cloud/ep6/2026-11-10-c02/pr36-approved-required-failure-blocked.png"}

Probe changed one assertion:45/60 incorrectly expected74, actual75. Hosted result 116 pass / 1 intentional failure; later browser/Docker steps skipped. [A approval](https://github.com/auto4496/studytrack/pull/36#pullrequestreview-5838791656) was limited to the demonstration, explicitly DO NOT MERGE. [Cleanup/readbacks](../../labs/lab-05/ep6-evidence.md#close-and-cleanup) preserve history and unchanged main.

:::page
# Answer Part 2
## Docker and Reproducible Configuration

**C-03 / R-01,R-02:** [Dockerfile](../../../Dockerfile), [.dockerignore](../../../.dockerignore), [Compose](../../../compose.container.yaml), [placeholder .env.example](../../../.env.example) and [complete settings/runbook](../../labs/lab-05/deployment.md) define reproducible configuration. Production runtime serves compiled Express/React as non-root; migration/seed tools are a separate target. Named PostgreSQL volume persists records; no database port is published by the production Compose stack. Local Caddy supplies HTTPS; Cloud Run supplies HTTPS in cloud.

The [fresh-clone manifest](../../../artifacts/evidence/lab5-container/manifest.json) and [no-cache output](../../../artifacts/evidence/lab5-container/final/build-output.txt) pin actual tested source **ee56d91dd4abf52f4c6bf13c5080c0f289620cc7**. 35 HTTPS/API/browser/lifecycle checks passed; same local record/session survived app restart, recreation and DB restart. This local45/60=75% record is separate from cloud P0/P1/P2.

[Guard correction](../../../artifacts/evidence/lab5-container/review-fix/manifest.json), source **f938688814f0cadc3caae2a33b58f1ba1a5cf679**, passed 21 guards and35 real production/lifecycle checks with a cached build / existing isolated volume. It was not a new no-cache run. Current Dockerfile additionally labels tools; release CI and Deploy43410699104 built both later targets. Initial runtime-containment failures remain in history; the assertion was preserved while devOptional tooling was excluded.

### Representative settings (full table in the runbook)

:::widths 0.28 0.40 0.32
| Setting | Purpose / source | Secret and scope |
| --- | --- | --- |
| DATABASE_URL | Prisma; private local config or selected Secret Manager version | Secret; runtime/tools, never report payload |
| APP_ORIGIN / PORT | Exact HTTPS origin / listen port; service or private local config | Nonsecret; cloud public origin /8080 |
| NODE_ENV / TZ | production / Asia/Bangkok | Nonsecret; workflow/service config |
| Seed passwords | Generated local config / named secrets | Secret; explicit seed tools only |
| TEST_DATABASE_URL | Separate disposable test DB with target guard | Secret; tests only, never cloud |
| CONTAINER_* | Local isolated DB/origin/seed/image source; generated private file | Credentials secret; source/origin metadata nonsecret |
| GCP_* / WIF_* | demo environment maps project/region/provider/account | Nonsecret references; keyless short-lived token is secret |
| IMAGE_TAG / VCS_REF | Full reviewed source SHA; workflow/build | Nonsecret provenance; no mutable latest tag |

### Repeat the isolated local check

```sh
node scripts/setup-container.mjs
node scripts/container.mjs check --project studytrack-container-review
node scripts/container.mjs up --project studytrack-container-review --fresh-build
node scripts/verify-container.mjs --project studytrack-container-review --browser --lifecycle
node scripts/container.mjs stop --project studytrack-container-review
```

Build/start needs Docker and Node; optional verifier also needs host npm ci and a supported browser. Private generated credentials stay in ignored .env.container.local. Stop retains volumes; no reset/down-with-volumes is a valid persistence proof. [Host build/test/migrate/seed commands](../../labs/lab-05/deployment.md#local-build-run-migration-seed-and-isolated-tests) distinguish local tests, initial seed and normal cloud migration. No Docker/cloud mutation was run for this report draft.

:::page
# Answer Part 3
## GCP Deployment and Persistence

**C-04 / R-03:** [Public StudyTrack](https://studytrack-981693883236.asia-southeast1.run.app) serves UI/API from Cloud Run **studytrack**, backed by SQL **studytrack-pg** in **studytrack-cpe334 / asia-southeast1**. Database-backed [health smoke](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/p2-public-smoke.json), [A EP5 live journey](../../labs/lab-05/member-a-live-acceptance.md), P0 save/read and P2 privacy evidence establish actual domain behavior. Browser refresh alone is not C-05 restart/redeploy proof.

:::figure {"file":"artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/p0-entry-saved.jpg","panels":[[80,43,780,32,1],[319,362,850,428,1]],"caption":"Figure3. C-04 / R-03: actual public goal UI confirms saved 20 minutes against 30, 66.67%, stored 12 Nov 2026. Source: P0 on main 3570cd4; original entry saved2026-11-12T14:42:49.190Z, then DTO/refresh checks. This is cloud data, not the local rehearsal.","url":"https://github.com/auto4496/studytrack/blob/c6b63f733489b8390c9b278351944b67937f0d84/artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/p0-entry-saved.jpg"}

:::figure {"file":"artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/student2-private-goal-denied-clear.jpg","panels":[[80,43,780,32,1],[330,255,450,46,1],[26,745,215,58,0.30]],"caption":"Figure4. C-04 / R-03: same private URL denies authenticated student2 (นักอ่านคนที่สอง shown in the account panel). Source: P2 unobstructed native retake 13 Nov 11:07:20Z, after user-operated sign-in and three API denials; main 6d30aef/run43410699104.","url":"https://github.com/auto4496/studytrack/blob/c6b63f733489b8390c9b278351944b67937f0d84/artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/student2-private-goal-denied-clear.jpg"}

[Student2 identity](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/student2-identity.json) and [three GET denials](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/student2-private-api-denials.json) show NOT_FOUND and no domain data for goal, entries and fixed-date progress. 404 follows the reviewed contract; raw HTTP status was not independently measured. Reader-one retrieval succeeded before the account switch. No cross-owner write was attempted.

:::page
## Answer Part 3 - same original record, P0 / P1 / P2

**C-05 / R-04:** Saved date is **2026-11-12**, not the current browser day. Full [P2 comparison](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/p2-domain-comparison.json) equals complete P0/P1 goal, entry-list (including metadata) and progress responses. No baseline record was edited, reseeded, repaired or recreated between phases.

:::figure {"file":"artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/p0-entry-saved.jpg","panels":[[319,584,850,197,1]],"caption":"Figure5. C-05 / R-04, P0 BEFORE: original 20/30=66.67%,12Nov2026; main 3570cd4/revision studytrack-g3570cd4a7bca-r43233683592-1. Full public URL/save confirmation is Figure3; raw P0 DTOs retain identity/timestamps.","url":"https://github.com/auto4496/studytrack/blob/c6b63f733489b8390c9b278351944b67937f0d84/artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/p0-entry-saved.jpg"}

:::figure {"file":"artifacts/evidence/lab5-cloud/ep8/2026-11-13-p1-43402554551/p1-fixed-date-ui.jpg","panels":[[319,555,850,191,1]],"caption":"Figure6. C-05 / R-04, P1 AFTER restart-equivalent: original saved-date 20/30=66.67%. Actual same-image run43402554551 created new 100%-serving revision studytrack-g3570cd4a7bca-r43402554551-1; full DTOs match P0.","url":"https://github.com/auto4496/studytrack/blob/c6b63f733489b8390c9b278351944b67937f0d84/artifacts/evidence/lab5-cloud/ep8/2026-11-13-p1-43402554551/p1-fixed-date-ui.jpg"}

:::figure {"file":"artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/p2-new-guidance-saved-day.jpg","panels":[[319,501,850,249,1]],"caption":"Figure7. C-05 / R-04, P2 AFTER distinct visible redeploy: new selected-date guidance plus original stored-date 20/30=66.67%. Source: main 6d30aef/run43410699104, native UI 13 Nov 10:53:08Z. Selecting 12 Nov changes the read date only.","url":"https://github.com/auto4496/studytrack/blob/c6b63f733489b8390c9b278351944b67937f0d84/artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/p2-new-guidance-saved-day.jpg"}

**Stable identity:** goal **1da44fc2-a956-421d-88a9-8c876adc38c1**; entry **f1146358-2b3a-4aa6-9033-b2d0d95fc542**; count 1; createdAt and updatedAt both **2026-11-12T14:42:49.190Z**; target 30, minutes 20, progress 66.67%,achieved=false. Record values, full responses and native UI agree across all three phases.

:::page
## Answer Part 3 - operation and database corroboration

**P1 actual operation:** [Run43402554551](https://github.com/auto4496/studytrack/actions/runs/43402554551) reused accepted source 3570cd4 and the same image, skipped build/push/tools/migration/seed, then routed to a new revision. [Startup event](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-13-p1-43402554551/p1-startup-instance.json) at 2026-11-13T09:35:54.448330Z is DEPLOYMENT_ROLLOUT with a different instance from preflight. This proves Cloud Run process replacement, not SQL/VM restart or old-instance termination. A explicitly instructed Codex to dispatch through auto4496; no human button click is claimed.

**P2 actual operation:** [Normal run43410699104](https://github.com/auto4496/studytrack/actions/runs/43410699104), source 6d30aef, built both images and waited migration studytrack-migrate-cq47b, with no seed/reset. [Selected real helper result](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/release-b-result.json) verifies lineage/runner/DB binding and smoke. Console images independently corroborate revision/traffic/reference settings.

:::figure {"file":"artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/p2-serving-revision.jpg","panels":[[290,184,614,35,1],[276,350,594,120,1],[914,271,597,61,1]],"caption":"Figure8. C-05 / R-04 and C-06 / R-08: native releaseB service URL, new revision studytrack-g6d30aefece55-r43410699104-1 at 100% and earlier revisions 0%. Source: P2 Console observation,13Nov, actual Deploy43410699104.","url":"https://github.com/auto4496/studytrack/blob/c6b63f733489b8390c9b278351944b67937f0d84/artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/p2-serving-revision.jpg"}

:::figure {"file":"artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/p2-database-binding.jpg","panels":[[907,311,550,36,1],[907,409,550,62,1],[907,694,550,108,1]],"caption":"Figure9. C-05 / R-04: native DB secret reference version 1 and SQL attachment studytrack-cpe334:asia-southeast1:studytrack-pg after releaseB. The truncated secret name is corroborated by the exact readback/helper result; no secret value is displayed.","url":"https://github.com/auto4496/studytrack/blob/c6b63f733489b8390c9b278351944b67937f0d84/artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/p2-database-binding.jpg"}

[P2 record/manifest](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/record.json) and [B review53](https://github.com/auto4496/studytrack/pull/53#pullrequestreview-5890141901) retain original evidence and limits. Database name studytrack is contract-derived; SQL contents/secret payload were not queried for this proof. Optional older-image rollback/roll-forward was not performed. Final joint report acceptance remains pending.

:::page
# Answer Part 4
## Repeatable Release Pipeline

**C-06 / R-07 to R-10:** One concrete labelled change was B's selected-date reading guidance under [Issue22](https://github.com/auto4496/studytrack/issues/22). [Specification](../../labs/lab-05/ep7-release-b-date-guidance.md) preceded the change; it adds visible help and an accessible description, without changing domain data/API behavior.

:::widths 0.19 0.42 0.39
| Stage | Direct evidence / source | Actual acceptance / result |
| --- | --- | --- |
| Feature -> staging | [PR51](https://github.com/auto4496/studytrack/pull/51), head 99d4908; [CI43408783283](https://github.com/auto4496/studytrack/actions/runs/43408783283) | A specific review/approval; CI PASS; staging b8eb8c9. Local fixture figures were not cloud proof. |
| Separate release -> main | [PR52](https://github.com/auto4496/studytrack/pull/52), [fresh CI43409691975](https://github.com/auto4496/studytrack/actions/runs/43409691975) | A separately approved release; main 6d30aef tree59ca1b1113958c7f6fc14d999fb4ea8ed84cffab equals accepted tree. |
| Main -> pipeline | [Deploy43410699104](https://github.com/auto4496/studytrack/actions/runs/43410699104), attempt1,push | Normal CI/build runtime+tools/push/WIF/migration/ready/traffic/smoke SUCCESS. |
| Pipeline -> public | [Release result](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-13-p2-43410699104/release-b-result.json), Figures7-9 | New visible guidance; studytrack-g6d30aefece55-r43410699104-1 at 100%; same original saved data. |

Runtime index **54dbdf5fb0fa4e6f7baec37f0568bbcff4db0fd97a0550df8c24f9923e80ba62**; resolved platform **e311c6c11c71d51921464217ec498eef2708ccafa1d4d6f346aaec2b40a15cca** (both sha256). Service index and revision platform are different levels of the verified same lineage. Earlier failed run43197450278 remains FAILED; [PR45 correction](https://github.com/auto4496/studytrack/pull/45) and successful [releaseA run43233683592](https://github.com/auto4496/studytrack/actions/runs/43233683592) retain the diagnosis rather than suppressing the guard.

### Repeatable procedure and lookup

[Deployment runbook](../../labs/lab-05/deployment.md#repeatable-reviewed-main-release): labelled linked Issue -> feature/fix -> peer-approved protected staging -> separate peer-approved main release -> main-triggered pipeline. [deploy.yml](../../../.github/workflows/deploy.yml) and [release.py](../../../deploy/release.py) validate clean/current main, image source/lineage and existing config, wait migration without seed, create no-traffic revision, check Ready/digest/config, then route and smoke. Normal updates do not rerun initial IAM/SQL/secret bootstrap.

Record actual run headSha, registry source/index/platform and serving traffic/revision; [safe lookup commands](../../labs/lab-05/deployment.md#safely-identify-the-actual-serving-version) avoid full env/secret dumps. Initial bootstrap was supervised in Cloud Shell; later WIF/demo uses a short-lived token with no stored service-account key. Never bypass failed CI/guards or self-approve a release.

### Final submission and availability - still pending

This is an **8-page draft for A/joint review**, not a submission. At 13 Nov 2026, 13:31Z, [preflight](report-preflight.json) found repo public, main 6d30aef unchanged, strict gate active and public health/UI smoke PASS. Keep repo/service available until grading ends; that read cannot guarantee future uptime. No report-only deployment was performed.

Both members must accept the report/evidence, finish reviewed document integration and verify owner board fields. Handout deadline: **15 November 2026, 23:59 Bangkok**; current LEB2 deadline is not verified. Confirm it, upload **lab5_secB_TH-057_P8.pdf** and retain the actual receipt before completing Issue24. Native source images remain unchanged; cropped panels are labelled, secret payloads are absent, and AI-assisted execution/limitations are disclosed.
