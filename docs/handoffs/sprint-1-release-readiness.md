# Sprint 1 — release readiness

4 พฤศจิกายน 2026. ผู้เตรียม B/Datakung; ผู้ review release A/auto4496 ตาม team plan. Feature review/integration เสร็จแล้ว; main release และรายงาน D1 ยัง pending

## งานที่รับเข้า staging แล้ว

| งาน | Review/merge จริง |
|---|---|
| A foundation, F01 auth และ F03 goals | [PR3](https://github.com/auto4496/studytrack/pull/3) ผ่าน [B re-review](https://github.com/auto4496/studytrack/pull/3#pullrequestreview-5764429004); merge1a4b74b |
| B F02 templates, Issue4 | [A approval](https://github.com/auto4496/studytrack/pull/6#pullrequestreview-5764793996) ที่ec681e9; [PR6](https://github.com/auto4496/studytrack/pull/6) merge18e5882; Issue4 CLOSED |
| B F04 entries/progress, Issue5 | [A approval](https://github.com/auto4496/studytrack/pull/7#pullrequestreview-5764853759) ที่36fc9b6; [PR7](https://github.com/auto4496/studytrack/pull/7) merge85f510f; Issue5 CLOSED |

Accepted integration candidate คือ `85f510f0d73b84f39c08fbf3ef36e43b232bb044` บน `codex/sprint-1-staging`; main ยังเป็น `42b9eb2f28989196e9280041ccdcdeae88461028` ตอนตรวจ. ไม่พบ blocking findings ใน A reviews ของ PR6/7 จึงไม่มี product fix เพิ่มในรอบนี้

## ผลตรวจและความตรงกันของ source

- B tested sourceafca38f:117API/unit +24browser, buildและreal API restartผ่าน เก็บ [B results](../verification/member-b.md)
- A independently ran F02 at ec681e9:66API/unit+16browser/buildผ่าน; งานรวมที่f1577ea:117API/unit+24browser/build/restartผ่าน อ่าน [A review record](../reviews/pr-6-and-7-member-a.md) และ raw reports ที่อ้างในไฟล์นั้น
- B อ่าน JSON ของ A ยืนยันจำนวน pass/fail/skip/flakyตรงกับreview แล้วตรวจ `git diff --name-only` ยืนยัน tracked tree cb52f39=f1577ea และ36fc9b6=85f510f. Application/tests/config ของaccepted stagingยังตรงกับ B tested afca38f; deltaเพิ่มเฉพาะเอกสารและหลักฐาน review
- จึงไม่รัน runtime suitesซ้ำในรอบเอกสารนี้ และไม่อ้างว่าผลของ A เป็นการรันของ B. [Metadata การตรวจ](../../artifacts/evidence/member-b/sprint-1-release-readiness.json) ระบุขอบเขตและcommits

## ขั้นตอนก่อนรับ release และส่ง D1

1. ให้ A review/merge PRเอกสารสถานะรอบนี้เข้าstagingก่อน; application codeไม่เปลี่ยน. ตรวจว่าrelease diffใช้stagingล่าสุดและ AC/traceability/setupยังตรงเวอร์ชัน
2. ใช้ release PRจาก `codex/sprint-1-staging` เข้า `main`; BเตรียมและA review ไม่ใช้การอนุมัติfeatureแทนrelease review. คงเป็นdraftขณะยังมี readiness itemsค้าง
3. ก่อนรับrelease ให้ทีมตรวจขั้นตอนรันและยอมรับscopeของSprint1ตามcontracts/AC พร้อมบันทึกข้อจำกัดจริง ถ้ามีsourceเปลี่ยนให้ทดสอบส่วนที่ได้รับผลและintegrationตามความจำเป็น
4. หลังrelease merge Bตรวจ clean mainที่accepted SHA บันทึกผล/วิธีรันและversion/tagตามที่ทีมใช้ แล้วจึงอ้างreleased revisionในรายงาน
5. D1 PDFแบบself-contained Part A–Fยังต้องรวบรวมและให้ทั้งสองคนตรวจ; ใช้หลักฐาน normal/rejection/access/logout, AC mapping, red/green, review/merge chains และcontributionsจริง กำหนดส่งตามแผน8พ.ย.2026เวลา23:59Asia/Bangkok

Independent human UAT, CI/required checks, Docker/GCP/deployment evidence และSprint2/3ยังเป็นงานแยก pendingตามแผน ไม่อ้างว่าผ่านจากfeature approval. CI/GCPไม่ใช่completed D1 requirementตามแผนปัจจุบัน แต่ต้องทำให้ครบLab5ต่อไป ไม่มีการเปลี่ยนvisibility/cloud/branch protectionในรอบนี้
