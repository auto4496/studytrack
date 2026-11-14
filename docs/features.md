# StudyTrack - Feature inventory

Current15November2026: A accepted F06 contract PR59 and merged stagingd952ad6. B's F06 implementation candidate now provides owned history/range/pages, minutes-only corrections and date-effective current/best streak. [Actual execution ledger](verification/f06.md):203 unit/API,48 browser, restart/isolation/build pass locally; A implementation review, staging integration and separate release remain pending. Issue58 stays OPEN; F07/F08 ownership and closed Lab5 work are unchanged. Dated preparation checkpoints below are historical.

Current14November2026: B opened [F06 Issue58](https://github.com/auto4496/studytrack/issues/58) and prepared the [history/correction/streak contract](sprints/sprint-2/f06-history-streak.md) with22 planned AC/test pairs for A review. F05 dependencies are accepted; F06 product/executable tests remain NOT_IMPLEMENTED/NOT_RUN. F07 stays A-owned and F08 B-owned; no Sprint2 completion is implied. Older checkpoints retain their writing-time status.

Current13November2026: [F05 acceptance](verification/f05.md#current-acceptance---13-november-2026) records implementation, peer integration and actual reviewed main release. A's [F07 contract](sprints/sprint-3/f07-schedule.md), Issue54, now proposes the complete schedule/reminder API/data/UI/AC boundary for B review; no F07 code/migration/tests have run. F06 and F08 remain B-owned separate work. Earlier inventory statuses below are dated baseline history; stable feature/SRS IDs are unchanged.

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | ผู้ร่าง: สมาชิก B | รุ่น: B-draft-01

สถานะ: **DRAFT / รอ A และ B ตรวจร่วมกัน** การแบ่ง A/B ยึด [handoff](friend-handoff.md) ไม่เปลี่ยนตามผู้เปิดไฟล์ อัปเดต: F01/F03 A foundation และ F02/F04 B increment มี code และ local verification แล้ว; peer acceptance/release ยัง pending; F05–08 ยัง planned

## 1. แหล่งที่มาและวิธีอ่าน

- ขอบเขตผลิตภัณฑ์: [project brief](project-brief.md) §1-8 และ [team plan](team-plan.md) เป็นข้อเสนอของทีม
- ขอบเขตวิชา: [Group Work Specifications](../sources/group_work_specs_v1.pdf) หน้า 3-4, 8-11 โดยหัวข้อ 8 อยู่หน้า 8
- รูปแบบ inventory/traceability: [Deliverable 1](../sources/project_deliverable_1_v1.pdf) หน้า 2-4; D1 ครอบคลุม baseline ทั้งผลิตภัณฑ์ แม้ implementation รอบแรกทำเฉพาะ Sprint 1
- สถานะกลางและช่องว่าง: [traceability](traceability.md), [แผน Sprint](sprints/plan.md), [ผลตรวจ baseline ฝั่ง B](reviews/baseline-review-b.md)

ข้อความส่วนนี้เป็นประวัติ draft-01; ปัจจุบันมี SRS/System SDS ของ A ใน repository แล้ว ดังนั้น **FR/BR/NFR ของ SRS ทุกแถวยังรอ mapping** รหัส BR-01 ถึง BR-10 ด้านล่างอ้างร่างใน project brief §4 ไม่ใช่ baseline ที่ทีมอนุมัติแล้ว รายการ F-01 ถึง F-08 คงรหัสเดิมเพื่อให้ A เชื่อม SRS ได้โดยไม่ต้องเปลี่ยนชื่อฟีเจอร์

## 2. รายการฟีเจอร์ทั้งผลิตภัณฑ์

| ID / ชื่อ | พฤติกรรมและผลลัพธ์ที่ต้องได้ตามร่าง | แหล่ง requirement ปัจจุบัน / SRS | Sprint / owner / reviewer | Dependencies | แนวทางตรวจผลที่วางแผนไว้ |
|---|---|---|---|---|---|
| F-01 Identity & access | Login/logout/current user ด้วย identity ที่ backend ตรวจได้; เก็บรหัสผ่านแบบ hash; session มี expiry/revocation; บังคับ role และ ownership ที่ทุก protected API | Brief §2, §3, §7; BR-07; ดู SRS mapping §6 | 1 / A / B | โครงสร้างร่วม, user/session data, seed และ test DB | Valid/invalid login, anonymous protected request, wrong role, cross-user, logout แล้ว session เดิมใช้ไม่ได้; API/DB integration และ selected UI |
| F-02 Activity templates | Manager สร้างแม่แบบอ่านหนังสือที่ระบุหน่วยและช่วงที่ถูกต้อง; Participant เรียกและเลือกแม่แบบ active; ไม่มีการเปิดข้อมูลส่วนตัวของ Participant ผ่านแม่แบบ | Brief §3-5; BR-01, BR-07; ดู SRS mapping §6 | 1 / B / A | F-01; shared API/error; migration ที่ A ประสาน | Unit validation; API/DB persistence; Participant สร้างแม่แบบไม่ได้; UI create→list→select; [contract](sprints/sprint-1/f02-templates.md) |
| F-03 Personal goals | Participant เลือก active template แล้วตั้งเป้าหมายรายวันและวันเริ่ม; อ่านเป้าหมายของตน; ปฏิเสธ target ผิดช่วงและ active goal ซ้ำต่อ template | Brief §3-5; BR-02, BR-03, BR-07; ดู SRS mapping §6 | 1 / A / B | F-01, F-02; รูปแบบ goal/date และข้อมูล target ที่ส่งต่อ F-04 | Unit bounds/date; API/DB ownership และ duplicate active goal; UI set→retrieve; contract/AC/STS รอ A |
| F-04 Daily entries & progress | บันทึกนาทีรายวันและดึงผลจากฐานข้อมูล; คำนวณ actual/target × 100 โดยเกิน 100% ได้; ปฏิเสธค่าผิดช่วง วันผิดกฎ และรายการซ้ำรวมคำขอพร้อมกัน | Brief §3-5; BR-01, BR-04 ถึง BR-07; ดู SRS mapping §6 | 1 / B / A | F-01, F-03; authoritative goal owner/start date/target/range; unique constraint | Unit date/progress; API/DB reload และ concurrent duplicate; anonymous/manager/cross-user rejection; UI complete journey; [contract](sprints/sprint-1/f04-entries-progress.md) |
| F-05 Goal/template lifecycle | เปลี่ยน target แบบมี effective date วันถัดไปโดยผลย้อนหลังคงเดิม; หยุด goal; ปิดใช้ template แล้วห้ามสร้าง goal ใหม่ แต่ goal เดิมยังบันทึกได้ด้วยหน่วย/ช่วงเดิม | Brief §4-5; BR-03, BR-07, BR-08, BR-10; ดู SRS mapping §6 | 2 / A / B | F-02, F-03, F-04; ตกลง target-version และ snapshot strategy | Unit effective-date/history; API/DB lifecycle และหลายคำขอก่อนมีผล; regression ผลย้อนหลังและ goal เดิมหลัง template inactive; contract ต้องกำหนด stop/revision rules ก่อน code |
| F-06 History & streak | Participant ดูประวัติ/กรองวันที่ แก้รายการของตนตามกฎ และคำนวณ streak ใหม่จาก target ของแต่ละวัน; ไม่เปิด history ข้ามผู้ใช้ | Brief §4-5; BR-04 ถึง BR-09; ดู SRS mapping §6 | 2 / B / A | F-04, F-05; แหล่ง target ตามวันที่; กฎแก้ entry/goal ที่หยุด | Unit date gaps, target versions, current streak/today-not-complete; API/DB edits และ ownership; UI edit→history→recompute; contract ต้องตกลงขอบเขตแก้ไขก่อน code |
| F-07 Schedule/reminder representation | บันทึกตารางที่ตั้งใจอ่าน/เวลาเตือนและเห็นสถานะในแอปของตน; ข้อมูลต้อง persist จริง; ไม่ต้องส่ง email/SMS/push | Brief §5-6; หัวข้อ 8 ของโจทย์; BR-07 และกฎวัน/เวลาที่ต้องร่าง; ดู SRS mapping §6 | 3 / A / B | F-01, F-03, F-05; timezone และผลเมื่อ goal หยุด | Unit schedule/time validation; API/DB save→reload และ ownership; UI planned schedule; contract ต้องระบุ weekday/time/stop behavior ก่อน code |
| F-08 Summary & integrated completion | แสดงสรุปรายสัปดาห์/ช่วงเวลาจากข้อมูลจริงของตน; รวม actual/target ของช่วงที่เลือกตาม target history; เก็บงาน usability/error/access และ regression ของระบบรวม | Brief §5; หัวข้อ 8 ของโจทย์; BR-05 ถึง BR-09; ดู SRS mapping §6 | 3 / B / A | F-04, F-05, F-06; นิยามวันใน denominator และช่วงเวลาต้องตกลง | Unit period/denominator/versioned target; API/DB summary และ ownership; UI summary ที่มีข้อมูลจริง/ช่วงว่าง; integrated regression; ห้ามใช้ hardening แทน summary |

งาน F-05 ถึง F-08 มีที่ไปใน baseline ตั้งแต่ D1 แต่ยังไม่ต้องกำหนดทุก endpoint/AC ณ วันแรก ต้องมี contract ที่ตรวจได้ก่อนเริ่ม implementation ของแต่ละฟีเจอร์ ส่วน F-07 และ F-08 ต้องมี contract ครบและมีอย่างน้อยหนึ่ง workflow/rule ที่ implemented และ tested จริงภายใน D2

## 3. ความรับผิดชอบร่วมที่ต้องมีใน baseline

| ความรับผิดชอบ | ผู้ประสาน / ฟีเจอร์ที่ใช้ | Sprint ที่สร้างและตรวจ | ผลที่ต้องเก็บภายหลัง |
|---|---|---|---|
| Session, role, ownership, safe errors | A foundation; ทุก owner ใช้กับ endpoint ของตน / F-01 ถึง F-08 | สร้าง S1; regression S2-S3 | API restriction tests ที่ไม่คืน private data; expiry/logout และช่องทางใหม่ทุก Sprint |
| Persistent data, schema, constraints, migration/seed | A ประสาน S1; B เสนอข้อกำหนด F-02/F-04 / ทุก feature | S1 local; Lab 5 deploy; S2-S3 migration/regression | Fresh setup, persisted retrieval; หลัง restart/redeploy ต้องอ่านข้อมูลเดิมได้; test DB แยก |
| UI/API conventions และ accessible states | B ประสาน; A ตรวจ auth/data agreement / ทุก feature | [ข้อเสนอร่วม](ui-api-conventions.md) ก่อน S1 code; ตรวจซ้ำ S2-S3 | Validation/loading/empty/error recovery; API shapes/statuses ตรง contracts |
| Bangkok date / target history ที่ใช้ร่วมกัน | A data design + B rule cases / F-03 ถึง F-08 | Date/progress S1; version/streak S2; schedule/summary S3 | Fixed-clock timezone boundaries; historical calculations ไม่เปลี่ยนจาก target ปัจจุบัน |
| Build/test/reproduction/configuration | A setup + B fresh-setup check; ทั้งคู่ deployment/maintenance | S1 local; Lab 5 Docker/CI/GCP; ต่อเนื่องถึง Final | คำสั่งจริง, count/result/commit, safe config; CI required-check gate และ deployment version หลัง Lab 5 |

NFR ที่วัดได้และรหัสถาวรต้องมาจาก SRS ของ A และการตกลงร่วมกัน; ไม่อ้างว่ามี performance SLA หรือว่าผ่าน NFR แล้ว ตัวอย่าง verification target ที่เสนอมีใน traceability

## 4. ขอบเขตที่เสนอให้ยืนยัน

หน่วยเป็นนาทีจำนวนเต็ม, หนึ่ง entry ต่อ goal ต่อวัน Asia/Bangkok, seeded demo accounts (Manager หนึ่งและ Participant อย่างน้อยสอง), ไม่มีการให้ Manager อ่านข้อมูลส่วนตัว ขอบเขตเหล่านี้ยังเป็นร่างทีมตาม brief; ข้อกำหนดวิชาบังคับจริงคือ authentication/authorization/persistence และ domain workflow ในระดับหัวข้อ 8

ไม่รวม medical advice, AI recommendation, social feed/leaderboard, หลายหน่วยในรุ่นแรก, external reminder delivery, self-registration/password recovery/email verification ใน Sprint 1 หรือการแชร์ข้อมูลส่วนตัวโดยไม่มี design สิทธิ์ใหม่ หากเปลี่ยนต้องบันทึกเหตุผล ผู้เห็นชอบ และผลต่อ SRS/contract/tests ไม่ลบ coverage gap เงียบ ๆ

## 5. สถานะและการบำรุงรักษารายการ

สถานะปัจจุบัน: F01–04 implemented และตรวจ local regression115 + browser24 checks ผ่านบน source0b51571; ยังไม่ accepted/released. F05–08 planned และต้องมี contract ก่อน code. รายละเอียด actual tests/version และ pending gates อยู่ใน verification/member-b.md

เมื่อ A ส่ง SRS ให้เติม FR/BR/NFR จริงลง [traceability](traceability.md), ตรวจว่าทุก baseline requirement มี feature หรือ named responsibility และ Sprint, แล้วให้ทั้งคู่บันทึกการตัดสินใจ ก่อนเลื่อนงานเป็น Ready/เริ่ม code ใช้ Issue และ branch จาก sprint staging ตาม team-plan; owner แต่ละฟีเจอร์เติมผลจริงและให้คู่ทีม review

| รุ่น / วันที่ | การเปลี่ยน | การยืนยัน |
|---|---|---|
| B-draft-01 / 3 พ.ย. 2026 | ร่าง inventory F-01 ถึง F-08 จาก brief และ PDF; แสดง dependencies, responsibilities และช่องว่าง SRS | รอ A/B; ไม่มีการอนุมัติหรือผลทดสอบในรอบนี้ |

## 6. SRS mapping update v0.2

Source: [SRS A v0.1](srs.md) on PR3 foundation. IDs are existing A IDs, not a new B requirement set. Full FR01–19/BR01–13/NFR01–08 allocation and planned verification in [traceability](traceability.md). Earlier pending-SRS wording above records the initial snapshot only. No A acceptance or B execution implied

| Feature | SRS links |
|---|---|
| F01 | FR01–04, BR07, NFR01/02/07 |
| F02 | FR05/06/19, BR01/07/10, NFR01/02/03/06/07 |
| F03 | FR07/08/19, BR02/03/07, NFR01/03/04/06/08 |
| F04 | FR11/12/19, BR04/05/06/07/08/10/11, NFR01–08 applicable |
| F05 | FR09/10, BR03/08/10/11 |
| F06 | FR13/14/15, BR04/05/08/09/11/12 |
| F07 | FR16/17, BR07/13 |
| F08 | FR18/19, BR06/07/08/09/12 |

Revision B-implementation-01 (3 Nov): actual F02/F04 local verification and full A SRS mapping updated; no peer approval or accepted release asserted.
