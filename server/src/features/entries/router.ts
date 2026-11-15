import { Router } from "express";
import { z } from "zod";
import type { Dependencies } from "../../auth/context.js";
import { requireCsrf, requireJson } from "../../auth/middleware.js";
import { pagination, parseUuid } from "../../validation.js";
import { createEntry, dailyProgress, listEntries } from "./service.js";
import { correctEntry, readingHistory } from "./history.js";

const entryInput = z.strictObject({
  entryDate: z.string(),
  minutes: z.number().int(),
});

// Mounted beneath goalsRouter's requireUser + Participant guard; never bypass those guards.
export function entriesRouter(deps: Dependencies) {
  const router = Router({ mergeParams: true });
  router.get<{ goalId: string }>("/history", async (req, res) => {
    z.strictObject({}).parse(req.body ?? {});
    const input = pagination(req.query, {
      from: z.string().optional(),
      to: z.string().optional(),
    });
    res.json({
      data: await readingHistory(
        deps,
        req.principal!.user.id,
        parseUuid(req.params.goalId),
        {
          page: input.page,
          pageSize: input.pageSize,
          from: input.from as string | undefined,
          to: input.to as string | undefined,
        },
      ),
    });
  });
  router.patch<{ goalId: string; entryId: string }>(
    "/entries/:entryId",
    requireCsrf(deps),
    requireJson,
    async (req, res) => {
      z.strictObject({}).parse(req.query);
      const { minutes } = z
        .strictObject({ minutes: z.number().int() })
        .parse(req.body);
      res.json({
        data: await correctEntry(
          deps,
          req.principal!.user.id,
          parseUuid(req.params.goalId),
          parseUuid(req.params.entryId),
          minutes,
        ),
      });
    },
  );
  router.post<{ goalId: string }>(
    "/entries",
    requireCsrf(deps),
    requireJson,
    async (req, res) => {
      const input = entryInput.parse(req.body);
      const id = parseUuid(req.params.goalId);
      res.status(201).json({
        data: await createEntry(deps, req.principal!.user.id, id, input),
      });
    },
  );
  router.get<{ goalId: string }>("/entries", async (req, res) => {
    const { page, pageSize } = pagination(req.query);
    res.json(
      await listEntries(
        deps,
        req.principal!.user.id,
        parseUuid(req.params.goalId),
        page,
        pageSize,
      ),
    );
  });
  router.get<{ goalId: string }>("/progress", async (req, res) => {
    const { date } = z.strictObject({ date: z.string() }).parse(req.query);
    res.json({
      data: await dailyProgress(
        deps,
        req.principal!.user.id,
        parseUuid(req.params.goalId),
        date,
      ),
    });
  });
  return router;
}
