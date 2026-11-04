# Member B verification ledger

## Current F02 verification after PR3 merge — 4 November 2026

Accepted staging1a4b74b merged into F02 without conflicts. Tested source5e340f8: **66 API/unit passes (A40+B26), 16 browser passes (A10+B6), 0 failures/skips, build and real API restart pass**. All DB-resetting checks ran sequentially against isolated studytrack_b_test. Current commands/results/screenshots and reviewer scope are in [F02 review handoff](../handoffs/f02-review-ready.md) and [execution metadata](../../artifacts/evidence/member-b/post-pr3-merge/f02/execution.json). A review/acceptance is pending; F04 and full Sprint1 release are separate. The earlier counts and temporary-dependency descriptions below are historical records from before PR3 acceptance.

F04 prior-base verification at0b51571 (115 API/unit +24 browser, real restart/build PASS) is retained below. F04 checks on the updated dependency are recorded separately after execution; peer acceptance/release/CI/GCP/UAT remain pending.

Pre-implementation: NOT RUN. Specs align A foundation2370df9. F02 depends temporarily on unmerged A PR3; F04 will depend on F02. No peer approval/accepted release/CI/GCP claims. Tests use isolated PostgreSQL studytrack_b_test on loopback26433, not A/dev DB. Runtime secrets in ignored env only. Actual evidence will be appended after execution with source commits/commands/counts/results and AC mapping

## F02 actual execution

Source a3769d4c16f101268a96496326bc18c3766660b5. Contract ee14477; red source0e1ca17. API red:15 fail/1pass (expected POST201/422/403, got404 from read-only adapter). Green:26 F02 unit/API checks; full API/unit regression64pass/0fail/0skip; selected browser6pass at desktop1440x900/mobile390x844. npm run build succeeded. Evidence [execution](../../artifacts/evidence/member-b/f02-execution.json), [red](../../artifacts/evidence/member-b/f02-red-output.txt), [regression](../../artifacts/evidence/member-b/f02-regression-output.txt), [browser](../../artifacts/evidence/member-b/f02-browser-output.txt). No A peer acceptance, CI, cloud or fullSprint1 release implied

| AC | Actual file/name IDs | Result / source |
|---|---|---|
| AC-F02-01 | server/tests/integration/templates.test.ts TEST-F02-01/11 | PASS / a3769d4 |
| AC-F02-02 | server/tests/unit/template-rules.test.ts TEST-F02-02; integration/templates.test.ts TEST-F02-03 | PASS / a3769d4 |
| AC-F02-03 | integration/templates.test.ts TEST-F02-04 | PASS / a3769d4 |
| AC-F02-04 | integration/templates.test.ts TEST-F02-05 | PASS / a3769d4 |
| AC-F02-05 | integration/templates.test.ts TEST-F02-06 | PASS / a3769d4 |
| AC-F02-06 | integration/templates.test.ts TEST-F02-07; e2e/member-b.spec.ts TEST-F02-10 | PASS / a3769d4 |
| AC-F02-07 | integration/templates.test.ts TEST-F02-08 | PASS / a3769d4 |
| AC-F02-08 | e2e/member-b.spec.ts TEST-F02-09 validation/pending/unknown-outcome/read-retry/empty (controlled UI errors); real persistence covered separately | PASS / a3769d4 |
| AC-F02-09 | e2e/member-b.spec.ts TEST-F02-10 real manager→template→participant goal | PASS / a3769d4 |

## Final F02+F04 increment — locally verified, peer acceptance pending

Tested source `0b51571c6d81a81921dca3e2596e0755488c8f1c`. Later commits change documents/evidence only. Specs ee14477; F02 red0e1ca17 → greena3769d4; F04 redd709741 → implementationb5f8e54 → final test/restart source0b51571. Issues #4/#5; temporary dependency on unmerged A PR3 and F02 parent branch

| Actual command | Result | Evidence |
|---|---|---|
| npm test (Vitest, real PostgreSQL) |115 pass/0fail/0skip,8 files; includes38 A regression +77 B checks | [output](../../artifacts/evidence/member-b/final-output.txt), [JSON](../../artifacts/evidence/member-b/final-results.json) |
| npx playwright test --config playwright.member-b.config.ts |24 pass/0fail/0skip (A10+B14), desktop1440x900/mobile390x844 | [output](../../artifacts/evidence/member-b/browser-output.txt), [JSON](../../artifacts/evidence/member-b/browser-results.json) |
| npx tsx scripts/member-b-restart.ts |PASS real child-process stop/start; same DB session/template/goal/entry45/target60/progress75 retrieved | [output](../../artifacts/evidence/member-b/restart-output.txt) |
| npm run build |PASS backend typecheck + client typecheck/production bundle | [output](../../artifacts/evidence/member-b/build-output.txt) |

Metadata: [execution.json](../../artifacts/evidence/member-b/execution.json). Final API suite ran after browser suite ended, then restart and build sequentially against dedicated studytrack_b_test. Private generated env credentials are ignored; artifacts checked for their values/raw cookie/CSRF tokens before commit. Package/lockfile/schema/migrations/auth source unchanged from A

