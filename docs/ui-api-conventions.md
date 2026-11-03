# StudyTrack — ข้อเสนอ UI/API conventions ฝั่ง B

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | Revision: B-draft-01 | สถานะ: PROPOSED / รอ A และ B ตรวจร่วมกัน

ส่วนนี้เป็น input ด้าน UI/API สำหรับ System SDS ของ A ตาม [team plan](team-plan.md) และ [D1 หน้า 3–4](../sources/project_deliverable_1_v1.pdf) ยังไม่แทน SRS, System SDS, auth design หรือ schema ที่ยืนยันแล้ว อ่านร่วมกับ [F02](sprints/sprint-1/f02-templates.md), [F04](sprints/sprint-1/f04-entries-progress.md) และ [baseline review](reviews/baseline-review-b.md)

## 1. หน้าจอและ navigation ที่เสนอ

| Route UI | บทบาท | พฤติกรรม/ผู้รับผิดชอบ |
|---|---|---|
| `/login` | ผู้ยังไม่ login | F01 A; login จริงแล้วใช้ current user ตัดสิน navigation |
| `/templates` | Participant, Program Manager | F02 B; list active; manager เห็นปุ่มสร้าง; participant เลือกเพื่อสร้าง goal ของ F03 |
| `/templates/new` | Program Manager | F02 B; สร้างแม่แบบ title/description/unit/range |
| `/goals`, `/goals/new?templateId=...` | Participant | F03 A; server ตรวจแม่แบบ active และเจ้าของ ห้ามใช้ query เป็นหลักฐานสิทธิ์ |
| `/goals/:goalId` | Participant | F03 รายละเอียด goal + F04 วันที่/ฟอร์ม entry/ผลรายวัน; B ประสานจุดเชื่อมกับ A |
| history, lifecycle, schedule, summary routes | ตามบทบาทของ feature | F05–F08 กำหนดใน contract ของ Sprint 2/3 ก่อน code ไม่ถือว่า routes นี้มีแล้ว |

แสดงชื่อผู้ใช้/บทบาทจาก F01 และปุ่ม logout ใน shared layout; ไม่มี role selector ที่เปลี่ยนสิทธิ์ได้ เมนูขึ้นกับ role เพื่อช่วยใช้งาน แต่ทุก API ตรวจสิทธิ์เอง Program Manager ไม่เห็นลิงก์ประวัติส่วนตัวและ API ก็ปฏิเสธจริง B ประสาน router/layout โดยยังไม่สร้าง scaffold ซ้ำกับ A

## 2. States และการกู้คืน

| State | พฤติกรรมที่ต้องระบุในแต่ละหน้าจอ |
|---|---|
| Loading/read | แสดงข้อความกำลังโหลดที่เข้าถึงได้; ไม่แสดง empty ก่อนรู้ผล; เมื่อเปลี่ยน goal/date ทิ้ง response เก่าที่มาช้า |
| Empty | แม่แบบว่างให้ข้อความชัดเจนและ manager มี action สร้าง; ไม่มี entry ให้แสดงว่ายังไม่บันทึก พร้อม 0/target และ entry=null แยกจาก saved entry |
| Validation | label/หน่วย/ช่วงที่ยอมรับ, field error และ focus ช่องแรกที่ผิด; validate client เพื่อ feedback แล้ว validate server ซ้ำ; รักษาค่าที่พิมพ์ |
| Saving | disable submit ระหว่างคำขอ แจ้งกำลังบันทึก; ไม่เพิ่มแถวสำเร็จจน server ยืนยัน; daily entry ใช้ database กัน duplicate สุดท้ายตาม F04 |
| Success | แสดงค่าที่ server คืนและ refetch ได้; route reload เรียก API ใหม่ ไม่ใช้ข้อมูลใน memory เป็นหลักฐาน persistence |
| 401/session expired | ล้าง cache ข้อมูลส่วนตัวและนำไป login; ไม่แสดงข้อมูลค้างของบัญชีก่อนหน้า; ไม่ retry การเขียนอัตโนมัติหลัง login |
| 403 | แจ้งไม่มีสิทธิ์; ถ้า CSRF_FAILED ให้ refresh session/token ตาม F01 โดยไม่ส่ง mutation ซ้ำอัตโนมัติ |
| 404 | แจ้งไม่พบข้อมูลหรือเข้าถึงไม่ได้โดยไม่เผยว่ามีของใคร |
| 409 duplicate | แจ้งวันนั้นมีบันทึกแล้ว; GET progress ของ goal/date เดิมเพื่อแสดงรายการจริง ไม่ overwrite |
| Network/5xx | เก็บ input และมี retry สำหรับ read; mutation ที่ไม่รู้ผลอาจบันทึกสำเร็จแล้ว ให้ GET ก่อนตัดสินใจ retry; ถ้าพบ entry ให้แสดงผลจริง ถ้าไม่พบจึงให้ผู้ใช้ส่งใหม่ |

