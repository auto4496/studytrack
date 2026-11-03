import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "../errors.js";
import type { Dependencies } from "./context.js";
import { clearSessionCookie, findSession, validateCsrf } from "./session.js";

export function requireUser(deps: Dependencies): RequestHandler {
  return async (req, res, next) => {
    const session = await findSession(req, deps);
    if (!session?.user) {
      clearSessionCookie(res, deps);
      throw new ApiError(401, "UNAUTHENTICATED", "กรุณาเข้าสู่ระบบ");
    }
    req.principal = { session, user: session.user };
    next();
  };
}

export const requireRole =
  (role: Role): RequestHandler =>
  (req, _res, next) => {
    if (!req.principal)
      throw new ApiError(401, "UNAUTHENTICATED", "กรุณาเข้าสู่ระบบ");
    if (req.principal.user.role !== role)
      throw new ApiError(403, "FORBIDDEN", "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้");
    next();
  };

export const requireCsrf =
  (deps: Dependencies): RequestHandler =>
  (req, _res, next) => {
    validateCsrf(req, deps, req.principal?.session ?? null);
    next();
  };

export const requireJson: RequestHandler = (req, _res, next) => {
  if (!req.is("application/json"))
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "คำขอนี้ต้องเป็น JSON");
  next();
};
