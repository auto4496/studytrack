# F-04 Daily entries and progress - Engineering contract

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | revision: 0.1 | ผู้ร่าง: สมาชิก B | ผู้ review ที่ต้องการ: สมาชิก A

สถานะ: **DRAFT / รอ A ตรวจและตกลง interface** มีเพียง contract และ test design ยังไม่มี application implementation, executable tests, schema/migration, Issue/PR, review หรือผล PASS

## 1. ที่มา ขอบเขต และ linked requirements

- [Project brief](../../project-brief.md) หัวข้อ 2-5: บันทึกนาทีรายวัน เรียกข้อมูลถาวรกลับ และคำนวณ progress; BR-01, BR-04, BR-05, BR-06, BR-07 เป็น **รหัสข้อเสนอใน brief**; BR-02 เชื่อมวันเริ่ม goal, BR-08/BR-10 เป็นข้อพิจารณา target version/snapshot เพื่อรองรับ Sprint 2
- [Master specification](../../../sources/group_work_specs_v1.pdf) หน้า 8 หัวข้อ 8 และหน้า 10-11: valid daily entry/date/range, progress, cross-participant privacy, contract/TDD/review
- [Deliverable 1](../../../sources/project_deliverable_1_v1.pdf) หน้า 4-7: feature contract/STS/DoD ก่อน code และ actual API/database/access evidence
- ใช้ [UI/API conventions](../../ui-api-conventions.md), [F-02](f02-templates.md) และ [traceability](../../traceability.md) ที่ยังเป็นข้อเสนอร่วม

**Linked SRS FR/BR/NFR IDs: รอ SRS จาก A** ยังไม่อ้างว่า brief IDs เป็น requirement IDs ที่ทีมอนุมัติแล้ว เมื่อ SRS พร้อมต้องเติม mapping และทบทวน AC/tests ก่อน code

Sprint 1 ให้ Participant บันทึกหนึ่ง entry ต่อ goal ต่อวันที่อนุญาตและเรียก daily progress กลับ การแก้ entry, history filters และ streak เป็น F-06; goal revision/stop/template deactivation เป็น F-05; นโยบายลบ entry ยังไม่ได้เสนอหรือจัดสรรเป็นฟีเจอร์ ไม่ implement งานเหล่านี้ในรอบนี้

## 2. Feature SDS และ dependencies

1. Participant login แล้วเปิด goal ของตนจาก F-03 เลือกวันที่และกรอกนาที
2. UI ส่งเฉพาะวันที่/นาทีและ goal ID ที่ path; server ใช้ principal จาก session ตรวจ role และ owner
3. Server โหลด goal พร้อม snapshot หน่วย/ช่วงค่า, startsOn และ target version ที่มีผลในวันนั้น ตรวจวันที่ด้วย server clock ตาม Asia/Bangkok
4. Transaction insert entry โดยอาศัย unique constraint `(goalId, entryDate)`; ถ้า duplicate ให้ 409 โดยไม่ overwrite/เพิ่มแถว แม้ส่งพร้อมกัน
5. Server คำนวณ daily progress จากข้อมูล authoritative และคืนหลัง commit; เมื่อ reload UI เรียก GET ใหม่จากฐานข้อมูล
6. หากผู้ใช้ยังไม่ได้บันทึกในวันนั้น GET คืน daily progress ที่มี `entry: null` แยกจาก entry ที่มีค่าจริง

| Dependency ที่เสนอ | ผู้ประสาน | Interface ที่ต้องตกลงก่อน code |
|---|---|---|
| F-01 session/permission/CSRF | A; B review | Principal `id`,`role`; HttpOnly session, server expiry/revocation/logout; mutation header `X-CSRF-Token` จาก `GET /api/v1/auth/csrf`; error handling |
| F-03 authoritative goal | A; B review | `id`, owner ID, `startsOn`, active status, snapshot `unit/minMinutes/maxMinutes` และ initial target version มี effective date; target ต้อง >0 และอยู่ใน snapshot range |
| Target resolution for date | A กำหนด data design; B review | เลือก version ที่ `effectiveFrom <= entryDate` ล่าสุด; initial version มีผลตั้งแต่ startsOn; response มี opaque `targetVersionId`; ไม่มี target revision UI/API ใน S1 |
| Shared persistence/test harness | A รวม schema/migrations; B เสนอ constraints/tests | DATE สำหรับ local entryDate, FK ไป goal, integer/range checks, unique constraint; DB-backed test environment แยกจาก dev |
| F-05/F-06 extension | A/B ร่วมตกลงก่อน S2 | Target revision มีผลวันถัดไปโดยไม่เปลี่ยนอดีต; entry correction ต้องใช้ target ของวันเดิม; lifecycle/history ไม่ถูกรวมเป็น S1 implementation |

