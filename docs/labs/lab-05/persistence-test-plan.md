# EP8: cloud persistence test plan

Version0.1, 9 November2026. [Issue23](https://github.com/auto4496/studytrack/issues/23), C-05 / R-04. **PREPARATION ONLY: NOT RUN.** A (Phanuwit / auto4496) prepares the data assertions, verification procedure and evidence record; B (Pitchai / Datakung) coordinates the cloud/pipeline operations and reviews this plan. Both participate in the supervised execution and review the results. The existing issue owner and Lab5 allocation are unchanged.

This document is independent of F-05. It adds no application code, migration, workflow, credentials or cloud resource. F-05's contract remains separately reviewable in PR32. Accepting this plan does not accept executed EP8 evidence or close Issue23.

## 1. Entry gates and coordination with EP7

1. B has completed the reviewed EP6 gate/identity work in [Issue21](https://github.com/auto4496/studytrack/issues/21) and the deploy workflow/script contract in [Issue22](https://github.com/auto4496/studytrack/issues/22). A reviews the exact workflow/check names and evidence. Neither requirement is marked complete by this document.
2. Both agree the exact accepted main commit, immutable runtime image digest, Cloud Run service/revision, persistent database and workflow inputs before execution. Read current Console/command results; do not assume the initial EP5 revision is still serving.
3. B provides one successful pipeline release A. **A captures the baseline after release A and before the next accepted release B is deployed.** B's next reviewed visible-change release can supply both EP7 version evidence and the later EP8 redeploy checkpoint. Coordinate this timing rather than collecting a baseline after the operation it is supposed to precede.
4. Both review the exact same-image application replacement/restart operation and the later pipeline release. Actual authenticated cloud changes are performed by the human team members after that review. This document is not approval to run a mutating command, grant IAM, change billing, reset/seed the DB, alter secrets or redeploy now.
5. Use the existing project `studytrack-cpe334`, region `asia-southeast1`, service `studytrack` and public origin <https://studytrack-981693883236.asia-southeast1.run.app>. Verify these against the current accepted deployment before using them. Record the same Cloud SQL instance/database/connection reference at every stage without secret payloads.

Reference scope: Lab5 handout `01_SE_Lab_5_updated.pdf`, Sections7-8/11-12 (C-05 requires data after application restart and redeploy); Student GuideV1.1 Episode8, pages92-95 (rollback/roll-forward exercise). The handout controls required evidence. Rollback/roll-forward is additional practice; it does not replace the required restart and redeploy checkpoints.

## 2. Concrete work split

| Work | A: user of this chat | B: teammate |
| --- | --- | --- |
| Preparation | Write the record comparison/assertions and URL-visible capture checklist; prepare/recheck the synthetic data | Review feasibility against the EP7 workflow and agree the exact operation parameters |
| Before operations | Sign in directly, create/read the chosen record through the UI, collect safe authenticated API DTOs and baseline figures | Capture current serving commit/digest/revision/traffic and persistent DB reference; review the baseline with A |
| Application restart/replacement | Participate in the reviewed human-operated cloud step; independently retrieve and compare the record afterwards | Coordinate the operation against the accepted same-image deployment configuration and capture runtime evidence |
| Next main release | Verify the accepted release/run/version mapping and repeat the UI/API data comparisons | Lead the reviewed staging-to-main release and pipeline operation; supply its actual run/revision/digest results |
| Acceptance | Assemble before/after figures, compare values, report defects and inspect B's operation evidence | Independently review A's comparisons and evidence; resolve discrepancies together |

The split describes work inside the existing shared EP8 issue. It does not assign all of EP8 to either member. Participation is recorded by actual actor, step and outcome, not assumed from the issue assignee.

## 3. Test data and baseline

Prefer a distinct synthetic activity/goal named `EP8 persistence Phanuwit <run-date>` with bounds1-60 minutes, daily target30 and a valid start/entry date. The user enters demo credentials directly into the application. Record20 minutes through the UI, then read the committed result:20/30=66.67%, achieved=false. Do not create duplicate accounts or modify another member's established evidence data.

An existing record may be reused only after a fresh authenticated read confirms its current identity/values and both members agree not to edit it during this run. The 9 November EP5 goal `ef016b96-0f77-4ca6-ae68-0a6d58c9877a`, previously observed as20/30, is only a **historical candidate** from [A's EP5 evidence](member-a-live-acceptance.md); those old captures are not a fresh EP8 baseline.

At each checkpoint use the **same stored entryDate**, even if Bangkok today changes. Record date-only values as YYYY-MM-DD and observation/operation timestamps as ISO8601 UTC with the Bangkok date separately. A date-picker default moving to a new day is not data loss.

| Object/read | Required comparison |
| --- | --- |
| Goal | Same goalId, templateId, snapshot title/unit/min/max, startDate, status and endDate as baseline |
| Entry | Same entryId, goalId, entryDate, minutes, createdAt and updatedAt; no duplicate/recreated entry |
| Progress for baseline date | Same targetMinutes, actualMinutes, progressPercent and achieved; entryId matches the original entry |
| Historical denominator | Resolve target for that stored entryDate, not whatever target appears on a later day |
| Identity | Same test account/role; student2 cannot read the student1 private record after the operations |
| Serving environment | Record main source SHA, runtime digest, ready revision, traffic and persistent DB reference separately at each checkpoint; no assumption that they remain the same during redeploy |

Use normal authenticated browser navigation for safe GET response bodies: `/api/goals/<goalId>`, `/api/goals/<goalId>/entries?page=1&pageSize=20`, and `/api/goals/<goalId>/progress?date=<baseline-date>`. Retain only the selected DTOs/values; do not export request headers, cookies, session/CSRF values, passwords or a HAR. If the entry list is paginated, identify the exact recorded entry rather than assuming the first row is it. A later read is not a replacement for a missing pre-operation baseline.

## 4. Execution sequence to review before running

### P0: baseline on pipeline release A

- Confirm entry gates, exact project/origin/account and accepted release A. Record its actual full source SHA, immutable digest, serving revision and traffic.
- Create/recheck the chosen goal/entry. Read UI and the authenticated GETs above, record IDs/values/timestamps, and take a native browser-window screenshot showing the actual public URL, account and20/30 result.
- Confirm that the recorded API entry and progress refer to the same IDs/date. Store the observed baseline in a private working copy of the [record template](persistence-record.template.json). Both members check it before any operation.

### P1: application-process replacement with the same image

Cloud Run revisions are immutable, and deployment/configuration changes produce revisions; the original bootstrap is not a generic restart command. **Proposed StudyTrack adaptation for review:** replace the serving application with a new revision of the exact accepted runtime image/digest, preserving its DB/secret references and other settings. Use the reviewed EP7 workflow if it supports forcing a fresh revision; otherwise review the specific Console/CLI operation and parameters with B before running it. No mutating command is supplied here because that workflow interface is still an EP7 dependency.

- Record operation actor/start/end, the actual command or workflow inputs, same source/image mapping, new revision readiness and traffic. Do not rerun the provisioning bootstrap or migrations/seed merely to test a process replacement.
- Capture startup/runtime evidence for the new serving instance. Cloud Run logs expose `labels.instanceId`; a changed instance ID plus startup evidence supports actual runtime replacement. A renamed revision alone, a page reload, health200 or waiting for presumed scale-to-zero is insufficient proof of the application-process event. If that event cannot be established, mark the restart checkpoint NOT VERIFIED and retain the limitation for review.
- Run the existing read-only public smoke check (`python3 deploy/smoke_test.py <public-origin>`), then A reopens the same record/date and compares the complete UI/API data against P0. Capture the new native URL-visible image and safe DTOs. No entry/goal update or recreation is permitted as a repair during comparison.

This is specifically a controlled Cloud Run application replacement/restart-equivalent exercise, not a VM reboot, a Cloud SQL restart or evidence about the old instance's termination time. Review this adaptation explicitly before execution; the new runtime must be established by actual evidence.

### P2: next accepted main release through the pipeline

- B takes the separately reviewed EP7 visible change through staging -> main -> successful deployment workflow. Retain issue/feature/release review links, full main SHA, run URL, runtime/tools digests, migration result, serving revision, traffic and public smoke.
- Confirm this is the intended new accepted release and the same persistent DB; check the visible release change and runtime mapping. Do not equate a documentation-only main SHA with a newly deployed application image without a real pipeline run.
- A reopens the **same goalId/entryId/date** and repeats the P0 comparison. The original record must already exist; do not reseed or re-create it. Capture URL-visible before/after evidence and safe DTO values. B independently reviews the result.

### Optional rollback/roll-forward

After the required checkpoints and compatibility review, follow the accepted workflow's immutable-image selection to deploy the earlier accepted image, verify the same record, then restore the current accepted image and verify again. Keep additive migration compatibility; do not restore/reset the database. Use actual workflow names/inputs supplied by B, not the starter's `Deploy demo` / `image_tag` names by assumption. Record this as optional additional evidence, not an already executed step.

## 5. Read-only runtime inspection

These commands are review aids for the authenticated human operator, not commands executed by this document. They return selected non-secret fields only. Replace the revision placeholder with the actual inspected ready revision.

```bash
gcloud run services describe studytrack --project=studytrack-cpe334 --region=asia-southeast1 \
  --format='json(status.url,status.latestReadyRevisionName,status.traffic)'
gcloud run revisions describe <READY_REVISION> --project=studytrack-cpe334 --region=asia-southeast1 \
  --format='json(metadata.name,metadata.creationTimestamp,status.imageDigest,status.conditions)'
```

Use Cloud Run Logs Explorer for the specific service/revision and operation time window to inspect startup and instance IDs. Retain only safe relevant fields; secret-bearing environment dumps and unrestricted logs are not evidence artifacts. Official primary references: [Cloud Run deployments](https://docs.cloud.google.com/run/docs/deploying), [immutable revisions](https://docs.cloud.google.com/run/docs/managing/revisions), and [logs/instance identifiers](https://docs.cloud.google.com/run/docs/logging). The same-image test above is the team's proposed adaptation of those mechanisms and requires peer agreement.

## 6. Acceptance matrix and honest outcomes

All cases below are **NOT RUN**. The JSON template likewise contains no fabricated baseline, IDs, revision, operation or PASS result.

| Test ID | Expected evidence/result |
| --- | --- |
| EP8-P01 | P0 recorded before operations, UI/API refer to the same durable goal/entry/date and authoritative20/30=66.67% |
| EP8-P02 | Actual same-image fresh-runtime event established with reviewed operation + revision/digest/traffic + startup/instance evidence |
| EP8-P03 | P1 exact stored IDs/values/timestamps match P0; eligible date/target calculation unchanged |
| EP8-P04 | P2 has a genuinely accepted next main release, passing pipeline and independently checked serving-version mapping |
| EP8-P05 | P2 exact stored record and date-effective progress match P0 after the real redeploy |
| EP8-P06 | Health/UI smoke passes at every post-operation checkpoint; this supplements, not substitutes for, domain-data checks |
| EP8-P07 | Current unexpired session is checked separately; student2 still denied the private goal. Normal8-hour expiry/re-login is recorded honestly and is not confused with missing domain data |
| EP8-P08 | Crossing Bangkok midnight selects baseline entryDate, rather than comparing a new empty day |
| EP8-P09 | A/B independently review safe URL-visible captures, exact IDs, times, actual actors and operation/version provenance; no passwords, tokens or connection strings |
| EP8-P10 | Optional rollback/roll-forward, if executed, retains the same data and restores the accepted current version through the reviewed workflow |

If a stored ID/value changes, record FAIL with actual values, run/revision and a defect; do not recreate the record or rewrite the expected baseline to produce PASS. If the pipeline fails, the target revision is uncertain, traffic is mixed, startup evidence is missing or the operation was not performed, report NOT VERIFIED/BLOCKED for that checkpoint. Stop dependent acceptance and diagnose before a retry. Separate application availability, authentication expiry and data persistence results.

## 7. Evidence packaging and completion

Use a run-specific evidence folder under `artifacts/evidence/lab5-cloud/ep8/<run-id>/` only after execution. Preserve P0/P1/P2 records, safe operation/version outputs and original native browser screenshots with actual URLs visible. Hash the retained files after capture. Add numbered captions naming C-05/R-04, checkpoint, date, public URL and release/run/revision source; compare them in a concise table for the final Lab5 report. The template itself remains NOT_RUN; execution uses a separate filled record.

Before closing Issue23, both members must have reviewed actual restart/redeploy evidence and comparisons, resolved blocking findings, accepted the evidence through the team's reviewed staging/main flow, and updated the runbook/report index. A prepared specification or the previous EP5 reload/local Docker evidence does not complete EP8. This plan does not pause/delete resources, authorize post-grading teardown, or replace F-05 implementation.
