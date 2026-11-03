# PR #3 — B independent review

วันที่ 3 พฤศจิกายน 2026 (Asia/Bangkok). Review source `2370df9d760862a2c96aead7c70eb63762bb7192`, base `codex/sprint-1-staging` at42b9eb2. Codex-assisted review ตามคำสั่งสมาชิก B; ไม่ใช่ approval หรือ accepted release

**ส่ง [Request changes review จริง](https://github.com/auto4496/studytrack/pull/3#pullrequestreview-5752031354) ด้วย Datakung แล้ว** พร้อม inline findingที่ scripts/test-env.mjs line37. PR6/F02 และ PR7/F04ยังเป็นdraft; ต้องแก้/review PR3ก่อนรับ foundation และ retarget/rebase Bงานไปaccepted stagingตามลำดับ

## Finding P2 — localhost aliases bypass the test/development DB guard

`normalizedHost` เทียบตัวอักษรตรง ๆ จึงไม่จัด `LOCALHOST` หรือ `localhost.` เป็น loopbackเดียวกับ `127.0.0.1`. ถ้า DATABASE_URL เป็นฐานที่ชื่อมี test marker เช่น `studytrack_test` (เหมือนตัวอย่างใน existing guard tests) และ TEST_DATABASE_URLชี้ฐานเดียวกันโดยใช้aliasเหล่านี้ guardจะยอมให้ผ่าน ทั้งที่ `resetData()` ใน server/tests/helpers.ts25–30ล้างทุก application table

ตัวอย่าง synthetic configuration (ไม่ใช่ credentialsจริง):

```text
DATABASE_URL=postgresql://fixture:fake@127.0.0.1:5432/studytrack_test
TEST_DATABASE_URL=postgresql://fixture:fake@LOCALHOST:5432/studytrack_test
```

Expected: reject same development database. Actual: accepted. เพิ่ม `localhost.` ก็ได้ผลเดียวกัน. อ่านด้วย Prisma/PostgreSQLจริงผ่านทั้งสองaliasใน B test DB โดยใช้ `SELECT current_database()` เท่านั้น ยืนยันว่าถึงฐานเดียวกัน. **ไม่ได้ลองล้างdevหรือรันdestructive probe**; normal suitesทั้งหมดใช้เฉพาะ isolated B test DBตามconfigที่แยกจริง

ขอ A normalize hostnameเป็นlowercaseและเอา trailing DNS dotออกก่อนmap loopback แล้วเพิ่ม LOCALHOST/localhost.เข้า guard tests. หลังfixต้องทวน2casesและsuiteเดิมก่อนรับPR3. เป็นP2เพราะต้องมีsame-database misconfigurationตามเงื่อนไขข้างต้น ไม่อ้างว่าค่าdefault dev/testแยกกันอยู่แล้วทำข้อมูลหาย

## Actual verification on PR3 alone

สร้าง detached checkout `studytrack-pr3-review` ที่ exact head ไม่ใช้ B implementation. ติดตั้งตามlockfile, Prisma generate/migrateเฉพาะB test. Browserconfigชั่วคราวในignored tmpเปลี่ยนตำแหน่งreportเท่านั้น ไม่แก้A application/tests

| Command/check | Actual result | Evidence |
|---|---|---|
| npm test (original PR3) |38pass/0fail/0skip | [API output](../../artifacts/evidence/member-b/pr3-review/api-output.txt) / [JSON](../../artifacts/evidence/member-b/pr3-review/api-results.json) |
| Playwright original A cases,1440x900/390x844 |10pass/0fail/0skip | [browser](../../artifacts/evidence/member-b/pr3-review/browser-output.txt) / [JSON](../../artifacts/evidence/member-b/pr3-review/browser-results.json) |
| npm run verify:restart |PASS real process restart / session+goal+target | [output](../../artifacts/evidence/member-b/pr3-review/restart-output.txt) |
| npm run build |PASS typechecks+productionbundle | [output](../../artifacts/evidence/member-b/pr3-review/build-output.txt) |
| New Node guard regressions (2aliases) |0pass/2fail; Missing expected exception | [tests](../../artifacts/evidence/member-b/pr3-review/db-guard-regression.mjs) / [output](../../artifacts/evidence/member-b/pr3-review/guard-regression-output.txt) |
| SELECT-only physical DB confirmation |bothsameDatabase=true, guardRejected=false | [probe](../../artifacts/evidence/member-b/pr3-review/check-db-alias.mjs) / [output](../../artifacts/evidence/member-b/pr3-review/db-alias-output.txt) |

Probe copies adjust their relative import for the evidence directory; source under review and original executed probes are anchored in [execution metadata](../../artifacts/evidence/member-b/pr3-review/execution.json). No claim that added regressions were already in PR3. An explored percent-encoded database-name variant did not resolve to the same DB in Prisma6 and was excluded from findings

## Other checks / limits

ตรวจ pre-code→red→green history, Argon2id/session tokenHash/rotation/fixed8h/revoke, CSRF+Origin, role/owner scopes, atomic goal+initialtarget, snapshot/date/partialunique constraints, existing assertions and setup/testDB guard. OriginalAPI/browser checks pass; inspected selected mobilegoal screenshot. CI/GCP/readiness and full Sprint1B workflows are separate pending items, not reasons to claim those passed in PR3. Full independent security/accessibility audit not claimed

## Next order

1. Aแก้guardบน PR3และบันทึกregression evidence
2. Bตรวจnewheadและผลทวน แล้วจึงตัดสินใจรับPR3ไป `codex/sprint-1-staging`
3. Update/rebase/retarget PR6 F02ไปacceptedstaging; A review
4. ตามด้วยPR7 F04; รันintegrationบนmergedcandidate ก่อนreviewedreleaseไปmain

รอบนี้ไม่approve/merge PR3/6/7 และไม่แก้A sourceแทนผู้เขียน การเปิดdraftBก่อนเป็นtemporary dependencyเท่านั้น ต้องไม่ใช้แทนการreviewAตามลำดับนี้
