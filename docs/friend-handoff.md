# ข้อมูลส่งต่อให้เพื่อนและ Codex ฝั่งสมาชิก B

จัดทำ: 3 พฤศจิกายน 2026 (Asia/Bangkok)

อัปเดตหลัง baseline: สมาชิก A ลง implementation ใน branch `codex/member-a-sprint1` แล้ว ให้เริ่มจาก [implementation handoff ล่าสุด](handoffs/member-a-implementation.md) และ README ใน repository แทนการสร้าง scaffold ซ้ำ ZIP baseline เดิมยังเป็น snapshot ก่อนโค้ด จึงไม่ใช่ code ล่าสุด

## 1. วิธีส่งและเริ่มใช้

ชุดแรกชื่อ `studytrack-handoff-2026-11-03.zip`; ชุดอัปเดตชื่อ `studytrack-baseline-v0.1-2026-11-03.zip` รวมเอกสารฝั่ง A เพิ่มแล้ว ให้ส่งชุดอัปเดตให้สมาชิก B มี PDF โจทย์สี่ฉบับใน `sources/` ยังไม่มี application code หรือผลทดสอบ

ให้เพื่อนแตก ZIP เป็นโฟลเดอร์ StudyTrack บนเครื่องตน เปิดโฟลเดอร์นั้นใน Codex แล้ววางข้อความในหัวข้อ 4 ถ้ามี GitHub repository กลางแล้ว ให้เริ่มจาก clone/pull repository กลางล่าสุดและใช้เอกสารใน repository เป็นหลัก ZIP เป็นเพียง snapshot ณ วันนี้ ไม่ใช้แทน git sync ระหว่างพัฒนา

ดู GitHub URL/commit ล่าสุดจาก README และ `docs/handoffs/member-a-status.md` หลังบันทึกจริง ยังไม่มี collaborator/Issues/PR review หรือ accepted product release ที่ยืนยันในร่างนี้ ห้ามอ้างประวัติที่ยังไม่เกิดขึ้น

## 2. ระบุสมาชิกให้ตรงกัน

- **A** = เจ้าของแชตที่เริ่มวางแผนนี้ (ใน team-plan ใช้คำว่า “คุณ”)
- **B** = เพื่อนที่รับชุดนี้ (ใน team-plan ใช้คำว่า “เพื่อน”)
- เมื่อเพื่อนนำข้อความไปใช้กับ Codex ให้ยึด A/B นี้ ไม่สลับตามผู้ที่กำลังอ่าน

## 3. สถานะและงานที่แบ่งไว้

โครงการ: StudyTrack (ชื่อชั่วคราว), CPE 334, หัวข้อ 8 Habit and Activity Tracking System ในบริบทตั้งเป้าหมายอ่านหนังสือ เป็นผลิตภัณฑ์ใหม่ แยกจาก TokTickIT

มีสองบทบาท Participant และ Program Manager ผู้ดูแลจัดการแม่แบบได้ แต่ไม่มีสิทธิ์ดูหรือแก้ประวัติส่วนตัวของ Participant

| ส่วน | สมาชิก A | สมาชิก B |
|---|---|---|
| เอกสาร baseline | ร่าง SRS, data/auth/system foundation | ร่าง feature inventory, traceability, sprint plan และ UI/API conventions; review SRS ของ A |
| Sprint 1 features | F-01 Auth/access และ F-03 Personal goals | F-02 Activity templates และ F-04 Daily entries/progress |
| Feature workflow | contract → tests → implementation ของงานตน | contract → tests → implementation ของงานตน |
| Review | review งาน B | review งาน A |

ฐานเทคโนโลยีที่เสนอ: React/TypeScript/Vite, Express/TypeScript, PostgreSQL/Prisma และ Vitest/Supertest/Playwright เป็นแนวทางจาก stack งานเดิม ยังต้องตั้งโปรเจกต์และตรวจเวอร์ชันจริงร่วมกัน ไม่สร้าง scaffold คนละแบบแล้วค่อยมารวม

