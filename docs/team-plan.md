# StudyTrack — แผนทำงานร่วมกันสองคน

วันที่: 3 พฤศจิกายน 2026

สถานะ: PROPOSED — ยังไม่มีการมอบหมายหรือการ review ที่เกิดขึ้นจริง ใช้ “คุณ” และ “เพื่อน” จนกว่าจะใส่ชื่อจริง ทั้งคู่แจ้งว่าสามารถทำงานได้ทุกด้านและใช้ Codex ช่วยได้

การระบุสมาชิกสำหรับส่งข้ามเครื่อง: **สมาชิก A = “คุณ” ในเอกสารนี้** (เจ้าของแชตที่วางแผนเริ่มต้น); **สมาชิก B = “เพื่อน” ในเอกสารนี้** (ผู้รับชุดส่งต่อ) คำเหล่านี้ไม่เปลี่ยนความหมายตามคนที่เปิดไฟล์ ดูวิธีเริ่มฝั่ง B ใน [ข้อความส่งต่อ](friend-handoff.md)

## 1. หลักการแบ่งงาน

- แบ่งตามฟีเจอร์ที่มีขอบเขตชัดเจน แต่ละคนรับผิดชอบตั้งแต่ออกแบบ เขียน tests ลงมือทำ และเตรียมหลักฐาน
- คู่ทีมเป็นผู้ review อีกคนเสมอ สลับกันทำ frontend/backend/tests/docs ไม่แบ่งถาวรตามชั้นเทคโนโลยี
- owner หมายถึงคนพางานไปจนเสร็จ ไม่ได้หมายความว่าคู่ทีมต้องไม่เข้าใจงานนั้น
- งานคู่ระบุชื่อทั้งสองคนใน Issue/PR พร้อมสรุปว่าแต่ละคนช่วยอะไร ไม่ต้องทำ commit ให้จำนวนเท่ากัน
- ทั้งสองคนต้องมีประสบการณ์ requirements/design, tests, implementation, review, AI supervision, deployment และ maintenance พร้อมอธิบายงานที่สุ่มถามได้

## 2. ตารางรับผิดชอบ Sprint 1

| งาน | ผู้รับผิดชอบหลัก | คู่ทีมทำอะไร | หลักฐานที่ต้องเก็บ |
|---|---|---|---|
| ขอบเขต/SRS/BR/NFR | คุณร่าง | เพื่อนตรวจความครบถ้วนและกรณีขอบเขต ทั้งคู่ตกลงกฎ | versioned docs + decision notes |
| Feature inventory/traceability/แผนสาม Sprint | เพื่อนร่าง | คุณตรวจว่า baseline ทุกข้อมีที่ไป | mapping + review |
| System SDS/ER/role matrix | ทำคู่; คุณรวบรวม schema/auth เพื่อนรวบรวม UI/API | สลับตรวจอีกส่วนและอธิบาย design ร่วมกัน | SDS + diagram + review |
| Setup, DB migrations, test harness | คุณ | เพื่อนลอง setup จาก fresh clone และเพิ่ม test scenario | setup commands + actual results |
| F-01 Auth & access | คุณ: contract/tests/implementation | เพื่อน review และลอง invalid login/logout/forbidden API | Issue/contract/test/PR chain |
| F-02 Templates | เพื่อน: contract/tests/implementation | คุณ review และลอง participant เรียก manager endpoints | Issue/contract/test/PR chain |
| F-03 Goals | คุณ: contract/tests/implementation | เพื่อน review และลองข้ามเจ้าของ/สร้างซ้ำ | Issue/contract/test/PR chain |
| F-04 Entries & progress | เพื่อน: contract/tests/implementation | คุณ review และลอง invalid/future/concurrent duplicate | Issue/contract/test/PR chain |
| Integrated E2E/regression | ทำคู่; เพื่อนรวบรวม E2E คุณรวบรวม API checks | สลับกันรัน/อธิบายผลและแก้ใน fix branch | commands/counts/commit/results |
| PDF Deliverable 1 | คุณรวบรวม A/C/E; เพื่อนรวบรวม B/D/F | ตรวจเนื้อหาและหลักฐานของอีกฝ่ายก่อนส่ง | PDF navigation + checked release |
| Release PR และ handoff | เพื่อนเตรียม release PR หลัง integration | คุณ review; ทั้งคู่ตรวจ released main และขั้นตอนรัน | release PR/tag/commit/setup |

