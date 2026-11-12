# StudyTrack deployment

## Current checkpoint - 12 November 2026

EP5 documentation release [PR #30](https://github.com/auto4496/studytrack/pull/30) is merged into main5c04cd4 and #20 is closed. EP6's required main/staging gate, normal failing PR36 refusal/cleanup, legitimate protected PR37 staging merge, human-operated GCP scoped-policy/zero-key readbacks and complete persisted WIF condition/mappings now have retained evidence. All requested image types are collected; clipped values/controls are corroborated by real API/CLI evidence. See [EP6 execution evidence](ep6-evidence.md) and [execution record](ep6-record.json). Finalization is ready for A review and the reviewed main release; keep Issue21 open until those acceptance steps finish. No actual keyless credential exchange or new cloud deployment is established; those belong to EP7. The dated EP5 writing-time checkpoints below retain their evidence provenance; the later PR30/#20 record establishes acceptance. No documentation merge establishes a new running application revision.

8 November 2026. Issue #20. B prepares the bootstrap and A reviews it through staging and a main release. This document records planned infrastructure and actual evidence separately. [First-cloud contract](cloud-contract.md) defines acceptance.

## Confirmed setup

- Project ID `studytrack-cpe334`, region `asia-southeast1`.
- Deployed source is accepted main `807ed0806a84f39e88e0ba8f8fa5e658f41fe97f`, released through [PR #27](https://github.com/auto4496/studytrack/pull/27) after A's bootstrap review in [PR #26](https://github.com/auto4496/studytrack/pull/26).
- The user confirmed enabled billing, the budget alert and teammate IAM access, showed an active trial, completed the final-main preview and executed the real bootstrap in Cloud Shell.
- Public origin: <https://studytrack-981693883236.asia-southeast1.run.app>. Ready revision `studytrack-00001-rtr` serves 100% of traffic. The user's deployment log, SQL describe output, browser/Console screenshots and enabled-API output establish the results below.
- [EP5 evidence and A acceptance checklist](ep5-evidence.md) records the immutable image digests, command outcomes and evidence attribution. A's [9 November live verification](member-a-live-acceptance.md) separately records saved20/30, refresh persistence and cross-owner denial, with A's own captures. PR #28 has been approved and merged into staging; peer review of the A evidence and the documentation release remain pending. This documentation branch has not been deployed.

## Episode checklist

Cross-checked against Student Guide V1.1, EP4 pages 38-43 and EP5 pages 44-55, and the Lab5 handout. The handout controls assessed requirements when reference materials differ. Complete each row using its stated evidence before declaring the episode complete.

| Step | StudyTrack action and expected evidence | Current checkpoint |
| --- | --- | --- |
| EP4 file preparation | CI and adapted deployment files are on reviewed main. The reference copies the whole starter deploy/ folder during EP4. StudyTrack initially published CI/smoke in PR #25; PR #26 supplies the first-deploy script and Cloud Build configuration. | PR #26 accepted into staging; PR #27 released the scripts to main807ed08. |
| 5.0 Adapt | A reviews resource names, SQL 17/edition/tier/storage, port 8080, origin, runtime/tools, IAM and secret/migration behavior in PR #26. | A approved source3664535; release CI passed 16 offline, 21 config, 117 API/unit and 24 browser checks plus app/runtime-image builds. These are pre-cloud results. |
| 5.1 Cloud Shell | Correct active Google account, studytrack-cpe334, asia-southeast1, enabled billing, budget, teammate access and clean accepted main. Confirm active trial/credits in Console. | User supplied the account/project/billing results and active-trial screenshot, confirmed budget/teammate access and updated to main807ed08. |
| 5.2 Preview | Run DRY_RUN=1 from the repository root and inspect every proposed resource and permission with A. Repeat after script changes and on the final accepted main. | User's final-main preview807ed08 completed; B also ran literal preview on that source. |
| 5.3 Deploy | Run the accepted main script after the reviewed plan and billing/credit check. Retain source SHA, image digests, migration outcome, revision and URL. Inspect failures before retrying. | Build59d938a8 succeeded; migration/seed execution studytrack-migrate-6qs4x completed; revision studytrack-00001-rtr deployed. First permission-denied attempt and the controlled successful retry are retained in the evidence record. |
| 5.4 Storage | Verify studytrack-pg has storageAutoResize=false and the expected size/edition/tier. Creation already supplies --no-storage-auto-increase. | Actual describe confirms POSTGRES_17 / ENTERPRISE / db-f1-micro / 10GB / storageAutoResize=false; Console shows PostgreSQL17.11, Singapore, Single zone and database studytrack. |
| 5.5 Health and UI | Use the script's printed HTTPS origin. Verify /api/health returns data.status=ok, run the read-only smoke and open the built UI publicly. The StudyTrack health route queries the DB. | Script smoke passed both routes. B independently fetched health/root HTTP200; the user's browser screenshots show the live UI. |
| 5.6 Sign-in | Retrieve the manager/student password privately using the selected secret version referenced by the migration job. Use manager@studytrack.test and student1@studytrack.test / student2@studytrack.test. The existing StudyTrack seed preserves established passwords/accounts on rerun. | User signed in as manager and both students, created a template/30-minute goal, observed invalid0 rejection, saved15/30=50%, reloaded the saved result and observed student2 denied student1's goal. |
| 5.7 Console | Check enabled APIs, registry runtime/tools images, all three service identities/grants, PostgreSQL17 studytrack-pg/studytrack, three named secrets, Cloud Run origin/DB secret/port and scaling min0/max3. | User screenshots show Run/resources/scaling, Registry images, secret names, project IAM and SQL/database. Enabled-API output contains all7 script APIs. Resource-scoped IAM bindings are evidenced by the bootstrap log; the full origin/secret name is clipped in the Console screenshot. |
| 5.8 Acceptance | Both members check manager template -> participant goal -> saved entry/progress and a rule/access rejection. Link the public URL, SHA/revision, outcomes and safe screenshots in #20 and this record. Close #20 only after these criteria hold. | B-side user checks passed. A independently verified the domain workflow on 9 November: target30, saved20/30=66.67%, persisted retrieval and student2 denial. PR #28 accepted into staging; [A evidence](member-a-live-acceptance.md) awaits B review and the documentation release. Keep #20 open for that handoff/release. |

Initial build runs before SQL creation in this adaptation, reducing the time a new SQL instance exists if the build fails. The separate builder/migrator identities and extra failure tests are design choices to review with A. Generating and retaining the configuration preview is preparation for the real cloud checks.

For step5.4, inspect the actual settings after deployment:

```bash
gcloud sql instances describe studytrack-pg --project=studytrack-cpe334 \
  --format='yaml(databaseVersion,region,settings.edition,settings.tier,settings.dataDiskSizeGb,settings.storageAutoResize)'
```

If migration/seed fails at step5.3, the script prints this diagnostic command. Inspect the relevant execution before another attempt:

```bash
gcloud run jobs logs read studytrack-migrate \
  --region=asia-southeast1 --project=studytrack-cpe334 --limit=50
```

Files for the later episodes also need explicit acceptance. `deploy/release.sh` and `.github/workflows/deploy.yml` are tracked in #22 with the reviewed identity/gate setup in #21. The cloud restart/redeploy proof is #23 and the evidence PDF is #24. A teardown script/resource cleanup belongs to the post-grading lifecycle after the instructor confirms service availability is no longer required. Recheck the next episode's complete prerequisites before starting it.

EP8 preparation,9November: A has drafted the [shared cloud persistence test plan](persistence-test-plan.md) and [unexecuted record template](persistence-record.template.json) for B review. They define the before/restart/redeploy comparisons and concrete A/B contributions without changing the issue owner. Execution awaits the reviewed EP7 workflow and exact operation plan. No cloud restart/redeploy result is established by these preparation files.

## Stack and reference adaptations

React and Express share one production runtime, Node 24 and Prisma 6.19.3. PostgreSQL 17 stores users, sessions, templates, goals and entries. Cloud Run listens on injected PORT 8080 and serves the UI/API over one public HTTPS origin. Cloud SQL Enterprise is proposed with db-f1-micro, zonal availability, 10 GB SSD and disabled storage auto-increase. Run uses one CPU, 512 MiB, minimum 0 and maximum 3 instances. Teammate/user review of the dry-run plan precedes billable execution.

The starter's port 3000, PostgreSQL 16, ADMIN_PASSWORD, bearer-token login and /api/ready/categories do not describe StudyTrack. Here the tools target runs `npm run db:migrate && npm run db:seed`. The serving target receives DATABASE_URL only. Cloud Run's deterministic HTTPS URL supplies the exact APP_ORIGIN on the first deployment. The existing DB-backed /api/health plus built UI form the read-only smoke check. The full C-04 domain journey is checked separately by the team.

## Resources and permissions

The [contract resource table](cloud-contract.md) lists the proposed names. Runtime and tools images are tagged with the full accepted main SHA and resolved to digests before use. Cloud Build uploads only the inputs allowed by `.dockerignore`, using `--ignore-file=.dockerignore`; its configuration is read locally from deploy/cloudbuild.yaml.

`studytrack-runner` receives Cloud SQL Client and accessor on studytrack-database-url. `studytrack-migrator` receives Cloud SQL Client and accessor on the database and both seed-password secrets. `studytrack-builder` receives Artifact Registry Writer on the studytrack repository, project Logs Writer and project Storage Object Viewer for uploaded build source. Build has no application-secret grant. The caller needs permission to enable APIs, create these resources and act as their service accounts.

The successful bootstrap log records these grants and resource creation. Project IAM screenshots independently confirm the project roles. Repository/secret bindings are resource-scoped and are not established by the project IAM screenshot. Offline tests remain separate from this live evidence.

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

The first deployment below has already completed on main807ed08. Preserve this procedure for reference; repeating it is not required to review this documentation. A reviews the existing live deployment and evidence using [the acceptance checklist](ep5-evidence.md#a-acceptance-handoff).

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
| Bootstrap offline guards | 16 offline checks passed in PR #26/#27; hosted release CI42484888811 succeeded |
| Public resources/URL and C-04 | B's deployment record identifies main807ed08; A independently verified the public domain workflow and access restriction on 9 November. See [A evidence](member-a-live-acceptance.md) for captures and version-provenance limits. Documentation handoff/release remains pending. |
| C-02/C-05/C-06 | Tracked in #21/#23/#22 |

Keep source/review/CI/deployment evidence and the public service available for assessment as required by the handout. The Lab5 evidence index and PDF are tracked in #24.

References include [Cloud Build service accounts](https://docs.cloud.google.com/build/docs/securing-builds/configure-user-specified-service-accounts), [Cloud SQL settings](https://docs.cloud.google.com/sql/docs/postgres/create-instance), [Cloud Run SQL connections](https://docs.cloud.google.com/sql/docs/postgres/connect-run), [Cloud Run URLs](https://docs.cloud.google.com/run/docs/triggering/https-request), and [gcloud source uploads](https://docs.cloud.google.com/sdk/gcloud/reference/builds/submit).