P1/P2 ในเอกสารนี้คือบัญชี Participant สังเคราะห์คนละเจ้าของ goal ไม่ใช่สมาชิกทีม A/B ไม่มี manager override สำหรับ personal endpoints

## 3. กฎและ data design ที่เสนอ

| เรื่อง | ข้อกำหนดที่สังเกตได้ |
|---|---|
| Date | `YYYY-MM-DD` ที่เป็นวันปฏิทินจริง; ปฏิเสธ timestamp/วันที่ rollover เช่น 2026-02-29; ไม่ parse เป็น UTC แล้วทำให้วันเปลี่ยน |
| Allowed date | ตั้งแต่ `goal.startsOn` ถึง “วันนี้” ตาม server clock ใน `Asia/Bangkok` รวมวันต้น/ปลาย; ทั้ง POST และ GET ต้องอยู่ในช่วงนี้ |
| Minutes | JSON integer ตาม snapshot ของ goal ภายใน 1-1440; ไม่รับ 0/ติดลบ/fraction/numeric string/boolean/null; ใช้ min/max ของ goal ไม่ใช่ค่าปัจจุบันใน template/client |
| Duplicate | หนึ่ง row ต่อ goal/date; การส่งซ้ำเป็น rejection ไม่สะสม ไม่ replace ไม่ upsert; DB UNIQUE ป้องกันพร้อมกัน ไม่พึ่ง read-before-insert อย่างเดียว |
| Ownership | Query goal ด้วย principal owner และ ID; ถ้าไม่พบ/ไม่ใช่เจ้าของคืน 404 เหมือนกัน; manager คืน 403 ก่อนเข้าข้อมูล goal; ทั้ง GET/POST ใช้กฎเดียวกัน |
| Creation state | POST ต้องเป็น active goal ของตน; S1 สร้างได้แต่ active; ไม่มี endpoint เปลี่ยนสถานะใน contract นี้; หากข้อมูลไม่ active ให้ 409 `GOAL_NOT_ACTIVE` และไม่เขียน |
| Progress | `actualMinutes / targetMinutes * 100`; ไม่ cap ที่ 100; server คืนเลขเปอร์เซ็นต์ปัดสองตำแหน่งแบบ HALF_UP และ UI เติมเครื่องหมาย `%` |
| Achieved | เทียบจำนวนเต็มจริง `actualMinutes >= targetMinutes` ก่อนปัดเปอร์เซ็นต์; ไม่ตัดสินจากข้อความ/เปอร์เซ็นต์ที่แสดง |
| No entry | `entry:null`, `actualMinutes: 0`, `progressPercent: 0`, `achieved: false`; target/หน่วยยังมาจาก goal/version ที่มีผลในวันนั้น; ไม่สร้าง row 0 อัตโนมัติ |

ตัวอย่าง target 60: actual 45 ->75%; actual 75 ->125%; actual 60 ->100%/achieved true; no entry ->0%/achieved false ตัวอย่างปัดเศษ: actual 1 / target 32 ->3.13% (snapshot range ต้องอนุญาต) ใช้การปัดจากอัตราส่วนจำนวนเต็มเพื่อให้ผลไม่ขึ้นกับ floating-point tie โดยรายละเอียด implementation ตกลงหลัง contract

ข้อมูล logical ที่เสนอให้ A รวม ไม่ใช่ schema ที่ถูกสร้างแล้ว:

