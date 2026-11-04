# F02 — ส่ง A ตรวจหลังรับ foundation

4 พฤศจิกายน 2026. Issue [#4](https://github.com/auto4496/studytrack/issues/4), PR [#6](https://github.com/auto4496/studytrack/pull/6), ผู้เขียน B/Datakung; ผู้ review A/auto4496

PR3 merge เข้า `codex/sprint-1-staging` แล้วที่ `1a4b74b8373999dd969a17400f649113596b649e`. B merge accepted staging เข้า branch `codex/f02-templates` เดิมโดยไม่มี conflict ไม่เขียนประวัติที่เผยแพร่แล้วใหม่ Tested source คือ `5e340f8a111579dbd2c5ef5e0767086ae4a1475b`; commit หลังจากนี้ที่เพิ่มหลักฐาน/เอกสารไม่ได้เปลี่ยน application code

## ผลทดสอบบนฐานใหม่

| Check | ผลจริง | หลักฐาน |
|---|---|---|
| API/unit ทั้งหมด | 66pass/0fail/0skip = A40+B26 | [output](../../artifacts/evidence/member-b/post-pr3-merge/f02/api-output.txt), [JSON](../../artifacts/evidence/member-b/post-pr3-merge/f02/api-results.json) |
| Browser ทั้งหมด | 16pass/0fail/0skip = A10+B6; desktop1440x900/mobile390x844 | [output](../../artifacts/evidence/member-b/post-pr3-merge/f02/browser-output.txt), [JSON](../../artifacts/evidence/member-b/post-pr3-merge/f02/browser-results.json) |
| Build | ผ่าน backend/client typechecks และ production build | [output](../../artifacts/evidence/member-b/post-pr3-merge/f02/build-output.txt) |
| Real API restart | session/goal/initial target คงอยู่; เป็นขอบเขต A restart smoke | [output](../../artifacts/evidence/member-b/post-pr3-merge/f02/restart-output.txt) |

รายละเอียดคำสั่ง, reporting wrapper และฐาน B test ที่แยกจาก dev/A อยู่ใน [execution metadata](../../artifacts/evidence/member-b/post-pr3-merge/f02/execution.json). [ภาพ F02 รอบใหม่](../../artifacts/evidence/member-b/post-pr3-merge/f02/screenshots/) แยกจากหลักฐานเดิม ไม่ใช้จำนวนผลของฐานเดิมแทนรอบนี้

## ให้ A ตรวจ

ตรวจ [F02 contract](../sprints/sprint-1/f02-templates.md), AC mapping ใน [verification](../verification/member-b.md), diff เข้า accepted staging และ assertions จริง: manager-only create, strict validation/Unicode bounds, server-owned unit/status/creator, cookie/CSRF/Origin, participant catalog/goal selection, UI pending/validation/unknown POST outcome โดยไม่ retry อัตโนมัติ

F02 ต่อ scaffold/auth/schema ของ A เดิม ไม่เปลี่ยน package/lockfile/schema/migrations/auth implementation; F04 ยังอยู่ PR7 แยกต่างหาก ไม่มี A approval ของ F02 หรือ Sprint1 accepted release ที่อ้างในเอกสารนี้ เมื่อ A review/แก้/อนุมัติและ merge PR6 เข้า staging แล้วจึง retarget PR7 เข้า staging และตรวจบนฐานรับจริงอีกครั้ง
