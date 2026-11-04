# F-03 — Personal goals engineering contract

Version 0.1 / 3 November 2026 / owner A / reviewer B (not yet reviewed)

Status at v0.1 creation: SPECIFIED, NOT IMPLEMENTED, NOT EXECUTED. Update 3 November: A implementation and local verification now exist on `codex/member-a-sprint1`; teammate review/full B integration pending. [Current evidence](../../verification/member-a.md). Links FR-04/FR-07/FR-08/FR-19, BR-02/BR-03/BR-07, NFR-01/NFR-03/NFR-04/NFR-06/NFR-08. [SRS](../../srs.md), [System SDS](../../system-sds.md), [API contract](../../integration-contract.md)

## 1. Workflow and dependencies

Participant selects active template, enters integer target minutes and today/tomorrow start date, submits and sees persisted personal goal. Own list/detail retrieve committed records from database. Manager cannot use goal endpoints; other participant cannot retrieve goal details

Requires F-01 principal/role/CSRF, F-02 active templates, shared clock/errors/DB. During development F-02 fixtures can support tests, but accepted end-to-end evidence must include real manager-created template. F-04 consumes goal snapshot and targetForDate service

## 2. UI specifications

- `/goals`: own goal cards/list, start date/current target/status, loading/empty/error states, create action. Empty state links to template selection
- `/goals/new`: loads active templates; selected title/range visible; target integer input; date picker today/tomorrow; submit pending state; field errors preserve entered values. Empty active catalog shows useful instruction
- `/goals/:goalId`: snapshot title/unit/bounds, start/status/target plus integration area for B's daily entry/progress. Future-start goal shows start date and disallows premature entry in UI/backend
- 409 duplicate links to own goals; inactive template requires refreshing available list;401 goes to login without auto replay;403/404 safe screen. No current-user/owner selector
- Keyboard labels/focus and 390×844/1440×900 supported; B and A agree shared route/component props before editing root router

## 3. API/data and business rules

POST/GET `/api/goals`, GET `/api/goals/:goalId` use exact shared shapes. No edit/delete endpoint in S1

Create payload `{templateId,dailyTargetMinutes,startDate}` only; owner from server. Validate template UUID, real date, integer range and today/tomorrow using server clock. Missing template404; inactive422; concurrent/serial ACTIVE duplicate409

In transaction: read/validate template; insert Goal with snapshot title/unit/min/max, owner, statusACTIVE; insert initial GoalTargetVersion at startDate; commit together. Partial unique index protects one ACTIVE goal per owner/template. Any initial version failure rolls back entire goal. User role/goal date constraints service-enforced, not assumed from FK alone

Own list constrained ownerId and supports page/pageSize/status; detail uses owner-scoped query. DTO excludes owner/user password/session data. List target for future-start goal uses initial version; own detail query does not expose another owner's record. Target service for F-04 queries requested date and never substitutes latest target for historical date

No template range mutation endpoint in S1. S2 lifecycle changes must preserve snapshot and lock ordering per revised contract; they are not implicitly implemented here

## 4. Acceptance criteria

| ID | Observable expected result |
|---|---|
| AC-F03-01 | Participant creates goal from active template with valid target/today-or-tomorrow date;201 returns goal and DB contains goal+initial target version owned by session user |
| AC-F03-02 | Own list/detail retrieve the saved goal after new request and application restart using same durable DB; empty list is valid200 |
| AC-F03-03 | Out-of-range/fractional target, invalid/past/day-after-tomorrow date and unknown fields rejected; no partial goal/version rows |
| AC-F03-04 | Missing/inactive template yields404/422 respectively and no goal created |
| AC-F03-05 | Serial and competing requests for same owner/template produce exactly one ACTIVE goal and one initial target; losers409; different participants may use same template |
| AC-F03-06 | Anonymous401, Manager403, other Participant detail404; lists contain only own goals; client-supplied ownerId cannot assign another owner |
| AC-F03-07 | Goal snapshot matches template at creation and initial target is effective on startDate; future-start goal DTO valid; target lookup before start rejects rather than using an unrelated version |
| AC-F03-08 | UI creation/list/detail, validation, empty/error/session states work at required viewports and integrate with B's template/entry boundaries |

## 5. Software test specification

At contract creation all results were NOT RUN. Planned filenames below remain the original design; actual cases consolidated into goals.test.ts/goal-rules.test.ts plus restart-smoke.ts/browser spec are mapped in the verification record

| Test ID | AC | Level / inputs and action | Expected result | Planned file |
|---|---|---|---|---|
| TEST-F03-01 | 01,07 | API+DB; participant cookie/CSRF; active template1..1440; target60,start=today and separate template tomorrow |201; owner identity correct; snapshot+initial version consistent | server/tests/integration/goals.test.ts |
| TEST-F03-02 | 02 | API+DB; new client request, then restart API and relogin against same test DB |saved own record/list200; no row loss; seeded empty participant list200[] | server/tests/integration/goals.persistence.test.ts |
| TEST-F03-03 | 03 | unit+API; target0/1441/1.5; start past/+2/2026-02-30; missing/unknown fields; injected target-insert failure |documented400/422; transaction rollback leaves counts unchanged | server/tests/integration/goals.test.ts |
| TEST-F03-04 | 04 | API+DB; unknown UUID and inactive template |404 and422; goal count unchanged | server/tests/integration/goals.test.ts |
| TEST-F03-05 | 05 | API+DB; duplicate sequential then two simultaneous creates for fresh owner/template; second participant same template |one201 and one409 in race; one goal/version; second participant allowed | server/tests/integration/goals.concurrent.test.ts |
| TEST-F03-06 | 06 | API+DB; no session; manager; userB GET userA goal; userB list; payload ownerId |401/403/404; list excludes A; unknown ownerId422 with no reassignment | server/tests/integration/goals.access.test.ts |
| TEST-F03-07 | 03,07 | unit+API fixed clock at 2026-11-03T16:59:59Z then17:00:00Z; leap/month/year cases |today switches 3→4 Nov in Bangkok; date validity/range deterministic; effective target selected for date | server/tests/unit/goal-rules.test.ts |
| TEST-F03-08 | 08 | browser full manager-template→participant-goal→retrieve journey plus empty/invalid/duplicate cases |visible persisted goal, meaningful errors and usable layouts | e2e/goals.spec.ts |

## 6. TDD and definition of done

Selected meaningful TDD case: duplicate ACTIVE goal rule with DB concurrency protection, or target/start-date boundary. Keep actual red/green versions/output. Migration failure/config error is not rule failure evidence

DoD: complete ACs with real DB/unit/E2E results as appropriate; B review with specific findings; integration to staging and reviewed release process; docs/traceability/setup updated; actual commit/commands/counts attached. Incomplete/failed/skipped cases remain explicit. A implementation exists; B review, manager-created-template integration and full F-04 journey are still pending