| Entity / field | Constraint / responsibility |
|---|---|
| DailyEntry `id` | Server-generated opaque ID |
| `goalId` | FK ไป goal; owner derive จาก goal ไม่เก็บ owner ที่ client ส่ง |
| `entryDate` | Database DATE; NOT NULL; UNIQUE ร่วมกับ goalId |
| `minutes` | Integer/NOT NULL; DB check ช่วง 1..1440 และ service ตรวจ snapshot range ของ goal |
| `createdAt`,`updatedAt` | Server timestamps; UTC ISO ใน response; S1 ไม่มีการแก้ entry |
| Goal snapshot + GoalTargetVersion | A ออกแบบโครงสร้างจริง; initial version ต้องครอบคลุม startsOn; version lookup ของ F04 ใช้วันบันทึก ไม่ใช้ latest target แบบข้ามวันที่ |

การตรวจ permission/date/range และ insert ต้องอยู่ใน flow ที่ไม่เปิดทางให้เขียนหลัง state เปลี่ยนระหว่างคำขอ หาก A เพิ่ม lifecycle พร้อมกันในอนาคตต้องตกลง transaction/locking หรือเงื่อนไขที่เทียบเท่าก่อน F-05 ไม่สร้าง migration/schema/auth middleware ในรอบนี้

## 4. UI specification

เสนอ route `/goals/:goalId` ของ F-03 มีส่วนบันทึกวันที่และนาที กับ daily progress ของ F-04 แสดง label หน่วยนาที วันที่ท้องถิ่น actual/target เปอร์เซ็นต์และสถานะบรรลุ ไม่ใช้ target ที่แก้เองใน client

| State / เหตุการณ์ | พฤติกรรม |
|---|---|
| Loading | แสดงกำลังโหลด goal/progress; ไม่แสดง 0 ราวกับข้อมูลจริงก่อน GET สำเร็จ |
| Goal starts tomorrow | ยังเลือกวันบันทึกที่ถูกต้องไม่ได้; แสดง “ยังไม่ถึงวันเริ่ม” และวันเริ่มและไม่ POST/GET date นอกช่วง; ไม่ส่ง today ที่ก่อน startsOn |
| Empty day | GET สำเร็จ entry null -> “ยังไม่ได้บันทึกวันนี้/วันที่เลือก” พร้อม target และ 0%; ไม่สับสนกับ network failure |
| Form validation | แจ้ง field ที่ผิดใกล้ input; ตั้งวันที่เริ่มต้นตาม Bangkok; จำกัด min/max เพื่อช่วยผู้ใช้ แต่ API ตรวจซ้ำ |
| Submitting | ปิด submit และแสดงสถานะ; ไม่แสดง success จน POST commit และ response สำเร็จ |
| Saved / duplicate | แสดงค่าจาก server; ถ้า 409 ENTRY_EXISTS ให้ GET วันนั้นใหม่แล้วแสดงรายการเดิมโดยไม่ overwrite |
| Timeout / unknown POST outcome | คง input; แจ้งยังไม่ทราบผล; GET วันเดิมเพื่อ reconcile ก่อนผู้ใช้ retry ไม่ POST อัตโนมัติ |
| 401/403/404 | 401 กลับ login; 403 แจ้งสิทธิ์ไม่พอ; 404 ข้อความทั่วไปไม่บอกว่าเป็น goal ของใคร; ล้าง private view หลัง logout/session invalid |
| 422/5xx/network GET failure | คง input และแสดงข้อความที่ใช้งานได้/ปุ่มลองโหลดใหม่; ไม่เปลี่ยนเป็น empty/0% โดยไม่มี GET สำเร็จ |

UI ต้องแสดง 125% ได้ แม้ progress bar อาจใช้พื้นที่เต็มเมื่อ >=100 โดยตัวเลขและ actual/target ต้องไม่ถูก cap

## 5. API specification

ทุก path ต่อท้าย `/api/v1` ใช้ shared JSON envelope/session; mutations ส่ง `X-CSRF-Token` ตัวอย่าง date ด้านล่างเป็น fixture ไม่ใช่วันเครื่องผู้ใช้ที่จะเชื่อแทน server

| Method / path | Request | Success / สิทธิ์ |
|---|---|---|
| `POST /goals/:goalId/entries` | `{ "entryDate": "2026-11-03", "minutes": 45 }` | 201 `{ "data": DailyProgress }` หลัง commit; Participant เจ้าของ active goal เท่านั้น |
| `GET /goals/:goalId/progress?date=2026-11-03` | Query `date` จำเป็น; ไม่มี body | 200 `{ "data": DailyProgress }`; Participant เจ้าของ goal; วันอยู่ในช่วงที่อนุญาต |

