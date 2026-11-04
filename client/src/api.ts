export type Role = "PARTICIPANT" | "PROGRAM_MANAGER";
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}
export interface Template {
  id: string;
  title: string;
  description: string;
  unit: "MINUTES";
  minMinutes: number;
  maxMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Goal {
  id: string;
  templateId: string;
  templateTitle: string;
  unit: "MINUTES";
  minMinutes: number;
  maxMinutes: number;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "ARCHIVED";
  targetMinutes: number;
  targetEffectiveFrom: string;
  createdAt: string;
}
export interface Collection<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

let csrfToken: string | null = null;
export function setCsrf(token: string | null) {
  csrfToken = token;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);
  if (!["GET", "HEAD"].includes(method)) {
    if (!csrfToken) {
      const boot = await api<{ data: { csrfToken: string } }>("/auth/csrf");
      csrfToken = boot.data.csrfToken;
    }
    headers.set("X-CSRF-Token", csrfToken);
    if (options.body) headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new HttpError(
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? "เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่",
      body.error?.fields,
    );
    if (error.status === 401 && error.code === "UNAUTHENTICATED") {
      csrfToken = null;
      window.dispatchEvent(new Event("studytrack:unauthenticated"));
    }
    throw error;
  }
  return body as T;
}

export const errorMessage = (error: unknown) =>
  error instanceof TypeError
    ? "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่"
    : error instanceof Error
      ? error.message
      : "เกิดข้อผิดพลาด กรุณาลองใหม่";

export function localToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function nextDate(today: string) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
export const displayDate = (date: string) =>
  new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${date}T00:00:00Z`));
