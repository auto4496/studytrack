# Member A verification record

Date: 3 November 2026 (Asia/Bangkok). Scope: foundation + F-01 + F-03 on `codex/member-a-sprint1`; not a complete product release. Final execution manifest/results are recorded in `artifacts/evidence/member-a/` after code verification

**Actual final local result:**38 API/unit tests passed,10 browser tests passed,0 failed/skipped; build PASS, real API process restart PASS, dependency audit0 vulnerabilities. Latest UI/e2e source `016daba`; API/restart/audit run at `c059044` and `git diff --exit-code` confirms server/scripts/package/config paths unchanged through `016daba`. Exact full hashes/commands are in execution.json. Later commits add docs/artifacts only

Review handoff: [PR #3](https://github.com/auto4496/studytrack/pull/3) targets sprint staging; human teammate review and accepted product release remain pending

## Authentic TDD sequence

| Stage | Source commit | Command | Actual result |
|---|---|---|---|
| Pre-code specs | 11cdfe5 | documentation baseline | F-01/F-03 contracts recorded before app implementation |
| Red | 2fc6252 | npm test -- --reporter=verbose --reporter=json --outputFile=artifacts/evidence/member-a/red-results.json | 6 tests: 3 pass,3 fail,0 skipped. Logout expected204 received501; valid/invalid goal rule checks fail because not implemented. Actual PostgreSQL/login setup works |
| Initial green | a13858f | same suite with green-initial result filename | Same6 tests pass,0 fail,0 skipped after revocation/rule implementation; build passes |
| UI boundary red | e06f4e4 | npm run test:e2e -- --grep 'valid long activity' --reporter=line | Desktop long-title overflow fails; mobile case passes in that initial check. Subsequent check compares document width to configured viewport width to avoid mobile layout expansion hiding overflow |
| Expanded verification | API c059044; UI/e2e016daba; full hashes in execution.json | npm test; npm run build; npm run verify:restart; npm run test:e2e; npm audit | API/unit38 PASS, browser10 PASS,0 fail/skipped; build/restart PASS; audit0. Backend source equivalence checked |

Red/green files are actual outputs captured while working, not reconstructed from later success. Output clock labels from terminal may use host timezone; assignment deadlines/dates in docs use Asia/Bangkok

## AC-to-test mapping and limits

| AC | Actual checks/files | Status within A increment |
|---|---|---|
| AC-F01-01 | auth.test.ts TEST-F01-01; both roles, stored Argon2id and safe identity | implemented; see final results |
| AC-F01-02 | auth.test.ts TEST-F01-02; generic invalid credentials, normalization/strict fields | implemented; see final results |
| AC-F01-03 | auth.test.ts TEST-F01-03 and browser reload | implemented; see final results |
| AC-F01-04 | auth.test.ts TEST-F01-04 real DB revoke/replay/independent session and browser logout | implemented; see final results |
| AC-F01-05 | goals.test.ts TEST-F01-05/TEST-F03-06: anonymous/manager/cross-owner restrictions | implemented for A endpoints; Participant→manager template POST awaits B F-02 |
| AC-F01-06 | auth/goals.test.ts TEST-F01-06 origin/token/cookie/no-mutation checks | implemented for current endpoints; new B mutation paths require own checks |
| AC-F01-07 | auth.test.ts TEST-F01-07 old-token invalidation and fixed8h boundary | implemented; see final results |
| AC-F01-08 | e2e/member-a.spec.ts TEST-F01-08, desktop/mobile actual UI/API | implemented; see browser results |
| AC-F03-01 | goals.test.ts TEST-F03-01 real DB goal+initial version | implemented against real template fixtures |
| AC-F03-02 | goals.test.ts TEST-F03-02; scripts/restart-smoke.ts real API process stop/start | implemented; see restart output |
| AC-F03-03 | goals.test.ts invalid inputs and controlled DB trigger failure/rollback | implemented; see final results |
| AC-F03-04 | goals.test.ts missing/inactive template checks | implemented; see final results |
| AC-F03-05 | goals.test.ts TEST-F03-05 four simultaneous creates →one201/three409 and one goal+version | implemented; see final results |
| AC-F03-06 | goals.test.ts TEST-F03-06 real role/ownership/owner override/pagination | implemented; see final results |
| AC-F03-07 | unit/goal-rules.test.ts plus goal target versions/snapshots tests | implemented; future target-edit endpoint remains F-05 |
| AC-F03-08 | e2e/member-a.spec.ts TEST-F03-08 create/reload/retrieve/duplicate on desktop/mobile | A journey uses real seeded template; full Manager-create→entry/progress E2E waits for B |

No AC is marked teammate-accepted by this record. Plan file names in original STS may be consolidated into auth.test.ts/goals.test.ts; TEST IDs and assertions identify actual coverage

## NFR evidence and remaining work

- NFR-01/02: current API role/ownership/session/CSRF tests, safe DTOs, fixed expiry and production cookie settings. Recheck each B endpoint and real deployment later
- NFR-03: real API process restart smoke with durable PostgreSQL/session/goal; GCP redeployment is not yet tested
- NFR-04: setup/migration/seed commands exercised locally; test guard includes loopback aliases. Independent fresh clone/setup by B still pending
- NFR-05: actual outputs and commit chain maintained; CI quality gate belongs to Lab5 and is not claimed here
- NFR-06: selected real UI journeys at1440×900 and390×844, screenshots inspected. No claim of comprehensive accessibility audit
- NFR-07: ignored env values generated locally, no real credentials in tracked files; synthetic fixture strings in tests are deliberate. No claim of independent security certification
- NFR-08: fixed-clock date boundary, invalid date/range, leap-day and target-effective-date tests; F-04 entry date/progress and later streak/summaries await B/future sprints

## Known incomplete work

- B's F-02 manager create/UI and F-04 entries/progress; associated full Sprint1 acceptance checks
- B review of A contracts and code, staging integration/system checks and reviewed release to main
- Team member legal names/student IDs; full self-contained Deliverable1 PDF and complete baseline traceability
- Independent UAT/Lab6, maintenance approved change/Lab7, Docker application/CI/GCP delivery Lab5
- Final planned features and final-release regression. Current passing tests do not prove those unfinished features