`DailyProgress`:

```json
{
  "goalId": "opaque-goal-id",
  "date": "2026-11-03",
  "unit": "minute",
  "entry": {
    "id": "opaque-entry-id",
    "entryDate": "2026-11-03",
    "minutes": 45,
    "createdAt": "2026-11-03T03:00:00.000Z",
    "updatedAt": "2026-11-03T03:00:00.000Z"
  },
  "targetMinutes": 60,
  "actualMinutes": 45,
  "progressPercent": 75,
  "achieved": false,
  "targetVersionId": "opaque-target-version-id"
}
```

หากไม่มี entry ใช้ `entry:null`, actual 0 / progress 0 / achieved false ที่เหลือเหมือน shape นี้ ไม่คืน owner ID/บัญชีอื่น/credentials/raw DB objects

| กรณี | HTTP / code | Expected effect |
|---|---|---|
| ไม่มี/หมดอายุ/revoked session รวมหลัง logout | 401 `UNAUTHENTICATED` | ไม่อ่านข้อมูลส่วนตัว/ไม่เขียน |
| Program Manager เรียก personal endpoint | 403 `FORBIDDEN` | ไม่มีข้อมูล goal/entry/progress แม้ทราบ ID |
| ไม่มี goal หรือเป็น goal ของ P2 ที่ P1 ขอ | 404 `NOT_FOUND` | envelope เดียวกัน ไม่เปิดเผยเจ้าของ/การมีอยู่ |
| POST ไม่มี/ผิด CSRF | 403 `CSRF_FAILED` | ไม่เขียน |
| Date/minutes ผิด, required ขาด, unknown keys | 422 `VALIDATION_ERROR` | fields ชี้ entryDate/minutes/date หรือ key; ไม่มี row เพิ่ม |
| Goal ไม่ active (กรณี defensive) | 409 `GOAL_NOT_ACTIVE` | ไม่เขียน; S1 ยังไม่มี lifecycle UI |
| มี entry goal/date เดียวกันอยู่แล้ว รวม concurrent | 409 `ENTRY_EXISTS` | row เดิมไม่เปลี่ยน ไม่มี row เพิ่ม |
| DB/server failure | 500 `INTERNAL_ERROR` | safe message ไม่คืน SQL/stack/secret; ไม่รายงาน success เมื่อ rollback |

ไม่รับ `userId`, `ownerId`, `role`, `targetMinutes`, `targetVersionId`, `actualMinutes`, `progressPercent`, `achieved`, `id` หรือ timestamp จาก client มี key นอก request shape ให้ 422; invalid JSON 400 / content type 415 ตาม shared convention ลำดับร่วมคือ transport → session → role → CSRF (mutation) → ownership → domain validation → write; หลัง ownership ผ่านแล้วจึงตรวจข้อมูล domain เพื่อไม่รั่ว private resource details

## 6. Acceptance criteria

