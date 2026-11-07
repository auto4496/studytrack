const refusal = "Refusing unsafe local container database configuration. Use the dedicated db:5432/studytrack_container target for app, migrate and seed.";

export function validateLocalContainerDatabase(config) {
  // Validate effective Compose interpolation, never just the private env file.
  // The resolved config contains secrets and must never be printed or retained.
  try {
    const database = config.services.db.environment;
    if (database.POSTGRES_USER !== "studytrack" || database.POSTGRES_DB !== "studytrack_container" ||
        typeof database.POSTGRES_PASSWORD !== "string" || !database.POSTGRES_PASSWORD ||
        database.POSTGRES_PASSWORD.includes("CHANGE_ME")) throw new Error();
    for (const service of ["app", "migrate", "seed"]) {
      const target = config.services[service].environment.DATABASE_URL;
      if (typeof target !== "string") throw new Error();
      const url = new URL(target);
      if (!["postgresql:", "postgres:"].includes(url.protocol) || url.hostname !== "db" ||
          (url.port || "5432") !== "5432" || url.pathname !== "/studytrack_container" ||
          url.search || url.hash || decodeURIComponent(url.username) !== database.POSTGRES_USER ||
          decodeURIComponent(url.password) !== database.POSTGRES_PASSWORD) throw new Error();
    }
  } catch {
    // Do not include URLs, passwords, resolved JSON or an unsanitized cause.
    throw new Error(refusal);
  }
  return config;
}

export function resolveLocalContainerConfig(compose) {
  let config;
  try {
    config = JSON.parse(compose("--profile", "tools", "config", "--format", "json"));
  } catch {
    throw new Error("Could not resolve local Compose configuration. Check the private settings; resolved values are not printed.");
  }
  return validateLocalContainerDatabase(config);
}
