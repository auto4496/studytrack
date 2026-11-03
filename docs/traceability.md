# StudyTrack - Requirements and verification traceability

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | ผู้ร่าง: สมาชิก B | รุ่น: B-draft-01

สถานะ: **DRAFT / SRS mapping pending / verification not run** ตารางนี้เป็นโครง mapping จาก [project brief](project-brief.md) ไป [features](features.md) และ [Sprint plan](sprints/plan.md) ยังไม่ใช่คำยืนยันว่าครอบคลุม SRS ที่ A กำลังร่างครบแล้ว

## 1. กติกาและช่องว่างสำคัญ

ยังไม่พบ `docs/srs.md` ในชุดเริ่มต้น จึงไม่สร้าง FR/NFR IDs สมมติ ส่วน BR-01 ถึง BR-10 เป็น **รหัสข้อเสนอใน brief §4** เท่านั้น คอลัมน์ SRS ของทุกแถวรอ A ส่งรหัสและข้อความจริง หาก A เปลี่ยนรหัสให้เก็บ source reference เดิมและบันทึกการเปลี่ยน ไม่อ้างว่าร่าง BR ได้รับการยืนยันแล้ว

หลักเกณฑ์: [D1](../sources/project_deliverable_1_v1.pdf) หน้า 2, 4, 6-7 ให้ baseline ทั้งผลิตภัณฑ์มี feature/responsibility และ sprint allocation; Sprint 1 AC ต้องมี planned tests และภายหลังต้องเชื่อม actual file/name/results/commit ส่วน [D2](../sources/project_deliverable_2_v1.pdf) หน้า 3 และ [Final](../sources/project_final_delivery_v1.pdf) หน้า 3 ให้ matrix ครบถึง execution และ version โดยเปิดเผยงานที่ incomplete/failed/skipped

สถานะ `planned` แปลว่ามีแผนตรวจเท่านั้น; `not run` แปลว่ายังไม่มี execution; ไม่เท่ากับ PASS หรือ accepted การอ้าง contract ด้านล่างใช้รายการ AC/STS ใน contract เป็นหลักเมื่อแก้รายละเอียด

## 2. Capability mapping ทั้งผลิตภัณฑ์ (FR รอ SRS)

| แหล่งปัจจุบัน / พฤติกรรม | SRS requirement ID | Feature / owner | Sprint | Verification target และ planned mapping | Actual result / version |
|---|---|---|---|---|---|
| Brief §2-3, §7: login/logout/current user และ role/ownership | รอ FR/NFR ของ A | F-01 / A | 1; regression 2-3 | F-01 contract/AC/STS รอ A; valid/invalid login, expired/logged-out session, anonymous/role/ownership API | Not run / ยังไม่มี commit |
| Brief §3, §5: Manager สร้าง template; Participant เลือก active | รอ FR ของ A | F-02 / B | 1 | [F-02 contract](sprints/sprint-1/f02-templates.md): AC-F02-01 ถึง AC-F02-09 → TEST-F02-01 ถึง TEST-F02-11; รายละเอียดตาม STS และ ledger §5 | Not run / ยังไม่มี commit |
| Brief §3, §5: ตั้งและเรียกเป้าหมายของตน | รอ FR ของ A | F-03 / A | 1 | F-03 contract/AC/STS รอ A; API/DB goal creation/retrieval + own-user UI | Not run / ยังไม่มี commit |
| Brief §3, §5: บันทึก daily entry และอ่าน persisted progress | รอ FR ของ A | F-04 / B | 1 | [F-04 contract](sprints/sprint-1/f04-entries-progress.md): AC-F04-01 ถึง AC-F04-12 → TEST-F04-01 ถึง TEST-F04-16; รายละเอียดตาม STS และ ledger §5 | Not run / ยังไม่มี commit |
| Brief §5: goal revision/stop และ template lifecycle | รอ FR ของ A | F-05 / A | 2 | Contract/AC/STS ก่อน code; history preservation, inactive-template and stopped-goal behavior | Planned; not run / ยังไม่มี commit |
| Brief §5: history/date filtering/edit/streak | รอ FR ของ A | F-06 / B | 2 | Contract/AC/STS ก่อน code; own history retrieval/edit และ target-version/streak recompute | Planned; not run / ยังไม่มี commit |
| Brief §5-6; Group Specs หน้า 8: schedule/reminder representation | รอ FR ของ A | F-07 / A | 3 | Contract/AC/STS ก่อน code และครบภายใน D2; persist/reload own schedule + visible in-app status | Planned; not run / ยังไม่มี commit |
| Brief §5; Group Specs หน้า 8: progress summaries | รอ FR ของ A | F-08 / B | 3 | Contract/AC/STS ก่อน code และครบภายใน D2; real period summary และ rule/ownership tests | Planned; not run / ยังไม่มี commit |

