# F-02 Activity templates - Engineering contract

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | revision: 0.1 | ผู้ร่าง: สมาชิก B | ผู้ review ที่ต้องการ: สมาชิก A

สถานะ: **DRAFT / รอ A ตรวจและตกลง interface** ยังไม่ใช่ accepted baseline ยังไม่มี implementation, executable tests, migration, Issue, branch, PR หรือผลทดสอบของฟีเจอร์นี้

## 1. ที่มา ขอบเขต และ linked requirements

- [Project brief](../../project-brief.md) หัวข้อ 2-5: manager สร้างแม่แบบ; participant ดูแม่แบบ active แล้วเลือกไปสร้าง goal; BR-01 และ BR-07 เป็น **รหัสข้อเสนอใน brief** ไม่ใช่ SRS ที่ยืนยันแล้ว ส่วน BR-10 เป็นข้อพิจารณาออกแบบเพื่อรองรับ F-05 ใน Sprint 2
- [Master specification](../../../sources/group_work_specs_v1.pdf) หน้า 8 หัวข้อ 8 และหน้า 10-11: workflow ของ Theme 8, privacy, contract/test/review ก่อนรวมงาน
- [Deliverable 1](../../../sources/project_deliverable_1_v1.pdf) หน้า 3-5: UI/API/data, feature SDS, AC, STS, DoD และ persistence/access verification
- [UI/API conventions](../../ui-api-conventions.md) เป็นข้อเสนอร่วมที่ต้องตกลงกับ foundation ของ A; [traceability](../../traceability.md) รอเติม SRS mapping

**Linked SRS FR/BR/NFR IDs: รอ SRS จาก A** ต้องแทนช่องรอด้วย IDs จริงและตรวจ coverage ก่อนเริ่ม implementation โดยยังเก็บที่มาจาก brief ไว้ ไม่คัดลอก IDs ตัวอย่างใน PDF มาอ้างเป็น requirements ของทีม

Sprint 1 ครอบคลุมการสร้างแม่แบบและเรียกดูรายการ active ผ่าน UI -> API -> PostgreSQL เท่านั้น การแก้ไข/ปิดใช้แม่แบบเป็นงาน F-05 ซึ่งต้องมี contract ของตนก่อน code; นโยบายลบยังไม่ได้เสนอหรือจัดสรรเป็นฟีเจอร์ ไม่มีการเปิดดู participant, goal หรือประวัติส่วนตัวผ่านฟีเจอร์นี้

## 2. Feature SDS และ dependencies

1. Manager login ผ่าน F-01 และเปิดหน้าแม่แบบ กรอกชื่อ คำอธิบาย หน่วยนาที และ min/max
2. UI ตรวจรูปแบบเบื้องต้นแล้วส่งคำขอพร้อม session cookie และ CSRF token
3. API ตรวจ transport, authentication, role, CSRF และข้อมูล จากนั้นสร้างแม่แบบในฐานข้อมูลโดยกำหนดเจ้าของผู้สร้าง/สถานะ/เวลาเอง
4. UI แสดงผลที่ API บันทึกสำเร็จ เมื่อโหลดรายการใหม่ต้องพบข้อมูลเดิมจากฐานข้อมูล
5. Participant login แล้วเรียกรายการ active เลือกแม่แบบเพื่อส่งต่อให้หน้าสร้าง goal ของ F-03; F-03 ต้องตรวจสถานะและช่วงค่าจากฐานข้อมูลซ้ำตอนสร้าง goal

| Dependency / interface ที่เสนอ | ผู้ประสาน | สิ่งที่ต้องพร้อมก่อนเริ่ม code |
|---|---|---|
| F-01 current user/session | A | principal จาก server มี `id` และ `role` (`PARTICIPANT` / `PROGRAM_MANAGER`); 401 เมื่อไม่มี/หมดอายุ/revoked session |
| F-01 CSRF/error middleware | A; B review | แนวทาง `X-CSRF-Token` จาก `GET /api/v1/auth/csrf`, cookie/origin settings และ error envelope ต้องตกลงใน System SDS |
| Shared data/setup/test harness | A; B เสนอข้อมูล | model, FK ไป user, constraints, migrations, test database แยก และ seed manager/P1/P2; A รวมการเปลี่ยน schema |
| F-03 template consumption | A; B review | ใช้ template ID แบบ opaque; recheck active และ snapshot หน่วย/min/max ขณะสร้าง goal; ไม่ใช้ค่าที่ frontend ส่งเป็น authoritative range |
| Shared UI router/layout | B; A review | route หน้าแม่แบบและหน้าสร้าง goal พร้อม guard จาก current user; ซ่อนปุ่มไม่ได้แทน backend permission |

