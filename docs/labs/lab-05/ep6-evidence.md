# EP6 execution evidence: required merge gate and identity setup

10 November 2026 (Asia/Bangkok), member B / Datakung. [Issue #21](https://github.com/auto4496/studytrack/issues/21) remains open. The C-02 failing-PR demonstration and scoped cleanup are complete; GCP scope readbacks, the legitimate protected green-PR path and joint evidence acceptance/release remain pending. Successful WIF authentication/deployment is an EP7 observation, not established here.

## Reviewed plan and actors

A approved [PR #34](https://github.com/auto4496/studytrack/pull/34) at `80de8df05f7d535e777c971805ac2f6c42eff7bb`, including the main/staging gate and immutable WIF condition in the [contract](ep6-gate-identity.md). A configured repository settings and reviewed the probe. The B-side human operator ran the GCP commands and supplied their output and the original browser screenshot. B's tooling performed local tests, independent GitHub readbacks, PR creation/linkage, evidence verification and cleanup. No actor's review is substituted for another actor's execution.

Accepted main was and remains `5c04cd4bf7a7a28ff5c429f3770efc42da6bd7e0`. This documentation branch starts at accepted staging `f21e561a32f4414b72c38abb9cf197e1ac46fef8`, including reviewed F05 PR35. The intentionally failing probe never entered either accepted branch.

## GitHub settings actually read back

Evidence files are in [the execution folder](../../../artifacts/evidence/lab5-cloud/ep6/2026-11-10-c02/README.md), with [SHA-256 manifest](../../../artifacts/evidence/lab5-cloud/ep6/2026-11-10-c02/sha256.json).

| Item | Actual observation |
| --- | --- |
| Environment | `demo`; custom deployment branch policy, a single rule of type branch named `main` |
| Variables | Exactly `GCP_PROJECT_ID=studytrack-cpe334`, `GCP_REGION=asia-southeast1`, the reviewed `github-actions/providers/github-main` full provider path and `studytrack-deployer` service-account email |
| Identity contract | Immutable subject prefix `repo:auto4496@137795002/studytrack@1443962980`; GitHub environment suffix `:environment:demo` |
| Ruleset | [26925123](https://github.com/auto4496/studytrack/rules/26925123), Active; exact main and codex/sprint-1-staging targets, no exclusions |
| Review/check | One approval, dismiss stale approvals, resolve review threads; strict `test-and-docker` from GitHub Actions app15368; deletion/force-push protection |
| Bypass | GraphQL `bypassActors` returned totalCount0/nodes[]; B cannot bypass. A separately confirmed the empty list. REST omits bypass actors for B, so omission alone was not treated as proof |

Observed default parameters additionally allow merge/squash/rebase and set `require_extra_approval_for_unattributed_changes=true`; merge commits remain available. Environment `can_admins_bypass=true` is a separate field, not the branch-ruleset bypass list. The accepted plan did not require an environment reviewer/wait timer. All original readbacks are retained.

## C-02 normal failing PR and post-approval block

[PR #36](https://github.com/auto4496/studytrack/pull/36) was a normal, non-draft PR into main from `codex/prove-gate-c02`. Exact probe `f6330b82a325c119e23d0704565dbdf223377d0e` has accepted main5c04cd4 as its sole parent and changes one assertion only: 45/60 expects intentionally wrong74 instead of correct75 in `server/tests/unit/entry-rules.test.ts`. No product, workflow, dependency or deployment file changed. Actual Development linkage to #21 was added and verified in both directions.

| Stage | Actual result |
| --- | --- |
| Focused original unit file | 19 passed on accepted main before introducing the probe |
| Focused probe unit file | 18 passed, 1 failed at expected74/received75; pure unit imports, no database connection/migration |
| [Hosted CI42781653763](https://github.com/auto4496/studytrack/actions/runs/42781653763) | 116 passed, 1 failed at that same assertion; migration/setup and preceding offline/container checks succeeded; later browser/build/Docker steps skipped |
| [A approval](https://github.com/auto4496/studytrack/pull/36#pullrequestreview-5838791656) | APPROVED exact f6330b8 at 08:25:03Z solely for the controlled demonstration; explicitly DO NOT MERGE |
| Post-approval readback | APPROVED + BLOCKED; required `test-and-docker=FAILURE`; no unresolved review thread; conflict mergeable=true; auto_merge=null; merged=false; base unchanged |

The temporary local dependency-install attempt using offline cache lacked a zod tarball. Normal lockfile installation succeeded before tests. This setup issue is not the red assertion proof.

The human-provided image visibly shows PR36's URL, A's exact-commit approval, Changes approved, failed `test-and-docker` with a Required label and the disabled Merge pull request button. The image was copied byte-for-byte; no synthetic capture or visual edit was used. Its original timestamp is not inferred from the filename or relative UI time.

![PR36 after peer approval: required CI failed and Merge disabled](../../../artifacts/evidence/lab5-cloud/ep6/2026-11-10-c02/pr36-approved-required-failure-blocked.png)

Image SHA-256: `c3014d2c6c2e7da337c7d2dbdaa5b30f3d74f33925900e3279387f29b25c6f46`.

## Close and cleanup

After preserving the screenshot, B closed PR36 at `2026-11-10T08:30:58Z` (15:30:58 Bangkok). REST confirms CLOSED, merged=false and merged_at=null. The remote probe ref was checked against exact f6330b8 and deleted using a matching SHA lease; B detached the clean local worktree at accepted main and deleted only the local probe branch. Both probe branch refs are absent. Closed PR/review/failed run/commit history and a saved patch remain available. Main still equals5c04cd4. No merge, auto-merge, rule change or bypass was attempted. [Cleanup readback](../../../artifacts/evidence/lab5-cloud/ep6/2026-11-10-c02/cleanup.json).

Independent read-only HTTP checks after cleanup returned200 for the public UI and200 with data.status=ok/service=StudyTrack API for `/api/health`. These establish current public/DB-backed health, not a new authenticated journey or independent image/revision provenance. No cloud mutation was used for this check.

## GCP operator observations and remaining checks

The B-side operator's pasted Cloud Shell output reports API enablement, creation of `studytrack-deployer`, successful grants of project Run Developer, repository studytrack Writer and actAs on runner/migrator, and zero user-managed keys (`[]`). Subsequent actual CLI readback shows pool `github-actions` and provider `github-main` ACTIVE, the reviewed mappings/issuer/five-part condition and the attribute-scoped `workloadIdentityUser` binding on the deployer. The [execution record](ep6-record.json) distinguishes this human-supplied evidence from B's independent GitHub API readbacks. B has no independently authenticated GCP connection.

Before closing #21, collect safe API/role readbacks at the exact project/repository/service-account scopes plus Console evidence as required by the guide; compare them with the accepted [deployer contract](ep6-gate-identity.md#3-guide-62-proposed-deployer-permissions). No raw tokens, passwords, connection strings or service-account key JSON belong in the evidence. Mask project-number portions of submitted GCP screenshots as instructed by the guide; the GitHub screenshot above contains no project number. Successful actual credential exchange remains NOT RUN until the separately reviewed EP7 workflow.

The legitimate protected green-PR path must still be observed under the now-active rules, followed by A review of this evidence and the reviewed staging/main handoff. This documentation PR can exercise the staging path after CI passes and A approves; do not treat the older pre-gate PR30 CI as proof of the new enforcement. Use reviewed main-to-staging sync PRs if strict up-to-date checks require synchronization. Issue21 stays open for these remaining criteria; #22/#23/#24 remain separate.
