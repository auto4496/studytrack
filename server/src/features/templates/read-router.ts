import { Router } from "express";
import { z } from "zod";
import type { Dependencies } from "../../auth/context.js";
import { requireUser } from "../../auth/middleware.js";
import { ApiError } from "../../errors.js";
import { pagination, parseUuid } from "../../validation.js";

// Minimal real read adapter needed by F-03. Member B owns F-02's manager CRUD/UI and may extend this router.
export function templateReadRouter(deps: Dependencies) {
  const router = Router();
  router.use(requireUser(deps));
  router.get("/", async (req, res) => {
    const { page, pageSize, includeInactive } = pagination(req.query, {
      includeInactive: z.enum(["true", "false"]).optional(),
    });
    if (
      includeInactive === "true" &&
      req.principal!.user.role !== "PROGRAM_MANAGER"
    )
      throw new ApiError(403, "FORBIDDEN", "ไม่มีสิทธิ์ดูแม่แบบที่ปิดใช้");
    const where = includeInactive === "true" ? {} : { isActive: true };
    const [templates, total] = await deps.db.$transaction([
      deps.db.activityTemplate.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      deps.db.activityTemplate.count({ where }),
    ]);
    res.json({
      data: templates.map(templateDTO),
      meta: { page, pageSize, total },
    });
  });
  router.get("/:templateId", async (req, res) => {
    z.strictObject({}).parse(req.query);
    const template = await deps.db.activityTemplate.findFirst({
      where: {
        id: parseUuid(req.params.templateId),
        ...(req.principal!.user.role === "PARTICIPANT"
          ? { isActive: true }
          : {}),
      },
    });
    if (!template)
      throw new ApiError(404, "NOT_FOUND", "ไม่พบรายการที่ต้องการ");
    res.json({ data: templateDTO(template) });
  });
  return router;
}

function templateDTO(template: {
  id: string;
  title: string;
  description: string;
  unit: string;
  minMinutes: number;
  maxMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    unit: template.unit,
    minMinutes: template.minMinutes,
    maxMinutes: template.maxMinutes,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
