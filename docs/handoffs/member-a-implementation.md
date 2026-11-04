# A → B: implementation handoff, 3 November 2026

## Repository and scope

Repo private `https://github.com/auto4496/studytrack`; invitation sent to Datakung with Write. Board `https://github.com/users/auto4496/projects/2`, Datakung granted project WRITER. Initial document-only main/staging are not a product release

Branch `codex/member-a-sprint1` contains A's scaffold/F-01/F-03. Issues #1 and #2. Pre-code specs `11cdfe5`; meaningful red `2fc6252` (logout501 and invalid/missing goal rule behavior); initial green `a13858f` (same six tests pass). Final source version and execution results go in [verification](../verification/member-a.md). Human B review is still pending

Actual review PR: [#3 — Member A authentication and personal goals](https://github.com/auto4496/studytrack/pull/3), base `codex/sprint-1-staging`. Issues #1/#2 are In review on the project board, not Done. The PR is open and has not been self-approved or merged

Current source `016daba`:38 API/unit and10 browser tests pass, build/restart pass, audit0; see execution.json for per-command hashes (unchanged backend verified against c059044). Long-title overflow has its own red e06f4e4 and fixed browser coverage. Documentation/evidence commits after016daba do not change application source

## B should start from this foundation

After accepting repository invitation, clone/pull current repository and inspect A PR/branch before creating duplicate scaffold. To inspect A branch: `git fetch origin`, `git switch --track origin/codex/member-a-sprint1` in a clean local checkout. Do not overwrite B's existing work; make a separate local branch and reconcile interfaces

Normal feature branches still start from latest accepted `codex/sprint-1-staging`. Since A foundation is pending review, either review/integrate A first then branch F-02/F-04, or explicitly record a temporary dependency on A's unmerged branch and rebase/update after it is accepted. Never mark A accepted or self-approve on behalf of B

## Actual shared code and signatures

| File | Purpose |
|---|---|
| server/src/app.ts | `createApp({db,clock,config})`, API mounts; error handler after routers |
| server/src/auth/context.ts | `Dependencies`, trusted `req.principal`, `publicUser` |
| server/src/auth/middleware.ts | `requireUser(deps)`, `requireRole(role)`, `requireCsrf(deps)`, `requireJson` |
| server/src/auth/session.ts | cookie name `studytrack.sid`; server token/CSRF lifecycle; no raw token logs |
| server/src/clock.ts | `todayBangkok(clock)`, `dateString(date)`, `addDays(date,days)`; injectable clock |
| server/src/features/goals/service.ts | `requireOwnedGoal(db,goalId,userId)`, `targetForDate(db,goalId,date)`; authorize owner BEFORE target lookup |
| server/src/validation.ts | `pagination(query,extraSchema)`, `parseUuid`; strict fields/pagination |
| server/src/errors.ts | `ApiError(status,code,message,fields?)`, common safe envelope |
| server/prisma/schema.prisma + migrations | User/Session/Template/Goal/GoalTargetVersion/DailyEntry models; unique constraints and SQL checks |
| server/src/features/templates/read-router.ts | Real GET list/detail adapter for goal selection; extend/adopt in F-02 instead of mounting two competing GET routers |
| client/src/api.ts | shared cookie/CSRF API client and DTOs; unknown401 clears auth; unsafe requests never auto-replayed |
| client/src/auth/AuthProvider.tsx | current identity/login/logout lifecycle |
| client/src/features/goals/GoalDetail.tsx | optional `ActivityComponent` prop, exported `GoalActivityProps {goal,onSessionExpired?}` for B's real entry/progress UI |
| client/src/App.tsx + components/Layout.tsx | shared router/nav; coordinate changes, do not replace A screens |

## What A deliberately leaves to B

- F-02 manager POST/create template UI and its role/domain tests/contract; catalog read foundation can be adopted
- F-04 POST/GET entries and GET dated progress with real DB uniqueness/date/bounds/calculation rules and UI
- Complete feature inventory/requirements traceability/sprint plan/UI conventions and B's AC/STS
- Manager-created-template → participant-goal → daily-entry → persisted progress full E2E journey and B-specific access tests

Do not count read-only adapter as completed F-02, or presence of DailyEntry table as completed F-04

## Validation/integration rules

- Authenticate → role → CSRF for mutations → strict payload → owner-scoped lookup → domain transaction
- Participant only sees own private data; Manager gets403 at goals/entries/history/summary even if it knows IDs
- Goal snapshot bounds, not current template bounds, validate minutes; use effective target for entry date, not current target
- Entry unique(goalId,entryDate), goal partial unique(ownerId,templateId) whereACTIVE; handle DB conflicts as409
- Ownership/role never trusted from body. Unknown fields422; missing private record and other-user record404
- All dates Asia/Bangkok date-only, timestamps UTC. No browser-memory persistence substitute
- Applied SQL migration immutable. New schema change means new migration; coordinate with A

## Local tests and remaining review

Use README commands. `npm test` and E2E both reset guarded test DB; run sequentially. E2E fixtures are synthetic and separate from ignored .env demo passwords. Windows tests default Edge; other platforms install Chromium

Review source/test assertions/config/migration and actual red/green chain. Record specific findings in real PR review or B's review notes. A's automated checks are not your independent review or cross-team UAT. Keep IDs/dates/actual test results, and preserve incomplete status until integrated and reviewed