### Failed/intermediate work disclosed

F04 pre-code API red:30failed/0passed (404 missing routes), source d709741; [red output](../../artifacts/evidence/member-b/f04-red-output.txt). First implementation feedback:5failed/44passed because clock advanced past8h auth expiry without re-login; fixed fixture re-login, retained expiry and boundary assertions. First full browser feedback:2failed/22passed because post-logout request ran before logout completed; fixed test to await /login before asserting401, retained assertions. Outputs/JSON retained with initial names. These intermediate runs were not accepted results; final source/run above supersedes them. Some intermediate49-check runs occurred in an uncommitted working tree; use final115-check source for reproducible green evidence

| AC | Actual file / test identifiers or evidence | Final status |
|---|---|---|
| AC-F04-01 | server/tests/integration/entries.test.ts TEST-F04-01/02; scripts/member-b-restart.ts | PASS locally |
| AC-F04-02 | entries.test.ts TEST-F04-01/02 (fresh app, empty day, sorted/paged list); e2e/member-b.spec.ts TEST-F04-16 | PASS locally |
| AC-F04-03 | server/tests/unit/entry-rules.test.ts TEST-F04-03; entries.test.ts TEST-F04-04 | PASS locally |
| AC-F04-04 | entry-rules.test.ts TEST-F04-05; entries.test.ts TEST-F04-06 (calendar/Bangkok midnight/start/today/query) | PASS locally |
| AC-F04-05 | entry-rules.test.ts TEST-F04-07; entries.test.ts TEST-F04-08 (types/custom min/max/1/1440) | PASS locally |
| AC-F04-06 | entries.test.ts TEST-F04-09 (unchanged original row, other own goal/date) | PASS locally |
| AC-F04-07 | entries.test.ts TEST-F04-10 (real competing API inserts, one201/one409/one row) | PASS locally |
| AC-F04-08 | entries.test.ts TEST-F04-11/12; browser TEST-F04-16 (anonymous/manager/cross-owner/logout) | PASS locally |
| AC-F04-09 | entries.test.ts TEST-F04-12/13 (CSRF/Origin/unknown keys/DB failure/DTO allowlist) | PASS locally |
| AC-F04-10 | entries.test.ts TEST-F04-14 (effective-date target, snapshot, archived bounds, missing target) | PASS locally; F05 lifecycle API still planned |
| AC-F04-11 | e2e/member-b.spec.ts TEST-F04-15 (real committed-but-aborted POST, reconciliation outage/recovery, stale reads,125%,future start,logout); controlledUI422/500 only for states | PASS locally |
| AC-F04-12 | e2e/member-b.spec.ts TEST-F04-16 real manager-created-template→goal→entry→reload→duplicate/future/access/logout; DB assertion by real API and integration suite | PASS locally |

F02 AC01–09 actual mapping above remains valid and all six browser cases ran again in the final24. Read-only/mock UI error fixtures are not counted as persistence proof; full journey/concurrency/ownership/restart use real API/PostgreSQL

### Selected evidence for D1 Part F (not a completed PDF)

Normal journey: [desktop75%](../../artifacts/evidence/member-b/desktop-daily-progress.png), [mobile75%](../../artifacts/evidence/member-b/mobile-daily-progress.png). Above-target: [desktop125%](../../artifacts/evidence/member-b/desktop-progress-125.png), [mobile125%](../../artifacts/evidence/member-b/mobile-progress-125.png). Recovery: [mobile unknown outcome](../../artifacts/evidence/member-b/mobile-entry-recovery.png). Expected/actual/source/roles in test names, assertions, execution metadata. No raw traces with session tokens committed

Still pending: A peer review, accepted staging/release on main, GitHub CI required gate, Docker/GCP persistence/deployment, independent UAT, D1 full self-contained PDF. Local green results do not imply those items passed

## Actual review chain references

[Issue4/F02](https://github.com/auto4496/studytrack/issues/4) → [draft PR6](https://github.com/auto4496/studytrack/pull/6), [Issue5/F04](https://github.com/auto4496/studytrack/issues/5) → [draft PR7](https://github.com/auto4496/studytrack/pull/7), authored through Datakung. PR6 temporarily depends on A PR3; PR7 depends on PR6. Neither is accepted/merged; A review and updated staging integration still required. No GitHub CI workflow/run added in this feature round

## PR3 independent review follow-up

Read [PR3 B review](../reviews/pr-3-member-b.md): separate exact-head check38API/10browser/build/restartPASS, plus2new host-alias guard regressionsFAIL. Submitted REQUEST_CHANGES asDatakung on2370df9. Earlier B115/24results remain historical tested-source results; they do not cover this newly confirmed guard defect. Actual configured B dev/test targets remained separate; no destructive alias probe was run. Keep BPR6/7draft until Afix/new-head review and staging acceptance