ผู้รวบรวม PDF ไม่จำเป็นต้องเป็นผู้เขียนเอกสารทุกส่วน เนื้อหาต้องเชื่อมกับเจ้าของ feature และประวัติจริง

## 3. แผนถึง Deliverable 1

ทุกเวลาเป็น Asia/Bangkok กำหนดส่งจริง 8 พฤศจิกายน 2026 เวลา 23:59 น. เป้าหมายภายในทีมคือพร้อมส่งก่อน 18:00 น. ตารางนี้เป็นข้อเสนอ ต้องปรับตามผลทดสอบและเวลาที่มีจริง ห้ามลด scope เงียบ ๆ เพื่อให้ตรงตาราง

| วันที่ | คุณ | เพื่อน | จุดตรวจร่วมกัน |
|---|---|---|---|
| 3 พ.ย. | ร่าง SRS/กฎ/โครงสร้างและ auth design | ร่าง feature mapping/แผน/หน้าจอและ API conventions | ตกลง scope; repo/collaborator/board; baseline และ data/API agreement |
| 4 พ.ย. | F-01 contract/STS แล้วทำ auth + tests | F-02 contract/STS แล้วทำ templates + tests | review contracts ก่อน code; เริ่ม red/green evidence; schema changes เข้าทีละชุด |
| 5 พ.ย. | รวม F-01 หลังเพื่อน review; F-03 contract/tests/code | รวม F-02 หลังคุณ review; F-04 contract/tests และ code เมื่อ dependencies พร้อม | ตรวจ manager→template และ participant→goal; ตกลง response ที่ F-04 ใช้ |
| 6 พ.ย. | จบ F-03 และ review F-04 | จบ F-04 และ review F-03 | end-to-end journey, login/logout, duplicate/future/ownership |
| 7 พ.ย. | fixes, build/API tests, PDF A/C/E | fresh setup/E2E, PDF B/D/F | full integration/acceptance; selected evidence; release PR เมื่อ checks ผ่าน |
| 8 พ.ย. | review PDF/เวอร์ชัน/ผลทดสอบ | review PDF/ลิงก์/การรันจาก README | finalize main release/tag; actual counts/known gaps; ทั้งคู่ตรวจแล้วส่ง LEB2 |

ถ้า dependency ยังไม่พร้อม ให้ทำ contract/test cases/UI states หรือ pure logic tests ที่ตกลงไว้ก่อน การใช้ mock ระหว่างพัฒนาไม่นับเป็นหลักฐาน persistence/access ของ release

## 4. GitHub workflow

1. สร้าง repository ใหม่หนึ่งแห่ง เพิ่มอีกคนเป็น collaborator และเปิด project board: Backlog / Ready / In progress / In review / Done
2. ตั้ง local project และเริ่ม baseline โดยบันทึก documents ก่อน implementation อาจใช้ initial scaffold commit ตามความเหมาะสม แต่ต้องไม่อ้างว่าเป็น feature ที่เสร็จแล้ว
3. สร้าง sprint staging เช่น `codex/sprint-1-staging` จาก `main`
4. แต่ละ feature เริ่มจาก Issue ที่เชื่อม requirements + contract แล้วแตก branch จาก staging ล่าสุด เช่น `codex/f01-auth` หรือ `codex/f02-templates`
5. ลงมือทำ bounded change, run tests, inspect diff และอัปเดต docs ส่ง PR เข้า sprint staging
6. คู่ทีมอ่าน diff/test assertions ทดลองตามสมควร และ review แบบระบุสิ่งที่ตรวจหรือข้อค้นพบจริง ผู้เขียนไม่ approve PR ของตน
7. รวมงานทีละ PR และรัน integration/system/acceptance checks เมื่อผิดให้เปิด/เชื่อม fix Issue แล้วแก้ผ่าน branch
8. ทำ release PR จาก staging เข้า `main` หลัง checks ผ่าน ให้คู่ทีม review แล้ว tag/record accepted commit
9. หลัง Lab 5 ใช้ CI/CD deploy accepted main ผ่าน pipeline ที่ทำซ้ำได้ ผล check ที่จำเป็นต้องกั้น release เมื่อ fail

CI ยังไม่จำเป็นสำหรับ Deliverable 1 แต่ต้องมี local build/test results ที่ผูกกับ release commit การ review/configuration บน GitHub ต้องยืนยันจากสิ่งที่เกิดขึ้นจริงและข้อจำกัดของ account/repository