ใช้ภาษาไทยกับผู้ใช้, วันที่แสดงในบริบท Asia/Bangkok, label ว่านาที; field/API keys ภาษาอังกฤษ ตัวเลข percent แสดงสูงสุด 2 ตำแหน่งโดยไม่ cap ที่ 100; achieved ใช้ผล server ไม่ใช้เลขที่ปัดบน UI ใช้ label ที่ผูกกับ input, keyboard navigation, focus/error text และไม่พึ่งสีอย่างเดียว เป็นข้อเสนอ usability ที่ต้องใส่เกณฑ์วัด/ตรวจร่วมกับ SRS

## 3. Transport, identity และ validation

- Prefix `/api/v1`; JSON UTF-8; `Content-Type: application/json` สำหรับ body; methods GET สำหรับอ่านและ POST สำหรับสร้าง/คำสั่ง ชื่อ resource พหูพจน์ kebab-case; IDs เป็น opaque string ไม่สมมติรูปแบบเลขหรือ UUID ใน UI
- Session ฝั่ง server ผ่าน HttpOnly cookie ตามข้อเสนอเดิม; client ส่ง credentials โดยไม่ส่ง ownerId/userId/role เพื่อพิสูจน์ตัวตน; server ใช้ principal `{id, role}` ที่ middleware ยืนยันแล้ว ค่า role ที่เสนอ `PARTICIPANT`, `PROGRAM_MANAGER`
- Resource ownership ตรวจโดย query ที่ scope owner บน server ก่อนคืน/เขียนข้อมูล; ไม่โหลดแล้วส่ง private fields มาก่อนตรวจ; manager ไม่มี bypass เมื่อเรียก personal endpoint
- Request รับเฉพาะ keys ใน contract; unknown keys ให้ 422 โดยเฉพาะ ownerId/userId/role ที่ไม่รับใน feature payload และ target/progress ที่ห้าม client กำหนดผ่าน F04; F03 รับ targetMinutes ที่ผู้ใช้ตั้งได้ตาม contract ของ F03; จำนวนเต็ม JSON number เท่านั้น ไม่ coerce string/boolean/null/fraction; trim string ที่ระบุและตรวจความยาวหลัง trim; server ไม่เชื่อ validation ของ browser
- `entryDate`, `startsOn`, effective date เป็น calendar date `YYYY-MM-DD` ต้องเป็นวันที่มีจริง; ห้าม parse วันที่ท้องถิ่นผ่าน UTC จนเลื่อนวัน ฐานข้อมูลควรเป็น DATE; instants เช่น createdAt/updatedAt เป็น ISO 8601 UTC ที่ลงท้าย Z
- เวลาปัจจุบันเพื่อกฎใช้ server clock แปลง Asia/Bangkok; UI อาจ default จาก client เพื่อความสะดวกแต่ API มีอำนาจตัดสิน; A/B ต้องตกลงวิธีส่ง businessDate ให้ UI และทดสอบด้วย clock ที่ควบคุมได้
- เสนอ `Cache-Control: no-store` บน auth และ personal responses เพื่อไม่ cache ข้ามบัญชี; ล้าง private client cache เมื่อ logout/401; log ไม่เก็บ password/session/CSRF token หรือเนื้อหาส่วนตัวที่ไม่จำเป็น

