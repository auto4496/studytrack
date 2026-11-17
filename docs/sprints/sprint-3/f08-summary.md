# F-08: owned period summary and integrated completion contract

Version0.1 proposed15November2026, Asia/Bangkok. Owner B / Pitchai / Datakung; reviewer A / Phanuwit / auto4496. [Issue63](https://github.com/auto4496/studytrack/issues/63). **PRE-CODE PROPOSAL / A_REVIEW_PENDING. F08 product and executable tests are NOT_IMPLEMENTED / NOT_RUN.** The user authorized preparing the next work in advance. This document defines decisions for peer review; documentation arithmetic and baseline CI do not demonstrate an implemented summary.

## 1. Sources, baseline and scope

Read with [SRS](../../srs.md) FR18/FR19/FR04, BR06/07/08/10/11/12 and applicable NFR01-08; [inventory](../../features.md), [team plan](../../team-plan.md), [Sprint plan](../plan.md), [SDS](../../system-sds.md), [shared interface](../../integration-contract.md), [UI conventions](../../ui-api-conventions.md), [F04](../sprint-1/f04-entries-progress.md), [F05](../sprint-2/f05-lifecycle.md), [F06](../sprint-2/f06-history-streak.md) and [F07](f07-schedule.md). Keep existing requirement IDs and allocation.

Baseline is accepted staging **0d79511d2862a4c7bf61cb54380d6601ff644e6e**: A approved F06 PR60 and B approved F07 [PR62](https://github.com/auto4496/studytrack/pull/62#pullrequestreview-5910428283), then its owner merged into staging. F06 release PR61 produced main005c20f and successful Deploy43688319047; those GitHub pipeline facts are separate from remaining live feature acceptance. F07 implementation acceptance is not a claim that its additive migration is deployed. This preparation does not close Issues54/58 or a Sprint.

The participant reads real own period totals, daily breakdown and per-goal results, for all owned goals or one selected owned goal. It includes retained archived goals and uses snapshot titles/date-effective targets. No manager/global view, export/PDF/CSV, charts requirement, leaderboard, mutation, new audit/cache table, migration, schedule query, external notification or reimplementation of F06 editing/streak is proposed. Integrated completion means appropriate baseline regression and later acceptance; it cannot substitute for the FR18 summary workflow, Lab6 inter-team UAT or Lab7 approved maintenance exercise.

## 2. Decisions for A before code

| Decision | Proposed observable behavior |
| --- | --- |
| Period | Inclusive Bangkok dates. Without both bounds, default Monday..today of the current server week. One missing bound is422. UI presets: week-to-date, previous complete Monday..Sunday, last7 dates including today, or explicit custom. Presets derive from returned server today, not browser time. |
| Bounds | Valid from<=to<=server today, proposed maximum366 inclusive calendar dates. Future custom bounds are422; a future-start goal still returns an empty200 for an otherwise valid past/current range. The366 limit is a proposed bounded product window, not an instructor rule or historical-data deletion. |
| Eligible goal-days | For each selected goal intersect requested range with startDate..min(endDate when present,today). Count every calendar date in that intersection, including missing entries and unscheduled days. Archived status does not remove historical contributions. |
| Target denominator | Sum the target effective on every eligible goal/date, including dates with no entry. Ignore pending versions beyond the goal end or query end. Never substitute current target, current template range or only logged dates. |
| Actual and achievement | Sum stored eligible entry minutes. Missing eligible date means actual0 and not achieved. A goal-day qualifies only when its own actual>=its own historical target, using exact integers before percentage rounding. |
| Goal-days vs user dates | achievedGoalDays sums qualifying goal/date pairs. achievedDates is the union of dates with AT LEAST ONE qualifying selected goal, counting a date once. UI must say this explicitly; it is not a count of dates when every goal was completed. eligibleDates is the union of eligible dates; eligibleGoalDays counts pairs. |
| Aggregate percentage | Uncapped HALF_UP to2 decimals of100*totalMinutes/targetMinutes. It is a weighted ratio, not the mean of rounded per-day/per-goal percentages, nor an achievement-day rate. Same formula applies to each day and per-goal row. |
| No denominator | When targetMinutes=0, percentage is null and UI displays an explanation/dash, not100% or a fabricated0% success. Totals/counts remain0. An eligible goal with missing target history is a safe422 consistent with existing target lookup, never silently zero-filled or omitted. |
| Goal selection | All owner goals by default; optional goalId means exactly one owner-scoped goal. Foreign/absent selection returns identical404 even when the range has no overlap. Future/out-of-window own selection retains its context with zero contributions. No status filter silently drops archives. |
| Pagination | Only positive-overlap per-goal rows are paged,20 default/max100; totals and daily series cover the entire selected set regardless of page. An out-of-range page is200 empty rows with unchanged totals. |
| Consistency | One owner-scoped RepeatableRead snapshot and one server Clock instant for goal bounds, target versions, entries, counts and all aggregates. A racing correction/target/stop/create can produce a coherent before or after result, never mixed components. |
| UI/shared changes | Isolated participant SummaryPage at /summary, a participant-only App route and Layout link; existing API/AuthProvider/error/Clock conventions remain. Goal picker uses all pages of existing owned goals, with archived/future labels. Coordinate these exact shared files with A before implementation. |

The ANY-goal union, denominator, empty ratio, presets/366 limit and shared UI boundary are explicit proposed refinements requiring A acceptance. SRS BR12 requires distinct dates but does not by itself decide ANY versus ALL; no instructor requirement or teammate approval is invented here. F07 intention/reminder settings never imply activity or modify summary eligibility.

## 3. API and wire DTO

Propose GET `/api/summary`, mounted through a new feature router using the existing requireUser and Participant role guards, before the API404 handler. It is not a public/manager endpoint. Cookie authentication and Cache-Control:no-store stay in the foundation. No domain write or CSRF token is needed for this GET; normal session/bootstrap behavior is separate. Reject nonempty parsed body and unknown query keys with422.

Allowed string query keys: from/to (both absent or both supplied), goalId optional valid UUID, page default1/max1000000, pageSize default20/max100 using the existing pagination helper. Reject arrays/duplicates, empty/wrong-type bounds, timezone/ownerId/userId/status/preset/sort injection and unrecognized options. Examples:

```text
GET /api/summary
GET /api/summary?from=2026-11-02&to=2026-11-06
GET /api/summary?from=2026-11-02&to=2026-11-06&goalId=<owned-uuid>&page=1&pageSize=20
```

Malformed date syntax/UUID400; well-formed impossible date, reversed/future/over366-day range, missing paired bound or invalid shape422 with relevant field errors; anonymous/expired/revoked401; Manager403; valid foreign/absent goal404; unexpected persistence/read failure safe500. Apply role before private lookup. Missing owned goals/no overlap is200, distinct from denied/missing selected goal. Reuse existing calendar parsing and safe error mapping without weakening other features.

Successful response is `{data:SummaryDTO}`; it deliberately uses an aggregate envelope, not the F04 collection DTO:

```ts
type SummaryGoal = {
  id: string; title: string; status: "ACTIVE" | "ARCHIVED";
  startDate: string; endDate: string | null; // snapshot title / canonical Bangkok dates
};
type GoalMetrics = {
  eligibleDays: number; entryCount: number;
  totalMinutes: number; targetMinutes: number; achievedDays: number;
  progressPercent: number | null;
};
interface SummaryDTO {
  evaluation: { evaluatedAt: string; today: string; timeZone: "Asia/Bangkok" };
  range: { from: string; to: string; calendarDays: number };
  filter: { goal: SummaryGoal | null }; // null = all own goals, never all users
  totals: {
    eligibleGoalCount: number; eligibleGoalDays: number; eligibleDates: number;
    entryCount: number; totalMinutes: number; targetMinutes: number;
    achievedGoalDays: number; achievedDates: number; progressPercent: number | null;
  };
  days: Array<{
    date: string; eligibleGoalCount: number; entryCount: number;
    totalMinutes: number; targetMinutes: number; achievedGoalCount: number;
    hasAchievement: boolean; progressPercent: number | null;
  }>;
  goals: Array<{
    goal: SummaryGoal; eligibleRange: { from: string; to: string }; metrics: GoalMetrics;
  }>;
  pagination: { page: number; pageSize: number; total: number };
}
```

days contains each requested date, ascending, at most366, including dates with no eligible goals (zero counts/targets/actual, hasAchievement=false, percentage=null). Per-goal rows include positive-overlap goals only, ordered startDate DESC then id ASC. pagination.total equals eligibleGoalCount, independent of the page. A selected future/out-of-window own goal appears in filter.goal; goals=[],total0,totals zero/null and the dated zero series explain the absence of eligible dates. An eligible goal with no entries still has a target denominator, eligibleDays>0 and progress0, rather than the no-denominator state. No owner identifiers, credentials, session/internal SQL fields, mutable current template values or schedule IDs enter the DTO.

## 4. Calculation specification and independent fixture

For goal g let I(g) be its inclusive intersection. target(g,d) is the latest effective target version <=d. actual(g,d) is the sole stored entry or0. Let A(g,d)=1 only for an eligible pair whose actual>=target. totalMinutes=sum(actual),targetMinutes=sum(target),eligibleGoalDays=sum(length(I)),achievedGoalDays=sum(A); eligibleDates and achievedDates count distinct dates in the corresponding unions. entryCount counts actual eligible rows, not synthesized zero days. eligibleGoalCount counts positive intersections. All totals are computed before per-goal slicing; the same selected domain supplies every returned component.

Calculate HALF_UP from exact aggregate integer sums, without intermediate rounding/capping or floating-point tie assumptions. Do not call existing progressFor with aggregate totals: its daily1440 guard remains authoritative for daily entries and is not an aggregate limit. Reuse the rounding policy in a new scoped helper with checked safe integer/exact arithmetic. Compare exact actual/target before rounding achievement. A malformed stored target history cannot manufacture a valid denominator.

Fixed server today2026-11-06, requested2026-11-02..06. Goals A and B belong to the same participant. A starts11-02, target30 until11-03, target60 effective11-04, is archived with inclusive end11-05; a retained pending120 effective11-06 does NOT contribute. B starts11-03 with target20 and remains active. Stored entries:

| Date | A actual/target | B actual/target | Daily actual/target | Qualifying goals |
| --- | --- | --- | --- | --- |
|11-02|30/30|outside lifecycle|30/30|A|
|11-03|missing0/30|20/20|20/50|B|
|11-04|30/60|5/20|35/80|none|
|11-05|90/60|20/20|110/80|A,B|
|11-06|after A end|missing0/20|0/20|none|

A:150/180 minutes,4 eligible dates,3 entries,2 achieved days,83.33%. B:45/80,4 eligible dates,3 entries,2 achieved days,56.25%. Aggregate totals are:

```json
{"eligibleGoalCount":2,"eligibleGoalDays":8,"eligibleDates":5,"entryCount":6,"totalMinutes":195,"targetMinutes":260,"achievedGoalDays":4,"achievedDates":3,"progressPercent":75}
```

11-05 progress is137.5%, with2 achieved goal-days but just1 distinct achieved date. An average of the per-goal percentages would be69.79% and is WRONG for this aggregate. Changing only the history page/pageSize leaves every total/day unchanged. Selecting A yields its150/180 and2 achievedDates; selecting B yields45/80 and2 achievedDates. A legal F06 correction of A's11-04 from30 to60 yields225/260=86.54%,5 achievedGoalDays and4 achievedDates, with original IDs/date/count/target versions unchanged. Refresh must retrieve that value; summary never edits the entry.

Separate fixtures cover actual1/target32 ->3.13%, actual75/target60 ->125%, missing-date target contributions, no eligible denominator ->null, equal dates across goals/users, and a new goal ID reusing a stopped goal's template (count separate goal-days; deduplicate user dates only). Today-relative F06 streak and summary's chosen period metrics remain distinct. This arithmetic is a specification example, not executed F08 behavior.

## 5. Data/service design and read consistency

Use existing Goal, GoalTargetVersion and DailyEntry only. GoalSchedule/GoalScheduleDay are not queried and no schema/migration/backfill/cache is proposed. Owner scope applies in the database query before loading private rows. For selected goal use owner-scoped lookup inside the transaction even if there is no overlap. For all goals query only principal-owned goals; do not select by a client owner field.

Begin one RepeatableRead transaction; the first owner-goal query establishes its snapshot, then capture one injected Clock instant. Derive today, default week, request validation and eligible intersections once; read required version/entry data in batched snapshot queries. Load a predecessor target effective at/before each eligible interval plus relevant revisions, or all required <=end versions in a bounded query design; never lose the predecessor by filtering effectiveFrom>=from alone. Reuse the accepted historical lookup semantics. Avoid per-date/per-goal target SQL queries, N+1 reads and scans of all users' history. Iterate at most366 output dates; do not iterate years of missing history outside the requested window. Large owned goal counts still require real measurement; this proposal makes no production-scale SLA claim.

Build all totals, distinct-date unions, daily series and canonical per-goal rows from that snapshot, then paginate rows. ReadCommitted across separate queries is insufficient: a simultaneous F06 correction, F05 stop/target change, F04 create or newly created goal must not mix old count/bounds with new actual/target values. A read needs no Goal write locks and must not alter existing writer ordering, timestamps, schedule state, entry/goal/target count or stored history. Test snapshot behavior with observed barriers and real committed competing writes; GET should show a complete earlier snapshot, with a later request seeing the later state. A failed read returns one safe error instead of a partial success aggregate. Clock crosses midnight only between requests, never within one returned range/day set.

## 6. UI, freshness and recovery

SummaryPage at /summary is under the existing participant-only Protected route, with a participant Layout link and real same-origin API. Label the server date/timezone, applied range and selected goal separately from editable draft filters. Provide week-to-date/previous-week/last7/custom controls, an owner goal selector with pagination through the existing goal collection (including archived/future goals beyond the first20), Apply, Reset-to-current-week and manual Refresh. Derive preset dates from authoritative returned today; browser2031 versus server2026 must not alter eligibility. Initial/default request may omit bounds so the server supplies current week; use its response as the clock reference for subsequent presets. Hide no goals silently when a picker page changes; its paging is separate from per-goal result paging.

Show total minutes versus historical target, eligible goal-days and distinct eligible dates, achieved goal-days and the explicitly labelled "วันที่มีอย่างน้อยหนึ่งเป้าหมายสำเร็จ", plus weighted progress. Provide readable per-day and per-goal rows, canonical title/status and links back to the existing owned goal page/history. Missing entries remain visible as zero actual with a real target. Explain null progress/no eligible dates, empty owner set and future/archive bounds. Selecting an archive must not look like deletion of history. No visual chart is needed to satisfy these quantities.

Use labelled date/goal controls, associated field errors/keyboard focus, loading/empty/forbidden/session/server-error states and usable1440x900/390x844 layouts without horizontal page overflow. Applying invalid input preserves drafts and field errors without issuing a different silently clamped range. Never relabel old data with draft/new bounds; while a new applied query loads, show loading rather than presenting the old metrics as its result. On read failure show retry, not fabricated zero success. Returning focus/manual refresh retrieves new corrections/targets/entries/stops without discarding unapplied filter values. No automatic write or mutation reconciliation is needed for this read-only feature.

Guard/abort stale reads across query/page/goal changes and unmount. Paging must not restrict aggregate totals or the daily domain. Accept each returned aggregate atomically: if underlying data changes between requests, a new page response may legitimately update totals/days too; never combine old cached metrics with new rows. No snapshot token or cross-request frozen dataset is promised. A default query without bounds refreshes its server week when the server date changes; a custom applied range stays explicit, with unapplied drafts preserved. On expired/revoked session clear private data through existing auth behavior, return to sign-in and never replay a prior mutation. No timer/background notification or change to F04/F06/F07 forms/callbacks is planned. Shared source edits are limited to the reviewed App route/Layout link and server app mount; any extra DTO/schema/shared behavior needs an explicit reviewed refinement.

## 7. Paired acceptance criteria and planned software tests

Each group is a planned AC/TEST pair, not an execution count. All22 groups are NOT_IMPLEMENTED / NOT_RUN until real tests/source/results exist in the [verification ledger](../../verification/f08.md).

| AC / TEST-F08 | Preconditions/actions | Required observable result |
| --- | --- | --- |
| AC-F08-01 / TEST-F08-01 | Owned multi-goal fixture; absent bounds; explicit week/previous-week/last7/custom | Correct server week-to-date/default and inclusive applied range; DTO ownership/context; real persisted totals |
| AC-F08-02 / TEST-F08-02 | Missing paired, malformed/impossible/reversed/future dates, arrays/duplicates/unknown/page errors |400/422 and associated fields; no clamping, fallback to a different period or write |
| AC-F08-03 / TEST-F08-03 | Target revisions before/inside/after window, pending after archive; compare F04/F06 target lookup | Initial predecessor and date-effective denominators exact; no current-target or logged-only denominator |
| AC-F08-04 / TEST-F08-04 | Missing eligible entry dates and no eligible goal on some requested dates | Missing eligible days have target/zero actual; outside lifecycle has target0/null%; counts and ordered series exact |
| AC-F08-05 / TEST-F08-05 | Two goals qualify on same date, partial entry, same date of another participant | Goal-days count pairs; user dates are ANY qualifying selected-goal union; partial/unowned rows excluded |
| AC-F08-06 / TEST-F08-06 | Section4 fixture plus1/32,75/60, weighted versus mean percentages |195/260=75%,3.13%,125%, exact achievement before rounding and aggregate inputs beyond daily1440 allowed |
| AC-F08-07 / TEST-F08-07 | No goals; no positive overlap; selected owned future/out-of-window goal |200 zero/null totals and zero series; selection context retained; never fake100% or private404 leak |
| AC-F08-08 / TEST-F08-08 | Archived bounds; inactive/renamed template; same template reused by a new goal ID | Inclusive old contributions/snapshot labels; separate new goal history and deduplicated user dates |
| AC-F08-09 / TEST-F08-09 | Real F06 minute correction and reload, F05 pending target update then effective boundary |225/260 and new distinct counts after correction; same original identity; only eligible effective targets contribute |
| AC-F08-10 / TEST-F08-10 | Configured/disabled/empty F07 schedule and unscheduled/missing dates | Summary exactly independent of schedule intent/toggle; unchanged streak/entry/target semantics |
| AC-F08-11 / TEST-F08-11 | Anonymous/expired/revoked, Manager, foreign/missing selected goal under otherwise valid request |401/403/indistinguishable404, including zero-overlap requests; no private totals/selection/rows |
| AC-F08-12 / TEST-F08-12 | GET body/query injection, wrong types, malformed ID/calendar; safe DB read failure | Existing400/422/safe500 shapes; no new auth/parser/Clock foundation behavior or leaked SQL/stack |
| AC-F08-13 / TEST-F08-13 | >20 overlapping goals; page1/2/beyond-total and pageSize1/100 | Canonical disjoint rows; pagination.total exact; totals/days independent of returned row subset |
| AC-F08-14 / TEST-F08-14 | Pause snapshot after owner query; real competing correction/target/stop/entry commit | Coherent whole before snapshot including bounds/targets/count/actual, later GET sees whole after result |
| AC-F08-15 / TEST-F08-15 | New owned goal commits during read; fixed Clock around Bangkok midnight/week boundary | No torn selected set; one evaluatedAt/today/default window per response; subsequent date/week recomputed |
| AC-F08-16 / TEST-F08-16 | Repeated success/empty/error reads with stored-row snapshots; missing initial target fixture | No domain values/IDs/timestamps/counts change; safe422 for missing denominator history, no partial success |
| AC-F08-17 / TEST-F08-17 | Real desktop/mobile apply/presets/goal switch/daily/per-goal/paging/validation/Enter | Persisted correct metrics and applied labels; accessible focus/errors, clear empty/null explanation, no overflow |
| AC-F08-18 / TEST-F08-18 | Delayed obsolete GET; focus refresh with unapplied filters; failure/retry,401/navigation | No stale overwrite/input loss/false-zero metrics or private view after expiry; real safe GET recovery |
| AC-F08-19 / TEST-F08-19 | Save/correct existing synthetic entries then stop/start actual local API without reseed | Original rows/session and selected summary totals/days retrieved unchanged after distinct process |
| AC-F08-20 / TEST-F08-20 | Full accepted F01-F07 regression/build and new access path checks | Existing assertions remain enabled; no change to source schema/workflow/deploy or old Lab5 data; no human/cloud claim from local tests |
| AC-F08-21 / TEST-F08-21 | Exactly366/367 inclusive dates, leap day, month/year and Mon/Sun transitions | Bounded window accepts366/rejects367; exact calendar counts and per-date target sums without UTC drift |
| AC-F08-22 / TEST-F08-22 | Goal picker beyond first20 including archived/future; direct foreign selection and new applied query | Every owned choice reachable; picker paging not confused with summary paging; backend ownership still enforced |

Use pure unit tests for period/union/weighted rounding, real PostgreSQL/API tests for persisted data/authorization/snapshots, real browser journeys for filters/recovery and actual process restart for durability. Plan new summary rules/service/router/page/tests under feature directories; names are proposals until implemented. Capture meaningful domain red only after valid auth/database/fixtures; setup failures or a green documentation calculation are not F08 red/green evidence. Keep failed/skipped/not-run results visible and record actual test names/assertions/counts/source when executed.

## 8. Implementation/review/release boundary

A accepts or revises Section2/API/UI/AC decisions before dependent code. Then B branches from current accepted staging (including any accepted F07 integration), records a meaningful absent-summary/domain red, implements the read model and isolated UI, verifies all agreed AC plus baseline, and requests A's independent implementation review. Do not introduce stored summaries, per-day writes, new schedule coupling or a migration without a reviewed design change. No F08 source or executable test is part of this contract PR.

DoD remains contract acceptance -> real implementation/verification -> independent A review -> protected staging integration -> separate reviewed main release/identified runtime evidence -> joint acceptance. Keep Issue63 OPEN after contract approval. F07 remains A-owned; F06/F07 release evidence and the remaining Lab6/7/D2 work retain their actual independent status. This early preparation neither completes F08 nor all Sprint3/Final requirements.
