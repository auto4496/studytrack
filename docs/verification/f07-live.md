# F-07: actual release and assisted live verification

17 November 2026, Asia/Bangkok. A / Phanuwit / auto4496 with Codex operated the actual Cloud Run app; the user manually entered existing account passwords. **The bounded live checks below passed; B's independent review of this evidence remains pending.** This is not external human UAT. Keep [Issue54](https://github.com/auto4496/studytrack/issues/54) open until that review accepts the remaining release/live DoD.

## Released source and original evidence

| Item | Verified record |
| --- | --- |
| Approved implementation | B-approved [PR62](https://github.com/auto4496/studytrack/pull/62), source `4a4aeb4e72ceaaa86f6fd9e91330a32db123ebef`, staging `0d79511d2862a4c7bf61cb54380d6601ff644e6e` |
| Approved main release | B-approved/merged [PR65](https://github.com/auto4496/studytrack/pull/65), candidate `9f35093cb4664c6892731c774786dc94a3efd8f5`; actual main merge **`ef0de7f877dcabe8ec330eb2c0029d9cebf8ed40`** |
| Source equality | Actual main's entire Git tree equals the approved candidate; the candidate tree equals accepted staging2645191. Source comparison is not a new product-suite execution. |
| Actual deployment | [Deploy44090861325](https://github.com/auto4496/studytrack/actions/runs/44090861325), source ef0de7f, test and deploy jobs SUCCESS; [retained run metadata](../../artifacts/evidence/f07-live/deploy-run.json) |
| Cloud Run revision | `studytrack-gef0de7f877dc-r44090861325-1` as recorded by the successful pipeline |
| Migration execution | `studytrack-migrate-tnk6w`; normal tools-image migration, no seed/reset step |
| Runtime / platform / tools digests | Full values in [deployment identity](../../artifacts/evidence/f07-live/deployment-identity.json). Runtime index: `sha256:fb5903b755ad2d40964af4a08e4a748b38c0f86c69bff9b0f05bebf5388500eb`. |
| UAT source tag | **`uat-lab6-2026-11-18`**, peeled commit ef0de7f; [remote-verified annotated-tag record](../../artifacts/evidence/f07-live/uat-tag.json). The tag identifies the baseline, not an acceptance result. |
| Public endpoint checks | `/` and `/api/health` both200; health reports status/service, not commit. [Actual public result and asset hashes](../../artifacts/evidence/f07-live/public-http.json). Frontend hashes alone do not prove backend identity. |

The pipeline helper verifies its selected revision/digests/migration/traffic before successful smoke. This records the pipeline result; **a fresh Cloud Run console revision/serving-traffic screenshot at each external session start is still required** under the agreed no-health-commit proof route. No current console screenshot or independently measured current traffic split is claimed here. Tag push did not change application code or push main.

## Isolated records and execution

[Machine-readable observations and limits](../../artifacts/evidence/f07-live/execution.json) distinguish11 observation groups from automated test executions. UI captures show23:14-23:26 ICT on17November; all final observed reading dates are2026-11-17.

- New owner goal: **`573caf0d-3628-4fa8-931c-b53d3ab4ea7a`**, Participant1, target30, start2026-11-17.
- New entry: **`89cbf607-f696-431b-9318-3c251b92c712`**, actual20, target30,66.67%, achieved=false.
- The existing shared catalog template `22222222-2222-4222-8222-222222222222` was read, not changed. This internal goal has its inherited title `อ่านภาษาอังกฤษวันละนิด`; its new UUID isolates the check. No prefixed manager template was created in this session. External UAT uses its own fresh `UAT-CPMS-` templates as specified in the accepted cases.
- Only the new goal/schedule/entry were mutated. The new goal was archived after checks; all records are retained. Fixed Lab5 goal `1da44fc2-a956-421d-88a9-8c876adc38c1` / entry `f1146358-2b3a-4aa6-9033-b2d0d95fc542` and the other pre-existing goals were not targeted. No cloud reset, reseed, delete, credential change or SQL-wide preservation audit was performed.

| Group / relevant F07 ACs | Observed result | Original evidence |
| --- | --- | --- |
|01 / AC01,05| New goal has no schedule and no reading entry; initial status is not configured. | [Initial state](../../artifacts/evidence/f07-live/01-new-goal-no-schedule.txt) |
|02-03 / AC02,04| Two days save. After controls are visibly verified, reading23:30/reminder23:45 is rejected with `เวลาเตือนต้องไม่เกินเวลาอ่านของวันเดียวกัน`. Refresh restores the previous saved20:00/19:45 times. | [Invalid UI](../../artifacts/evidence/f07-live/02-invalid-reminder-rejected.jpg), [refreshed original](../../artifacts/evidence/f07-live/03-invalid-reload-original-schedule.txt) |
|04 / AC01,02,05,06| Tuesday23:30/23:00 and Wednesday20:00/19:45 save and reload; server-as-of state is DUE, while actual reading remains0/30. A schedule alone does not create activity. | [Saved DUE](../../artifacts/evidence/f07-live/04-valid-two-day-due-schedule.jpg), [reload](../../artifacts/evidence/f07-live/05-valid-schedule-reloaded.txt) |
|05 / AC07,18| Recording20/30 yields66.67%, achieved=false, one reading record and current/best streak0. Reminder status becomes LOGGED despite a partial target. | [Partial entry](../../artifacts/evidence/f07-live/06-partial-entry-logged-66-67.jpg), [exact progress](../../artifacts/evidence/f07-live/18-owner-progress-api-before-archive.json) |
|06 / AC02,05| Turning reminders off and saving shows disabled while the entry/progress remains; re-enabling with restored times returns LOGGED. | [Disabled state](../../artifacts/evidence/f07-live/07-reminder-disabled-entry-preserved.txt), [restored baseline](../../artifacts/evidence/f07-live/08-before-account-switch.txt) |
|07-09 / AC14| Logout/private-URL navigation redirects to login. P2's list excludes the goal, foreign/missing goal UIs show the same not-found message, and direct schedule navigation returns NOT_FOUND. Manager UI guard and direct schedule API return forbidden responses without schedule data. | [Signed out](../../artifacts/evidence/f07-live/09-signed-out-private-url-redirect.txt), [P2 UI](../../artifacts/evidence/f07-live/11-participant2-foreign-goal-denied.jpg), [P2 API](../../artifacts/evidence/f07-live/12-participant2-schedule-api-denied.json), [missing UI](../../artifacts/evidence/f07-live/13-participant2-missing-goal-same-message.txt), [Manager UI](../../artifacts/evidence/f07-live/14-manager-ui-role-denied.jpg), [Manager API](../../artifacts/evidence/f07-live/15-manager-schedule-api-forbidden.json) |
|10 / AC01,16,17| After signing in as P1 again, original goal URL/day/time/toggle and20/30/66.67% are retained. No entry resubmission was needed. | [Re-authenticated UI](../../artifacts/evidence/f07-live/16-owner-relogin-original-values.jpg), [owner schedule JSON](../../artifacts/evidence/f07-live/17-owner-schedule-api-before-archive.json) |
|11 / AC10,18| Archive makes schedule controls read-only and server status GOAL_ARCHIVED. The complete schedule config, including createdAt/updatedAt, is unchanged; the progress response including entryId is identical before/after archive. | [Archived UI](../../artifacts/evidence/f07-live/19-archived-read-only-entry-preserved.jpg), [schedule after](../../artifacts/evidence/f07-live/20-owner-schedule-api-after-archive.json), [progress after](../../artifacts/evidence/f07-live/21-owner-progress-api-after-archive.json) |

These are bounded real-environment observations. They do not claim all18 ACs were independently re-executed on Cloud. Actual HTTP status codes were not separately captured for authenticated browser document navigation: the retained API evidence is the rendered JSON body (NOT_FOUND/FORBIDDEN), not a fabricated raw404/403 capture. Goal pages use the UI guard as stated in the UAT cases. The accepted engineering [full AC mapping](f07.md) retains its original local/API/browser/restart source and date.

### Operator and coverage limits

One batched time-field fill did not stick; the initial saved values were visibly the defaults. The operator then used accessibility `setValue` and observed each field before the actual invalid/valid tests. A locator checkbox input also failed without changing state; state was re-observed before using the supported accessibility action. These are recorded as operator/interaction limits, not invented application defects or hidden successful checks.

Screenshots are original full-page JPEG captures, not edited/mockups. They use the default IAB viewport, with no claimed1440x900 or390x844 live override. Wider clock/race/expiry/rollback/process-restart and configured desktop/mobile matrices remain in the accepted engineering/hosted checks; this session did not restart or redeploy Cloud Run. Source/JSON/link/hash validation of this evidence does not constitute another product-suite run.

All passwords were entered by the user; no password/cookie/CSRF value was exported. [Evidence hashes](../../artifacts/evidence/f07-live/sha256.json) use canonical committed Git bytes and exclude the hash manifest itself.

## Remaining review and UAT handoff

B must independently review the source/release lineage, selected safe pipeline fields, actual screenshots/JSON, config/progress equality and stated limits before completing Issue54. This authored evidence does not self-approve that DoD.

For [Lab6](../labs/lab06/coordination.md), PR67's four cases are already B-approved and merged in staging. A accepted both proposed sessions; B confirmed **18 November20:00-22:00 ICT only** in the PR67 review, while B's22November13:00-15:00 remains unconfirmed. Final human messages/private password receipt and session-start runtime screenshots remain pending. Neither team has executed/accepted its partner app by this record. The agreed freeze starts the first external session; all main pushes/merges count as deployments.