## 3. Business rule mapping จาก brief (รอยืนยันเป็น SRS)

| Draft source ID / ข้อเสนอ | SRS requirement ID | Feature / Sprint ที่สร้างและตรวจ | Verification ที่วางแผนไว้ | สถานะ |
|---|---|---|---|---|
| BR-01: integer minutes; template range 1-1440; min ≤ max | รอ A ยืนยัน/ให้รหัส | F-02/F-03/F-04 / 1 | AC-F02-02 → TEST-F02-02/03; F-03 target bounds รอ A; AC-F04-05 → TEST-F04-07/08 | Proposed; not run |
| BR-02: target ในช่วง template; วันเริ่มตามที่ brief เสนอ | รอ A ยืนยัน/ให้รหัส | F-03 / 1; F-04 ใช้ startsOn | F-03 contract รอ A; B เสนอตีความวันเริ่มเป็นเฉพาะวันนี้หรือพรุ่งนี้เพื่อให้ A ยืนยัน; AC-F04-04 → TEST-F04-05/06 ปฏิเสธก่อน startsOn | Proposed; not run |
| BR-03: active goal ไม่เกินหนึ่งต่อ user/template | รอ A ยืนยัน/ให้รหัส | F-03 / 1; F-05 / 2 | F-03 API/DB uniqueness รวม race; F-05 stop/reactivate policy ต้องตกลงก่อน contract | Proposed; not run |
| BR-04: entry ไม่เกินหนึ่งต่อ goal/local date รวม concurrent requests | รอ A ยืนยัน/ให้รหัส | F-04 / 1; F-06 / 2 | AC-F04-06/07 → TEST-F04-09/10; assert แถวเพิ่มเพียงหนึ่ง; F-06 edit ไม่สร้างแถวซ้ำ | Proposed; not run |
| BR-05: startsOn ≤ entryDate ≤ วันนี้ Bangkok; minutes ในช่วง | รอ A ยืนยัน/ให้รหัส | F-04 / 1; F-06 / 2 | AC-F04-04/05 → TEST-F04-05 ถึง TEST-F04-08; valid/invalid calendar, future, before-start, timezone และ min/max; F-06 edit ใช้กฎเดียวกัน | Proposed; not run |
| BR-06: actual/target × 100; ไม่ cap; achieved เมื่อ actual ≥ target | รอ A ยืนยัน/ให้รหัส | F-04 / 1; F-06 / 2; F-08 / 3 | AC-F04-03 → TEST-F04-03/04; 45/60=75, 75/60=125, exact target/rounding; summaries ต้องใช้ target ของวันนั้น | Proposed; not run |
| BR-07: own private data only; Manager ไม่มี private-data privilege | รอ A ยืนยัน/ให้รหัส | F-01 ทุก endpoint / 1-3 | AC-F02-04/05 → TEST-F02-05/06; AC-F04-08/09 → TEST-F04-11/12/13; F-01/F-03 รอ A; F-05..08 ตรวจ access paths เพิ่ม | Proposed; not run |
| BR-08: target ใหม่มีผลวันถัดไปและไม่เปลี่ยนอดีต | รอ A ยืนยัน/ให้รหัส | F-05 / 2; F-04/F-06/F-08 consumers | AC-F04-10 → TEST-F04-14 ตรวจ initial-target dependency; Contract F-05 ต้องกำหนด revision หลายครั้งก่อนมีผลและเพิ่ม effective-date/history regression ใน S2 | Proposed; not run |
| BR-09: streak จากวันที่ actual ≥ target ตาม local dates | รอ A ยืนยัน/ให้รหัส | F-06 / 2; F-08 / 3 | ก่อน code ตกลง today-not-complete/current streak; unit gap/today/date boundary/versioned target และ recompute หลัง edit | Proposed; not run |
| BR-10: inactive template ห้าม goal ใหม่; goal เดิมใช้ข้อมูลเดิมต่อ | รอ A ยืนยัน/ให้รหัส | F-05 / 2; F-02/F-03/F-04 regression | AC-F02-03 → TEST-F02-04 (seed active list); AC-F04-10 → TEST-F04-14 (snapshot consumer); F-05 เพิ่ม lifecycle/new-goal rejection regression S2 | Proposed; not run |

