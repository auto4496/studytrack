import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import type { Request, Response, CookieOptions } from 'express';
import type { Dependencies, StoredSession } from './context.js';
import { ApiError } from '../errors.js';

export const sessionCookie = 'studytrack.sid';
export const digestToken = (token: string) => createHash('sha256').update(token).digest('hex');
const randomToken = () => randomBytes(32).toString('base64url');

export function cookieOptions(deps: Dependencies): CookieOptions {
  return { httpOnly: true, secure: deps.config.production, sameSite: 'lax', path: '/' };
}

export function clearSessionCookie(res: Response, deps: Dependencies) {
  res.clearCookie(sessionCookie, cookieOptions(deps));
}

export async function findSession(req: Request, deps: Dependencies): Promise<StoredSession | null> {
  const token = req.cookies?.[sessionCookie];
  if (typeof token !== 'string' || !/^[\w-]{43}$/.test(token)) return null;
  const session = await deps.db.session.findUnique({ where: { tokenHash: digestToken(token) }, include: { user: true } });
  if (!session || session.expiresAt.getTime() <= deps.clock.now().getTime()) return null;
  return session;
}

export async function issueSession(res: Response, deps: Dependencies, userId: string | null, oldSessionId?: string) {
  const token = randomToken();
  const now = deps.clock.now();
  const expiresAt = new Date(now.getTime() + (userId ? 8 * 60 : 30) * 60_000);
  const session = await deps.db.$transaction(async (tx) => {
    if (oldSessionId) await tx.session.deleteMany({ where: { id: oldSessionId } });
    return tx.session.create({ data: { tokenHash: digestToken(token), csrfToken: randomToken(), userId, createdAt: now, expiresAt } });
  });
  res.cookie(sessionCookie, token, { ...cookieOptions(deps), expires: expiresAt });
  return session;
}

export function validateCsrf(req: Request, deps: Dependencies, session: StoredSession | null) {
  if (req.get('origin') !== deps.config.origin) throw new ApiError(403, 'ORIGIN_FORBIDDEN', 'ไม่อนุญาตคำขอจากเว็บไซต์นี้');
  const supplied = req.get('x-csrf-token');
  const expected = session?.csrfToken;
  if (!supplied || !expected || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    throw new ApiError(403, 'CSRF_INVALID', 'กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง');
  }
}

export async function revokeSession(_deps: Dependencies, _sessionId: string): Promise<void> {
  throw new ApiError(501, 'NOT_IMPLEMENTED', 'Session revocation is not implemented yet.');
}
