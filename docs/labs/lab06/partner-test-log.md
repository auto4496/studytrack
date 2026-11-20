# StudyTrack's CPMS first-run UAT results

Phanuwit Butchari, 67070501070 / @auto4496, performed the walkthrough on 18 November 2026 and resumed the final persistence/team checks on 19 November. The user entered the supplied passwords manually. Codex assisted with browser actions, observations and evidence capture. All six required cases passed their recorded UI steps. Datakung [approved and merged PR #70](https://github.com/auto4496/studytrack/pull/70#pullrequestreview-5990160290) on 20 November. That review also reports B's separate six-case PASS run with fresh milestones 8-11; B's local captures remain distinct from A's retained first-run directory. The final team decision remains pending.

## Release and execution identity

| Item | Recorded value |
| --- | --- |
| Application and scope | [CPMS](https://cpms-2ww7lkzxja-as.a.run.app), Sprint 1 F-01 through F-06 |
| Release | `v0.3.0`, full source `b6cffa1d5da7ab33f2af27e6c34e75f20cfc5b9c` |
| Version observations | Public health returned the expected full commit at the original session start, the 19 November continuation and completion. Partner reports revision `cpms-00007-7r8`. |
| Fixed case specification | [Partner document at 2f45da0ddab41ceb8471ac8903953f61d7d26acf](https://github.com/Nuggetkub/cpe334-course-project-management-system/blob/2f45da0ddab41ceb8471ac8903953f61d7d26acf/docs/labs/lab06/uat-cases.md) |
| Per-step actual results | [Retained execution record](../../../artifacts/evidence/lab06/cpms-first-run/results.md) |
| Completion version proof | [Actual health response](../../../artifacts/evidence/lab06/cpms-first-run/version-end-20261119.json) |
| Original capture integrity | [Canonical evidence hashes](../../../artifacts/evidence/lab06/cpms-first-run/sha256.json) |

## Required case results

The pinned case specification supplies the acceptance-criteria IDs, roles and expected results. The retained execution record gives actual inputs, messages and per-step evidence.

| Case | Actual result |
| --- | --- |
| UAT-01, normal journey | PASS. Supervisor created milestone 4, Student 1 submitted, Supervisor 1 added feedback, and Student 2 saw the shared result with no feedback form. [Student 2 evidence](../../../artifacts/evidence/lab06/cpms-first-run/uat-01-07-student2-sees-feedback.jpg). |
| UAT-02, deadline | PASS. A past due time was rejected. Milestone 5 was open before 20:41 ICT on 18 November. At 20:42:13, 73 seconds after cutoff, the student saw Closed/Overdue with no submit form. Both role lists showed Overdue. [After cutoff](../../../artifacts/evidence/lab06/cpms-first-run/uat-02-04-student-after-deadline.jpg). |
| UAT-03, validation | PASS. Empty login fields, invalid credentials, empty/121-character titles, malformed links and blank feedback were rejected. An exact 120-character title was accepted. [Boundary accepted](../../../artifacts/evidence/lab06/cpms-first-run/uat-03-04-title-120-accepted.jpg). |
| UAT-04, role/ownership | PASS. Team B student/supervisor saw only Team B. Foreign/missing Team A milestones showed the same not-found message. The supervisor route rejected the student. Team A's original submission/feedback remained intact. [Supervisor B denial](../../../artifacts/evidence/lab06/cpms-first-run/uat-04-06-supervisor-b-milestone-denied.jpg). |
| UAT-05, uniqueness/persistence | PASS. The stale second-student form was rejected with values preserved. Reload showed the first submission. All tabs logged out at 20:52:59 ICT on 18 November. Re-authentication at 23:12 ICT on 19 November retained the original submission/time and both ordered feedback entries. Logout/private-URL navigation returned to login. [Persistence](../../../artifacts/evidence/lab06/cpms-first-run/uat-05-06-student2-relogin-20261119.jpg). |
| UAT-06, team views | PASS. Student 1 saw Team A's correct members/supervisor. Supervisor 1's My teams listed only Team A, and selecting it opened `/teams/1/milestones`. [Team list](../../../artifacts/evidence/lab06/cpms-first-run/uat-06-02-supervisor-team-list-20261119.jpg). |

## Inputs, coverage and next acceptance steps

Dedicated fixtures use the agreed `UAT-ST-` prefix. Milestones 4, 5, 6 and 7 are retained for normal/ownership, deadline, validation and persistence checks respectively. Original demo milestones 1 through 3 were retained. Exact title/link/date inputs and observed messages are in the execution record. The incorrect date value in the first UAT-01 attempt was re-observed and corrected before successful creation. Its cause remains unestablished.

The persistence continuation happened after the fixture deadline. Window was Closed and Team status remained Submitted, while the saved title, link, author/time and both feedback entries matched. The actual wait exceeded 26 hours across the interruption, satisfying the specified minimum five minutes. The optional UAT-02 stale-form submission after cutoff remains unexecuted. The partner's case document assigns direct API role matrices and the unassigned-account case to separate automated coverage.

No confirmed product defect was identified in these six cases, and B's first-run evidence review is complete. The instructor clarification supplied by the user on 20 November asks the UAT team to assess requirements/AC coverage and add useful cases before concluding that thorough testing found no defect. If expanded testing still finds none, follow the announcement's standardized controlled-defect procedure; waiting for the TA to select a specific defect is superseded. No deliberate regression has been introduced by this coverage preparation. Final acceptance and the applicable Part D fix/retest work remain pending. [Joint coordination](coordination.md) and [Issue 66](https://github.com/auto4496/studytrack/issues/66) track this work.

## Independent coverage review and supplementary cases - 20 November 2026

A compared CPMS's pinned case document against the SRS and seven F-01 through F-06 contract files at the tested application commit. The [structured review](../../../artifacts/evidence/lab06/cpms-coverage-review.json) retains each source's Git blob identity, all 44 distinct feature AC IDs, the original case claims, observed coverage and important gaps. Of those IDs, 41 are in the feature UI/route AC tables and three concern seeded data. This is a bounded feature-contract inventory, not a whole-product coverage percentage. System-wide/NFR assertions and the partner's automated tests remain separate evidence.

The first run touches every Sprint 1 feature and its 12 SRS functional requirements, but an observed UI result does not establish every API/DB condition in a compound AC. The review records three observed UI criteria, 27 partial UI criteria, 13 not externally observed and one requiring an unavailable account. These are review classifications, not new PASS/FAIL results or a grading estimate. B's review of this addendum is pending.

| Feature and Sprint 1 requirements | Retained first-run observations | Important additional coverage | Proposed case |
| --- | --- | --- | --- |
| F-01, FR-01 through FR-04 | Valid/invalid login, empty fields, role navigation, logout and protected-page redirect | Malformed email, case/space normalization and returning to private history after an account switch. Exact expiry, hash/storage and late-401 races remain engineering checks. | CPMS-X01 |
| F-02, BR-01 through BR-04 | Known foreign-team hiding and Student supervisor-route denial | The no-team Student is unavailable. Co-supervision and direct forbidden-write/guard-order matrices were not exercised through the UI. | CPMS-X01; conditional CPMS-X04 |
| F-03, FR-05/FR-06 | Both supplied teams' rosters and assigned-team lists | No-team Student and empty Supervisor contexts are not supplied. Seed idempotence, hash/cost and unique membership are separate engineering checks. | Conditional CPMS-X04 |
| F-04, FR-08/FR-09 | Create/readback, team scope, Bangkok due time and open/closed read state | Milestone whitespace title, exact upper text limits. Fifty-row paging and stale-team-request races need dedicated fixtures/controls and are not claimed by this addendum. | CPMS-X02 |
| F-05, FR-13/FR-14 | Submission, sharing, stale duplicate rejection and persistence | Description upper limit and a genuinely stale form submitted after the deadline. The original optional stale-form action was not executed. | CPMS-X02/CPMS-X03 |
| F-06, FR-18/FR-19 | Feedback creation, blank rejection, ordered entries with author/time/version and persistence | Feedback 2000/2001 characters. The full feedback endpoint role matrix and failed-save recovery remain separate checks. | CPMS-X02; CPMS-X01 for UI privacy |

All cases below are preparation only. CPMS-X01, CPMS-X02 and CPMS-X03 are **NOT_RUN**. CPMS-X04 **REQUIRES_ACCOUNT**; this is not an executed BLOCKED result. Record the actual tester at execution. A can lead X01/X03 and B can lead X02, subject to B confirming the split; no new execution is attributed to either person yet.

### Shared execution rules

- Reconfirm the agreed session and `/api/health` full commit `b6cffa1d5da7ab33f2af27e6c34e75f20cfc5b9c` before testing. Stop on a different unagreed release; do not test an exercise version as if it were the original baseline.
- Use the existing private account handoff and CPMS's tab-scoped sign-in. Humans enter passwords; retain no passwords/tokens/cookies. Keep one account per tab, with explicit sign-out before changing its account.
- Record the real Bangkok date D, fresh suffix such as `R1-20261120-A`, fixture IDs/URLs and the exact inputs used. For a later day regenerate a fresh suffix and date-dependent due time. Keep all new records. Do not reset/reseed, edit/delete the earlier milestones 1-11 or touch another team's unrelated data.
- [Prepared synthetic text inputs](cpms-supplemental-inputs.json) contain exact 120/121 and 2000/2001 character examples. They are examples for the recorded suffix, not evidence of execution. Passwords used for real sign-in are absent; the dummy string belongs only to the malformed-email negative attempt.
- Before an over-limit attempt, observe the actual value the control retained. If a native maxlength caps or rejects the paste, record that UI prevention and actual length; do not submit a truncated valid value as an invalid attempt. If the invalid length remains, submit and verify the documented error and unchanged saved state. This does not establish a raw API status.
- For every step record actual result, time ICT, account label, full application commit and screenshot/accessible-text evidence. A clipped screenshot cannot prove the full length of stored text. Preserve failures as separate attempts and report genuine findings to CPMS through its agreed issue/channel procedure; a coverage gap alone is not a defect report.

### CPMS-X01: login normalization and private history after an account switch

ACs: AC-01.1/01.7/01.8, AC-02.4, AC-05.5 and AC-06.4 (UI observations only). Accounts: STU-A1, then STU-B1, then STU-A1. Read-only fixture: A's original milestone 4 at `/milestones/4`; record its original submission/feedback before switching. No write to that fixture is authorized by this case.

| Step | Action and exact input | Expected observable result |
| --- | --- | --- |
| 1 | Signed out, enter email `not-an-email` and dummy password `UAT-ST-X01-invalid`; select Sign in. | `Enter a valid email address.` appears; the user remains signed out. The UI alone does not establish a no-request assertion without Network evidence. |
| 2 | Enter `  Student1@Example.TEST  ` and the real privately supplied Student password. Record the email value actually retained by the control. Sign in. | Sign-in succeeds as Demo Student 1 with Student navigation. If the browser normalizes the field before submission, record that mechanism rather than claiming a server trim assertion. |
| 3 | Open `/milestones/4`; record the existing title/link, submitter/time and feedback values. | Team A's original submission and feedback appear. No create/edit action is taken. |
| 4 | Log out, then revisit the private URL from browser history. | Login is required; after navigation settles no private submission/feedback is shown. |
| 5 | In that tab sign in as STU-B1 using its private password. Return to the same private URL via Back/history; also open `/milestones/999999`. | Both settled pages show `Milestone not found.` with no Team A title, submission or feedback. |
| 6 | Log out B1, sign in A1 and reopen milestone 4. | The original authorized values match step 3. Record any mismatch; do not repair or recreate the fixture. |

Outcome: NOT_RUN. Actual tester/time/evidence: not recorded.

### CPMS-X02: whitespace and upper text boundaries

ACs: AC-04.1/04.2, AC-05.1/05.2 and AC-06.1/06.2. Accounts: SUP-A, STU-A1. New fixture M-X02 only. Set due time to D+1 at 18:00 ICT. Use the prepared input file, regenerating a fresh title prefix/suffix when needed.

| Step | Action and exact input | Expected observable result |
| --- | --- | --- |
| 1 | SUP-A opens Team A's create form. Title = three spaces, Description = `Boundary fixture`, due = D+1 18:00. Submit if the field retains the spaces. | `Enter a title (1–120 characters).` or native empty-field prevention; no newly saved milestone for this attempt. Record the actual mechanism. |
| 2 | Paste the prepared 121-character milestone title with otherwise valid fields. Apply the shared over-limit rule. | An actual 121-character value is rejected with the title message, or the control prevents retaining more than 120. No invalid milestone is saved. |
| 3 | Set the exact 120-character title; paste Description = 2001 ASCII `D` characters. Apply the shared over-limit rule. | Actual over-limit text is rejected with `Description must be at most 2000 characters.`, or native prevention is recorded. No invalid milestone is saved. |
| 4 | Keep the exact 120-character title and set Description = 2000 ASCII `D` characters. Create once and record M-X02's URL. | `Milestone created.`; the saved fixture has the correct title/description and future due time, Open/Not submitted. Retain full accessible text when visual clipping prevents a full-text comparison. |
| 5 | STU-A1 opens M-X02. Submission title = three spaces, description = empty, link = `https://example.com/uat-st-x02`; submit if spaces remain. | `Enter a title (1–120 characters).` or native prevention; fresh read still shows `Not submitted yet`. |
| 6 | Title = `UAT-ST-X02 work`, Description = 2001 ASCII `D` characters, same valid link. Apply the shared over-limit rule. | Over-limit description is rejected or prevented. Fresh read remains unsubmitted; do not claim a server rejection when the control capped the input. |
| 7 | Description = exactly 2000 ASCII `D` characters; keep the valid title/link. Submit once and reload. | One submission is shown with matching title/link, full text where inspectable, author/time and version 1. |
| 8 | SUP-A opens M-X02 and pastes Feedback = 2001 ASCII `F` characters. Apply the shared over-limit rule. | `Enter feedback (1–2000 characters).` or native prevention. Reload still shows `No feedback yet`. |
| 9 | Set Feedback = exactly 2000 ASCII `F` characters; Add feedback once, then reload as STU-A1. | One feedback entry is retained with the full text, correct Supervisor author/time and version 1. The Student sees no feedback form. |

Outcome: NOT_RUN. Actual tester/time/fixture URL/evidence: not recorded.

### CPMS-X03: stale submit form after the deadline

ACs: AC-04.4, AC-05.3/05.6/05.8. Accounts: SUP-A in one tab, STU-A1 in another. New fixture title `UAT-ST-X03-<fresh suffix>`, Description = `Stale deadline check`, due at least three minutes ahead in real ICT. Never change the machine clock or the milestone after creation.

| Step | Action and exact input | Expected observable result |
| --- | --- | --- |
| 1 | SUP-A creates the fresh Team A milestone; record its exact due time and URL. STU-A1 opens it before the due time. | Open, Not submitted and the Submit work form. |
| 2 | Fill submission title `UAT-ST-X03 stale`, Description `Prepared before deadline`, Link `https://example.com/uat-st-x03`. Keep that Student tab open without refreshing or submitting. | The valid draft remains in the open form. Record its values and pre-deadline state. |
| 3 | Wait until at least one full minute after the due time. Refresh the Supervisor's list/detail, leaving the Student draft untouched. | The fresh server-backed view is Closed/Overdue with no submission. Record the real observation time, not only the local countdown. |
| 4 | In the stale Student tab select Submit once. | `The deadline for this milestone has passed.`; the draft values remain available. If the UI has already removed/disabled the form, record UI prevention and leave the stale-write assertion unexecuted; do not bypass the UI or invent a server rejection. |
| 5 | Reload as the Student and recheck the Supervisor's list. | Closed/Overdue, `Not submitted yet`, no saved submission and no submit form. A successful late save would be a genuine finding to report, not an intended exercise result. |

Outcome: NOT_RUN. Actual tester/time/due time/evidence: not recorded. This improves the original optional action's coverage; it does not establish the exact server `now == dueAt` boundary or a raw HTTP 409 without separate evidence.

### CPMS-X04: unassigned Student scope, conditional on an account handoff

ACs: AC-02.4, AC-03.4, AC-04.7, AC-05.5 and AC-06.4 (UI portions). Preparation status: REQUIRES_ACCOUNT. Ask CPMS for a suitable safe no-team Student account label and private password if they can provide one; do not read or repurpose their deployment-smoke credentials. No actual email/account is specified by this draft.

1. Sign in with the provided no-team Student account. My team should show `You are not assigned to a team yet`, with no roster or private team fields.
2. Open Milestones. There should be no team milestone data; record the actual safe empty/unassigned state.
3. Open Team A milestone 4 and the reserved missing comparison `/milestones/999999`. Both should be safely hidden, with no submission or feedback.
4. Sign out, sign in STU-A1 and read milestone 4. The original submission/feedback should be unchanged.

Outcome: not recorded. Do not classify an unattempted prerequisite as a runtime BLOCKED result. Empty Supervisor assignments and co-supervision require their own supplied account contexts; this conditional Student case does not cover them.
