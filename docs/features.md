# StudyTrack - Feature inventory

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | ผู้ร่าง: สมาชิก B | รุ่น: B-draft-01

สถานะ: **DRAFT / รอ A และ B ตรวจร่วมกัน** การแบ่ง A/B ยึด [handoff](friend-handoff.md) ไม่เปลี่ยนตามผู้เปิดไฟล์ รอบนี้เป็นเอกสารก่อน implementation ยังไม่มีฟีเจอร์ที่ implemented, tested หรือ accepted

## 1. แหล่งที่มาและวิธีอ่าน

- ขอบเขตผลิตภัณฑ์: [project brief](project-brief.md) §1-8 และ [team plan](team-plan.md) เป็นข้อเสนอของทีม
- ขอบเขตวิชา: [Group Work Specifications](../sources/group_work_specs_v1.pdf) หน้า 3-4, 8-11 โดยหัวข้อ 8 อยู่หน้า 8
- รูปแบบ inventory/traceability: [Deliverable 1](../sources/project_deliverable_1_v1.pdf) หน้า 2-4; D1 ครอบคลุม baseline ทั้งผลิตภัณฑ์ แม้ implementation รอบแรกทำเฉพาะ Sprint 1
- สถานะกลางและช่องว่าง: [traceability](traceability.md), [แผน Sprint](sprints/plan.md), [ผลตรวจ baseline ฝั่ง B](reviews/baseline-review-b.md)

ยังไม่พบ `docs/srs.md` หรือ System SDS จาก A ในชุดเริ่มต้น ดังนั้น **FR/BR/NFR ของ SRS ทุกแถวยังรอ mapping** รหัส BR-01 ถึง BR-10 ด้านล่างอ้างร่างใน project brief §4 ไม่ใช่ baseline ที่ทีมอนุมัติแล้ว รายการ F-01 ถึง F-08 คงรหัสเดิมเพื่อให้ A เชื่อม SRS ได้โดยไม่ต้องเปลี่ยนชื่อฟีเจอร์

## 2. รายการฟีเจอร์ทั้งผลิตภัณฑ์

