import { describe, expect, it } from "vitest";
import { validateTestDatabaseUrl } from "../../../scripts/test-env.mjs";

describe("NFR-04: destructive test setup must target a separate test database", () => {
  it("accepts an explicit separate PostgreSQL test database", () => {
    const test = "postgresql://fixture:fake@127.0.0.1:25433/studytrack_test";
    expect(
      validateTestDatabaseUrl(
        test,
        "postgresql://fixture:fake@localhost:25432/studytrack_dev",
      ),
    ).toBe(test);
  });
  it.each([
    undefined,
    "postgresql://fixture:fake@localhost/studytrack_dev",
    "https://localhost/studytrack_test",
  ])("rejects a missing or non-test PostgreSQL target", (value) => {
    expect(() => validateTestDatabaseUrl(value, undefined)).toThrow();
  });
  it.each(["localhost", "127.0.0.1", "[::1]", "LOCALHOST", "localhost."])(
    "rejects the same development database via loopback alias %s",
    (host) => {
      expect(() =>
        validateTestDatabaseUrl(
          `postgresql://fixture:fake@${host}:5432/studytrack_test?schema=other`,
          "postgresql://fixture:fake@127.0.0.1/studytrack_test",
        ),
      ).toThrow("development database");
    },
  );
});
