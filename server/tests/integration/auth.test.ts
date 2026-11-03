import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, db, clock, fixturePassword, login, origin, resetData } from '../helpers.js';
import { digestToken } from '../../src/auth/session.js';
import { verifyPassword } from '../../src/auth/password.js';

describe('F-01 real PostgreSQL sessions', () => {
  beforeEach(resetData);
  afterAll(() => db.$disconnect());

  it('TEST-F01-01: salted Argon2id passwords and valid role identity', async () => {
    for (const email of ['a@studytrack.test', 'manager@studytrack.test']) {
      const result = await login(email);
      expect(result.response.body.data.user.email).toBe(email);
      expect(result.response.body.data.user).not.toHaveProperty('passwordHash');
      const user = await db.user.findUniqueOrThrow({ where: { emailNormalized: email } });
      expect(user.passwordHash).toMatch(/^\$argon2id\$/);
      expect(await verifyPassword(user.passwordHash, fixturePassword)).toBe(true);
    }
  });

  it('TEST-F01-04: logout revokes the real DB session, replay fails, independent session survives', async () => {
    const first = await login();
    const second = await login();
    const raw = first.response.headers['set-cookie'][0].split(';')[0];
    const token = decodeURIComponent(raw.split('=')[1]);
    expect(await db.session.findUnique({ where: { tokenHash: digestToken(token) } })).not.toBeNull();
    const loggedOut = await first.agent.post('/api/auth/logout').set('Origin', origin).set('X-CSRF-Token', first.csrf).expect(204);
    expect(loggedOut.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
    expect(await db.session.findUnique({ where: { tokenHash: digestToken(token) } })).toBeNull();
    await request(app).get('/api/auth/me').set('Cookie', raw).expect(401);
    await second.agent.get('/api/auth/me').expect(200);
  });

  it('TEST-F01-03: absent/tampered and server-expired sessions return no private data', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set('Cookie', 'studytrack.sid=tampered').expect(401);
    const { agent } = await login();
    clock.instant = new Date('2026-11-03T13:00:00Z');
    const expired = await agent.get('/api/auth/me').expect(401);
    expect(JSON.stringify(expired.body)).not.toContain('a@studytrack.test');
  });
});
