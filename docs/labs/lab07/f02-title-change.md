# Lab 7 · F-02 template title minimum

**Proposal for teammate review, 24 November 2026 ICT.** B (Datakung) prepares the bounded change; A (auto4496) reviews the revised contract before product code. [Issue #75](https://github.com/auto4496/studytrack/issues/75) tracks the request.

## Authorization and versions

[Teammate's dated record of the instructor's clarification](https://github.com/auto4496/studytrack/issues/75#issuecomment-7125392561) says the team can proceed with the proposed minimum and that a separate TA discussion or sign-off is not required. This record attributes the clarification to the instructor without supplying a personal name or inventing a separate approval.

| Version | Role |
| --- | --- |
| [Sprint 1 `uat-lab6-2026-11-18`](https://github.com/auto4496/studytrack/tree/uat-lab6-2026-11-18), `ef0de7f877dcabe8ec330eb2c0029d9cebf8ed40` | Accepted reference for the original F-02 behavior. Cloud Run revision `studytrack-gef0de7f877dc-r44090861325-1`. |
| [Staging `1aae2decccd00cb278a4e1adcd6abcb24843ebdb`](https://github.com/auto4496/studytrack/commit/1aae2decccd00cb278a4e1adcd6abcb24843ebdb) | Verified contract-branch base, including the separately reviewed Lab 6 Part D display fix. Refresh the staging SHA when opening the implementation branch. |
| Contract review, RED, GREEN, reviewed release and deployed revision | Pending. Record the exact SHA/date and evidence ID for each as it occurs. |

## Changed behavior

Old: trim outer whitespace and accept **1–100 Unicode code points** for a template title. A short label such as `AB` is valid today.

New: when creating a template or supplying a title in a metadata PATCH, apply the existing trim and accept **3–100 Unicode code points inclusive**. Use code points, including for astral characters, with no extra Unicode normalization. An authenticated Manager with an otherwise valid request receives field-level 422 with `fields.title` for an invalid title. Invalid POST creates no row; invalid PATCH leaves the title, description and timestamps intact. A valid POST stores the trimmed title; a valid PATCH returns the committed trimmed title.

This gives readers a minimum label length in the shared activity catalog. Duplicate labels remain allowed. The server is authoritative; Manager forms surface the rule and retain the input on rejection. The edit form omits `title` when its normalized value equals the stored title. A description-only PATCH preserves the existing title, including a legacy short title. An API request explicitly supplying a short title still gets 422.

## Impact and preservation

| Requirement / layer | Contract and planned verification | Affected area and preservation |
| --- | --- | --- |
| FR-05 / BR-01, F-02 create | [SRS](../../srs.md), [F-02 AC-F02-02 and TEST-F02-02/03](../../sprints/sprint-1/f02-templates.md) | Template request schema and Manager create form. Description, minute ranges, existing DTO, CSRF and catalog behavior stay as specified. |
| FR-10 / BR-01, F-05 metadata | [F-05 AC-F05-10 and TEST-F05-10](../../sprints/sprint-2/f05-lifecycle.md) | Same authoritative title rule in `server/src/features/templates/rules.ts`; PATCH and `TemplateLifecycle.tsx` preserve omitted fields and report validation. Keep lifecycle locks and inactive-template behavior. |
| UI feedback and regression | `TEST-L7-F02-UI`, F-02 browser flow and F-05 lifecycle flow | `TemplateForm.tsx`, `TemplateLifecycle.tsx`; verify errors and successful writes at 1440×900 and 390×844. |
| Authorization and downstream consumers | BR-07, AC-F02-04, AC-F05-13, F-02/F-03/F-04 continuity | Preserve role/session/CSRF checks, visible catalog rules, existing goal title snapshots, progress and ownership. Verify with existing integration/browser assertions. |
| Persistence and old rows | [System-Level SDS](../../system-sds.md), `TEST-L7-F02-LEGACY` | The existing DB rule allows 1–100 characters, so legacy short titles remain readable. No migration or backfill. Check a persisted short template still appears and can be selected, description-only edit works, and existing goal snapshots do not change. |

## Planned test sequence

1. **RED: `TEST-L7-F02-POST`.** In a dedicated PostgreSQL test database, sign in as a synthetic Manager with valid CSRF and POST `{title:" AB ",minMinutes:1,maxMinutes:1440}`. Assert field-level 422 and the same row count. On the old rule a valid setup should reach the endpoint and return 201. Preserve the assertion failure and exact pre-change/test SHAs. A login, setup or migration failure is not RED evidence.
2. **GREEN boundaries: `TEST-L7-F02-UNIT`, `TEST-L7-F02-POST`, `TEST-L7-F05-PATCH`.** For both title-writing paths check spaces-only or 0, 1, 2, 3, 100 and 101 trimmed code points. Include two versus three astral characters to distinguish code points from UTF-16 units. Three and 100 succeed and reload trimmed; invalid values report the title field and perform no write. A mixed invalid title plus valid description PATCH cannot change either field.
3. **Preserved behavior: `TEST-L7-F02-LEGACY`, `TEST-L7-F02-UI`.** With a persisted two-code-point title, verify catalog retrieval, Participant selection/goal creation, Manager description-only editing, and existing snapshot/progress retention. Verify a Participant cannot POST or PATCH a template and the submitted row state stays unchanged. Retain browser captures/results and the relevant original F-02/F-03/F-04/F-05 regression results.
4. **After review and CI:** use the normal staging/main release flow. Record the exact deployed revision, smoke-check the new two/three boundary and a preserved reading journey using synthetic data, and retain actual commands/counts and results in the Lab 7 evidence. The contract PR carries planned tests only.
