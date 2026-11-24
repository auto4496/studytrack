# Lab 7 · F-02 title change verification

[Issue #75](https://github.com/auto4496/studytrack/issues/75) · [Reviewed contract PR #77](https://github.com/auto4496/studytrack/pull/77) · [Change contract and impact](f02-title-change.md)

## Versions and sequence

| Step | Exact version or result |
| --- | --- |
| Accepted Sprint 1 behavior reference | `ef0de7f877dcabe8ec330eb2c0029d9cebf8ed40` / `uat-lab6-2026-11-18` |
| Reviewed pre-change staging | `ebe561dfab364617820ad2692578f762cf56ee85`; merges the reviewed contract. Product validation still permits 1–100 trimmed code points. |
| RED test-only commit | `892d43738cdbcdb7486bac042cfed46e4836d6e1` |
| GREEN implementation | `3340c8ccdeb61c8c3efb686e280615683ffe5c1e` |
| Integration, reviewed main release, deploy and post-deployment smoke | Pending. Use the actual release SHA and Cloud Run revision when available. |

## Reproduced RED

On 24 November 2026 ICT, after existing migrations on an isolated local PostgreSQL database, an authenticated synthetic Manager sent a POST with a valid origin, CSRF and minute range and the title `" AB "`. The pre-change route returned **201**, where the test asserts **422** and no new row. This was a valid setup and the existing behavior reached the real route and database.

```text
npm exec -- vitest run server/tests/integration/lab7-template-title.test.ts
TEST-L7-F02-POST: rejects two trimmed code points without creating a template
AssertionError: expected 201 to be 422
Test Files  1 failed (1)
Tests       1 failed (1)
```

## GREEN and preserved behavior

Both write paths use the same trimmed-title schema in [rules.ts](../../../server/src/features/templates/rules.ts). A new or supplied title needs 3–100 Unicode code points. [TemplateLifecycle](../../../client/src/features/templates/TemplateLifecycle.tsx) compares the trimmed draft with the saved title and sends only `description` when they match. The existing database constraint and records preserve legacy short titles.

| Evidence | Actual local outcome |
| --- | --- |
| [API and unit cases](../../../server/tests/integration/lab7-template-title.test.ts) · [unit boundaries](../../../server/tests/unit/template-rules.test.ts) | `npm exec -- vitest run server/tests/integration/lab7-template-title.test.ts server/tests/unit/template-rules.test.ts` — 19 passed, 0 failed, 0 skipped. The original RED assertion passed. Both routes accepted trimmed 3/100, rejected 0/1/2/101, counted astral characters correctly, preserved old rows and rejected Participant writes. |
| [Browser case TEST-L7-F02-UI](../../../e2e/member-b.spec.ts) | `npm run test:e2e -- e2e/member-b.spec.ts -g TEST-L7-F02-UI --reporter=list` — desktop 1440×900 and mobile 390×844 both passed. The description-only request body was exactly `{ "description": "Lab 7 legacy description updated" }`. Reload retained the two-code-point title. A Participant could still select the template and create a goal. |
| Production build | `npm run build` passed for server and client. |

## Hosted browser follow-up

[The first implementation CI run](https://github.com/auto4496/studytrack/actions/runs/45354917110) passed the API/unit step and 68 browser cases. The two new Lab 7 cases reached the legacy edit and timed out at the next sign-in because the test began a new navigation immediately after clicking logout. The test now waits for the sign-in URL before logging in as the Participant. The application code and all title/legacy assertions are unchanged by this follow-up.

Local runs used synthetic data. Confirm the required GitHub CI, substantive teammate implementation review, integration and post-deploy behavior before recording the release as accepted.
