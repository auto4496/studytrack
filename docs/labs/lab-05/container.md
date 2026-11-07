# StudyTrack application containers

Owner A, reviewer B; Lab5 Issue14. [Contract and ACs](container-contract.md). This is the local Docker/config/persistence increment. Actual result/source are recorded in the verification section after execution. CI/gate/GCP, public URL and cloud restart/redeploy remain separate work led with B.

## Prerequisites and quick start

Docker Desktop/Linux containers, Git and Node>=22.12. No local PostgreSQL or application node_modules is needed to build/run the containers. The optional browser verifier needs `npm ci` and Edge on Windows or Playwright Chromium on other platforms.

```sh
node scripts/setup-container.mjs
node scripts/container.mjs check
node scripts/container.mjs up
```

This builds the runtime/tools images from locked packages, starts an isolated PostgreSQL, applies migrations, runs the idempotent synthetic seed and starts the app/HTTPS proxy. Fresh build: add `--fresh-build`. Default project is `studytrack-container`; the verification run uses `--project studytrack-container-review`. Existing dev/test Compose and ports25432/25433 are untouched.

Local origin is `https://localhost:3443`. Production mode still requires HTTPS and Secure cookies. Caddy uses an internal local CA in a named volume; browsers may not already trust it. No system CA or browser security setting is changed by these scripts. API verification explicitly trusts the exported public root certificate; the automated browser verifier uses a scoped local context and blocks all external requests. This local proxy is unnecessary behind GCP's public HTTPS ingress.

Synthetic accounts: manager@studytrack.test, student1@studytrack.test, student2@studytrack.test. Read generated CONTAINER_MANAGER_PASSWORD / CONTAINER_PARTICIPANT_PASSWORD privately in ignored `.env.container.local`; they are never printed. No real password, session cookie or CSRF value belongs in evidence.

```sh
npm ci
# Non-Windows browser prerequisite if needed: npx playwright install chromium
node scripts/verify-container.mjs --project studytrack-container --browser --lifecycle
node scripts/container.mjs stop
```

`--lifecycle` restarts the named app, recreates its container, restarts the dedicated database and checks that the same saved IDs/values/session remain. It never removes volumes or resets records. `stop` retains all data; `up` resumes with idempotent migrations/seed. Verification creates synthetic domain records and intentionally retains them as before/after evidence. It refuses a project outside the studytrack-container namespace. Before startup or verification, a shared preflight resolves the effective Compose config with tools included and checks app/migrate/seed against the dedicated `db:5432/studytrack_container` service and matching database credentials. Inherited overrides are included in the check; external targets, other databases/users/ports, URL query overrides and fragments are rejected before startup operations. The verifier uses effective settings for origin, seed credentials and image revision as well.

## Targets and layout

`runtime`: production dependencies, Linux-generated Prisma engine, compiled Express and React assets, openssl/CA support; non-root node, read-only rootfs with temporary /tmp, DB-backed healthcheck. It binds PORT (8080 by default) on0.0.0.0. No Prisma CLI, seed source, private env or host dependencies are shipped in this image.

`tools`: build-stage toolchain and seed source for explicit one-off migrate/seed operations. `migrate` uses `npm run db:migrate`; `seed` uses `npm run db:seed`. These are distinct from the serving container and can later be used by a controlled deployment job. No runtime startup script resets or seeds the database.

Dockerfile pins Node24 Debian, PostgreSQL17 and Caddy image digests. Dockerignore allows only package/build/Prisma/application inputs; Git, private .env files, reports, screenshots, certificates and host node_modules are excluded. The runtime OCI label org.opencontainers.image.revision comes from CONTAINER_VCS_REF; setup refreshes only source metadata while preserving existing private configuration. Run setup again after checking out a new source revision.

## Environment contract

| Setting | Purpose / secret / source |
|---|---|
| CONTAINER_DB_PASSWORD | Secret random hex generated locally; PostgreSQL password |
| CONTAINER_DATABASE_URL | Secret PostgreSQL URL using service db and database studytrack_container; generated from that password |
| CONTAINER_MANAGER_PASSWORD | Secret generated manager seed password; tools seed job only |
| CONTAINER_PARTICIPANT_PASSWORD | Secret generated participant seed password; tools seed job only |
| CONTAINER_APP_ORIGIN | Exact local HTTPS origin; default https://localhost:3443 |
| CONTAINER_HTTPS_PORT | Loopback proxy port3443; change this and APP_ORIGIN together if occupied |
| CONTAINER_IMAGE_TAG | Image tag derived from current Git revision; non-secret |
| CONTAINER_VCS_REF | Full source commit used in OCI image label; non-secret |
| DATABASE_URL / APP_ORIGIN / PORT / NODE_ENV | Standard runtime interface injected into app; NODE_ENV=production, PORT=8080 in local Compose; no new application policy |
| SEED_MANAGER_PASSWORD / SEED_PARTICIPANT_PASSWORD | Standard seed interface injected only into tools seed job |

