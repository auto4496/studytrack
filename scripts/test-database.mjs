import { spawnSync } from 'node:child_process';
import { testDatabaseUrl } from './test-env.mjs';

const databaseUrl = testDatabaseUrl();
const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--schema', 'server/prisma/schema.prisma'], {
  stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl },
});
process.exit(result.status ?? 1);
