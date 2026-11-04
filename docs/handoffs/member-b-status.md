> อัปเดต 4 พฤศจิกายน 2026: PR3 merge เข้า staging1a4b74bแล้ว B sync F02 โดยไม่มี conflict และทดสอบ source5e340f8: API/unit66ผ่าน, browser16ผ่าน, build/restartผ่าน ดู [F02 ส่ง A ตรวจ](f02-review-ready.md). ใช้ PR6 เดิมเข้า staging; ยังรอ A review/approval และยังไม่ merge F02. ข้อความด้านล่างเป็นประวัติเดิม

> อัปเดต implementation ฝั่ง B — 3 พฤศจิกายน 2026: branch `codex/f02-templates` ทำ F02 manager create/catalog/UI และ tests แล้ว (Issue #4) ใช้ A PR #3 เป็น temporary dependency. Source a3769d4: API/unit regression64ผ่าน, browser6ผ่าน, buildผ่าน; red15fail/1passที่0e1ca17ก่อนcode. ดู [verification](../verification/member-b.md). ยังไม่ merge/accepted และยังไม่รวม F04 ซึ่งทำใน branchถัดไป. ข้อความด้านล่างเก็บประวัติรอบเอกสารก่อนimplementation

# สถานะส่งกลับสมาชิก A — รอบเอกสารของ B

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | Revision: B-draft-02

**สมาชิก: B / ชื่อจริงยังไม่ระบุ** — A คือเพื่อนร่วมทีมผู้เริ่มวางแผน ไม่สลับ A/B ตามคนอ่าน

**อัปเดตหลังได้ repository และเอกสาร Lab5:** ตรวจ [repository กลาง](https://github.com/auto4496/studytrack) แล้ว พบ SRS/System SDS/shared interfaces และโค้ด A ใน [PR #3](https://github.com/auto4496/studytrack/pull/3) (`codex/member-a-sprint1` ณ `2370df9d760862a2c96aead7c70eb63762bb7192`) พร้อมให้ B ตรวจ; main/staging ยังเป็นเอกสารและ PRยังไม่ merge จึงไม่ต้องรอ A สร้าง foundation อีกชุด ต้อง reviewและปรับ B contractsให้ตรง interfacesก่อนต่อโค้ด ไม่มีการอนุมัติ/mergeแทนเพื่อนในรอบนี้

พบ repoยัง private ซึ่งขัด Lab5 R-12; Actions runs=0 และ rulesets API403 รายละเอียด required/recommended, C01–06, PDF Answer Part0–4 และจุดadaptkitอยู่ใน [Lab5 gap review](../labs/lab-05/gap-review-b.md) คำว่า “ยังไม่มี repo/SRS/code” ในข้อความรอบแรกด้านล่างเป็นประวัติ snapshotเดิม ไม่ใช่สถานะกลางล่าสุด

**งาน B:** เอกสาร/contracts 8 ไฟล์รอบแรก + gap reviewใหม่ 1 ไฟล์; ยังไม่มี implementation/testsของ F02/F04 ในรอบนี้ SRS mappingที่เคยรอ A ตอนนี้เปลี่ยนเป็นงาน B ต้องเติม FR01–19/BR01–13/NFR01–08 จาก SRSที่มีแล้ว และประสาน API `/api/templates`, unit `MINUTES`, validation/envelope/pagination/DTOsตามตารางใน gap review ชุด ZIPรอบแรกเป็น B-draft-01 และยังไม่รวม reviewครั้งนี้

## 1. เริ่มจากอะไร / ไฟล์ที่ส่งกลับ

หัวข้อ 1–6 ด้านล่างเก็บรายละเอียดรอบ B-draft-01 เพื่อรักษาประวัติ ส่วนสถานะล่าสุดและงานต่อให้ยึดอัปเดตต้นไฟล์กับ Lab5 gap review โดยเฉพาะเรื่อง repository, SRS และโค้ด A ที่มีแล้ว

เริ่มจากเนื้อหาที่แตกไว้ใน `C:/CPE/CPE334/Project/studytrack` ตามที่ B ระบุ สอดคล้องกับ snapshot handoff วันที่ 3 พ.ย. 2026 แต่ไม่ได้ตรวจ ZIP ต้นฉบับ ไม่มี `.git` หรือ repository URL ในชุดนี้ จึงไม่มี shared commit, branch, Issue, PR หรือ release จริงให้ระบุ ทำเอกสารในสำเนาแยกใน workspace ตาม handoff ไม่สร้าง remote/scaffold/database แข่งกับ A

อ่าน README, project brief, team plan, friend handoff และ PDF โจทย์ใน sources ครบ 4 ฉบับ รวม 34 หน้า รายละเอียดแหล่ง/เลขหน้าอยู่ใน [baseline review](../reviews/baseline-review-b.md) ไม่พบ SRS/System SDS หรือ Lab 5/6/7 handout แยกใน snapshot

| ไฟล์ใหม่ | สิ่งที่ร่างเสร็จ / สถานะ |
|---|---|
| [baseline-review-b.md](../reviews/baseline-review-b.md) | แยกคำสั่งผู้ใช้/ข้อกำหนดต้นทาง/ข้อเสนอ/สิ่งที่ไม่ทราบ; คำถาม A/TA และแนว review SRS เมื่อ A ส่งมา |
| [features.md](../features.md) | F-01–F-08, owner/reviewer, dependencies, ผลลัพธ์และแนวตรวจครบสาม Sprint |
| [sprints/plan.md](../sprints/plan.md) | Sprint goals/features/gates, แผนรายวัน D1, Lab 5–7, D2 และ Final โดยแยก internal targets จาก deadline จริง |
| [traceability.md](../traceability.md) | โครง capability/BR/cross-cutting mapping และ execution ledger; SRS FR/BR/NFR IDs ยังรอ A; BR-01–10 อ้าง draft brief เท่านั้น |
| [ui-api-conventions.md](../ui-api-conventions.md) | Navigation, loading/empty/validation/error/retry, JSON/status/error, role/ownership และ auth/data dependency proposals |
| [f02-templates.md](../sprints/sprint-1/f02-templates.md) | Feature SDS, UI/API/data proposal, numbered AC-F02, STS/coverage, DoD และหลักฐานที่ต้องเก็บ |
| [f04-entries-progress.md](../sprints/sprint-1/f04-entries-progress.md) | Feature SDS, daily entry/progress/date/duplicate/privacy, numbered AC-F04, STS/coverage, DoD และ dependency F03 |
| [member-b-status.md](member-b-status.md) | สรุปรอบนี้เพื่อให้ B ส่งกลับ A |

ทุกไฟล์เป็น **draft/proposed** ยังไม่ใช่ accepted baseline; เอกสารเดิมและ PDF ต้นทางคงไว้ การจัดทำ contracts รอบนี้ไม่เท่ากับ working Sprint 1 หรือส่ง Deliverable 1 สำเร็จ ชุด ZIP สำหรับส่งกลับมีเฉพาะเอกสารใหม่ 8 ไฟล์ตามตาราง โดยคง path ใต้ docs ให้ A ตรวจและรวมเข้ากับงานล่าสุด ไม่ใช้แตกทับ repository ที่พัฒนาต่อแล้ว

## 2. ขอให้ A ตอบก่อนเริ่มโค้ด

ตารางนี้เก็บคำถามรอบแรกไว้เป็นประวัติ: ข้อ1/3/4/6 มีข้อมูลให้ตรวจแล้วใน A branch/implementation handoff ไม่ต้องขอสร้างrepo/scaffoldใหม่; ข้อ2/5 และความต่างของcontractsยังต้องreviewร่วมกัน Ownerต้องจัด publicตาม R12 ก่อน Lab5หลังตรวจความปลอดภัยของไฟล์ที่จะเผยแพร่

| ลำดับ | ขอข้อมูล/การตัดสินใจจาก A | สิ่งที่ B จะทำต่อ |
|---|---|---|
| 1 | ส่ง repository/staging branch และ SRS/System SDS/ER/F01/F03 contracts ฉบับล่าสุดเมื่อมีจริง พร้อมชื่อ/รหัส/GitHub ของทั้งคู่; ตรวจสิทธิ์เลือกหัวข้อ 8 ตามเลขท้ายรหัส | Sync repository จริงก่อนใช้ snapshot; review SRS ของ A และ map FR/BR/NFR ทุกข้อโดยไม่สร้าง IDs เอง |
| 2 | ยืนยันหรือเสนอแก้ BR-01–10 โดยเฉพาะนาที/ช่วง, วันเริ่ม goal, วัน Bangkok, หนึ่ง entry ต่อ goal/date, >100%, privacy, target history/lifecycle | ปรับ contracts/traceability พร้อมเหตุผลและ revision ให้ตรง baseline ที่รับร่วมกัน |
| 3 | ยืนยัน F01 principal/role strings, login/me/logout/session expiry+revocation, CSRF bootstrap/header/rotation และ cookie/origin policy ตาม conventions | ต่อ protected endpoints/UI ได้จาก interface เดียว; ไม่ทำ role selector หรือ client user ID แทน authentication |
| 4 | ยืนยัน F03 goal fields: owner, startsOn/status, snapshot unit/min/max และ initial target version/lookup ตาม effective date; ตกลง migration โดย A ประสาน | F04 ตรวจ owner/date/range และคำนวณด้วย target ของวันนั้นได้โดยไม่เปลี่ยนผลย้อนหลัง; เสนอ UNIQUE(goalId,entryDate) ให้ A รวม schema |
| 5 | Review F02/F04 contracts และ shared JSON/error/status/rounding; ยืนยันชื่อแม่แบบซ้ำได้, title/description bounds และ precision เป็นข้อเสนอใหม่ | แก้ข้อค้นพบก่อน tests→implementation; F02/F04 ยังไม่ถือว่าผ่าน peer review |
| 6 | ยืนยัน stack/เวอร์ชัน/package manager, setup/test DB/seed manager+P1+P2 และ harness/clock ร่วม; นัด review/งานรวมก่อน D1 | B ลอง fresh setup, ทำ planned tests และเก็บ red/green จริง; ไม่แก้ package/Prisma/auth ส่วนกลางก่อนประสาน |

รายละเอียดที่ยังต้องร่างก่อน Sprint 2: แก้ target หลายครั้งก่อนมีผล, วันที่/สิทธิ์แก้ entry, stopped-goal behavior, current streak เมื่อวันนี้ยังไม่ครบ และวิธีคงประวัติเมื่อปิดแม่แบบ บันทึกข้อเสนอไว้ใน review แต่ยังไม่แช่แข็งเป็น F05/F06 contract

## 3. Interface ที่ B เสนอโดยย่อ

ทั้งหมดมี prefix `/api/v1`, success `{data:...}`, validation/error `{error:{code,message,fields?}}`; session เป็นแหล่ง identity; wrong-role 403; private resource ที่ไม่พบ/ไม่ใช่เจ้าของใช้ 404 shape เดียวกัน

- **F02:** GET `/activity-templates` ให้ผู้ login ทั้งสองบทบาทอ่าน active templates; POST เส้นทางเดียวกันให้ Manager สร้าง title/description/unit=`minute`/minMinutes/maxMinutes; client กำหนด owner/role/status ไม่ได้; update/deactivate อยู่ F05
- **F04:** POST `/goals/:goalId/entries` รับ `{entryDate,minutes}`; GET `/goals/:goalId/progress?date=YYYY-MM-DD` ดึงผลจริง; Participant เจ้าของเท่านั้น Manager ถูกปฏิเสธ; unique DB constraint กัน duplicate/concurrent ส่ง 409 โดยไม่ overwrite
- **Progress:** server resolve target version ตามวัน; 45/60=75%, 75/60=125%; เสนอ round HALF_UP 2 ตำแหน่ง และ achieved เทียบ actual>=target ก่อนปัด; ไม่มี entry ใช้ entry=null และ actual/progress=0 แยกจากการบันทึก 0 ซึ่งไม่อนุญาตตามข้อเสนอช่วงนาที
- **วันที่/ประวัติ:** server ยึด Asia/Bangkok; startsOn≤entryDate≤วันนี้; goal snapshot หน่วย/ช่วงไว้ตั้งแต่สร้าง; F05 target ใหม่มีผลวันถัดไปตาม BR draft และไม่เปลี่ยนอดีต

รูปแบบ fields/response/STS เต็มอยู่ใน contracts และ conventions ทุกข้อนี้ยังรอ A ตอบ ไม่ใช่ implementation หรือ auth/schema ที่มีอยู่แล้ว

## 4. ประเด็นกับ TA / หลักฐานส่งงาน

ข้อขัดแย้งที่อ่านพบ: Final PDF หน้า 2 ระบุ video ≤10 นาที แต่หน้า 4 ≤4 นาที; master หน้า 13 ให้ video 8 + release summary 2 คะแนน ขณะที่ Final หน้า 1/4 ให้ video 10 คะแนน ขอทั้งคู่ยืนยัน TA และบันทึกคำตอบ อย่าแก้โจทย์หรืออ้างว่าได้รับอนุมัติแล้ว ระหว่างรออาจเผื่อ outline ≤4 นาทีและ summary หนึ่งหน้า

D1 ส่ง **8 พฤศจิกายน 2026 เวลา 23:59 Asia/Bangkok** ต้องมี baseline ทั้งผลิตภัณฑ์ + working Sprint 1 และ PDF เดียวที่รวม A–F ในตัว B รวบรวม B/D/F แต่ Part F ยังไม่มี runtime evidence รอบนี้; Docker/CI/CD/GCP ที่เสร็จจริงไป Lab 5 วันที่ 15 พ.ย. ไม่สร้างผลสำเร็จล่วงหน้า D2 วันที่ 29 พ.ย. ต้องจบ S2 และมี contracts S3 ทุก feature พร้อม meaningful implemented/tested workflow/rule อย่างน้อยหนึ่ง

## 5. การตรวจที่ทำจริงและสิ่งที่ยังไม่ได้ทำ

- **Application tests/build:** รอบนี้ทำเอกสาร ยังไม่รัน tests/build; ยังไม่มี executable app/test suite และไม่มี passing/failing/skipped counts, red/green logs หรือ tested commit
- **Git/review/UAT/deployment:** ไม่มี remote/Issue/PR/review จาก A/accepted release/UAT/CI/deploy เกิดขึ้นในรอบนี้ ชื่อ branch ในแผนเป็นตัวอย่างเท่านั้น
- **Document verification:** ตรวจ relative links ในเอกสารใหม่ 67 จุดแล้วพบปลายทางครบ; JSON examples อ่านได้; F02 มี 9 AC/11 planned test IDs และ F04 มี 12 AC/16 planned test IDs โดยทุก AC มี STS และ mapping ตรงกับ execution ledger ทั้ง 27 แถวใน traceability; เทียบ SHA-256 แล้วไฟล์เดิม 8 ไฟล์ตรงกับต้นทางทุกไฟล์ การตรวจนี้เป็นการตรวจเอกสาร ไม่ใช่ application test results หรือ teammate review
- **AI-use declaration:** ใช้ Codex ช่วยอ่านโจทย์ ร่างเอกสาร/contracts และตรวจความสอดคล้องของเอกสาร; B ต้องอ่าน เข้าใจ และตัดสินใจรับงานที่ AI ช่วย; การตรวจโดย AI ไม่ใช่ teammate review หรือการอนุมัติของ A

## 6. งานถัดไป

1. B อ่านชุดนี้แล้วส่งให้ A ตรวจข้อเสนอใน §2; A ส่ง baseline/ตอบ interfaces และ both members บันทึก decision จริง
2. เมื่อ repository กลางพร้อมให้ sync ล่าสุดจาก repository; ย้ายเฉพาะเอกสาร B ผ่าน branch/PR ตาม workflow ไม่ส่ง ZIP ทับโปรเจกต์ทั้งชุด; ใส่ requirement mapping และแก้ contracts ก่อน code
3. A รวม setup/schema/auth/F01 และ F03 ตาม dependencies; B เตรียม/รัน tests แล้วทำ F02 และ F04 เมื่อพร้อม จาก sprint staging เช่น `codex/f02-templates`, `codex/f04-entries-progress`; ทุก shared file change ประสานก่อน
4. ให้ A review งาน B และ B review F01/F03 ของ A จริง; เก็บ test/assertion/command/count/result/commit และ meaningful TDD red/green; integration/E2E/acceptance ก่อน release PR ไป main
5. เติม execution ledger และหลักฐาน PDF D1 จากของที่เกิดขึ้นจริง: persisted retrieval, rule rejection, role/ownership/logout, automated test excerpts 2 ชิ้น และ Issue/PR chains ที่เสร็จจริง 2 ชุด พร้อม contribution/AI declaration/known gaps

| Revision | วันที่ | การเปลี่ยน | การอนุมัติ |
|---|---|---|---|
| B-draft-01 | 3 พ.ย. 2026 | เอกสาร/contracts รอบแรก 8 ไฟล์ พร้อมข้อเสนอและ dependency ที่รอ A | รอ B อ่าน/A review; ยังไม่มี accepted baseline |
| B-draft-02 | 3 พ.ย. 2026 | ตรวจ central repo/main/A PR3 และ Lab5 handout+guide+kit; เพิ่ม gap review, แยก R01–12/C01–06/required vs recommended และรายการ reconcile B contracts | ไม่มี GitHub mutation/feature tests/CI/GCP executionในรอบนี้; PR3ยัง OPEN |