P1/P2 คือบัญชี Participant สังเคราะห์สองคนสำหรับทดสอบ ownership ไม่ใช่ชื่อสมาชิกทีม A/B

## 3. กฎและ data design ที่เสนอ

| ข้อมูล | Validation / ข้อกำหนด |
|---|---|
| `title` | string; trim ก่อนตรวจ; ความยาว 1-120 อักขระหลัง trim; ห้ามว่าง |
| `description` | optional string; trim; ยาวไม่เกิน 1000 อักขระ; ไม่ส่งให้ใช้ `""` |
| `unit` | ต้องเป็น literal `"minute"`; UI แสดง “นาที”; ไม่รับหน่วยอื่น |
| `minMinutes`, `maxMinutes` | JSON number ที่เป็นจำนวนเต็ม 1-1440 ทั้งคู่ และ min <= max; ไม่แปลง numeric string/boolean/decimal เป็นจำนวนเต็ม |
| `id` | server สร้าง opaque ID; frontend ห้ามอนุมานชนิดฐานข้อมูลจาก ID |
| `isActive` | server ตั้ง `true` เมื่อสร้างใน Sprint 1; client ระบุไม่ได้ |
| `createdBy` | server ใส่ principal ID ของ manager; FK ไป user; ไม่รับจาก client และไม่คืนใน public template response |
| `createdAt`, `updatedAt` | server timestamp; response เป็น UTC ISO 8601; ช่วงสร้างครั้งแรกมีเวลาเริ่มต้นที่สอดคล้องกัน |

ข้อเสนอเพิ่มจาก B: ชื่อแม่แบบซ้ำได้โดยแต่ละรายการมี ID ต่างกัน เพื่อลดการสร้างกฎ unique title ที่ไม่มีใน brief; **รอ A ตอบ** ขอบเขต “อักขระ” ของความยาวต้องใช้เกณฑ์เดียวกันใน validator/UI โดยเสนอ Unicode code points และไม่ตัด string เงียบ ๆ

Constraints ที่ขอให้ A รวม: required fields/FK, integer min/max และ check `1 <= minMinutes <= maxMinutes <= 1440` ไม่ใช้การตรวจ frontend เพียงชั้นเดียว ไม่มี migration ถูกสร้างในรอบนี้ และไม่กำหนดชื่อ table/Prisma model จริงแทน A

F-03 ต้องเก็บ snapshot ของ `unit`, `minMinutes`, `maxMinutes` ไว้กับ goal ตาม design ที่ A ยืนยัน เพื่อให้การเปลี่ยนแม่แบบใน F-05 ไม่เปลี่ยนช่วงของ goal/ประวัติเดิม ข้อเสนอนี้ไม่ใช่การทำ lifecycle ล่วงหน้าใน F-02

## 4. UI specification

เสนอ route `/templates` ให้ทั้งสองบทบาทดูรายการ active; manager มี action ไปฟอร์มสร้างที่ `/templates/new` ส่วน participant เห็น action “เลือกแม่แบบ” ไป F-03 โดยไม่ต้องกรอก owner ID

| State / เหตุการณ์ | พฤติกรรมที่สังเกตได้ |
|---|---|
| Loading list | แสดงกำลังโหลด; ไม่แสดง “ยังไม่มีแม่แบบ” ก่อน response กลับ |
| Empty list | แสดงยังไม่มีแม่แบบ active; manager มีทางไปสร้าง; participant มีคำแนะนำให้ติดต่อผู้ดูแล |
| Validation | แสดงข้อความใกล้ field ที่ผิดและสรุปฟอร์ม; คง input; min/max แสดงหน่วยนาที |
| Submitting | ปิดปุ่มส่งชั่วคราวและแสดงกำลังบันทึก; การปิดปุ่มไม่ใช่การป้องกัน duplicate ฝั่ง server |
| Success | แสดงแม่แบบจาก response แล้ว refresh รายการจาก API; แจ้งสำเร็จหลัง commit เท่านั้น |
| 401 / 403 | ให้ login ใหม่เมื่อ session ใช้ไม่ได้; แจ้งสิทธิ์ไม่พอโดยไม่โชว์ข้อมูลส่วนตัว; ไม่สลับบทบาทเอง |
| Network error / 5xx | คง input และให้ retry อย่างชัดเจน; หาก POST ส่งแล้วไม่ทราบผล ให้ reload รายการก่อนส่งซ้ำและแจ้งว่าอาจมีการบันทึกแล้ว |

