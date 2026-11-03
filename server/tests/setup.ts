import { testDatabaseUrl } from '../../scripts/test-env.mjs';

process.env.DATABASE_URL = testDatabaseUrl();
process.env.NODE_ENV = 'test';