## 4. Response/error shapes

Success เป็น `{ "data": ... }`; collection เป็น `{ "data": [] }`; read 200, create 201; logout เสนอ 200 `{ "data": null }` การเพิ่ม pagination/meta ภายหลังต้องแก้ contract ไม่ให้ client เดาจาก response บางหน้า

ตัวอย่างต่อไปนี้เป็นข้อมูลสังเคราะห์เพื่ออธิบายรูปแบบ ไม่ใช่ผล execution:

```json
{"data":{"id":"template-example","title":"อ่าน CPE 334","description":"","unit":"minute","minMinutes":1,"maxMinutes":1440,"isActive":true,"createdAt":"2026-11-03T03:00:00.000Z","updatedAt":"2026-11-03T03:00:00.000Z"}}
```

```json
{"error":{"code":"VALIDATION_ERROR","message":"กรุณาตรวจข้อมูลที่กรอก","fields":{"minutes":["ต้องเป็นจำนวนนาทีเต็มในช่วงของเป้าหมาย"]}}}
```

Error มี `error.code` คงที่ให้ client ตัดสิน, `message` ที่อ่านเข้าใจ, `fields` เป็น object field → string[] เฉพาะ validation เมื่อเกี่ยวข้อง; ไม่ส่ง stack/SQL/ชื่อ constraint/ข้อมูลเจ้าของ resource หรือ password กลับไป Client แสดงข้อความที่ปลอดภัยและไม่ parse database error string

| HTTP | code ที่เสนอ | ความหมาย |
|---|---|---|
| 400 | BAD_REQUEST | JSON syntax เสียหรือ request envelope อ่านไม่ได้ |
| 401 | UNAUTHENTICATED | ไม่มี session/หมดอายุ/ถูก revoke รวมหลัง logout |
| 403 | FORBIDDEN | login แล้วแต่ role ไม่อนุญาต |
| 403 | CSRF_FAILED | mutation ไม่มี/ผิด CSRF token ตาม F01 |
| 404 | NOT_FOUND | ไม่มี resource หรือไม่ใช่ owner ใช้ shape/message เดียวกัน |
| 409 | ENTRY_EXISTS | goal/date มี daily entry แล้ว รวม unique conflict พร้อมกัน |
| 409 | GOAL_NOT_ACTIVE | owner พยายามบันทึก goal ที่หยุดแล้ว; F05 ต้องยืนยัน lifecycle ก่อนเปิดใช้ |
| 422 | VALIDATION_ERROR | field/date/range/unknown keys ไม่ตรง contract |
| 415 | UNSUPPORTED_MEDIA_TYPE | ส่ง mutation body ที่ไม่ใช่ JSON |
| 500 | INTERNAL_ERROR | ข้อผิดพลาดไม่คาดหมาย ข้อความทั่วไปไม่มีรายละเอียดภายใน |

กำหนดลำดับที่เสนอ: ตรวจ transport ที่อ่านไม่ได้ → session → role → CSRF สำหรับ mutation → ownership → feature validation → database write เมื่อ request ซ้อนหลายข้อผิดพลาดไม่ต้องใช้ status ทดแทนกันใน tests ให้แต่ละ security case ใช้ payload/token ที่ถูกต้องเพื่อพิสูจน์ชั้นที่ตั้งใจ; anonymous ต้องไม่คืน private data ในทุกกรณี

## 5. Shared API/dependency boundary ที่ขอ A ยืนยัน

ทุก path ในตารางต่อจาก `/api/v1`; เป็น interface proposal ยังไม่มี route จริง