Sprint 1 ต้องทำ manager login→create template; participant login→set goal→record minutes→retrieve persisted progress พร้อม rejection, backend permissions และ logout ให้ครบ ส่ง Deliverable 1 วันที่ 8 พฤศจิกายน 2026 เวลา 23:59 น. ยังไม่ต้องมี completed Docker/CI/CD/GCP จนถึง Lab 5 วันที่ 15 พฤศจิกายน

## 4. ข้อความสำหรับให้เพื่อนคัดลอกไปวางใน Codex

```text
ช่วยทำโปรเจกต์กลุ่ม CPE 334 ชื่อชั่วคราว StudyTrack หัวข้อ 8: Habit and Activity Tracking System ในบริบทติดตามเป้าหมายอ่านหนังสือ เราทำทีม 2 คน และทั้งสองคนใช้ Codex แยกเครื่องกัน

ฉันคือสมาชิก B ส่วนเพื่อนร่วมทีมคือสมาชิก A ให้คงความหมาย A/B นี้ตลอด ใน docs/team-plan.md คำว่า “คุณ” หมายถึง A และ “เพื่อน” หมายถึงฉัน B

อ่าน README.md, docs/project-brief.md, docs/team-plan.md, docs/friend-handoff.md และ docs/handoffs/member-a-status.md ก่อน ถ้ามี docs/srs.md, docs/system-sds.md, docs/integration-contract.md ให้ใช้เอกสารเหล่านี้เป็น baseline ฝั่ง A และ review ตาม IDs ที่มี แล้วอ่าน PDF โจทย์ใน sources/ ถ้ามี หรือไฟล์ PDF ที่ฉันแนบ อย่าถือร่างของทีมเป็นข้อกำหนดจากอาจารย์ ถ้าพบความขัดแย้งให้ระบุที่มาและบันทึกประเด็น

สถานะเริ่มต้น: มีร่างเอกสาร pre-implementation และอาจมี Git repository สำหรับเอกสารตาม README ยังไม่มีแอป ผลทดสอบ GitHub Issues/PR review หรือ accepted release ตรวจสภาพโฟลเดอร์และ git ปัจจุบันก่อนทำงาน และรักษางานที่มีอยู่ ถ้าเริ่มจาก repository กลางแล้ว ให้ใช้ข้อมูลล่าสุดจาก repository เป็นหลักเหนือ ZIP snapshot

งานฝั่ง A: SRS, โครงสร้าง/data/auth foundation, F-01 Auth/access และ F-03 Personal goals
งานฝั่งฉัน B: feature inventory/traceability/แผนสาม Sprint, UI/API conventions, F-02 Activity templates และ F-04 Daily entries/progress รวม contract, tests, implementation ของสองฟีเจอร์นี้ เมื่อ dependencies พร้อม อีกฝ่ายเป็นผู้ review PR ของเรา และเราต้อง review ของอีกฝ่าย

เริ่มรอบนี้ด้วยเอกสารก่อน:
1. ตรวจ project brief และบันทึกคำถาม/ข้อเสนอใน docs/reviews/baseline-review-b.md โดยแยกส่วนที่ตกลงแล้ว ข้อเสนอ และสิ่งที่ยังไม่ทราบ
2. ร่าง docs/features.md และ docs/sprints/plan.md ให้ครอบคลุม F-01 ถึง F-08 ตาม project brief และร่าง docs/traceability.md หาก SRS จาก A ยังไม่มี ให้ทำโครงตารางและระบุ requirement mapping ว่ายังรอ SRS อย่าแต่ง requirement IDs ที่อ้างว่าทีมยืนยันแล้ว
3. ร่าง docs/ui-api-conventions.md เป็นข้อเสนอให้ใช้ร่วมกัน ระบุ error/loading/empty/validation states, request/response/error conventions และสิ่งที่ต้องตกลงกับ auth/data ของ A
4. ร่าง docs/sprints/sprint-1/f02-templates.md และ f04-entries-progress.md ให้มี linked requirements (หรือระบุรอ SRS), feature SDS, UI/API/data details, numbered AC, STS ที่มี test IDs/preconditions/expected results/level และ DoD กำหนดชื่อ AC เป็น AC-F02-xx และ AC-F04-xx เพื่อไม่ชนกับงาน A
5. สรุปสิ่งที่ทำแล้ว สิ่งที่เสนอ interface/dependency ที่ต้องให้ A ตอบ และ next steps ใน docs/handoffs/member-b-status.md ให้ฉันส่งกลับเพื่อน

ข้อกำหนดหลัก: UI→API→persistent database จริง, login/logout/current user, Participant และ Program Manager, backend role/ownership enforcement ผู้ดูแลแม่แบบดูข้อมูลส่วนตัวของนักศึกษาไม่ได้ ห้ามใช้ role selector/client-supplied user ID แทน authentication

กฎที่เสนอใน project brief: หน่วยนาที; หนึ่ง daily entry ต่อ goal ต่อวันที่ Asia/Bangkok; ห้ามวันที่อนาคตและค่าผิดช่วง; progress = actual/target × 100 โดยเกิน 100% ได้; กัน duplicate รวมถึง concurrent requests; การเปลี่ยน target ใน Sprint 2 ต้องไม่ทำผลย้อนหลังเปลี่ยนตาม กฎเหล่านี้เป็นร่างทีม ต้องรักษาสถานะและบันทึกการเปลี่ยนแปลง

อย่าเริ่ม application implementation ก่อน contract ของฟีเจอร์นั้นและ shared interface/dependencies พร้อม หากยังไม่มี repository กลาง ให้ทำเอกสารในโฟลเดอร์แยก ไม่สร้าง remote repo/scaffold/database ซ้ำกับ A เมื่อ repo พร้อม ให้ทำใน branch ของตนจาก sprint staging ตาม team-plan เช่น codex/f02-templates และเปิด PR กลับ staging ให้ A review

ก่อนแก้ Prisma schema/migrations, package/lockfile หรือ auth/shared middleware ให้ประสานตาม team-plan ไม่แก้ทับงาน A และไม่ใส่ secrets/data จาก TokTickIT ใช้ test database แยก

ภายหลังเริ่มโค้ด ต้องเก็บ meaningful TDD red/green, actual execution results/counts/commit และ AC→test mapping ไม่สร้างผล PASS, commit, review หรือ UAT ที่ไม่ได้เกิดขึ้นจริง ทั้งคนทำและคน review ต้องอ่านและเข้าใจงานที่ AI ช่วย

Deliverable 1 ส่ง 8 พฤศจิกายน 2026 เวลา 23:59 Asia/Bangkok ต้องมี baseline ทั้งผลิตภัณฑ์ + working Sprint 1 และ PDF ที่รวมเอกสาร/หลักฐานในตัว ยังไม่บังคับ completed Docker/CI/CD/GCP หรือแยก demo video ในรอบนี้

เริ่มตรวจเอกสารและจัดทำร่างฝั่ง B ตามข้างต้นได้เลย แล้วอธิบายสิ่งที่ฉันต้องคุยกับ A ให้สั้นและชัดเจน
```

## 5. ข้อมูลที่ส่งกลับ A หลังรอบแรก

ส่งไฟล์ที่เปลี่ยนหรือ branch/PR จริง พร้อมสรุปตามแบบนี้:

```text
สมาชิก: B / ชื่อจริง
เริ่มจาก: shared commit หรือชื่อ ZIP + วันที่
branch/PR: ใส่เฉพาะที่มีจริง; ถ้ายังไม่มีก็ระบุ
ไฟล์ที่สร้าง/แก้:
กฎหรือ interface ที่เสนอ:
ประเด็นที่ต้องให้ A ตอบ:
tests ที่รันจริงและผล: หรือ “รอบนี้ทำเอกสาร ยังไม่รัน tests”
งานถัดไป:
```

เมื่อ repository กลางพร้อม ใช้ Issues/PRs และ commit เป็นแหล่งข้อมูลร่วมกัน ไม่ส่งไฟล์ ZIP ใหม่ทับโปรเจกต์ที่กำลังทำอยู่ แต่ละคนต้องตรวจ PR/review ด้วยตนเองก่อนรับงาน ไม่อ้างว่าอีกคน review แล้วจากข้อความ AI เพียงอย่างเดียว
