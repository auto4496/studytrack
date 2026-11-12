# EP8: captured P0 baseline and next-operation review

12 November 2026. [Issue23](https://github.com/auto4496/studytrack/issues/23), C-05 / R-04. **IN PROGRESS.** The fresh domain-data baseline is captured; independent runtime/database corroboration and B's review are pending. No application replacement or later release B has run. This does not complete EP8 or close Issue23.

Execution follows the [accepted persistence plan](persistence-test-plan.md), prepared in PR33. Member A requested the test and supplied the already authenticated Edge session. Codex operated the native UI for A and read the three normal authenticated GET response bodies. This is assisted execution, not independent human UAT. B remains the cloud-operation coordinator and independent reviewer; the shared issue assignment is unchanged.

## 1. Actual baseline

| Field | Observed value |
| --- | --- |
| Public origin | https://studytrack-981693883236.asia-southeast1.run.app |
| Visible account / role | นักอ่านคนที่หนึ่ง / นักศึกษา |
| Activity | อ่านทบทวน CPE 334; template `11111111-1111-4111-8111-111111111111` |
| New goal | `1da44fc2-a956-421d-88a9-8c876adc38c1` |
| Goal start / stored entry date | `2026-11-12` (Bangkok) |
| Goal snapshot | MINUTES; bounds1-1440; ACTIVE; endDate=null; target30; effective2026-11-12; no pending target |
| Goal created | `2026-11-12T14:42:16.582Z` |
| New entry | `f1146358-2b3a-4aa6-9033-b2d0d95fc542` |
| Entry created / updated | Both `2026-11-12T14:42:49.190Z` |
| Entry list | Exactly1 entry, page1/pageSize20/total1 |
| Recorded progress | 20 actual / 30 target =66.67%; achieved=false; progress.entryId equals original entryId |

The plan **prefers** a newly named EP8 activity with bounds1-60. This run instead created a fresh goal and entry on the existing CPE334 activity, previously unused by this account, with its actual bounds1-1440. It retains the planned30/20 calculation. B must review this explicit variation. Neither old EP5 goal was modified; no manager login, template edit, target change, seed or record recreation was used.

The new entry was saved through the UI, then a full page refresh still showed20/30 and66.67%. Normal authenticated GET navigation returned consistent goal, entry-list and date-specific progress bodies at14:43:40.704Z,14:43:55.802Z and14:44:07.625Z respectively. The [working record](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/record.json) retains the DTOs, actual actors, timestamps, limitations and unexecuted cases. [SHA256 manifest](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/sha256.json) covers all retained evidence and the record. The master NOT_RUN template is unchanged.

### Native capture captions

Original, unaltered native Edge window captures; URL and account are visible. Capture times are in the adjacent JSON files. No headers, credentials, cookies, CSRF/session values or HAR were collected.

1. **C-05/R-04, P0, 12 November2026:** [entry saved](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/p0-entry-saved.jpg), showing the save confirmation and20/30=66.67% on the public cloud URL.
2. **C-05/R-04, P0 after full refresh:** [goal identity](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/p0-goal-after-refresh.jpg), showing the same goal URL, account, title, target, bounds and start date.
3. **C-05/R-04, P0 after full refresh:** [progress](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/p0-progress-after-refresh.jpg), showing the same goal URL/account and stored12 November20/30 result.
4. **C-05/R-04, P0 after the three GET reads:** [final visible UI](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/p0-final-ui.jpg), showing the same result. The browser remains on this test goal.

## 2. Release provenance and unresolved entry gate

Actual successful [release-A run43233683592](https://github.com/auto4496/studytrack/actions/runs/43233683592), following reviewed PR46:

| Field | Successful pipeline observation |
| --- | --- |
| Main / workflow source | `3570cd4a7bca17567d30817565d5bb3aa107a672` |
| Runtime index digest | `sha256:3e4e18fd392de678076ebec06464a61eca4912b49f783a418c99abf3b3fb26a3` |
| Verified linux/amd64 digest | `sha256:6127e4e53c2b9b8a747fd8af42216cb7879b4d5175c5f5178d4bc33f0bb18f7d` |
| Ready serving revision | `studytrack-g3570cd4a7bca-r43233683592-1` |
| Traffic |100% to that revision, verified by the real release helper after routing |

Retained [run metadata](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/release-a-pipeline-run.json), [selected helper output](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/release-a-deployed-identifiers.json) and [separate public HTTP observations](../../../artifacts/evidence/lab5-cloud/ep8/2026-11-12-p0-3570cd4/release-a-public-http-checks.json) identify their source. The source and run list were checked during P0: main still3570cd4, with no later Deploy demo run. These are not an independent Console inspection at P0.

**Before any cloud operation**, B must corroborate the current serving revision, image lineage, traffic, Cloud SQL connection and DATABASE_URL secret **reference/version only**, then both members review this baseline. The expected reviewed contract is project `studytrack-cpe334`, region `asia-southeast1`, service `studytrack`, SQL connection `studytrack-cpe334:asia-southeast1:studytrack-pg`, database `studytrack`, secret binding `studytrack-database-url`. Actual independent DB/reference fields remain null; do not copy the secret payload or a connection string. Data capture happened before this independent corroboration, so P01 remains PARTIAL and the entry gate is explicitly unresolved.

## 3. Concrete P1 proposal for B review; NOT EXECUTED

Use the already reviewed workflow's existing-image mode to create a fresh runtime of the **same accepted image**. This is the plan's Cloud Run replacement/restart-equivalent adaptation. Both must agree the exact parameters and a human team member must perform the authenticated cloud operation, as specified in the accepted plan.

| Parameter / expected behavior | Proposed value |
| --- | --- |
| Workflow | `.github/workflows/deploy.yml` / Deploy demo |
| Workflow branch | `main`; currently3570cd4a7bca17567d30817565d5bb3aa107a672 |
| `image_tag` input | `3570cd4a7bca17567d30817565d5bb3aa107a672` |
| Selected image | Existing release-A index and verified platform digest above; confirm resolution still matches |
| Existing-image mode | Workflow records ROLLBACK=true even though the selected source is the current accepted release; no older source is requested |
| Work skipped | CI/build/push/tools/migration/seed; previously reviewed/tested accepted image is reused |
| Runtime action | New run-specific revision, initially no traffic, Ready/image verification, then100% traffic; existing DB/secret references preserved |
| Required new-process proof | Actual startup event and new `labels.instanceId`, compared with an independently observed release-A instance; a renamed revision or health200 alone is insufficient |

This table is a review proposal, not approval or a dispatch record. Recheck current main/workflow, existing image digests, serving configuration and DB binding immediately before a human operator runs it. If they differ, stop and review the new exact inputs. Retain operation actor/time, run URL/attempt, old/new startup+instance evidence, revision, traffic, digest and DB reference. Never provision/reset/reseed SQL to test replacement. If startup/instance evidence cannot establish a fresh runtime, leave P02 NOT VERIFIED.

After P1, A must reopen the same stored date and compare every required goal/entry/progress field with P0; do not edit or recreate any data. Run and retain the accepted public smoke check. B then leads the separate reviewed visible-change release B for EP7/P2, followed by the same exact data comparison, runtime/DB readback and student2 privacy check. A full refresh is only the P0 read check, not proof of restart or redeploy persistence. Issues22/23 remain open until their respective real evidence is independently accepted.
