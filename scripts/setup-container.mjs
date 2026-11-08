import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

const file = ".env.container.local";
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8", windowsHide: true,
}).trim();
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("A Git source revision is required.");
if (existsSync(file)) {
  let value = readFileSync(file, "utf8");
  // Refresh only non-secret source metadata; preserve all private settings.
  for (const [key, next] of [["CONTAINER_VCS_REF", revision], ["CONTAINER_IMAGE_TAG", revision.slice(0, 12)]]) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    value = pattern.test(value) ? value.replace(pattern, `${key}=${next}`) : `${value}\n${key}=${next}\n`;
  }
  writeFileSync(file, value);
  console.log("Preserved private container settings; refreshed image/source revision.");
} else {
  const password = randomBytes(24).toString("hex");
  writeFileSync(file, [
    `CONTAINER_DB_PASSWORD=${password}`,
    `CONTAINER_DATABASE_URL=postgresql://studytrack:${password}@db:5432/studytrack_container`,
    `CONTAINER_MANAGER_PASSWORD=${randomBytes(18).toString("base64url")}`,
    `CONTAINER_PARTICIPANT_PASSWORD=${randomBytes(18).toString("base64url")}`,
    "CONTAINER_APP_ORIGIN=https://localhost:3443",
    "CONTAINER_HTTPS_PORT=3443",
    `CONTAINER_IMAGE_TAG=${revision.slice(0, 12)}`,
    `CONTAINER_VCS_REF=${revision}`,
    "",
  ].join("\n"), { flag: "wx" });
  console.log("Created ignored private container settings; credential values are not printed.");
}
