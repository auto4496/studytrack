# Member B increment — templates and daily reading

ขั้นตอนส่งตรวจร่วมกัน: [Review workflow ตาม TokTickIT](docs/review-workflow.md) — feature PR เข้า sprint staging, คู่ทีม review/merge, release PR เข้า main และตรวจ final-main ก่อนสรุปรายงาน

สถานะ 4 Nov2026: A PR3 merged into staging1a4b74b. F02 source5e340f8 passes66 API/unit+16browser; PR6 now targets staging and is ready for A review. F02+F04 sourceafca38f passes117 API/unit+24browser, real process-restart persistence and build; PR7 remains draft based on F02 until PR6 is accepted. B peer acceptance, full Sprint1/main release, CI/GCP/UAT and D1PDF remain pending. [B handoff](docs/handoffs/member-b-status.md) / [verification](docs/verification/member-b.md)

F02: manager creates templates, participant selects persisted catalog. F04: participant records minutes per goal/date, retrieves persisted progress (45/60=75%,75/60=125%), duplicate/concurrent/date/range/ownership enforced by API/PostgreSQL. Unknown POST outcome reconciles saved state before retry

## Reproduce B verification

Follow the original setup below with a private development database and a **different** TEST_DATABASE_URL marked test. Then run sequentially (both suites reset the guarded test DB):

```sh
npm run db:generate
npm run db:test:migrate
npm test
npx playwright test --config playwright.member-b.config.ts
npx tsx scripts/member-b-restart.ts
npm run build
```

B browser config uses isolated3310/5310 ports; Windows uses installed Edge as the A config does. Other platforms need Playwright Chromium installed. No package/lockfile/schema/auth changes are required by B features. Do not point tests at development/A databases

On this machine only: B dev DB is separate from test, ignored .env uses API5300/UI3300 and loopback26433. Start API with `npm run dev:server`; start UI with `API_PROXY_TARGET=http://127.0.0.1:5300` and `npm run dev:client -- --port 3300`. Windows PowerShell: set `$env:API_PROXY_TARGET='http://127.0.0.1:5300'` before the UI command. Seed accounts manager@studytrack.test/student1@studytrack.test/student2@studytrack.test use generated passwords from private .env; never print/commit them

## Original A setup and historical verification

# StudyTrack — CPE 334 reading goals

สถานะ: มี implementation ฝั่ง A (foundation, F-01 authentication และ F-03 personal goals) บน `codex/member-a-sprint1` พร้อมหลักฐาน local tests; ยังรอ teammate review และรวม F-02/F-04 จาก B จึงยังไม่ใช่ accepted Sprint 1 release

ชื่อ StudyTrack เป็นชื่อทำงานชั่วคราว หัวข้อที่เสนอคือหัวข้อ 8: Habit and Activity Tracking System ในบริบทการติดตามเป้าหมายอ่านหนังสือ

## เริ่มรันในเครื่อง

Prerequisites: Node.js 22.12+ (พัฒนารอบนี้ด้วย 24.14), npm, Git, Docker Desktop ที่เปิด Linux engine. PostgreSQL 17 ใช้ container แยก dev/test บน loopback ports 25432/25433; ไม่มีการใช้ database ของ TokTickIT

