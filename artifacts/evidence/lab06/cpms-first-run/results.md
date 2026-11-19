# CPMS Lab 6 first-run results

18 November 2026, ICT. Tester: Phanuwit Butchari (StudyTrack, @auto4496). The tester signed in to the supplied accounts and participated in the walkthrough. Codex assisted with browser actions and evidence capture.

Continuation and completion: 19 November 2026, ICT. All six required first-run cases passed. No confirmed product defect was found in the executed cases. Independent fix retest and the final team acceptance decision remain pending.

- Application: CPMS, release tag `v0.3.0`, commit `b6cffa1d5da7ab33f2af27e6c34e75f20cfc5b9c`. Health reported `ok` and the full commit at 20:27 ICT. Reported revision: `cpms-00007-7r8`.
- [Pinned CPMS case specification](https://github.com/Nuggetkub/cpe334-course-project-management-system/blob/2f45da0ddab41ceb8471ac8903953f61d7d26acf/docs/labs/lab06/uat-cases.md).

## UAT-01 · Normal journey · PASS

Fixture: [UAT-ST-01 Proposal, milestone 4](https://cpms-2ww7lkzxja-as.a.run.app/milestones/4), Demo Team A. Reuse this URL in UAT-04.

| Step | Actual result | Evidence |
| --- | --- | --- |
| 1 | SUP-A signed in as Demo Supervisor 1. My teams, Milestones and Log out were visible. | [Supervisor milestone page](uat-01-02-milestone-created.txt) |
| 2 | `Milestone created.` appeared. The listed deadline was 19 Nov 2026, 18:00 ICT, with Window Open and Team status Not submitted. | [Milestone created](uat-01-02-milestone-created.jpg) |
| 3 | STU-A1 saw Not submitted yet and the Submit work form. | [Before submission](uat-01-03-student-submit-form.txt) |
| 4 | `Team A proposal` and `https://example.com/uat-01` appeared under Submission. The status was Submitted, with Demo Student 1 as submitter at 20:31 ICT. | [Student submission](uat-01-04-student-submitted.jpg) |
| 5 | SUP-A saw the same submission and No feedback yet. | [Supervisor before feedback](uat-01-05-supervisor-sees-submission.txt) |
| 6 | `Feedback added.` appeared. The entry was `Good start. Add a timeline.`, attributed to Demo Supervisor 1 at 20:33 ICT, version 1. | [Supervisor feedback](uat-01-06-supervisor-feedback.jpg) |
| 7 | STU-A2 saw the same submission and feedback. The Feedback input and Add feedback button were absent. | [Student 2 view](uat-01-07-student2-sees-feedback.jpg) |

The first create attempt showed a date validation message. Inspection after that attempt showed the date field was set to 18 Nov at 20:29 ICT. Setting the field to the intended 19 Nov at 18:00 ICT and submitting succeeded. The cause of the earlier input change was not established. No product defect was recorded from that attempt.

## UAT-02 · Deadline boundary · PASS

Fixture: [UAT-ST-02 Deadline, milestone 5](https://cpms-2ww7lkzxja-as.a.run.app/milestones/5), Demo Team A. Deadline: 18 Nov 2026, 20:41 ICT. The student signed in before the short deadline was set to leave enough time for the pre-deadline observation.

| Step | Actual result | Evidence |
| --- | --- | --- |
| 1 | Entered 18 Nov at 19:36 ICT at about 20:36 ICT. CPMS showed `Enter a valid future due date and time.` and did not add the milestone to the list. | [Past deadline rejected](uat-02-01-past-date-rejected.txt) |
| 2 | At about 20:38 ICT, set the deadline to 20:41 ICT. CPMS showed `Milestone created.` and Window Open. | [Supervisor's open list](uat-02-02-supervisor-window-open.txt) |
| 3 | STU-A1 opened milestone 5 at 20:38:44 ICT. Window Open, Team status Not submitted and the Submit work form were visible. No work was submitted. | [Student before deadline](uat-02-03-student-before-deadline.jpg) |
| 4 | At 20:42:13 ICT, 73 seconds after the deadline, reloading as STU-A1 showed `Window: Closed`, `Team status: Overdue`, `Not submitted yet` and `The deadline has passed.` The Submit work form was absent. | [Student after deadline](uat-02-04-student-after-deadline.jpg) |
| 5 | The refreshed Milestones list showed this same milestone as Closed and Overdue for both STU-A1 and SUP-A. | [Student list](uat-02-05-student-list-overdue.txt), [Supervisor list](uat-02-05-supervisor-list-overdue.txt) |

The optional stale-form submission step was not run.

## UAT-03 · Input validation limits · PASS

Fixture: [UAT-ST-03 Validation, milestone 6](https://cpms-2ww7lkzxja-as.a.run.app/milestones/6), Demo Team A, due 19 Nov at 18:00 ICT. The signed-out checks used a separate tab, with the previously authenticated STU-A1 and SUP-A tabs retained for the remaining steps.

| Step | Actual result | Evidence |
| --- | --- | --- |
| 1 | Submitting empty sign-in fields showed `Enter a valid email address.` and `Enter your password.` | [Empty sign-in](uat-03-01-empty-login.jpg) |
| 2 | A deliberately invalid password produced `Email or password is incorrect` for STU-A1 and for the unknown test account. Both attempts stayed on the sign-in page. | [Known student](uat-03-02-known-student.txt), [unknown account](uat-03-02-unknown-account.txt) |
| 3 | Empty and 121-character titles were rejected with `Enter a title (1–120 characters).` Both `ftp://example.com/x` and `example.com` were rejected with `Enter a full link starting with http:// or https://.` The page still showed Not submitted yet after each attempt. | [Empty title](uat-03-03-empty-title.txt), [121 characters](uat-03-03-title-121.txt), [FTP link](uat-03-03-ftp-link.txt), [no scheme](uat-03-03-no-scheme.txt) |
| 4 | A title of exactly 120 characters (`UAT-ST-03 ` followed by 110 `A` characters) and `https://example.com/uat-03` were accepted. The full title was rendered, with status Submitted and Demo Student 1 at 20:45 ICT. | [Accepted submission](uat-03-04-title-120-accepted.jpg) |
| 5 | Empty and whitespace-only feedback both showed `Enter feedback (1–2000 characters).` No feedback entry appeared. | [Empty feedback](uat-03-05-empty-feedback.txt), [whitespace feedback](uat-03-05-spaces-feedback.jpg) |

## UAT-04 · Forbidden role and other team's records · PASS

Fixture: [UAT-ST-01 Proposal, milestone 4](https://cpms-2ww7lkzxja-as.a.run.app/milestones/4), owned by Demo Team A. Access checks used the supplied demo accounts through normal page navigation.

| Step | Actual result | Evidence |
| --- | --- | --- |
| 1 | STU-B1's My team page showed Demo Team B, Demo Student 3, Demo Student 4 and Demo Supervisor 2. No Team A members, emails or other private fields were displayed. | [Team B view](uat-04-01-student-b-team-view.txt) |
| 2 | Team B's loaded Milestones page showed `No milestones yet` and zero records. The Team A proposal was absent. | [Team B milestones](uat-04-02-student-b-milestones.txt) |
| 3 | Opening the Team A fixture at `/milestones/4` as STU-B1 showed `Milestone not found.` The title, submission and feedback were absent. | [Foreign milestone denied](uat-04-03-student-b-foreign.jpg) |
| 4 | The nonexistent fixture at `/milestones/999999` showed the same `Milestone not found.` message. | [Missing milestone](uat-04-04-student-b-missing.txt) |
| 5 | Opening `/teams` as STU-B1 displayed `You do not have permission to view this page.` The Milestones page had no Create milestone button or form. | [Page denied](uat-04-05-student-b-supervisor-page-denied.txt), [milestone view](uat-04-02-student-b-milestones.txt) |
| 6 | SUP-B's My teams listed only Demo Team B. Opening milestone 4 showed `Milestone not found.` and no proposal, submission or feedback. | [Supervisor's team list](uat-04-06-supervisor-b-team-list.txt), [foreign milestone denied](uat-04-06-supervisor-b-milestone-denied.jpg) |
| 7 | STU-A1 reopened milestone 4. The original submission, link, submitter and 20:31 ICT timestamp remained. The same feedback from Demo Supervisor 1 was shown at 20:33 ICT, version 1. | [Team A's originals](uat-04-07-team-a-original-intact.txt) |

Step 5 checks the browser's page guard. The case specification handles direct API role responses in its automated coverage.

## UAT-05 · One submission per team and persistence · PASS

SUP-A created [UAT-ST-05 Persistence, milestone 7](https://cpms-2ww7lkzxja-as.a.run.app/milestones/7) for Demo Team A, due 19 Nov at 18:00 ICT.

| Step | Actual result | Evidence |
| --- | --- | --- |
| 1 | STU-A1 and STU-A2 opened the same milestone in separate signed-in tabs. Both initially showed Submit work. | [Student 1 form](uat-05-01-student1-before-submit.txt), [Student 2 form](uat-05-01-student2-before-submit.txt) |
| 2 | STU-A1 submitted `First` with `https://example.com/first`. The page showed the submission by Demo Student 1 at 20:52 ICT on 18 Nov. | [First submission](uat-05-02-first-submitted.txt) |
| 3 | STU-A2 submitted `Second` / `https://example.com/second` from its previously opened form. CPMS showed `Your team has already submitted work for this milestone.` Both typed values remained in the form. | [Duplicate rejected](uat-05-03-duplicate-rejected.jpg) |
| 4 | Reloading STU-A2 showed the original `First` submission and Submitted status. | [Reload result](uat-05-04-reload-shows-first.txt) |
| 5 | SUP-A added `Entry 1`, then `Entry 2`. Both appeared in that order, attributed to Demo Supervisor 1 at 20:52 ICT, version 1. | [Feedback order](uat-05-05-two-feedback-entries.jpg) |
| 6 | At 23:12 ICT on 19 November, after a new STU-A2 sign-in, milestone 7 still showed `First`, its original link, submitter and 18 Nov 20:52 ICT timestamp. Both feedback entries kept their original content, author, time, version and order. The deadline had passed, so Window was Closed and Team status remained Submitted. | [Re-authenticated view](uat-05-06-student2-relogin-20261119.jpg), [observed time](uat-05-06-observed-time-20261119.json) |
| 7 | Logged out, then opened milestone 7's URL. CPMS redirected to `/login` with the Sign in form and no private milestone content. | [Signed-out URL check](uat-05-07-logged-out-private-url-20261119.txt) |

All three test tabs were signed out at 20:52:59 ICT on 18 November. The minimum five-minute wait ended at 20:57:59 ICT. [Recorded logout times](uat-05-06-logout-timing.json).

Continuation on 19 November: public health returned the original `b6cffa1d5da7ab33f2af27e6c34e75f20cfc5b9c` commit at 23:08 ICT. The persistence comparison was completed at 23:12 ICT, more than 26 hours after the recorded logout. The minimum five-minute interval was satisfied. The continuation used the original submission and feedback.

## UAT-06 · Team views · PASS

| Step | Actual result | Evidence |
| --- | --- | --- |
| 1 | STU-A1 opened My team. Demo Team A showed members Demo Student 1 and Demo Student 2, with Demo Supervisor 1 assigned. | [Student's team view](uat-06-01-student1-team-view-20261119.jpg) |
| 2 | SUP-A's My teams listed only Demo Team A. Selecting it opened `/teams/1/milestones`, which included the team's UAT proposal and other retained fixtures. | [Supervisor's team list](uat-06-02-supervisor-team-list-20261119.jpg), [Team A milestones](uat-06-02-team-a-milestones-20261119.jpg) |

## First-run summary and remaining Lab 6 work

Required cases UAT-01 through UAT-06 passed their recorded UI steps. Retained fixtures are milestones 4 (normal journey and ownership), 5 (deadline), 6 (validation) and 7 (duplicate protection and persistence). Original demo milestones 1 through 3 were retained.

The optional stale-form submission attempt after the UAT-02 deadline was not executed. Direct API role checks remain covered separately as described in the partner's case specification. Scope is CPMS Sprint 1 F-01 through F-06. The five-minute persistence wait extended overnight across the interruption, with real dates and original timestamps retained above.

The final team acceptance decision, any fix release and independent retest remain pending. The course requires an accepted-defect resolution and independent retest. With no confirmed defect from this first run, consult the TA for the controlled defect exercise described by the course handout. Review these actual results within StudyTrack and share them with CPMS through the agreed channel.
