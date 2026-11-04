# StudyTrack — Software Requirements Specification

Version: 0.1 — member A draft, 3 November 2026 (Asia/Bangkok)

สถานะ ณ baseline v0.1: requirements ที่เสนอเพื่อพัฒนาร่วมกันก่อน implementation. อัปเดต 3 พฤศจิกายน: F-01/F-03 ฝั่ง A มี implementation/local verification แล้ว แต่ยังไม่มี teammate acceptance หรือ accepted product release ดู [ผลปัจจุบันและข้อจำกัด](verification/member-a.md). เอกสารนี้เป็นรายละเอียดต่อจาก [project brief](project-brief.md); การตัดสินใจของทีมแยกจากข้อกำหนดรายวิชาใน [decision log](decisions.md)

## 1. Purpose and context

นักศึกษาต้องการตั้งเป้าหมายอ่านหนังสือเป็นนาทีต่อวัน บันทึกสิ่งที่ทำจริง และดูความคืบหน้า/ประวัติ ผู้ดูแลจัดเตรียมแม่แบบกิจกรรม โดยไม่มีสิทธิ์อ่านข้อมูลส่วนตัวของนักศึกษา ระบบเป็นหัวข้อ 8 Habit and Activity Tracking System และใช้ UI → API/application → PostgreSQL จริง

สมาชิก A ทำ F-01/F-03 และ system/data/auth foundation สมาชิก B ทำ F-02/F-04 และ feature mapping/UI-API conventions ทั้งคู่ review อีกคนและร่วม integration/release ดู [team plan](team-plan.md)

## 2. Actors

| Actor | Responsibility | Private data access |
|---|---|---|
| Participant | เลือกแม่แบบ ตั้งเป้าหมาย บันทึก/แก้กิจกรรม ดูตารางและสรุปของตน | ของตนเท่านั้น |
| Program Manager | สร้าง/จัดการแม่แบบกิจกรรมส่วนกลาง | ไม่มีสิทธิ์ใน goals/entries/summaries ของ Participant |
| Anonymous visitor | เข้าหน้า login และเริ่ม authentication | ไม่มี |

หนึ่งบัญชีมีหนึ่งบทบาท ใช้ seeded synthetic accounts อย่างน้อย Participant สองคนและ Manager หนึ่งคน

## 3. Product scope and exclusions

รวม authentication, templates, personal goals, daily entries/progress, goal revisions, activity history/corrections/streak, schedule/reminder representation และ summaries โดยกระจายครบสาม Sprint

ไม่รวม social sharing, leaderboard, AI advice, health advice, file upload, external notification delivery หรือ external integrations การสมัครสมาชิกเอง/ลืมรหัสผ่าน/ยืนยันอีเมลไม่อยู่ใน baseline รุ่นนี้ ใช้ in-app reminder representation และ seeded accounts แทน

## 4. Functional requirements

ทุกข้อด้านล่างเป็น allocation ที่ PLANNED ณ ตอนเขียน baseline ผลจริงของ A increment อยู่ใน verification record ส่วน B จัดทำ full product traceability ต่อโดยไม่ถือว่า A pass หมายถึงทั้งผลิตภัณฑ์เสร็จ รหัสไม่เปลี่ยนเมื่อย้ายข้อความ/จัดหน้า

