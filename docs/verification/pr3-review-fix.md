# PR #3 review correction: test database hostname aliases

Date: 3 November 2026 (Asia/Bangkok). Reviewer: Datakung. Reviewed head: `2370df9`.

## Finding and correction

[The review](https://github.com/auto4496/studytrack/pull/3#discussion_r4454538060) found that `LOCALHOST` and `localhost.` bypassed the same-database check when compared with `127.0.0.1`. PostgreSQL URL parsing preserves these hostname spellings. The guard now lowercases the hostname and removes a trailing DNS root dot before applying the loopback alias mapping. Both the test and development target use the same normalization.

Added the two requested regression inputs to the existing pure unit tests. They use synthetic URL strings and do not connect to or modify a database. The failing result was recorded before the implementation correction.

## Evidence

| Step | Source | Actual result |
|---|---|---|
| Regression red | db199eb | Guard suite: 7 pass, 2 fail on the requested aliases |
| Guard correction | d2efada | Guard suite: 9 pass, 0 fail |
| Affected regression | d2efada | API/unit: 40 pass, 0 fail, 0 skipped |
| Desktop/mobile browser | d2efada | 10 pass, 0 fail, 0 skipped |
| Build | d2efada | PASS |
| Real API process restart | d2efada | PASS: PostgreSQL session/goal/target persisted |

Actual commands: `npm exec vitest -- run server/tests/unit/test-db-guard.test.ts`, `npm test`, `npm run build`, `npm run test:e2e -- --reporter=list,json`, and `npm run verify:restart`, with report flags/paths in the captured output. Evidence is under `artifacts/evidence/member-a/pr3-review-fix/`; execution.json binds results to the full source commit. Browser JSON was parsed from that run's actual stdout capture, not reconstructed.

Normal suites ran only against A's guarded dedicated test database. This fix did not reproduce destructive behavior against the development database. Existing local edits to README.md, member-a-implementation.md and member-a.md were left outside this change.

## Review status

The correction is ready for Datakung to review on the new head. The previous changes-requested review has not been dismissed or self-approved. PR #3 is not merged; PRs #6/#7 remain dependent and full Sprint 1 acceptance is still pending.
