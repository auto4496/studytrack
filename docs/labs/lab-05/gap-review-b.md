# Lab 5 gap review — สมาชิก B

> Historical audit before B implementation. F02/F04 are now locally implemented/tested; see [current handoff](../../handoffs/member-b-status.md). CI/Docker/GCP/public-repository requirements remain pending as recorded below.

วันที่: 3 พฤศจิกายน 2026 (Asia/Bangkok) | Revision: B-lab5-review-01

สถานะ: READ-ONLY AUDIT + DOCUMENT PLAN — ตรวจโจทย์/kit/central repository แล้ว ยังไม่ได้รันแอป, CI, Docker build, cloud commands หรือ deployment และไม่ได้ส่ง review/เปลี่ยน visibility บน GitHub

## 1. ผลตรวจที่สำคัญ

แผน B เดิมครอบคลุม Docker/CI/GCP/persistence ในภาพรวม แต่ยังขาดรายละเอียด Lab 5 บางข้อ โดยเฉพาะ **R-12 public repository**, required files, checks C-01–C-06 และรูปแบบรายงานเฉพาะ Lab 5 นี่เป็นงานที่ต้องเติมก่อน 15 พ.ย. 2026 เวลา 23:59 ไม่ใช่ข้อสรุปว่าทีมส่งงานล่าช้า ณ วันนี้

Repository กลางมี foundation ของ A แล้วใน PR #3 จึงต้องใช้ข้อมูลกลางล่าสุดแทนข้อสันนิษฐานเดิมว่าไม่มี repo/SRS/code ขณะนี้ main/staging ยังไม่ใช่ accepted Sprint 1 release และฝั่ง B ยังต้องรวม F-02/F-04

## 2. แหล่งที่อ่านและน้ำหนักของข้อกำหนด

