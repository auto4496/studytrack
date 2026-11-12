# EP7 OCI index / platform digest correction

12 November 2026, B / Datakung assisted by Codex. Related to [Issue22](https://github.com/auto4496/studytrack/issues/22); this correction does not close EP7 or EP8. The feature branch includes accepted main `d92f945016087452e146e53c91044860279a5610` and targets protected sprint staging for peer review before a separate reviewed main release.

## Evidence and cause

Accepted main's [Deploy demo43197450278, attempt1](https://github.com/auto4496/studytrack/actions/runs/43197450278) failed at the revision verification guard, before its traffic-switch command. The following observations were supplied by the user from read-only GCP Cloud Shell commands in this chat; they were not collected through the assistant's local cloud identity.

- Revision: `studytrack-gd92f94501608-r43197450278-1`; container count1. Its spec image and `status.imageDigest` both identify `asia-southeast1-docker.pkg.dev/studytrack-cpe334/studytrack/studytrack@sha256:9f50229e19c2fbd3d440465b5166f5c92fa957b5af8d129ef459f606b30b1b4b`.
- The runtime tag resolves to `asia-southeast1-docker.pkg.dev/studytrack-cpe334/studytrack/studytrack@sha256:5c26a655654b2b51fba8c9b1d8efe2d8d4c0199f7b5541f3c5f8e1600ad57d35`. Registry REST metadata identifies this as `application/vnd.oci.image.index.v1+json` and lists the revision's `9f50229e...` digest as its `linux/amd64` image. A second `unknown/unknown` entry has digest `sha256:cc21d5866555cc83e102d0dd64e53a06aba3d7c0cb340f46dd37348bae7faae1`; that is not the runnable platform candidate. No assertion about its contents was independently verified.
- The later revision read reports Ready=True with reason Retired, Active=False. This is a post-failure observation, not proof of Ready status at the earlier guard evaluation.
- Service traffic at the readback remains100% on `studytrack-00001-rtr`; `latestReadyRevisionName` also remains that older revision. This is not evidence that the failed release served traffic.

The old guard compared revision spec directly to the index reference. Those values are demonstrably unequal even though the observed platform image belongs to that exact index. This confirms a failing image comparison; it does not establish whether any other condition was false at execution time. Do not relabel the failed run as successful or infer fresh application/DB smoke from these reads.

## Change and verification boundary

`deploy/release.py` now reads metadata by immutable digest using the existing short-lived workflow token (or obtains the current CLI access token without printing it). This is a fixed-host registry GET, using `artifactregistry.dockerImages.get`, not a new deployment permission or a secret-payload read. It validates the returned URI and supported media type before cloud updates. Index/list metadata must identify exactly one valid `linux/amd64` digest in the same image repository. The revision must retain the pinned index or its verified platform image in spec and report the exact platform image in status before traffic can move. Normal and rollback paths share this verification. A registry read failure stops before migration or service updates.

The workflow still deploys the pinned registry reference, never a mutable tag. It exports both the pinned reference and verified platform reference after the existing post-routing configuration/traffic checks. The success summary still requires public smoke. Main/source, migration order, no-traffic creation, revision name, single-container, Ready, runtime/migrator identity, secret bindings and exact100% traffic checks remain; no manual routing workaround or bootstrap replay is added.

Offline regression coverage includes OCI index plus unknown-platform entry, Docker manifest list, direct OCI/Docker images, both spec representations, normal/rollback, exact pinned GET/auth, missing/ambiguous/malformed metadata, HTTP/timeout/JSON/credential failures, unrelated/cross-repository/non-runtime digests, missing or index-only resolved status, Ready/name/container-count failures and post-routing image drift. All command and HTTP responses are fixtures; these tests make no live GCP calls. Existing bootstrap/smoke tests remain in the same suite.

The first local attempt hit Windows temporary-folder permissions; with a workspace-local temp directory, restricted Git Bash initialization was still blocked. These environment failures were not passing checks. The suite was rerun with Git Bash permitted and the task-local TEMP/TMP directory. Hosted CI must separately test API/browser/build and both Docker targets on the submitted PR head. No cloud retry, migration, traffic change, smoke or EP8 baseline was performed for this correction.

Final local result: `python -B -m unittest discover -s deploy/tests -p 'test_*.py' -v` ran **41 tests in44.412s, OK** (25 release,13 bootstrap,3 smoke). Both `bash -n deploy/release.sh` and `bash -n deploy/deploy.sh` exited0; `git diff --check` passed and the updated live-record template parsed as JSON. Test-output health `PASS` lines are simulated smoke fixtures, not live service checks. Application/API/browser tests and Docker builds were not run locally for this release-helper-only correction; the unchanged hosted CI remains required.

## Next reviewed release

After A reviews/accepts the staging correction, prepare and separately review the staging-to-main release. A new main run must produce actual migration, revision/traffic, both runtime digests and smoke evidence. Do not rerun the old workflow expecting it to contain this new code. Keep Issue22/23 open; only after release A actually succeeds should A capture the agreed EP8 baseline before later persistence operations or visible-change release B.

Primary references: [Artifact Registry DockerImage metadata and ImageManifest fields](https://docs.cloud.google.com/artifact-registry/docs/reference/rest/v1/projects.locations.repositories.dockerImages), [pinned image GET and permission](https://docs.cloud.google.com/artifact-registry/docs/reference/rest/v1/projects.locations.repositories.dockerImages/get), [Cloud Run supported image/platform contract](https://docs.cloud.google.com/run/docs/container-contract).
