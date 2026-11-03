# StudyTrack — Decision and change log

Version 0.1, 3 November 2026. ผู้ร่าง: member A assisted by Codex. สถานะทุกข้อด้านล่าง: PROPOSED BY A / awaiting teammate review ไม่ใช่บันทึกว่า B หรือ TA อนุมัติแล้ว

| ID | Decision / origin | Rationale and impact |
|---|---|---|
| DEC-01 | เลือกหัวข้อ 8 บริบทอ่านหนังสือ; ผู้ใช้สั่งเริ่มหลังหารือหัวข้อ | จำกัดหน่วย MINUTES เพื่อให้กฎและ tests ชัด; เพิ่มหน่วยต้อง revise contracts |
| DEC-02 | repo/folder/database ใหม่ `studytrack` แยก TokTickIT | เป็นผลิตภัณฑ์ใหม่ของทีม; ไม่ปะปน old lab history/secrets |
| DEC-03 | A ทำ F-01/F-03, B ทำ F-02/F-04; peer review จริง | ทุกคนทำ design/tests/code/review; A/B ไม่สลับตามผู้อ่าน |
| DEC-04 | version 0.1 SRS เป็นแหล่ง FR/BR/NFR IDs; brief เป็น context | B สามารถ map requirements โดยไม่สร้าง IDs ชนกัน; ยังต้อง review ร่วม |
| DEC-05 | same-origin modular monolith; PostgreSQL/Prisma | deploy แบบหนึ่งแอปได้; DB durability แยก lifecycle ของ app |
| DEC-06 | server session, Argon2id, CSRF synchronizer token และ Origin check | logout revoke จริง; ไม่พึ่ง client role; รายละเอียดใน System SDS/F-01 |
| DEC-07 | snapshot template bounds ที่ goal และ target versions ตาม effective date | แก้ template/target ภายหลังไม่เปลี่ยนประวัติ; unique indexes ป้องกัน concurrent duplicates |
| DEC-08 | fixed Asia/Bangkok, dates=DATE, timestamps=UTC | ลด date-boundary ambiguity; test ด้วย fixed clock |
| DEC-09 | pre-code documents เก็บใน Git ก่อน implementation | แสดงลำดับจริง; initial docs commit ไม่ใช่ accepted feature release |
| DEC-10 | ยังไม่มี shared GitHub repo/collaborator จากข้อมูลผู้ใช้ | ทำงาน local/docs ได้; ไม่อ้าง Issues/PR/review จนมีจริง |

## Open items

| ID | Item | Owner / next action |
|---|---|---|
| OPEN-01 | ชื่อ/รหัสนักศึกษา/GitHub ของ A และ B | ผู้ใช้เติมข้อมูลจริงก่อน PDF และ collaborator setup |
| OPEN-02 | shared repo สร้างแล้ว; collaborator และ board ยังต้องจัดทำ | Repo private auto4496/studytrack; รอ GitHub ของ B; ZIP ใช้ได้ระหว่างยังไม่มีสิทธิ์ |
| OPEN-03 | B review SRS/SDS/interface/F-01/F-03 และส่ง contracts F-02/F-04 | B; feedback ที่มีจริงลง review notes/PR |
| OPEN-04 | PDF แม่บทเรียก evidence index แต่ handouts ต้อง self-contained | ใช้รายละเอียด handout เตรียม PDF ที่ฝัง complete documents; ยืนยันถ้ามีคำสั่งใหม่ |
| OPEN-05 | Final video 4/10 นาที และ rubric 8+2/10 ไม่ตรงกัน | ทั้งคู่ถาม TA ก่อนผลิต final video; ไม่ขวาง Sprint 1 |
| OPEN-06 | GCP resources/components | รอ Lab 5 guidance; ปัจจุบันเป็น deployment plan |
| OPEN-07 | คู่ UAT และ approved Lab 7 change | ทั้งคู่ประสานตามรอบ Lab; ไม่สร้าง defect/review records เอง |

เมื่อเปลี่ยนข้อกำหนด ให้เพิ่มแถว: date / author / source / affected IDs / old→new / rationale / reviewer / implementation+test versions ไม่เขียนทับประวัติเดิมให้เหมือนตกลงตั้งแต่ต้น

## Actual infrastructure events

- 3 November 2026: ใช้ existing authenticated GitHub account `auto4496` สร้าง private repository `https://github.com/auto4496/studytrack` และ push initial pre-code documentation commit `11cdfe5` ไป main สำเร็จ เป็นการตั้งต้น repository ไม่ใช่ teammate-reviewed feature release; ไม่มีการเพิ่ม B เพราะยังไม่ทราบ username