| แหล่ง | สิ่งที่ตรวจ | ใช้ตัดสินอย่างไร |
|---|---|---|
| [Lab 5 updated handout](../../../../Lab5/01_SE_Lab_5_updated.pdf) 11 หน้า | อ่านครบ; R-01–12 หน้า 3–4; required files หน้า 4; GCP access หน้า 5; C-01–06 หน้า 7; submission หน้า 9–10 | ข้อกำหนดให้คะแนนหลัก; หน้า 6 ระบุว่าถ้า guide/kit ไม่ตรงให้ยึด handout และแจ้ง TA |
| [Student Guide V1.1](../../../../Lab5/03_Student-Guide-GCP-Deployment-and+CI+CD-V1_1.pdf) 105 หน้า | อ่าน Episodes 0–10 ครบ; CI staging หน้า 38–43, WIF/gate หน้า 56–80, release หน้า 81–91, persistence/rollback หน้า 92–95, pause/teardown หน้า 96–105 | วิธีทำ reference ไม่ทำให้ทุก recommendation กลายเป็นข้อบังคับให้คะแนน |
| [Starter kit README](../../../../Lab5/toktickit-lab5-starter/README.md), [CI](../../../../Lab5/toktickit-lab5-starter/.github/workflows/ci-docker.yml), [deploy workflow](../../../../Lab5/toktickit-lab5-starter/.github/workflows/deploy.yml), Dockerfile, smoke script และ docs สามไฟล์ | ตรวจไฟล์รวม hidden workflows; ZIP มี 23 ไฟล์พร้อม worked example ไม่มี application source | เป็น template ของ TokTickIT ต้อง adapt ไม่คัดลอกทับ StudyTrack ทั้งชุด |
| [Central repository](https://github.com/auto4496/studytrack), [PR #3](https://github.com/auto4496/studytrack/pull/3) | อ่านผ่าน GitHub CLI ที่มีสิทธิ์; connector ตอบ 404 สำหรับ private repo | ข้อมูล repo/branch จริงมีน้ำหนักเหนือ snapshot ZIP เดิม |

PDF รวม 116 หน้า; ตรวจภาพ handout หน้า 4 และ 9 เพิ่มเพื่อยืนยันตาราง public/files/submission ไม่ได้อ้างราคาหรือเงื่อนไข billing ใน guide ว่าเป็นข้อมูลบัญชีปัจจุบันของทีม

## 3. สถานะ repository ที่ตรวจพบจริง

| รายการ | หลักฐาน/สถานะ ณ รอบตรวจ |
|---|---|
| Repository/visibility | `auto4496/studytrack`, default `main`, `isPrivate=true` จาก `gh repo view` — ยังไม่ตรง R-12 |
| main และ `codex/sprint-1-staging` | HEAD `42b9eb2f28989196e9280041ccdcdeae88461028`; มี docs A/SRS/System SDS/integration/F01/F03 contracts; ยังไม่มีแอปบนสอง branch นี้ |
| A feature branch | `codex/member-a-sprint1` HEAD `2370df9d760862a2c96aead7c70eb63762bb7192`; มี root package/lockfile, React/Express/Prisma, DB sessions, goals, read-only templates, schema/constraints และ tests/evidence |
| PR/Issues | PR #3 OPEN, base `codex/sprint-1-staging`, ไม่ใช่ draft; review decision ว่างและ statusCheckRollup=[]; Issues #1 F01/#2 F03 เปิดอยู่ |
| Actions | API `actions/runs` คืน total_count=0 — ยังไม่มี CI run ของ repo ให้ใช้เป็น Lab 5 evidence |
| Rulesets | API คืน 403 พร้อมข้อความให้ Upgrade หรือ make repository public; จึงยังพิสูจน์ required-check gate ไม่ได้ ไม่ตีความเป็น gate ที่เปิดใช้งานแล้ว |
| Board/สมาชิก B | README/handoff บน A branch ระบุ board และเชิญ `Datakung` แบบ Write แล้ว; รอบนี้ยังไม่ได้ยืนยันการรับคำเชิญ/columns/สิทธิ์ board ผ่านบัญชี B |
| ผลทดสอบ A | PR/README ระบุ local API/unit 38 และ browser 10 ผ่าน พร้อม artifacts/source versions; เป็นหลักฐานที่ A บันทึก ไม่ใช่การรันทวนอิสระของ B หรือ GitHub CI |
| Local checkout สำหรับตรวจ | `C:/CPE/CPE334/Project/studytrack-central-review` clone แยก; อ่าน A branch ด้วย `git show` โดยไม่ merge/reset ทับ snapshot B |

เมื่อเริ่ม implementation ให้ refresh HEAD/PR อีกครั้ง ข้อมูลนี้เป็น snapshot การตรวจ ไม่ใช่สถานะสดตลอดเวลา

## 4. Required coverage R-01–R-12 และสิ่งที่ต้องเติม

| ID | สิ่งที่โจทย์บังคับ | Coverage/ช่องว่างปัจจุบัน | งานต่อ/ผู้ประสานที่เสนอ |
|---|---|---|---|
| R-01 | Docker fresh build จาก clean clone ได้ working container | A branch มี Compose สำหรับ dev/test DB เท่านั้น; ยังไม่มี application Dockerfile/.dockerignore | A นำ packaging; B fresh-clone verification; ต้องทดสอบ image/app จริง |
| R-02 | Settings จาก env, document ทุกตัว, no real secrets | A มี root `.env.example`/`.env.test.example`; ยังไม่มี deployment env/resource table | A/B ตรวจ env ทั้ง backend/frontend/seed/CI; เพิ่มตาราง purpose/secret/source และ `.dockerignore` |
| R-03 | Public GCP URL ทำงานครบ UI/API/DB | รอบนี้ไม่ได้เข้าถึง GCP และไม่พบ deployment evidence ใน branch ที่ตรวจ | B นำ delivery ตาม team plan; ทั้งคู่ตรวจ public domain journey/สิทธิ์ ไม่ใช้ health อย่างเดียว |
| R-04 | Data อยู่หลังทั้ง restart และ redeploy | A มี local process-restart evidence; ยังไม่ใช่ GCP redeploy evidence | A durable DB/config, B บันทึกก่อน/หลังบน cloud; ต้องตรวจทั้งสอง operation |
| R-05 | ทุก relevant PR build + meaningful automated tests | ยังไม่มี `.github/workflows` ใน A branch และ Actions runs=0 | B ร่าง CI ให้ตรง root npm scripts + isolated PostgreSQL; trigger ทั้ง staging จริงและ main |
| R-06 | Required check fail แล้ว merge ไม่ได้ | Private repo + rulesets API403; ยังไม่มี controlled failing PR | เจ้าของ repoจัด public ตาม R12 หลังตรวจ secrets; B เตรียม normal temporary PR ที่ failจริง/Required/blocked; ห้าม merge branch นี้ |
| R-07 | Reviewed change → CI → main → repeatable deployment | PR3 ยังเปิด; ไม่พบ deploy workflow | B นำ pipeline; A review/config/db coordination; deploy main เท่านั้น |
| R-08 | ระบุ running release commit และทำซ้ำได้ | มี Git SHA; ยังไม่มี cloud image/revision mapping | เก็บ release SHA → image digest → serving revision/URL และคำสั่ง release ใน deployment.md |
| R-09 | Issues/board/feature branch → peer-reviewed staging PR → release PR/main | มี Issues1/2/PR3 และ staging; acceptance/release review ยังไม่เกิด | B อ่าน/assertions/review A จริง; B features ต้องมี Issues/PR ของตน; ไม่ approve แทนคนอื่น |
| R-10 | Label แยก Lab5; เก็บ commits/contracts/CI history | Existing issues เป็น F01/F03; ยังไม่เห็น Lab5 issues ใน API ที่ตรวจ | เปิด Lab5 Issues เมื่อเริ่มจริงและติด label เช่น lab5; console-only setup ก็มี Issue/evidence; อย่าลบหลักฐาน failing run |
| R-11 | ทั้งคู่ร่วมทุก learning outcome และมี contribution evidence | มี A work และ B draft docs; ยังไม่ยืนยัน paired deployment/review execution | บันทึก contribution/roles ที่ทำจริง; ทั้งคู่ต้องอธิบาย release steps; ไม่บังคับ equal commit counts |
| R-12 | Repo public จน grading จบ | **ไม่ผ่านเงื่อนไขปัจจุบัน: isPrivate=true** | ให้ ownerตรวจ tracked files/history/screenshots/logs ว่าไม่มี secret ก่อนเปลี่ยน public; คง publicตลอดช่วงตรวจ; รอบนี้ไม่ได้เปลี่ยน setting |

Required files ที่ยังต้องเพิ่มเมื่อทำ Lab5: root Dockerfile, `.dockerignore`, CI/deploy workflows และ `docs/labs/lab-05/deployment.md` ตาม handout หน้า 4; `.env.example` มีแล้วแต่ต้องตรวจครบทุก setting ส่วน Compose ที่มีอยู่ยังไม่ถือว่าแอปถูก containerize แล้ว

## 5. จุดที่ copy starter kit ตรง ๆ แล้วจะไม่ตรง StudyTrack

| จุดต่างที่ตรวจจาก source | ผลกระทบ/การปรับที่ต้องทำ |
|---|---|
| Kit CI trigger แค่ `[main]` | เปลี่ยนเป็นครอบคลุม `main` และ **`codex/sprint-1-staging`** ตามชื่อจริง; อย่าใส่เพียง `staging` แล้วไม่มี check บน integration PR |
| Kit แยก package/lockfile ใน server/client แต่ A ใช้ root package/lockfile | ปรับ install/build/test/migrate/seed ทั้ง CI และ Docker; root scripts `db:generate`, `db:migrate`, `db:seed`, `db:test:migrate`, `test`, `build` มีแล้ว ไม่สั่ง npm ci ใน folder ที่ไม่มี manifest |
| Kit copy `/app/client/dist` แต่ A production staticRoot เป็น `dist/client` และ start=`node server/dist/index.js` | ปรับ paths/runtime files/CMD ให้ตรง actual Vite/TypeScript outputs; image ต้องมี migration/seed/runtime dependencies ด้วย |
| Kit PostgreSQL16 แต่ A Compose/tests ออกแบบ PostgreSQL17 | ตกลง version กับ A แล้วใช้ CI/local/cloud ให้สอดคล้อง; อย่าเปลี่ยนเวอร์ชันหรือ schema เงียบ ๆ; ไม่จำเป็นต้องใช้ version ของตัวอย่างตามชื่อ |
| Kit smoke `/api/health` คาด top-level status; A คืน `{data:{status,...}}` | ปรับ predicate ตาม actual envelope; health ปัจจุบัน query DB แล้ว; ยังไม่มี `/api/ready` แยก — ตกลง readiness check และ expected failure ก่อนใช้ kit |
| Kit smoke มี `/api/categories` public; StudyTrack ใช้ `/api/templates` แบบ login + pagination | เปลี่ยน endpoint/predicate หรือใช้ authenticated read ของ Participant; **ห้ามทำ templates public/ปิด auth เพื่อให้ smoke ผ่าน** |
| Kit optional login ใช้ bearer `token`; A ใช้ cookie + bootstrap CSRF + Origin | ถ้าทำ login smoke ต้องปรับ cookie jar/CSRF/Origin/no-body logout204; account สิทธิ์ต่ำและ secret injection; ถ้าเลือก skip ให้บันทึกตามจริงและยังต้องมี required C04 browser/domain checks |
| Kit runtime/service/job/registry/secrets เป็นชื่อ TokTickIT | เปลี่ยนให้เป็นชื่อของ StudyTrack ที่ตกลงจริงทุกไฟล์; ห้ามใช้ข้อมูลหรือ secret ของ TokTickIT |

WIF ไม่มี JSON key, deploy image ด้วย digest/tagเต็ม SHA, migration job แยก, additive migrations, read-only smoke, SHA-pinned Actions/Dependabot และ rollback/roll-forward เป็น **recommendations** ใน handout หน้า 5–6 (หรือแนวทางของ kit) ไม่ใช่ rubric เพิ่มต่างหาก หากใช้แนวทางอื่นต้องบันทึกเหตุผลและยังผ่าน R01–R12

## 6. Required checks / execution ledger (ยังไม่รันในรอบนี้)

| Check | เงื่อนไข/วิธีตรวจที่ต้องทำ | Expected / evidence ที่ต้องเก็บ | Owner เสนอ / actual result |
|---|---|---|---|
| C-01 | Normal PR ไป staging/main ที่มี workflow แล้ว | Build/tests ผ่านพร้อม meaningful counts/test names, CI run link/command/commit | B นำ CI, A review / NOT RUN |
| C-02 | Normal non-draft PR จาก temporary branch เข้า main; ตั้งใจทำหนึ่ง test fail หลัง gate active | Required check fail + merge blockedจริง; เก็บ PR/run และภาพ merge state; closeโดยไม่ merge; เก็บประวัติ | B เตรียม, A ตรวจ / NOT RUN |
| C-03 | Clean clone; กรอก env examples privately; build/run app container+DB ตามเอกสาร | Commands/output/commit; no source edits needed; working UI/API/DB; no secretในภาพ | A package, B fresh-run / NOT RUN |
| C-04 | Public cloud URL; Participant/Manager login; manager template → participant goal → entry → retrieval; rule/access rejection | URL-visible screenshots + expected/actual/role/starting state/version; API permission evidence | ทั้งคู่ / NOT RUN |
| C-05 | สร้าง goal/entry จริงใน test accountก่อน restartและก่อนredeploy; อ่านรายการเดิมหลังแต่ละ operation | ID/ค่าก่อนหลังคงอยู่; operation/revision/commit; no destructive seed | A DB, B รวบรวม / NOT RUN |
| C-06 | Visible reviewed changeจาก labelled Issue → feature PR/staging → release PR/main → CI/CD | Specific teammate review, pipeline link และ running revisionตรง release commit; reproducible procedure | ทั้งคู่ / NOT RUN |

แต่ละ check ต้องมี actual file/test name หรือ manual case, command/CI run, expected/actual, result/counts และ tested commit เมื่อทำจริง ผล local tests ของ A ไม่ถูกคัดลอกเป็น PASS ของ C01–C06 หรือ B tests

## 7. Required submission ที่ตกหล่นจากแผนเดิม

ส่ง PDF เดียวต่อทีมชื่อ `lab5_sec<section>_<group name>.pdf` บน LEB2 ภายใน **15 พฤศจิกายน 2026 23:59 Asia/Bangkok** ใช้หัวข้อตามลำดับ:

| Heading | คะแนน | สิ่งที่ต้องมี |
|---|---|---|
| Answer Part 0: Team and Evidence Index | required, ไม่แยกคะแนน | ทีม/หัวข้อ/ชื่อ/รหัส/GitHub ทั้งคู่, public repo, submitted SHA/tag, live URL/running SHA, contribution links และ evidence index |
| Answer Part 1: CI and Quality Gate | 30 | Workflow, passing PR/results C01, required-check setting, failing PR+blocked merge C02 |
| Answer Part 2: Docker and Reproducible Configuration | 20 | Dockerfile/.dockerignore, clean build/container+DB C03, env examples และ env table |
| Answer Part 3: GCP Deployment and Persistence | 35 | Public URL/domain C04, UI/API/DB resources, before/after restartและredeploy C05 |
| Answer Part 4: Repeatable Release Pipeline | 15 | Labelled Issue/PR/review/staging/main/CI/CD/revision chain C06 + deployment.md |

**Lab5 PDF เป็น concise evidence index** ใช้ direct links กับคำอธิบายสั้น และภาพเมื่อ linkแสดงหลักฐานเองไม่ได้ เช่น blocked merge/GCP setting/before-after พร้อม numbered captions/check IDs/version อ่านได้100% ไม่มี secret แตกต่างจาก D1/D2/Final ที่ต้องฝัง engineering documents ครบใน PDF; ไม่เหมารูปแบบเดียวทุก assessment

`deployment.md` ต้องระบุ chosen stack/การต่างจากreference, envแต่ละตัว(purpose/secret/source), build/test/run/migrate/seed commands, GCP project/region/resource names ที่เกิดจริง, release procedure และวิธีระบุ commitที่กำลังรัน ขณะนี้ยังไม่ได้สร้างไฟล์นี้เป็น completed deployment record

## 8. Cloud access / คนตรวจคำสั่ง / การคงบริการ

Handout §4.4 กำหนดให้สมาชิกหนึ่งคนใช้ personal Gmail สมัคร Free Trial, หนึ่ง project ต่อเนื่องถึง Final และเพิ่มเพื่อน Editor; ถ้าขอ prepayment/billing closed ให้หยุดและแจ้ง TA ไม่กด Upgrade/จ่ายเอง รอบนี้ไม่ตรวจบัญชีหรือเปลี่ยน billing/IAM/database และไม่ขอ secret

ให้คนในทีมอ่าน gcloud/console changes ก่อนรันตาม handoutหน้า8; budget alertเป็น recommendationและไม่ใช่ spending cap; sessionต้องไม่หายเพราะอยู่เฉพาะmemory/container (A ใช้ DB sessions แล้ว); อย่า pause/teardownระหว่าง UAT/demo/grading ต้องคง URLจนผู้สอนแจ้งจบการตรวจ Guide Ep9/10 เป็นการบริหารหลังใช้งาน ไม่ใช่คำสั่งให้ปิดบริการทันทีหลังส่ง Lab5

## 9. Dependency ฝั่ง B ที่คลี่คลายแล้ว และสิ่งที่ต้องปรับ

คำตอบเดิมที่ว่าไม่มี SRS/repo/foundation ใช้กับ snapshot เดิมเท่านั้น ปัจจุบันมี SRS IDs **FR01–19/BR01–13/NFR01–08** และ foundation code บน PR3 พร้อมให้ B ตรวจ ต่อไปใช้ข้อเสนอ shared integration ของ A เป็นฐานแล้วเสนอ revisionอย่างชัดเจน ไม่สร้าง scaffold/migration เดิมซ้ำ

| Interface | B draft-01 | A central contract/implementation | งานก่อน B implementation |
|---|---|---|---|
| API/templates | `/api/v1/activity-templates` | `/api/templates`, list/detail adapterมีแล้ว | Adopt/extend routerเดิม; เพิ่ม manager POST ไม่ mount GETซ้อน |
| Unit/template bounds | `minute`, title120/description1000, clientส่งunit | `MINUTES`, title100/description500, serverกำหนดunit | ปรับ contracts/UI/STS หรือเสนอ changeให้ A reviewก่อน code |
| Lists | ไม่มี pagination; createdAt ASC | `{data,meta}` pagination; createdAt DESC/id ASC; manager includeInactive | รวม FR06/detail/inactive-read scope และ bounded lists ให้ตรง actual adapter |
| Errors/logout | fields string[]; CSRF_FAILED/ENTRY_EXISTS; logout200 | fields string + requestId; CSRF_INVALID/ENTRY_ALREADY_EXISTS; logout204 | เปลี่ยน API consumers/tests ให้ตรง shared envelope/status; คง role403/cross-owner404 |
| Goal/date types | opaque ID, startsOn, targetVersionIdในprogress | UUID/startDate; target lookup service; progress shapeตาม integration contract | ใช้ `requireOwnedGoal`, `targetForDate`, shared clock/date utilities ของ A |
| Entries responses | POST DailyProgress; GETprogressมี nested entry | POST EntryDTO; GETentries paginated; GETprogressใช้ entryId/null | ตกลง payload/AC/STSก่อนเพิ่ม endpoints; อย่าทำ incompatible DTO สองชุด |
| SRS/NFR mapping | รอ SRS ทั้งหมด | มี stable source IDs และ measurable viewport390×844/1440×900 | เติม full traceabilityจาก SRSจริง รวม BR11–13; ยังคง NOT RUN สำหรับ B verification |

A handoff อนุญาตวิธีประสาน dependency: review/integrate PR3ก่อนแล้วแตก feature branchจาก stagingที่ยอมรับ หรือบันทึก temporary dependencyบน unmerged A branchและปรับหลังรวม วิธีเลือกยังต้องประสาน; รอบนี้ไม่ได้ approve/merge PR3 หรือเริ่ม implementation

## 10. ลำดับถัดไป / สิ่งที่ทำจริงในรอบนี้

1. B อ่าน A implementation handoff และตรวจ PR3/assertionsจริง แล้วคืน specific findings; ปรับ B contracts/SRS mappingให้ตรง central interfacesก่อน code
2. ตั้ง B feature Issues/branchesตาม staging/dependencyที่ตกลง; ต่อ F02/F04จาก existing foundation; สร้าง full D1 journeyก่อน packaging/deploy Lab5
3. A/B ประสาน public-repo transitionกับ owner, packaging/env/deployment design และ Lab5 Issues/labels/C01–06/PDF checklist; ไม่ถือว่า cloud setupต้องเสร็จใน D1
4. ภายหลังทำจริงจึงเติม deployment.md, commands/counts/results/revision และ direct evidence links; ก่อนนั้นสถานะทั้งหมดเป็น planned/not run

ทำจริงรอบนี้: อ่าน PDF116หน้า/kit docs+key files, clone/readcentral, อ่าน GitHub metadata/PR3/checks, ตรวจ sourceเพื่อหาจุดadapt และเขียน gap review/อัปเดตสถานะ B เท่านั้น ไม่มี test/build/cloud execution หรือ GitHub mutation จึงไม่มี fabricatedPASS/peer approval/accepted release
