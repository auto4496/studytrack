# F-04 Daily entries and progress — engineering contract v0.2

วันที่ 3 พฤศจิกายน 2026 | Owner B | Reviewer A (pending)

สถานะ: contract before B code, dependent on A PR #3 and F02 branch. Original B draft in e3714d0 retained in Git. Implementation/test/acceptance results are recorded only after execution

## 1. Linked requirements / boundary

[SRS](../../srs.md): FR-04/11/12/19; BR-01/02/04/05/06/07/08/10/11; NFR-01/02/03/04/05/06/07/08. [Shared integration](../../integration-contract.md) is authoritative for /api, UUID, DTO/envelope, CSRF and errors. No F05 revision/lifecycle API, F06 correction/delete/history UI, or new schema/migration in this feature

## 2. Feature SDS / API / data

Participant opens own goal → picks valid Bangkok date → POST minutes → committed EntryDTO → GET progress/reload from PostgreSQL. Manager403; other/missing goal404 identical shape; principal owner only. Strict payload before owner lookup as existing A middleware; domain checks after owner. Use requireOwnedGoal/targetForDate/shared clock, existing DailyEntry UNIQUE(goalId,entryDate), Goal snapshots and target versions. Goal reader parameter types may be narrowed to accept transaction client, without changing A behavior

| Method | Input | Success |
|---|---|---|
| POST `/api/goals/:goalId/entries` | `{entryDate,minutes}` + session/CSRF/Origin | 201 `{data:EntryDTO}` including server targetMinutes/progressPercent/achieved |
| GET `/api/goals/:goalId/entries?page=1&pageSize=20` | bounded pagination, own goal | 200 `{data:EntryDTO[],meta:{page,pageSize,total}}`, entryDate DESC/id ASC |
| GET `/api/goals/:goalId/progress?date=YYYY-MM-DD` | required date, own goal | 200 `{data:{goalId,date,actualMinutes,targetMinutes,progressPercent,achieved,entryId}}` |

- Date is real YYYY-MM-DD; syntax400 INVALID_DATE, impossible/out-of-bounds422 with correct entryDate/date field. Allowed startDate..min(todayBangkok,endDate if set), inclusive; GET uses same date bounds. S1 goals ACTIVE normally; archived fixture may record historical dates within endDate per A BR11, no archive endpoint added
- JSON integer minutes within immutable goal snapshot range1..1440; no 0/fraction/string/boolean/null. Unknown keys including client owner/unit/target/version/progress/id/timestamps422
- Progress = actual/target*100; integer-ratio HALF_UP to 2 decimals; no cap. achieved uses actual>=target before rounding. Target resolved by entry date (including old effective version), never current goal target. Missing entry has actual0/progress0/achievedfalse/entryIdnull without row creation
- Duplicate sequential/concurrent →409 ENTRY_ALREADY_EXISTS; one winner201, exactly one stored row, never overwrite/upsert. Transaction locks owned goal row FOR SHARE, rechecks bounds and inserts; handle database unique error safely. Future lifecycle writers must use compatible lock order
- Errors use A fields:string/requestId;401/403/404/400/422/409/500; no data leakage, rollback on errors. Target missing is domain422, no success with default target

## 3. UI

Use GoalDetail ActivityComponent slot in existing route with props `{goal,onSessionExpired?}`. Date label, integer minute range, actual/target, unbounded percentage and achieved; bar may visually cap100 but label never caps. Future start shows notice/no invalid fetch. Loading/empty distinctly rendered; date changes discard stale responses; inputs/submit disabled while saving. Saved day disables new entry. Duplicate or unknown POST outcome GETs original date before manual retry, never auto-POST; if reconciliation GET fails block resubmit until successful read. Input remains on errors;401 clears private view through shared auth; no role selector. Usable at390x844 and1440x900 with labels/keyboard/field errors

## 4. Acceptance criteria / STS

All STS planned at contract version; real API+PostgreSQL fixtures Manager/P1/P2; injected Bangkok clock; each actual test name/result/commit later added to traceability

| AC | Expected observable outcome | Planned tests (level / preconditions, action → expected) |
|---|---|---|
| AC-F04-01 | Own valid entry201, exactly one persisted row with authoritative target/calculation | TEST-F04-01 API+DB: P1 goal60/day →POST45→GET/DB match75% |
| AC-F04-02 | Fresh app/GET/reload returns same entry; no entry returns null identity/zero without mutation; list paged | TEST-F04-01/02 API+DB: existing/empty owned days→read/list/new app→same record or entryIdnull; TEST-F04-16 browser reload |
| AC-F04-03 | 45/60=75,75/60=125,60/60=100,1/32=3.13; achieved exact | TEST-F04-03 unit ratio/boundaries; TEST-F04-04 API+DB: distinct fixtures→write/read→same percentages |
| AC-F04-04 | Date syntax400/calendar/range422; start/today included; Bangkok midnight/month/year correct | TEST-F04-05 unit fixed clock/date matrix; TEST-F04-06 API+DB before-start/future/impossible/missing query and valid endpoints→statuses/counts |
| AC-F04-05 | Snapshot range/min/max/integer only; invalid422 and no writes | TEST-F04-07 unit30..120 and1..1440; TEST-F04-08 API+DB parameterized invalid/boundary values |
| AC-F04-06 | Duplicate409/no overwrite; another own goal can record same date | TEST-F04-09 API+DB: original45→repeat75 plusP2 own goal→one unchanged row and valid other row |
| AC-F04-07 | Simultaneous requests yield one201/rest409 with exactly one stored row | TEST-F04-10 real API+DB: concurrent45/75 requests to same goal/date→status multiset/DB count/value |
| AC-F04-08 | Anonymous/revoked401,manager403,other/absent404; no private data/write | TEST-F04-11 API+DB: all GETlist/GETprogress/POST routes with role/owner fixtures; TEST-F04-12 logout replay |
| AC-F04-09 | Bad CSRF/origin403,unknown422, safe errors/DTO allowlist | TEST-F04-12/13 API+DB: invalid tokens, all injected fields, isolated failing DB trigger→no write/safe500 |
| AC-F04-10 | Initial/effective target and goal range snapshots govern history; archived date bounds respected | TEST-F04-14 API+DB: template changed/future target added/archived endDate→correct historical values and rejection afterendDate |
| AC-F04-11 | UI states/reconcile/date race/125%/session expiry work without duplicate POST | TEST-F04-15 browser: pending/delayed/aborted requests/409/422/5xx/401→state/input/recovery/viewport assertions |
| AC-F04-12 | Real manager-create→participant-goal→entry45→persisted75%→rejection/logout journey | TEST-F04-16 browser + realAPI/DB at both viewports; duplicate/future/cross-user/manager/revoked restrictions |

## 5. DoD / evidence

Commit contract/test design before implementation. Meaningful API red for missing entry/progress/concurrent behavior, then green; preserve versions/commands/counts/assertions. Run unit/API+DB/concurrency and selected UI journey/build plus A regression; separate guarded B DB, no dev/A DB resets. Map every AC to actual test names/result/source SHA. A review and staging integration/release still required; no invented PASS/PR/review/UAT/cloud evidence

## 6. Revision decisions

| Version | Change / rationale | Acceptance |
|---|---|---|
| draft01 | Standalone B interfaces e3714d0 | Historical |
| 0.2 | Align A /api, EntryDTO, paginated list/progress entryId, startDate/UUID, codes and field shape; BR11 archived historical bounds replace old B active-only proposal; HALF_UP specified | User authorized B implementation; A peer review pending |
