import { Router } from "express";
import { z } from "zod";
import type { Dependencies } from "../../auth/context.js";
import { requireRole, requireUser } from "../../auth/middleware.js";
import { pagination, parseUuid } from "../../validation.js";
import { readingSummary } from "./service.js";

const dateBound = z.string().min(1).optional();

export function summaryRouter(deps: Dependencies) {
  const router = Router();
  router.use(requireUser(deps), requireRole("PARTICIPANT"));
  router.get("/", async (req, res) => {
    z.strictObject({}).parse(req.body ?? {});
    const query = pagination(req.query, {
      from: dateBound,
      to: dateBound,
      goalId: z.string().min(1).optional(),
    });
    res.json({
      data: await readingSummary(deps, req.principal!.user.id, {
        page: query.page,
        pageSize: query.pageSize,
        from: query.from as string | undefined,
        to: query.to as string | undefined,
        goalId:
          query.goalId === undefined ? undefined : parseUuid(query.goalId),
      }),
    });
  });
  return router;
}