POST นี้ยังไม่เสนอ idempotency key และอนุญาตชื่อซ้ำ จึงไม่สามารถพิสูจน์จากชื่อเพียงอย่างเดียวว่าการส่งที่ timeout ถูกบันทึกแล้วหรือไม่ UI ต้องไม่ retry POST อัตโนมัติ; หากต้องการ retry แบบรับประกันครั้งเดียว ให้ปรับ shared contract กับ A ก่อน implementation

## 5. API specification

ทุก path ต่อท้าย `/api/v1` ใช้ JSON, cookie credentials และ shared envelope ตามลำดับ transport → session → role → CSRF (mutation) → feature validation → database write; ไม่ใช้ client-supplied role หรือ user ID

| Method / path | สิทธิ์ | Request | Success |
|---|---|---|---|
| `GET /activity-templates` | Participant และ Program Manager ที่ login | ไม่มี body; Sprint 1 ไม่มี filter/pagination | 200 `{ "data": [Template] }`; เฉพาะ active เรียง `createdAt ASC, id ASC`; ว่างเป็น `[]` |
| `POST /activity-templates` | Program Manager เท่านั้น | `{ "title": "อ่าน CPE 334", "description": "ทบทวนบทเรียน", "unit": "minute", "minMinutes": 1, "maxMinutes": 1440 }` | 201 `{ "data": Template }` หลัง commit |

`Template` มีเฉพาะ `id`, `title`, `description`, `unit`, `minMinutes`, `maxMinutes`, `isActive`, `createdAt`, `updatedAt` ไม่คืนข้อมูลบัญชีผู้สร้าง/ผู้ใช้/goal/entry หรือ raw database object

| กรณี | HTTP / code | ผลข้อมูล |
|---|---|---|
| ไม่มี/หมดอายุ/revoked session รวมหลัง logout | 401 `UNAUTHENTICATED` | ไม่คืนแม่แบบและไม่เขียนข้อมูล |
| Participant เรียก POST | 403 `FORBIDDEN` | ไม่สร้างแม่แบบ แม้ระบุ role manager ใน request |
| Mutation ไม่มี/ผิด CSRF token | 403 `CSRF_FAILED` | ไม่เขียนข้อมูล; รายละเอียดขึ้นกับ F-01 ที่ A ยืนยัน |
| Field ผิด/ขาด หรือมี key อื่น เช่น `createdBy`, `isActive`, `role`, `userId` | 422 `VALIDATION_ERROR` | ไม่เขียนข้อมูล; `fields` ชี้ field ที่ผิด |
| JSON เสียรูป / content type ไม่รองรับ | 400 / 415 ตาม shared convention | ไม่เขียนข้อมูล |
| Database/server failure | 500 `INTERNAL_ERROR` ตาม shared convention | ข้อความทั่วไป ไม่มี SQL/stack/secret |

Error ตัวอย่าง: `{ "error": { "code": "VALIDATION_ERROR", "message": "ตรวจสอบข้อมูลแม่แบบ", "fields": { "maxMinutes": ["ต้องไม่น้อยกว่าค่าต่ำสุด"] } } }` ไม่มี PATCH/DELETE ที่ให้แก้แม่แบบใน Sprint 1; ถ้าเพิ่ม route ต้องเพิ่ม contract และ permission tests ก่อน

## 6. Acceptance criteria

