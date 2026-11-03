export interface AppConfig {
  origin: string;
  production: boolean;
  port: number;
}

export function readConfig(): AppConfig {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
  if (new URL(origin).origin !== origin)
    throw new Error(
      "APP_ORIGIN must be an exact origin without a path or trailing slash.",
    );
  const port = Number(process.env.PORT ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid PORT.");
  const production = process.env.NODE_ENV === "production";
  if (production && !origin.startsWith("https://"))
    throw new Error("Production APP_ORIGIN requires HTTPS.");
  return { origin, production, port };
}
