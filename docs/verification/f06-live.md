# F06 Cloud Run verification

19 November 2026, Asia/Bangkok. Datakung signed in to the StudyTrack test accounts. Codex operated the browser and collected the observations. This record covers the F06 evidence requested in [Issue #58](https://github.com/auto4496/studytrack/issues/58). A's review of these observations is pending.

| Release | Source and deployment evidence |
| --- | --- |
| First F06 release | A reviewed [PR #61](https://github.com/auto4496/studytrack/pull/61), merged as `005c20f1e732787ebb5396f947387350316f308f`. [Successful deployment](https://github.com/auto4496/studytrack/actions/runs/43688319047) recorded revision `studytrack-g005c20f1e732-r43688319047-1` and migration execution `studytrack-migrate-h29jd`. |
| Version used for the live checks | Main `ef0de7f877dcabe8ec330eb2c0029d9cebf8ed40`, tag `uat-lab6-2026-11-18`. [Successful deployment](https://github.com/auto4496/studytrack/actions/runs/44090861325) recorded revision `studytrack-gef0de7f877dc-r44090861325-1`, migration `studytrack-migrate-tnk6w` and [image digests](../../artifacts/evidence/f07-live/deployment-identity.json). |

The [public recheck](../../artifacts/evidence/f06-live/public-http.json) returned HTTP 200 for the root and health endpoint. The served JS and CSS matched the hashes recorded for the later deployment. The public health endpoint reports status and service. Source and revision attribution comes from the successful Actions run and public asset comparison. Current Cloud Run traffic was not read from the console during this check. The [first release identity](../../artifacts/evidence/f06-live/first-release.json) records the three image digests from the Actions output. The entry/history implementation directory is unchanged between the two release commits. Goal detail integration and styles changed with F07.

## Fixture and observed results

P1 created one new goal using the existing catalogue template “อ่านภาษาอังกฤษวันละนิด”. The goal ID is `921c9291-aae9-480e-b561-89a1ee18987b`, daily target 30 minutes and start date 19 November. The test entry ID is `065945c1-9bff-4e4e-9f7f-d419597dd1de`. The shared template, Lab5 records, F07 test goal and CPMS UAT goal were not edited. The new goal and entry are retained with the evidence.

| Observation | Actual result | Evidence |
| --- | --- | --- |
| Create one 20-minute entry for 19 November | History and daily progress showed 20/30 (66.67%). The history total was one. Both streaks were zero. | [UI](../../artifacts/evidence/f06-live/01-before-correction.jpg), [history](../../artifacts/evidence/f06-live/01-history-before.json) |
| Attempt a correction to zero | The form displayed `ระบุจำนวนเต็ม 1–1440 นาที`. Reloading the history response showed the original entry values and timestamps. | [UI](../../artifacts/evidence/f06-live/02-invalid-correction.jpg), [history](../../artifacts/evidence/f06-live/02-history-after-invalid.json) |
| Correct the original entry to 30 | Daily progress and history both became 30/30 (100%), with both streaks at one day. The entry kept its ID, goal, date, target and creation time. Only one row remained and its update time advanced. | [UI](../../artifacts/evidence/f06-live/03-after-correction.jpg), [history](../../artifacts/evidence/f06-live/03-history-after.json) |
| Reload as P1 | The corrected row, progress and streak remained. | [UI](../../artifacts/evidence/f06-live/04-owner-reload.jpg), [history](../../artifacts/evidence/f06-live/04-history-reload.json) |
| Open the goal after logout | The browser redirected to `/login` and showed the sign-in form. | [Page observation](../../artifacts/evidence/f06-live/05-signed-out-redirect.txt) |
| Open the P1 test goal as P2 | The goal page showed `ไม่พบรายการที่ต้องการ`, with no history or progress visible. The history response displayed a `NOT_FOUND` error body without a `data` field. | [UI](../../artifacts/evidence/f06-live/06-p2-goal-denied.jpg), [history response](../../artifacts/evidence/f06-live/06-p2-history-denied.json) |

This run is a focused manual check of the deployed F06 journey using a single day. The P2 response is a JSON body captured through browser navigation. Raw HTTP status and foreign-account writes were outside this live check. Wider date range, pagination, historical target versions, transaction and browser coverage is recorded in the [F06 verification ledger](f06.md). This check is separate from the external Sprint 1 UAT in Issue #66.
