# AI-use declaration — working record

Date: 3 November 2026. Tool: Codex, used by member A in the current chat

Assisted tasks actually performed so far:

- Read assignment PDFs and explained deadlines, engineering requirements and contradictions
- Proposed project scope, pair-work plan and member B handoff
- Drafted SRS v0.1, System SDS, shared integration surface, decision log and F-01/F-03 contracts
- Prepared local planning/handoff files and performed document consistency checks (when recorded)
- Initialized local StudyTrack Git repository and created/pushed private `auto4496/studytrack`; initial pre-implementation docs commit `11cdfe5`; no peer review or product release implied
- Implementation round: scaffold + F-01/F-03 API/React UI, SQL migrations/seed/test isolation, meaningful red/green capture, actual API/browser/restart checks and implementation handoff; see current verification artifacts

Application implementation and local test results now have explicit source/output records; they do not establish human peer approval, UAT, deployment or course acceptance. Member B's AI use and each person's actual contribution must be added by that person using real work references. Full prompt transcripts are not required by the handout

Human responsibilities: read/understand requirements and changes, run and inspect meaningful tests, inspect diff, review peer work, verify claims and explain sampled engineering decisions. AI-generated proposed assignments are not proof of participation

## Member B implementation — 3 November 2026

4 November after A approval/merge: Codex read actual PR6/7 reviews and raw reports, verified both PRs merged and Issues4/5 closed, and compared accepted staging85f510f with reviewed/tested revisions. There are no product changes since the passing suites, so this round checks evidence/source equivalence and updates release handoff documents without rerunning runtime suites. Prepared docs for peer review and a draft staging-to-main release; no main merge, human UAT or completed D1 PDF is claimed.

4 November after PR3 merge: Codex verified accepted staging1a4b74b, merged it into existing F02 and then F04 without rewriting published history, resolved two documentation-only conflicts, and executed new isolated regressions. F02 source5e340f8:66 API/unit +16 browser/build/restart pass. F04 sourceafca38f:117 API/unit +24 browser/build/full B persistence restart pass. Prepared current evidence/handoff, retargeted PR6 to staging and marked it ready for A review; PR7 remains draft on F02 pending acceptance. No B PR approval/merge, Sprint1 release or external team message claimed.

4 November re-review: at B's explicit request, Codex reviewed the PR3 correction and confirmed head 94156cf was unchanged from the 3 November independent focused checks (9 guard tests and 2 alias probes passed). Inspected A's separate full regression evidence and submitted APPROVED review 5764429004 as Datakung, with test attribution and scope stated. No new full-suite run, merge, PR retarget or release was performed.

Workflow follow-up: Codex read the local TokTickIT README/Lab4 review record without modifying that project, checked actual GitHub contract/release PR metadata and current StudyTrack PR3/6/7, and documented the equivalent pair-review/staging/release/final-main procedure in docs/review-workflow.md. This follow-up changes documents only; no new application tests, peer approval, PR retarget, merge, board update or release is claimed.

Codex assisted B with A foundation/interface review, reconciliation of B contracts before code (ee14477), F02/F04 tests and implementation, isolated local PostgreSQL setup, browser/restart/build execution and result inspection. Final source0b51571:115 API/unit +24 browser checks pass; initial failures retained. B must read/understand changes before accepting. Authenticated GitHub CLI account verified Datakung for B work; no A approval/merge/UAT/cloud actions performed. AI review/test execution is not a human teammate approval
