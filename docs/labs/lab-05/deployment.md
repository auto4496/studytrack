# StudyTrack deployment

## Current checkpoint - 13 November 2026

A separately approved [release PR52](https://github.com/auto4496/studytrack/pull/52) and merged main **6d30aefece55b3a83194010a2e0e62c9b8b1dbfc**, tree `59ca1b1113958c7f6fc14d999fb4ea8ed84cffab` (equal reviewed staging b8eb8c9). Normal [Deploy43410699104](https://github.com/auto4496/studytrack/actions/runs/43410699104), attempt1, passed CI, both image builds, WIF authentication, waited migration, readiness/digest/configuration guards, traffic and public smoke; no seed/reset ran.

Observed serving revision **studytrack-g6d30aefece55-r43410699104-1**,100% traffic. Runtime index `sha256:54dbdf5fb0fa4e6f7baec37f0568bbcff4db0fd97a0550df8c24f9923e80ba62`, platform `sha256:e311c6c11c71d51921464217ec498eef2708ccafa1d4d6f346aaec2b40a15cca`: different levels of one verified OCI lineage, not an index/platform equality requirement.

A's [P2/privacy evidence](ep8-p2-2026-11-13.md) was accepted by B in [review5890141901](https://github.com/auto4496/studytrack/pull/53#pullrequestreview-5890141901); PR53 merged into staging c6b63f7. Full original goal/entries/progress equal P0/P1 after the distinct release; stored date2026-11-12 remains20/30=66.67%. Authenticated student2 gets no private data from three GETs or UI. Assisted observations and user-operated sign-in are not independent human UAT. Dated historical records retain writing-time pending states; this checkpoint records later acceptance.

The corrected [report/index/runbook](../../deliverables/lab5/README.md) were accepted through PR56 and merged into staging311452c. The editorial submission copy removes provisional authoring labels and receives a final file-release review. Keep Issues22/23/24 open through the remaining final-file/submission handoff; LEB2 deadline confirmation and upload receipt are still separate. No report-only cloud deployment is required.

## Stack and starter adaptations

React/Vite assets and Express/Node24 share one production image; Prisma6/PostgreSQL17 persist records and sessions. StudyTrack uses Secure cookies, CSRF and exact HTTPS APP_ORIGIN, not starter bearer-auth/routes/database assumptions. `Dockerfile` separates non-root production `runtime` from migration/seed `tools`. Runtime startup never migrates/seeds. `.dockerignore` allowlists inputs and excludes private env, Git, evidence/reports and host dependencies.

Local production [Compose](../../../compose.container.yaml) uses Caddy/internal CA for HTTPS and an isolated named PostgreSQL volume; dev/test Compose is separate. Cloud Run supplies public HTTPS, so cloud has no Caddy container. Test databases never target cloud.

| Resource | Actual observed value / source |
| --- | --- |
| Project / region | studytrack-cpe334 / asia-southeast1 |
| Service / public origin | studytrack / <https://studytrack-981693883236.asia-southeast1.run.app> |
| Runtime | CPU1,512MiB,port8080,gen2,request-based,min0,max3 |
| Migration job / releaseB execution | studytrack-migrate / studytrack-migrate-cq47b |
| SQL | studytrack-pg,POSTGRES_17,Enterprise,db-f1-micro,single zone,10GB,storageAutoResize=false; [EP5 human readback](ep5-evidence.md) |
| Database | studytrack (contract-derived; P2 did not inspect SQL or secret payload) |
| SQL attachment | studytrack-cpe334:asia-southeast1:studytrack-pg |
| Artifact Registry | repository studytrack; image names studytrack and studytrack-tools, same project/region |
| Runtime secret | studytrack-database-url:1; reference unchanged P0/P1/P2 |
| Initial seed secrets | studytrack-manager-password and studytrack-participant-password; tools only |

Evidence: [EP5](ep5-evidence.md), [EP6](ep6-evidence.md), [releaseA](ep7-release-a-evidence.md), [P1](ep8-p1-2026-11-13.md), [P2](ep8-p2-2026-11-13.md). These are dated observations, not a guarantee future configuration cannot change.

## Identities and protections

All accounts below use `@studytrack-cpe334.iam.gserviceaccount.com`.

| Account | Reviewed scope |
| --- | --- |
| studytrack-runner | Cloud SQL Client; accessor on DB secret only |
| studytrack-migrator | Cloud SQL Client; DB and initial seed-password secret accessors |
| studytrack-builder | Initial Cloud Build: repository Writer, project Logs Writer/Storage Object Viewer; no application-secret grant |
| studytrack-deployer | GitHub: project Run Developer, repository Writer, Service Account User on runner/migrator only; zero user-managed keys |

Resource-scoped grants come from scoped policy readbacks, not the project IAM image alone. GitHub environment `demo` permits main only. WIF pool github-actions/provider github-main trusts exact repository ID, owner ID, main ref, deploy workflow ref and environment subject, with google.subject=assertion.sub and attribute.repository_id=assertion.repository_id. Deployer's workloadIdentityUser binding is attribute-scoped. See [EP6 record](ep6-record.json) for the full condition and retained human observations. No long-lived JSON key is stored in GitHub; do not weaken trust to resolve a failed authentication.

Active ruleset26925123 protects main and codex/sprint-1-staging: strict required test-and-docker from GitHub Actions, one peer approval, stale-review dismissal, resolved threads, force-push/deletion protection. Empty bypass is owner-confirmed and captured; B's REST omission of bypass fields is not proof. [C02](ep6-evidence.md) retains peer-approved PR36 with required failed CI/disabled merge and later unmerged cleanup. No bypass/rule change was attempted.

## Settings: purpose, secrecy and source

Examples are placeholders, ignored private files are not evidence. Never retain real connection strings, passwords, cookies, CSRF values, tokens or credential JSON.

| Name | Purpose | Secret? | Source / scope |
| --- | --- | --- | --- |
| DATABASE_URL | Prisma DB connection | Yes | Local private .env; cloud selected studytrack-database-url version, runtime/tools |
| APP_ORIGIN | Exact allowed origin / CSRF | No | Local UI/container origin; cloud public HTTPS URL above |
| PORT | HTTP listener | No | Local example5000; cloud/production container8080, Run injection |
| NODE_ENV | Runtime mode | No | Local development; production in service/tools |
| TZ | Process timezone | No | Cloud Asia/Bangkok; domain dates explicitly Bangkok |
| SEED_MANAGER_PASSWORD / SEED_PARTICIPANT_PASSWORD | Synthetic seed credentials | Yes | Private local env or named Secret Manager versions; explicit seed tools only |
| POSTGRES_PASSWORD | Local DB bootstrap | Yes | Private local env; CI fixture is disposable, not production |
| TEST_DATABASE_URL | Isolated test target | Yes | Private .env.test.local / ephemeral CI DB; guard rejects development equality/unsafe target |
| API_PROXY_TARGET | Vite API proxy | No | Optional local API origin, development only |
| PLAYWRIGHT_CHANNEL | Test browser | No | Optional local runner selection; not application runtime |
| CONTAINER_DB_PASSWORD | Isolated Compose DB credential | Yes | setup-container generated ignored .env.container.local |
| CONTAINER_DATABASE_URL | Internal Compose connection | Yes | Generated private file; effective target must be db:5432/studytrack_container |
| CONTAINER_MANAGER_PASSWORD / CONTAINER_PARTICIPANT_PASSWORD | Local synthetic seed credentials | Yes | Generated private file; seed/verifier only |
| CONTAINER_APP_ORIGIN / CONTAINER_HTTPS_PORT | Local HTTPS | No | Generated defaults https://localhost:3443 /3443 |
| CONTAINER_IMAGE_TAG / CONTAINER_VCS_REF | Image tag / full OCI source label | No | setup-container from checkout; rerun setup after checkout changes |
| PROJECT_ID / REGION | Provision/release targets | No | Human-confirmed project/region; release mapping below |
| DRY_RUN | Bootstrap1 preview /0 execute | No | Caller selection; default0, explicitly set1 for preview |
| SQL_TIER | Initial SQL machine | No | Bootstrap default db-f1-micro, human reviews plan |
| _REGISTRY | Cloud Build prefix | No | Derived project/region/repository |
| _VCS_REF / VCS_REF | SHA tag and OCI revision label | No | Full accepted main SHA, bootstrap/build workflow |
| GCP_PROJECT_ID / GCP_REGION | GitHub environment variables | No | demo environment; mapped to PROJECT_ID / REGION |
| WIF_PROVIDER / WIF_SERVICE_ACCOUNT | Provider path / deployer email | No | demo environment, provisioned identities; not credential payloads |
| IMAGE_TAG | Immutable full source tag to resolve | No | Normal=GITHUB_SHA; existing-image dispatch=explicit accepted ancestor SHA |
| ROLLBACK | Helper existing-image switch | No | Workflow false/true; same-image P1 is not an older-release rollback |
| SERVICE_NAME / MIGRATE_JOB_NAME | Optional resource overrides | No | Guarded to studytrack / studytrack-migrate |
| GITHUB_SHA / GITHUB_REF / GITHUB_EVENT_NAME | Source/ref/event | No | Actions; checked against clean HEAD/current remote main |
| GITHUB_RUN_ID / GITHUB_RUN_ATTEMPT | Unique revision identity | No | Actions; attempt default1 |
| GITHUB_ENV | Selected result export file | No | Temporary Actions runner path |
| CLOUDSDK_AUTH_ACCESS_TOKEN | Short-lived gcloud auth | Yes | WIF/auth action; masked, never evidence |

Offline fake-executable fixture controls TEST_STATE/TEST_MODE/host BASH belong to the test harness, not deployed config. Standard GitHub runner variables are supplied by Actions. Sources: [.env.example](../../../.env.example), [.env.test.example](../../../.env.test.example), [.env.container.example](../../../.env.container.example), [CI](../../../.github/workflows/ci-docker.yml), [deploy workflow](../../../.github/workflows/deploy.yml), [release helper](../../../deploy/release.py).

## Local build, run, migration, seed and isolated tests

Use the [README](../../../README.md) prerequisites and [container runbook](container.md). The production server requires a valid HTTPS proxy/origin for Secure-cookie login; npm start alone does not provide TLS.

```sh
# Host development, private local config (inspect privately).
node scripts/setup-local.mjs
npm ci
npm run db:generate
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
# Production build/server with production HTTPS settings already supplied.
npm run build
npm start
# Guarded isolated test DB; NEVER cloud/development DB.
npm run test:container-config
npm run db:test:migrate
npm test
npm run test:e2e
python3 -B -m unittest discover -s deploy/tests -p 'test_*.py' -v
# Fresh local production container build (host dependencies not needed to build).
node scripts/setup-container.mjs
node scripts/container.mjs check --project studytrack-container-review
node scripts/container.mjs up --project studytrack-container-review --fresh-build
# Optional verifier needs host npm ci and its supported browser installed.
node scripts/verify-container.mjs --project studytrack-container-review --browser --lifecycle
node scripts/container.mjs stop --project studytrack-container-review
```

Local up explicitly migrates/idempotently seeds its isolated DB; stop retains volumes. Do not remove volumes/reset data for a persistence demonstration. Historical C03 no-cache source is ee56d91; correction f938688 used a cached build and passed 21 guards/35 lifecycle checks. Current Dockerfile additionally labels the tools image; historical no-cache proof is not relabelled as a fresh build of current source. Later CI/cloud release built both current targets.

## Initial bootstrap - completed, not a normal update

First accepted bootstrap main807ed08 was executed by B's human in Cloud Shell after billing/budget/teammate IAM checks. A reviewed PR26; separate PR27 released it. [EP5](ep5-evidence.md) and [A live acceptance](member-a-live-acceptance.md) retain actual initial results.

Only for genuinely new infrastructure, read the [cloud contract](cloud-contract.md), review permissions/cost/resources with the human operator and preview exact accepted main:

```sh
DRY_RUN=1 PROJECT_ID=studytrack-cpe334 REGION=asia-southeast1 bash deploy/deploy.sh
```

Preview makes zero gcloud calls and declares simulated values; it is not a live check. Real DRY_RUN=0 provisioning is separately supervised and already completed here: APIs/IAM/registry/SQL/secrets, runtime/tools builds, waited migration plus initial seed, service and smoke. Do not rerun bootstrap for an update or report. Saved credentials are preserved; interrupted user/secret recovery requires inspection, not reset/blind retry.

## Repeatable reviewed-main release

1. Label/link the Issue in actual Development. Feature/fix branch -> other member's review -> protected staging with required CI. No self-approval.
2. Separate staging-to-main release PR -> other member's review and fresh CI -> normal merge. Sync missing main ancestry through a reviewed branch when necessary; compare complete accepted trees.
3. Main push runs deploy.yml: reusable CI, runtime/tools builds and pushes tagged by full main SHA, WIF/demo authentication and release.sh/release.py. No feature-branch deployment credentials.
4. Update-only helper checks clean/current main, source labels and OCI index/platform lineage; validates existing SQL/secret/runner config; updates/waits migration with no seed; creates no-traffic revision; checks readiness/digest/config, routes traffic and smokes. It does not bootstrap IAM/SQL/secrets. Preserve failed runs and investigate guards; never bypass them.
5. Retain source/tree, peer reviews, CI/run/attempt, digests, migration, serving revision/traffic, DB reference and actual public outcome. Compare the original IDs/date/full DTOs for persistence, not newly seeded substitutes: [P0](ep8-baseline-2026-11-12.md), [P1](ep8-p1-2026-11-13.md), [P2](ep8-p2-2026-11-13.md).

Main workflow_dispatch with explicit accepted-ancestor image tag selects existing-image mode: skips CI/build/push/tools/migration/seed, retains source/lineage/config/readiness/traffic/smoke guards. Actual P1 run43402554551 used the same image/source; a different DEPLOYMENT_ROLLOUT instance plus a new 100%-serving revision establishes restart-equivalent process replacement. No VM/SQL restart or old-instance termination is claimed. Older-image rollback/roll-forward was not run. Coordinate runtime operations with the fixed baseline; documentation needs none.

## Safely identify the actual serving version

```sh
gh run view 43410699104 --repo auto4496/studytrack --json headSha,event,conclusion,url
gcloud run services describe studytrack \
  --project=studytrack-cpe334 --region=asia-southeast1 \
  --format='yaml(status.latestReadyRevisionName,status.traffic)'
gcloud run revisions describe studytrack-g6d30aefece55-r43410699104-1 \
  --project=studytrack-cpe334 --region=asia-southeast1 \
  --format='yaml(metadata.name,status.conditions,status.imageDigest)'
python3 deploy/smoke_test.py https://studytrack-981693883236.asia-southeast1.run.app
```

Use actual traffic, not latestReady alone. Match run headSha/helper result, registry source label and resolved platform; service may retain the index. Avoid full JSON/env dumps or secret reads for screenshots. Submitted settings captures already mask numeric project-number portions in the [EP6 PDF](../../../artifacts/evidence/lab5-cloud/ep6/2026-11-12-finalization/github-settings-redacted.pdf); public application URL remains usable.

## Availability and final handoff

[Evidence index](../../deliverables/lab5/evidence-index.md) maps C01-06/R01-12. C01 release CI43409691975 passed 41 offline, 152 API/unit, 38 browser cases and application/both-image builds. C02 PR36 is closed unmerged. C03 packaging, C04 domain workflow, C05 P0/P1/P2 and C06 reviewed releases retain separate provenance.

Keep repo public and service available until the instructor ends grading. A dated successful read is not future uptime; check again before submission. Do not pause/delete resources or review/evidence history to finish the report. Submission metadata: SectionB / TH-057_P8 / กำลังปั้นเครดิตครับ. Handout deadline15November2026,23:59 Bangkok; current LEB2 deadline and actual upload receipt are not verified. Review together, confirm LEB2 and retain the actual receipt before completing Issue24.
