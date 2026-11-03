import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import type { Dependencies } from "./context.js";
import { publicUser } from "./context.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  clearSessionCookie,
  findSession,
  issueSession,
  revokeSession,
  validateCsrf,
} from "./session.js";
import { requireCsrf, requireJson, requireUser } from "./middleware.js";

const loginInput = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).email(),
  password: z.string().min(1).max(128),
});

export function authRouter(deps: Dependencies) {
  const router = Router();
  const dummyHash = hashPassword(randomBytes(24).toString("hex"));

  router.get("/csrf", async (req, res) => {
    z.strictObject({}).parse(req.query);
    const session =
      (await findSession(req, deps)) ?? (await issueSession(res, deps, null));
    res.json({
      data: {
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  });

  router.post("/login", requireJson, async (req, res) => {
    const previous = await findSession(req, deps);
    validateCsrf(req, deps, previous);
    z.strictObject({}).parse(req.query);
    const input = loginInput.parse(req.body);
    const user = await deps.db.user.findUnique({
      where: { emailNormalized: input.email },
    });
    const valid = await verifyPassword(
      user?.passwordHash ?? (await dummyHash),
      input.password,
    );
    if (!user || !valid)
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      );
    const session = await issueSession(res, deps, user.id, previous?.id);
    res.json({
      data: {
        user: publicUser(user),
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  });

  router.get("/me", requireUser(deps), (req, res) => {
    z.strictObject({}).parse(req.query);
    res.json({
      data: {
        user: publicUser(req.principal!.user),
        expiresAt: req.principal!.session.expiresAt.toISOString(),
      },
    });
  });

  router.post(
    "/logout",
    requireUser(deps),
    requireCsrf(deps),
    async (req, res) => {
      z.strictObject({}).parse(req.query);
      await revokeSession(deps, req.principal!.session.id);
      clearSessionCookie(res, deps);
      res.status(204).end();
    },
  );
  return router;
}
