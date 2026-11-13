# F-05: goal and template lifecycle contract

Version 0.1, 9 November 2026 (Asia/Bangkok). Owner: Phanuwit / A / `auto4496`; reviewer: Pitchai / B / `Datakung`. [Issue #31](https://github.com/auto4496/studytrack/issues/31).

Current13November: implementation/staging/main release gates are satisfied; [acceptance and F06 handoff](../../verification/f05.md#current-acceptance---13-november-2026) links the independent PR35 review, actual reviewed main deployment and retained results. The original contract/AC assertions below remain unchanged. F06 and final Lab5 acceptance are separate work.

**Original creation status: proposed before implementation. Update 9 November:** B explicitly approved all lifecycle/F06 decisions at `4ba7c76` in [PR32](https://github.com/auto4496/studytrack/pull/32), before A's implementation branch. Implementation/local results are now recorded in [F05 verification](../../verification/f05.md); implementation peer acceptance, staging/release and cloud actions are separate gates. The original decisions and test specification below are retained as the reviewed contract.

## 1. Baseline and scope

Read against accepted staging `e16b0af2ccfbc6bd39a2f15982537531b21960f5`, whose tree equals main `5c04cd4bf7a7a28ff5c429f3770efc42da6bd7e0`. Existing code already has immutable goal snapshots, target-version uniqueness, the partial ACTIVE owner/template index, template row locks during goal creation and goal row locks during entry creation. These are design inputs, not evidence that lifecycle mutations work.

Sources: [SRS](../../srs.md) FR-09/FR-10/FR-19; BR-01/BR-03/BR-05/BR-06/BR-07/BR-08/BR-10/BR-11; NFR-01 through NFR-08 where applicable. Preserve the [shared transport contract](../../integration-contract.md), [F-03 contract](../sprint-1/f03-goals.md), [F-04 contract](../sprint-1/f04-entries-progress.md) and [review workflow](../../review-workflow.md).

F-05 adds tomorrow-effective target changes, goal stopping, template metadata editing/deactivation and their UI/API/data verification. F-06 owns entry corrections, history filters and streak calculation; F-07/F-08 own schedules and summaries. Cloud/IAM/CI/CD work remains on B's Lab5 issues. This specification does not change that allocation or deploy anything.

## 2. Decisions proposed for B review

| Decision | Proposed behavior and rationale |
| --- | --- |
| Target effective date | Server chooses tomorrow in Asia/Bangkok; client supplies only integer minutes. Today's and all older target versions are immutable. Repeated changes today update the same tomorrow row; the last serialized successful write wins. Setting the same value again is valid and creates no duplicate version. |
| Future-start goal | Proposed boundary: target changes and first stop return409 `GOAL_NOT_STARTED` until startDate. The UI explains the start date. This avoids overwriting tomorrow's initial version and avoids an endDate before startDate, which the accepted DB constraint forbids. This is a specific FR-10 refinement for peer agreement, not an already accepted restriction. If B requires cancellation before start, revise the contract/data design before code. |
| Stop | For an owned started ACTIVE goal, archive it with endDate equal to server Bangkok today, inclusive. Existing entries and all target versions remain. Entries for eligible historical dates, including endDate, remain allowed under BR-11; dates after endDate are rejected. |
| Retry stop | A repeated stop on an already ARCHIVED owned goal returns200 with the original endDate, even on a later day. No reopening, deleting records, extending the date or moving another goal's status. |
| Archived display | Display target effective on min(today,endDate), with startDate as the lower bound for existing future-start fixture compatibility. Pending versions after endDate remain stored but are not displayed or consumed as an eligible entry date. |
| Template editing | All authenticated managers may edit shared-catalog title/description, including inactive templates. Creator remains audit information. Existing goal title/unit/range snapshots never change; newly created goals snapshot committed metadata. |
| Template deactivation | One-way, retry-safe deactivation. New goals are rejected; existing goals retain target revision, historical retrieval and valid entry behavior using their snapshots. Reactivation, deletion and range/unit editing are outside this increment; reject those fields. |

No global SRS or existing API contract is silently replaced. These refinements and the additive DTO below require B's explicit review. Record any correction in a new contract commit; retain prior versions.

## 3. API contract

Use the existing `{data: DTO}` / `{error:{code,message,fields?,requestId}}` envelopes. Authenticate and enforce the required role first. Mutations require JSON, matching Origin and session CSRF. Strictly reject unknown query/body fields; principal determines ownership. Parse UUID/syntax and body shape using existing conventions; owner-scoped lookup precedes domain-state disclosure. A valid-shape foreign or absent private goal returns the same404 `NOT_FOUND`.

| Method/path | Role and strict body | Success and domain errors |
| --- | --- | --- |
| PATCH `/api/goals/:goalId/target` | Participant owner; `{dailyTargetMinutes: integer}` | 200 updated lifecycle goal DTO;422 snapshot range;409 `GOAL_NOT_STARTED` / `GOAL_ARCHIVED` |
| POST `/api/goals/:goalId/stop` | Participant owner; `{}` | 200 archived lifecycle goal DTO, including repeat stop;409 `GOAL_NOT_STARTED` for first stop before start |
| PATCH `/api/templates/:templateId` | Manager; nonempty subset `{title?:string,description?:string}` | 200 existing TemplateDTO;404 absent;422 empty patch, unknown fields or invalid normalized metadata |
| POST `/api/templates/:templateId/deactivate` | Manager; `{}` | 200 existing TemplateDTO with isActive=false, also when already inactive;404 absent |

All new endpoints: anonymous/expired/revoked401; wrong role403; bad CSRF/origin403; malformed UUID/JSON400; non-JSON415; validation/unknown fields422. Unexpected persistence errors remain safe 500 with rollback. Metadata normalization follows F-02: trim title (1-100 characters), description at most500, omitted description preserves its current value, empty description is valid. An unchanged request preserves domain values and does not need to manufacture a new updatedAt.

### Additive goal read shape

Extend GET `/api/goals`, GET `/api/goals/:goalId` and successful lifecycle mutation GoalDTOs with:

```ts
pendingTarget: { effectiveFrom: string; targetMinutes: number } | null;
```

All original fields keep their meanings and allowlist. For a started ACTIVE goal, targetMinutes/targetEffectiveFrom describe today's effective row; pendingTarget describes the scheduled tomorrow row, if any. For a not-yet-started goal, show its initial startDate target and pendingTarget=null. For ARCHIVED goals, use the frozen eligible display date above and pendingTarget=null. Never return another user's data, password/session fields or internal records.

Example: today9November, initial target30, saved20. Scheduling60 returns current30 plus pending60 effective10November. Replacing it with45 keeps one10November row. Today's progress remains20/30=66.67%; on10November an entry30 yields30/45=66.67%. A later target must never rewrite9November's denominator, entry timestamps or achieved status.

## 4. Persistence and concurrency design

Reuse Goal, GoalTargetVersion, ActivityTemplate and existing indexes/checks. No schema change is currently proposed. Any implementation discovery requiring a migration first updates this reviewed design; never edit an accepted migration or reset a shared/dev/cloud DB.

- Goal target/stop transactions acquire an owner-scoped Goal row `FOR UPDATE`, then re-read/authorize and validate state. Capture the operation clock once after acquiring that row; all date decisions and returned DTOs use that instant. This also makes a request waiting across Bangkok midnight use the day when it can actually write.
- Target revisions use unique(goalId,effectiveFrom) upsert **only for server-selected tomorrow**, under the goal lock. Initial and elapsed versions remain unchanged. Stop updates status/endDate atomically. Readers use consistent snapshots; mutations return committed DTOs. A DB error rolls back the complete operation.
- Existing F-04 entry creation uses the same owned Goal row `FOR SHARE` before validation/insertion. Preserve that lock order and re-read bounds inside the transaction. Stop/revision writers therefore serialize against entry creation. After stop commits, entries after endDate cannot be accepted; a request serialized before stop obeys the then-current date bounds. No record is retroactively deleted.
- Template patch/deactivate takes the template row `FOR UPDATE`, then re-reads before writing. Existing goal creation's template `FOR SHARE` and active recheck remain. A create serialized before deactivation may succeed with that committed snapshot; a create serialized after it returns422 `TEMPLATE_INACTIVE`. Metadata races similarly yield one coherent committed snapshot.
- Keep transactions small and ordered: template locks for template operations/goal creation; goal locks before versions or entries for goal operations. Do not introduce a reverse goal-then-template lock cycle. Keep the partial ACTIVE owner/template index as the final duplicate guard. Concurrent stop and create may yield409 before the slot is released; a fresh create after successful stop can succeed with a new ID when the template remains active.
- GET progress/entry-list already use RepeatableRead and date-effective targetForDate. Preserve the authorized date lookup and historical behavior. Do not substitute a current GoalDTO target into an EntryDTO. Snapshot reads spanning stop/revision may return a consistent pre-commit or post-commit view, not a mixed view.

## 5. UI and recovery behavior

- Own goal details: show current target and an explicitly dated pending target. An ACTIVE started goal offers change-target and stop actions. Show editable integer target with immutable snapshot bounds; do not offer a user-selected effective date. Show confirmation for stopping, including the inclusive last date and retained history.
- Future-start and archived goals explain their available actions. An archived goal shows endDate and preserves valid historical entry retrieval/creation through the existing activity component. Goal-list ACTIVE/ARCHIVED filters still work. After stopping, provide a new-goal action only when the template is available; a stale active-catalog selection still handles the backend's422 safely.
- Manager catalog: expose metadata editing and deactivate confirmation with the consequence that existing goals remain usable. Participant catalog never exposes manager controls. Inactive templates remain visible only through the existing manager includeInactive behavior. Changing metadata never relabels existing goal snapshots.
- Disable repeat submission while pending, preserve entered values on validation failure, use labelled inputs/keyboard focus and readable error states. On an uncertain target write, retrieve the authoritative goal before a manual decision to retry; never automatically replay a tomorrow-sensitive PATCH across midnight. Reconcile stop/deactivate through safe reads. If reconciliation fails, block blind retry until resolved. A401 clears private state and requires a new login, without automatic mutation replay.
- After a successful goal mutation, refresh the goal and invalidate/refetch displayed progress using the existing activity-component boundary; discard stale in-flight responses. Reuse shared layout, auth and API helpers. Verify at390x844 and1440x900 without horizontal page overflow.

## 6. Acceptance criteria and test specification

**At specification creation, every case below was NOT RUN / NOT IMPLEMENTED.** These rows retain the reviewed assertions. Actual results/names are mapped in [verification](../../verification/f05.md); date/rule tests are consolidated into real-PostgreSQL lifecycle integration cases with an injected Clock rather than duplicating them in a separate unit file. Proposed filenames below do not replace the actual execution ledger.

| AC / test ID | Preconditions and action | Expected observable result |
| --- | --- | --- |
| AC-F05-01 / TEST-F05-01 | Started owned goal30; schedule60, then45 on the same Bangkok day; reload | Current30 preserved; pending45 tomorrow; exactly one tomorrow row and unchanged original row |
| AC-F05-02 / TEST-F05-02 | Entry20 with target30 today; schedule45; advance injected clock to tomorrow and enter30 | Old day remains66.67%; new day66.67% against45; fresh requests and DB inspection agree |
| AC-F05-03 / TEST-F05-03 | Target at min/max and below/above snapshot bounds; fractional/string/null/0; injected effectiveFrom/owner/status | Valid boundaries200; invalid422 with no writes and no ownership/date control |
| AC-F05-04 / TEST-F05-04 | Fixed clocks around16:59:59Z/17:00:00Z, month/year transition and leap day; lock wait across midnight | Effective date is the correct next Bangkok calendar day; use one post-lock clock; no accidental elapsed-version update |
| AC-F05-05 / TEST-F05-05 | Several competing target updates; inspect versions and successful responses | All serialize without duplicate rows/unhandled500; final row equals one serialized winner; original history unchanged |
| AC-F05-06 / TEST-F05-06 | Started goal with entries and pending target; stop; retry next day; attempt another target change | Archived with original inclusive endDate; retained IDs/values/versions; retry200 keeps date; target change409; DTO excludes post-end pending target |
| AC-F05-07 / TEST-F05-07 | Archived goal with endDate; read/create eligible missing entries on start/end versus after end; create new goal on active template | Eligible dates work; later date422; old records retained; new goal has separate ID and only one ACTIVE slot |
| AC-F05-08 / TEST-F05-08 | Goal starts tomorrow; attempt first target change/stop | Proposed409 GOAL_NOT_STARTED; no version/status/date mutation; ordinary read still shows initial target |
| AC-F05-09 / TEST-F05-09 | Force both revision-versus-stop lock orders; repeat stop; coordinate entry-versus-stop and stop-versus-create | Documented serialized results, no update after archive, no invalid post-end entry, preserved uniqueness and no deadlock/partial writes |
| AC-F05-10 / TEST-F05-10 | Manager edits title/description including inactive template; existing goal and new goal inspected | Old goal snapshots unchanged; new goal uses committed metadata; safe normalized TemplateDTO; omitted fields preserved |
| AC-F05-11 / TEST-F05-11 | Deactivate/retry; attempt new goal; existing goal target/entry/progress; participant catalog versus manager catalog | Inactive remains inactive; new goal422; existing snapshot workflow works; participant cannot see inactive detail; manager can inspect it |
| AC-F05-12 / TEST-F05-12 | Real DB barriers force create-before/after-deactivate and create-before/after-metadata commit | Coherent snapshots; no successful create serialized after deactivation; existing creates retained |
| AC-F05-13 / TEST-F05-13 | Every new endpoint with anonymous/revoked, wrong role, P2 targeting P1, absent ID, bad CSRF/origin, malformed/unknown fields | Documented401/403/404/400/415/422; safe envelopes; no private disclosure or write. Managers can edit other managers' shared templates |
| AC-F05-14 / TEST-F05-14 | Inject persistence failure in target/stop/template transaction; inspect counts/values | Safe500; complete rollback; no accidental archive, partial pending target or metadata update |
| AC-F05-15 / TEST-F05-15 | Save pending target/stop/metadata/deactivation; fresh process against same dedicated DB | Same committed state and historical calculations retrieved; no seed reset or data loss |
| AC-F05-16 / TEST-F05-16 | Desktop/mobile full lifecycle journey plus delayed/stale response, uncertain write, duplicate click and401 | Correct controls/current/pending/endDate; safe reconciliation without blind POST/PATCH replay; accessible usable states; no horizontal overflow |
| AC-F05-17 / TEST-F05-17 | Existing F01-F04 tests/build and manager-template -> goal -> entry journey after integration | Existing assertions still pass; original ownership/session/date/snapshot/concurrency behavior retained |

Concurrency assertions must force both relevant lock/commit orders using two DB connections or explicit barriers. Unordered Promise.all alone cannot prove the race contract. Midnight, retry and historical denominator tests must assert persisted rows and returned values, not only status codes.

## 7. TDD, shared-file coordination and F-06 handoff

After B accepts this contract, first retain a meaningful red case for a missing lifecycle endpoint/behavior, then implement a bounded target-version increment, stop semantics and template lifecycle with real green evidence. A missing dependency/service/configuration is not a domain red test. Run the appropriate unit/API/concurrency/browser/build checks and preserve actual failures as well as successes. Map each AC to executed test names, source SHA and results before feature acceptance.

Planned touched boundaries: goals router/service and GoalDTO; template read-router plus shared metadata rules; existing entry/read helpers only where preserving transaction/type/refresh integration requires it; client API types, goal detail/list and manager catalog. Coordinate shared schema/API changes with B. No auth rewrite, duplicate scaffold, deploy workflow edit or dependency upgrade is planned. Re-check the current accepted staging base before implementation; no direct commit to staging/main.

**B's F-06 may draft its contract in parallel:** authorize owner first, query targetForDate for each entry date within startDate..min(endDate,today), preserve target-version identity/history and snapshot bounds, and treat archived goals as historical records. F-06 must not cache today's target as a denominator for older dates, reopen archived goals, or make inactive template visibility a prerequisite for existing-goal history. A implements this lifecycle; B implements entry edits/history/streak after agreeing this boundary. Neither may claim the other's implementation complete from this document.

### Review checklist

- B explicitly accepts or revises future-start409 behavior, inclusive endDate/idempotency, pendingTarget/archived DTO semantics and metadata/deactivation scope.
- Agree API bodies/errors, date/lock semantics and F-06 target lookup before dependent product code. A addresses findings on this PR; no self-approval.
- Contract PR into staging is specification acceptance only. This does not complete Issue31, authorize cloud actions, finish Sprint2 or establish independent UAT. Later implementation needs its own tests, specific teammate review and the reviewed release flow.
