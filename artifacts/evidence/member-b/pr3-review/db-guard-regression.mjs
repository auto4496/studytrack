import { test } from "node:test";
import assert from "node:assert/strict";
import { validateTestDatabaseUrl } from "../../../../scripts/test-env.mjs";

for (const host of ["LOCALHOST", "localhost."]) {
  test(`reject same development database through ${host}`, () => {
    assert.throws(() => validateTestDatabaseUrl(
      `postgresql://fixture:fake@${host}:5432/studytrack_test`,
      "postgresql://fixture:fake@127.0.0.1:5432/studytrack_test",
    ), /development database/);
  });
}