## 4. Cross-cutting requirements / important NFR ที่เสนอให้ A บรรจุ SRS

นี่เป็น **verification targets ที่ B เสนอ** ยังไม่ใช่ NFR ที่รับแล้ว และไม่มีการเพิ่ม performance SLA โดยไม่มีข้อตกลง

| Source / responsibility | SRS ID | Proposed measurable target / วิธีตรวจ | Feature และ Sprint | สถานะ |
|---|---|---|---|---|
| Brief §2, §7-8; backend access/privacy | รอ FR/NFR ของ A | ทุก negative access case ที่รับใน STS ถูกปฏิเสธและไม่คืน private data; ตรวจ status/payload และจำนวนแถวก่อนหลังผ่าน API/DB | F-01..04 สร้าง/ตรวจ S1; F-05..08 เพิ่มและ regression S2-S3 | Proposed; not run |
| Brief §3, §8; full-stack persistence | รอ NFR ของ A | สร้างข้อมูลผ่าน API แล้วเรียกใหม่ได้หลัง UI reload และ application restart; Lab 5/Final ตรวจ restart/redeploy ตามระบบที่เลือก | ทุก feature; S1 local, Lab 5 และ S2-S3 | Proposed; not run |
| Brief §4, §8; dates/calculations | รอ BR/NFR ของ A | ชุดกรณีที่รับไว้ได้ผลตรง expected แบบ fixed-clock ที่ก่อน/หลังเที่ยงคืน Bangkok; target version ไม่ทำ historical result เปลี่ยน | F-03/F-04 S1; F-05/F-06 S2; F-07/F-08 S3 | Proposed; not run |
| Brief §7-8; safe errors/credentials/config | รอ FR/NFR ของ A | Error responses ที่ทดสอบไม่แสดง stack/SQL/session secret; config ตัวอย่างไม่มี real secret; protected response ตาม conventions | F-01 foundation + ทุก feature S1-S3 | Proposed; not run |
| D1 หน้า 3, 7; reproducibility | รอ NFR ของ A | อีกสมาชิกทำ fresh setup ตาม README ด้วย synthetic seed/test DB และรัน workflow/build/tests ตามคำสั่งที่บันทึกได้ | Shared foundation S1; Docker/CI/GCP Lab 5; current setup S2-S3 | Proposed; not run |
| D1 หน้า 3; UI validation/loading/empty/error | รอ FR/NFR ของ A | UI cases ที่รับใน contract แสดง state/feedback และ retry ได้ตาม [conventions](ui-api-conventions.md); ไม่ใช้ hidden control แทน permission | F-01..04 S1; F-05..08 S2-S3 | Proposed; not run |

## 5. Execution ledger สำหรับเติมหลังเขียน tests/implementation

STS ใน F-02/F-04 เป็นแหล่ง test IDs และ AC coverage ต่อ feature; ตารางนี้ให้ **หนึ่งแถวต่อ planned test ของ B** โดย actual file/name/command/count/result/commit ยังไม่มี ภายหลังให้ขยายกรณี parameterized ตามผลจริงและเพิ่ม tests ของ A/measurement เมื่อมี contract ห้ามใช้แถวระดับ feature ที่ยัง pending แทนผลราย AC ในงานส่ง