## 5. ใช้ Codex คนละเครื่องอย่างไรให้ทำงานร่วมกันได้

- แต่ละคน clone repository ของ StudyTrack ลงเครื่องตนเอง ทำงานใน branch ของ Issue ที่รับผิดชอบ ให้ Codex อ่าน baseline และ contract ของ feature นั้นก่อน
- หลีกเลี่ยงสอง session แก้ working copy/branch เดียวกัน ถ้าใช้เครื่องเดียวกันให้ใช้ checkout/worktree แยก
- ก่อนเริ่มงาน sync sprint staging และแจ้งอีกคนในช่องทางที่ทีมใช้ว่า “ทำ Issue/branch ไหน แตะไฟล์ส่วนกลางใด”
- ให้ Codex ช่วยได้ทั้งออกแบบ โค้ด tests และอธิบาย diff แต่เจ้าของงานต้องอ่าน รันทดสอบ และอธิบายสิ่งที่ยอมรับ
- ให้คู่ทีมใช้ Codex ช่วย review ได้ แต่เพื่อนต้องตรวจและเป็นผู้ตัดสินใจ review จริง ห้ามบันทึกว่าเพื่อนตรวจแล้วถ้ายังไม่ได้ทำ
- เก็บ AI-use declaration สั้น ๆ: เครื่องมือ, งานที่ช่วย, การตรวจที่คนทำ ผลการรันต้องมาจาก execution จริง
- ถ้า GitHub ยังไม่พร้อม จัดทำ baseline/contracts ได้ แต่ยังไม่นับว่ามี Issue/PR/review จนกว่าจะสร้างและตรวจจริง

## 6. ไฟล์ส่วนกลางและการรวมงาน

| ส่วนกลาง | กติกาที่เสนอ |
|---|---|
| Prisma schema/migrations | คุณประสานการเปลี่ยน schema ใน Sprint 1; เพื่อนเสนอ diff ที่ feature ต้องใช้ ให้ review แล้วรวม migration ทีละชุด ห้ามแก้ migration ที่ merge แล้ว |
| root package/lockfile/config | คุณดูแล setup ช่วงแรก; ผู้ที่เพิ่ม dependency แจ้งก่อน รวมและ regenerate ตาม package manager ที่เลือก ไม่แก้ lockfile ด้วยมือ |
| auth middleware/API error envelope | ตกลงใน System SDS; F-01 เป็นเจ้าของ foundation การเปลี่ยน interface ต้องให้คู่ทีม review |
| UI router/shared layout | เพื่อนประสานช่วง Sprint 1; ทั้งคู่เพิ่ม feature screens ตาม interface ที่ตกลง |
| traceability/results/evidence | แต่ละคนเพิ่มแถวของงานตนพร้อม result/commit จริง แล้วคู่ทีมตรวจ ไม่เขียน PASS ล่วงหน้า |

ผู้ประสานช่วยลด merge conflict ไม่ใช่การแบ่ง learning outcome ถาวร Sprint 2 ให้เพื่อนลองนำ migration/release และคุณลองนำ UI integration เพื่อให้สลับประสบการณ์

## 7. แผนหลัง Sprint 1

| ช่วง | คุณ | เพื่อน | สิ่งที่ทั้งคู่ต้องร่วมทำ |
|---|---|---|---|
| 9–15 พ.ย. Lab 5 | Docker/DB persistence/config และทดสอบ pipeline | CI/CD/quality gate และนำ deploy | ต่างคนทดลอง deploy/restart/checks; controlled failing branch; reviewed release |
| 9–22 พ.ย. Sprint 2 | F-05 contract/tests/code | F-06 contract/tests/code | peer review + regression; เริ่มเมื่อ dependencies พร้อม ไม่รอ Lab จบทั้งหมด |
| 16–22 พ.ย. Lab 6 | นำการทดสอบแอปคู่ UAT และช่วย triage/แก้ของทีมตน | เตรียม UAT/handoff ของทีมตนและร่วมทดสอบแอปคู่ | ทั้งคู่มี tester และ developer evidence; แก้ accepted defect และให้ทีมคู่ retest |
| 17–29 พ.ย. Lab 7 | ร่วม impact/contract/test/code/review | ร่วม impact/contract/test/code/review | ขอ approved change ต่อ behavior เดิม; ทำ red/green/regression/deploy; ห้ามใช้ baseline feature แทน maintenance exercise |
| 23–29 พ.ย. Sprint 3 progress / D2 | F-07 contract/tests/implemented progress | F-08 contract/tests/implemented progress | S2 complete; S3 contracts ครบ + meaningful tested progress อย่างน้อยหนึ่ง; deploy candidate และแผนงานที่เหลือ |
| ภายใน 29 พ.ย. | อัปเดต SRS/SDS/traceability ของงานตน | อัปเดตของงานตนและรวบรวม metrics | ระบบควรเกือบครบ เตรียมรับช่วงสอบ 1–11 ธ.ค. |
| 30 พ.ย.–11 ธ.ค. | bounded fixes/verification ตามเวลาสอบ | bounded fixes/verification ตามเวลาสอบ | ไม่เก็บ main workflow ไว้สองวันสุดท้าย; นัดรอบร่วมให้เหมาะกับตารางสอบจริง |
| 12–13 ธ.ค. Final | ตรวจ final release/requirements และร่วมอัด demo | ตรวจ QA/UAT/setup และร่วมอัด demo | final-version tests/retests; report + video; ส่งก่อน 13 ธ.ค. 23:59 |