| ID | Observable requirement | Feature / sprint |
|---|---|---|
| FR-01 | ผู้ใช้ login ด้วย account/password ที่ถูกต้อง แล้วได้รับ session ใหม่; ข้อมูลผิดไม่สร้าง authenticated session | F-01 / 1 |
| FR-02 | ผู้ใช้ logout แล้ว session ที่ใช้ logout ไม่สามารถเรียก protected API ได้อีก | F-01 / 1 |
| FR-03 | ผู้ใช้เรียกดูตัวตน/บทบาทปัจจุบันได้; anonymous/expired session ไม่ได้รับข้อมูลผู้ใช้ | F-01 / 1 |
| FR-04 | API ตรวจ authenticated identity, role และ ownership; ผู้ดูแลไม่มีสิทธิ์ในข้อมูลส่วนตัวเพียงเพราะเป็นผู้ดูแล | F-01 + every protected feature / 1–3 |
| FR-05 | Manager สร้างแม่แบบพร้อมชื่อ หน่วยนาที และช่วงค่าที่ถูกต้องได้ | F-02 / 1 |
| FR-06 | Participant เห็นรายการ/รายละเอียดแม่แบบ active เพื่อเลือกใช้ได้; Manager เห็นแม่แบบที่ตนจัดการรวม inactive ได้ | F-02 / 1 |
| FR-07 | Participant สร้างเป้าหมายจาก active template พร้อม daily target และ start date ตามกฎได้ | F-03 / 1 |
| FR-08 | Participant เรียกดูรายการและรายละเอียดเป้าหมายของตนหลังบันทึกได้ | F-03 / 1 |
| FR-09 | Participant เปลี่ยน daily target โดยมีผลวันถัดไปและคงประวัติ target เดิมได้ | F-05 / 2 |
| FR-10 | Participant หยุดเป้าหมายได้ และ Manager ปิดใช้/ปรับ metadata แม่แบบได้ โดยไม่ทำลายประวัติเดิม | F-05 / 2 |
| FR-11 | Participant บันทึกจำนวนเต็มนาทีหนึ่งรายการต่อ goal/date และเรียกผลที่บันทึกแล้วได้ | F-04 / 1 |
| FR-12 | ระบบแสดง actual, target, progress percentage และ achieved ของ goal/date จากข้อมูลจริงได้ | F-04 / 1 |
| FR-13 | Participant ดูประวัติของตนและกรองตาม goal/ช่วงวันที่ได้ | F-06 / 2 |
| FR-14 | Participant แก้จำนวนนาทีของรายการเดิมตามกฎ แล้วผล progress/history/streak สอดคล้องกัน | F-06 / 2 |
| FR-15 | ระบบคำนวณ current/best streak ของเป้าหมายตามวันและ target ที่มีผลในวันนั้น | F-06 / 2 |
| FR-16 | Participant กำหนดวันในสัปดาห์/เวลาที่ตั้งใจอ่านสำหรับเป้าหมายของตนได้ | F-07 / 3 |
| FR-17 | ระบบแสดงกำหนดการและสถานะเตือนภายในแอปตาม Asia/Bangkok โดยไม่ต้องส่ง notification ภายนอก | F-07 / 3 |
| FR-18 | Participant ดูยอดนาที จำนวนวันที่บรรลุ และสรุปตามช่วงเวลาของตน โดยไม่ปะปนกับผู้ใช้อื่น | F-08 / 3 |
| FR-19 | UI แสดง loading, empty, validation, forbidden/session-expired และ server-error states พร้อมทางแก้ไข/ลองใหม่ที่เหมาะสม | F-01–F-08 / 1–3 |

## 5. Business rules

BR-01 ถึง BR-10 รักษาความหมายจาก project brief รายละเอียดด้านล่างเป็นข้อเสนอที่ใช้เป็นจุดตั้งต้น contracts การเปลี่ยนต้องบันทึกเหตุผลและผลกระทบ ไม่ลบ requirement เดิมเงียบ ๆ