| AC | Observable outcome |
|---|---|
| AC-F04-01 | P1 ส่งวันที่/นาทีถูกต้องให้ active goal ของตน ->201; DB เพิ่มหนึ่ง entry; response แสดงค่าที่บันทึกกับ target/version authoritative |
| AC-F04-02 | Fresh GET และ reload หน้าอ่าน entry/progress เดิมจาก PostgreSQL ได้; GET วันอนุญาตที่ไม่มี entry คืน entry null/actual 0 / progress 0 / achieved false โดยไม่สร้าง row |
| AC-F04-03 | Progress 45/60=75%, 75/60=125%, 60/60=100%; ปัด 1/32 เป็น 3.13; achieved เทียบ actual>=target จริงไม่ใช่เปอร์เซ็นต์ที่ปัด |
| AC-F04-04 | EntryDate เป็น calendar date จริงใน startsOn..Bangkok today รวมปลายช่วง; วันที่ก่อนเริ่ม/อนาคต/ผิดรูปแบบถูก 422 และไม่เขียน; GET date ขาด/ผิด/นอกช่วงถูก 422 |
| AC-F04-05 | Minutes จำนวนเต็มใน goal snapshot range รวม min/max เท่านั้น ; 0/ลบ/เศษส่วน/string/boolean/null/ขาด/นอกช่วงถูก 422 และไม่เขียน; target/range จาก client เปลี่ยนกฎไม่ได้ |
| AC-F04-06 | ส่งซ้ำ goal/date เดียวกันได้ 409 ENTRY_EXISTS; entry เดิมและจำนวน row ไม่เปลี่ยน; participant อื่นมี goal ของตนบันทึกวันเดียวกันได้ |
| AC-F04-07 | สองคำขอ valid พร้อมกันต่อ goal/date เดียวกันได้หนึ่ง 201 และหนึ่ง 409 ENTRY_EXISTS และ exactly one row; การ disable ปุ่มหรือ read-before-insert อย่างเดียวไม่นับผ่าน |
| AC-F04-08 | Anonymous/หลัง logout ได้ 401; manager ได้ 403 ทุก personal route; P1 ใช้ GET/POST goal ของ P2 หรือ goal ที่ไม่มีได้ 404 shape เดียวกันโดยไม่รั่วข้อมูล/ไม่เขียน |
| AC-F04-09 | Mutation CSRF ผิดได้ 403; unknown/server-owned fields ได้ 422; targetVersion/actual/progress คำนวณจาก server และ response เป็น allowlist; errors ไม่รั่ว SQL/stack/secret |
| AC-F04-10 | Lookup target ตาม entryDate ใช้ initial version ที่มีผลจาก startsOn; unit/range ใช้ goal snapshot; template ค่าปัจจุบันที่ต่างไปไม่เปลี่ยน validation/progress ของ goal เดิม; POST goal ไม่ active ไม่เขียน |
| AC-F04-11 | UI มี loading/empty/validation/submitting/error/success ตามข้อ 4; duplicate/timeout เรียก GET reconcile ก่อน retry และไม่ overwrite; display เกิน 100% ได้; session invalid ไม่คง private view |
| AC-F04-12 | Integrated UI journey manager login สร้าง template -> participant login ตั้ง goal 60 -> บันทึก 45 -> reload เห็น 75% -> duplicate/future/forbidden ถูกปฏิเสธ -> logout แล้ว protected API ใช้ session เดิมไม่ได้ พร้อม DB persistence |

## 7. Software Test Specification (STS) - planned only

ทุก integration ใช้ real API/PostgreSQL test DB แยกและ synthetic manager/P1/P2 seed goal/initial target version ตาม contract F-03; freeze/inject server clock ในการทดสอบวันที่ ไม่เปลี่ยนนาฬิกาจริงของเครื่อง ทุก case assert ทั้ง HTTP/payload และผล DB ที่เกี่ยวข้อง

