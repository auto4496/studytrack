# StudyTrack Sprint 1: external UAT cases

Prepared 17 November 2026. Product: StudyTrack, Theme 8. External testers: CPMS team, @Nuggetkub and @Earth2509. **Specification only: no external execution or acceptance is claimed.** B coordinates our product handoff; A contributed this case draft for B review. [Coordination and release gate](coordination.md).

## Scope and prerequisites

Formal acceptance covers F-01 authentication/access, F-02 templates, F-03 personal goals and F-04 daily entries/progress. F-05 through F-08 are outside this formal scope. Report any incidentally observed security, data-loss or core-flow problem, marking the feature as outside scope when applicable. Do not use lifecycle, history correction, schedule or summary controls in these cases.

UI wording and inputs were checked against current main `005c20f1e732787ebb5396f947387350316f308f` and reviewed F-07 release candidate `9f35093cb4664c6892731c774786dc94a3efd8f5`; this is source inspection, not a live UAT result. Before execution, the product team must supply the final deployed tag/full SHA/revision and session-start version evidence. Stop if it differs from the agreed baseline. Send the testers a permalink to this file at its accepted documentation commit; documentation and deployed application commits need not be identical.

Application: <https://studytrack-981693883236.asia-southeast1.run.app>. Use current desktop Chrome or Edge. UI labels below are literal Thai labels, with English explanations. Dates use **Asia/Bangkok**.

| Label | Email | Role | Expected sidebar role |
| --- | --- | --- | --- |
| MGR | manager@studytrack.test | PROGRAM_MANAGER | Program Manager |
| P1 | student1@studytrack.test | PARTICIPANT | นักศึกษา |
| P2 | student2@studytrack.test | PARTICIPANT | นักศึกษา |

All three passwords must be sent privately and confirmed usable before the session. They do not belong in issues, screenshots, this repository or the PDF. Never assume the passwords are identical.

StudyTrack uses browser cookies: tabs in the same browser profile share the current sign-in. **Unlike CPMS, separate tabs do not isolate accounts.** Run the account switches below sequentially using `ออกจากระบบ` (the sidebar arrow button). For parallel tests, use separate browser profiles/private contexts and separate fixture suffixes.

### Exact synthetic fixtures and execution order

- First-run example: suffix `R1-20261118-A`, creation date `D = 2026-11-18`. Tester 2 uses suffix `R1-20261118-B` if running a separate copy. For a fresh retest on 22 November use `R2-20261122-A` and `D = 2026-11-22`. If the session moves, record its real Bangkok date and a new suffix before starting. D must be today when creating a goal, not a hardcoded date from an earlier session.
- Template T1 title: `UAT-CPMS-01 Template-R1-20261118-A`; description: `Synthetic reading journey for CPMS UAT`; minimum `30`, maximum `120` minutes.
- Template T2 title: `UAT-CPMS-02 Boundary-R1-20261118-A`; description: `Synthetic lower-bound check for CPMS UAT`; minimum `30`, maximum `120` minutes.
- Replace the example suffix consistently with the recorded run's suffix. Titles remain below 100 characters. Unit is minutes; the form does not ask you to choose a unit.
- Run **ST-UAT-01 -> ST-UAT-02 -> ST-UAT-03 -> ST-UAT-04**. Cases 03 and 04 explicitly reuse **G1 and its entry E1 from case 01**. Case 02 uses separate T2/G2 and must not modify G1.
- Record T1/T2 titles, G1/G2 URLs, D, and each created record ID if available in DevTools. Use the same G1 UUID in case 03 and the same G1/date D in case 04.
- Keep all records. Do not reset, reseed, delete, correct, archive or deactivate them. Do not use existing Lab 5/demo records as fixtures. A rerun creates a new suffix, not another goal on an already-used template: one active goal per participant/template is a business rule.
- Complete the creation steps away from Bangkok midnight. For later reads, explicitly select the original D even if today has changed. A persistence check on older fixtures must not silently switch to a new goal or date.

## ST-UAT-01: manager template -> personal goal -> reading progress

