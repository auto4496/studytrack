# EP7 repeatable main release

12 November 2026. Member B implementation candidate for Issue22; A reviews before staging acceptance and a separate reviewed main release. See the [interface/test plan](ep7-release-contract.md) and [offline verification](ep7-verification.md). No live EP7 result is claimed here.

## First pipeline release A

1. A reviews this staging PR, its checks, update-only commands and environment/WIF interface. After acceptance, B prepares the staging-to-main release PR and A reviews it. Include the already accepted EP6 evidence in this first EP7 release; no separate EP6 documentation-only main release is necessary. Verify the accepted main tree and preserve both review links.
2. A merge into main triggers **Deploy demo**. Do not run the bootstrap again. The workflow reuses CI, builds runtime/tools with the full source SHA, authenticates through the reviewed `demo` WIF identity, pushes both images, resolves digests, verifies existing resources, executes migration, creates/verifies a revision, directs traffic and smoke-tests health/UI.
3. Open the main commit's Actions run and its **Deploy demo / deploy** job. Retain the run URL and summary: full released/workflow SHA, runtime/tools digests, waited migration execution, serving revision, public origin and smoke result. A successful settings readback alone is not a successful WIF exchange; require the actual auth and deployment steps to pass.
4. With A, compare the Actions summary against read-only Cloud Run revision/traffic and Artifact Registry image/OCI revision evidence. Use the existing public origin to check login, template -> goal -> saved entry/progress and a rule/access rejection. Attribute human actions separately from automated public smoke. Do not publish passwords, tokens, credential files or secret payloads.
5. Record the actual fields in a copy of [the live record template](ep7-record.template.json). The template remains `NOT_RUN`; source, run and review fields must come from the actual accepted release. Issue21 closes only after EP6's separately reviewed main/tree acceptance. Issue22 remains open for the repeatable visible-change release below.

The workflow checks the current remote main before authentication and again at release time. A queued run whose source is superseded stops rather than deploying stale source. Do not merge another main release during a live release verification. Reruns use run ID/attempt in the new revision name and do not rerun seed. Existing migration jobs retain their secret references; the normal release explicitly runs only `npm run db:migrate`.

## Find the running source

Start at GitHub **Actions -> Deploy demo -> successful main run -> Summary**, then correlate its immutable digest and revision with **Google Cloud -> Cloud Run -> studytrack -> Revision History** (100% traffic), and **Artifact Registry -> studytrack -> studytrack -> the digest/tag**. The runtime and tools images carry `org.opencontainers.image.revision` with the full SHA. Do not infer the running source from the repository's newest main commit or a documentation merge alone.

Read-only Cloud Shell checks after the real run:

```bash
gcloud run services describe studytrack \
  --project=studytrack-cpe334 --region=asia-southeast1 \
  --format='yaml(status.url,status.traffic,status.latestReadyRevisionName,spec.template.spec.containers.image)'

# Use the exact revision printed by the successful Actions summary.
REVISION='replace-with-recorded-revision'
gcloud run revisions describe "$REVISION" \
  --project=studytrack-cpe334 --region=asia-southeast1 \
  --format='yaml(metadata.name,spec.containers.image,status.imageDigest,status.conditions)'
```

## Index and platform digest verification

Artifact Registry can identify the pushed runtime by an OCI index digest while Cloud Run records its `linux/amd64` manifest digest. These are different identifiers for the index and its runnable image, not necessarily different builds. Before any cloud update, the release helper reads the exact pinned image's registry metadata and requires its URI to match. For an OCI index or Docker manifest list it requires exactly one valid `linux/amd64` child; unknown-platform attestations are not runtime candidates. Missing, ambiguous or unreadable metadata stops the release rather than accepting any digest.

The no-traffic update still uses the pinned runtime reference. Before routing, the named revision must be Ready, have one container, use the pinned reference or its verified child in spec, and report exactly the expected platform reference in `status.imageDigest`. The post-routing service spec must also identify the pinned runtime or verified child; identity, environment and 100% exact-revision traffic checks remain. Single-image OCI/Docker manifests require the original digest in both revision fields.

The Actions summary records both **Runtime digest** (`DEPLOYED_IMAGE`, the pinned registry reference, possibly an index) and **Verified runtime platform digest** (`DEPLOYED_PLATFORM_IMAGE`). Keep both in the live evidence record. See [the first failed-run diagnosis](ep7-oci-digest-fix.md); a code fix or offline test does not establish a successful retry. No IAM expansion, deploy rerun or manual traffic override is part of this correction.

## Visible-change release B and EP8

After release A succeeds, agree with A on the exact [EP8 persistence operation plan](persistence-test-plan.md) and capture its baseline **before** the second release. Take a small labelled visible change through its Issue, feature branch, A-reviewed staging PR and separately reviewed main release. The same repeatable pipeline must deploy release B; retain before/after UI, source/digest/revision/run and domain-smoke evidence. Compare the same persisted records after that redeploy for EP8, plus its separately agreed restart operation. This combines evidence collection without removing either episode's acceptance criteria. Do not close Issue22 or23 from code/CI alone.

Coordination snapshot: A's wording [PR40](https://github.com/auto4496/studytrack/pull/40), Issue39, is independently open against staging. It is not reviewed by this EP7 increment. If the team chooses it as release B, keep it out of release A and capture the EP8 baseline first; B reviews A's change. If it is included in release A instead, choose another later visible change for release B. Do not attribute an already included change to a second pipeline run.

## Controlled rollback and failures

For an agreed compatible previously released runtime, open **Actions -> Deploy demo -> Run workflow**, choose **main**, and enter its full40-character SHA in `image_tag`. Empty input performs a normal release of current main. Nonempty input must be an ancestor of current main with an existing runtime image; the workflow skips CI/build/tools/job/migration/seed, resolves the runtime digest and creates/verifies/routes a new revision, then smoke-tests it. Keep the source SHA, digest, revision and run as new evidence. Database migrations are not reversed; assess schema compatibility before choosing an image.

Migration failure stops before service update; revision/Ready/digest failure stops before traffic. A traffic or smoke failure makes the run fail, with no automatic rollback. Inspect the named job/revision and operation logs before rerunning; do not add broad permissions or reset existing secrets to resolve an unexplained error. Successful deploy output is exported only after the expected image/configuration and100% exact revision are verified. Smoke remains a separate required step before the success summary.

This update does not provision APIs/IAM/SQL/secrets, read secret values, change public access, run seed, or replace the reviewed EP5 bootstrap. Local offline tests require no Docker daemon. Hosted CI must actually build both Docker targets before peer acceptance.
