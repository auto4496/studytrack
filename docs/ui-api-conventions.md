# Shared UI/API conventions — B v0.2

3 November 2026. Reconciled with A integration-contract and actual PR3 source; B implementation authorized by user, human peer review pending. Earlier standalone B draft preserved in e3714d0

## Normative shared interface

Use [integration-contract](integration-contract.md) and [System SDS](system-sds.md): same-origin /api, UUID IDs, MINUTES, startDate/endDate, UTC timestamps/Bangkok local dates. Lists data+meta page/pageSize/total, stable ordering. fields map field:string with requestId. Anonymous401, role403, absent/unowned404, malformed JSON/UUID/date syntax400, invalid fields/calendar/range422, ENTRY_ALREADY_EXISTS409. CSRF_INVALID/ORIGIN_FORBIDDEN403. Login/me/CSRF use existing safe DTOs; logout204/no body. Cookie session + Origin + X-CSRF-Token, no ownerId/role from client. No tokens in localStorage/logs. Unknown keys422; no browser permission substitute

## Screens and states

Existing A router/layout/AuthProvider/API client remain shared. Participant /templates→/goals/new?template=UUID→/goals/:goalId. Manager /manager/templates→/manager/templates/new. B adds create form and GoalDetail ActivityComponent slot; future routes only via their contracts

Loading differs from empty; show labelled field errors/keyboard focus; preserve input and show retry after read failure. Disable mutations while pending. Anonymous/session-expired clears private view through shared auth; no automatic replay. General errors never expose stack/SQL/private records

Template title trim1..100 Unicode code points, description<=500/defaultempty; unit/status/creator server-owned. Duplicate names allowed. Unknown template POST outcome requires catalog inspection before explicit retry; never auto-create again

Daily entry POST accepts only date/minutes; unknown outcome or duplicate reconciles the original date with GET. Block resubmit while result unknown. Ignore stale date reads, distinguish missing entryIdnull from network error. Percent label supports >100; achieved from server. Future start has no valid daily form until its date. Archive bounds follow SRS BR11

NFR06: viewport390x844/1440x900, no horizontal page overflow, labels/keyboard/focus/errors meaningful; tests include long titles. Snapshot min/max and date-effective target come from server, never template/current target on client

## Ownership and shared changes

A owns auth/schema/migrations/setup. Existing schema has DailyEntry unique constraint; B adds no migration/dependency. B extends read-only template adapter and wires create route/ActivityComponent through App. F04 may narrow goal service reader parameter types for transaction compatibility with no runtime change. Root package/lockfile preserved. Foundation is temporarily PR3 unmerged; F02 branch depends on A and F04 on F02, then update to accepted staging before final integration. No claim of A approval or accepted release
