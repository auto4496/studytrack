# Requirements → features → sprint → verification — B v0.2

3 November 2026. Source [SRS](srs.md) from A PR3; all19 FR/13 BR/8 NFR mapped below without inventing new IDs. A local artifacts are source evidence only, not B-run or CI PASS. Future contracts remain planned; no silent scope deletion. B F02/F04 stable AC/test IDs in their contracts; actual names/results/source commits recorded in [B verification](verification/member-b.md) after execution

## Functional baseline mapping

| SRS ID | Requirement (A source) | Feature/sprint or method | Planned verification | Execution status |
|---|---|---|---|---|
| FR-01 | ผู้ใช้ login ด้วย account/password ที่ถูกต้อง แล้วได้รับ session ใหม่; ข้อมูลผิดไม่สร้าง authenticated session | F-01 / 1 | F01 AC/STS + endpoint regression; A recorded results not independently rerun yet | Planned / no B execution yet |
| FR-02 | ผู้ใช้ logout แล้ว session ที่ใช้ logout ไม่สามารถเรียก protected API ได้อีก | F-01 / 1 | F01 AC/STS + endpoint regression; A recorded results not independently rerun yet | Planned / no B execution yet |
| FR-03 | ผู้ใช้เรียกดูตัวตน/บทบาทปัจจุบันได้; anonymous/expired session ไม่ได้รับข้อมูลผู้ใช้ | F-01 / 1 | F01 AC/STS + endpoint regression; A recorded results not independently rerun yet | Planned / no B execution yet |
| FR-04 | API ตรวจ authenticated identity, role และ ownership; ผู้ดูแลไม่มีสิทธิ์ในข้อมูลส่วนตัวเพียงเพราะเป็นผู้ดูแล | F-01 + every protected feature / 1–3 | F01 AC/STS + endpoint regression; A recorded results not independently rerun yet | Planned / no B execution yet |
| FR-05 | Manager สร้างแม่แบบพร้อมชื่อ หน่วยนาที และช่วงค่าที่ถูกต้องได้ | F-02 / 1 | AC-F02-01..09 / TEST-F02-01..11 | Planned / no B execution yet |
| FR-06 | Participant เห็นรายการ/รายละเอียดแม่แบบ active เพื่อเลือกใช้ได้; Manager เห็นแม่แบบที่ตนจัดการรวม inactive ได้ | F-02 / 1 | AC-F02-01..09 / TEST-F02-01..11 | Planned / no B execution yet |
| FR-07 | Participant สร้างเป้าหมายจาก active template พร้อม daily target และ start date ตามกฎได้ | F-03 / 1 | F03 AC/STS; A recorded results, B regression planned | Planned / no B execution yet |
| FR-08 | Participant เรียกดูรายการและรายละเอียดเป้าหมายของตนหลังบันทึกได้ | F-03 / 1 | F03 AC/STS; A recorded results, B regression planned | Planned / no B execution yet |
| FR-09 | Participant เปลี่ยน daily target โดยมีผลวันถัดไปและคงประวัติ target เดิมได้ | F-05 / 2 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| FR-10 | Participant หยุดเป้าหมายได้ และ Manager ปิดใช้/ปรับ metadata แม่แบบได้ โดยไม่ทำลายประวัติเดิม | F-05 / 2 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| FR-11 | Participant บันทึกจำนวนเต็มนาทีหนึ่งรายการต่อ goal/date และเรียกผลที่บันทึกแล้วได้ | F-04 / 1 | AC-F04-01..12 / TEST-F04-01..16 | Planned / no B execution yet |
| FR-12 | ระบบแสดง actual, target, progress percentage และ achieved ของ goal/date จากข้อมูลจริงได้ | F-04 / 1 | AC-F04-01..12 / TEST-F04-01..16 | Planned / no B execution yet |
| FR-13 | Participant ดูประวัติของตนและกรองตาม goal/ช่วงวันที่ได้ | F-06 / 2 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| FR-14 | Participant แก้จำนวนนาทีของรายการเดิมตามกฎ แล้วผล progress/history/streak สอดคล้องกัน | F-06 / 2 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| FR-15 | ระบบคำนวณ current/best streak ของเป้าหมายตามวันและ target ที่มีผลในวันนั้น | F-06 / 2 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| FR-16 | Participant กำหนดวันในสัปดาห์/เวลาที่ตั้งใจอ่านสำหรับเป้าหมายของตนได้ | F-07 / 3 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| FR-17 | ระบบแสดงกำหนดการและสถานะเตือนภายในแอปตาม Asia/Bangkok โดยไม่ต้องส่ง notification ภายนอก | F-07 / 3 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| FR-18 | Participant ดูยอดนาที จำนวนวันที่บรรลุ และสรุปตามช่วงเวลาของตน โดยไม่ปะปนกับผู้ใช้อื่น | F-08 / 3 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| FR-19 | UI แสดง loading, empty, validation, forbidden/session-expired และ server-error states พร้อมทางแก้ไข/ลองใหม่ที่เหมาะสม | F-01–F-08 / 1–3 | F01..04 selected browser/UI states; S2/3 extend | Planned / no B execution yet |

