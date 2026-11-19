# StudyTrack's CPMS first-run UAT results

Phanuwit Butchari, 67070501070 / @auto4496, performed the walkthrough on 18 November 2026 and resumed the final persistence/team checks on 19 November. The user entered the supplied passwords manually. Codex assisted with browser actions, observations and evidence capture. All six required cases passed their recorded UI steps. Datakung's result review and the final team decision remain pending.

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

No confirmed product defect was identified in these six cases. B must review the results and original evidence. Final team acceptance and independent fix retest remain pending. The course requires resolution and independent retest of an accepted defect. With no legitimate defect from this first run, request the TA-controlled exercise specified by the course handout. Preserve this first-run result while completing that exercise. [Joint coordination](coordination.md) and [Issue 66](https://github.com/auto4496/studytrack/issues/66) track remaining partner results, triage/fix/retest and report work.