- Category/purpose: normal journey; prove the actual manager-created template is usable by a Participant and a reading entry produces the correct progress.
- Accounts: MGR, then P1.
- ACs: AC-F01-01, AC-F02-01, AC-F02-09, AC-F03-01, AC-F04-01, AC-F04-03, AC-F04-12.
- Preconditions: session-start release gate passed; all credentials usable; T1's run suffix is fresh; no goal or entry for this new template exists.
- Inputs: T1 above; target `60`; start date D; entry date D; reading minutes `45`.

| Step | Action | Specific expected result |
| --- | --- | --- |
| 1 | At `/login`, enter the MGR email and private password in `อีเมล` / `รหัสผ่าน`, then select `เข้าสู่ระบบ →`. | Manager opens `/manager/templates`; heading `Activity Templates`, sidebar role `Program Manager`, and `＋ สร้าง Template` are visible. |
| 2 | Select `＋ สร้าง Template`. Enter T1's exact title in `ชื่อกิจกรรม`, its description in `คำอธิบาย (ไม่บังคับ)`, `เวลาอ่านขั้นต่ำ (นาที)` = 30 and `เวลาอ่านสูงสุด (นาที)` = 120. Select `สร้าง Template →`. | Returns to the catalog. T1 appears with its exact description and `30–120 นาทีต่อวัน`. The saved card, rather than a success toast, is the success signal. If paginated, inspect successive `ถัดไป` pages to find the exact title. |
| 3 | Use `ออกจากระบบ`, then sign in as P1. Open `กิจกรรมการอ่าน` (`/templates`) and locate T1, using pagination as needed. | Sidebar role is `นักศึกษา`; T1 is visible with the same title/range and a `ตั้งเป้าหมาย →` button. There is no manager create-template button. |
| 4 | Select T1's `ตั้งเป้าหมาย →`. Set `เป้าหมายรายวัน (นาที)` = 60 and `วันที่เริ่มต้น` = D; select `สร้างเป้าหมาย →`. Record the resulting URL as G1. | Navigates to `/goals/<G1 UUID>`. The heading is T1's exact title, status is `Active`, daily target is `60 นาที`, the start date represents D, and the range is `30–120 นาที`. The displayed date may use Thai formatting. |
| 5 | In `บันทึกการอ่าน`, select D in `วันที่บันทึก (เวลาไทย)` before entering minutes. | Before the first entry: `0 / 60 นาที`, `0%` and `ยังไม่มีบันทึกสำหรับวันที่เลือก`; a `เวลาที่อ่านจริง (นาที)` input and `บันทึกเวลา →` are available. |
| 6 | Enter 45 and select `บันทึกเวลา →` once. Record D and, if inspected, the saved entry ID as E1. | `บันทึกเวลาอ่านเรียบร้อยแล้ว` appears. Progress shows `45 / 60 นาที`, `75%`, `ยังไม่ครบเป้าหมาย` and `บันทึกแล้ว 45 นาทีสำหรับวันที่เลือก`. The create-entry form is replaced by the saved state for D. Do not expect the transient success message after reloading. |
| 7 | Select `เป้าหมายการอ่าน` (`/goals`), locate T1 and reopen it. Select D explicitly if needed. | The same G1 URL/UUID, title, target 60 and saved 45/60/75% are returned. Record the actual values and screenshots, not just PASS. |

## ST-UAT-02: reject below minimum; accept exact lower boundary

- Category/purpose: business rule and boundary; invalid values do not create a goal/entry, while the exact minimum is accepted.
- Accounts: MGR for T2 setup, then P1.
- ACs: AC-F02-02 (valid setup), AC-F03-01, AC-F03-03 (UI prevention), AC-F04-03, AC-F04-05.
- Preconditions: fresh T2; G1/E1 remain unchanged. MGR creates T2 using the same manager steps as case 01, with T2's exact title/description and range 30..120; verify its saved card before switching to P1.
- Inputs: target `29`, then `30`; start date D; entry `29`, then `30`, on D.