| ID / ชื่อ | พฤติกรรมและผลลัพธ์ที่ต้องได้ตามร่าง | แหล่ง requirement ปัจจุบัน / SRS | Sprint / owner / reviewer | Dependencies | แนวทางตรวจผลที่วางแผนไว้ |
|---|---|---|---|---|---|
| F-01 Identity & access | Login/logout/current user ด้วย identity ที่ backend ตรวจได้; เก็บรหัสผ่านแบบ hash; session มี expiry/revocation; บังคับ role และ ownership ที่ทุก protected API | Brief §2, §3, §7; BR-07; FR/NFR รอ A | 1 / A / B | โครงสร้างร่วม, user/session data, seed และ test DB | Valid/invalid login, anonymous protected request, wrong role, cross-user, logout แล้ว session เดิมใช้ไม่ได้; API/DB integration และ selected UI |
| F-02 Activity templates | Manager สร้างแม่แบบอ่านหนังสือที่ระบุหน่วยและช่วงที่ถูกต้อง; Participant เรียกและเลือกแม่แบบ active; ไม่มีการเปิดข้อมูลส่วนตัวของ Participant ผ่านแม่แบบ | Brief §3-5; BR-01, BR-07; FR/NFR รอ A | 1 / B / A | F-01; shared API/error; migration ที่ A ประสาน | Unit validation; API/DB persistence; Participant สร้างแม่แบบไม่ได้; UI create→list→select; [contract](sprints/sprint-1/f02-templates.md) |
| F-03 Personal goals | Participant เลือก active template แล้วตั้งเป้าหมายรายวันและวันเริ่ม; อ่านเป้าหมายของตน; ปฏิเสธ target ผิดช่วงและ active goal ซ้ำต่อ template | Brief §3-5; BR-02, BR-03, BR-07; FR/NFR รอ A | 1 / A / B | F-01, F-02; รูปแบบ goal/date และข้อมูล target ที่ส่งต่อ F-04 | Unit bounds/date; API/DB ownership และ duplicate active goal; UI set→retrieve; contract/AC/STS รอ A |
| F-04 Daily entries & progress | บันทึกนาทีรายวันและดึงผลจากฐานข้อมูล; คำนวณ actual/target × 100 โดยเกิน 100% ได้; ปฏิเสธค่าผิดช่วง วันผิดกฎ และรายการซ้ำรวมคำขอพร้อมกัน | Brief §3-5; BR-01, BR-04 ถึง BR-07; FR/NFR รอ A | 1 / B / A | F-01, F-03; authoritative goal owner/start date/target/range; unique constraint | Unit date/progress; API/DB reload และ concurrent duplicate; anonymous/manager/cross-user rejection; UI complete journey; [contract](sprints/sprint-1/f04-entries-progress.md) |
| F-05 Goal/template lifecycle | เปลี่ยน target แบบมี effective date วันถัดไปโดยผลย้อนหลังคงเดิม; หยุด goal; ปิดใช้ template แล้วห้ามสร้าง goal ใหม่ แต่ goal เดิมยังบันทึกได้ด้วยหน่วย/ช่วงเดิม | Brief §4-5; BR-03, BR-07, BR-08, BR-10; FR/NFR รอ A | 2 / A / B | F-02, F-03, F-04; ตกลง target-version และ snapshot strategy | Unit effective-date/history; API/DB lifecycle และหลายคำขอก่อนมีผล; regression ผลย้อนหลังและ goal เดิมหลัง template inactive; contract ต้องกำหนด stop/revision rules ก่อน code |
| F-06 History & streak | Participant ดูประวัติ/กรองวันที่ แก้รายการของตนตามกฎ และคำนวณ streak ใหม่จาก target ของแต่ละวัน; ไม่เปิด history ข้ามผู้ใช้ | Brief §4-5; BR-04 ถึง BR-09; FR/NFR รอ A | 2 / B / A | F-04, F-05; แหล่ง target ตามวันที่; กฎแก้ entry/goal ที่หยุด | Unit date gaps, target versions, current streak/today-not-complete; API/DB edits และ ownership; UI edit→history→recompute; contract ต้องตกลงขอบเขตแก้ไขก่อน code |
| F-07 Schedule/reminder representation | บันทึกตารางที่ตั้งใจอ่าน/เวลาเตือนและเห็นสถานะในแอปของตน; ข้อมูลต้อง persist จริง; ไม่ต้องส่ง email/SMS/push | Brief §5-6; หัวข้อ 8 ของโจทย์; BR-07 และกฎวัน/เวลาที่ต้องร่าง; FR/NFR รอ A | 3 / A / B | F-01, F-03, F-05; timezone และผลเมื่อ goal หยุด | Unit schedule/time validation; API/DB save→reload และ ownership; UI planned schedule; contract ต้องระบุ weekday/time/stop behavior ก่อน code |
| F-08 Summary & integrated completion | แสดงสรุปรายสัปดาห์/ช่วงเวลาจากข้อมูลจริงของตน; รวม actual/target ของช่วงที่เลือกตาม target history; เก็บงาน usability/error/access และ regression ของระบบรวม | Brief §5; หัวข้อ 8 ของโจทย์; BR-05 ถึง BR-09; FR/NFR รอ A | 3 / B / A | F-04, F-05, F-06; นิยามวันใน denominator และช่วงเวลาต้องตกลง | Unit period/denominator/versioned target; API/DB summary และ ownership; UI summary ที่มีข้อมูลจริง/ช่วงว่าง; integrated regression; ห้ามใช้ hardening แทน summary |

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

ทุก F-01 ถึง F-08: **planned / ไม่ได้ implementation / tests ยังไม่รัน / ยังไม่ accepted**; F-02/F-04 มีร่าง contract ในรอบ B นี้ ส่วน F-01/F-03 รอ A ส่ง contract เพื่อ review

เมื่อ A ส่ง SRS ให้เติม FR/BR/NFR จริงลง [traceability](traceability.md), ตรวจว่าทุก baseline requirement มี feature หรือ named responsibility และ Sprint, แล้วให้ทั้งคู่บันทึกการตัดสินใจ ก่อนเลื่อนงานเป็น Ready/เริ่ม code ใช้ Issue และ branch จาก sprint staging ตาม team-plan; owner แต่ละฟีเจอร์เติมผลจริงและให้คู่ทีม review

| รุ่น / วันที่ | การเปลี่ยน | การยืนยัน |
|---|---|---|
| B-draft-01 / 3 พ.ย. 2026 | ร่าง inventory F-01 ถึง F-08 จาก brief และ PDF; แสดง dependencies, responsibilities และช่องว่าง SRS | รอ A/B; ไม่มีการอนุมัติหรือผลทดสอบในรอบนี้ |