The serving app receives no seed passwords. PostgreSQL is internal to the Compose network with a named data volume; it has no published host port. Root `.env.example` still documents existing application settings; `.env.container.example` documents all wrapper settings. Never print or capture raw `docker compose config` output, because interpolation can expose private values. The helper captures resolved JSON privately in memory, emits only sanitized errors, and uses one inherited-environment snapshot for both preflight and execution. `node scripts/container.mjs check` performs this read-only preflight without starting services. For the inherited-override regression suite, run `npm run test:container-config` (Node and Docker Compose required; no database or application start).

## B integration and release

CI can `docker build --target runtime --build-arg VCS_REF=<full-sha>` and build `--target tools` separately. Existing npm tests continue to use their isolated PostgreSQL service. Keep the root package/lockfile model; do not copy TokTickIT server/client package assumptions. Cloud injects real DATABASE_URL and public HTTPS APP_ORIGIN; uses PORT from ingress and performs controlled migration/seed jobs without destructive reset. The local Caddy service is a verification convenience and is not required cloud infrastructure.

The required deployment.md will combine this local container contract with B's actual CI/cloud/resource names and deployment run IDs. None are invented here. A local container recreation is not evidence of GCP redeployment. Follow Issue14 -> teammate-reviewed packaging PR -> staging -> reviewed release/main -> later pipeline; retain failing/intermediate output and actual source hashes.

## Verification status

Final tested source: `ee56d91dd4abf52f4c6bf13c5080c0f289620cc7`. Clean tracked source in the fresh review clone; no-cache Docker build and explicit migration/seed completed. Repeated seed returned3users/2templates. Verification ran with both `--browser` and `--lifecycle`: **35 checks passed, 0 failed**. Desktop1440x900 and mobile390x844 screenshots were visually inspected. Linux runtime is Node24.22.2/x64, uid1000; Prisma6.19.3. Prisma CLI, TypeScript, Vite and Playwright are absent from the serving image.

[Actual source/command/result manifest](../../../artifacts/evidence/lab5-container/manifest.json), [all assertions](../../../artifacts/evidence/lab5-container/final/execution.json), [build log](../../../artifacts/evidence/lab5-container/final/build-output.txt), [verification output](../../../artifacts/evidence/lab5-container/final/verification-output.txt), and desktop/mobile screenshots are retained. Actual saved IDs/45/60=75% and the DB session remained after app restart, actual app-container recreation and database restart. No existing dev/test databases were reset.

| AC | Actual evidence |
|---|---|
| AC-CTR-01 | Clean tracked-source/no-cache build output; OCI source matches tested commit; built UI and JS asset served |
| AC-CTR-02 | Explicit migrate/seed in build/start log, seed rerun log and3/2 count output |
| AC-CTR-03 | Non-root/read-only/internal DB/private-file assertions; Secure/HttpOnly/SameSite cookie checks; actual HTTPS browser login/reload |
| AC-CTR-04 | Template -> own goal -> saved45/60=75% assertions and screenshots |
| AC-CTR-05 | Anonymous401, participant403, cross-owner404/no data, manager403, CSRF/Origin403, invalid422, duplicate409/no overwrite, logout/replay401 |
| AC-CTR-06 | Same record/session comparisons after each real lifecycle operation; recreated-container-ID assertion |
| AC-CTR-07 | Allowlisted context, env table/runbook, metadata/runtime inspection and no private .env/Git/toolchain files in serving image |

Initial source0575518 and peer-only correction089b6ac each stopped at the same runtime-containment assertion (4 passed,1 failed); Prisma CLI was classified devOptional. The final Dockerfile also omits optional dependencies, while the same assertion and Argon2/Prisma runtime behavior remain enabled. Raw failed reports and a successful isolated dependency probe are retained; no failing assertion was removed. One stale-checkout build was interrupted and is separately identified. These are packaging failures, not domain-TDD claims.

This supports local R01/R02 and C03 plus a local persistence rehearsal. Public GCP workflow/restart/redeploy, CI passing/blocked-required-check runs, public visibility and pipeline C04-C06 are still pending. B peer review/staging acceptance of this packaging PR is pending; passing local automation is not independent human UAT.

## PR #15 review correction - 7 November 2026

Datakung independently passed the original 35 production-container checks and a Compose stop/start persistence rehearsal, then requested an effective database target guard (review comment4490582650). A safe read-only preflight reproduction recorded1pass/2fail: Compose accepted inherited external and wrong-database targets despite a safe env file. The same three assertions pass after the correction; the expanded suite covers21checks including both entry points, independent consumer drift, credential/schema/port boundaries and secret-free errors. Actual versioned logs and final runtime results are recorded after execution in the review-fix evidence. The current D1 README instructions and local Docker runbook are both retained in the staging merge. Re-review of the correction remains required before integration.