| Step | Action | Specific expected result |
| --- | --- | --- |
| 1 | As P1, open T2's goal form, set target 29 and start D, then select `สร้างเป้าหมาย →`. | Browser number-field validation prevents submission because minimum is 30. Remains on the creation form with value 29; no success navigation or saved G2 occurs. Native validation wording varies by browser/language and is not a fixed Thai application message. |
| 2 | Change target to 30 and select `สร้างเป้าหมาย →`. Record URL as G2. | Exactly one goal for this new T2 is created. Detail shows target `30 นาที`, range `30–120 นาที`, start D and `Active`. Other existing goals are not counted as failures. |
| 3 | In G2's `บันทึกการอ่าน`, select D, enter 29 minutes and select `บันทึกเวลา →`. | Application field message `ระบุจำนวนเต็ม 30–120 นาที`; progress stays `0 / 30 นาที`, `0%` with no saved entry for D. This form uses application validation, unlike the native goal-field validation in step 1. |
| 4 | Change reading minutes to 30 and submit once. | Saved state shows `30 / 30 นาที`, `100%`, `อ่านครบเป้าหมายแล้ว` and `บันทึกแล้ว 30 นาทีสำหรับวันที่เลือก`. |
| 5 | Refresh G2 and select D. | The same G2 and the single saved 30-minute result remain; the rejected 29-minute attempt did not create an entry. Do not alter G1 or E1. |

Step 1 is UI constraint coverage, **not evidence that a malformed direct API request returns 422**. Server-side validation is independently covered by the project's API tests; see the boundary table below.

## ST-UAT-03: foreign goal privacy and forbidden role

- Category/purpose: forbidden ownership/role; no private goal, reading entry or progress is disclosed.
- Accounts: P2, MGR, then P1 for the integrity check.
- ACs: AC-F03-06, AC-F04-08 (no entry/progress disclosure through the goal UI), AC-F01-05 (UI role guard).
- Preconditions: case 01 complete; G1 URL and D recorded. P2 did not create G1. The missing-goal UUID below is a reserved synthetic comparison value, not an existing fixture.
- Inputs: G1's exact URL; `/goals/00000000-0000-4000-8000-000000000099` for the missing-goal comparison. Do not replace G1 with T1's template URL.

| Step | Action | Specific expected result |
| --- | --- | --- |
| 1 | Sign out P1; sign in P2. Inspect `/goals`, including subsequent pages if necessary. | P2's own goals may be visible. G1's private goal record is not listed. Templates are intentionally shared in `/templates`; seeing T1 in that public catalog is not a privacy defect. |
| 2 | Paste G1's recorded `/goals/<UUID>` URL into the address bar as P2. | The goal page shows the alert **`ไม่พบรายการที่ต้องการ`** and the `ลองใหม่` button. No G1 goal detail, target, reading-entry values or progress is shown. The back link `← เป้าหมายของฉัน` remains available. This is an inline API-error state, not the generic unmatched-route page `ไม่พบหน้าที่ต้องการ`. |
| 3 | Open the reserved missing-goal URL above. | The same `ไม่พบรายการที่ต้องการ` alert appears with no private content. Existing hidden and missing goal records have the same visible response. |
| 4 | Sign out P2, sign in MGR and open G1's exact URL. | Role guard shows **`บัญชีนี้ไม่มีสิทธิ์เปิดหน้านี้`** and `กลับหน้าหลัก`. No Participant goal/entry/progress details are rendered. |
| 5 | Sign out MGR; sign in P1 and reopen G1. Select D. | G1 is still available to its owner with the original title/target and `45 / 60 นาที`, `75%`, `ยังไม่ครบเป้าหมาย`. Attempts by P2/MGR did not change it. |

**HTTP clarification:** the required external acceptance above is through the UI; testers do not need an API client. If collecting optional HTTP evidence, open DevTools -> Network before step 2 and inspect **GET `/api/goals/<G1 UUID>`**, which returns 404. The SPA document navigation can return HTTP 200 and is not the API 404. Do not capture session cookies/CSRF tokens in shared screenshots. The manager UI guard prevents a goal API call, so step 4 does not demonstrate an API 403; the automated wrong-role API checks cover that separately.

## ST-UAT-04: same goal and entry survive refresh and a new sign-in

