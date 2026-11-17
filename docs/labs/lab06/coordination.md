# Lab 6: reciprocal UAT coordination and release gate

17 November 2026. This is a coordination record, not an executed UAT report. [StudyTrack cases](uat-cases.md), [A's CPMS execution log](partner-test-log.md). B retains responsibility for the StudyTrack product handoff; A leads partner-application testing. Both participate as testers/developers and review each other's work.

## People and session status

| Team | Member | Role in this exchange |
| --- | --- | --- |
| StudyTrack | Phanuwit Butchari, 67070501070, @auto4496 (A) | Leads CPMS testing and our retest decision; contributes StudyTrack case preparation and F-07 live checks |
| StudyTrack | Pitchai Chadchuangchot, 67070501068, @Datakung (B) | Coordinates StudyTrack handoff, joins testing, reviews A's work and performs the approved F-07 release merge |
| CPMS | นายสิทธิเจตน์ จันทรเตมีย์, 67070501046, @Nuggetkub | External StudyTrack tester; receives our CPMS retest decision |
| CPMS | นายภัทรภณ กิจจานุกิจ, 67070501069, @Earth2509 | External StudyTrack tester; receives our CPMS retest decision |

| Session | Asia/Bangkok / ICT | Confirmation status |
| --- | --- | --- |
| First reciprocal run | 18 November 2026, 20:00-22:00 | CPMS proposed; A explicitly accepted both sessions on 17 November; B's personal availability still requires confirmation |
| Fix window | 20-21 November 2026 | Agreed planning window; individual fix-release times need both teams' approval |
| Retest and decision | 22 November 2026, 13:00-15:00 | CPMS proposed; A explicitly accepted; B's personal availability still requires confirmation |
| Latest requested finish | 22 November 2026, 18:00 | CPMS requested a buffer to assemble both PDFs |
| Lab 6 submission | 22 November 2026, 23:59 | Course/team-plan deadline; each team prepares and submits its own evidence/report |

The two proposed session times are work appointments before the submission deadline, not new submission deadlines. A has not impersonated B or confirmed B's attendance. The external confirmation message still needs to be sent by a human through the teams' agreed channel; a repository record is not evidence of a Discord DM.

## StudyTrack: must complete before the first session

Last checked deployed source is `005c20f1e732787ebb5396f947387350316f308f`, Deploy [43688319047](https://github.com/auto4496/studytrack/actions/runs/43688319047), recorded revision `studytrack-g005c20f1e732-r43688319047-1`. This is a historical deployment reference, **not a newly frozen UAT selection**. [PR65](https://github.com/auto4496/studytrack/pull/65) is the independently approved F-07 candidate at `9f35093cb4664c6892731c774786dc94a3efd8f5`; it had not merged when this draft was prepared. Recheck before relying on this checkpoint.

The user authorized the immediate pre-UAT release interval on 17 November; A [recorded the window](https://github.com/auto4496/studytrack/pull/65#issuecomment-6943448535) and handed the normal merge to B. Do not confuse that limited release handoff with permission to deploy during external UAT. If F-07 cannot be accepted before testing starts, explicitly choose/freeze the existing release or reschedule; do not silently deploy it during the freeze.

| Gate | Current record / required action |
| --- | --- |
| Deployed application tag | NOT_SELECTED. After the actual approved release and checks, create a new tag on the exact tested main commit. Do not move/reuse the old Sprint 1 tag. |
| Full source SHA | Record the actual deployed main merge SHA, not merely PR65's candidate SHA. |
| Revision/image identity | Retain successful Actions run, migration execution, runtime/platform/tools digests, serving Cloud Run revision and traffic evidence for that SHA. |
| Public verification | `/api/health` currently reports status/service only. CPMS explicitly accepts Actions run plus a Cloud Run revision screenshot at each session start as an alternative to adding a commit field. Use that evidence route unless a separately reviewed version-endpoint change is deployed **before** freeze. UI asset hashes alone do not prove backend identity. |
| Session-start screenshot | Include service/project/revision and serving traffic, captured for that actual session. Historical deployment logs alone are not a fresh runtime-state screenshot. Do not claim this has already been collected. |
| Credentials | MGR/P1/P2 passwords sent and receipt confirmed privately by a human. No public issue/PR/PDF attachment or secret payload reads. |
| Cases | B reviews [the four full cases](uat-cases.md); send a link pinned to the accepted documentation SHA. |
| Reporting | `uat` label created by A on 17 November. Product members apply it to external reporters' issues; reporters do not need collaborator rights. |

Tag clarification: `v0.1.0-sprint1` is annotated. Its tag-object SHA is `bd64d78b9d11fa61227d43d422239e2164d4a2f4`; the peeled application commit is `df08ec19cdeb0efcfbfbee92f3d385d87059528c`. Neither identifies deployed source005c20f. Do not confuse a tag-object SHA with the requested full application commit SHA.

Formal StudyTrack acceptance is **F-01-F-04 only**. Both teams agreed to record incidental outside-scope security/data-loss/core-flow findings for triage. CPMS uses `UAT-CPMS-` titles in StudyTrack and retains records. Source inspection and internal automation are not external human acceptance.

## Freeze and agreed fix releases

From the **actual first session** through the 22 November retest/decision, no deployments except a fix release explicitly announced and agreed by both teams. Every push/merge to `main` runs Deploy demo, so docs-only main merges also count. Keep normal feature work in branches/staging during this interval; do not enable auto-merge on a main PR to evade the schedule.

For a necessary fix: retain the original defect -> agreed severity/scope -> regression/fix/review/CI -> announce the intended new full source SHA and agree the release time -> normal main deployment -> verify actual resulting main SHA/tag/revision and share them -> independent partner retest. If the actual main merge SHA differs from the announced candidate, give testers the actual deployed identity before they resume. Do not replace the original failing result with a later PASS or retroactively imply the original release passed.

The receiving external team records its own acceptance decision and named testers. StudyTrack developers can supply engineering evidence but cannot sign CPMS's acceptance of StudyTrack. StudyTrack likewise records its independent CPMS decision after observing the retest; no pre-signed acceptance is provided.

## CPMS: received handoff for A's work

| Item | Received value |
| --- | --- |
| Repository/issues | <https://github.com/Nuggetkub/cpe334-course-project-management-system> / <https://github.com/Nuggetkub/cpe334-course-project-management-system/issues> |
| Application | <https://cpms-2ww7lkzxja-as.a.run.app> |
| Application tag | `v0.3.0` |
| Full application commit | `b6cffa1d5da7ab33f2af27e6c34e75f20cfc5b9c` |
| Reported Cloud Run revision | `cpms-00007-7r8` (partner-provided; not independently inspected in its GCP console) |
| Health check | <https://cpms-2ww7lkzxja-as.a.run.app/api/health>; on 17 November read-only preflight returned `status: ok` and the expected full commit. Recheck at each actual session; this is not a functional UAT execution. |
| Pinned six cases | [2f45da0ddab41ceb8471ac8903953f61d7d26acf](https://github.com/Nuggetkub/cpe334-course-project-management-system/blob/2f45da0ddab41ceb8471ac8903953f61d7d26acf/docs/labs/lab06/uat-cases.md) |
| Formal scope | CPMS Sprint 1 F-01-F-06; its own AC IDs and out-of-scope list govern our testing of CPMS, not StudyTrack's F-01-F-04 list |
| Our created data | `UAT-ST-<case ID>` with fresh rerun suffix; preserve existing demo/cloud-check records |
| Accounts | SUP-A/SUP-B and STU-A1/A2/B1/B2 as documented in CPMS's cases; two role-group passwords arrive privately |
| Reporting | GitHub issue or Discord as offered by CPMS; CPMS applies `uat` / `lab6` labels |

CPMS sign-in is tab-scoped according to its handoff; StudyTrack sign-in is cookie/profile-scoped. Follow the relevant application's case instructions. CPMS case 02 requires a short deadline wait and case 05 requires at least five minutes; **StudyTrack case 04 requires neither wait nor restart**. Do not copy timing assumptions between products.
