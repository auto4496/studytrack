import { Router } from "express";
import { z } from "zod";
import type { Dependencies } from "../../auth/context.js";
import { requireCsrf, requireJson } from "../../auth/middleware.js";
import { parseUuid } from "../../validation.js";
import { scheduleInput } from "./rules.js";
import { readSchedule, replaceSchedule } from "./service.js";

// Mounted only after the existing authenticated Participant guard on goalsRouter.
export function scheduleRouter(deps: Dependencies) {
  const router = Router({ mergeParams: true });
  router.get<{ goalId: string }>("/schedule", async (req, res) => {
    z.strictObject({}).parse(req.query);
    z.strictObject({}).parse(req.body ?? {});
    res.json({
      data: await readSchedule(
        deps,
        req.principal!.user.id,
        parseUuid(req.params.goalId),
      ),
    });
  });
  router.put<{ goalId: string }>(
    "/schedule",
    requireCsrf(deps),
    requireJson,
    async (req, res) => {
      z.strictObject({}).parse(req.query);
      const input = scheduleInput.parse(req.body);
      res.json({
        data: await replaceSchedule(
          deps,
          req.principal!.user.id,
          parseUuid(req.params.goalId),
          input,
        ),
      });
    },
  );
  return router;
}