| Test ID / AC | Level | Preconditions / input | Action | Expected result |
|---|---|---|---|---|
| TEST-F04-01 / 01,02 | API + DB integration | P1 login/CSRF; own goal เริ่ม 3 พ.ย. target 60 range 1..1440; server วันนี้ 3 พ.ย. | POST วันที่ 3 พ.ย./45 นาที; fresh GET วันที่ 3 พ.ย.; query DB; reload ผ่าน API request ใหม่ | 201 แล้ว 200 พร้อม entry ID/45/target 60/75%ตรงกัน; DB หนึ่ง row; ไม่พึ่ง POST cache |
| TEST-F04-02 / 02 | API + DB integration | Own goal/day ที่อนุญาตแต่ไม่มี entry | GET progress | 200 พร้อม entry null actual 0 progress 0 achieved false; target/version ถูก; DB ยังไม่มี entry |
| TEST-F04-03 / 03 | Unit | Target 60 และ 32; valid integer inputs | คำนวณ 45/60,75/60,60/60,1/32,59/60; เปรียบเทียบ achieved | 75,125,100,3.13,98.33%; achieved false,true,true,false,false ตามลำดับ; ไม่มี cap |
| TEST-F04-04 / 03 | API + DB integration | แยก goal/day fixtures target 60/32 | POST 45/75/60/1 และ GET กลับ | ผล server ตรงสูตร/rounding/achieved; ไม่เชื่อค่า derived ที่ client พยายามส่ง |
| TEST-F04-05 / 04 | Unit | StartsOn 3 พ.ย.; fixed clock | ตรวจ วันที่ 3/4 พ.ย. ก่อนและหลัง `2026-11-03T17:00:00Z`; malformed date,2026-02-29,timestamp | เวลา 16:59:59Z วันนี้ 3 พ.ย.; 17:00:00Z วันนี้ 4 พ.ย.; valid boundary เปลี่ยนตาม Bangkok; impossible date ปฏิเสธ |
| TEST-F04-06 / 04 | API + DB integration | P1 goal เริ่ม 3 พ.ย.; clock วันที่ 4 พ.ย. Bangkok; distinct fixtures | POST วันที่ 2/5 พ.ย./invalid กับวันที่ 3/4 พ.ย.; GET missing date/invalid / out-of-range | ผิด 422 ไม่มี row; startsOn/today ได้ 201; GET ผิด 422; goal เริ่มพรุ่งนี้ ยังบันทึกไม่ได้ |
| TEST-F04-07 / 05 | Unit | Goal snapshot range 30..120 | Validate 30/120,29/121,0,-1,1.5,`"60"`,true,null/missing | เฉพาะ integer 30..120 ผ่าน; ไม่ coercion |
| TEST-F04-08 / 05 | API + DB integration | Goal range 30..120 และ goal range 1..1440; authenticated owner | POST invalid/valid boundary บน distinct goal/day fixtures | invalid 422 และ count ไม่เพิ่ม; 30/120 และ 1/1440 ผ่านเมื่อ snapshot อนุญาต |
| TEST-F04-09 / 06 | API + DB integration | P1 goal/date มี 45 อยู่แล้ว; P2 มี goal ของตน | P1 POST ซ้ำด้วย 75; P2 POST goal ของตนวันเดียวกัน | P1 ได้ 409 ENTRY_EXISTS row เดิม 45 และ count 1; P2 ได้ 201; uniqueness ต่อ goal/date |
| TEST-F04-10 / 07 | API + DB concurrency integration | Goal/day ไม่มี entry; P1 สอง authenticated requests; barrier ให้ถึง insert พร้อมกัน | ส่ง 45 กับ 75 พร้อมกันผ่าน API จริง; รอทั้งสอง complete; query DB | multiset status {201,409}; conflict code ENTRY_EXISTS; exactly 1 row เป็นค่าของ winner; ไม่มี 500/overwrite |
| TEST-F04-11 / 08 | API + DB integration | Manager, P1, P2 login; mutation ใช้ CSRF/payload ที่ถูกต้อง; P2 มี private goal/entry; unknown ID | Anonymous GET/POST; manager GET/POST; P1 GET/POST P2 goal และ unknown goal | 401/403/404 ตาม role; missing/unowned 404 envelope เดียวกัน; ไม่มี private fields/DB mutation |
| TEST-F04-12 / 08,09 | API + DB integration | P1 login/session/valid goal | POST ไม่มี/ผิด CSRF; logout จริงแล้ว reuse cookie GET/POST | CSRF 403 ไม่เขียน; หลัง logout 401 ทั้งสอง; ไม่มี cached identity bypass |
| TEST-F04-13 / 09 | API + DB integration | P1 valid session/CSRF/own goal | POST เพิ่ม owner/userId/role/target/derived fields ทีละ key; จำลอง DB failure แบบ isolated | unknown 422 ไม่เขียน; failure 500 safe envelope ไม่รั่ว SQL/stack/secret; success payload allowlist |
| TEST-F04-14 / 10 | API + DB integration | Goal มี snapshot 1..1440,target 60 version เริ่ม Nov3; template fixture ปัจจุบัน range 10..100; แยก inactive goal fixture | POST goal เดิม Nov3/1; GET; POST inactive goal | ใช้ snapshot เดิมและ version ของ Nov3; 1 ใช้ได้ progress 1.67%; inactive 409 GOAL_NOT_ACTIVE ไม่มี row; ไม่เพิ่ม lifecycle API ใน S1 |
| TEST-F04-15 / 11 | UI component/integration | Controlled loading/empty/422/409/403/404/5xx/timeout/session expired | เปิดหน้าเลือกวันส่ง form และ reconcile GET; ตั้ง startsOn tomorrow | State/input/message ถูก; submit disabled ระหว่างส่ง; ไม่มี automatic POST retry; starts tomorrow ไม่ส่ง date นอกช่วง; clear private view เมื่อ 401 |
| TEST-F04-16 / 02,11,12 | UI E2E + real API/DB | F01-F04 พร้อม; แยก manager/P1/P2 sessions; clock fixture; clean test DB | ทำ journey ใน AC-F04-12; ตรวจ reload/API/DB; ยิง forbidden API แล้ว logout | Template->goal->entry ถาวร; 45/60=75%; duplicate/future/access rejection ถูก; cookie เดิม 401 หลัง logout |

