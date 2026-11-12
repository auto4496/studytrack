# EP6: merge gate and keyless deployment contract

Execution update, 10 November 2026: this document retains the pre-execution proposal and dated baseline below. See [actual EP6 evidence](ep6-evidence.md) and [partial execution record](ep6-record.json) for configured GitHub settings, human-reported GCP setup, completed C-02 probe/cleanup and remaining acceptance work. The original NOT_RUN template is deliberately unchanged.

Version 0.1, 9 November 2026 (Asia/Bangkok). Owner/coordinator: B / Datakung; reviewer: A / auto4496. [Issue #21](https://github.com/auto4496/studytrack/issues/21). **PROPOSED; configuration and C-02 execution have not been performed.** A reviews this exact configuration before human-operated IAM changes. B can prepare/review PRs with the current WRITE access; the repository owner performs administrative settings. This record does not grant new access.

## 1. Sources, prerequisite and observed baseline

Read all Episode 6 pages 56-80 of Student Guide V1.1, the Lab5 handout Sections 7-8/12, the starter deploy workflow/release script, [team allocation](../../team-plan.md), [review workflow](../../review-workflow.md), [current CI](../../../.github/workflows/ci-docker.yml) and the accepted EP5 evidence. The handout controls assessed requirements. EP5 release [PR #30](https://github.com/auto4496/studytrack/pull/30) merged to main `5c04cd4bf7a7a28ff5c429f3770efc42da6bd7e0`; #20 is closed. That tree equals staging `e16b0af2ccfbc6bd39a2f15982537531b21960f5`.

Live read-only GitHub results on 9 November:

| Item | Observed value |
| --- | --- |
| Repository / owner | `auto4496/studytrack`; A owns the repository, B is Datakung |
| Repository ID / owner ID | `1443962980` / `137795002` |
| B connection permission | WRITE; REST permissions.admin=false / maintain=false |
| Visibility / default branch | public / main |
| OIDC customization | use_default=true, use_immutable_subject=true, sub_claim_prefix=`repo:auto4496@137795002/studytrack@1443962980` |
| Environments | none |
| Rulesets / active branch rules | none; main and codex/sprint-1-staging each returned no active rules |
| Published required-check candidate | `test-and-docker`, GitHub Actions app ID `15368`, slug `github-actions`; observed on passing PR #33 |

GCP pool/provider/deployer existence and current permissions have not been inspected by B in this preparation. Project `studytrack-cpe334`, project number `981693883236` and region `asia-southeast1` come from the EP5 record and must be rechecked by the authenticated operator before changes. Record these observations separately from the [NOT_RUN execution template](ep6-record.template.json).

## 2. Order and work split

1. A reviews this contract, role scopes, immutable subject and [proposed ruleset](ep6-ruleset.proposed.json). Resolve findings before applying settings. Accepting documents does not complete #21.
2. B coordinates the GCP operator through guide 6.1-6.3. The human with the project permissions creates/verifies the deployer and WIF; no JSON service-account key is created or shared.
3. A, as repository administrator, configures environment `demo` / its four variables / main-only deployment rule and applies the reviewed branch rules (guide 6.4-6.5). B independently reads back what is visible and reviews safe screenshots.
4. B performs the controlled normal failing PR only after the gate is active (6.6). A reviews the probe's scope and both inspect the blocked merge. Retain the failed run and blocked-button screenshot before closing the probe.
5. Record actors, exact settings/ruleset ID, checks and evidence; review and release the resulting documentation before closing #21 (6.7). Actual keyless authentication/deployment is exercised by the separately reviewed EP7 workflow in #22; distinguish configured trust from a successful credential exchange.

PR #33's [EP8 plan](https://github.com/auto4496/studytrack/pull/33) is preparation for #23, not a prerequisite for starting EP6. B approved that plan and [F05 contract PR #32](https://github.com/auto4496/studytrack/pull/32) separately. F05 implementation is independent; do not wait for Sprint 2 completion to configure the Lab5 gate.

## 3. Guide 6.2: proposed deployer permissions

After peer acceptance, verify the selected project and inspect existing resources in Console before creating or changing them. Enable **IAM Service Account Credentials API** (`iamcredentials.googleapis.com`) and **Security Token Service API** (`sts.googleapis.com`) if needed. IAM API was enabled in EP5. Create/verify `studytrack-deployer@studytrack-cpe334.iam.gserviceaccount.com`.

| Grant to studytrack-deployer | Exact scope | Purpose |
| --- | --- | --- |
| `roles/run.developer` | project studytrack-cpe334 | Update existing Run service and migration job; execute the job |
| `roles/artifactregistry.writer` | repository studytrack, asia-southeast1 | Push/read immutable runtime and tools images |
| `roles/iam.serviceAccountUser` | studytrack-runner service account only | Act as the existing runtime identity |
| `roles/iam.serviceAccountUser` | studytrack-migrator service account only | Act as the existing separate migration identity |

The second actAs grant is a necessary StudyTrack adaptation of the starter's single runtime identity. Existing runner/migrator Cloud SQL and per-secret access stay on those identities. The deployer does not receive application-secret accessor, project Owner/Editor, IAM administration, SQL administration or service-account key permissions.

EP7 will build both Docker targets in GitHub Actions and push directly to Artifact Registry, following the starter release path. This deployer therefore needs no Cloud Build create/actAs or source-bucket role. The bootstrap's builder identity remains separate. The future release updates existing service/job images, retains DB/secret settings and public access, and does not use bootstrap API/IAM/SQL/secret creation or public-IAM policy mutation. Review the actual #22 script before executing it; this document is not that implementation.

## 4. Guide 6.3: exact WIF proposal

Create/verify pool `github-actions`, provider `github-main`, location `global`, issuer `https://token.actions.githubusercontent.com/`, default audience. Map:

```text
google.subject=assertion.sub
attribute.repository_id=assertion.repository_id
```

Use the actual immutable subject observed from this repository. Provider attribute condition (one expression, no placeholders):

```text
assertion.repository_id == '1443962980' && assertion.repository_owner_id == '137795002' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == 'auto4496/studytrack/.github/workflows/deploy.yml@refs/heads/main' && assertion.sub == 'repo:auto4496@137795002/studytrack@1443962980:environment:demo'
```

Grant `roles/iam.workloadIdentityUser` **on the deployer account**, using the matching repository attribute only:

```text
principalSet://iam.googleapis.com/projects/981693883236/locations/global/workloadIdentityPools/github-actions/attribute.repository_id/1443962980
```

The numeric owner/repository guards, main ref, exact deploy.yml path and demo subject must all match. A legacy name-only subject is not the observed setting and must not be substituted just to suppress an error. If customization changes, stop and review the actual claim contract. Do not print a raw OIDC/access token for troubleshooting. The GitHub job requires `contents: read`, `id-token: write`, `environment: demo`, and auth via service-account impersonation; these are #22's implementation interface.

Verify provider state/mapping/condition, the scoped impersonation binding and that the deployer has **zero user-managed keys**. In Console inspect its Keys tab; CLI readback can use `gcloud iam service-accounts keys list --iam-account=studytrack-deployer@studytrack-cpe334.iam.gserviceaccount.com --managed-by=user --project=studytrack-cpe334`. No key should be created to make a check pass.

## 5. Guide 6.4: GitHub environment for A to configure

After the GCP identifiers and permissions are verified, A opens Settings -> Environments -> creates/verifies **demo**. Under deployment branches and tags use **Selected branches and tags**, add a **branch** rule for **main** only. Do not substitute "protected branches": both main and staging will be protected, but staging must not deploy.

Add these **environment variables**, not secrets:

| Exact variable name | Proposed value |
| --- | --- |
| GCP_PROJECT_ID | studytrack-cpe334 |
| GCP_REGION | asia-southeast1 |
| WIF_PROVIDER | projects/981693883236/locations/global/workloadIdentityPools/github-actions/providers/github-main |
| WIF_SERVICE_ACCOUNT | studytrack-deployer@studytrack-cpe334.iam.gserviceaccount.com |

Verify all four values and the main branch rule. Environment name, workflow environment and condition subject must all be `demo`. Provider paths/project numbers are configuration identifiers, not credentials; follow guide p79's masking instruction for project-number portions of submitted screenshots while retaining usable configuration privately/in the reviewed config. No deployment password or JSON key is needed in GitHub.

## 6. Guide 6.5: concrete proposed merge gate

The [JSON payload](ep6-ruleset.proposed.json) is ready for A to review/apply. It targets **main and codex/sprint-1-staging** to cover this team's two-stage flow. This expands the guide's main-only example explicitly, without changing who owns the work.

- Active branch ruleset; empty bypass list, including the owner/admin.
- One required peer approval; dismiss stale approvals after a new reviewable push; resolve review threads.
- Require `test-and-docker` from observed GitHub Actions app15368 and require the branch to be up to date.
- Block deletion and force pushes. Keep merge commits available; do not enable linear-history or blanket update restrictions.

A may use the Console UI selections from the guide or, after acceptance and confirming no equivalent rule already exists, apply the reviewed file with:

```bash
gh api repos/auto4496/studytrack/rulesets --method POST \
  --input docs/labs/lab-05/ep6-ruleset.proposed.json
```

This is a proposed **mutating admin action**, not a command executed during preparation. If a matching ruleset already exists, inspect its ID/configuration and review any update rather than creating duplicates. B's current WRITE connection cannot apply it; requesting a bypass or broad admin access is unnecessary for normal B work.

Read back active rules for **both** branches, check context/app/strict policy/approval count, and inspect the owner-visible empty bypass list. A green check alone does not prove enforcement. With strict up-to-date checks, sync an accepted main merge back into staging through a reviewed **main -> staging PR** before the next release when needed; direct pushes/force pushes or bypasses are not a substitute. A stale required check must be rerun after the legitimate branch update.

## 7. Guide 6.6: controlled failing PR, after configuration

Use a normal, non-draft temporary PR **into main**, from `codex/prove-gate-c02`. Start from current accepted main. Change only one existing business-rule assertion in `server/tests/unit/entry-rules.test.ts`: the 45/60 expected progress75 becomes74. This is an intentionally wrong expectation to demonstrate the gate, not a domain-red test or a proposed product correction. Keep the assertion and its local failure visible.

1. Confirm the active rules/empty bypass and baseline check first. Run the focused existing unit file locally using the accepted test runner; retain the assertion failure (actual75 versus deliberately expected74), not a missing dependency/configuration failure.
2. Push/open the normal temporary PR; link Development to #21. Confirm `test-and-docker` actually fails at the intended assertion. Do not weaken the CI workflow or required rule.
3. A reviews the test-only probe; a peer approval can remove a missing-review blocker so the failed required check is demonstrably what prevents merging. Both retain the failed Actions run, Required check label and disabled/blocked merge message with PR URL/commit visible. **Never merge this probe and never bypass the rule.** No merge API experiment is required.
4. Close the probe without merging after preserving the evidence. Delete only its temporary remote/local branch after checking it is the probe; retain the closed PR/run/commit history. Record actual cleanup. Do not delete or rewrite accepted branches/evidence.
5. Verify a legitimate peer-reviewed green PR still follows the protected path. The accepted application and live data remain unchanged. Re-check main and record any discrepancy rather than claiming the intentionally failing branch is accepted code.

## 8. Acceptance and evidence

Every execution case below is **NOT RUN**. Use a copy of the record template for actual observations; do not fill unknown values with PASS.

| ID | Required actual evidence |
| --- | --- |
| EP6-G01 | Current numeric IDs / immutable subject setting confirmed before configuration |
| EP6-G02 | Credential/STS APIs, deployer roles at the exact scopes and zero user-managed keys |
| EP6-G03 | Enabled WIF provider, exact mapping/five-part condition and scoped deployer impersonation |
| EP6-G04 | Environment demo, main-only branch selection and four non-secret variables |
| EP6-G05 | Active rules on main/staging, empty bypass, peer review and strict required GitHub Actions check |
| EP6-G06 | Intended assertion fails locally and in a normal PR; required failure visibly blocks merge |
| EP6-G07 | Probe closed unmerged, cleanup recorded, accepted application/history intact; legitimate PR path works |
| EP6-G08 | Both members review actual evidence/settings and accepted handoff/release; distinguish configured WIF from the first real #22 credential exchange |

Store safe evidence in `artifacts/evidence/lab5-cloud/ep6/<run-id>/` after execution, with source/run/PR/ruleset IDs, actors, URL-visible blocked-gate captures and provider/environment screenshots. Mask any credential value and project-number portions when required by the guide. No raw token, password, connection string, key JSON or HAR is an evidence artifact. Keep #21 open until its real checklist is met; this contract does not complete EP6, EP7, EP8 or the final PDF.

Primary references: [GitHub rules and administrator permission](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets), [ruleset API](https://docs.github.com/en/rest/repos/rules), [immutable OIDC subject/claims](https://docs.github.com/en/actions/reference/security/oidc), [Google WIF for deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines), [Google authentication action](https://github.com/google-github-actions/auth). These support the platform mechanics; the two-branch policy and runner/migrator split are StudyTrack design choices for A review.
