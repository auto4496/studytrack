# Baseline review โดยสมาชิก B

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | Revision: B-draft-01

สถานะ: DOCUMENT REVIEW / PROPOSAL — เป็นการตรวจและร่างโดย Codex ให้ B อ่าน ไม่ใช่การอนุมัติของ A, TA หรือผู้ใช้ และยังไม่ใช่ review SRS เพราะยังไม่มี SRS ในชุดนี้

## 1. สิ่งที่ตรวจพบจากโฟลเดอร์

เริ่มจากโฟลเดอร์ `C:/CPE/CPE334/Project/studytrack` ตามที่ B ระบุ เนื้อหามี README, เอกสารร่างเดิม 3 ไฟล์ และ PDF ใน sources 4 ฉบับ ไม่มี `.git`, source code, package/lockfile, Prisma schema, tests, SRS หรือ System SDS ใน snapshot นี้ ทำสำเนาแยกใน workspace เพื่อจัดทำเอกสาร ไม่ได้สร้าง repository, remote, scaffold หรือฐานข้อมูลใหม่ ชื่อ ZIP มาจาก handoff แต่ไม่ได้ตรวจไฟล์ ZIP ต้นฉบับ จึงไม่อ้าง hash/commit ของ ZIP

สมาชิก **A = เพื่อนร่วมทีมผู้เริ่มวางแผน**, **B = ผู้ใช้แชตนี้** ตามคำยืนยันของผู้ใช้ ไม่สลับตามคนเปิดไฟล์ ชื่อจริง/รหัสนักศึกษา/GitHub ยังไม่ทราบ

## 2. เอกสารที่อ่านครบและลำดับที่ใช้

| แหล่ง | หน้าที่เกี่ยวข้อง | ผลต่อร่าง B |
|---|---|---|
| [README](../../README.md), [handoff](../friend-handoff.md) §4 | อ่านครบ | ทำเอกสาร 8 ไฟล์ก่อน code; รักษา A/B และประวัติจริง |
| [Project brief](../project-brief.md), [team plan](../team-plan.md) | อ่านครบ | ขอบเขต F-01–F-08, BR-01–BR-10 และการแบ่งเจ้าของเป็นร่างทีม |
| [Group specification](../../sources/group_work_specs_v1.pdf) 15 หน้า | หน้า 3–4 architecture/auth/delivery; หน้า 8 หัวข้อ 8; หน้า 9–11 workflow; หน้า 13–15 Labs | แหล่ง master ของ scope; หน้า 1 ยังระบุ Draft for instructor review |
| [Deliverable 1](../../sources/project_deliverable_1_v1.pdf) 8 หน้า | หน้า 2–4 baseline/contracts; หน้า 5–7 working release/evidence/PDF | baseline ทั้งผลิตภัณฑ์ + Sprint 1 ทำงานจริง; เอกสารรอบนี้ยังไม่ทำให้ D1 เสร็จ |
| [Deliverable 2](../../sources/project_deliverable_2_v1.pdf) 5 หน้า | หน้า 1–3 checkpoint; หน้า 4–5 PDF/evidence | S2 complete + S3 contracts ครบและมี implemented/tested progress จริง |
| [Final delivery](../../sources/project_final_delivery_v1.pdf) 6 หน้า | หน้า 1–6 | final-version verification, independent UAT/retest, deployment และ PDF/video |

อ่าน PDF รวม 34 หน้า ไม่พบ handout Lab 5/6/7 แยกใน sources จึงใช้เฉพาะข้อกำหนด Labs ใน master และรอเอกสารฉบับจริงก่อนยืนยันรายละเอียดการส่ง Labs เอกสารนี้ใช้แหล่งที่มากับเลขหน้าจริง ไม่ใช้ร่างทีมแทนข้อกำหนดอาจารย์

## 3. สิ่งที่ยึดได้ในรอบนี้

**ตกลงจากคำสั่งผู้ใช้:** B รับ feature inventory/traceability/แผนสาม Sprint/UI/API และ F-02/F-04; A รับ SRS/data/auth/F-01/F-03; review งานข้ามกัน; รอบนี้ทำเอกสารและ contracts ก่อน implementation

