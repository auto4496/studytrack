# EP7 release B: explain the selected reading date

13 November 2026. B / Datakung, [Issue22](https://github.com/auto4496/studytrack/issues/22) and [Issue23](https://github.com/auto4496/studytrack/issues/23). Specification recorded before this increment's product code. Candidate for A review into sprint staging; release B/P2 has not been deployed.

## Problem and visible change

The accepted [pre-P1 readback](ep8-pre-p1-2026-11-13.md) and [P1 comparison](ep8-p1-2026-11-13.md) showed a real usability ambiguity: after Bangkok midnight, the daily-reading view initially selected the new day with0/30, while the original stored date still held20/30. The date-specific behavior is correct; the screen needs a short explanation of how to retrieve a previous day's result.

Add this visible Thai help text immediately below the date/header row in the daily-reading panel:

> ผลการอ่านแสดงตามวันที่เลือก หากต้องการดูบันทึกย้อนหลัง ให้เลือกวันที่ที่บันทึกไว้

Associate the date input with this explanation as well as its existing field error through `aria-describedby`. The full-width placement below the row avoids widening the date control and crowding the panel title on small screens. Reuse the existing muted-text style.

## Acceptance and scope

1. The explanation is visible and readable on desktop1440x900 and mobile390x844, and is included in the date input's accessible description together with the existing date-error reference.
2. Selecting a historical date still uses the existing date-specific GET and server-provided progress. The current-day empty view and historical saved view remain distinct. No entry/goal/template/target is written by this increment or its visual check.
3. Keep the current labels, default date, date bounds, loading/error/reconciliation states, authentication, API/DTOs, calculations and persistence unchanged. No schema, migration, workflow, dependency, backend or business-rule change is required.

This is a small UI explanation within B's [F04 contract](../../sprints/sprint-1/f04-entries-progress.md) and [shared UI/API conventions](../../ui-api-conventions.md), not a new domain feature or the assessed Lab7 maintenance exercise. Unlike PR40 wording, this explanation is absent from accepted main3570cd4 and supplies a distinct later visible change for release B.

## Verification and release sequence

Build the production client, then inspect the real component at both viewports with explicitly synthetic, locally intercepted GET responses. Check the date description, current-day/historical transition, server-provided20/30 result, no write requests and page overflow. Save fixture-backed screenshots separately from native cloud evidence and label their origin; they do not establish deployed persistence or human UAT. No new test case that merely repeats this copy is needed. Required hosted CI still runs the existing offline/config/API/browser/build/Docker checks on the submitted source.

PR50/P1 has been reviewed and accepted; staging119b701 has the same complete tree as approved d4ef836. Keep the accepted P0/P1 goal/entry/template/target and stored date2026-11-12 fixed. A reviews this feature PR, then the separate staging-to-main release containing this visible change and accepted evidence. Main merge starts the normal build/migration/deploy pipeline; do not dispatch an extra evidence-only release.

After the reviewed main release, retain actual source/workflow SHA, runtime index/platform/tools digests, migration execution, serving revision/traffic, origin, DB-reference and smoke outputs. A then captures P2 for the original goal/entry/date/timestamps and student2 privacy, and both review the combined evidence/report. Existing-image P1 was not release B. Keep Issues22/23 open until their complete acceptance criteria are met.

## Actual results

Specification commit: `fcdbf97`. Product source: `8153034d39cae76b23e89942b776c9d4991cbb7e`, DailyActivity blob `ff6cdbae068ffb612cc54a4a7bc1a592fc91682e`. Production client build and Prettier check passed on these identical product files immediately before the product commit. Later evidence/handoff changes do not modify them.

- `npm run build:client`: client TypeScript and production Vite build PASS. The build used dependencies installed from the unchanged lockfile with `npm ci --ignore-scripts --no-audit --no-fund`; no database or Docker was required.
- Installed headless Edge with Playwright, isolated contexts, localhost production preview: desktop1440x900 and mobile390x844, each on current-day0/30 and historical20/30=66.67% synthetic GET responses. All4 viewport/state observations pass, the new help is visible, the date input has the expected accessible description plus existing error association, selected dates trigger the existing GET, and the saved historical day has no new-entry submit action.
- All4 screenshots were visually inspected: text wraps legibly without crowding the date/title or overflowing the page. Measured page widths equal1440/390 respectively. No page errors and no non-GET API requests were observed. Browser time was explicitly fixed to13November2026; these observations are not cloud P0/P1/P2 data.

See the [local fixture execution record](../../../artifacts/evidence/lab5-cloud/ep7/release-b-date-guidance-local/verification.json) and [screenshot hashes](../../../artifacts/evidence/lab5-cloud/ep7/release-b-date-guidance-local/screenshot-hashes.json). The [desktop historical figure](../../../artifacts/evidence/lab5-cloud/ep7/release-b-date-guidance-local/desktop-historical-day.png) and [mobile historical figure](../../../artifacts/evidence/lab5-cloud/ep7/release-b-date-guidance-local/mobile-historical-day.png) show the actual built UI with synthetic local fixtures. The current-day counterparts are retained in the same folder. These headless page captures are not native URL-visible cloud acceptance figures.

The real database/browser regression suite was not rerun locally for this explanation-only increment; the unchanged required hosted CI runs it on the submitted PR. Fresh CI and A's review remain pending at this writing. Main release, actual running release-B version mapping, native cloud figures and EP8 P2/privacy/final joint acceptance remain unperformed by this preparation.
