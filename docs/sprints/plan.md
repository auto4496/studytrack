# StudyTrack - แผนสาม Sprint

## F06 implementation candidate - 15 November 2026

A explicitly accepted PR59's Section2/refresh boundary and merged it as stagingd952ad6. B implemented F06 from that baseline; [actual ledger](../verification/f06.md) records203 unit/API and50 desktop/mobile browser passes plus build, isolation and real API restart. This is author-verified candidate work, awaiting A implementation review/protected staging integration and separately reviewed release. Keep Issue58 OPEN and Sprint2 incomplete. A's F07/Issue54 and B's later F08 remain separate; no new cloud operation or Lab5 submission/evidence change is implied. Earlier checkpoints retain their writing-time status.

## F06 preparation - 14 November 2026

B begins Sprint2 [F06 Issue58](https://github.com/auto4496/studytrack/issues/58) from accepted staging906d1e7 with the [pre-code contract](sprint-2/f06-history-streak.md) and [verification ledger](../verification/f06.md). A reviews API/read-model/date/archive/concurrency/UI decisions before dependent code. F05 is accepted; F06 product/tests are NOT_IMPLEMENTED/NOT_RUN and Sprint2 remains incomplete. A's F07 and B's later F08 stay separate. Lab5 Issues22/23/24 are closed on GitHub; this preparation neither changes their evidence nor asserts a new LEB2 action. Earlier checkpoints are historical.

## Current checkpoint - 13 November 2026

F05 is implemented, independently accepted in PR35 and included in reviewed/deployed main6d30aef with successful Deploy43410699104; [acceptance and F06 handoff](../verification/f05.md#current-acceptance---13-november-2026) supersedes the earlier F05 pending state. F06 history/edit/streak remains B's separate Sprint2 feature, so Sprint2 is not complete. A is preparing the [F07 schedule/reminder contract](sprint-3/f07-schedule.md), Issue54, alongside B's Lab5 report work. F07 decisions/ACs are proposed; product/migration/tests remain NOT_IMPLEMENTED/NOT_RUN and contract approval plus implementation-entry agreement are still required. B retains F06/F08 and Issue24 coordination; A reviews B's work. EP7/EP8 technical evidence is accepted through PR53, while final report/index/joint acceptance in Issues22/23/24 remains open. The dated plan below preserves historical checkpoints and does not override this status.

## Current checkpoint - 9 November 2026

Sprint1 dependencies are accepted. Reviewed EP5 documentation release PR30 is merged into main `5c04cd4` (tree equal to staging `e16b0af`); Issue20 is closed. A has opened [F-05 Issue31](https://github.com/auto4496/studytrack/issues/31) and prepared the [Sprint2 lifecycle contract](sprint-2/f05-lifecycle.md) for Datakung's pre-code review. F-05 is specified/proposed, not implemented or tested. B may draft F-06 against the proposed target-history/stop boundary; agreement is required before dependent implementation. Lab5 EP6-EP8 remain B-led with both members participating. The dated draft plan below is retained as historical planning, not a current release-status claim.

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | ผู้ร่าง: สมาชิก B | รุ่น: B-draft-01

สถานะ: **PROPOSED PLAN / local increment verified** ตารางวันและงานเป็นแผน; F01–04 มี local verificationแล้วตามหัวข้อ10 แต่ยังไม่มี accepted release/peer approval A = ผู้ร่าง SRS/data/auth/F-01/F-03; B = ผู้รับ handoff/F-02/F-04 ตาม [team-plan](../team-plan.md) ไม่สลับ A/B ตามผู้เปิดไฟล์

## 1. ฐานแผนและกำหนดส่งภายนอก

ใช้ [feature inventory](../features.md), [traceability](../traceability.md) และ [project brief](../project-brief.md) ร่วมกัน รอ SRS/System SDS ของ A และการตกลง BR-01..10 จึงยังไม่ใช่ accepted baseline

แหล่งกำหนดส่ง: [Group Work Specifications](../../sources/group_work_specs_v1.pdf) หน้า 2-3, 9, 13-15; รายละเอียด [D1](../../sources/project_deliverable_1_v1.pdf) หน้า 3-7, [D2](../../sources/project_deliverable_2_v1.pdf) หน้า 1-5 และ [Final](../../sources/project_final_delivery_v1.pdf) หน้า 1-6 ทุกเวลาต่อไปนี้เป็น **2026 / Asia/Bangkok** กำหนดส่งภายนอกเวลา **23:59 น.**

| Checkpoint | กำหนดส่งจริง | ผลที่ต้องมี |
|---|---|---|
| Deliverable 1 | 8 พฤศจิกายน | Baseline ทั้งผลิตภัณฑ์ + working Sprint 1 บน main ที่รัน local ได้; PDF เดียวครบ A-F |
| Lab 5 | 15 พฤศจิกายน | Docker, CI/CD/required-check gate, GCP และ durable persistence; release ซ้ำได้ |
| Lab 6 | 22 พฤศจิกายน | Cross-team UAT/triage/fix และ independent retest ตามโจทย์ |
| Deliverable 2 และ Lab 7 | 29 พฤศจิกายน | S2 complete + all S3 contracts + ≥1 meaningful S3 workflow/rule tested ใน deployed candidate; Lab 7 maintenance evidence แยก |
| Final Delivery | 13 ธันวาคม | F-01..08/approved baseline complete, final verification/UAT retests/deployment, PDF และวิดีโอ |

## 2. ขอบเขตและผลจบแต่ละ Sprint

| Sprint / ช่วงที่เสนอ | เป้าหมายและฟีเจอร์ | Owners / review | Dependencies / entry gate | Completion outcome |
|---|---|---|---|---|
| 1: 3-8 พ.ย. | Manager login→create template; Participant login→set goal→record minutes→retrieve persisted progress; F-01, F-02, F-03, F-04 | A: F-01/F-03; B: F-02/F-04; อีกคน review | ทั้งคู่ยืนยัน scope/SRS mapping; shared SDS/ER/auth/date/API agreed; contract/STS ของ feature ก่อน code; A จัด setup/test DB | Normal UI→API→DB journey, domain rejection, concurrent duplicate, anonymous/wrong-role/cross-user rejection และ logout ตาม design; tests/build/review/integration และ accepted local release บน main; D1 A-F ครบ |
| 2: 9-22 พ.ย. ภายในทีม; ต้องครบไม่เกิน 29 พ.ย. | Core expansion F-05 lifecycle/target versions และ F-06 history/edit/streak | A: F-05; B: F-06; อีกคน review | S1 accepted; target-version/snapshot/stop/current-streak rules agreed; contracts/AC/STS ก่อน code; deploy/UAT งานคู่ขนาน | F-05/F-06 ทุก AC implemented/tested/reviewed/integrated; history ไม่เปลี่ยนตาม target ใหม่; edit คำนวณใหม่ถูกต้อง; retain S2 release reference แม้ candidate มี S3 ต่อแล้ว |
| 3: 23 พ.ย.-13 ธ.ค.; progress checkpoint 29 พ.ย. | F-07 schedule/reminder representation, F-08 real summaries + integrated completion | A: F-07; B: F-08; อีกคน review | S2 data/rules พร้อม; period denominator/schedule semantics agreed; feature contracts ก่อน code | ภายใน D2 contracts F-07/F-08 ครบและ ≥1 meaningful domain workflow/rule ทำงานจริง+tested; ภายใน Final ทั้งสอง feature และ baseline ที่รับครบ พร้อม regression/UAT/deployment/docs |

F-08 ต้องมี summary ที่ทำงานจาก persisted data จริง ไม่ใช้คำว่า hardening แทน feature ส่วน S3 progress ใน D2 ใช้ F-07 หรือ F-08 ที่มี domain behavior และ meaningful tests ได้ แต่ empty page/mock/unexecuted test ไม่นับ ไม่เลื่อน S2 feature ไป S3 เพื่ออ้างว่า S2 เสร็จโดยไม่มี approved scope revision

## 3. ลำดับ dependencies และงานที่ทำขนานได้

1. ทั้งคู่ตกลง baseline และ interfaces; A ประสาน foundation/schema/auth; B รวบรวม UI/API proposals และ test cases
2. F-01 foundation → F-02 template persistence/list → F-03 goal creation/read → F-04 entry/progress ทั้งสายต้องรวมเป็น journey เดียว
3. B เขียน contract/STS F-02/F-04 และ review เอกสาร A ระหว่างรอ foundation ได้ เมื่อ interface/dependencies พร้อมจึงเริ่ม tests→implementation; ไม่สร้าง scaffold/schema/auth อีกชุดแยกจาก A
4. หลัง S1 ทำ Lab 5 delivery งานคู่ขนานกับ F-05→F-06; F-06 ต้องอ่าน target ของแต่ละวันจาก design เดียวกัน
5. F-07 พึ่ง F-03/F-05; F-08 พึ่ง F-04/F-05/F-06 จึงตกลง target history ตั้งแต่ S1 เพื่อลดการแก้ข้อมูลย้อนหลัง

Mock ใช้พัฒนา UI ได้ตามข้อตกลง แต่ release persistence/access evidence ต้องมาจาก API และฐานข้อมูลจริง เมื่อ blocker ยังไม่จบให้ปรับแผนและบันทึก owner/ผลกระทบ ไม่ข้าม interface agreement หรืออ้าง feature done

## 4. แผนรายวันถึง D1 (internal targets)

วันที่และงานในตารางนี้เป็นเป้าหมายภายใน **ไม่ใช่สิ่งที่ทำสำเร็จแล้ว** เป้าหมายภายในพร้อมส่ง 8 พ.ย. ก่อน 18:00 น. ตาม team-plan; กำหนดส่งจริง 23:59 น.

| วัน | A | B | Gate ร่วมกัน |
|---|---|---|---|
| 3 พ.ย. | SRS/System SDS/ER/auth/data proposal; repo/collaborator/board เมื่อพร้อม | Inventory/traceability/แผน/UI/API; F-02/F-04 contracts; baseline review/status | Resolve scope/BR/open interfaces; บันทึกว่ารับหรือขอแก้ข้อใด; ยังไม่เริ่ม code ที่ dependency ไม่พร้อม |
| 4 พ.ย. | F-01 contract→meaningful tests→auth/foundation | เมื่อ F-01/shared interfaces พร้อม: F-02 contract review→tests→templates | Contract ก่อน implementation; coordinated migration; เก็บ red/green จริง |
| 5 พ.ย. | F-01 peer review/integration; F-03 contract/tests/code | F-02 peer review/integration; F-04 test design/tests และ code เมื่อ goal dependency พร้อม | Manager→template และ Participant→goal ใช้ข้อมูล/API ที่ตรงกัน |
| 6 พ.ย. | จบ F-03 ตาม AC; review F-04 | จบ F-04 ตาม AC; review F-03 | Retrieve persisted progress; invalid/future/duplicate/concurrent/ownership/logout checks |
| 7 พ.ย. | Fixes/build/API checks; รวบรวม PDF A/C/E | Fresh setup/selected E2E; รวบรวม PDF B/D/F | Full integration/acceptance บน release candidate; actual counts/known gaps; release PR หลัง checks |
| 8 พ.ย. | Review PDF/release/results; ตรวจงาน B | Review PDF/navigation/setup; เตรียม reviewed release PR ตามสภาพจริง | Accepted main/tag/commit; PDF มีเอกสาร+หลักฐานในตัว; ทั้งคู่ตรวจแล้วส่ง LEB2 |

## 5. Delivery/UAT/maintenance ที่ต้องทำร่วมกับ Sprint 2-3

| ช่วงเสนอ / checkpoint | งานและผู้ประสานตาม team-plan | หลักฐานที่ต้องเก็บเมื่อทำจริง |
|---|---|---|
| 9-15 พ.ย. / Lab 5 | A นำ Docker/DB persistence/config; B นำ CI/CD/quality gate/deploy; ทั้งคู่ทดลอง delivery/restart | PR build/tests ที่มี assertions, successful CI และ controlled failing check บน temporary branch ที่กั้น release ได้จริง; Docker fresh build; GCP UI/API/DB journey; data หลัง restart/redeploy; reviewed change→CI→main→deploy และ commit/version |
| 9-22 พ.ย. / S2 internal target | A F-05, B F-06; review ข้ามคน; ส่ง issue blockers ทันที | Contracts/test design ก่อน code, target-version/streak red/green, AC→actual tests/results/commit, API/DB/new access paths และ original S1 regression |
| 16-22 พ.ย. / Lab 6 | B เตรียม UAT/handoff ของทีม; A นำทดสอบแอปคู่; ทั้งคู่เป็น tester/developer | อย่างน้อย 4 user-facing cases: normal, boundary/domain rule, role/ownership, state/history/persistence; UAT ID/steps/expected/actual/tester/version/defect link; triage; accepted defect อย่างน้อยหนึ่ง→regression test→fix→review/CI/deploy→independent retest |
| 17-29 พ.ย. / Lab 7 | ทั้งคู่ขอ instructor/TA-approved change ต่อ implemented behavior และแบ่ง impact/contract/test/code/review | Change request/approval, impact links, revised contract, changed-behavior red test, implementation/green/regression, review/CI/redeploy; 5 dated metrics พร้อม time window/source และ interpretation ≤100 คำ; readiness + retrospective: helped/hurt/change |
| 23-29 พ.ย. / D2 | A F-07; B F-08; ทั้งคู่ integrate และอัปเดต baseline | S2 completion ทุก feature; S3 contracts ทั้งหมด; ≥1 S3 meaningful workflow/rule tested; deployed main candidate+CI run/version; original S1 continuity; current Lab5-7 findings/status; exact remaining AC/defect/owner/dependency/next action/date |

Lab 6 ถ้าไม่พบ defect จริงให้ขอ controlled defect exercise จาก TA ตามโจทย์ ไม่แต่ง findings หรือใช้ new feature แทน defect fix Lab 7 baseline backlog feature อย่างเดียวไม่นับ maintenance change ต้องเป็น approved change ของพฤติกรรมที่ทำงานแล้ว และแยกหลักฐานประเมินจากงานฟีเจอร์ปกติ

GCP resource access/บริการรอแนวทาง Lab 5 และข้อตกลงทีม; ไม่อ้างว่าได้ cloud resource หรือ pipeline แล้ว D1 ยังไม่บังคับ completed Docker/CI/CD/GCP หรือ separate demo video แต่ต้องมี local build/test results ผูก release commit

## 6. เป้าหมาย D2 และช่วงสอบถึง Final

- **ก่อน 29 พ.ย.**: ระบบควรเกือบครบ; S2 accepted ทั้งหมด; F-07/F-08 contracts ครบ; อย่างน้อยหนึ่ง S3 workflow/rule implemented/tested ใน candidate จริง วางแผนให้ทั้งสองมีความคืบหน้าเพื่อลดงานช่วงสอบ
- **30 พ.ย.-11 ธ.ค.**: ทำเฉพาะงาน completion/fix/verification ที่จำกัดและระบุได้ นัดเวลาตามสอบจริง 1-11 ธ.ค.; ห้ามเก็บ main workflows ไว้ 12-13 ธ.ค. ทุกงานเหลือมี ID/AC/owner/dependency/date
- **12 ธ.ค. เป้าหมายภายใน**: final build/regression/NFR checks และ relevant independent UAT retests บน final commit; accepted critical defects resolved; verify durable data หลัง deployment operation; freeze version สำหรับหลักฐาน
- **13 ธ.ค.**: ทั้งคู่ตรวจ PDF/navigation/current SRS/SDS/contracts/matrix/DoD/defect-debt/setup, อัด/ตรวจวิดีโอและส่งก่อน 23:59 น. deployment และ repository ต้องเข้าถึงได้ตลอดช่วง grading ที่ผู้สอนประกาศ

Final video/rubric มีข้อความขัดกัน: Final หน้า 2 ระบุ ≤10 นาที แต่หน้า 4 ระบุ ≤4 นาที; Group Specs หน้า 13 แบ่ง video 8 + release summary 2 คะแนน ขณะที่ Final หน้า 1/4 ให้ video 10 คะแนน ให้ A/B ถาม TA และบันทึกคำตอบใน [baseline review](../reviews/baseline-review-b.md) ก่อนจัดทำงานส่ง อาจเตรียม outline ≤4 นาทีและ release summary หนึ่งหน้าเป็นข้อเสนอชั่วคราว แต่ไม่ถือว่าความขัดแย้งได้รับการตัดสินแล้ว

## 7. Completion gates และหลักฐานของ B

ก่อนเริ่ม feature code: SRS link หรือ pending gap ที่ resolve แล้ว, contract/AC/STS ที่ทั้งคู่ตรวจ, shared interfaces/schema ownership ตกลง, Issue และ branch จาก staging เมื่อ repository พร้อม ทุก required AC มี planned test และ permissions อยู่ที่ backend

ก่อน accepted release: meaningful behavior implemented; unit/API+DB/selected E2E รันจริงตาม scope; actual file/name/command/counts/results/commit; TDD rule work เก็บ intended red/green versions; peer review มีข้อสังเกต/เหตุผลจริง; staging integration/acceptance ผ่าน; docs/setup current และ failed/skipped/incomplete เปิดเผย ห้าม author approve ตนเอง หลัง Lab 5 เพิ่ม CI gate/deployment/post-deploy evidence

| D1 ส่วนที่ B รวบรวม | เนื้อหาที่ต้องใส่ใน PDF เดียวกับ A | สถานะรอบนี้ |
|---|---|---|
| B: Inventory/traceability | F-01..08, baseline FR/BR/NFR→feature→sprint; coverage gaps/approved changes | ร่างเอกสาร; SRS mapping รอ A |
| D: Three-sprint plan | Goals/owners/dependencies/completion outcomes; เหตุผล scope S1 และแผนงานเหลือ | ร่างในไฟล์นี้; รอ A review |
| F: Working S1/verification | Captioned normal/rejection/access/logout demonstrations; build/test output และ AC→planned ID→actual file/name/result; actual test excerpts 2 ชิ้น (rule/access); red/green; 2 completed Issue/PR chains/reviews/staging/main; contribution/AI-use/known gaps; setup summary | ยังไม่มี execution/release evidence; ห้ามใส่ PASS/commit/PR จำลอง |

B ทำ contract/tests/implementation F-02/F-04 และช่วย F-01/F-03 review; A ทำคู่กลับกัน ทั้งคู่มีส่วนใน requirements/design/tests/AI supervision/code/review/deployment/maintenance และอธิบายงานได้ ไม่ใช้จำนวน commit เท่ากันเป็นเป้าหมาย ใช้ [member B status](../handoffs/member-b-status.md) ส่งข้อเสนอรอบนี้กลับ A โดยไม่อ้างว่า A ได้ review แล้ว

## 8. Risks / ประเด็นประสานก่อนเริ่ม implementation

| Risk หรือสิ่งที่ยังไม่พร้อม | ผู้รับผิดชอบ / ทางดำเนินการ |
|---|---|
| ไม่พบ repository/SRS/System SDS/F-01/F-03 ใน snapshot | A ส่งเวอร์ชันล่าสุด/URL เมื่อมีจริง; B sync/review/map ก่อน code ไม่สร้าง remote/scaffold/database ซ้ำ |
| Auth/CSRF/error/goal snapshot/date interfaces ไม่ตรงกัน | B เสนอใน conventions/F-02/F-04; A ตอบและรวมใน System SDS; contract revisions ต้องเห็นเหตุผล |
| วันที่ 3-8 พ.ย. สั้นและ dependency เป็นสาย | ทำ docs/test design ขนาน; resolve gates รายวัน; ไม่ลด scope เงียบหรือใช้ mock เป็น final evidence |
| UAT partner/TA approval/cloud guidance ยังไม่ทราบ | นัดคู่ UAT/ขอ TA ตามเวลา; ถ้าล่าช้าบันทึก blocker และขอ assistance โดยไม่สร้างหลักฐานขึ้นเอง |
| ตารางสอบ 1-11 ธ.ค. | ทั้งคู่ใส่เวลาว่างจริงและทำระบบเกือบครบก่อน 29 พ.ย.; บันทึกงานเหลือแบบ bounded |

| รุ่น / วันที่ | การเปลี่ยน | การยืนยัน |
|---|---|---|
| B-draft-01 / 3 พ.ย. 2026 | ร่าง allocation F-01..08, Sprint gates, Lab5-7/D1/D2/Final evidence และช่วงสอบ | รอ A/B; ไม่มี execution/review/release ในรอบนี้ |

## 9. เพิ่มรายละเอียดจาก Lab5 handout และ central repository

อัปเดต 3 พ.ย. 2026: พบ repository กลาง, SRS, shared interfaces และ implementation ของ A ใน PR #3 แล้ว ข้อ “ไม่มี foundation” ใน snapshot เดิมจึงไม่ใช่อุปสรรคปัจจุบัน ให้ตรวจงาน A และปรับ contracts ของ B ก่อนต่อ F02/F04 จากโครงเดิม รายละเอียดสถานะจริงและแหล่งอ้างอิงอยู่ใน [Lab5 gap review](../labs/lab-05/gap-review-b.md)

- R-12 บังคับ repository เป็น public จน grading จบ; ปัจจุบันยัง private และ rulesets API ตอบ 403 จึงต้องให้ owner จัดการก่อนสาธิต gate
- เพิ่ม required artifacts: Dockerfile/.dockerignore, env examples ที่ครบ, CI/CD workflows และ `docs/labs/lab-05/deployment.md` พร้อมตาราง env, resource names, release procedure และวิธีระบุ running commit
- CI ต้องตรวจ PR เข้าทั้ง `codex/sprint-1-staging` และ `main`; kit เดิมที่ใช้ `[main]` อย่างเดียวไม่พอ และ root package ของ A ต่างจาก server/client packages ใน kit
- เก็บ checks C-01–C-06 แยกกัน: passing PR, normal failing PR ที่ merge ถูกบล็อก, fresh container build, public domain journey, ข้อมูลหลัง restart และ redeploy, reviewed release ที่ revision ตรง SHA; ทั้งหมดยังไม่รันโดย B
- Lab5 PDF ชื่อ `lab5_sec<section>_<group name>.pdf` ใช้ Answer Part 0–4 และ rubric 30/20/35/15; เป็น evidence index ที่ใช้ direct links ต่างจาก engineering PDF ของ D1/D2/Final
- WIF, image digest, migration job แยก, read-only smoke และ rollback เป็น recommended practices; หากใช้ kit ต้องปรับ paths/commands/cookie+CSRF ให้ตรง StudyTrack

ส่วนเพิ่มนี้เป็นแผนและผลอ่านเอกสาร/metadata ยังไม่ใช่หลักฐานว่า Lab5 หรือ Sprint1 เสร็จแล้ว กำหนดส่ง D1 วันที่ 8 พ.ย. และ Lab5 วันที่ 15 พ.ย. เวลา 23:59 Asia/Bangkok คงตามโจทย์

## 10. Implementation update — B

3 Nov2026: F02/F04 are implemented locally on A PR3 foundation. Contract revision ee14477 preceded B code; Issues4/5 and branches codex/f02-templates → codex/f04-entries-progress track dependencies. Final source0b51571:115 API/unit +24 desktop/mobile checks pass; real process restart preserves entry/progress/session and build passes. Current dependency chain is temporary until A PR3 and B PRs are peer-reviewed/integrated into codex/sprint-1-staging, then reviewed release to main. Sprint1 is not accepted yet; D1PDF/CI/GCP/UAT remain separate pending work. See updated B handoff/verification for real references
