import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (existsSync(".env") || existsSync(".env.test.local")) {
  console.log(
    "Preserved existing local env files. Use the example files to configure any missing file manually.",
  );
} else {
  const databasePassword = randomBytes(24).toString("hex");
  const managerPassword = randomBytes(18).toString("base64url");
  const participantPassword = randomBytes(18).toString("base64url");
  writeFileSync(
    ".env",
    `DATABASE_URL=postgresql://studytrack:${databasePassword}@127.0.0.1:25432/studytrack_dev\nPOSTGRES_PASSWORD=${databasePassword}\nAPP_ORIGIN=http://localhost:3000\nPORT=5000\nNODE_ENV=development\nSEED_MANAGER_PASSWORD=${managerPassword}\nSEED_PARTICIPANT_PASSWORD=${participantPassword}\n`,
    { flag: "wx" },
  );
  writeFileSync(
    ".env.test.local",
    `TEST_DATABASE_URL=postgresql://studytrack:${databasePassword}@127.0.0.1:25433/studytrack_test\nAPP_ORIGIN=http://localhost:3000\n`,
    { flag: "wx" },
  );
  console.log(
    "Created ignored local env files with generated passwords. Read .env privately for demo-account access; values are not printed.",
  );
}
