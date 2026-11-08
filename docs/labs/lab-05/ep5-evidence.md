# EP5 deployment evidence and teammate handoff

8 November 2026 (Asia/Bangkok). [Issue #20](https://github.com/auto4496/studytrack/issues/20). This record preserves B's deployment observations. **Update, 9 November:** A independently verified the public workflow, persisted retrieval and cross-owner restriction, then approved PR #28; it merged into staging as `0bceb1a`. A's [own captures and attributed results](member-a-live-acceptance.md) are now available without waiting for B's private screenshot bundle. Peer review of that follow-up evidence and the documentation release remain pending. This record supplements the [deployment runbook](deployment.md) and [pre-code contract](cloud-contract.md).

## Source and running version

| Item | Observed value |
| --- | --- |
| Accepted main deployed | `807ed0806a84f39e88e0ba8f8fa5e658f41fe97f` |
| Bootstrap peer acceptance | [PR #26](https://github.com/auto4496/studytrack/pull/26), A-approved source `3664535ea03de8477dd4132e280d110f75ff76ad` |
| Reviewed main release | [PR #27](https://github.com/auto4496/studytrack/pull/27) |
| Release CI | [Run42484888811](https://github.com/auto4496/studytrack/actions/runs/42484888811): 16 offline, 21 config, 117 API/unit, 24 browser checks, app build and runtime Docker build |
| Project / region | `studytrack-cpe334` / `asia-southeast1` |
| Public HTTPS origin | <https://studytrack-981693883236.asia-southeast1.run.app> |
| Cloud Build | `59d938a8-fb23-42e3-9fbf-2a1c1b68cfae`, SUCCESS, 2m16s |
| Migration/seed execution | `studytrack-migrate-6qs4x`, successfully completed |
| Serving revision | `studytrack-00001-rtr`, ready, 100% traffic |

Runtime image:

```text
asia-southeast1-docker.pkg.dev/studytrack-cpe334/studytrack/studytrack@sha256:991fb321187bc4417e236ac5075144e5eb31171766c6483825ed367b1b6c03cd
```

Tools image:

```text
asia-southeast1-docker.pkg.dev/studytrack-cpe334/studytrack/studytrack-tools@sha256:cd44ea1989d61179ae4848543bf970ba9958e911ed105da2ba01a86ba0571cce
```

These mappings come from the user's successful bootstrap log. Source code and release tree were checked before the run; the log reports the resolved digests and deployed revision. The runtime OCI revision label has not been independently inspected in the cloud image during this evidence round. This documentation branch is not the deployed application source.

## Actual execution and attribution

For this 8 November B-side record, the user executed Google Cloud commands in Cloud Shell and manually used the authenticated browser. Codex assisted B with instructions, compared the supplied results/screenshots to the checklist and independently fetched the public root/health endpoints. A had reviewed the scripts before deployment; the independent A browser round occurred on 9 November and is recorded separately in [A's evidence](member-a-live-acceptance.md). Existing CI counts above are pre-cloud results, not new authenticated cloud tests or human UAT.

The accepted-main preview ended with `Dry-run plan complete`. The first real run stopped at Cloud Build submission with `PERMISSION_DENIED`, before its SQL/database/secret/job/service steps. Regional build listing was empty and the queried denial audit records returned `[]`. Direct permission tests then confirmed all five tested caller permissions: `cloudbuild.builds.create`, `cloudbuild.builds.get`, `serviceusage.services.use`, `iam.serviceAccounts.actAs` and `iam.serviceAccounts.get`.

One controlled retry of the same accepted script completed without additional corrective role grants. IAM propagation is a possible explanation, not a proven root cause. The user's Cloud Shell retained `tmp/first-deploy.log` and `tmp/first-deploy-retry-1.log`. Inspect a future failure before retrying; no global debug output was requested for the secret-bearing bootstrap.

| Check | Actual result and source |
| --- | --- |
| Build | Cloud Shell log reports SUCCESS for both image targets |
| SQL | Actual describe: POSTGRES_17, ENTERPRISE, db-f1-micro, region asia-southeast1, dataDiskSizeGb10, storageAutoResize=false |
| SQL Console | Green studytrack-pg, PostgreSQL17.11, Enterprise, Single zone; database studytrack, UTF8 / en_US.UTF8 |
| Migration/seed | Waited job execution successfully completed before Run deployment |
| Run | Console shows port 8080, CPU 1, memory 512 MiB, gen2, autoscaling minimum 0 / maximum 3 and ready revision receiving 100% traffic |
| Configuration | Bootstrap log supplies exact APP_ORIGIN matching the public origin, NODE_ENV=production, TZ=Asia/Bangkok and DATABASE_URL from secret version1; Console's full origin/secret name is clipped |
| Registry/secrets | Console shows studytrack and studytrack-tools in the studytrack repository, and all three expected secret names; version1 creation recorded in the log |
| Project IAM | Console confirms runner/migrator Cloud SQL Client; builder Logs Writer and Storage Object Viewer |
| Resource IAM | Bootstrap log records builder Artifact Registry Writer on repository studytrack, runner accessor on DB secret, migrator accessor on DB/manager/participant secrets. Project IAM screenshot alone does not establish these bindings |
| Public smoke | Script PASS /api/health and PASS /; B's separate HTTP fetches both returned200 and health returned data.status=ok / service=StudyTrack API |
| Manager | User signed in and created template `ทดสอบ Cloud EP5`, allowed range1-60 minutes |
| Participant | User signed in as student1 and created a 30-minute daily goal starting 8 November 2026 |
| Invalid entry | Entering 0 shows integer 1-60 validation and leaves progress 0/30. This is observed UI validation, not independent API rejection evidence |
| Saved/retrieved | Saved 15 minutes => 15/30, 50%; user explicitly confirmed refresh and supplied a screenshot showing the same persisted result |
| Cross-owner | Student2 opened the same goal URL and saw `ไม่พบรายการที่ต้องการ`, with no goal details/minutes disclosed. Screenshot does not establish the HTTP status |

The actual enabled-service output supplied by the user includes every API requested by the bootstrap:

| API | Present in enabled-service output |
| --- | --- |
| `run.googleapis.com` | Yes |
| `sqladmin.googleapis.com` | Yes |
| `artifactregistry.googleapis.com` | Yes |
| `cloudbuild.googleapis.com` | Yes |
| `secretmanager.googleapis.com` | Yes |
| `iam.googleapis.com` | Yes |
| `cloudresourcemanager.googleapis.com` | Yes |

## Screenshot inventory

The user supplied these screenshots in the B chat. Fifteen originals and a provenance index are retained locally in the `studytrack-ep5-evidence` folder for private teammate review and the later report. They have not been uploaded to this repository. This table is an index, not public screenshot access. A independently reproduced the domain workflow and retained [separate browser captures](member-a-live-acceptance.md); A has not independently inspected these B Console originals. Some Console originals include account email addresses. No password/token/connection-string payload is included in this document.

| Retained filename | Evidence |
| --- | --- |
| manager-login.png | Manager catalog and seeded templates |
| invalid-zero-minutes.png | 0-minute UI validation |
| saved-progress.png | Save success, 15/30=50% |
| progress-after-refresh.png | User-confirmed reload with persisted result |
| cross-owner-rejection.png | Student2 denied student1's goal |
| run-revision-traffic.png | Ready revision,100% traffic, port/CPU/gen2/revision maximum |
| run-container-env.png | Port and environment names/settings; full origin/secret name clipped |
| run-resources.png | 512 MiB / CPU 1 |
| run-scaling.png | Autoscaling0-3, request-based billing, timeout300s, concurrency80 |
| registry-images.png | Runtime/tools image names |
| secret-names.png | Three expected secret names |
| project-iam.png | Project roles for three service accounts |
| sql-instance-list.png | Green SQL instance and engine/edition |
| sql-overview.png | PostgreSQL17.11 / Enterprise / Singapore / Single zone |
| sql-databases.png | studytrack database / UTF8 |

## A acceptance handoff

The following checklist was prepared on 8 November. On 9 November, A completed the domain verification using 20/30 minutes (66.67%) and the cross-owner restriction, reviewed and accepted PR #28, and prepared the separate A evidence above. Invalid-zero validation was not repeated by A; cross-owner denial supplies C-04's required rule rejection or access restriction. Private B originals are not a prerequisite for the independently reproduced workflow. B's review of A's new evidence and the reviewed documentation release remain outstanding.

1. Review this documentation diff and match the source SHA, images, revision, resource names and outcomes to #20 and the reviewed PR #26/#27. Keep documentation review and deployed-source acceptance distinct.
2. Receive demo credentials privately from B and use the existing live origin. Review B originals where available or independently reproduce the domain checks with A's own captures. If access is missing, report the specific limitation; this checklist does not require new IAM grants or a bootstrap rerun.
3. Independently exercise manager template -> student goal starting today -> saved entry -> reload -> one rule rejection or access restriction. Use a distinct A test-template name so established B evidence is retained. Record actual account roles, date, values and results without password/session values. A's actual run used20/30=66.67% and the cross-owner restriction; only B's earlier run included invalid0. Attribute the serving-version evidence separately from browser behavior.
4. Record who performed each check and any finding in the evidence PR / #20. Script approval before deployment is not post-deployment acceptance. Compare existing SQL/Run/IAM settings with the runbook; do not change cloud resources just to review these documents.
5. A reviews the docs PR into staging; follow the team's reviewed release flow for documentation to main. Close #20 and set its board item Done only after A's live acceptance, evidence review and recorded handoff are complete.

EP5 B-side checklist5.0-5.7 is supported by the B-side results above. A's subsequent workflow check and approval are recorded separately; the evidence handoff and documentation release still precede closing #20. The final evidence/PDF is still tracked in #24. Refresh persistence does not prove container restart/redeploy; that cloud exercise remains #23. GitHub required gate/WIF and the main deployment pipeline remain #21/#22.

The SQL instance-list screenshot reports health recommendations without their details. They have not been diagnosed or resolved in this record. No cloud restart, SQL upgrade, password rotation, resource deletion, later-episode completion or instructor acceptance is claimed. Keep the service available for grading as required by the handout.
