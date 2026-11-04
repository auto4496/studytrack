# StudyTrack — Shared integration contract

Version 0.1, member A proposal, 3 November 2026. เป็นข้อเสนอ interface สำหรับทั้งคู่ ยังไม่มี B review. อัปเดต: F-01/F-03 และ read-only template adapter มี A implementation แล้ว; F-02 mutations/F-04 ยังเป็น proposed surface ดู [actual signatures](handoffs/member-a-implementation.md). เปลี่ยนโดยเพิ่ม decision/version และประสานอีกฝ่ายก่อนทำโค้ดที่พึ่ง interface

Sources: [SRS](srs.md), [System SDS](system-sds.md). B ยังคงเป็นเจ้าของ `ui-api-conventions.md` และ F-02/F-04 contracts; ใช้เอกสารนี้เป็นจุดตั้งต้น ไม่ใช่การอ้างว่า B ทำงานเสร็จแล้ว

## 1. Transport and envelopes

- Same-origin `/api`, JSON UTF-8, IDs เป็น UUID strings, dates `YYYY-MM-DD`, timestamps ISO 8601 UTC, enum strings uppercase
- Unsafe JSON requests ใช้ `Content-Type: application/json`, `Origin: APP_ORIGIN`, cookie และ `X-CSRF-Token`; GET ใช้ cookie และไม่แก้ domain data
- Success: `{ "data": <DTO> }`; collection: `{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0 } }`; 204 ไม่มี body
- Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "dailyTargetMinutes": "..." }, "requestId": "..." } }`; `fields` optional; ไม่ส่ง stack/query/token/private record
- Unknown body/query fields rejected 422; malformed JSON/UUID/date syntax 400 (well-formed date ที่ไม่มีจริงหรือผิดช่วง 422); unsupported content type 415
- List query `page` default 1, `pageSize` default 20/max 100; positive integers; sort deterministic `createdAt DESC, id ASC`
- Error codes: 401 UNAUTHENTICATED/INVALID_CREDENTIALS, 403 FORBIDDEN/CSRF_INVALID/ORIGIN_FORBIDDEN, 404 NOT_FOUND, 409 ACTIVE_GOAL_EXISTS/ENTRY_ALREADY_EXISTS, 422 VALIDATION_ERROR/TEMPLATE_INACTIVE, 500 INTERNAL_ERROR
- ใส่ ownerId/userId/role ใน mutation body ถือเป็น unknown field และถูก 422 ไม่ใช้กำหนด owner. Participant cross-owner resource และ absent resource ได้ 404 body structure เดียวกัน

## 2. Safe DTOs

```ts
type Role = 'PARTICIPANT' | 'PROGRAM_MANAGER';
type UserDTO = { id: string; email: string; displayName: string; role: Role };
type TemplateDTO = {
  id: string; title: string; description: string; unit: 'MINUTES';
  minMinutes: number; maxMinutes: number; isActive: boolean;
  createdAt: string; updatedAt: string;
};
type GoalDTO = {
  id: string; templateId: string; templateTitle: string; unit: 'MINUTES';
  minMinutes: number; maxMinutes: number; startDate: string;
  endDate: string | null; status: 'ACTIVE' | 'ARCHIVED';
  targetMinutes: number; targetEffectiveFrom: string; createdAt: string;
};
type EntryDTO = {
  id: string; goalId: string; entryDate: string; minutes: number;
  targetMinutes: number; progressPercent: number; achieved: boolean;
  createdAt: string; updatedAt: string;
};
```

GoalDTO target หมายถึง target ปัจจุบัน ณ today; future-start goal ใช้ initial version ณ startDate. หลัง S2 เพิ่ม pendingTarget object ผ่าน versioned change ถ้าจำเป็น ห้ามแทน historical target ใน EntryDTO ด้วย goal ปัจจุบัน

## 3. F-01 auth — owner A

| Method/path | Input | Success | Key errors |
|---|---|---|---|
| GET /api/auth/csrf | optional existing cookie | 200 data:{csrfToken,expiresAt}; bootstrap pre-auth cookie ถ้าจำเป็น | 500 |
| POST /api/auth/login | {email,password} + pre-auth CSRF/origin | 200 data:{user:UserDTO,csrfToken,expiresAt}; rotated session cookie | 401 credentials; 403 CSRF/origin; 422 fields |
| GET /api/auth/me | authenticated cookie | 200 data:{user:UserDTO,expiresAt} | 401 |
| POST /api/auth/logout | no body + authenticated CSRF/origin | 204; revoke session/clear cookie | 401,403 |

Client bootstrap retrieves CSRF then login. Page reload calls `/auth/me` and `/auth/csrf` if needed. Token kept in memory, not URL/log/localStorage. `Cache-Control:no-store`. Missing login fields=422; valid-shape unknown account/wrong password=generic 401. Email trim+lowercase; password exact ไม่ trim

## 4. F-02 templates — owner B, proposed integration surface

| Method/path | Input/access | Success | Key errors |
|---|---|---|---|
| GET /api/templates | logged in; page/pageSize; manager may use includeInactive=true | 200 TemplateDTO[] + meta | 401; Participant includeInactive=true →403 |
| GET /api/templates/:templateId | logged in; Participant active only | 200 TemplateDTO | 401,404; inactive invisible to Participant |
| POST /api/templates | manager; {title,description?,minMinutes,maxMinutes}; unit server=MINUTES, isActive server=true | 201 TemplateDTO | 401,403,422 |

Manager ownership scopeที่เสนอคือ shared catalog ทั้งหมด ไม่จำกัดเฉพาะ creator; creator เก็บเพื่อ audit. เปลี่ยนได้ตอน review ก่อน code โดยต้องอัปเดต matrix/tests ให้ตรง Title trim, description default empty string. S1 ไม่มี update/deactivate endpoint; F-05 contracts เพิ่มใน S2

## 5. F-03 goals — owner A

| Method/path | Input/access | Success | Key errors |
|---|---|---|---|
| POST /api/goals | Participant; {templateId,dailyTargetMinutes,startDate} | 201 GoalDTO | 401/403; template absent404; inactive422; invalid range/date422; active duplicate409 |
| GET /api/goals | Participant; page/pageSize; status optional ACTIVE/ARCHIVED | 200 GoalDTO[] + meta, own only | 401,403,422 |
| GET /api/goals/:goalId | Participant own | 200 GoalDTO | 401,403,404 |

Create requires full date/target, no implicit timezone/date defaults. Atomic Goal+initial TargetVersion; snapshot range/unit/title. Unique DB conflict translates ACTIVE_GOAL_EXISTS. F-03 initial version supplies F-04 target lookup service; no edit/delete endpoint in S1

## 6. F-04 daily entries/progress — owner B, proposed integration surface

| Method/path | Input/access | Success | Key errors |
|---|---|---|---|
| POST /api/goals/:goalId/entries | Participant own; {entryDate,minutes} | 201 EntryDTO | 401/403/404; invalid date/range422; duplicate409 |
| GET /api/goals/:goalId/entries | Participant own; page/pageSize | 200 EntryDTO[] + meta, entryDate DESC/id ASC | 401,403,404,422 |
| GET /api/goals/:goalId/progress?date=YYYY-MM-DD | Participant own; date required within goal date bounds and <=today | 200 data:{goalId,date,actualMinutes,targetMinutes,progressPercent,achieved,entryId:string|null} | 401,403,404,422 |

No entry: actual=0/progress=0/achieved=false/entryId=null. Retrieval recomputes target by entryDate using version service. Concurrent insert unique conflict→409. หน้า goal details ของ A ให้มี integration slot/component boundary สำหรับ entry form/progress ของ B ตกลง props ใน UI conventions ก่อนแก้ shared route

## 7. Shared services and changes

| Service | Responsibility | Owner |
|---|---|---|
| Clock.todayBangkok()/now() | injectable fixed clock; separate date vs instant | A foundation; B consumes |
| requireUser/requireRole | trusted session principal; consistent 401/403 | A |
| requireOwnedGoal(goalId,userId) | scoped lookup and 404; role checked first | A; B consumes |
| targetForDate(goalId,date) | latest effective version <=date; no version→domain validation, never assume current target | A interface; F-04 B uses |
| error mapper | known validation/constraint errors to envelope; safe unknown500 | A foundation |
| API client/AuthProvider/layout | cookie+CSRF handling/navigation | agree with B before code |

Feature branch examples: `codex/f01-auth`, `codex/f02-templates`, `codex/f03-goals`, `codex/f04-entries-progress` from `codex/sprint-1-staging`. Actual A implementation uses `codex/member-a-sprint1` for shared foundation/F-01/F-03 under Issues #1/#2, with separate TDD/feature commits and one reviewed integration PR; this dependency choice is recorded in decisions. B features remain separate. Actual PRs/releases only recorded after creation