```sh
npm ci
npm run setup:local
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

เปิด UI ตาม `APP_ORIGIN` ใน `.env` (ค่าเริ่มต้น **http://localhost:3000**), API health ที่ http://127.0.0.1:5000/api/health. เครื่อง A รอบนี้ใช้ **http://127.0.0.1:3000** เพื่อแยกจาก service ที่ฟัง wildcard localhost อยู่แล้ว Origin ต้องตรงกับค่าที่ตั้ง. `setup:local` สร้าง `.env`/`.env.test.local` พร้อม generated passwords โดยไม่พิมพ์ค่าออกมาและไม่เขียนทับไฟล์เดิม ถ้าตั้งค่าเองให้เริ่มจาก `.env.example`/`.env.test.example`; อย่าใช้ CHANGE_ME จริง

| Local synthetic account | Password source (private .env) | Role |
|---|---|---|
| manager@studytrack.test | SEED_MANAGER_PASSWORD | PROGRAM_MANAGER |
| student1@studytrack.test | SEED_PARTICIPANT_PASSWORD | PARTICIPANT |
| student2@studytrack.test | SEED_PARTICIPANT_PASSWORD | PARTICIPANT |

Seed ทำซ้ำไม่สร้างบัญชีซ้ำและไม่เปลี่ยนรหัสผ่านของบัญชีที่มีอยู่แล้ว มีสองแม่แบบสำหรับทดสอบ goal picker อย่านำรหัสผ่าน/DB credentials/session tokens ไปใส่รายงาน Git หรือ screenshot

## Build และทดสอบ

```sh
npm run db:test:migrate
npm test
npm run build
npm run verify:restart
npm run test:e2e
```

Vitest/API tests และ Playwright ใช้ `TEST_DATABASE_URL` ที่มี database test marker และแยกจาก dev เท่านั้น รวมการตรวจ localhost/127.0.0.1 aliases. Test setup ล้างข้อมูลใน test database เพื่อให้แต่ละรอบทำซ้ำได้ อย่ารัน Vitest กับ browser suite พร้อมกันบน test DB เดียว

Browser suite ใช้ Microsoft Edge ที่ติดตั้งไว้บน Windows; บน Linux/macOS ใช้ `npx playwright install chromium` ก่อนรัน หรือกำหนด `PLAYWRIGHT_CHANNEL` ตาม browser ที่ติดตั้ง ทดสอบ UI/API จริงที่ ports 3100/5100 พร้อม CSRF/Origin config แยกจาก dev. หลักฐานอยู่ใน `artifacts/evidence/member-a/` และรายละเอียด/coverage gaps ใน [verification record](docs/verification/member-a.md)

`verify:restart` ใช้ guarded test DB สร้างข้อมูลสังเคราะห์เฉพาะรอบ หยุดและเริ่ม API process จริง ตรวจ session/goal/target persistence แล้วลบเฉพาะข้อมูลของรอบนั้น ไม่ใช่หลักฐาน GCP redeployment ซึ่งยังเป็น Lab 5

ผล local verification รอบนี้: API/unit38 ผ่าน, browser10 ผ่าน, failed/skipped0; build และ real process restart ผ่าน; npm audit0 vulnerabilities. Source/command versions ระบุใน `artifacts/evidence/member-a/execution.json` รวมการตรวจว่า backend ไม่เปลี่ยนหลัง API run; ยังไม่ใช่ teammate approval หรือ full Sprint1 acceptance

## ขอบเขตที่มีใน branch นี้

- login/logout/current user, rotated DB sessions, Argon2id, CSRF/Origin checks, server-side role/ownership
- own goals create/list/detail, initial target version, immutable template snapshots, date/range validation, concurrent active-goal protection
- React login/goals/catalog read views พร้อม loading/empty/errors/retry และ layouts desktop/mobile
- read-only template API/selector เป็น integration adapter ให้ F-03; B เป็นเจ้าของ manager-create/UI และ F-04 entries/progress ซึ่งยังไม่ได้รวม ไม่มีการอ้างว่าทำ full Sprint 1 journey ครบแล้ว

ดู [handoff ฝั่ง A](docs/handoffs/member-a-implementation.md) สำหรับไฟล์/shared interfaces ที่ B ใช้ต่อได้

โฟลเดอร์นี้แยกจาก TokTickIT เดิม เอกสารเป็นข้อเสนอการวางแผน ยังไม่ใช่การอนุมัติจากเพื่อน อาจารย์ หรือ TA

Repository กลาง (private): [auto4496/studytrack](https://github.com/auto4496/studytrack). สมาชิก A คือ auto4496, B คือ Datakung (ส่งคำเชิญ repository แบบ Write แล้ว). [Project board](https://github.com/users/auto4496/projects/2) แยกจาก TokTickIT และให้ Datakung เป็น writer แล้ว

ตรวจงานฝั่ง A ที่ [PR #3](https://github.com/auto4496/studytrack/pull/3) → `codex/sprint-1-staging`; ยังเปิดรอ peer review และยังไม่ได้ merge เข้า staging/main

บันทึก pre-code documents ครั้งแรกที่ `11cdfe5`; TDD red ที่ `2fc6252` และ initial green ที่ `a13858f`. [Issue #1 F-01](https://github.com/auto4496/studytrack/issues/1), [Issue #2 F-03](https://github.com/auto4496/studytrack/issues/2). Initial docs บน main ไม่ใช่ product release. Feature PR ต้องให้คู่ทีม review ก่อนรวมเข้า `codex/sprint-1-staging` และ release ไป main

สำหรับส่งต่อเพื่อนที่ใช้ Codex อีกเครื่อง อ่าน [ข้อความเริ่มงานฝั่งสมาชิก B](docs/friend-handoff.md) มี prompt พร้อมคัดลอกและรูปแบบส่งสถานะกลับ สมาชิก A/B ไม่เปลี่ยนตามผู้ที่เปิดไฟล์

## เอกสารฝั่ง A ที่พร้อมตรวจ

- [สถานะส่งต่อ A และงานถัดไปของ B](docs/handoffs/member-a-status.md)
- [SRS: FR/BR/NFR และ scope ทั้งสาม Sprint](docs/srs.md)
- [System-Level SDS: architecture/data/auth/permissions](docs/system-sds.md)
- [ข้อเสนอ integration contract: APIs/DTOs/shared services](docs/integration-contract.md)
- [F-01 Auth contract / AC / STS](docs/sprints/sprint-1/f01-auth.md)
- [F-03 Goals contract / AC / STS](docs/sprints/sprint-1/f03-goals.md)
- [Decision/open-item log](docs/decisions.md)
- [AI-use record](docs/ai-use.md)

Contracts เริ่มก่อน implementation; ผลทดสอบจริงอยู่ใน verification record และ artifacts แยกจากสเปก ยังไม่มีการอ้าง teammate approval ฝั่ง B ยังเป็นเจ้าของ features/traceability/sprint plan/UI conventions และ F-02/F-04 contracts

## กำหนดส่ง

ทุกเวลาเป็น Asia/Bangkok และกำหนดส่งภายนอกคือ 23:59 น.

| งาน | วันส่ง 2026 |
|---|---|
| Deliverable 1 | 8 พฤศจิกายน |
| Lab 5 | 15 พฤศจิกายน |
| Lab 6 | 22 พฤศจิกายน |
| Deliverable 2 และ Lab 7 | 29 พฤศจิกายน |
| Final Delivery | 13 ธันวาคม |

## เอกสารต้นทาง

- `sources/group_work_specs_v1.pdf`
- `sources/project_deliverable_1_v1.pdf`
- `sources/project_deliverable_2_v1.pdf`
- `sources/project_final_delivery_v1.pdf`

เอกสารเหล่านี้ใช้เป็นข้อกำหนดของการส่งงาน ไม่ใช่หลักฐานว่าทีมได้ลงมือทำหรือผ่านการทดสอบแล้ว คำถามเรื่องความยาววิดีโอ Final (4 หรือ 10 นาที) และ rubric Final ที่ไม่ตรงกันต้องยืนยันกับอาจารย์/TA ก่อนจัดทำงานส่ง
