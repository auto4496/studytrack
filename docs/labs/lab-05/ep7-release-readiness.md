# EP7 release A readiness

12 November 2026. Member B / Datakung prepares [sync PR44](https://github.com/auto4496/studytrack/pull/44) and [draft release PR43](https://github.com/auto4496/studytrack/pull/43). A reviews both through the protected path. This is a preparation checkpoint, not a main merge or live deployment result.

## Accepted source and history synchronization

A approved EP7 combined head `313b4fb7b8f1819ec21935b5cb90565b304a2759` in PR41 after integrating B-approved wording PR40. A merged PR41 into staging `845bfee5ecdacf6d49fa54703b787f548753814a`. B fetched both and verified full trees equal `ca1dfe1ed01b854674607058c1dd7aa2b2362b8c`. Actual combined [CI43186936178](https://github.com/auto4496/studytrack/actions/runs/43186936178) passed29 offline,152 API/unit,38 browser cases, app build and both Docker targets/revision labels. Those are accepted-source checks, not this synchronization's new check or live GCP proof.

Current main is `5c04cd4bf7a7a28ff5c429f3770efc42da6bd7e0`. It was not an ancestor of staging: historical main merge commits7314492,737c591,807ed08 and5c04cd4 had not been brought back. The accepted [EP6 contract](ep6-gate-identity.md) requires a reviewed main-to-staging synchronization under strict up-to-date checks before the next release.

B first opened direct-main PR42. GitHub reported its head BEHIND staging as well; B closed it **unmerged**, without changing either protected branch. Do not use that PR as accepted sync evidence. PR44 replaces it with dedicated branch `codex/lab5-ep7-main-sync`, based on accepted staging and merging current main. Its history-only commit `2c3f05514efb2b41fa88bc55bf55091209d54b81` has exactly the staging845bfee/main5c04cd4 parents and the same accepted tree `ca1dfe1ed01b854674607058c1dd7aa2b2362b8c`; B verified both tips are ancestors and zero file differences at that commit.

The following handoff commit updates only this readiness document, deployment.md, member-b-status.md and ai-use.md. Therefore the final PR44 tree includes newly proposed documentation and is **not** claimed identical to ca1dfe1; application, workflow, deployment scripts, schema, dependencies, tests and retained evidence remain byte-identical to accepted staging. A reviews the documentation and actual final-head CI before merging PR44. No protected-branch direct push, force push, rule change or bypass is used.

The original EP7 manifest remains tied to historical4a270c7: all15 entries can be verified at that commit;14 remain identical on the combined source. The current lifecycle browser spec includes accepted wording/screenshot paths plus B's form-ready assertion, so do not compare it to the historical hash as if it were unchanged. A's PR41 review and fresh combined CI explicitly cover that difference. Historical screenshots/reports are retained without replacement.

## Release preflight observations

B independently read GitHub settings during this preparation:

- Main still requires one peer approval, resolved threads and strict `test-and-docker` from GitHub Actions app15368. This statement describes the enforced controls, not a claim that this new release has already passed them.
- Environment `demo` has one branch policy: branch `main`. Its four non-secret values match project `studytrack-cpe334`, region `asia-southeast1`, provider `projects/981693883236/locations/global/workloadIdentityPools/github-actions/providers/github-main` and deployer `studytrack-deployer@studytrack-cpe334.iam.gserviceaccount.com`.
- No other open main release existed before PR43. Main remains unchanged at this writing. No fresh authenticated GCP/IAM audit, successful WIF exchange or cloud operation is claimed; prior operator-provided EP6 readbacks retain their original provenance.

## Ordered handoff to A and B

1. A reviews PR44's ancestry, four-document scope and latest CI, then merges normally into staging. B verifies the accepted merged tree against the reviewed head and verifies current main is an ancestor. A stale or changed main/staging requires another legitimate synchronization/check, not a bypass.
2. PR43 automatically follows staging's new head. B confirms the final release diff, tree, links and fresh required CI, then takes it out of draft for A's separate exact-head release review. This release carries accepted F05 lifecycle behavior, wording, EP6 evidence, EP7 implementation and the EP8 plan/template only.
3. Merging PR43 into main automatically starts **Deploy demo** for the reviewed source. Review/merge deliberately because this is an actual release into the existing GCP service, not just a documentation update. B follows the run to completion and records any real failure before deciding on a correction or rerun. Do not invoke the bootstrap, change IAM or publish credentials to troubleshoot.
4. Verify accepted main tree equals the approved release tree. Then EP6's remaining reviewed-release checkpoint is complete and Issue21 can close. This does not require completing EP7's later release B or EP8. Development linkage alone is not acceptance; if GitHub closes an incomplete linked Issue22 on merge, reopen it immediately and retain its remaining criteria.
5. For real release A, retain source/workflow SHA, runtime/tools digests, waited migration execution, serving revision/100% traffic, public origin and health/UI smoke. With A, perform the domain checks and read-only Console corroboration described in the [runbook](ep7-release.md), then fill an actual record from the unchanged [NOT_RUN template](ep7-record.template.json).
6. Capture the joint [EP8 baseline](persistence-test-plan.md) after successful release A and before a later reviewed visible-change release B. PR40 wording is already in release A; choose another later visible change with A. Keep Issue22 open until both real releases/evidence are accepted, Issue23 open until its actual restart/redeploy checks, and Issue24 open until its documentation/PDF criteria hold.

PR44's final check results and PR43's subsequent ready/review/main/run checkpoints belong in their actual GitHub PR/check records. This document deliberately does not invent their future outcomes. The GitHub Project board remains inaccessible to B's current token without read:project; no permission expansion or unperformed card update is claimed.