## Business baseline mapping

| SRS ID | Requirement (A source) | Feature/sprint or method | Planned verification | Execution status |
|---|---|---|---|---|
| BR-01 | unit = MINUTES; template min/max เป็น integer ภายใน 1..1440 และ min <= max; title trim แล้ว 1..100 ตัวอักษร description ไม่เกิน 500 | F-02 / 1 | F02 validation/role/catalog + F03/F04 snapshot regression; S2 lifecycle planned | Planned / no B execution yet |
| BR-02 | dailyTargetMinutes เป็น integer ในช่วง template; startDate เป็น today หรือ tomorrow ณ Asia/Bangkok; snapshot unit/range ณ ตอนสร้าง | F-03 / 1 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| BR-03 | หนึ่ง Participant มี goal สถานะ ACTIVE ต่อ template ได้ไม่เกินหนึ่ง แม้เป็น future-start; concurrent creation ต้องได้ ACTIVE แค่หนึ่งรายการ | F-03 / 1 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| BR-04 | unique(goalId, entryDate); duplicate รวม concurrent request ต้องปฏิเสธ 409 โดยไม่มีแถวซ้ำ | F-04 / 1 | F04 STS date/range/duplicate/ratio/version/archived bounds; S2 extends where applicable | Planned / no B execution yet |
| BR-05 | entryDate เป็น local date จริง YYYY-MM-DD ตั้งแต่ startDate ถึง today; minutes เป็น integer ในช่วง snapshot ของ goal ไม่ใช้ช่วงแม่แบบที่เปลี่ยนภายหลัง | F-04 / 1 | F04 STS date/range/duplicate/ratio/version/archived bounds; S2 extends where applicable | Planned / no B execution yet |
| BR-06 | progress = actual/target × 100, round 2 decimals, ไม่ cap ที่ 100; achieved เมื่อ actual >= target; วันที่ยังไม่มี entry มี actual=0, achieved=false | F-04 / 1 | F04 STS date/range/duplicate/ratio/version/archived bounds; S2 extends where applicable | Planned / no B execution yet |
| BR-07 | userId/ownerId/role มาจาก server identity ไม่รับจาก mutation payload; Manager ถูก 403 ที่ participant APIs; Participant ข้ามเจ้าของได้ 404 โดยไม่เปิดเผยว่ามี record หรือไม่ | F-01–F-08 / 1–3 | F02 validation/role/catalog + F03/F04 snapshot regression; S2 lifecycle planned | Planned / no B execution yet |
| BR-08 | target revision มีผล tomorrow; target ของอดีตคงเดิม; การแก้ซ้ำก่อนมีผลปรับ pending version ของวันเดียวกันแทนเพิ่ม effective date ซ้ำ | F-05 / 2 | F04 STS date/range/duplicate/ratio/version/archived bounds; S2 extends where applicable | Planned / no B execution yet |
| BR-09 | streak ใช้ consecutive local dates ที่ actual >= target ของวันนั้น; ถ้าวันนี้ยังไม่ครบ อนุญาต current streak จบที่ yesterday; ถ้าวันนี้ครบให้นับถึง today; best streak นับตลอดประวัติ | F-06 / 2 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| BR-10 | inactive template ห้ามสร้าง goal ใหม่ แต่ goal เดิมใช้ snapshot และบันทึกต่อได้; ไม่แก้ unit/min/max ของ template เดิมที่ถูกใช้แล้ว ให้สร้าง template ใหม่หากเปลี่ยนช่วง | F-05 / 2 | F02 validation/role/catalog + F03/F04 snapshot regression; S2 lifecycle planned | Planned / no B execution yet |
| BR-11 | goal ที่หยุดเก็บ endDate และประวัติไว้; อนุญาต entry/correction เฉพาะ startDate..min(endDate,today); สถานะ ARCHIVED ไม่เปิดใหม่ ให้สร้าง goal ใหม่และแยกประวัติ | F-05/F-06 / 2 | F04 STS date/range/duplicate/ratio/version/archived bounds; S2 extends where applicable | Planned / no B execution yet |
| BR-12 | history/summary ใช้ช่วงวันที่รวมปลายทั้งสองด้าน; from <= to; จำนวนวันบรรลุนับแต่ละ local date เพียงครั้งเดียวในภาพรวมผู้ใช้ ไม่ใช่จำนวน entry | F-06/F-08 / 2–3 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |
| BR-13 | schedule ใช้ weekday 1=Monday..7=Sunday ไม่ซ้ำและเวลา HH:mm; แสดงตาม Asia/Bangkok; ไม่อนุมานว่าอ่านแล้วจากตารางเพียงอย่างเดียว | F-07 / 3 | Feature contract before code; later-sprint AC/test elaboration pending | Planned / no B execution yet |

