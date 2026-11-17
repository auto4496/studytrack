# A's CPMS UAT execution and retest log

**NOT_RUN.** Prepared 17 November 2026. This blank record is not evidence that any case, account or acceptance decision has passed. Complete actual step observations during the agreed session; preserve failures and blocked prerequisites. [Coordination](coordination.md).

## Session identity (fill when observed)

| Field | Actual value |
| --- | --- |
| Session / tester full name(s) | NOT_RECORDED |
| Started / finished, Asia/Bangkok | NOT_RECORDED |
| Tested application | CPMS, <https://cpms-2ww7lkzxja-as.a.run.app> |
| Expected tag / application SHA | `v0.3.0` / `b6cffa1d5da7ab33f2af27e6c34e75f20cfc5b9c` |
| Actual `/api/health` commit and capture time | NOT_RECORDED_FOR_SESSION |
| Reported revision / independent runtime proof | Partner reports `cpms-00007-7r8`; session proof NOT_RECORDED |
| Case document | [2f45da0ddab41ceb8471ac8903953f61d7d26acf](https://github.com/Nuggetkub/cpe334-course-project-management-system/blob/2f45da0ddab41ceb8471ac8903953f61d7d26acf/docs/labs/lab06/uat-cases.md) |
| Browser/version and real fixture suffix/dates | NOT_RECORDED |
| Private credential receipt / account labels usable | NOT_CONFIRMED; do not enter passwords here |
| Both teams' session/deployment freeze confirmation | NOT_RECORDED_FOR_SESSION |

If health differs from the expected application commit, stop and reconcile the release before executing. Do not classify a case as PASS because an internal CI run passed. Perform cases **01 -> 06** from the pinned partner document, without substituting a different product's steps or ACs.

## Results index

| Partner case | Purpose / special dependency | Actual status | Evidence / defect / step log |
| --- | --- | --- | --- |
| UAT-01 | Milestone -> submission -> feedback; retain its Team A milestone URL for UAT-04 | NOT_RUN | NOT_RECORDED |
| UAT-02 | Deadline boundary; create its own milestone, wait until at least one minute after due time before checking closed state | NOT_RUN | NOT_RECORDED |
| UAT-03 | Input validation limits; separate milestone and exact 120-character title | NOT_RUN | NOT_RECORDED |
| UAT-04 | Foreign team/role; reuse the milestone from UAT-01 | NOT_RUN | NOT_RECORDED |
| UAT-05 | One submission/team and persistence; separate milestone; two independently signed-in tabs and at least five minutes after logout | NOT_RUN | NOT_RECORDED |
| UAT-06 | Student/supervisor team views | NOT_RUN | NOT_RECORDED |

Use fresh `UAT-ST-<case ID>` titles, adding `-r2` or a recorded fresh suffix for reruns. Keep the existing `C-04 cloud check` / `C-05 rollback check` data untouched. Retain all synthetic records. The CPMS accounts/roles and exact UI messages are in the pinned partner case document, not inferred from StudyTrack's UI.

## Repeat this block for every case/step

| Field | Observed record |
| --- | --- |
| Case ID / step / cited ACs | NOT_RECORDED |
| Tester / timestamp ICT | NOT_RECORDED |
| Actual release SHA and account label | NOT_RECORDED |
| Exact input / milestone URL / fixture date | NOT_RECORDED |
| Expected result from the pinned case | NOT_RECORDED |
| Actual visible result and relevant values | NOT_RECORDED |
| Status: PASS / FAIL / BLOCKED | NOT_RUN |
| Screenshot filename / safe HTTP evidence | NOT_RECORDED |
| Defect URL and suggested severity if applicable | NOT_RECORDED |

Do not store passwords, session values or unrelated users' private data in evidence. Report actual defects in <https://github.com/Nuggetkub/cpe334-course-project-management-system/issues>; the product team adds labels. No issue has been opened by this template.

## Fix retest and our independent decision

| Field | Actual record |
| --- | --- |
| Original defect / failing step / original release | NOT_RECORDED |
| Agreed fix and fix-release tag/full SHA/revision | NOT_RECORDED |
| Actual fix health commit at retest | NOT_RECORDED |
| Named StudyTrack retester / ICT timestamp | NOT_RECORDED |
| Original reproduction rerun / related regression observations | NOT_RUN |
| Remaining defects and scope/limitations | NOT_RECORDED |
| Independent StudyTrack acceptance decision / named signers | PENDING; no acceptance claimed |
| Decision shared with CPMS's two named members | NOT_SENT |

Our developers' fix evidence does not substitute for the external team's retest of StudyTrack. If no real defect is found, follow the course/TA guidance rather than fabricate a finding or turn an out-of-scope feature request into an observed defect.
