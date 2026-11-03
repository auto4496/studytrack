# Member A handoff — baseline v0.1

Date: 3 November 2026. Status: DOCUMENT DRAFTS READY FOR B REVIEW; no application implementation or executed feature tests

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
