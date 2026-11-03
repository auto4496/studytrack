# StudyTrack — ร่างเริ่มต้นโปรเจกต์กลุ่ม CPE 334

สถานะ: baseline เอกสารฝั่ง A v0.1 วันที่ 3 พฤศจิกายน 2026 พร้อมให้สมาชิก B review มี SRS/System SDS/shared interface และ F-01/F-03 contracts แล้ว ยังไม่มีโปรแกรม ผลทดสอบ หรือ accepted release

ชื่อ StudyTrack เป็นชื่อทำงานชั่วคราว หัวข้อที่เสนอคือหัวข้อ 8: Habit and Activity Tracking System ในบริบทการติดตามเป้าหมายอ่านหนังสือ

## เริ่มจากอะไร

1. ทั้งคู่ตรวจ [ขอบเขตผลิตภัณฑ์](docs/project-brief.md) และตกลงกฎก่อนเขียนโค้ด
2. ทั้งคู่ตรวจ [แผนแบ่งงานและการทำงานสองคน](docs/team-plan.md) แล้วใส่ชื่อและ GitHub จริง
3. สร้าง GitHub repository ใหม่ร่วมกัน เพิ่ม collaborator และ project board
4. บันทึก SRS, feature inventory, traceability, System SDS และแผนสาม Sprint เป็น baseline
5. เขียน feature contract/AC/STS ก่อนเริ่ม implementation ของฟีเจอร์นั้น
6. ทำ Sprint 1 ตาม Issue และ branch ที่แยกกัน ให้เพื่อนเป็นผู้ review ก่อนรวมงาน

โฟลเดอร์นี้แยกจาก TokTickIT เดิม เอกสารเป็นข้อเสนอการวางแผน ยังไม่ใช่การอนุมัติจากเพื่อน อาจารย์ หรือ TA และยังไม่ได้สร้าง GitHub repository/Issues/PRs

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

เอกสารเหล่านี้เป็นข้อเสนอ pre-implementation ไม่ใช่ผลทดสอบหรือ peer approval ที่เกิดขึ้นแล้ว ฝั่ง B ยังเป็นเจ้าของ features/traceability/sprint plan/UI conventions และ F-02/F-04 contracts

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

- `C:/Users/User/Downloads/group_work_specs_v1.pdf`
- `C:/Users/User/Downloads/project_deliverable_1_v1.pdf`
- `C:/Users/User/Downloads/project_deliverable_2_v1.pdf`
- `C:/Users/User/Downloads/project_final_delivery_v1.pdf`

เอกสารเหล่านี้ใช้เป็นข้อกำหนดของการส่งงาน ไม่ใช่หลักฐานว่าทีมได้ลงมือทำหรือผ่านการทดสอบแล้ว คำถามเรื่องความยาววิดีโอ Final (4 หรือ 10 นาที) และ rubric Final ที่ไม่ตรงกันต้องยืนยันกับอาจารย์/TA ก่อนจัดทำงานส่ง
