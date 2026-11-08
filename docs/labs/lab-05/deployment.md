# StudyTrack deployment

8 November 2026. Issue #20. B prepares the bootstrap and A reviews it through staging and a main release. This document records planned infrastructure and actual evidence separately. [First-cloud contract](cloud-contract.md) defines acceptance.

## Confirmed setup

- Project ID `studytrack-cpe334`, region `asia-southeast1`.
- User's Cloud Shell clone is accepted main `737c591af2a56797781b18742e065cb96eb3faed`. The user's command output shows `billingEnabled: true`.
- The user confirmed the budget alert and teammate IAM access. Trial credit balance and the eventual resource settings still need a Console check before the real run.
- [EP4 release PR #25](https://github.com/auto4496/studytrack/pull/25) is merged. Cloud SQL/Run resources, image digests, serving revision and public URL are pending actual execution.

## Stack and reference adaptations

React and Express share one production runtime, Node 24 and Prisma 6.19.3. PostgreSQL 17 stores users, sessions, templates, goals and entries. Cloud Run listens on injected PORT 8080 and serves the UI/API over one public HTTPS origin. Cloud SQL Enterprise is proposed with db-f1-micro, zonal availability, 10 GB SSD and disabled storage auto-increase. Run uses one CPU, 512 MiB, minimum 0 and maximum 3 instances. Teammate/user review of the dry-run plan precedes billable execution.

The starter's port 3000, PostgreSQL 16, ADMIN_PASSWORD, bearer-token login and /api/ready/categories do not describe StudyTrack. Here the tools target runs `npm run db:migrate && npm run db:seed`. The serving target receives DATABASE_URL only. Cloud Run's deterministic HTTPS URL supplies the exact APP_ORIGIN on the first deployment. The existing DB-backed /api/health plus built UI form the read-only smoke check. The full C-04 domain journey is checked separately by the team.

## Resources and permissions

The [contract resource table](cloud-contract.md) lists the proposed names. Runtime and tools images are tagged with the full accepted main SHA and resolved to digests before use. Cloud Build uploads only the inputs allowed by `.dockerignore`, using `--ignore-file=.dockerignore`; its configuration is read locally from deploy/cloudbuild.yaml.

`studytrack-runner` receives Cloud SQL Client and accessor on studytrack-database-url. `studytrack-migrator` receives Cloud SQL Client and accessor on the database and both seed-password secrets. `studytrack-builder` receives Artifact Registry Writer on the studytrack repository, project Logs Writer and project Storage Object Viewer for uploaded build source. Build has no application-secret grant. The caller needs permission to enable APIs, create these resources and act as their service accounts.

These are planned IAM changes requiring review of the dry-run output. No cloud IAM or database change is established by the offline tests.

## Environment and build settings

| Name | Purpose | Secret | Value source |
| --- | --- | --- | --- |
| PROJECT_ID | Bootstrap target project | No | User-confirmed studytrack-cpe334 |
| REGION | Build/registry/Run/SQL region | No | User-confirmed asia-southeast1 |
| DRY_RUN | 1 prints the plan; 0 executes it | No | Explicit caller selection; default 0 follows the starter |
| SQL_TIER | Proposed SQL machine | No | db-f1-micro default; changes require plan review |
| DATABASE_URL | Prisma database connection | Yes | Selected enabled version of studytrack-database-url in Secret Manager |
| SEED_MANAGER_PASSWORD | Synthetic manager password, tools job only | Yes | Selected version of studytrack-manager-password |
| SEED_PARTICIPANT_PASSWORD | Synthetic student passwords, tools job only | Yes | Selected version of studytrack-participant-password |
| APP_ORIGIN | Exact same-origin and CSRF contract | No | https://studytrack-PROJECT_NUMBER.asia-southeast1.run.app, using the queried project number |
| NODE_ENV | Production configuration | No | production in job and service |
| PORT | HTTP listen port | No | Cloud Run injection from --port=8080 |
| TZ | Process timezone | No | Asia/Bangkok on the serving service; domain dates remain explicit Bangkok dates |
| _REGISTRY | Cloud Build repository prefix | No | Region/project/studytrack from bootstrap |
| _VCS_REF / VCS_REF | Image tags and runtime OCI revision label | No | Full accepted main Git SHA |

The script generates 48-character hexadecimal passwords. Existing secret versions and DB passwords are preserved on rerun. A DB user with no saved secret, an empty/interrupted secret or a changed connection requires reviewed recovery. The script never resets an existing user's password. Keep a single manual bootstrap in progress and inspect a failure before retrying.

## Preview on the review branch

Run from the repository root in Cloud Shell. This prints the proposed gcloud commands and invokes zero gcloud calls. It uses a clearly identified simulated project number and secret versions until the actual run can query them.

```bash
DRY_RUN=1 PROJECT_ID=studytrack-cpe334 REGION=asia-southeast1 bash deploy/deploy.sh
```

Read the proposed SQL machine/storage, service identities/grants, image targets, migration and service settings with A. The plan builds images before creating a new SQL instance. It keeps migration/seed as a waited job before updating the public service. Preview success records a plan; the resource/deployment acceptance requires the next section.

## First real deployment after reviewed main release

Confirm the Console's selected project, active trial/credits and budget alert first. Pull the reviewed main containing these scripts, check its SHA, and keep the checkout clean. Actual execution requires HEAD to match origin's latest main and the gcloud project to match PROJECT_ID.

```bash
git switch main
git pull --ff-only origin main
git rev-parse HEAD
DRY_RUN=1 PROJECT_ID=studytrack-cpe334 REGION=asia-southeast1 bash deploy/deploy.sh
# After the team has reviewed this exact plan, run the real first deployment.
DRY_RUN=0 PROJECT_ID=studytrack-cpe334 REGION=asia-southeast1 bash deploy/deploy.sh
```

The script enables APIs, prepares registry/identities, builds and resolves runtime/tools images, creates/reuses SQL/database/secrets/user, runs migration and idempotent seed, deploys the service and runs the public smoke. A build or migration failure stops before a service update. A smoke failure reports deployment failure for investigation and retains the deployed resources for diagnosis.

It prints only source SHA, images, revision, URL and account names. Retrieve manager/student passwords privately from their named secrets. Sign in as manager@studytrack.test or student1@studytrack.test / student2@studytrack.test using the corresponding generated password. The app's existing seed preserves the initial accounts and records on rerun.

## Commands and verification

Local packaging uses the [container runbook](container.md). Root CI uses `npm ci`, `npm run db:generate`, `npm run test:container-config`, guarded `npm run db:test:migrate`, `npm test`, `npm run test:e2e` and `npm run build`. The cloud build configuration builds `runtime` and `tools`; the job migrates and seeds explicitly. The bootstrap's public smoke runs `python3 deploy/smoke_test.py SERVICE_URL`.

Offline script checks require Bash and Python 3 and use local executable fixtures for every gcloud call.

```bash
bash -n deploy/deploy.sh
python3 -B -m unittest discover -s deploy/tests -p 'test_*.py' -v
```

After cloud deployment, use the printed deterministic URL for login and browser actions so APP_ORIGIN matches. Verify manager template -> student goal -> daily minutes -> persisted progress, a duplicate/invalid rejection, cross-owner access and logout. Capture the public URL, source SHA and actual outcome. Cloud restart/redeploy belongs to #23. GitHub identity, required gate and the reusable main deployment pipeline continue in #21/#22.

## Running revision and evidence

The bootstrap prints the accepted SHA, immutable runtime/tools image URIs and latest ready service revision. Find the serving image/revision again with `gcloud run services describe studytrack --region=asia-southeast1 --project=studytrack-cpe334`. Match its digest to the SHA-tagged Artifact Registry image and its OCI org.opencontainers.image.revision label. Keep the resulting mapping with the public URL and release PR.

| Evidence | Current result |
| --- | --- |
| R-01/R-02 local packaging | Accepted in PR #15 and published through PR #25 |
| C-01 PR CI | Accepted staging/main runs linked in PR #19/#25 |
| Bootstrap offline guards | Execution results recorded in the bootstrap PR after testing |
| Public resources/URL and C-04 | Pending user cloud execution and real domain verification |
| C-02/C-05/C-06 | Tracked in #21/#23/#22 |

Keep source/review/CI/deployment evidence and the public service available for assessment as required by the handout. The Lab5 evidence index and PDF are tracked in #24.

References include [Cloud Build service accounts](https://docs.cloud.google.com/build/docs/securing-builds/configure-user-specified-service-accounts), [Cloud SQL settings](https://docs.cloud.google.com/sql/docs/postgres/create-instance), [Cloud Run SQL connections](https://docs.cloud.google.com/sql/docs/postgres/connect-run), [Cloud Run URLs](https://docs.cloud.google.com/run/docs/triggering/https-request), and [gcloud source uploads](https://docs.cloud.google.com/sdk/gcloud/reference/builds/submit).
