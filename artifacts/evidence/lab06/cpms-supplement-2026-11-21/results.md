# CPMS supplemental UAT — 21 November 2026

Phanuwit Butchari (67070501070, @auto4496) performed this additional independent CPMS walkthrough with Codex assistance. The user entered the private account passwords manually. No password, token or session storage was read. This run is separate from A's original six-case run and B's reported separate run. Datakung's review of these new results is pending.

## Baseline and plan

- Application: https://cpms-2ww7lkzxja-as.a.run.app
- Tested source: `b6cffa1d5da7ab33f2af27e6c34e75f20cfc5b9c`, tag `v0.3.0`. Revision `cpms-00007-7r8` is partner-reported, not independently read from their GCP console. Public health matched the full source at start, before X02 and at completion; see the retained version text captures.
- Plan used: [proposed PR #72 at aca5208](https://github.com/auto4496/studytrack/blob/aca52088ff4c3f269731534e9236d7546f21c8bd/docs/labs/lab06/partner-test-log.md#independent-coverage-review-and-supplementary-cases---20-november-2026). Its peer review was still open during execution. The one review correction removes the submission-version assertion in X02 step 7: the UI does not display it. Feedback version remains observable.
- Execution started `2026-11-20T18:09:44.665Z` and ended `2026-11-20T18:57:02.607Z` (UTC; ICT = UTC+07:00). [Structured observations](execution.json), [capture times](captures.json), [integrity manifest](sha256.json). The browser captures provide UI evidence; they do not establish raw HTTP statuses or hidden database fields.

## Results

| Case | Actual result | Limits |
| --- | --- | --- |
| CPMS-X01 | PASS, 6 recorded UI steps | Mixed-case login observed; outer-space/server normalization is not established. |
| CPMS-X02 | PASS, 9 recorded UI steps | Text persistence verified with full accessible text. Submission version is outside the UI case. |
| CPMS-X03 | PASS, 5 recorded UI steps | Actual stale-form attempt after cutoff; no exact equality or raw HTTP-status assertion. |
| CPMS-X04 | REQUIRES_ACCOUNT, not executed | No suitable no-team Student handoff; not an executed BLOCKED result. |

No confirmed product defect was found in these additional observed steps. This does not establish full coverage of the 44 reviewed ACs. System-wide/NFR, API/DB matrices, exact expiry, unassigned accounts, co-supervision, pagination and race conditions remain outside this run. The applicable instructor-controlled Part D exercise and independent final decisions are still pending. No intentional regression was introduced.

## CPMS-X01

UI portions of AC-01.1/01.7/01.8, AC-02.4, AC-05.5 and AC-06.4. Accounts: STU-A1 (Demo Student 1), STU-B1 (Demo Student 3), then STU-A1. Original milestone 4 is read-only.

| Step | Result | Actual observation | Evidence |
| --- | --- | --- | --- |
| 1 | PASS | Enter a valid email address.; remained at /login | [Text](x01-01-malformed-email.txt), [Image](x01-01-malformed-email.jpg) |
| 2 | PASS | User confirmed the mixed-case Student1@Example.TEST email was used. Successful Demo Student 1 sign-in and Student navigation were observed. Outer-space/server trimming is not claimed. | [Text](x01-02-prepared-login.txt), [Image](x01-02-prepared-login.jpg), [Text](x01-03-owner-before.txt) |
| 3 | PASS | Milestone 4 retains Team A proposal, https://example.com/uat-01, Demo Student 1 at 18 Nov 20:31 ICT and Good start. Add a timeline. by Demo Supervisor 1 at 20:33, version 1; Closed/Submitted. | [Text](x01-03-owner-before.txt), [Image](x01-03-owner-before.jpg) |
| 4 | PASS | After logout, browser Back settled at /login. Explicitly revisiting /milestones/4 also redirected to /login, with no private submission/feedback text. | [Text](x01-04-signed-out-private-url.txt), [Image](x01-04-signed-out-private-url.jpg) |
| 5 | PASS | Demo Student 3 received the same Milestone not found. UI for /milestones/4 and /milestones/999999. Back from the missing URL to milestone 4 also remained hidden. No Team A title/submission/feedback was shown; no raw HTTP status is claimed. | [Text](x01-05-team-b-foreign.txt), [Image](x01-05-team-b-foreign.jpg), [Text](x01-05-team-b-missing.txt), [Image](x01-05-team-b-missing.jpg), [Text](x01-05-team-b-back.txt), [Image](x01-05-team-b-back.jpg) |
| 6 | PASS | Returned as Demo Student 1. Original title/link/submitter/time and feedback author/time/version match the pre-switch baseline. Window remains Closed and Team status Submitted; no fixture was changed. | [Text](x01-06-owner-restored.txt), [Image](x01-06-owner-restored.jpg) |

## CPMS-X02

UI portions of AC-04.1/04.2, AC-05.1/05.2 and AC-06.1/06.2. Accounts: SUP-A (Demo Supervisor 1) and STU-A1 (Demo Student 1), Team A. New milestone 12 only.

| Step | Result | Actual observation | Evidence |
| --- | --- | --- | --- |
| 1 | PASS | Three-space title rejected: Enter a title (1–120 characters). Valid due retained. List remains 11. | [Image](x02-01-whitespace-title.jpg), [Text](x02-01-whitespace-title.txt) |
| 2 | PASS | Actual 121-character title (maxLength -1) rejected with title message; list remains 11. | [Image](x02-02-title121.jpg), [Text](x02-02-title121.txt) |
| 3 | PASS | Actual 2001-character description (maxLength -1) rejected: Description must be at most 2000 characters. Fresh list still 11. | [Image](x02-03-description2001.jpg), [Text](x02-03-description2001.txt) |
| 4 | PASS | Exactly 120-character title and 2000-character description saved once to milestone 12. Fresh reload matches both, due 22 Nov 18:00 ICT, Open / Not submitted. | [Image](x02-04-saved-boundaries.jpg), [Text](x02-04-saved-boundaries.txt) |
| 5 | PASS | Three-space submission title rejected; no submission shown. | [Image](x02-05-submission-whitespace.jpg), [Text](x02-05-submission-whitespace.txt) |
| 6 | PASS | Actual 2001-character submission description rejected; fresh reload still Not submitted. | [Image](x02-06-submission-description2001.jpg), [Text](x02-06-submission-description2001.txt) |
| 7 | PASS | 2000-character description saved once; fresh reload shows one UAT-ST-X02 work submission, correct link and Demo Student 1 author/time. UI does not display a submission version. | [Image](x02-07-saved-submission.jpg), [Text](x02-07-saved-submission.txt) |
| 8 | PASS | Actual 2001-character feedback rejected: Enter feedback (1–2000 characters). Fresh reload still No feedback yet. | [Image](x02-08-feedback2001.jpg), [Text](x02-08-feedback2001.txt) |
| 9 | PASS | Exactly 2000 F characters persisted and visible after Student reload; one feedback entry, Demo Supervisor 1, 21 Nov 2026 01:49 ICT, version 1; Student has no feedback form. | [Image](x02-09-student-saved-feedback.jpg), [Text](x02-09-student-saved-feedback.txt) |

## CPMS-X03

UI portions of AC-04.4 and AC-05.3/05.6/05.8. Accounts: SUP-A (Demo Supervisor 1) and STU-A1 (Demo Student 1) in separate tabs. New milestone 13 only.

| Step | Result | Actual observation | Evidence |
| --- | --- | --- | --- |
| 1 | PASS | Supervisor created milestone 13, due 21 Nov 01:55 ICT. Fresh detail Open / Not submitted. | [Text](x03-01-created.txt), [Image](x03-01-created.jpg) |
| 2 | PASS | Student 1 opened before cutoff and prepared valid title, description, HTTPS link. Page remains unrefreshed until submit attempt. | [Image](x03-02-draft-before-deadline.jpg), [Text](x03-02-draft-before-deadline.txt) |
| 3 | PASS | Fresh Supervisor detail after at least 68 seconds past cutoff shows Closed / Overdue and Not submitted yet. | [Image](x03-03-supervisor-after-cutoff.jpg), [Text](x03-03-supervisor-after-cutoff.txt) |
| 4 | PASS | One stale Submit attempt 89.132 seconds after cutoff returned The deadline for this milestone has passed. All three valid draft values remained. The stale Open badge remained until reload; no raw HTTP status claimed. | [Image](x03-04-stale-submit-rejected.jpg), [Text](x03-04-stale-submit-rejected.txt) |
| 5 | PASS | Reloaded Student detail and fresh Supervisor list show Closed / Overdue. Not submitted yet; Student has no submit form. No late submission was saved. | [Text](x03-05-student-fresh.txt), [Image](x03-05-student-fresh.jpg), [Text](x03-05-supervisor-list.txt), [Image](x03-05-supervisor-list.jpg) |

## Retained data and observation limits

- Milestones 1–11 were preserved. X01 only read original milestone 4 before/after account changes.
- X02 created milestone [12](https://cpms-2ww7lkzxja-as.a.run.app/milestones/12), title prefix `UAT-ST-X02-R1-20261121-A ` padded to 120 characters, description = 2000 ASCII D characters, due 22 November 18:00 ICT. One `UAT-ST-X02 work` submission with the same 2000-character description and link `https://example.com/uat-st-x02` was retained. One feedback of 2000 ASCII F characters was retained, authored by Demo Supervisor 1 at 21 November 01:49 ICT, version 1. [Exact inputs](prepared-x02-inputs.json).
- X02 invalid inputs remained uncapped (native maxlength -1) before each negative attempt. The actual 121/2001 lengths were observed, then documented validation messages appeared. Fresh list/read checks showed no invalid record persisted. A date-control setup correction preceded the counted whitespace attempt: the first Playwright-filled datetime did not persist. The date was re-entered through the native control, blurred and verified before retry. That setup issue is not reported as a confirmed product defect.
- X02 full readback contains two distinct 2000-D text blocks (milestone and submission), one 2000-F feedback block, no 2001-character D/F block, one submission heading and no Student feedback form. The submission author/time are displayed; its version is not. The long-text viewport screenshots are partial views; accessible text supplies the full-text check. [Feedback author/version view](x02-09-supervisor-feedback-footer.jpg).
- X03 created [milestone 13](https://cpms-2ww7lkzxja-as.a.run.app/milestones/13), `UAT-ST-X03-R1-20261121-A`, due `2026-11-21T01:55` ICT (`2026-11-20T18:55:00.000Z`). The valid draft was prepared at `2026-11-20T18:50:45.691Z` and left unrefreshed. Control observation/submit times are in the structured execution record. The draft was rejected after the deadline and no submission was saved. The machine clock and fixture due time were not altered.
- Email DOM values are privacy-redacted by the browser interface. The returned length of the redaction marker was not treated as a real email-input length. The user confirmed using mixed-case `Student1@Example.TEST`; no server-side trimming assertion is claimed.
- Original capture files are retained without image editing. `captures.json` timestamps are local file-write observations; they are not fabricated per-step server times. A redundant screenshot containing only clipped D text was omitted from this package.

## Remaining work

Obtain teammate review, send the reviewed supplemental results to CPMS, and coordinate the instructor's no-defect Part D procedure with the other team. Do not reveal the selected defect beforehand. A developer exercise release or correction requires the agreed freeze exception, normal review/CI/deployment and independent partner retest. Keep Issue #66 open until the applicable evidence, decisions and report are complete.