| Feature / planned ID scope | AC/target | Implemented? | Actual file / test name | Command / CI run | Passing / failing / skipped counts | Result | Tested commit / date |
|---|---|---|---|---|---|---|---|
| F-01 / รอ STS จาก A | รอ contract A | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-01 | AC-F02-01 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-02 | AC-F02-02 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-03 | AC-F02-02 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-04 | AC-F02-03 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-05 | AC-F02-04 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-06 | AC-F02-05 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-07 | AC-F02-06 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-08 | AC-F02-07 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-09 | AC-F02-08 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-10 | AC-F02-06, AC-F02-09 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F02-11 | AC-F02-01 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| F-03 / รอ STS จาก A | รอ contract A | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-01 | AC-F04-01, AC-F04-02 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-02 | AC-F04-02 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-03 | AC-F04-03 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-04 | AC-F04-03 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-05 | AC-F04-04 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-06 | AC-F04-04 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-07 | AC-F04-05 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-08 | AC-F04-05 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-09 | AC-F04-06 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-10 | AC-F04-07 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-11 | AC-F04-08 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-12 | AC-F04-08, AC-F04-09 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-13 | AC-F04-09 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-14 | AC-F04-10 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-15 | AC-F04-11 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| TEST-F04-16 | AC-F04-02, AC-F04-11, AC-F04-12 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| F-05/F-06 / contract Sprint 2 รอจัดทำ | Planned verification ใน §2-4 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |
| F-07/F-08 / contract Sprint 3 รอจัดทำ | Planned verification ใน §2-4 | ยังไม่มี | ยังไม่มี | ยังไม่รัน | ยังไม่มี execution counts | Not run | ยังไม่มี |

เมื่อรันจริงให้เก็บ ID→file/name→command/CI run→counts/result→commit รวม failed/skipped/incomplete และแยก automated/manual; meaningful TDD บันทึก red และ green คนละ version พร้อมอธิบาย failure ที่ตรง intended behavior ไม่ใช้ setup/import error แทน rule failure

## 6. Coverage gaps และขั้นตอนปิดช่องว่าง

| ช่องว่าง ณ รอบนี้ | Owner / next action | ต้องพร้อมเมื่อใด |
|---|---|---|
| ยังไม่มี SRS FR/BR/NFR ที่ทั้งคู่ยืนยัน จึงยังวัด baseline coverage เต็มไม่ได้ | A ส่ง SRS; B map ทุกแถวและค้น uncovered/extra requirements; ทั้งคู่บันทึก decision | ก่อนยืนยัน baseline/เริ่ม implementation ที่เกี่ยวข้อง |
| F-01/F-03 contract และ shared auth/data interfaces ยังรอ A | A ส่ง SDS/ER/contracts; B review; เชื่อม AC/tests จริงโดยไม่เดา IDs | ก่อน F-02/F-04 implementation ที่พึ่ง interface นั้น |
| F-02/F-04 เป็นร่าง ยังไม่ได้ A review/รับ | A ตรวจ rules/interfaces/AC/STS; B แก้และบันทึก revision | ก่อน tests/implementation ตาม contract ที่รับ |
| F-05..08 ยังเป็น scope และ verification plan | Owners เขียน contract/AC/STS ก่อน code; S2 ครบก่อน release, S3 contracts ทั้งหมดครบภายใน D2 | ตาม [Sprint gates](sprints/plan.md) |
| ไม่มี executable tests/results/release/PR/UAT | Owners เติม ledger หลังทำจริง; reviewer ตรวจ assertion/evidence; ใช้ commit/version จริง | D1/D2/Final ตาม checkpoint |

รายการ approved baseline changes: **ยังไม่มีที่ยืนยันในชุดนี้** ถ้ามีภายหลังให้บันทึกวันที่/source/reason/affected IDs/decision maker/version แล้วปรับ inventory, contracts, STS และ matrix โดยรักษาประวัติเดิม

| รุ่น / วันที่ | การเปลี่ยน | การยืนยัน |
|---|---|---|
| B-draft-01 / 3 พ.ย. 2026 | โครง capability/BR/cross-cutting mapping และ execution ledger; SRS IDs ทั้งหมดยัง pending | รอ A/B; tests not run |