**ข้อกำหนดที่พบในโจทย์:** UI → API → persistent DB; login/logout/current user และสองบทบาท; backend role/ownership; manager ไม่มีสิทธิ์อัตโนมัติในประวัติส่วนตัว; contracts ก่อน implementation; tests/evidence และ peer review จากเหตุการณ์จริง; D1 ส่ง 8 พ.ย., Lab 5 ส่ง 15 พ.ย., Lab 6 ส่ง 22 พ.ย., D2/Lab 7 ส่ง 29 พ.ย., Final ส่ง 13 ธ.ค. 2026 เวลา 23:59 Asia/Bangkok

**ยังไม่มี accepted product baseline ร่วมกัน:** การอ่านและร่างครั้งนี้ไม่แปลว่า A/B อนุมัติชื่อ StudyTrack, หัวข้อ 8, BR หรือ interface แล้ว หัวข้อ 8 ต้องตรวจเลขท้ายรหัสนักศึกษาตาม master หน้า 4 หรือขอ TA ยืนยันเมื่อจำเป็น

## 4. ข้อเสนอและคำถามต่อ project brief

| ประเด็น/แหล่งร่าง | ข้อเสนอ B สำหรับ contracts | ต้องให้ A ตอบ/ผลกระทบ |
|---|---|---|
| BR-01/02/05 นาที/ช่วง/วันที่ | คงจำนวนเต็ม 1–1440; นาทีของ entry ใช้ min/max snapshot ของ goal; date เป็น calendar date Asia/Bangkok ตาม server | ยืนยัน min/max ทั้ง target และ actual; ไม่รับ 0 หรือสะสมหลาย entry; F03 ต้องมี snapshot |
| BR-03 active goal | A บังคับหนึ่ง active goal ต่อ owner/template ที่ DB ตามแบบข้อมูลที่จะตกลง | ขอ F03 contract/constraint และ ownership lookup ก่อน F04 |
| BR-04 duplicate | ใช้ DB unique `(goalId, entryDate)`; duplicate 409 รวม concurrent requests; ไม่ overwrite/upsert | A รวบรวม migration; B ทดสอบสองคำขอพร้อมกันและตรวจหนึ่งแถว |
| BR-06 progress | คำนวณบน server จาก target ที่มีผลในวันนั้น; round 2 ตำแหน่งแบบ HALF_UP; achieved เทียบ actual >= target ก่อนปัดเศษ | ตกลง response/rounding; เกิน 100% ได้; missing entry แยกจากการบันทึก 0 |
| BR-08 target changes | เตรียม logical initial target version ใน F03; F05 เปลี่ยนมีผลวันถัดไป; F04 อ้าง version ตามวันที่ entry | ขอ A ยืนยัน model/effective date; เสนอแก้ซ้ำก่อนมีผลให้แทนเฉพาะ pending version ของวันเดียวกัน พร้อมประวัติการแก้; ยังไม่ถือเป็น contract F05 |
| BR-09 streak | F06 ต้องกำหนด missing day, today-not-complete และผลหลังแก้ entry | เสนอ current streak ยึดเมื่อวานถ้าวันนี้ยังไม่ครบ; ต้องจัดทำ contract S2 และให้ A ตรวจ |
| BR-10 template lifecycle | snapshot unit/min/max ตอนสร้าง goal; ปิดแม่แบบห้าม goal ใหม่แต่ goal เดิมเดินต่อ | ไม่แก้ unit/range ของ goal เก่าย้อนหลัง; F02 S1 มี create/list active เท่านั้น; F05 กำหนด update/deactivate |
| ชื่อแม่แบบ/validation | title trim 1–120; description trim <=1000; ชื่อซ้ำได้คนละ ID | เป็นรายละเอียดใหม่ของ B ที่รอ A; ไม่อ้างว่าเป็นกฎจาก PDF |
| API/privacy | `/api/v1`; session principal; 401 anonymous, 403 wrong role, 404 missing/unowned, 422 invalid, 409 duplicate | ตกลง [UI/API](../ui-api-conventions.md) กับ F01; ไม่มี client ownerId/role selector |
| Data/auth/shared files | A ประสาน Prisma/migrations/package/auth; B เสนอ entities/constraints แต่ยังไม่สร้างไฟล์ส่วนกลาง | ยืนยันเทคโนโลยี/เวอร์ชัน/session expiry/CSRF/origin และ test DB ก่อนลงมือ |

## 5. ข้อขัดแย้ง/ข้อมูลที่ยังไม่ทราบ

