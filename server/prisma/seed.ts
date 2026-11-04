import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password.js';

const db = new PrismaClient();
async function seed() {
  const managerPassword = process.env.SEED_MANAGER_PASSWORD;
  const participantPassword = process.env.SEED_PARTICIPANT_PASSWORD;
  if (!managerPassword || !participantPassword || managerPassword.length < 12 || participantPassword.length < 12 || managerPassword.includes('CHANGE_ME') || participantPassword.includes('CHANGE_ME')) {
    throw new Error('Set private seed passwords of at least 12 characters in .env; do not use example placeholders.');
  }
  const manager = await db.user.upsert({ where: { emailNormalized: 'manager@studytrack.test' }, update: {}, create: {
    emailNormalized: 'manager@studytrack.test', displayName: 'ผู้ดูแลกิจกรรม', role: 'PROGRAM_MANAGER', passwordHash: await hashPassword(managerPassword),
  } });
  for (const [email, displayName] of [['student1@studytrack.test', 'นักอ่านคนที่หนึ่ง'], ['student2@studytrack.test', 'นักอ่านคนที่สอง']]) {
    await db.user.upsert({ where: { emailNormalized: email }, update: {}, create: { emailNormalized: email, displayName, role: 'PARTICIPANT', passwordHash: await hashPassword(participantPassword) } });
  }
  for (const template of [
    { id: '11111111-1111-4111-8111-111111111111', title: 'อ่านทบทวน CPE 334', description: 'ทบทวนแนวคิดวิศวกรรมซอฟต์แวร์และจดสิ่งที่ได้เรียนรู้' },
    { id: '22222222-2222-4222-8222-222222222222', title: 'อ่านภาษาอังกฤษวันละนิด', description: 'เลือกหนังสือหรือบทความที่สนใจ แล้วค่อย ๆ อ่านในจังหวะของคุณ' },
  ]) {
    await db.activityTemplate.upsert({ where: { id: template.id }, update: {}, create: { ...template, minMinutes: 1, maxMinutes: 1440, createdById: manager.id } });
  }
  console.log('Synthetic demo accounts and two templates ready; existing records preserved. Passwords are not printed.');
}
seed().catch(() => { console.error('Seed failed. Verify database and private seed configuration.'); process.exitCode = 1; }).finally(() => db.$disconnect());