| ID | Rule and boundary | Feature / sprint |
|---|---|---|
| BR-01 | unit = MINUTES; template min/max เป็น integer ภายใน 1..1440 และ min <= max; title trim แล้ว 1..100 ตัวอักษร description ไม่เกิน 500 | F-02 / 1 |
| BR-02 | dailyTargetMinutes เป็น integer ในช่วง template; startDate เป็น today หรือ tomorrow ณ Asia/Bangkok; snapshot unit/range ณ ตอนสร้าง | F-03 / 1 |
| BR-03 | หนึ่ง Participant มี goal สถานะ ACTIVE ต่อ template ได้ไม่เกินหนึ่ง แม้เป็น future-start; concurrent creation ต้องได้ ACTIVE แค่หนึ่งรายการ | F-03 / 1 |
| BR-04 | unique(goalId, entryDate); duplicate รวม concurrent request ต้องปฏิเสธ 409 โดยไม่มีแถวซ้ำ | F-04 / 1 |
| BR-05 | entryDate เป็น local date จริง YYYY-MM-DD ตั้งแต่ startDate ถึง today; minutes เป็น integer ในช่วง snapshot ของ goal ไม่ใช้ช่วงแม่แบบที่เปลี่ยนภายหลัง | F-04 / 1 |
| BR-06 | progress = actual/target × 100, round 2 decimals, ไม่ cap ที่ 100; achieved เมื่อ actual >= target; วันที่ยังไม่มี entry มี actual=0, achieved=false | F-04 / 1 |
| BR-07 | userId/ownerId/role มาจาก server identity ไม่รับจาก mutation payload; Manager ถูก 403 ที่ participant APIs; Participant ข้ามเจ้าของได้ 404 โดยไม่เปิดเผยว่ามี record หรือไม่ | F-01–F-08 / 1–3 |
| BR-08 | target revision มีผล tomorrow; target ของอดีตคงเดิม; การแก้ซ้ำก่อนมีผลปรับ pending version ของวันเดียวกันแทนเพิ่ม effective date ซ้ำ | F-05 / 2 |
| BR-09 | streak ใช้ consecutive local dates ที่ actual >= target ของวันนั้น; ถ้าวันนี้ยังไม่ครบ อนุญาต current streak จบที่ yesterday; ถ้าวันนี้ครบให้นับถึง today; best streak นับตลอดประวัติ | F-06 / 2 |
| BR-10 | inactive template ห้ามสร้าง goal ใหม่ แต่ goal เดิมใช้ snapshot และบันทึกต่อได้; ไม่แก้ unit/min/max ของ template เดิมที่ถูกใช้แล้ว ให้สร้าง template ใหม่หากเปลี่ยนช่วง | F-05 / 2 |
| BR-11 | goal ที่หยุดเก็บ endDate และประวัติไว้; อนุญาต entry/correction เฉพาะ startDate..min(endDate,today); สถานะ ARCHIVED ไม่เปิดใหม่ ให้สร้าง goal ใหม่และแยกประวัติ | F-05/F-06 / 2 |
| BR-12 | history/summary ใช้ช่วงวันที่รวมปลายทั้งสองด้าน; from <= to; จำนวนวันบรรลุนับแต่ละ local date เพียงครั้งเดียวในภาพรวมผู้ใช้ ไม่ใช่จำนวน entry | F-06/F-08 / 2–3 |
| BR-13 | schedule ใช้ weekday 1=Monday..7=Sunday ไม่ซ้ำและเวลา HH:mm; แสดงตาม Asia/Bangkok; ไม่อนุมานว่าอ่านแล้วจากตารางเพียงอย่างเดียว | F-07 / 3 |

รายละเอียด FR-10 endDate/time และกรณี schedule ที่ไม่ทุกวันต้องระบุใน contracts Sprint 2/3 ก่อน code โดย BR-09 ยังคงเป็น streak ของทุกวัน ไม่ใช่เฉพาะ scheduled days ข้อกำหนด summary ต้องแยก total minutes/goal achieved days/user achieved days ให้ชัด

## 6. Measurable non-functional requirements

