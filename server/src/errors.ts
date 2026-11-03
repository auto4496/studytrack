import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let failure = error instanceof ApiError ? error : new ApiError(500, 'INTERNAL_ERROR', 'เกิดข้อผิดพลาด กรุณาลองใหม่');
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) fields[issue.path.join('.') || '_form'] ??= issue.message;
    failure = new ApiError(422, 'VALIDATION_ERROR', 'กรุณาตรวจข้อมูลที่กรอก', fields);
  } else if (error?.type === 'entity.parse.failed') {
    failure = new ApiError(400, 'INVALID_JSON', 'รูปแบบ JSON ไม่ถูกต้อง');
  } else if (error?.type === 'entity.too.large') {
    failure = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'ข้อมูลมีขนาดใหญ่เกินไป');
  }
  res.status(failure.status).json({ error: {
    code: failure.code, message: failure.message,
    ...(failure.fields ? { fields: failure.fields } : {}), requestId: res.locals.requestId,
  } });
};