ชื่อ AC ในคอลัมน์ย่อหมายถึง `AC-F04-xx` แผนมี 16 test IDs ไม่ใช่จำนวน tests ที่รันจริง; parameterized cases จะมีจำนวน execution จริงเมื่อมี test framework และรันแล้ว

| AC | Planned test IDs | Actual file / test name | Command / counts | Result / tested commit |
|---|---|---|---|---|
| AC-F04-01 | TEST-F04-01 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-02 | TEST-F04-01,02,16 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-03 | TEST-F04-03,04 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-04 | TEST-F04-05,06 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-05 | TEST-F04-07,08 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-06 | TEST-F04-09 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-07 | TEST-F04-10 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-08 | TEST-F04-11,12 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-09 | TEST-F04-12,13 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-10 | TEST-F04-14 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-11 | TEST-F04-15,16 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |
| AC-F04-12 | TEST-F04-16 | ยังไม่มี | ยังไม่รัน / ยังไม่มี counts | NOT RUN / ยังไม่มี |

## 8. DoD และ completion evidence

- [ ] A/B ตกลง SRS mapping, goal/snapshot/target version API/data, date/rounding/error/CSRF conventions และ constraints ก่อน implementation
- [ ] Contract/test design มี versioned history; เปิด Issue จริงและ branch จาก sprint staging (ชื่อเสนอ `codex/f04-entries-progress` ยังไม่ได้สร้าง)
- [ ] Meaningful TDD: บันทึก rule failure จริงก่อนแก้ เช่น date boundary/progress/duplicate concurrency แล้ว green หลังแก้ พร้อม test name/command/count/output และ red/green commit จริง ไม่ใช้ setup failure แทน intended behavior failure
- [ ] AC ทั้งหมด implement ผ่าน UI/API/persistent DB; backend role/ownership และ unique constraint ทำงานจริง ไม่มี mock-only persistence
- [ ] รัน unit/API+DB/concurrency/selected E2E จริง; เติม actual ledger และ traceability ต่อ AC พร้อม FAIL/SKIPPED/INCOMPLETE ที่ยังมี; ไม่เขียน PASS ล่วงหน้า
- [ ] A อ่าน diff/assertions และ review PR เข้า staging จริง; แก้ findings และ integration/regression ผ่านหลังรวม; B review งาน A แยกตาม F01/F03
- [ ] Build/test/acceptance ของ submitted release commit ครบ; release PR ที่ review แล้ว เข้า main; README/setup/known gaps/current docs ตรงเวอร์ชัน
- [ ] เก็บ selected workflow/rejection/forbidden/logout screenshots,actual rule/access test excerpts,DB persistence และ red/green history สำหรับ Part F ไม่ใช้ภาพหน้าจอแทน API/DB assertion

## 9. Revision / decision / execution history

| วันที่ / revision | สิ่งที่เกิดขึ้นจริง | สถานะ evidence |
|---|---|---|
| 3 พ.ย. 2026 / 0.1 | Codex ช่วย B ร่าง feature contract และ planned STS ก่อน code | รอ B อ่านรับงานและ A review; ยังไม่มี commit/approval/execution |

รอ A ตอบ: official SRS IDs, initial target version/goal snapshots, target-resolution interface, ownership/CSRF middleware, permission/error order, date column/unique constraint/migration sequence และ setup/test commands เมื่อ S2 เพิ่ม target revisions ต้องเพิ่ม regression ยืนยันวันก่อน effective-date ยังใช้ target เดิม รวมกรณีแก้หลายครั้งก่อนมีผลตาม BR-08; ยังไม่อ้างว่าพฤติกรรม S2 ถูก implement/tested ใน S1