| ID | Target | Planned verification / checkpoint |
|---|---|---|
| NFR-01 | ทุก protected endpoint ที่อยู่ใน release ปฏิเสธ anonymous 401; wrong role 403; cross-owner private record 404 และไม่คืน private fields | API access matrix ครบ endpoint ที่เพิ่มในแต่ละ Sprint |
| NFR-02 | password เก็บ Argon2id hash พร้อม salt; session ID อยู่ใน HttpOnly cookie, Secure บน HTTPS, SameSite=Lax; expired/revoked token ใช้ไม่ได้; unsafe authenticated request ที่ CSRF ผิดถูก 403 | DB/config inspection + auth/security integration ใน Sprint 1; recheck final |
| NFR-03 | ข้อมูล template/goal/entry ที่ยอมรับแล้วเรียกกลับได้หลัง process restart; บน GCP ยังเรียกได้หลัง expected redeployment | actual persisted retrieval Sprint 1; restart/redeploy evidence Lab 5 และ final |
| NFR-04 | fresh checkout ที่มี documented prerequisites สามารถ setup/migrate/seed/build/run/test ตาม README ได้โดยไม่แก้ source; demo seed rerun ไม่สร้างบัญชีซ้ำ | คู่ทีมลอง fresh setup Sprint 1 และ final พร้อม commands/version |
| NFR-05 | แต่ละ released AC มี actual verification reference/result/version; required tests เปิดใช้และ failures ไม่ถูกซ่อน; Lab 5 เป็นต้นไป required CI failure บล็อก normal release path | traceability/results + controlled failed check Lab 5; final regression |
| NFR-06 | critical Sprint 1 screens ใช้ได้ที่ viewport 390×844 และ 1440×900 โดยไม่มี horizontal page overflow; form ใช้ keyboard/labels และแสดง field errors ได้ | selected E2E/manual checks Sprint 1; เพิ่ม journeys ตาม scope และ final |
| NFR-07 | repository/report/logs ไม่บันทึก real secrets, plaintext password หรือ session/CSRF tokens; config ใช้ env examples ที่เป็น placeholders | diff/config/log inspection ทุก release |
| NFR-08 | local-date validation/progress ใช้ clock/timezone เดียวกัน; test ที่กำหนด clock ตรวจ 23:59/00:00 Bangkok, invalid dates, month/year transitions ให้ได้ expected results | unit + API cases Sprint 1; streak/summary extension S2/3 |

ผลจริงเฉพาะ A increment ดู verification record ข้อที่ยังรอ B/CI/GCP/UAT ยังคง incomplete ไม่ได้กำหนด arbitrary performance SLA ที่ทีมไม่ได้วัด

## 7. Assumptions and constraints

- ผู้ใช้และข้อมูลเป็นข้อมูลสังเคราะห์ บัญชีเข้าถึงมอบผ่าน local seed/private handoff ไม่ใส่รหัสผ่านจริงใน PDF/Git
- timezone รุ่นนี้คงที่ Asia/Bangkok; display timestamps แปลงให้ผู้ใช้ แต่ activity date เก็บเป็น DATE
- ใช้ modular monolith และ same-origin UI/API; stack จากประสบการณ์ TokTickIT แต่เป็น repo/database ใหม่
- สมาชิกสองคนและ repo เดียวต่อเนื่องสาม Sprint; ไม่แบ่ง learning outcome แบบถาวร
- D1: 8 Nov, Lab5: 15 Nov, Lab6: 22 Nov, D2/Lab7: 29 Nov, Final: 13 Dec; ทุกวัน 23:59 Asia/Bangkok
- baseline changes ต้องมี rationale/impact/version และ approval จาก TA เมื่อเป็นการเปลี่ยน scope ที่โจทย์กำหนด

## 8. Traceability and acceptance status

ตาราง FR/BR/NFR ข้างต้นเป็น allocation ฝั่ง A ให้ B ใช้ร่าง `features.md`, `traceability.md` และ sprint plan โดยคง IDs ที่นี่ การเสนอเปลี่ยน ID/กฎทำผ่าน review ก่อนรวม

F-01 และ F-03 มี contracts ฝั่ง A อยู่ใน `docs/sprints/sprint-1/` F-02/F-04 เป็นงาน B ต้องเติม contracts/AC/STS ของตนและ actual results เมื่อเกิดขึ้นจริง ยังไม่มี requirement ใดถูกประกาศ accepted