- Category/purpose: state/persistence; an existing saved reading result is retrieved in a fresh authenticated view.
- Account: P1; signed-out state is also checked.
- ACs: AC-F01-03, AC-F01-04 (visible logout behavior), AC-F03-02, AC-F04-02.
- Preconditions: case 01 complete; use **the same G1 and E1**, target 60, minutes 45, date D. Do not use boundary-case G2 or create replacement records. No lifecycle/correction test is running on G1.
- Inputs: G1's recorded URL and the **original D from case 01**, even if the current date differs.

| Step | Action | Specific expected result |
| --- | --- | --- |
| 1 | As P1, open G1 and explicitly select original D. Record the URL, title, start date, target and reading values. | G1 has the case-01 title/start/60-minute target; D shows `45 / 60 นาที`, `75%`, `ยังไม่ครบเป้าหมาย` and `บันทึกแล้ว 45 นาทีสำหรับวันที่เลือก`. |
| 2 | Refresh the browser, then reselect D if necessary. | Same authenticated P1, same G1 and same stored values; no login is required solely because of refresh. No second create-entry form is shown for saved D. |
| 3 | Select `ออกจากระบบ`, then type G1's URL while signed out. | Redirects to `/login` with `อีเมล`, `รหัสผ่าน` and `เข้าสู่ระบบ →`; private goal/entry/progress details are absent after navigation settles. |
| 4 | Sign in again as P1, open the recorded G1 URL and explicitly select D. | Same G1, title, target, date and 45/60/75% result. No reading entry needs to be submitted again. |
| 5 | Refresh once more and compare with the step-1 evidence. | All recorded persistent values match; screenshots identify the original G1 and D. Transient save-success notices are not persistent data and need not reappear. |

**No minimum waiting period, application restart or redeployment is required for this case.** It verifies refresh/re-authentication retrieval, not process-restart durability. Process restart and cloud redeploy durability have separate engineering evidence; do not claim they were executed by these external testers. HTTP replay of a revoked cookie and the full expiry matrix are also separate API tests.

## Manual boundaries and result reporting

| Behavior not demonstrated by these UI steps | Existing engineering coverage (not external UAT execution) |
| --- | --- |
| Direct invalid target payload returns 422 without partial rows | TEST-F03-03 and the F-03 contract/API tests |
| Participant goal/list/entry APIs return owner-safe 404; Manager API requests return 403 | TEST-F03-06, TEST-F04-11/12 and access tests |
| Revoked cookie replay/expiry, CSRF/Origin enforcement | TEST-F01-03/04/06/07 and authentication/API tests |
| Concurrent duplicate creation and actual process restart | TEST-F03-02/05, TEST-F04-09/10 and recorded restart verification |

For every step record actual result (NOT_RUN until observed), PASS/FAIL/BLOCKED, tester name, time ICT, application tag/full SHA/revision, documentation commit, exact inputs/G1/G2/D and evidence filename. Blank expected-result tables are not test results. An unmet release/account prerequisite is BLOCKED, not PASS.

Official defects: <https://github.com/auto4496/studytrack/issues>. Include case/step, AC, exact release, role/account label (no password), reproduction, expected/actual behavior, browser and screenshots. Suggest Critical for security exposure/data loss/widespread outage, Major for a blocked or incorrect core workflow, Minor for wording/layout that does not block work. StudyTrack members apply the `uat` label; external reporters need not have label permission. Retest the exact fix release and keep the original report/results.

### Pinned acceptance criteria

These links pin the established Sprint 1 criteria; older writing-time implementation status in those files is not a current release statement.

- [F-01 authentication/access](https://github.com/auto4496/studytrack/blob/005c20f1e732787ebb5396f947387350316f308f/docs/sprints/sprint-1/f01-auth.md)
- [F-02 templates](https://github.com/auto4496/studytrack/blob/005c20f1e732787ebb5396f947387350316f308f/docs/sprints/sprint-1/f02-templates.md)
- [F-03 personal goals](https://github.com/auto4496/studytrack/blob/005c20f1e732787ebb5396f947387350316f308f/docs/sprints/sprint-1/f03-goals.md)
- [F-04 entries/progress](https://github.com/auto4496/studytrack/blob/005c20f1e732787ebb5396f947387350316f308f/docs/sprints/sprint-1/f04-entries-progress.md)
