# First cloud deployment contract

8 November 2026. Issue #20. B implements and A reviews before staging acceptance and release to main. This contract precedes the provisioning script. The user confirmed Cloud Shell main `737c591`, project `studytrack-cpe334`, region `asia-southeast1`, `billingEnabled: true`, budget alert and teammate IAM access. These are user-supplied setup results. Cloud resources and a working public URL still require execution evidence.

## Planned resources

| Resource | Planned setting |
| --- | --- |
| Artifact Registry | `studytrack` in `asia-southeast1` |
| Images | `studytrack:<full-main-sha>` runtime and `studytrack-tools:<full-main-sha>` tools, both resolved to immutable digests |
| Cloud SQL | `studytrack-pg`, PostgreSQL 17, Enterprise, `db-f1-micro`, zonal, 10 GB SSD, storage auto-increase disabled |
| Database/user | `studytrack` / `studytrack` |
| Cloud Run | `studytrack`, gen2, port 8080, 512 MiB, one CPU, minimum 0 / maximum 3 instances |
| Migration job | `studytrack-migrate`, tools image, explicit `npm run db:migrate && npm run db:seed` before service deployment |
| Service identities | `studytrack-runner` for the web app, `studytrack-migrator` for migration/seed, `studytrack-builder` for Cloud Build |
| Secrets | `studytrack-database-url`, `studytrack-manager-password`, `studytrack-participant-password` with generated values and explicitly selected versions |

The SQL size and Run scaling are proposed initial settings for teammate/user review. Cloud SQL, storage and build usage consume the project's billing/credits after execution. The offline preview presents the exact changes first.

## Interfaces and behavior

- Build the accepted root Dockerfile's runtime/tools targets using the existing source allowlist. Keep Git history, local environments, dependencies and evidence outside the uploaded source.
- Derive the exact HTTPS origin from the documented deterministic Cloud Run URL and the real project number before the first service deployment. Keep production secure cookies, CSRF and ownership checks enabled.
- Use the Cloud SQL Unix socket and a bounded Prisma pool. Runtime receives DATABASE_URL only. Seed passwords are injected into the separate job.
- Give the runtime and migration identities Cloud SQL Client. Secret access is per secret. The build identity gets repository-scoped Artifact Registry Writer, project log writer and project source-object viewer. It receives no application secrets.
- Real execution requires a clean, current `main` checkout. Dry run works on the review branch, prints the plan and invokes no gcloud command. Images build before a new billable SQL instance is created. A failed build/migration stops service deployment.
- Preserve existing credentials and records across retries. Keep database credentials in Secret Manager before creating the DB user. Only the successful secret creator writes its first version. Missing credentials for an existing user or a metadata-only secret from an interrupted create require reviewed recovery before retrying.
- Existing SQL must match the planned engine/region/tier and disabled storage auto-increase. Provisioning fails on incompatible resources rather than silently changing them.

## Acceptance checks

| ID | Check | Required result |
| --- | --- | --- |
| AC-GCP-01 | Offline dry run with a failing gcloud stub | Zero gcloud calls; full plan for the selected project/region and source SHA |
| AC-GCP-02 | Mocked first run and rerun | Correct settings, separate images/identities, matching DB credentials, preserved secret versions |
| AC-GCP-03 | Partial secret/user setup and command failures | Recover safe interrupted setup, reject ambiguous credentials, halt before service update after build/job failure |
| AC-GCP-04 | Real deployment after teammate review and release | Public HTTPS UI/API/DB, login and manager-template -> participant-goal -> entry -> persisted progress plus rule/access rejection |
| AC-GCP-05 | Evidence | Record accepted main SHA, image digests, serving revision/URL and actual commands/results in deployment.md; keep secret values private |

Offline results establish script behavior. AC-GCP-04/05 require the user's cloud run and a live domain check. Cloud restart/redeploy and later GitHub release automation continue in #21-#24.

References include the course EP5 guide and [Cloud Run deterministic URLs](https://docs.cloud.google.com/run/docs/triggering/https-request), [Cloud SQL editions](https://docs.cloud.google.com/sql/docs/postgres/choose-edition), [Cloud Run SQL connections](https://docs.cloud.google.com/sql/docs/postgres/connect-run), and [Cloud Build submissions](https://docs.cloud.google.com/sdk/gcloud/reference/builds/submit).
