# F-01 — Identity and access engineering contract

Version 0.1 / 3 November 2026 / owner A / reviewer B (not yet reviewed)

Status: SPECIFIED, NOT IMPLEMENTED, NOT EXECUTED. Links: FR-01–FR-04, FR-19, BR-07, NFR-01/NFR-02/NFR-04/NFR-07. [SRS](../../srs.md), [System SDS](../../system-sds.md), [API contract](../../integration-contract.md)

## 1. Behavior and dependencies

User opens login, obtains pre-auth CSRF session, submits email/password. Valid credentials rotate session and CSRF token, return safe identity and show role navigation. `/auth/me` recovers identity after reload. Logout revokes current session and returns to login. Invalid login returns generic error; expired session returns401 and offers login without automatically replaying mutation

Needs schema/User+Session, migrations, synthetic seed, config, clock, DB test isolation and common error mapper. These are A foundation tasks; F-02/F-03/F-04 depend on trusted principal/middleware. Role+ownership policy delivered here as foundation, feature-level access cases must also be executed against real endpoints

## 2. UI/API/data specifications

- UI `/login`: labelled email/password, keyboard submission, visible field error/global invalid-login message, loading/pending state, password never echoed; no role dropdown. Both role navigation and logout button. Refresh pending current-user check must not flash private content to anonymous
- Email format and length <=254; trim/lowercase for lookup. Password nonempty and <=128 characters; no trim/transformation. Seed passwords require >=12 characters; self-registration absent
- API methods/shapes/statuses exactly F-01 section of integration contract; no other routes here. Unknown keys rejected. Header names case-insensitive
- User passwordHash Argon2id; Session stores tokenHash, csrfToken, userId nullable, expiresAt. Pre-auth30min/auth8h fixed; issued from injectable server clock. Cookie policy and security parameters in SDS. Token hashing is only session-token storage, not password hashing
- Unsafe endpoints require valid Origin and synchronizer token; login included. Authenticated feature middleware applies auth→role→CSRF/payload→owner in documented order. GET auth endpoints no-store
- CSRF token/tokenHash/passwordHash excluded from generic user output/logs. `/auth/csrf` explicitly returns only CSRF token+expiry; cookie opaque identifier not JSON

## 3. Acceptance criteria

| ID | Observable expected result |
|---|---|
| AC-F01-01 | Valid login for each role returns corresponding safe identity and rotated authenticated cookie/token; stored password is a verifiable Argon2id hash |
| AC-F01-02 | Wrong password or unknown account gives same generic401 shape and no authenticated session; malformed/missing fields give documented validation |
| AC-F01-03 | `/auth/me` returns correct session identity after reload; absent, tampered or expired session gives401 without private fields |
| AC-F01-04 | Logout204 deletes/revokes current session, clears matching cookie, and replay of that token gives401; another independently logged-in session remains valid |
| AC-F01-05 | Anonymous protected request401 and wrong-role operation403; neither changes persistent domain data |
| AC-F01-06 | Mutating request missing/incorrect CSRF or wrong Origin is403 without mutation, including login; authenticated session cookie has intended HttpOnly/SameSite/Path/Secure attributes |
| AC-F01-07 | Login rotates pre-auth/existing session so old token no longer authenticates; expiry is fixed8h, checked server-side |
| AC-F01-08 | Login, logout, reload, error recovery and role navigation work in selected browser journey; credentials/tokens are not rendered/logged |

## 4. Software test specification

Results for every row: NOT RUN; actual file/name/command/commit to be recorded after execution. Proposed file names are plans, not evidence

| Test ID | AC | Level / preconditions and action | Expected result | Planned file |
|---|---|---|---|---|
| TEST-F01-01 | 01 | DB integration; seed two roles with hashed fixture passwords; bootstrap then valid login |200 safe user per role; session persisted; hash differs from plaintext and verifies | server/tests/integration/auth.test.ts |
| TEST-F01-02 | 02 | API+DB; unknown email and wrong password with valid CSRF; missing/oversize inputs |generic401 for credential failures;422 for field failure; no authenticated row | server/tests/integration/auth.test.ts |
| TEST-F01-03 | 03 | API+DB; valid cookie then no cookie/random cookie/clock advanced to expiry |valid identity200; other401 and no private fields | server/tests/integration/auth.test.ts |
| TEST-F01-04 | 04 | API+DB; create two sessions; logout first and replay both |first401; second200; revoked row absent; cookie cleared | server/tests/integration/auth.test.ts |
| TEST-F01-05 | 05 | Feature API+DB; anonymous create goal; Participant create template; Manager read goals |401/403/403 respectively; before/after row counts unchanged | server/tests/integration/access.test.ts |
| TEST-F01-06 | 06 | API+DB; login/logout/domain POST with omitted/wrong token or wrong Origin |403; no auth/domain mutation; no permissive CORS | server/tests/integration/csrf.test.ts |
| TEST-F01-07 | 06,07 | API+DB; inspect Set-Cookie in dev/prod config, login rotation and fixed clock |flags match config; old token invalid; now==expiresAt rejects | server/tests/integration/auth.test.ts |
| TEST-F01-08 | 08 | Browser; keyboard login, refresh, role nav, logout, invalid-login retry at desktop/mobile |correct screen/states; no identity switch UI; logged-out private content unavailable | e2e/auth.spec.ts |

TEST-F01-05 actual endpoints run after B/F-03 integration; middleware unit tests alone do not prove deployed access protection

## 5. TDD and definition of done

Use meaningful failing test first for server-side expiry/revocation or forbidden operation, preserve actual failing assertions/output/commit; implement; rerun green and regression. A dependency/config failure is not domain red evidence

Done only when implementation satisfies ACs, required meaningful tests executed with actual results, feature access cases integrated, B has reviewed real changes, docs/setup current, release integration complete and gaps disclosed. No implementation/review/green evidence exists in this draft