| AC | Observable outcome |
|---|---|
| AC-F02-01 | Manager ส่งข้อมูลถูกต้องแล้วได้ 201 และ Template ที่ normalize ตามข้อ 3; server กำหนด ID, active และผู้สร้างจาก session; มีแถวใหม่หนึ่งแถว |
| AC-F02-02 | ค่าว่าง/ยาวเกิน/หน่วยผิด/ช่วงกลับด้าน/นอก 1-1440/ไม่ใช่ integer ถูกปฏิเสธ 422 พร้อม field feedback และจำนวนแถวไม่เพิ่ม; ค่า min=max และปลายช่วง 1,1440 ใช้ได้ |
| AC-F02-03 | ผู้ใช้ทั้งสองบทบาทที่ login เรียก GET ได้เฉพาะ active เรียงตามที่กำหนด; ไม่มีข้อมูลเป็น 200 และ `data: []`; ไม่มีข้อมูลส่วนตัวปะปน |
| AC-F02-04 | Anonymous ใช้ GET/POST ไม่ได้ (401); Participant ใช้ POST ไม่ได้ (403) แม้ปลอม userId/role; ไม่มีการเขียนข้อมูล |
| AC-F02-05 | POST ที่ CSRF ไม่ถูกต้องถูกปฏิเสธ 403; หลัง logout session เดิมเรียก GET/POST ได้ 401 ตาม F-01; UI ไม่ถือ cached identity ว่า login สำเร็จ |
| AC-F02-06 | หลังสร้างสำเร็จ fresh API request และการ reload หน้าอ่านแม่แบบเดิมจาก PostgreSQL ได้ ไม่อาศัย browser memory หรือ response POST อย่างเดียว |
| AC-F02-07 | Unknown/server-owned fields ถูกปฏิเสธ 422; responses ใช้ shared envelope และ allowlist; database error ไม่รั่ว SQL/stack/secret |
| AC-F02-08 | UI แสดง loading/empty/validation/submitting/success/error ตามข้อ 4; คง input เมื่อส่งไม่สำเร็จและไม่ retry POST อัตโนมัติหลังผลไม่แน่นอน |
| AC-F02-09 | ใน selected integrated UI journey manager สร้างแม่แบบ แล้ว participant คนละ session เลือกแม่แบบ active ไปสร้าง goal ใน F-03 ได้; participant ไม่มี action จัดการแม่แบบ |

## 7. Software Test Specification (STS) - planned only

ใช้ test database แยก มี synthetic manager, P1, P2; reset fixture อย่างปลอดภัยทุก case; session/CSRF ต้องได้จาก F-01 จริงใน integration tests ไม่แทนด้วย role selector การทดสอบ Unit อาจใช้ fixture แต่ไม่นับเป็นหลักฐาน persistence/permission

| Test ID / AC | Level | Preconditions / input | Action | Expected result |
|---|---|---|---|---|
| TEST-F02-01 / 01 | API + DB integration | Manager login; valid CSRF; ไม่มีแม่แบบชื่อ fixture | POST ชื่อ/คำอธิบายมีช่องว่างรอบนอก, minute, 1..1440; แยกกรณีไม่ส่ง description | 201; trim ถูกและ description ที่ไม่ส่งเป็น empty string; server fields ถูก; DB เพิ่มหนึ่งแถวผูก manager ต่อคำขอ |
| TEST-F02-02 / 02 | Unit | Valid base payload | Parameterized: title blank/121 chars; description 1001; unit อื่น; min>max;0/1441;1.5;`"60"`;boolean/null/missing required | Validator ปฏิเสธ field ที่ระบุ; ไม่ coercion; title 120 / description 1000/min=max/1 และ 1440 ผ่าน |
| TEST-F02-03 / 02 | API + DB integration | Manager/session/CSRF; บันทึก row count ก่อนส่ง | POST invalid variants และ valid boundary fixtures | Invalid422 และ count ไม่เพิ่ม; valid201 พร้อมค่าที่ตรง input |
| TEST-F02-04 / 03 | API + DB integration | มี active2/inactive1; เทียบ order รวมกรณีเวลาเท่ากัน | GET แยก session Manager/P1; ทำ empty fixture | ทั้งคู่ 200 active เท่านั้นและลำดับคงที่; empty เป็น[]; ไม่มี private fields |
| TEST-F02-05 / 04 | API + DB integration | ไม่ login; P1 login; valid CSRF ของ P1 | Anonymous GET/POST; P1 POST รวม payload ปลอม role/userId | 401/401/403 ตามลำดับ; DB ไม่เพิ่ม; ไม่มีสิทธิ์จาก payload |
| TEST-F02-06 / 05 | API + DB integration | Manager login | POST ไม่มี/ผิด CSRF; logout จริงแล้วใช้ cookie เดิม GET/POST | CSRF 403 ไม่เขียน; session เดิม 401 หลัง logout; ไม่มี private/session details |
| TEST-F02-07 / 06 | API + DB integration | Manager สร้างสำเร็จและ commit แล้ว | เปิด request/session ใหม่เรียก GET และตรวจ DB fixture | พบ ID/ค่าที่บันทึกตรงกัน; ไม่อ่านจาก in-memory list |
| TEST-F02-08 / 07 | API + DB integration | Manager/session/CSRF | POST เพิ่ม createdBy/isActive/id/userId/role ทีละ key; จำลอง DB failure ใน test isolation | Unknown keys422 ไม่เขียน; failure500 safe envelope ไม่รั่ว SQL/stack/secret |
| TEST-F02-09 / 08 | UI component/integration | ควบคุม response loading/empty/422/403/5xx และ network timeout | เปิดรายการ กรอก/ส่งฟอร์ม retry หลังตรวจผล | State/message ถูก; input คงอยู่; ปุ่ม disable ระหว่างส่ง; ไม่มี automatic POST retry |
| TEST-F02-10 / 06,09 | UI E2E + real API/DB | Manager/P1 sessions แยก; F-01/F-03 พร้อม | Manager login สร้างแม่แบบ; reload; logout; P1 login เลือกแม่แบบไปสร้าง goal | Template ยังอยู่หลัง reload; goal ใช้ template ID จริง; participant ไม่มี action แก้แม่แบบ |
| TEST-F02-11 / 01 | API + DB integration | Manager/session/CSRF; title หนึ่งชื่อ | POST valid payload เดิมสองครั้งโดยตั้งใจ (ไม่ใช่ concurrent daily entry) | สอง 201 คนละ ID ตามข้อเสนอชื่อซ้ำได้; ไม่เอากฎ daily duplicate ของ F-04 มาใช้กับแม่แบบ |

