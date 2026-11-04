import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import {chromium} from '@playwright/test';
import {PrismaClient} from '@prisma/client';

dotenv.config({quiet:true});
const origin=process.env.APP_ORIGIN;
assert.equal(origin,'http://127.0.0.1:3400');
assert.match(process.env.DATABASE_URL,/\/studytrack_d1_dev_20261104$/);
const evidence=path.resolve('artifacts/evidence/deliverable-1');
const shots=path.join(evidence,'screenshots');fs.mkdirSync(shots,{recursive:true});
const db=new PrismaClient();
const checks=[];const children=[];let browser;
function record(scenario,expected,actual){assert.deepEqual(actual,expected,scenario);checks.push({scenario,expected,actual});}
async function ready(url){for(let n=0;n<100;n++){try{if((await fetch(url)).ok)return;}catch{}await delay(100);}throw Error('D1 local application did not become ready');}
async function login(page,email,password){await page.goto(origin+'/login');await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่ระบบ →',exact:true}).click();await page.waitForURL(email.startsWith('manager')?'**/manager/templates':'**/goals');}
async function headers(page){const r=await page.request.get(origin+'/api/auth/csrf');return {Origin:origin,'X-CSRF-Token':(await r.json()).data.csrfToken};}
async function logout(page){const response=page.waitForResponse(r=>r.url().endsWith('/api/auth/logout'));await page.getByRole('button',{name:'ออกจากระบบ',exact:true}).click();await page.waitForURL('**/login');assert.equal((await response).status(),204);}
try{
  children.push(spawn(process.execPath,['--import','tsx','server/src/index.ts'],{env:process.env,stdio:'ignore',windowsHide:true}));
  children.push(spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3400'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:5400'},stdio:'ignore',windowsHide:true}));
  await ready('http://127.0.0.1:5400/api/health');await ready(origin);
  browser=await chromium.launch({channel:process.platform==='win32'?'msedge':undefined,headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();
  await page.goto(origin+'/login');await page.getByLabel('อีเมล',{exact:true}).fill('student1@studytrack.test');await page.getByLabel('รหัสผ่าน',{exact:true}).fill('Synthetic-wrong-value.42');await page.getByRole('button',{name:'เข้าสู่ระบบ →',exact:true}).click();await page.getByRole('alert').waitFor();
  await page.locator('.login-form-wrap').screenshot({path:path.join(shots,'login-rejected.png')});record('Invalid synthetic login leaves protected identity unavailable',401,(await page.request.get(origin+'/api/auth/me')).status());
  await login(page,'manager@studytrack.test',process.env.SEED_MANAGER_PASSWORD);
  await page.goto(origin+'/manager/templates/new');
  const title='D1 reading demonstration '+new Date().toISOString().slice(0,19);
  await page.getByLabel('ชื่อกิจกรรม',{exact:true}).fill(title);await page.getByLabel('คำอธิบาย (ไม่บังคับ)',{exact:true}).fill('Read, reflect and record daily progress.');
  await page.getByLabel('เวลาต่ำสุด (นาที)',{exact:true}).fill('1');await page.getByLabel('เวลาสูงสุด (นาที)',{exact:true}).fill('1440');
  await page.locator('form').screenshot({path:path.join(shots,'manager-template.png')});
  const templateResponse=page.waitForResponse(r=>r.url().endsWith('/api/templates')&&r.request().method()==='POST');await page.getByRole('button',{name:'สร้างแม่แบบ →',exact:true}).click();const tr=await templateResponse;record('Manager creates persisted template',201,tr.status());const template=(await tr.json()).data;await page.waitForURL('**/manager/templates');
  await logout(page);record('Manager logout revokes protected access',401,(await page.request.get(origin+'/api/templates')).status());
  await login(page,'student1@studytrack.test',process.env.SEED_PARTICIPANT_PASSWORD);await page.goto(origin+'/templates');await page.locator('article').filter({has:page.getByRole('heading',{name:title,exact:true})}).getByRole('link',{name:'ตั้งเป้าหมาย →',exact:true}).click();
  await page.getByLabel('เป้าหมายต่อวัน (นาที)',{exact:true}).fill('60');await page.locator('form').screenshot({path:path.join(shots,'goal-create.png')});
  const goalResponse=page.waitForResponse(r=>r.url().endsWith('/api/goals')&&r.request().method()==='POST');await page.getByRole('button',{name:'สร้างเป้าหมาย →',exact:true}).click();const gr=await goalResponse;record('Participant creates own goal from manager-created template',201,gr.status());const goal=(await gr.json()).data;
  await page.getByTestId('progress-percent').waitFor();await page.getByLabel('เวลาที่อ่านจริง (นาที)',{exact:true}).fill('0');await page.getByRole('button',{name:'บันทึกเวลา →',exact:true}).click();await page.locator('#minutes-error').filter({hasText:'1–1440'}).waitFor();
  await page.locator('.activity-panel').screenshot({path:path.join(shots,'entry-validation.png')});record('Invalid zero minutes leaves database without an entry',0,await db.dailyEntry.count({where:{goalId:goal.id}}));
  await page.getByLabel('เวลาที่อ่านจริง (นาที)',{exact:true}).fill('45');const entryResponse=page.waitForResponse(r=>r.url().endsWith('/entries')&&r.request().method()==='POST');await page.getByRole('button',{name:'บันทึกเวลา →',exact:true}).click();const er=await entryResponse;record('Participant records valid45 minutes',201,er.status());const entry=(await er.json()).data;
  await page.reload();await page.getByTestId('progress-percent').filter({hasText:'75%'}).waitFor();await page.locator('.activity-panel').screenshot({path:path.join(shots,'progress-retrieved.png')});
  const progressResponse=await page.request.get(origin+`/api/goals/${goal.id}/progress?date=${entry.entryDate}`);assert.equal(progressResponse.status(),200);const savedProgress=(await progressResponse.json()).data;
  record('Reload/API retrieval preserves45/60=75% and same entry', {actualMinutes:45,targetMinutes:60,progressPercent:75,entryId:entry.id},{actualMinutes:savedProgress.actualMinutes,targetMinutes:savedProgress.targetMinutes,progressPercent:savedProgress.progressPercent,entryId:savedProgress.entryId});
  const duplicate=await page.request.post(origin+`/api/goals/${goal.id}/entries`,{headers:await headers(page),data:{entryDate:entry.entryDate,minutes:75}});record('Duplicate entry rejects',409,duplicate.status());record('Duplicate rejection code','ENTRY_ALREADY_EXISTS',(await duplicate.json()).error.code);
  const stored=await db.dailyEntry.findUniqueOrThrow({where:{id:entry.id}});record('Duplicate preserves first stored value and one row',{minutes:45,rows:1},{minutes:stored.minutes,rows:await db.dailyEntry.count({where:{goalId:goal.id}})});
  const participantCreate=await page.request.post(origin+'/api/templates',{headers:await headers(page),data:{title:'Forbidden participant template',minMinutes:1,maxMinutes:1440}});record('Participant at manager create API',403,participantCreate.status());
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});const mp=await mobile.newPage();await login(mp,'student1@studytrack.test',process.env.SEED_PARTICIPANT_PASSWORD);await mp.goto(origin+`/goals/${goal.id}`);await mp.getByTestId('progress-percent').filter({hasText:'75%'}).waitFor();record('Mobile390 viewport has no horizontal overflow',true,await mp.evaluate(()=>document.documentElement.scrollWidth<=390));await mp.locator('.activity-panel').screenshot({path:path.join(shots,'mobile-progress.png')});await mobile.close();
  await logout(page);record('Participant logout protected API',401,(await page.request.get(origin+`/api/goals/${goal.id}/entries`)).status());await page.locator('form').screenshot({path:path.join(shots,'logged-out.png')});
  await login(page,'student2@studytrack.test',process.env.SEED_PARTICIPANT_PASSWORD);record('Other participant cannot read saved goal',404,(await page.request.get(origin+`/api/goals/${goal.id}`)).status());await logout(page);
  await login(page,'manager@studytrack.test',process.env.SEED_MANAGER_PASSWORD);record('Manager cannot read participant entries',403,(await page.request.get(origin+`/api/goals/${goal.id}/entries`)).status());await logout(page);
  fs.writeFileSync(path.join(evidence,'demonstrations.json'),JSON.stringify({source:'85f510f0d73b84f39c08fbf3ef36e43b232bb044',kind:'scripted local UI/API/DB verification; not independent human UAT',timestamp:new Date().toISOString(),checks,savedProgress},null,2));console.log(`PASS ${checks.length} scripted local demonstration checks; screenshots and sanitized responses saved.`);
}finally{await browser?.close();await db.$disconnect();for(const child of children.reverse()){if(child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}}}
