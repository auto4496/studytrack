import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ApiError, errorHandler } from './errors.js';
import type { Dependencies } from './auth/context.js';
import { authRouter } from './auth/router.js';
import { goalsRouter } from './features/goals/router.js';
import { templateReadRouter } from './features/templates/read-router.js';

export function createApp(deps: Dependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: deps.config.production ? undefined : false }));
  app.use((_req, res, next) => { res.locals.requestId = randomUUID(); next(); });
  app.use(express.json({ limit: '16kb' }), cookieParser());
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/api/health', async (_req, res) => {
    await deps.db.$queryRaw`SELECT 1`;
    res.json({ data: { status: 'ok', service: 'StudyTrack API' } });
  });
  app.use('/api/auth', authRouter(deps));
  app.use('/api/goals', goalsRouter(deps));
  app.use('/api/templates', templateReadRouter(deps));
  app.use('/api', (_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'ไม่พบรายการที่ต้องการ')));
  const staticRoot = resolve('dist/client');
  if (deps.config.production && existsSync(staticRoot)) {
    app.use(express.static(staticRoot));
    app.get('/{*path}', (_req, res) => res.sendFile(resolve(staticRoot, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}