ชื่อ AC ในคอลัมน์ย่อหมายถึง `AC-F02-xx` ทุกแถว แผนนี้มี 11 test IDs (บาง ID เป็น parameterized test หลาย execution); **ไม่ใช่จำนวน tests ที่รันจริง**

| AC | Planned test IDs | Actual file / test name | Command / counts | Result / tested commit |
|---|---|---|---|---|
| AC-F02-01 | TEST-F02-01,11 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F02-02 | TEST-F02-02,03 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F02-03 | TEST-F02-04 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F02-04 | TEST-F02-05 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F02-05 | TEST-F02-06 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F02-06 | TEST-F02-07,10 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F02-07 | TEST-F02-08 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F02-08 | TEST-F02-09 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F02-09 | TEST-F02-10 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |

## 8. DoD และ completion evidence

- [ ] A/B ตกลง contract, SRS mapping, shared UI/API และ schema/auth dependencies พร้อมบันทึก revision ก่อน feature implementation
- [ ] เปิด Issue จริงเชื่อม contract; branch จาก sprint staging จริง (ชื่อที่เสนอ `codex/f02-templates` ยังไม่ถูกสร้าง)
- [ ] เก็บ meaningful TDD: เลือก valid-range rule เช่น TEST-F02-02/03 ให้ intended assertion fail ก่อนแก้ แล้วผ่านหลัง implementation; บันทึก command/output/เวอร์ชัน red และ green จริง ไม่ใช้ import/setup failure แทน rule failure
- [ ] Implement AC ครบทั้ง UI/API/DB; ใช้ backend guard และ persisted data; ไม่แตะ migration/auth/package ส่วนกลางโดยไม่ประสาน A
- [ ] รัน planned verification ที่จำเป็นจริง อัปเดต ledger เป็น actual file/test/command/counts/result/commit; ระบุ FAIL/SKIPPED/INCOMPLETE ตามจริงและตรวจ assertions
- [ ] A review PR เข้า sprint staging จริง มี check/finding/reason ที่ระบุสิ่งตรวจ; B แก้ findings และรัน integration หลังรวม
- [ ] Release checks ผ่านบน submitted main commit; README/traceability/known gaps/current contract ตรง release
- [ ] ส่ง selected screenshots/workflow, actual test excerpts และ red/green/history ให้ B รวบรวม Part F; ยังคงหลักฐานครบแม้รายงานเลือกเพียงบาง case

## 9. Revision / decision / execution history

| วันที่ / revision | สิ่งที่เกิดขึ้นจริง | การตัดสินใจ / evidence |
|---|---|---|
| 3 พ.ย. 2026 / 0.1 | Codex ช่วย B ร่าง contract และ planned STS ก่อน code | รอสมาชิก B อ่านรับงานและ A review; ยังไม่มี Git commit หรือ approval |

รอ A ตอบ: SRS IDs, principal/error/CSRF shape, snapshot fields ของ F-03, title-length semantics/ชื่อซ้ำได้, schema/migration sequence และ shared setup/test commands หากคำตอบเปลี่ยน contract ให้เพิ่ม revision พร้อมเหตุผลและ affected AC/tests ก่อน implementation