## Non-functional baseline mapping

| SRS ID | Requirement (A source) | Feature/sprint or method | Planned verification | Execution status |
|---|---|---|---|---|
| NFR-01 | ทุก protected endpoint ที่อยู่ใน release ปฏิเสธ anonymous 401; wrong role 403; cross-owner private record 404 และไม่คืน private fields | API access matrix ครบ endpoint ที่เพิ่มในแต่ละ Sprint | Verification target as SRS; B unit/API/browser/build/restart as applicable; CI/GCP/UAT pending | Planned / no B execution yet |
| NFR-02 | password เก็บ Argon2id hash พร้อม salt; session ID อยู่ใน HttpOnly cookie, Secure บน HTTPS, SameSite=Lax; expired/revoked token ใช้ไม่ได้; unsafe authenticated request ที่ CSRF ผิดถูก 403 | DB/config inspection + auth/security integration ใน Sprint 1; recheck final | Verification target as SRS; B unit/API/browser/build/restart as applicable; CI/GCP/UAT pending | Planned / no B execution yet |
| NFR-03 | ข้อมูล template/goal/entry ที่ยอมรับแล้วเรียกกลับได้หลัง process restart; บน GCP ยังเรียกได้หลัง expected redeployment | actual persisted retrieval Sprint 1; restart/redeploy evidence Lab 5 และ final | Verification target as SRS; B unit/API/browser/build/restart as applicable; CI/GCP/UAT pending | Planned / no B execution yet |
| NFR-04 | fresh checkout ที่มี documented prerequisites สามารถ setup/migrate/seed/build/run/test ตาม README ได้โดยไม่แก้ source; demo seed rerun ไม่สร้างบัญชีซ้ำ | คู่ทีมลอง fresh setup Sprint 1 และ final พร้อม commands/version | Verification target as SRS; B unit/API/browser/build/restart as applicable; CI/GCP/UAT pending | Planned / no B execution yet |
| NFR-05 | แต่ละ released AC มี actual verification reference/result/version; required tests เปิดใช้และ failures ไม่ถูกซ่อน; Lab 5 เป็นต้นไป required CI failure บล็อก normal release path | traceability/results + controlled failed check Lab 5; final regression | Verification target as SRS; B unit/API/browser/build/restart as applicable; CI/GCP/UAT pending | Planned / no B execution yet |
| NFR-06 | critical Sprint 1 screens ใช้ได้ที่ viewport 390×844 และ 1440×900 โดยไม่มี horizontal page overflow; form ใช้ keyboard/labels และแสดง field errors ได้ | selected E2E/manual checks Sprint 1; เพิ่ม journeys ตาม scope และ final | Verification target as SRS; B unit/API/browser/build/restart as applicable; CI/GCP/UAT pending | Planned / no B execution yet |
| NFR-07 | repository/report/logs ไม่บันทึก real secrets, plaintext password หรือ session/CSRF tokens; config ใช้ env examples ที่เป็น placeholders | diff/config/log inspection ทุก release | Verification target as SRS; B unit/API/browser/build/restart as applicable; CI/GCP/UAT pending | Planned / no B execution yet |
| NFR-08 | local-date validation/progress ใช้ clock/timezone เดียวกัน; test ที่กำหนด clock ตรวจ 23:59/00:00 Bangkok, invalid dates, month/year transitions ให้ได้ expected results | unit + API cases Sprint 1; streak/summary extension S2/3 | Verification target as SRS; B unit/API/browser/build/restart as applicable; CI/GCP/UAT pending | Planned / no B execution yet |

## B execution ledger

Planned F02 TEST01–11/AC01–09 and F04 TEST01–16/AC01–12. At this pre-implementation commit: NOT RUN, no actual test counts/results. Unit/API/browser files will include these IDs, and verification/member-b.md will record actual commands/output/source SHA, red/green and coverage gaps. A verification has separate ownership. CI/deployment/UAT not executed by B
