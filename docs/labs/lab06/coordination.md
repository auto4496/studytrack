# Lab 6: reciprocal UAT coordination and release gate

17 November 2026. This is a coordination record, not an executed UAT report. [StudyTrack cases](uat-cases.md), [A's CPMS execution log](partner-test-log.md). B retains responsibility for the StudyTrack product handoff; A leads partner-application testing. Both participate as testers/developers and review each other's work.

## Runtime provenance and delivery checkpoint - 20 November 2026

A collected the following read-only Cloud Run evidence at the user's request. B's review of this new evidence remains pending. The original screenshots are retained without image editing; the text files contain selected accessibility lines, and the JSON is an observation record rather than a raw Logging API export. [Evidence and exact queries](../../../artifacts/evidence/lab06/runtime-provenance/observation.json).

| Check | Actual observation | Evidence |
| --- | --- | --- |
| Current service state | At 21:01 ICT on 20 November, `studytrack-gef0de7f877dc-r44090861325-1` received 100% traffic; all older listed revisions received 0%. This is a current-state observation. | [Screenshot](../../../artifacts/evidence/lab06/runtime-provenance/01-current-revisions.jpg), [selected UI lines](../../../artifacts/evidence/lab06/runtime-provenance/01-current-revisions.txt) |
| Deployment audit positive control | The project-wide Cloud Run Admin Activity query from 17 November 20:00 through 20 November 11:40 ICT returned exactly three entries: ReplaceJob for `studytrack-migrate` at 20:20:26.112, then ReplaceService for `studytrack` at 20:21:01.133 and 20:21:12.107 on 17 November. | [Query and result screenshot](../../../artifacts/evidence/lab06/runtime-provenance/02-admin-history.jpg), [selected UI lines](../../../artifacts/evidence/lab06/runtime-provenance/02-admin-history.txt), [exact LQL](../../../artifacts/evidence/lab06/runtime-provenance/history-query.lql) |
| Last service update's traffic | The final entry has timestamp `2026-11-17T13:21:12.107950Z`, insertId `go4lhzd79w5`, method `google.cloud.run.v1.Services.ReplaceService` and resource `namespaces/studytrack-cpe334/services/studytrack`. Its request sets one traffic target: the agreed revision at 100%. The audit status is empty, with no recorded error. | [Expanded traffic screenshot](../../../artifacts/evidence/lab06/runtime-provenance/03-final-service-traffic.jpg), [selected fields](../../../artifacts/evidence/lab06/runtime-provenance/03-final-service-traffic.txt) |
| Subsequent changes | A completed second query across all visible Cloud Run Admin Activity in this project returned **0 results** from one microsecond after that final entry through **20 November 12:00 ICT**. It does not narrow the service resource or method name. The end time includes a buffer beyond the last reported test minute. | [Completed query screenshot](../../../artifacts/evidence/lab06/runtime-provenance/04-no-later-changes.jpg), [selected UI lines](../../../artifacts/evidence/lab06/runtime-provenance/04-no-later-changes.txt), [exact LQL](../../../artifacts/evidence/lab06/runtime-provenance/no-later-changes-query.lql) |

Together with the identified successful [Deploy 44090861325](https://github.com/auto4496/studytrack/actions/runs/44090861325), these observations support that revision `studytrack-gef0de7f877dc-r44090861325-1` served 100% traffic throughout CPMS's reported **19 November 11:19-22:40 and 20 November 11:28-11:40 ICT** test windows. This historical conclusion is reconstructed from the last traffic setting and the absence of subsequent Admin Activity entries in the queried project. It is not a retroactive claim that session-start screenshots were captured. The agreed application source remains `ef0de7f877dcabe8ec330eb2c0029d9cebf8ed40` / tag `uat-lab6-2026-11-18`.

The user confirmed receipt of CPMS's four PASS results with no findings. CPMS's [reviewed outgoing results](https://github.com/Nuggetkub/cpe334-course-project-management-system/pull/67) and [delivery follow-up at f03cc6c](https://github.com/Nuggetkub/cpe334-course-project-management-system/blob/f03cc6c08b5a899c906c1bfee6edf898668e5ec9/docs/labs/lab06/uat-results.md) record the exchange and receipt of our CPMS results. The follow-up is still an open PR as of this checkpoint; no private messages were read to verify it. B approved and merged our first-run evidence PR #70 after final-head CI passed. B also reported a separate six-case PASS run in its review; that run's local captures remain attributed to B rather than copied into A's first-run directory.

Suggested runtime reply, after B reviews the evidence:

> We checked the Cloud Run Admin Activity history. The last service update on 17 November at 20:21:12 ICT set `studytrack-gef0de7f877dc-r44090861325-1` to 100% traffic. The completed query found no subsequent Cloud Run Admin Activity entries through 20 November at 12:00 ICT, covering both of your reported test windows. This supports that the agreed revision served throughout those windows. The retained evidence shows the exact queries, the traffic-setting entry and the completed zero-result check. This is historical evidence collected on 20 November, rather than a session-start screenshot.

This evidence collection did not deploy, restart, change traffic or write product data. The runtime reply has not been sent externally by this work. Issue #66 remains open for evidence review, the separately planned Part D exercise under the instructor's new clarification, independent final decisions and the report. The older preparation and execution checkpoints below retain their writing-time status; they do not override this update.

## First-run execution checkpoint - 19 November 2026

A completed CPMS's six required UI cases across 18-19 November. [Actual results and original evidence](partner-test-log.md) record six passes at source `b6cffa1d5da7ab33f2af27e6c34e75f20cfc5b9c`. B's result review, final team decision, partner findings and independent fix retest remain pending. With no confirmed defect from these cases, the TA-controlled exercise remains an action under the course requirement. This checkpoint records A's observed participation. B's attendance confirmations below retain their original meaning.

B approved and merged [PR68's F-07 live evidence](https://github.com/auto4496/studytrack/pull/68). The user confirmed the private password exchange and successfully signed into CPMS. A separately captured the StudyTrack Cloud Run revision `studytrack-gef0de7f877dc-r44090861325-1` serving 100% traffic on **19 November at 18:35 ICT**. That later capture is not proof of the runtime state at the 18 November session start. The dated preparation record below is retained as history; its pending wording does not override this checkpoint. External StudyTrack results and acceptance are not established by these internal updates.

## People and session status

| Team | Member | Role in this exchange |
| --- | --- | --- |
| StudyTrack | Phanuwit Butchari, 67070501070, @auto4496 (A) | Leads CPMS testing and our retest decision; contributes StudyTrack case preparation and F-07 live checks |
| StudyTrack | Pitchai Chadchuangchot, 67070501068, @Datakung (B) | Coordinates StudyTrack handoff, joins testing, reviews A's work and performs the approved F-07 release merge |
| CPMS | นายสิทธิเจตน์ จันทรเตมีย์, 67070501046, @Nuggetkub | External StudyTrack tester; receives our CPMS retest decision |
| CPMS | นายภัทรภณ กิจจานุกิจ, 67070501069, @Earth2509 | External StudyTrack tester; receives our CPMS retest decision |

| Session | Asia/Bangkok / ICT | Confirmation status |
| --- | --- | --- |
| First reciprocal run | 18 November 2026, 20:00-22:00 | A accepted; B explicitly confirmed this first session in the PR67 review on 17 November |
| Fix window | 20-21 November 2026 | Agreed planning window; individual fix-release times need both teams' approval |
| Retest and decision | 22 November 2026, 13:00-15:00 | CPMS proposed; A explicitly accepted; B's personal availability still requires confirmation |
| Latest requested finish | 22 November 2026, 18:00 | CPMS requested a buffer to assemble both PDFs |
| Lab 6 submission | 22 November 2026, 23:59 | Course/team-plan deadline; each team prepares and submits its own evidence/report |

The session times are work appointments before the submission deadline, not new submission deadlines. B's first-session attendance is based on the actual [PR67 review](https://github.com/auto4496/studytrack/pull/67), not an inference from A's acceptance. B has **not yet confirmed the22November retest**. The external confirmation message still needs to be sent by a human through the teams' agreed channel; a repository record is not evidence of a Discord DM.

## StudyTrack: must complete before the first session

Current recorded deployed source is **`ef0de7f877dcabe8ec330eb2c0029d9cebf8ed40`**, from B's normal [PR65](https://github.com/auto4496/studytrack/pull/65) main merge. [Deploy44090861325](https://github.com/auto4496/studytrack/actions/runs/44090861325) succeeded, with recorded revision **`studytrack-gef0de7f877dc-r44090861325-1`**. This replaces the earlier005c20f deployment reference. The new annotated tag **`uat-lab6-2026-11-18`** resolves to the actual deployed ef0de7f, not candidate9f35093. [Actual release and A-assisted live checks](../../verification/f07-live.md) retain provenance and limits; B's live-evidence review and external acceptance remain pending.

The user authorized the immediate pre-UAT release interval on 17 November; A [recorded the window](https://github.com/auto4496/studytrack/pull/65#issuecomment-6943448535), and B merged the approved release before the first session. Tag publication did not push main or deploy again. Do not confuse that limited release handoff with permission to deploy during external UAT. If a blocker prevents accepting this baseline before testing starts, explicitly reconcile the version or reschedule; do not silently deploy a replacement during the freeze.

| Gate | Current record / required action |
| --- | --- |
| Deployed application tag | `uat-lab6-2026-11-18`, remotely verified to peel to ef0de7f. It identifies the baseline, not a completed UAT result; do not retarget it for fixes. |
| Full source SHA | `ef0de7f877dcabe8ec330eb2c0029d9cebf8ed40` (actual main merge, not candidate9f35093). |
| Revision/image identity | Successful run44090861325, migration `studytrack-migrate-tnk6w`, revision `studytrack-gef0de7f877dc-r44090861325-1`; full digests and the pipeline verification are retained in the linked live report. A fresh session-start console proof is still pending. |
| Public verification | `/api/health` currently reports status/service only. CPMS explicitly accepts Actions run plus a Cloud Run revision screenshot at each session start as an alternative to adding a commit field. Use that evidence route unless a separately reviewed version-endpoint change is deployed **before** freeze. UI asset hashes alone do not prove backend identity. |
| Session-start screenshot | Include service/project/revision and serving traffic, captured for that actual session. Historical deployment logs alone are not a fresh runtime-state screenshot. Do not claim this has already been collected. |
| Credentials | MGR/P1/P2 passwords sent and receipt confirmed privately by a human. No public issue/PR/PDF attachment or secret payload reads. |
| Cases | B approved and merged PR67. Send [the four accepted cases pinned to documentation commit200db98](https://github.com/auto4496/studytrack/blob/200db98bc942743afbc580efdd2f5a8d6fa69566/docs/labs/lab06/uat-cases.md); their document SHA is intentionally different from the application SHA. |
| Reporting | `uat` label created by A on 17 November. Product members apply it to external reporters' issues; reporters do not need collaborator rights. |

Tag clarification: `v0.1.0-sprint1` is annotated. Its tag-object SHA is `bd64d78b9d11fa61227d43d422239e2164d4a2f4`; the peeled application commit is `df08ec19cdeb0efcfbfbee92f3d385d87059528c`. Neither identifies current deployed source ef0de7f or the earlier005c20f. Do not confuse a tag-object SHA with the requested full application commit SHA.

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
