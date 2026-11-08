# Application container contract

4 November 2026. Owner A/auto4496; reviewer B/Datakung. Specification before implementation. Product baseline: accepted Sprint1; current staging includes reviewed report PR11. This change implements packaging and local verification, not cloud deployment or CI acceptance.

## Design and boundaries

Build React and Express from the locked root package using Node24 Debian/glibc and Prisma6.19.3; generate Linux client/engine inside the build. Keep runtime production dependencies/build outputs separate from the migration/seed tool target. Runtime listens on PORT (default8080), serves built UI plus same-origin API, runs as non-root and exposes a DB-backed healthcheck. Migrations/seed are explicit one-off jobs, not destructive startup steps.

Use a dedicated Compose database/volume, distinct from existing StudyTrack dev/test. Only the HTTPS proxy binds a loopback host port. Existing production APP_ORIGIN/HTTPS and Secure cookie/CSRF/role/ownership behavior remain unchanged. A local Caddy internal CA supports this isolated verification; no Windows/system CA installation or app security downgrade. The public root certificate may be exported for an HTTPS test client; private CA keys stay in a Docker volume. GCP's public ingress later terminates HTTPS without requiring this local proxy.

No real environment files, Git history, host node_modules, reports, screenshots or unrelated sources enter the Docker build context. Runtime contains no seed credentials or development toolchain. Image revision is supplied as OCI label; credentials are injected only at run time. Base images are pinned by registry digest.

## Acceptance / planned verification

| ID | Preconditions / action | Expected result / evidence |
|---|---|---|
| AC-CTR-01 | Fresh clean checkout; generated private env; Docker build app/tools | Builds without source edits or host node_modules; image IDs/revision and real build log retained |
| AC-CTR-02 | Empty dedicated PostgreSQL; run migrate then seed twice | Schema ready; three users/two seed templates remain idempotent; no reset of existing projects |
| AC-CTR-03 | Run production runtime and local HTTPS proxy | Built UI/API reachable; health checks DB; Secure/HttpOnly/SameSite cookies; non-root runtime; no private env baked into image |
| AC-CTR-04 | Real HTTPS manager/participant workflow | Manager template -> own goal60 -> entry45 -> GET/reload75%; exact persisted IDs/values |
| AC-CTR-05 | Duplicate entry, anonymous, participant-manager and cross-owner requests; logout replay | 409 preserves first row;401/403/404 as applicable; no record leakage; revoked session denied |
| AC-CTR-06 | Save domain record and session; restart app; recreate app container with same DB | Same entry/goal/template ID,45/60=75% and session retrieval; new container ID after recreation; volume preserved |
| AC-CTR-07 | Inspect image/Compose/env and runbook | Settings documented; no host .env/private files; images reproducible; no database published to host; evidence/source attribution explicit |

API checks use an explicit exported local root CA; selected real browser checks use a scoped local test context. These are automated packaging checks, not independent human UAT or proof of GCP restart/redeploy. Any build/setup failure is reported as such, not mislabelled domain TDD.

## Completion and handoff

Actual executions/source versions are added only after running. B reviews implementation and assertions before staging acceptance. CI should consume runtime/tools targets and root scripts; cloud deployment injects DATABASE_URL/APP_ORIGIN/PORT and executes controlled migrations separately. Existing Sprint1 tests remain enabled. Original main/tag/PDF are not rewritten by packaging work. Pending cloud resource names, public URL, CI run/gate and GCP persistence remain explicitly unverified.

Primary implementation references: [Docker startup dependencies](https://docs.docker.com/compose/how-tos/startup-order/), [Prisma Docker deployment](https://docs.prisma.io/docs/guides/deployment/docker), [Caddy internal TLS](https://caddyserver.com/docs/caddyfile/directives/tls). Course source:01_SE_Lab_5_updated.pdf, R01/R02/R04/R08 and C03; local verification does not complete the cloud checks.

## Review correction contract - 7 November 2026

PR #15 review 4490582650 identified that inherited CONTAINER_DATABASE_URL overrides the private env file. Compose syntax validation alone does not constrain where migration/seed run.

| ID | Preconditions / action | Expected result / evidence |
|---|---|---|
| AC-CTR-08 | Resolve tools/app Compose config with the exact execution environment; inherited external or wrong-database URL; run preflight, startup or verifier | Reject before build, container start, migration, seed, API requests or lifecycle changes. App/migrate/seed must all target the dedicated db:5432/studytrack_container service with matching db credentials; override options cannot redirect it. Never print the resolved secret-bearing config. |

Add a read-only check command to expose the existing config check for a safe regression reproduction. Retain the actual failing inherited-override assertions before correction, then rerun the unchanged cases. Use effective Compose settings in the verifier so origin, credentials and image revision cannot diverge from what execution receives. Keep the current D1 README paragraph and the container runbook section when syncing staging. This is local-wrapper protection; controlled cloud jobs remain separate.
