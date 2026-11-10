# Member B status — implementation handoff

## สถานะปัจจุบัน 9 พฤศจิกายน 2026: เริ่ม EP6

Datakung คือสมาชิก B; auto4496 คือสมาชิก A และเจ้าของ repo EP5 ผ่านการตรวจทั้งคู่แล้ว release PR #30 merge เข้า main `5c04cd4` และ Issue #20 ปิดแล้ว แอปที่ deploy ตามหลักฐานเดิมยังอ้าง source `807ed08` ไม่อนุมานว่า merge เอกสารคือ deploy ใหม่

B รีวิวและ APPROVED [PR #32 สัญญา F05](https://github.com/auto4496/studytrack/pull/32#pullrequestreview-5821596719) และ [PR #33 แผน EP8](https://github.com/auto4496/studytrack/pull/33#pullrequestreview-5821597081) พร้อมเชื่อม Development กับ #31/#23 และตรวจทั้งสองฝั่ง รับเฉพาะสัญญาและแผน งาน implementation/ทดสอบจริงยังไม่เสร็จ PR #33 ไม่ใช่ dependency ที่ต้องรอก่อนเริ่ม EP6

งานถัดไปฝั่ง B คือ #21 EP6 → #22 EP7 → #23 EP8 → #24 รายงาน โดยทั้งคู่ร่วมทดสอบ/รีวิวตาม team plan เตรียม [EP6 contract และขั้นตอน 6.1-6.7](../labs/lab-05/ep6-gate-identity.md), payload merge gate และ record template จาก guide หน้า56-80 พร้อม ID/OIDC format จริงแล้ว การตั้งค่าและ failing-PR proof ยัง NOT RUN; ไม่ได้เปลี่ยน IAM/GitHub settings หรือ deploy ในรอบนี้

**ประสาน A:** รีวิวค่าที่เสนอให้ครบ โดยเฉพาะสิทธิ์ actAs บน runner/migrator, immutable subject/main/deploy.yml/demo และ gate ครอบคลุม main+staging เมื่อรับแผนแล้ว A ใช้สิทธิ์ admin ตั้ง environment/gate; ผู้มีสิทธิ์ GCP เป็นผู้ดำเนินการ IAM/WIF ส่วน B ประสานและตรวจกลับ บัญชีที่เครื่องมือนี้ใช้มี WRITE แต่ไม่มี ADMIN จึงไม่สามารถตั้งกฎแทน A ได้ ไม่ต้องเพิ่ม bypass หรือส่ง JSON key/รหัสผ่านให้เครื่องมือ หลัง gate เปิดจริง B จึงทำ normal failing PR และเก็บภาพ Required check/blocked merge ก่อนปิด probe โดยไม่ merge

หัวข้อวันที่8พฤศจิกายนด้านล่างเป็นประวัติ checkpoints ก่อน release ไม่ใช่สถานะปัจจุบัน

## อัปเดต Lab 5 วันที่ 8 พฤศจิกายน 2026

**EP5 deploy จริงและรายการตรวจฝั่ง B ผ่านแล้ว รอ A ตรวจรับบน Cloud และรีวิวเอกสารรอบนี้ก่อนปิด [Issue #20](https://github.com/auto4496/studytrack/issues/20).** รายละเอียดและลำดับตรวจอยู่ใน [EP5 evidence](../labs/lab-05/ep5-evidence.md) และ [deployment runbook](../labs/lab-05/deployment.md)

- Source ที่ deploy: main `807ed0806a84f39e88e0ba8f8fa5e658f41fe97f` จาก PR #27 หลัง A รับ bootstrap PR #26; revision `studytrack-00001-rtr` รับ traffic 100% เอกสาร branch นี้ยังไม่ได้ deploy
- เว็บ: <https://studytrack-981693883236.asia-southeast1.run.app>. Build สำเร็จ, migration/seed สำเร็จ, smoke หน้าแรกและ health ผ่าน B ดึงทั้งสอง URL จากภายนอกได้ HTTP200 และ health status ok
- ผู้ใช้ฝั่ง B ทำ manager template → student1 goal30นาที → invalid0ถูกปฏิเสธ → บันทึก15นาที/50% → รีเฟรชยังอยู่ → student2เปิด goalเดิมแล้วไม่พบรายการ ภาพแสดงพฤติกรรมจริง; ไม่อ้าง HTTP status จากภาพหรือ server validation จากการกรอก0ที่หน้าเว็บ
- Console/คำสั่งยืนยัน Run CPU1/512MiB/8080/min0/max3, SQL17/Enterprise/db-f1-micro/10GB/ปิดauto-increase/Single zone, database studytrack, runtime/tools images, secret3ชื่อ และ project IAMตามแผน รายชื่อ enabled APIsมีครบ7ตัวที่สคริปต์ใช้
- ครั้งแรก Build submission ถูกปฏิเสธ หลังตรวจสิทธิ์ผู้เรียก5รายการผ่านจึงลองซ้ำหนึ่งครั้งและสำเร็จ โดยไม่เพิ่ม roleแก้ปัญหา สาเหตุครั้งแรกยังไม่พิสูจน์; IAM propagationเป็นเพียงข้อสันนิษฐาน

**ประสาน A:** อ่าน diff เอกสารและเทียบ SHA/digests/revision, รับ demo credentials ผ่านช่องทางส่วนตัวของทีม แล้วตรวจ workflow บน URL จริงด้วยตนเอง บันทึกว่าใครตรวจอะไรและผลเป็นอย่างไรใน #20/PR เอกสาร ห้ามถือว่า approvalของPR #26/#27คือการตรวจCloudหลังdeployแล้ว เมื่อเอกสารและlive acceptanceครบจึงรับเข้าstagingและเดินreleaseเอกสารตาม [workflow](../review-workflow.md) ก่อนปิดIssue #20 ไม่มีการรันdeployซ้ำเพื่อรับเอกสาร

เก็บภาพต้นฉบับ15ภาพและดัชนีไว้ในโฟลเดอร์ local `studytrack-ep5-evidence` สำหรับส่งให้ A แบบส่วนตัวและทำรายงาน ภาพยังไม่ได้เผยแพร่ในrepoและบางภาพมีอีเมลบัญชี Google; ข้อเท็จจริงที่ปลอดภัยและชื่อภาพอยู่ในEP5 evidence งานrequired gate/WIF #21, main deployment pipeline #22, cloud restart/redeploy #23 และรายงาน/PDF #24ยังแยกติดตามอยู่ รีเฟรชหน้าเว็บไม่ใช่หลักฐานrestart/redeploy

### ประวัติเตรียม EP4/EP5 ก่อน deploy จริง

ย่อหน้าต่อไปนี้เป็น snapshot ระหว่างเตรียมสคริปต์ สถานะปัจจุบันอยู่ด้านบน

B ตรวจซ้ำ [PR #15](https://github.com/auto4496/studytrack/pull/15) ที่ `4ff9baa332b9b580d09f504f88caa74997e823b2` แล้วผ่าน 21 configuration checks และ 35 HTTPS/API/browser/lifecycle checks บนชุด Docker แยก ข้อมูล 45/60=75% และ session อยู่หลัง app restart, container recreation และ DB restart ตรวจภาพ desktop/mobile แล้ว ผล build ใช้ cache ที่มีอยู่ บันทึก [APPROVED review](https://github.com/auto4496/studytrack/pull/15#pullrequestreview-5816774539) และ merge เข้า staging ที่ `637468da8e537eaf15ed892f22c9c34c27ac0304` แล้ว

งาน B ต่อใน [Issue #18](https://github.com/auto4496/studytrack/issues/18) และ branch `codex/lab5-ci` ซึ่งรวม staging ที่รับ PR #15 แล้ว Workflow ตรวจ PR เข้า `codex/sprint-1-staging` และ `main` ด้วย job `test-and-docker` ใช้ PostgreSQL 17 ชั่วคราว รัน configuration guards, API/unit, browser desktop/mobile, build server/client, production Docker build และ offline smoke tests

A อนุมัติและ merge [PR #19](https://github.com/auto4496/studytrack/pull/19) เข้า staging แล้ว B อนุมัติ release [PR #25](https://github.com/auto4496/studytrack/pull/25) หลังตรวจ source/CI และรัน 21 config + 3 smoke checks ซ้ำ จากนั้น merge เข้า main ที่ `737c591af2a56797781b18742e065cb96eb3faed` ตามคำยืนยันผู้ใช้ ตรวจ tree หลัง merge ตรงกับ release ที่ผ่าน CI แล้ว Issue #18 ปิดและ EP4 เสร็จ

EP5 เตรียมใน [Issue #20](https://github.com/auto4496/studytrack/issues/20), branch `codex/lab5-gcp-bootstrap` ผู้ใช้ยืนยัน Cloud Shell clone `737c591`, project `studytrack-cpe334`, region `asia-southeast1`, billing enabled, Budget alert และสิทธิ์ A แล้ว [Cloud contract](../labs/lab-05/cloud-contract.md) บันทึกก่อน implementation และ [deployment runbook](../labs/lab-05/deployment.md) ระบุทรัพยากร/สิทธิ์ที่เสนอให้ A ตรวจ สคริปต์ใช้ runtime/tools images แยก, Cloud SQL PostgreSQL 17, APP_ORIGIN ตรง HTTPS และรัน migration/seed ก่อน service update

ผลเตรียมสคริปต์ผ่าน 13 bootstrap + 3 smoke tests บน Linux และตรวจ YAML สองไฟล์ผ่าน ตัวจำลองยืนยัน dry run เรียก gcloud ศูนย์ครั้ง มี literal dry run ของ source `8299784` สำหรับโปรเจกต์จริงแล้ว ทรัพยากร cloud, URL, การเข้าใช้จริงและ C-04 ยังต้องมีหลักฐานหลัง A รีวิวและ release scripts เข้า main ผู้ใช้สามารถดูแผนด้วย DRY_RUN=1 จาก review branch ก่อนขั้นนั้น งาน pipeline อัตโนมัติและ persistence cloud อยู่ใน #21-#24

เนื้อหาด้านล่างเป็นประวัติการส่งงาน Sprint 1 วันที่ 4 พฤศจิกายน 2026 สำหรับสถานะ accepted application และรายงาน D1 ให้ดู [release record](../release/sprint-1-readiness.md)

> อัปเดตหลัง A review 4 พฤศจิกายน 2026: PR6และPR7 APPROVED/ MERGEDแล้ว ไม่มีblocking findings; stagingล่าสุด85f510f. Issue4/5 CLOSED. Bตรวจsourceตรงกับที่ผ่าน117API/unit+24browser/build/restartและตรวจraw reportsของAแล้ว. ขั้นต่อไปคือ [release readiness](sprint-1-release-readiness.md), reviewเอกสารรอบนี้และrelease PRเข้าmain; ยังไม่accepted main release

> Workflow ตาม TokTickIT: Aเขียนให้B review และBเขียนให้A reviewในrepoเดียว. PR3/6/7เดินครบ review/mergeเข้าstagingแล้ว; releaseจากstagingไปmainยังต้องได้รับreviewแยก ดู [workflow](../review-workflow.md)

> ประวัติ PR3: B ส่ง [APPROVED re-review](https://github.com/auto4496/studytrack/pull/3#pullrequestreview-5764429004) ที่94156cfหลังแก้P2 แล้ว PR3 mergeเมื่อ4พ.ย.เข้าstagingที่1a4b74b. ผลก่อนmergeและขอบเขตการตรวจแยกจากผลทดสอบงาน B บนฐานใหม่ใน [review history](../reviews/pr-3-member-b.md)


วันที่ 4 พฤศจิกายน 2026 (Asia/Bangkok) | Revision B-after-peer-acceptance

**สมาชิก B = ผู้ใช้/Datakung, A = เพื่อนร่วมทีม/auto4496.** F02/F04มีimplementation/testsและ A review/approvalแล้ว รวมเข้าsprint stagingเรียบร้อย; ยังไม่accepted main release

## 1. เริ่มจากและ branches

ใช้ central repository https://github.com/auto4496/studytrack และ accepted staging85f510f. เตรียมเอกสารreleaseใน `C:/CPE/CPE334/Project/studytrack-sprint1-release`, branch `codex/sprint-1-release-handoff` จากstaging. Checkout F04เดิมและF02ยังเก็บประวัติแยกจากsnapshot ไม่แก้merged feature branchเพิ่มในรอบนี้

- Issue #4: F02, branch `codex/f02-templates` รวม accepted staging แล้ว
- Issue #5: F04, branch `codex/f04-entries-progress` รับF02/stagingและmergeแล้ว
- [PR6](https://github.com/auto4496/studytrack/pull/6) ผ่าน [A approval](https://github.com/auto4496/studytrack/pull/6#pullrequestreview-5764793996) แล้วmerge18e5882; [PR7](https://github.com/auto4496/studytrack/pull/7) ผ่าน [A approval](https://github.com/auto4496/studytrack/pull/7#pullrequestreview-5764853759) แล้วmerge85f510f. ทั้งสองbaseเป็นstagingก่อนรับงานและIssues4/5ปิดแล้ว
- Contracts เดิม e3714d0, reconcileกับ A ee14477 ก่อน B implementation; F02 red0e1ca17/greena3769d4; F04 redd709741. ผลฐานเดิม0b51571เก็บไว้ในverification; tested sourceใหม่ F02=5e340f8 และ F04=afca38f

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

| Check | Actual result / sourceafca38f หลังรับ A foundation |
|---|---|
| Vitest full suite, JSON/default reporters |117ผ่าน,0fail,0skip (8files; A40+B77) |
| Playwright, B configผ่านreporting wrapper |24ผ่าน,0fail,0skip (A10+B14;1440x900/390x844) |
| node --import tsx scripts/member-b-restart.ts |ผ่าน:หยุด/เริ่ม API processจริง แล้วอ่าน session/template/goal/entry45/target60/75%กลับจากDBได้ |
| npm run build |ผ่าน backend/client typecheckและ production build |

ใช้ PostgreSQL `studytrack_b_test` บน loopback26433 แยกจาก A/dev. Browser/API suitesรันแยกลำดับ ไม่ล้าง DBพร้อมกัน. เก็บ red/intermediate failures ไว้ครบ: F02 red15fail/1pass; F04 red30fail; fixture clock/loginครั้งแรก5fail และ browser logout timingครั้งแรก2fail แก้โดยคง assertions/expiryเดิม แล้ว final passesข้างต้น. รายละเอียด output/JSON/commands/commits และทุก AC→actual testsอยู่ใน verification ไม่ใช้ AI claimแทน execution

## 5. ให้ A ตรวจและประสาน

1. F02/F04 contract/diff/assertions/shared integration ผ่าน A reviewแล้ว ดู [review record](../reviews/pr-6-and-7-member-a.md) ไม่พบข้อแก้ค้าง
2. A review PRเอกสารrelease handoffรอบนี้เข้าstaging โดยตรวจสถานะ/links/source equivalenceและreadiness criteria ไม่มีapplication changes
3. Bเตรียมrelease PRจากstagingไปmain ให้A reviewตาม [readiness](sprint-1-release-readiness.md); หลังmergeให้Bตรวจclean mainและบันทึกaccepted SHA ก่อนใช้ในD1 PDF
4. Ownerจัด repo publicตาม Lab5 R12หลังตรวจ secrets/history; เพิ่ม CI/required-check proof/Docker/GCP/deployment.md/C01–06ตาม [Lab5 review](../labs/lab-05/gap-review-b.md). รอบนี้ไม่เปลี่ยนvisibility/billing/IAM/databaseบนcloud

## 6. ยังไม่ทำ / งานต่อ

A reviewเอกสารสถานะรอบนี้และmain release, final-main verification, D1 self-contained PDFที่รวม A–F, GitHub CI/required gate, Docker/GCP/redeploy evidence, independent UATและSprint2/3ยังpending. Feature peer approvalและintegrationที่stagingเสร็จแล้ว

สำหรับรันทวนใช้ READMEและB verification; ไม่ส่งenv/password/session tokensเข้าGitหรือแชต. ใช้seed-generated demo credentialsจากprivate .envบนเครื่องเท่านั้น. AI-use declarationอยู่docs/ai-use.md; reviewของAอ้างจากGitHubและผลรันจริงตามขอบเขตที่Aระบุ ไม่ใช่หลักฐานindependent human UAT

## ลองบนเครื่องนี้

ค่า dev ที่กำหนดไว้: UI http://127.0.0.1:3300/ / API5300 และฐานข้อมูล B devที่แยกจากtest/A; เริ่มservicesตามREADMEก่อนลอง รอบนี้ไม่ได้ตรวจยืนยันว่าdevservicesเปิดค้างอยู่. บัญชีสังเคราะห์ manager@studytrack.test, student1@studytrack.test, student2@studytrack.test; รหัสผ่านจาก private `.env` เท่านั้น ไม่ใส่ค่าในแชต/รายงาน. เครื่อง A ใช้ README setupของrepoและ envของตน ไม่คัดลอก private envจากเครื่อง B