Lab 6 ต้องมีอย่างน้อยสี่ UAT cases: normal journey, domain/boundary rule, role/ownership และ state/history/persistence ต้องแก้ accepted defect อย่างน้อยหนึ่งรายการแล้วให้ทีมอื่น retest ถ้าไม่พบ defect จริงให้ประสาน TA ตามโจทย์ ไม่สร้างผลขึ้นเอง

Lab 7 ต้องมี approved maintenance change, impact analysis, contract revision, failing changed-behavior test, implementation, regression, review/deploy, metrics ห้ารายการพร้อมช่วงเวลา/แหล่งที่มา และ readiness/retrospective หลักฐานแบ่งให้ชัดจาก feature work อื่น

## 8. Definition of Done ต่อ feature

- Contract ก่อน code มี feature SDS, applicable UI/API/data, AC, STS และ completion evidence
- implementation ครบ AC ที่รับไว้ ข้อมูลบันทึกจริง สิทธิ์ตรวจที่ backend และ error states ใช้งานได้
- planned tests ที่จำเป็นรันจริง มี test IDs/file names/results/counts/commit และ meaningful assertions
- คู่ทีม review จริง แก้ข้อค้นพบแล้ว รวมและตรวจ integration
- docs/setup/traceability/evidence current; ไม่ซ่อน failed/skipped/incomplete work
- สถานะ Done/accepted ใช้เมื่อครบจริง หากยังไม่ผ่านให้ระบุ planned/in progress/implemented/tested ตามสภาพจริง

## 9. วิธีติดตามงานร่วมกัน

คุยสั้นวันละครั้งหรือเมื่อมี blocker: เมื่อวานจบอะไร วันนี้ทำ Issue ไหน ติดอะไร ต้องให้ใคร review โดยเฉพาะ shared schema/API changes ให้ตกลงก่อนลงมือ

| ชื่อจริง | งาน/Issue/PR | บทบาทที่ทำจริง | หลักฐาน/commit | review โดย |
|---|---|---|---|---|
| ยังไม่ระบุ | ยังไม่มี | ยังไม่บันทึก | ยังไม่มี | ยังไม่มี |

ตารางนี้เป็นแม่แบบ contribution เท่านั้น ไม่ใช่ประวัติที่เกิดขึ้นแล้ว เก็บ completed Issues/merged PRs/tests/UAT defects/CI runs ตามวันที่จริงเพื่อใช้ Lab 7 และ Final

## 10. จุดตรวจแรกก่อนเริ่ม implementation

- [ ] ทั้งคู่ยืนยัน project brief และกฎที่เสนอ
- [ ] ใส่ชื่อ/รหัส/GitHub และสร้าง repo/collaborator/board
- [ ] baseline ทั้งผลิตภัณฑ์มี FR/BR/NFR → feature → sprint ครบ
- [ ] System SDS และ ER/role matrix พร้อมสำหรับ Sprint 1
- [ ] F-01/F-02 contracts พร้อมให้เริ่มก่อน; F-03/F-04 ต้องพร้อมก่อนเริ่ม code ของแต่ละ feature
- [ ] ตกลง interface/shared-file ownership และการ review
- [ ] ทดลอง setup/test database แยกอย่างปลอดภัย
- [ ] ยังไม่มีการอ้างว่าผลทดสอบ การ review หรือ UAT ผ่านก่อนเกิดขึ้นจริง
