import { config } from 'dotenv';

export function testDatabaseUrl() {
  config({ path: '.env', quiet: true });
  config({ path: '.env.test.local', override: true, quiet: true });
  const value = process.env.TEST_DATABASE_URL;
  if (!value) throw new Error('TEST_DATABASE_URL is required; use .env.test.local.');
  const test = new URL(value);
  const dev = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  if (!['postgres:', 'postgresql:'].includes(test.protocol) || !/(^|_)test(_|$)/i.test(test.pathname.slice(1))) {
    throw new Error('Test target must be a PostgreSQL database with a distinct test marker.');
  }
  if (dev && test.hostname === dev.hostname && (test.port || '5432') === (dev.port || '5432') && test.pathname === dev.pathname) {
    throw new Error('Refusing to use the development database for tests.');
  }
  return value;
}
