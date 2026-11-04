# StudyTrack — ขั้นตอนส่งตรวจตาม TokTickIT

บันทึกโดยสมาชิก B (Datakung), 3 พฤศจิกายน 2026 ตามคำขอให้ใช้ flow ส่งตรวจจาก TokTickIT เป็นแนวทาง ทีม A/B ใช้ repository กลางเดียวกัน ขั้นตอนนี้ขยายข้อ 4 ของ [team plan](team-plan.md); ไม่ใช่หลักฐานว่า A อนุมัติงาน B แล้ว หรือมีการตั้ง branch protection/CI แล้ว

## 1. สิ่งที่ตรวจจากงานเดิม

อ่าน README หัวข้อ Git workflow และ `docs/lab-04/reviewer.md` จาก `C:/CPE/CPE334/MINE/toktickit` โดยไม่แก้ไฟล์ของ TokTickIT แล้วตรวจ GitHub ของตัวอย่างต่อไปนี้จริง:

| ตัวอย่าง | ขั้นตอนที่เกิดขึ้นจริง | ใช้กับ StudyTrack อย่างไร |
|---|---|---|
| [TokTickIT PR #45](https://github.com/Datakung/toktickit/pull/45), Issue #39 | Contract เข้า `lab4-staging`; auto4496 ขอแก้ที่ e11ae78 แล้วอนุมัติ ff97405 ก่อน merge | ส่ง requirement/contract/test plan ให้คู่ทีมตรวจ ก่อนเริ่ม implementation ของงานถัดไป |
| [TokTickIT PR #51](https://github.com/Datakung/toktickit/pull/51) | Release จาก `lab4-staging` เข้า `main`; auto4496 อนุมัติ 9b5d3a5 และเป็นผู้ merge | รวม feature ที่ผ่าน review ใน sprint staging แล้วเปิด release PR ให้คู่ทีมตรวจอีกครั้ง |
| TokTickIT Lab 4 review record, หัวข้อ final-main และ evidence PR #52 | หลัง release ยังตรวจ clean main และหลักฐาน/PDF; เคยเปิด release Issue กลับเมื่อ Done ก่อนครบงาน | แยก feature acceptance, integrated release และรายงานส่ง; ปิดแต่ละงานเมื่อผ่านเกณฑ์ของงานนั้นจริง |

TokTickIT เดิมมี repository ของแต่ละคนและรีวิวข้ามกัน ส่วน StudyTrack ใช้ `auto4496/studytrack` ร่วมกัน: **A เขียน → B review; B เขียน → A review**. ไม่ต้องทำฟีเจอร์เดียวกันซ้ำคนละ repository

## 2. Flow ที่ใช้ส่งตรวจ

1. **Issue / Ready:** ระบุ owner, FR/BR/NFR, AC, dependencies และ contract/test plan ให้คู่ทีมตรวจข้อกำหนดและ interface ก่อนเขียน product code; เก็บข้อเสนอแก้และข้อสรุปจริง
2. **In progress:** แตก feature branch จาก `codex/sprint-1-staging` ล่าสุดที่ dependency ผ่าน review แล้ว ทำ tests → implementation → ตรวจผลและ diff; งานที่เป็นอิสระทำคู่ขนานได้
3. **In review:** เปิด PR เข้า `codex/sprint-1-staging` ระบุ Issue, contract, scope, source commit, วิธีทดสอบ, ผลจริง, ข้อจำกัด และหลักฐาน red/green ตามงาน ผู้เขียนไม่ approve งานตนเอง
4. **แก้ตาม review:** คู่ทีมอ่าน diff/assertions และทดลองตามขอบเขตที่บอกไว้ ระบุ finding กับตำแหน่ง/เหตุผลจริง ผู้เขียนแก้บน PR เดิม ตอบแต่ละ finding พร้อม correction commit และผลตรวจ แล้วขอ review ซ้ำ; เมื่อยังมี blocking finding ห้าม merge
5. **รับ feature:** คู่ทีมตรวจ revision ล่าสุดและอนุมัติ เมื่อ checks/ข้อแก้ครบ ให้ผู้ review merge ตามสิทธิ์ที่ทีมกำหนด แล้วตรวจผลรวมใน staging เก็บ review/merge links และอัปเดต Issue/board ตาม AC จริง
6. **Release:** B เตรียม PR จาก `codex/sprint-1-staging` เข้า `main` ตาม team plan หลัง integration/system/acceptance checks ผ่าน; A review ก่อน merge ไม่ส่ง feature เข้า main ข้าม staging
7. **ตรวจและส่งงาน:** ตรวจ clean main ที่ merge แล้ว บันทึก accepted SHA, ผลทดสอบ/ขั้นตอนรัน และ known gaps; จัดรายงาน/PDF ให้ลิงก์ไปหลักฐานที่ตรง revision แยกผลของผู้เขียน, ผู้ review และ UAT ชัดเจน Release/report Issue ยังเปิดจนเกณฑ์ของงานนั้นครบ

ใช้สถานะ board เดิม Backlog / Ready / In progress / In review / Done; ถ้าต้องแก้ให้กลับ In progress และระบุว่ากำลังแก้ review โดยไม่สมมติว่ามีคอลัมน์ Fixing อยู่แล้ว การเปลี่ยน board/Issue ต้องเกิดขึ้นจริงก่อนบันทึกสถานะ

PR เข้า staging ต้องเชื่อม Issue อย่างชัดเจนผ่าน body และ Development linkage ที่ตรวจได้ อย่าพึ่ง auto-close จากข้อความเพียงอย่างเดียวเมื่อ base ไม่ใช่ default branch; ตรวจสถานะ Issue และ board หลัง acceptance จริง

## 3. พา PR ปัจจุบันกลับเข้า flow

**อัปเดต 4 พ.ย. 2026 หลังA review:** PR3/6/7 APPROVEDและMERGEDเข้าstagingแล้ว; latest85f510f. PR7 retargetเข้าstagingและรับaccepted F02ก่อนAตรวจ/ทดสอบงานรวม117API+24browser/build/restart. รอบfeatureไม่มีblocking findingsค้าง. ขั้นถัดไปคือreviewเอกสารสถานะและrelease PRจากstagingเข้าmain ตาม [release readiness](handoffs/sprint-1-release-readiness.md). ตารางด้านล่างเป็นsnapshot3พ.ย.ก่อนแก้/อนุมัติ ไม่ใช่สถานะปัจจุบัน

สถานะต่อไปนี้ตรวจ GitHub วันที่ 3 พฤศจิกายน 2026; เป็น snapshot ไม่ใช่สถานะสดตลอดเวลา

| PR | สถานะและ base ที่ตรวจพบ | ขั้นตอนต่อไป |
|---|---|---|
| [#3 งาน A](https://github.com/auto4496/studytrack/pull/3) | OPEN, CHANGES_REQUESTED ที่ 2370df9; base `codex/sprint-1-staging` | A แก้ test-DB guard; B ตรวจ correction/new head และ regression ก่อนอนุมัติ รายละเอียดใน [PR3 review](reviews/pr-3-member-b.md) |
| [#6 F02 งาน B](https://github.com/auto4496/studytrack/pull/6), Issue #4 | DRAFT OPEN, ยังไม่มี review; base `codex/member-a-sprint1` | หลัง #3 ผ่านและ merge เข้า staging ให้ B sync/rebase หรือ merge accepted staging ตามประวัติจริง แก้ conflicts และ retarget PR เดิมเข้า `codex/sprint-1-staging`; ตรวจ diff ให้เหลือ F02/เอกสารที่เกี่ยวข้อง รันทดสอบใหม่ แล้วส่ง A review |
| [#7 F04 งาน B](https://github.com/auto4496/studytrack/pull/7), Issue #5 | DRAFT OPEN, ยังไม่มี review; base `codex/f02-templates` | หลัง #6 ผ่านและ merge ให้ B sync กับ accepted staging แก้ conflicts และ retarget PR เดิมเข้า `codex/sprint-1-staging`; ตรวจ diff ให้เหลือ F04/เอกสารที่เกี่ยวข้อง รันทดสอบใหม่ แล้วส่ง A review |

**ลำดับรับ dependency ปัจจุบัน: #3 → #6 → #7 → integration → release PR → final-main verification/รายงาน.** การ review contracts และเตรียมงานอิสระยังทำคู่ขนานได้

การตั้ง base ต่อ branch ของเพื่อนใน #6/#7 เป็นสถานะชั่วคราวขณะ foundation ยังไม่ผ่าน review ไม่ใช่เป้าหมาย merge ตาม flow ปกติ ไม่ต้องเปิด PR ใหม่หรือเขียนทุกอย่างใหม่ แต่ต้องปรับงานที่ได้รับผลจากการแก้ของ A และทดสอบบนฐานใหม่จริงก่อนเอา draft ออก ห้าม merge #6 เข้า feature branch ของ A หรือ #7 เข้า F02 เพื่อข้ามขั้นตอนนี้

B มีเอกสารก่อน implementation และผลทดสอบเก็บตาม source commit แล้ว แต่ #6/#7 ยังไม่มี A review/approval จึงไม่อ้างย้อนหลังว่า contracts ได้รับ peer approval ก่อนเขียนโค้ด ให้ A ตรวจ contract และ implementation ที่เกี่ยวข้องใน PR เหล่านี้ด้วย และแก้ทั้งสองส่วนหากมีข้อขัดแย้ง

ผลเดิมของ F02 ที่ a3769d4 (64 API/unit + 6 browser) และงานรวม F04 ที่ 0b51571 (115 API/unit + 24 browser, build/restart ผ่าน) เป็นหลักฐานของฐานเดิม หลัง sync ต้องบันทึก SHA/ผลใหม่ตามที่รันจริง ห้ามนำจำนวนเดิมไปอ้างว่าฐานใหม่ผ่านแล้ว

## 4. ข้อความที่ต้องมีตอนส่ง A ตรวจ

- Issue/PR และ branch/base ปัจจุบัน พร้อม dependency ที่ผ่าน review แล้ว
- ขอบเขตเปลี่ยน, contract/AC และไฟล์ส่วนกลางที่แตะ
- Source SHA ที่ทดสอบ, คำสั่งและผลจริง, หลักฐาน, ข้อจำกัด/สิ่งที่ไม่ได้ตรวจ
- Finding เดิม → correction commit → ผลตรวจซ้ำ → review/approval/merge links เมื่อเกิดขึ้นจริง

ไม่เปลี่ยนกฎ ownership ของ schema/auth ใน team plan และไม่อ้างว่า CI/deployment/PDF เสร็จจาก local tests อย่างเดียว ดู [B status](handoffs/member-b-status.md) สำหรับงานค้างของรอบนี้
