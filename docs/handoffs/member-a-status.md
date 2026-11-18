# Member A handoff — baseline v0.1

## F07 released / live evidence ready for B review - 17 November 2026

B approved and merged PR62 and PR65. Main `ef0de7f877dcabe8ec330eb2c0029d9cebf8ed40` deployed successfully through run44090861325; `uat-lab6-2026-11-18` resolves to that exact application commit. A/Codex-assisted [live verification](../verification/f07-live.md) checks isolated schedule save/validation/reload, partial-entry LOGGED, reminder disable, fresh owner sign-in, foreign Participant/Manager denial and archive retention. The user entered all credentials; only a new retained test goal/entry/schedule was changed. B must review the actual evidence before Issue54 completion; no external UAT or Cloud restart/redeploy exercise is claimed.

B also approved/merged PR67's four detailed UAT cases, and explicitly confirmed the18November20:00-22:00 session only. B's22November13:00-15:00 retest remains unconfirmed. [Coordination](../labs/lab06/coordination.md) records the actual runtime tag/SHA, fixed case permalink, required session-start runtime proof and private credential handoff. A leads CPMS testing; B retains StudyTrack handoff coordination/F06 live evidence/F08 implementation. Earlier checkpoints below retain their original writing-time status.

## F07 implementation candidate - 15 November 2026

After B accepted PR55 and the user authorized implementation entry, A implemented [Issue54](https://github.com/auto4496/studytrack/issues/54) from accepted stagingf6a38bb. [Actual verification](../verification/f07.md) records259 API/unit (56 F07),66 real desktop/mobile browsers (16 F07),21 isolation checks, build and real API restart; populated additive migration preserves original synthetic data. Test-only poll refinement2/2 passes without product changes. New schema/API/GoalSchedulePanel follow the accepted contract; F04/F06 semantics/native evidence are preserved. B implementation review, protected staging integration and a separate release remain pending; keep Issue54 OPEN. A does not self-approve/deploy. F06's live evidence remains B's handoff and F08 remains B-owned. Earlier checkpoints below retain their writing-time status.

## Current A handoff - 13 November 2026

A completed the [F05 release/acceptance audit and F06 handoff](../verification/f05.md#current-acceptance---13-november-2026): accepted PR35 is in deployed main6d30aef and actual Deploy43410699104/regression passed. Issue31's remaining release gate is met; F06 still belongs to B and Sprint2 is incomplete without it. A opened Issue54 and prepared the [F07 schedule/reminder contract](../sprints/sprint-3/f07-schedule.md) with18 planned AC/test IDs for Datakung's pre-code review. No F07 schema/API/UI/migration/test was implemented or executed. B should review the explicit per-day time/reminder/state/stop/locking decisions before implementation. A will then address findings under the agreed Sprint entry flow, and continues peer-review duty for B's F06/F08 and Lab5 report. B retains Issue24/report coordination; EP7/EP8 technical results are accepted, with final report/index/joint acceptance still open. The original baseline handoff below is historical.

Date: 3 November 2026. Status: DOCUMENT DRAFTS READY FOR B REVIEW; no application implementation or executed feature tests

Historical baseline note above describes the initial handoff. **Current state:** A has implemented foundation/F-01/F-03 on `codex/member-a-sprint1`; read [latest implementation handoff](member-a-implementation.md) and [verification](../verification/member-a.md) before starting B work. Keep this original baseline chronology; do not interpret it as current absence of code

## Files now provided by A

- `docs/srs.md`: stable FR-01..FR-19, BR-01..BR-13, NFR-01..NFR-08 and feature/sprint allocation
- `docs/system-sds.md`: architecture, logical data model, auth/CSRF lifecycle, permission matrix, config/deployment/test plan
- `docs/integration-contract.md`: proposed request/response/error shapes, endpoint ownership and shared services
- `docs/decisions.md`: draft decisions/open questions; no claim of teammate/TA approval
- `docs/sprints/sprint-1/f01-auth.md` and `f03-goals.md`: A-owned contracts with AC/STS/DoD and NOT RUN status
- `docs/ai-use.md`: actual AI-assisted tasks, not human participation evidence

## B's next actions

1. Review SRS/SDS/integration contract and A contracts, record specific findings in `docs/reviews/baseline-review-b.md` or real PR review when repository exists
2. Use SRS IDs for `features.md`, `traceability.md`, `sprints/plan.md`; no need to invent a second set of requirements
3. Draft F-02/F-04 contracts and `ui-api-conventions.md` preserving payload/date/status/error conventions or explicitly proposing changes
4. Pay attention to session bootstrap+CSRF, manager-private-data403, participant cross-owner404, target/date/snapshot semantics and DB duplicate protections
5. Return changed files or actual branch/PR reference plus status; label planned tests as NOT RUN

## Questions needing B feedback

- Agree manager scope = all shared templates? If narrowing by creator, revise role matrix/endpoints/ACs before implementation
- Are template bounds 1..1440 minutes and today/tomorrow goal start suitable?
- Proposed DTOs/shared service interfaces sufficient for F-02/F-04? Agree entry component boundary in goal details route
- Accept generic401 credentials, safe404 cross-owner,422 validation,409 duplicates and standard error envelope?

## Current limitations

Private repository สร้างแล้ว: https://github.com/auto4496/studytrack; initial pre-code documents commit `11cdfe5` บน main. ไม่มี collaborator/Issues/PR review/UAT/deployment ที่ยืนยัน ต้องเพิ่ม GitHub username ของ B ก่อนเข้าถึง private repo. Source documents are not a finished Deliverable 1 PDF and are not accepted feature evidence

## A next implementation sequence

Record pre-code specs in version control; establish shared repository and bootstrap once; create Issues/branches; implement F-01 with meaningful TDD and isolated DB tests; integrate F-02 dependencies from B; implement F-03; run cross-feature E2E/integration and peer-reviewed release. Actual reviewers/versions/results to be added only after they exist

## Document verification performed

Local link/fence checks, SRS sequence (19 FR, 13 BR, 8 NFR), F-01/F-03 contract checks (16 AC and 16 planned test IDs total), and source-PDF hash comparison passed before initial commit. `git diff --cached --check` passed. These are document checks; no application build or automated feature tests have run
