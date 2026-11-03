# F-02 Activity templates — engineering contract v0.2

วันที่ 3 พฤศจิกายน 2026 | Owner B | Reviewer A (pending)

สถานะ: specification before B implementation; ใช้ foundation A ที่ 2370df9 และ temporary dependency บน PR #3 ซึ่งยังไม่ merge ไม่มีการอ้าง human approval หรือผล tests ล่วงหน้า ประวัติ draft-01 อยู่ใน commit e3714d0

## 1. Linked requirements / scope

[SRS](../../srs.md): FR-04/05/06/19; BR-01/07/10; NFR-01/02/03/04/06/07/08. ใช้ [integration contract](../../integration-contract.md) และ router/read adapter ของ A เป็นฐาน เพิ่ม manager-create และ UI โดยไม่สร้าง scaffold/schema/migration/auth ซ้ำ Update/deactivate เป็น F05; การลบยังไม่อยู่ในขอบเขต

## 2. Feature SDS / UI / API / data

Manager login → catalog → create → save DB → fresh list/detail. Participant login → active catalog/detail → goal picker F03. Identity/role จาก server session; CSRF+Origin ใช้ middleware A; ผู้ดูแลไม่เห็น personal goals/entries

- GET `/api/templates?page=1&pageSize=20` และ GET `/api/templates/:templateId` ใช้ adapter A: active only สำหรับ Participant; Manager ใช้ includeInactive=true ได้; sort createdAt DESC/id ASC; list `{data:TemplateDTO[],meta:{page,pageSize,total}}`
- POST `/api/templates` เฉพาะ PROGRAM_MANAGER รับ `{title,description?,minMinutes,maxMinutes}`; title trim 1–100 Unicode code points, description trim <=500/default empty; min/max เป็น JSON integer 1..1440 และ min<=max; ชื่อซ้ำได้คนละ UUID
- Server กำหนด unit=MINUTES/isActive=true/createdById/timestamps; return201 `{data:TemplateDTO}` allowlist ตาม A; client unit/id/owner/role/status เป็น unknown422
- Errors: anonymous401, wrong role403, CSRF_INVALID/ORIGIN_FORBIDDEN403, validation422, invalid UUID400, absent/invisible404, safe INTERNAL_ERROR500; fields เป็น field:string พร้อม requestId ตาม shared envelope
- UI `/manager/templates/new` มี labels/unit/helper/field errors; คง input เมื่อ error; disable submit/inputs ขณะส่ง; unknown POST outcome ต้องให้ตรวจ catalog ก่อนส่งใหม่ ไม่ automatic retry (titleซ้ำได้จึงห้ามรับประกัน exactly once). Catalog มี loading/empty/retry/manager-create และ inactive filter; Participant ไม่มี create action
- Data ใช้ ActivityTemplate และ constraints/migration A เดิม; min/max/date validation ที่ service และ DB; ไม่มี schema change. F03 recheck active และ snapshot unit/range/title ก่อนสร้าง goal; F02 ไม่แก้ goal snapshots

## 3. Acceptance criteria / STS

ทุก test ด้านล่าง planned ณ contract commit; fixture Manager/P1/P2 เป็น synthetic accounts คนละคนกับสมาชิกทีม; integration ใช้ real PostgreSQL แยก; actual ledger ใน [traceability](../../traceability.md)

| AC | Observable outcome | Planned test IDs (level / preconditions, action → expected) |
|---|---|---|
| AC-F02-01 | Manager create201, normalized allowlisted DTO, one persisted row owned by session | TEST-F02-01 API+DB: manager/CSRF → POST trimmed/omitted description → 201/default/server fields; TEST-F02-11 API+DB: deliberate same-title twice → distinct IDs |
| AC-F02-02 | Invalid fields/ranges/types422/no writes; exact bounds accepted | TEST-F02-02 unit: parameterized 100/101 title,500/501 description,1/1440,min=max,reverse,noninteger; TEST-F02-03 API+DB: valid manager POST same invalid/boundary matrix → expected counts |
| AC-F02-03 | Active/paged/detail/empty catalog, manager inactive only; safe DTO | TEST-F02-04 API+DB: mixed active/inactive fixtures and tie timestamps → both roles list/detail/filter/pagination checks; wrong-role inactive403 |
| AC-F02-04 | Anonymous401 and Participant create403 even forged role, no mutation | TEST-F02-05 API+DB: anonymous/P1 → GET/POST/spoof payload →401/403 and DB unchanged |
| AC-F02-05 | CSRF/origin reject403; revoked session401 | TEST-F02-06 API+DB: manager → bad token/origin, logout, replay cookie →403/401; no writes |
| AC-F02-06 | Fresh API/new app instance/reload retrieve DB-backed result | TEST-F02-07 API+DB: saved template → fresh GET/new app with same DB → ID/content match; TEST-F02-10 browser: manager create → reload → Participant selection |
| AC-F02-07 | Unknown fields422; errors and DTO never leak DB/credentials/private records | TEST-F02-08 API+DB: unknown keys and isolated controlled DB insert failure →422/safe500, no rows |
| AC-F02-08 | Loading/empty/validation/saving/error/unknown outcome recover visibly, keyboard usable | TEST-F02-09 browser: controlled delay/network/422 → pending disabled, input preserved, no automatic retry, catalog inspection; viewport390x844/1440x900 |
| AC-F02-09 | Manager-created template can be selected by Participant to create own goal | TEST-F02-10 browser with real API/DB: login manager→create→logout→Participant→goal→reload; Participant cannot access manager create route |

## 4. DoD / execution evidence

Contract committed before tests/implementation; feature Issue and bounded branch; API red for missing manager POST/range rejection then green with real DB; unit/API/browser checks and build recorded with file/name/command/counts/result/source commit; A regression kept enabled. A reviews PR before accepted staging integration. B cannot approve A as its author. No accepted release until both features/full journey verified and peer review done. Keep failed/skipped counts and safe screenshots; no secrets

## 5. Revision decisions

| Version | Change / reason | Acceptance |
|---|---|---|
| draft01 | Original standalone B proposal in e3714d0 | Historical, superseded |
| 0.2 | Adopt A /api/templates, MINUTES, title100/description500, server-owned unit, pagination/DTO/error/CSRF/logout204; retain stable AC/test IDs | B starts per user authorization; A peer review pending |
