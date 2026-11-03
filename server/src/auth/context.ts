import type { PrismaClient, Session, User, Role } from "@prisma/client";
import type { Clock } from "../clock.js";
import type { AppConfig } from "../config.js";

export interface Dependencies {
  db: PrismaClient;
  clock: Clock;
  config: AppConfig;
}
export type StoredSession = Session & { user: User | null };
export type Principal = { session: StoredSession; user: User };

declare global {
  namespace Express {
    interface Request {
      principal?: Principal;
    }
  }
}

export const publicUser = (user: User) => ({
  id: user.id,
  email: user.emailNormalized,
  displayName: user.displayName,
  role: user.role as Role,
});
