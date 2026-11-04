# StudyTrack

A CPE 334 reading habit tracker, theme 8. Managers create activity templates; participants set personal reading goals, record daily minutes and retrieve saved progress. Participant histories remain private from other participants and managers.

## Current increment

F-01 authentication/access, F-02 templates, F-03 goals and F-04 entries/progress are reviewed and integrated into `codex/sprint-1-staging` through PR3/6/7. Baseline: `85f510f0d73b84f39c08fbf3ef36e43b232bb044`. Latest feature verification: 117 API/unit and 24 desktop/mobile browser checks passed, zero failed/skipped; build and real API process restart passed. See [review/evidence](docs/reviews/pr-6-and-7-member-a.md). Reviewed main release and D1 PDF finalization are separate gates.

## Local setup

Prerequisites: Git, Node.js >=22.12, npm, Docker Desktop Linux engine, and a browser for Playwright. Default loopback ports: DB25432/25433, UI3000, API5000.

```sh
npm ci
npm run setup:local
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open APP_ORIGIN in private `.env` (default http://localhost:3000). API health: http://127.0.0.1:5000/api/health. Setup generates ignored `.env`/`.env.test.local` with random passwords, prints no values and preserves existing files. Manual configuration uses `.env.example`/`.env.test.example`; replace placeholders.

If UI/API ports are occupied, set APP_ORIGIN=http://127.0.0.1:3400 and PORT=5400 in `.env`, start `npm run dev:server`, and in a second PowerShell terminal:

```powershell
$env:API_PROXY_TARGET='http://127.0.0.1:5400'
npm run dev:client -- --port 3400
```

Use exactly the configured origin. If DB ports are occupied, update Compose port mappings and matching URLs consistently, or configure a separate PostgreSQL instance. Never reuse another project's database.

| Synthetic account | Role | Private password source |
|---|---|---|
| manager@studytrack.test | PROGRAM_MANAGER | SEED_MANAGER_PASSWORD in .env |
| student1@studytrack.test | PARTICIPANT | SEED_PARTICIPANT_PASSWORD in .env |
| student2@studytrack.test | PARTICIPANT | SEED_PARTICIPANT_PASSWORD in .env |

Seed creates three accounts/two templates. Reruns preserve existing records and passwords without duplicates. Read passwords privately; never put them in Git/reports. No self-registration/recovery in Sprint1.

## Build and verification

```sh
npm run db:test:migrate
npm test
npm run build
npx playwright test --config playwright.member-b.config.ts
npx tsx scripts/member-b-restart.ts
```

Run DB suites sequentially. They reset only TEST_DATABASE_URL, which must have a test marker and differ from development. The guard normalizes localhost case/root dot/loopback aliases. Never point tests at dev/production.

Combined browser config runs all A+B journeys at 1440x900 and 390x844, on 3310/5310, using installed Edge on Windows. Linux/macOS: `npx playwright install chromium`, or set PLAYWRIGHT_CHANNEL for an installed supported browser. `npm run test:e2e` also discovers all journeys, using 3100/5100 and the historical A output path. Runs may overwrite generated screenshots/JSON; committed evidence identifies recorded runs.

B restart smoke actually stops/starts the API and checks saved session/template/goal/entry/progress, then removes only its own synthetic rows. `npm run verify:restart` is the earlier A session/goal/target smoke. Neither proves cloud redeployment.

Production: build, then `npm start` with NODE_ENV=production, durable PostgreSQL, HTTPS ingress and configured environment. Express serves built UI and API; production cookies require HTTPS. Docker app packaging/CI/GCP is Lab5 work.

## Domain demonstration

Manager creates template1..1440 and signs out. Student1 selects it, sets target60/start today (Bangkok), records45 and retrieves75% after reload. Duplicate goal/date entry409 preserves the first row; future/out-of-range values reject. Student2 cannot read student1's goal/entries404; manager cannot use participant APIs403. Logout revokes the session401.

## Engineering and team

[SRS](docs/srs.md), [inventory](docs/features.md), [traceability](docs/traceability.md), [SDS](docs/system-sds.md), [plan](docs/sprints/plan.md), [contracts](docs/sprints/sprint-1/), [review workflow](docs/review-workflow.md), [team plan](docs/team-plan.md), [AI use](docs/ai-use.md). A=auto4496 (F01/F03/foundation); B=Datakung (F02/F04); both review the other and share design/testing/integration. [Board](https://github.com/users/auto4496/projects/2). Historical documents retain source-specific snapshots; use latest review/release records for current acceptance.

D1: one self-contained A-F PDF with reviewed main release/local evidence, due 8 Nov2026 23:59 Asia/Bangkok. Docker/CI/GCP:15Nov; UAT:22Nov; D2/Lab7:29Nov; Final:13Dec. F05..08/cloud/UAT remain later work.


## Application Docker packaging (Lab 5)

See [container quick start, environment and verification](docs/labs/lab-05/container.md). This is an isolated production-mode app/PostgreSQL/HTTPS stack; it preserves existing authentication and does not modify the development databases. CI/GCP remain separate work. Initial packaging validation is recorded after actual execution.
