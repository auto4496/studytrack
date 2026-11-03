import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';
import { readConfig } from './config.js';
import { systemClock } from './clock.js';

const config = readConfig();
const db = new PrismaClient();
const server = createApp({ db, clock: systemClock, config }).listen(config.port, '127.0.0.1', () => {
  console.log(`StudyTrack API ready on port ${config.port}`);
});
async function shutdown() { server.close(); await db.$disconnect(); }
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
