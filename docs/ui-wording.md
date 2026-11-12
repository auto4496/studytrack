# UI wording specification and verification

12 November 2026. [Issue #39](https://github.com/auto4496/studytrack/issues/39). Owner A / auto4496; reviewer B / Datakung. The user approved both surveyed wording lists before implementation. Base: accepted staging `86b0b3e222b364a7ad4e2ea2fae20ed7148073b2`. This is a UI copy update; independent review and release remain pending.

## Approved wording

| Existing text | Agreed display text |
| --- | --- |
| แม่แบบกิจกรรม / แม่แบบ | Activity Templates for collection navigation/headings; Template in Thai sentences, create actions and empty states |
| สร้างแม่แบบ | สร้าง Template |
| ผู้ดูแลแม่แบบ | Program Manager |
| กำลังทำ / สิ้นสุดแล้ว | Active / Archived, for goal status labels |
| กิจกรรมที่อยากทำ | กิจกรรมการอ่าน |
| ช่วงเวลาที่บันทึกได้ | เวลาอ่านขั้นต่ำ–สูงสุด |
| กำลังอ่านความคืบหน้า… | กำลังโหลดผลการอ่าน… |
| บรรลุเป้าหมายแล้ว | อ่านครบเป้าหมายแล้ว |
| หยุดเป้าหมาย | หยุดติดตามเป้าหมาย; related confirmation/help/success text uses the same verb |
| ปิดใช้กิจกรรม | ปิดรับเป้าหมายใหม่; related confirmation/cancel/success text follows the same meaning |
| เวลาต่ำสุด / เวลาสูงสุด | เวลาอ่านขั้นต่ำ / เวลาอ่านสูงสุด |
| เป้าหมายต่อวัน / เป้าหมายรายวัน | เป้าหมายรายวัน throughout the UI |
| หน่วยกิจกรรม | หน่วยเวลา |
| เริ่มต้นได้ดีแล้ว | ยังไม่ครบเป้าหมาย, for a saved below-target daily result |
| ยังไม่ได้บันทึกวันที่เลือก | ยังไม่มีบันทึกสำหรับวันที่เลือก |
| อ่านสถานะล่าสุดแล้ว กรุณาตรวจข้อมูลก่อนส่งใหม่ | โหลดข้อมูลล่าสุดแล้ว กรุณาตรวจสอบก่อนลองอีกครั้ง |
| ปิดใช้แล้ว | Inactive, for a deactivated template |
| รวมแม่แบบที่ปิดใช้ | แสดงรายการที่ปิดใช้ด้วย; still includes both active and inactive templates |
| พื้นที่เล็ก ๆ สำหรับเป้าหมายที่สำคัญ | ติดตามการอ่านในแต่ละวัน |

Contextual variants of Template navigation, empty states and helper text use the same glossary. Participant activity labels and ordinary Thai actions remain Thai. The account-provisioning note's generic ผู้ดูแล is not renamed to Program Manager: that app role does not create accounts. User-entered titles/descriptions are not translated.

## Meaning and implementation boundaries

- Active/Archived name the existing goal status; Inactive names an existing template flag. These are display labels, not new stored values or a change to role/status codes.
- Stopping retains the inclusive end date/history and cannot reopen the goal. Deactivation closes new-goal creation while existing goals remain usable.
- A daily reading result can meet its target without archiving the goal. Result messages refer to the selected date and do not incorrectly say today for historical reads.
- APIs, request fields, calculations, validation bounds, authorization, persistence/schema and deployment settings retain their accepted behavior.
- Update existing browser selectors/text assertions, preserving scenario counts and business assertions. Redirect screenshots into this increment's evidence folder to preserve accepted Sprint1/F05 evidence.
- Build and run the existing desktop/mobile cases; inspect current screenshots and run required hosted CI. This copy-only change does not establish a new domain feature, independent human UAT or the assessed Lab7 changed-business-behavior exercise.

## Execution

Specification checkpoint: `c4c5f62`. Product/browser source: `bc2e93b25c1784a62e262416641d95d61bd0224d`. The build ran on the identical product files immediately before that source commit. Later changes are documentation/evidence only.

| Actual check | Result |
| --- | --- |
| `npm run build` | Server/client TypeScript and production Vite build passed |
| `npx playwright test --reporter=list,json` with `PLAYWRIGHT_JSON_OUTPUT_NAME=artifacts/evidence/ui-wording/browser-results.json` | 38 passed, 0 failed/skipped/flaky, no retries; 19 existing scenarios on each viewport |
| Browser selector scope | The three specs equal accepted-base specs after only the approved wording/screenshot-path replacements and Prettier formatting; all scenario bodies and business assertions are retained |
| Current screenshot review by A/Codex | Inspected 12 actual images: desktop/mobile goal form, template form, pending target, archived goal, inactive catalog and historical 125% progress. New labels wrap and remain readable; existing overflow checks passed |
| Change boundary | No server, API model, schema, authentication, deployment, workflow, dependency or global Playwright configuration edits |

Execution used installed Edge on Windows, the existing 1440×900 desktop and 390×844 mobile configurations, and a dedicated loopback PostgreSQL test database with synthetic fixtures. It did not use the development/demo database. Build and all 38 browser cases passed on the first run for this wording increment; no artificial red/TDD claim is made.

Actual [browser report](../artifacts/evidence/ui-wording/browser-results.json), [execution record](../artifacts/evidence/ui-wording/execution.json) and [file hashes](../artifacts/evidence/ui-wording/manifest.json) belong to this source. The 30 generated screenshots remain in this increment's `member-a/`, `member-b/` and `f05/` evidence subfolders; accepted historical reports/images are unchanged. The inspected 125% screenshot is a synthetic historical-date case, not today's reading or a new UAT claim.

Hosted `test-and-docker` must pass on the submitted PR; its checks/run link is recorded on GitHub after execution. API/unit tests were not rerun locally for this copy-only change; required hosted CI runs the existing regression/build/Docker checks. Datakung must independently review the copy and scope before integration. Review the changed labels and confirmations against the table above, and verify that Inactive still excludes new goals while existing goals work. This PR targets `codex/sprint-1-staging`; public wording changes require the separate reviewed main release and deployment.
