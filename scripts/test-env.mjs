import { config } from "dotenv";

export function testDatabaseUrl() {
  config({ path: ".env", quiet: true });
  config({ path: ".env.test.local", override: true, quiet: true });
  return validateTestDatabaseUrl(
    process.env.TEST_DATABASE_URL,
    process.env.DATABASE_URL,
  );
}

export function validateTestDatabaseUrl(value, developmentValue) {
  if (!value)
    throw new Error("TEST_DATABASE_URL is required; use .env.test.local.");
  const test = new URL(value);
  const dev = developmentValue ? new URL(developmentValue) : null;
  if (
    !["postgres:", "postgresql:"].includes(test.protocol) ||
    !/(^|_)test(_|$)/i.test(test.pathname.slice(1))
  ) {
    throw new Error(
      "Test target must be a PostgreSQL database with a distinct test marker.",
    );
  }
  if (
    dev &&
    normalizedHost(test.hostname) === normalizedHost(dev.hostname) &&
    (test.port || "5432") === (dev.port || "5432") &&
    test.pathname === dev.pathname
  ) {
    throw new Error("Refusing to use the development database for tests.");
  }
  return value;
}

function normalizedHost(host) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(host) ? "loopback" : host;
}