| ID สำหรับติดตามคำถามเท่านั้น | หลักฐานต้นทาง | การดำเนินการ/เจ้าของ | สถานะ |
|---|---|---|---|
| Q-01 | Final หน้า 2 สูงสุด 10 นาที แต่หน้า 4 สูงสุด 4 นาที | ทั้งคู่ขอ TA ยืนยัน; ระหว่างรอวางแผน <=4 นาทีเพื่อเผื่อเวลา ยังไม่ใช่ข้อยุติ | OPEN |
| Q-02 | Master หน้า 13 video 8 + release summary 2 คะแนน; Final หน้า 1/4 video 10 คะแนน | ทั้งคู่ถาม rubric ที่ใช้; เผื่อ release summary <=1 หน้า | OPEN |
| Q-03 | ประเด็นชี้แจงรูปแบบส่ง: Master หน้า 13/15 เรียก PDF concise evidence index; D1 หน้า 5–7, D2 หน้า 4, Final หน้า 3/5 ให้รวมเอกสารฉบับเต็ม; ทำสองอย่างร่วมกันได้ | ใช้ self-contained PDF ตาม handout ของ assessment พร้อม navigation; ขอ TA ชี้แจงหากทีมยังไม่แน่ใจ | OPEN |
| Q-04 | Master หน้า 1 ระบุ Draft for instructor review; sources ไม่มี handout Labs แยก | ขอ A ตรวจฉบับล่าสุดกับรายวิชา/TA; รักษาแหล่งและ revision ไม่เขียนทับ | OPEN |
| Q-05 | ยังไม่มี SRS/ER/System SDS, repo/board, ชื่อ/รหัส/GitHub | A ส่ง baseline และ repo จริง; B ตรวจ FR/BR/NFR ทีละข้อแล้วเติม mapping | OPEN / บล็อกความพร้อม implementation |

Q-01–Q-05 เป็นรหัสคำถามในรอบนี้ ไม่ใช่ requirement IDs หรือ Issues บน GitHub

## 6. สิ่งที่ขอเพิ่มใน SRS/System SDS ของ A

ขอ stable FR/BR/NFR ของทั้ง F-01–F-08 พร้อม measurable target/วิธีตรวจของ NFR; owner/role matrix; goal/template snapshot และ target version lookup; DB constraints/FK และ transaction rules; session expiry/revocation/logout/current user/CSRF; environment variables, seed accounts manager + Participant สองคน และ test DB แยก; local setup และ deployment/durable-storage plan

B จะตรวจ SRS ของ A โดยเทียบ scope/exclusions กับ master หัวข้อ 8, ทุก FR/BR/NFR มี feature/sprint, วันที่/หน่วย/duplicate/history ไม่ขัดกัน, manager ไม่มีสิทธิ์ข้อมูลส่วนตัว และ NFR ตรวจวัดได้ ขณะนี้ยังไม่มี SRS จึงไม่ได้อ้างว่าตรวจหรือยอมรับแล้ว

## 7. ประวัติและการตรวจโดยคน

| Revision | วันที่ | ผู้ช่วยจัดทำ | สิ่งที่เปลี่ยน | การอนุมัติ |
|---|---|---|---|---|
| B-draft-01 | 3 พ.ย. 2026 | Codex ตามคำสั่ง B | ตรวจ snapshot/แหล่งโจทย์ครบ แยกข้อเสนอและคำถามก่อน code | รอ B อ่านและ A review; ยังไม่มี TA ตอบ |

ไม่รัน application tests เพราะยังไม่มีแอป ไม่มี commit/PR/review/UAT จริงในรอบนี้ ดูรายการไฟล์และงานต่อใน [สถานะส่งกลับ A](../handoffs/member-b-status.md)

## Updated review from central source — 3 November 2026

User authorized B implementation. Read A SRS/System SDS/integration/F01/F03 contracts and implementation handoff at2370df9. Adopt source SRS IDs and A's actual /api, MINUTES, title100/description500, UUID, startDate, DTO/envelope/pagination and cookie/CSRF. B draft01 API differences reconciled in v0.2 before code; do not create auth/schema scaffold again. F04 follows SRS BR11 for historical archived bounds rather than draft01 active-only behavior. PR3 still pending human review; this document is specific AI-assisted interface/source review, not approval submitted as A/B on GitHub. No full code-security approval implied
