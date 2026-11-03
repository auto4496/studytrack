# Member B verification ledger

Pre-implementation: NOT RUN. Specs align A foundation2370df9. F02 depends temporarily on unmerged A PR3; F04 will depend on F02. No peer approval/accepted release/CI/GCP claims. Tests use isolated PostgreSQL studytrack_b_test on loopback26433, not A/dev DB. Runtime secrets in ignored env only. Actual evidence will be appended after execution with source commits/commands/counts/results and AC mapping

## F02 actual execution

Source a3769d4c16f101268a96496326bc18c3766660b5. Contract ee14477; red source0e1ca17. API red:15 fail/1pass (expected POST201/422/403, got404 from read-only adapter). Green:26 F02 unit/API checks; full API/unit regression64pass/0fail/0skip; selected browser6pass at desktop1440x900/mobile390x844. npm run build succeeded. Evidence [execution](../../artifacts/evidence/member-b/f02-execution.json), [red](../../artifacts/evidence/member-b/f02-red-output.txt), [regression](../../artifacts/evidence/member-b/f02-regression-output.txt), [browser](../../artifacts/evidence/member-b/f02-browser-output.txt). No A peer acceptance, CI, cloud or fullSprint1 release implied

| AC | Actual file/name IDs | Result / source |
|---|---|---|
| AC-F02-01 | server/tests/integration/templates.test.ts TEST-F02-01/11 | PASS / a3769d4 |
| AC-F02-02 | server/tests/unit/template-rules.test.ts TEST-F02-02; integration/templates.test.ts TEST-F02-03 | PASS / a3769d4 |
| AC-F02-03 | integration/templates.test.ts TEST-F02-04 | PASS / a3769d4 |
| AC-F02-04 | integration/templates.test.ts TEST-F02-05 | PASS / a3769d4 |
| AC-F02-05 | integration/templates.test.ts TEST-F02-06 | PASS / a3769d4 |
| AC-F02-06 | integration/templates.test.ts TEST-F02-07; e2e/member-b.spec.ts TEST-F02-10 | PASS / a3769d4 |
| AC-F02-07 | integration/templates.test.ts TEST-F02-08 | PASS / a3769d4 |
| AC-F02-08 | e2e/member-b.spec.ts TEST-F02-09 validation/pending/unknown-outcome/read-retry/empty (controlled UI errors); real persistence covered separately | PASS / a3769d4 |
| AC-F02-09 | e2e/member-b.spec.ts TEST-F02-10 real manager→template→participant goal | PASS / a3769d4 |
