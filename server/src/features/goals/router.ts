import { Router } from "express";
import { z } from "zod";
import type { Dependencies } from "../../auth/context.js";
import {
  requireCsrf,
  requireJson,
  requireRole,
  requireUser,
} from "../../auth/middleware.js";
import { todayBangkok } from "../../clock.js";
import { pagination, parseUuid } from "../../validation.js";
import { createGoal, goalDTO, requireOwnedGoal } from "./service.js";
import { entriesRouter } from "../entries/router.js";
import { changeTarget, stopGoal } from "./lifecycle.js";

const createInput = z.strictObject({
  templateId: z.string(),
  dailyTargetMinutes: z.number().int(),
  startDate: z.string(),
});

export function goalsRouter(deps: Dependencies) {
  const router = Router();
  router.use(requireUser(deps), requireRole("PARTICIPANT"));
  router.patch(
    "/:goalId/target",
    requireCsrf(deps),
    requireJson,
    async (req, res) => {
      z.strictObject({}).parse(req.query);
      const input = z
        .strictObject({ dailyTargetMinutes: z.number().int() })
        .parse(req.body);
      res.json({
        data: await changeTarget(
          deps,
          req.principal!.user.id,
          parseUuid(req.params.goalId),
          input.dailyTargetMinutes,
        ),
      });
    },
  );
  router.post(
    "/:goalId/stop",
    requireCsrf(deps),
    requireJson,
    async (req, res) => {
      z.strictObject({}).parse(req.query);
      z.strictObject({}).parse(req.body);
      res.json({
        data: await stopGoal(
          deps,
          req.principal!.user.id,
          parseUuid(req.params.goalId),
        ),
      });
    },
  );
  router.post("/", requireCsrf(deps), requireJson, async (req, res) => {
    const input = createInput.parse(req.body);
    input.templateId = parseUuid(input.templateId);
    res
      .status(201)
      .json({ data: await createGoal(deps, req.principal!.user.id, input) });
  });
  router.get("/", async (req, res) => {
    const parsed = pagination(req.query, {
      status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
    });
    const { page, pageSize } = parsed;
    const where = {
      ownerId: req.principal!.user.id,
      ...(parsed.status
        ? { status: parsed.status as "ACTIVE" | "ARCHIVED" }
        : {}),
    };
    const [goals, total] = await deps.db.$transaction([
      deps.db.goal.findMany({
        where,
        include: { targets: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      deps.db.goal.count({ where }),
    ]);
    res.json({
      data: goals.map((g) => goalDTO(g, todayBangkok(deps.clock))),
      meta: { page, pageSize, total },
    });
  });
  router.get("/:goalId", async (req, res) => {
    z.strictObject({}).parse(req.query);
    const goal = await requireOwnedGoal(
      deps.db,
      parseUuid(req.params.goalId),
      req.principal!.user.id,
    );
    res.json({ data: goalDTO(goal, todayBangkok(deps.clock)) });
  });
  router.use("/:goalId", entriesRouter(deps));
  return router;
}