| Interface | Owner | สิ่งที่ B ต้องใช้/ข้อตกลงก่อน code |
|---|---|---|
| POST `/auth/login`, POST `/auth/logout`, GET `/auth/me` | F01 A | login/me คืน identity ที่เชื่อได้; logout revoke session server และ cookie; expiry/lifetime/error ไม่เดาจาก UI; A ระบุ schemas ใน F01 contract |
| GET `/auth/csrf` → `{data:{csrfToken:string}}`; header `X-CSRF-Token` บน mutation รวม login/logout | F01 A | ข้อเสนอ synchronizer token ที่ผูก session/pre-login flow; A ยืนยันการ rotate หลัง login/logout, cookie/origin policy และวิธี bootstrap ก่อน B ใช้ ห้ามสมมติว่า SameSite อย่างเดียวพอ |
| GET/POST `/activity-templates` | F02 B | list active สำหรับทั้งสองบทบาท; create เฉพาะ manager; ไม่มี participant data ใน template response |
| Goal create/read (ชื่อ endpoint ให้ A ยืนยันใน F03) | F03 A | อ่านแม่แบบจาก DB/recheck active; owner จาก session; snapshot unit/min/max; startsOn; active status; initial target version และ resolve target ตาม date |
| POST `/goals/:goalId/entries`; GET `/goals/:goalId/progress?date=YYYY-MM-DD` | F04 B | owner-only Participant; JSON/date/progress ชุดเดียวตาม F04; DB unique goal/date; GET สำหรับ reload/reconcile |

ข้อมูลขั้นต่ำภายในที่ F04 ต้องได้รับจาก A: owned goal `{id,ownerId,startsOn,status,unit,minMinutes,maxMinutes}` และ resolver ผล `{targetVersionId,targetMinutes}` ที่มีผลใน `entryDate` ชื่อตาราง/field ภายในให้ A รวมกับ ER/Prisma ทีเดียว B ไม่เพิ่ม auth middleware หรือ migration เองก่อนตกลง

## 6. Role/ownership matrix ที่เสนอร่วมกัน

| Operation | Anonymous | Participant เจ้าของ | Participant คนอื่น | Program Manager |
|---|---|---|---|---|
| List active templates | 401 | 200 | 200 (ไม่ใช่ข้อมูลส่วนตัว) | 200 |
| Create template | 401 | 403 | 403 | 201 เมื่อข้อมูล/token ถูกต้อง |
| Create/read goal | 401 | ตาม F03 contract | ไม่คืนข้อมูลคนอื่น; read 404 | 403 |
| Create daily entry/read daily progress | 401 | 201/200 เมื่อผ่านกฎ | 404 แบบเดียวกับ goal ไม่มี | 403 แม้รู้ goal ID |
| History/summary/schedule หลังเพิ่ม | 401 | owner-only ตาม contract | 404/filtered list ตาม contract | ไม่มีสิทธิ์ข้อมูลส่วนตัว |

ทดสอบบัญชี Participant สังเคราะห์ **P1/P2** แยกจากชื่อสมาชิกทีม A/B เสมอ เพื่อไม่สับสนระหว่างผู้พัฒนาและเจ้าของข้อมูล

## 7. ประเด็นตัดสินใจและความพร้อม

รอ A ตอบ SRS IDs/BR และ NFR, stack/version/package manager, auth principal/role spelling, login/me/logout/CSRF shapes, session idle/absolute expiry และ revoke, dev/prod origin/cookie/Secure/SameSite/CORS policy, goal snapshot/target-version model, schema/constraint/error translation, test DB/seed/clock และจุดเชื่อม goal screen ต้องบันทึกคำตอบ/revision และ review contracts ก่อน code

A ประสาน schema/migrations/package/lockfile/auth middleware; B ประสาน UI router/layout และ error consumers ตาม team plan การตัดสินใจนี้ยังไม่อนุญาตแก้ shared files โดยพลการ หลังตกลงให้เพิ่มกรณี 401/403/404/422/409 และ CSRF ที่เกี่ยวข้องใน STS ของแต่ละ feature; foundation tests อยู่ F01, feature tests ต้องพิสูจน์ว่ามี enforcement จริง

| Revision | สิ่งที่เปลี่ยน | สถานะ review/execution |
|---|---|---|
| B-draft-01 — 3 พ.ย. 2026 | เสนอ screens/states/JSON/errors/roles/dependencies เพื่อรอ A รวม System SDS | Codex ร่างให้ B; A ยังไม่ review; ยังไม่ implement/รันทดสอบ |
