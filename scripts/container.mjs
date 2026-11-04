import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const argv = process.argv.slice(2);
const action = argv[0] ?? "status";
const option = (name, fallback) => argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback;
const project = option("--project", "studytrack-container");
const envFile = option("--env-file", ".env.container.local");
if (!/^studytrack-container(?:-[a-z0-9-]+)?$/.test(project)) throw new Error("Use a dedicated studytrack-container project.");
if (!existsSync(envFile)) throw new Error("Run npm run setup:container first.");
const compose = (...args) => execFileSync("docker", ["compose", "--env-file", envFile, "-f", "compose.container.yaml", "-p", project, ...args], { stdio: "inherit", windowsHide: true });
if (action === "up") {
  compose("config", "--quiet");
  compose("build", "--pull", ...(argv.includes("--fresh-build") ? ["--no-cache"] : []), "app", "migrate");
  compose("up", "-d", "--wait", "db");
  compose("run", "--rm", "migrate");
  compose("run", "--rm", "seed");
  compose("up", "-d", "--wait", "app", "proxy");
  console.log("Local production stack ready. Database and local CA are stored in named volumes.");
} else if (action === "stop") {
  compose("stop", "proxy", "app", "db");
  console.log("Dedicated local stack stopped; named volumes and records retained.");
} else if (action === "status") {
  compose("ps");
} else throw new Error("Use up, stop or status.");
