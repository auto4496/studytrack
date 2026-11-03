# Member B status — implementation handoff

วันที่ 3 พฤศจิกายน 2026 (Asia/Bangkok) | Revision B-implementation-01

**สมาชิก B = ผู้ใช้/Datakung, A = เพื่อนร่วมทีม/auto4496.** F02/F04 มี implementation และ local verification แล้ว พร้อมให้ A review; ยังไม่ใช่ accepted release และยังไม่ได้รวมเข้า main

## 1. เริ่มจากและ branches

ใช้ central repository https://github.com/auto4496/studytrack และ A PR #3 ที่2370df9 ซึ่งยังไม่ merge. ทำใน checkout `C:/CPE/CPE334/Project/studytrack-member-b` แยกจาก snapshotเอกสารเดิม ไม่สร้าง auth/schema/scaffold ซ้ำ

- Issue #4: F02, branch `codex/f02-templates` อาศัย A `codex/member-a-sprint1` ชั่วคราว
- Issue #5: F04, branch `codex/f04-entries-progress` อาศัย F02 branch
- เปิด [draft PR #6 F02](https://github.com/auto4496/studytrack/pull/6) base `codex/member-a-sprint1` และ [draft PR #7 F04](https://github.com/auto4496/studytrack/pull/7) base `codex/f02-templates` แล้ว ในนาม Datakung; ยังไม่ merge/approve. Retarget/rebaseไปaccepted stagingเมื่อdependenciesผ่าน reviewตาม workflow
- Contracts เดิม e3714d0, reconcileกับ A ee14477 ก่อน B implementation; F02 red0e1ca17/greena3769d4; F04 redd709741; final tested source0b51571c6d81a81921dca3e2596e0755488c8f1c

## 2. ทำแล้ว

| ส่วน | พฤติกรรม / ไฟล์หลัก |
|---|---|
| F02 templates | Manager สร้างแม่แบบ, normalized title/description/range, unit MINUTES จากserver, DB-backed active catalog/detail/pagination และ manager inactive filter; server/src/features/templates, client/src/features/templates |
| F04 entries | Own-goal POST/list/progress, snapshot bounds, Bangkok calendar dates/start/end/today, effective target, HALF_UPสองตำแหน่ง/เกิน100%, no-entry state, DB concurrent duplicate409; server/src/features/entries |
| UI integration | ต่อ GoalDetail ActivityComponentเดิม; date/input/progress/loading/empty/errors/session states; unknown POST outcome อ่านผลเดิมก่อนส่งใหม่และกัน stale date responses; client/src/features/entries/DailyActivity.tsx |
| Specs/docs | ใช้ SRS FR01–19/BR01–13/NFR01–08 จริง; contracts v0.2, conventions, traceability/results และ Lab5 gap review |
| Tests/evidence | unit/API/real PostgreSQL/concurrency, full UI journey desktop/mobile, real API process restart, build; [verification](../verification/member-b.md), artifacts/evidence/member-b |

Shared files ที่แตะ: App route/ActivityComponent, styles, template read adapter, goal router child mount, goal reader parameter typesเพื่อใช้ transaction, e2e synthetic users. **ไม่เปลี่ยน package/lockfile/auth middleware/Prisma schema/migrations**; DailyEntry unique constraint ใช้ของ A เดิม

## 3. Interfaces ที่ reconcile แล้ว

ใช้ `/api/templates` และ `/api/goals/:goalId/...`, unit `MINUTES`, title100/description500 Unicode code points, UUID/startDate, list data+meta, A cookie/CSRF/Origin, fields:string/requestId, logout204, CSRF_INVALID/ENTRY_ALREADY_EXISTS. POST entryคืน EntryDTO; GET progressใช้ entryId/nullตาม A. Archived historical date boundsตาม SRS BR11แทนข้อเสนอ B draft01ที่บังคับ activeอย่างเดียว; ไม่เพิ่ม lifecycle API ใน S1. อ่าน [contracts](../sprints/sprint-1/f04-entries-progress.md) และ [conventions](../ui-api-conventions.md)

## 4. ผลที่รันจริง

| Check | Actual result / source0b51571 |
|---|---|
| npm test |115ผ่าน,0fail,0skip (8files; A38+B77) |
| npx playwright test --config playwright.member-b.config.ts |24ผ่าน,0fail,0skip (A10+B14;1440x900/390x844) |
| npx tsx scripts/member-b-restart.ts |ผ่าน:หยุด/เริ่ม API processจริง แล้วอ่าน session/template/goal/entry45/target60/75%กลับจากDBได้ |
| npm run build |ผ่าน backend/client typecheckและ production build |

ใช้ PostgreSQL `studytrack_b_test` บน loopback26433 แยกจาก A/dev. Browser/API suitesรันแยกลำดับ ไม่ล้าง DBพร้อมกัน. เก็บ red/intermediate failures ไว้ครบ: F02 red15fail/1pass; F04 red30fail; fixture clock/loginครั้งแรก5fail และ browser logout timingครั้งแรก2fail แก้โดยคง assertions/expiryเดิม แล้ว final passesข้างต้น. รายละเอียด output/JSON/commands/commits และทุก AC→actual testsอยู่ใน verification ไม่ใช้ AI claimแทน execution

## 5. ให้ A ตรวจและประสาน

1. Review F02/F04 contracts+diff/assertions/resultsจริง โดยเฉพาะ middleware chain, transaction lock/unique error, date-effective target, snapshotและ archived bounds, UI unknown-outcome flow
2. ตรวจการต่อ goal router/reader types/ActivityComponent และ ownership/auth ที่ใช้ร่วมกัน ไม่มีการเพิ่ม schema/migration แต่ shared integrationยังต้อง peer review
3. รับ A PR3ผ่านการตรวจของสมาชิก Bจริงก่อน แล้ว retarget/rebase B branchesไป accepted `codex/sprint-1-staging` ตามลำดับ F02→F04; รัน integrationบน merged candidate ก่อน reviewed release PRไปmain. ห้ามอ้างว่า AIตรวจคือ human approval
4. Ownerจัด repo publicตาม Lab5 R12หลังตรวจ secrets/history; เพิ่ม CI/required-check proof/Docker/GCP/deployment.md/C01–06ตาม [Lab5 review](../labs/lab-05/gap-review-b.md). รอบนี้ไม่เปลี่ยนvisibility/billing/IAM/databaseบนcloud

## 6. ยังไม่ทำ / งานต่อ

A peer review/accepted staging+main release, D1 self-contained PDFที่รวม A–F, GitHub CI/required gate, Docker/GCP/redeploy evidence, independent UATและ Sprint2/3ยัง pending. Local greenของF02/F04ไม่เท่ากับงานเหล่านี้เสร็จแล้ว

สำหรับรันทวนใช้ READMEและ B verification; ไม่ส่ง env/password/session tokensเข้า Gitหรือแชต. ใช้ seed-generated demo credentialsจาก private .envบนเครื่องเท่านั้น. AI-use declarationอยู่ docs/ai-use.md; Bต้องอ่านและอธิบายงานที่รับ ส่วน A reviewยังไม่ถูกสร้างแทนเพื่อน

## ลองบนเครื่องนี้

UI: http://127.0.0.1:3300/ ใช้ API5300 และฐานข้อมูล B devที่แยกจากtest/A. บัญชีสังเคราะห์ manager@studytrack.test, student1@studytrack.test, student2@studytrack.test; รหัสผ่านจาก private `.env` เท่านั้น ไม่ใส่ค่าในแชต/รายงาน. เครื่อง A ใช้ README setupของrepoและ envของตน ไม่คัดลอก private envจากเครื่อง B
