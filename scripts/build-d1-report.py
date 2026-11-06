"""Build the self-contained D1 PDF from explicit content and immutable evidence.

Run with the bundled Python (ReportLab + pypdfium2 + pypdf).
No credentials are read. Report identity/release metadata stays explicitly pending
until the team provides it and the reviewed release has actually reached main.
"""
from pathlib import Path
import json, re, textwrap, html, subprocess, sys
from reportlab.pdfgen import canvas
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
    Spacer, PageBreak, LongTable, TableStyle, Image, Preformatted, KeepTogether)
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon

ROOT = Path(sys.argv[1]) if len(sys.argv)>1 else (Path(__file__).parent.parent if Path(__file__).parent.name=='scripts' else Path(__file__).parent/'release')
OUT = ROOT/'output/pdf/studytrack-deliverable-1.pdf'
SRC = ROOT/'docs/deliverables/d1'
EVID = ROOT/'artifacts/evidence/deliverable-1'
BASE = '85f510f0d73b84f39c08fbf3ef36e43b232bb044'
REPO = 'https://github.com/auto4496/studytrack'
metadata_path=SRC/'submission.json'
META=json.loads(metadata_path.read_text(encoding='utf-8-sig')) if metadata_path.exists() else {}
MEMBERS=META.get('members', [{'name':'Not provided','studentId':'Not provided (suffix 70)','github':'auto4496'}, {'name':'Not provided','studentId':'Not provided (suffix 68)','github':'Datakung'}])
RELEASE=META.get('acceptedMainCommit')
TAG=META.get('releaseTag')
STATUS='REVIEW CANDIDATE - MAIN RELEASE AND STUDENT IDENTITIES PENDING' if not RELEASE or any(m['name']=='Not provided' for m in MEMBERS) else 'DELIVERABLE 1 - VERIFIED RELEASE'
FR=[
('01','Valid account/password login creates a new authenticated session; invalid credentials do not.','F-01','1'),
('02','Logout revokes the current session so it cannot access protected APIs again.','F-01','1'),
('03','Retrieve current identity/role; anonymous or expired sessions receive no private identity.','F-01','1'),
('04','Authenticate, authorize roles and enforce ownership at the API. Managers do not gain access to participant records.','F-01..08','1-3'),
('05','Manager creates a minute-based activity template with valid name and bounds.','F-02','1'),
('06','Participant browses active template list/detail; manager may include inactive templates in the shared catalog.','F-02','1'),
('07','Participant creates a goal from an active template with a valid daily target and start date.','F-03','1'),
('08','Participant retrieves the saved list/detail of their own goals.','F-03','1'),
('09','Change daily target effective tomorrow while preserving historical targets.','F-05','2'),
('10','Stop a goal; manager deactivates/updates template metadata without destroying history.','F-05','2'),
('11','Record one integer-minute entry per goal/date and retrieve the committed entry.','F-04','1'),
('12','Display actual, date-effective target, percentage and achieved state for a goal/date.','F-04','1'),
('13','Browse own activity history filtered by goal/date range.','F-06','2'),
('14','Correct own recorded minutes under domain rules; progress/history/streak remain consistent.','F-06','2'),
('15','Calculate current/best goal streak using local dates and each date\'s effective target.','F-06','2'),
('16','Configure intended reading weekdays and local time per own goal.','F-07','3'),
('17','Display persistent schedules and in-app reminder state in Asia/Bangkok; no external delivery.','F-07','3'),
('18','Summarize own minutes and achieved days over a selected period without mixing other users.','F-08','3'),
('19','Expose loading, empty, validation, forbidden/session-expired and server-error states with appropriate recovery.','F-01..08','1-3')]
BR=[
('01','MINUTES only. Integer template bounds 1..1440; min<=max. Trim title to 1..100 Unicode code points; description <=500.','F-02','1'),
('02','Target is an integer within template bounds. Start is today/tomorrow in Bangkok. Snapshot unit, title and range on creation.','F-03','1'),
('03','At most one ACTIVE goal per participant/template, including a future-start goal and competing creates.','F-03','1'),
('04','UNIQUE(goalId, entryDate). Sequential or concurrent duplicates reject 409; never overwrite the first entry.','F-04','1'),
('05','Entry date is a real YYYY-MM-DD from start through today; integer minutes obey immutable goal bounds.','F-04','1'),
('06','Progress=actual/target*100, HALF_UP to two decimals, uncapped. Achieved uses actual>=target; no entry means actual0/false.','F-04/F-08','1/3'),
('07','Owner/user/role come only from server identity. Manager at participant APIs gets403; cross-owner resource gets non-disclosing404.','F-01..08','1-3'),
('08','Target revision starts tomorrow. Old dates keep old targets. Repeated pending revision updates that day\'s version.','F-05','2'),
('09','Streak counts consecutive achieved local dates; today incomplete may leave current streak ending yesterday; best covers all history.','F-06','2'),
('10','Inactive template blocks new goals; existing goals continue from snapshots. Used template unit/bounds are not changed; create a new template.','F-05','2'),
('11','Stopped goal preserves endDate/history. Entry/correction allowed only start..min(endDate,today). Archived goals do not reopen.','F-05/F-06','2'),
('12','History/summary ranges include both endpoints; from<=to. User-level achieved-day count deduplicates local dates across goals.','F-06/F-08','2/3'),
('13','Schedule weekdays1=Mon..7=Sun are unique; HH:mm is valid Bangkok time. A planned schedule never proves an activity occurred.','F-07','3')]
NFR=[
('01','Every released protected endpoint: anonymous401, wrong role403, cross-owner404 with no private fields.','API access matrix in S1; extend S2/S3.','F-01..08 / 1-3'),
('02','Argon2id salted password hashes; HttpOnly/SameSite=Lax cookie, Secure over production HTTPS. Expiry/revocation and CSRF reject unsafe requests.','DB/config and session/CSRF integration in S1; deployment recheck.','F-01 / 1 + Lab5'),
('03','Accepted template/goal/entry persists after API restart; on GCP it survives expected redeployment.','Real process restart in S1; cloud restart/redeploy in Lab5/final.','Persistence / 1-3'),
('04','Fresh documented checkout can install/setup/migrate/seed/build/run/test without application-source edits; repeated seed does not duplicate users.','Fresh setup and idempotent seed in S1/final.','Reproduction / 1-3'),
('05','Every released AC has actual test/result/version; required failures/skips are disclosed. From Lab5, failing required CI check blocks release.','AC ledger in S1; controlled CI failure in Lab5.','Quality / 1-3'),
('06','Critical S1 screens work at390x844 and1440x900 without horizontal overflow, with labels/focus/field errors.','Selected browser journeys/screenshots; extend new screens.','UI / 1-3'),
('07','Git/report/logs contain no real passwords, credentials or session/CSRF tokens. Examples use placeholders.','Inspect changed configuration and retained evidence each release.','Secrets / 1-3'),
('08','Date/progress logic uses one Bangkok calendar. Fixed-clock tests cover23:59/00:00, invalid days and month/year transitions.','Unit/API in S1; extend streak/schedule/summary in S2/S3.','Clock/rules / 1-3')]
FEATURES=[
('F-01','Identity and access','Login/logout/me; session rotation, expiry/revocation, role/ownership foundation.','1 / A','Shared schema/config/seed'),
('F-02','Activity templates','Manager create and persisted active catalog/detail; validated minute ranges.','1 / B','F-01; shared DTO/auth'),
('F-03','Personal goals','Create/read own goals with snapshots, initial target and concurrent ACTIVE uniqueness.','1 / A','F-01, F-02'),
('F-04','Entries and progress','One daily entry, date-effective target, unbounded progress and recovery.','1 / B','F-01, F-03'),
('F-05','Goal/template lifecycle','Tomorrow-effective target revision, stop/archive goal, deactivate/metadata rules.','2 / A','F-02, F-03, F-04'),
('F-06','History and streak','Filter/correct own entries; recompute date-effective current/best streak.','2 / B','F-04, F-05'),
('F-07','Schedule/reminder','Persistent weekdays/time and in-app reminder representation.','3 / A','F-03, F-05'),
('F-08','Summary/completion','Persisted period summaries and integrated hardening; genuine domain calculations.','3 / B','F-04, F-05, F-06')]

def mdtable(head,rows):
    return '\n'.join(['| '+' | '.join(head)+' |','|'+'|'.join(['---']*len(head))+'|']+['| '+' | '.join(str(x).replace('|','/') for x in r)+' |' for r in rows])+'\n'

def textfile(path): return (ROOT/path).read_text(encoding='utf-8-sig')
def read_json(path): return json.loads((ROOT/path).read_text(encoding='utf-8-sig'))
def git(cmd): return subprocess.check_output(['git',*cmd],cwd=ROOT,text=True,encoding='utf-8').strip()

def contract(name,feature):
    txt=textfile('docs/sprints/sprint-1/'+name)
    # Preserve the full substantive specification, AC and STS; historical status
    # is identified as historical rather than falsely claimed as a new contract.
    start=txt.index('## 1.')
    txt=txt[start:]
    if feature=='F-02':
        lines=txt.splitlines()
        replacements={
          0:0,
        }
        for i,line in enumerate(lines):
            if line.startswith('[SRS]'):
                lines[i]='Links: FR-04/05/06/19; BR-01/07/10; NFR-01/02/03/04/06/07/08. Extend the existing shared adapter/auth/schema; no second scaffold or migration. Template update/deactivate belongs to F-05; deletion is out of scope.'
            elif line.startswith('Manager login'):
                lines[i]='Manager login -> catalog -> create -> save DB -> fresh list/detail. Participant login -> active catalog/detail -> F-03 goal picker. Identity/role come from server session; use shared CSRF/Origin checks. Manager cannot read participant goals/entries.'
            elif line.startswith('- GET '):
                lines[i]='- GET /api/templates?page=1&pageSize=20 and /api/templates/:templateId: participant active only; manager includeInactive=true permitted; sort createdAt DESC/id ASC; return data:TemplateDTO[] and meta:{page,pageSize,total}.'
            elif line.startswith('- POST '):
                lines[i]='- POST /api/templates: PROGRAM_MANAGER only; {title,description?,minMinutes,maxMinutes}. Trim title1..100 Unicode code points, description<=500/default empty; JSON integer bounds1..1440 and min<=max. Equal titles may have different UUIDs.'
            elif line.startswith('- Server '):
                lines[i]='- Server assigns unit=MINUTES, isActive=true, creator and timestamps; return201 with allowlisted TemplateDTO. Client id/unit/owner/role/status fields are unknown422.'
            elif line.startswith('- Errors:'):
                lines[i]='- Errors: anonymous401, role/CSRF/Origin403, validation422, UUID syntax400, missing/invisible404, safe internal500. Field errors are string values plus requestId.'
            elif line.startswith('- UI '):
                lines[i]='- UI /manager/templates/new has labels, helpers and field errors, preserves input after errors and disables inputs/submit while pending. Unknown POST outcome requires catalog inspection before manual retry; no automatic POST retry or exactly-once claim. Catalog has loading/empty/retry/create/inactive-filter states; participant has no create action.'
            elif line.startswith('- Data '):
                lines[i]='- Reuse ActivityTemplate and existing constraints/migrations; validate in API and database. No schema change. F-03 rechecks active state and snapshots title/unit/range; F-02 never changes goal snapshots.'
            elif line.startswith('ทุก test'):
                lines[i]='The following STS was planned at the contract commit. Manager/P1/P2 are synthetic accounts, separate from team members. Integration uses real isolated PostgreSQL; actual execution mapping is in Part F.'
        txt='\n'.join(lines)
    # Printed filenames are historical planned filenames, not execution claims.
    txt=re.sub(r'\[([^]]+)\]\([^)]*\)',r'\1',txt)
    txt=re.sub(r'^## ', '### ',txt,flags=re.M)
    txt=txt.replace('→','->').replace('×','x').replace('≥','>=').replace('≤','<=')
    txt=txt.replace('User authorized B implementation; A peer review pending','Implementation approved to begin; peer review pending at this contract version').replace('B starts per user authorization; A peer review pending','Implementation approved to begin; peer review pending at this contract version')
    return f'## {feature} engineering contract\n\nContract content recorded before implementation. Current review/merge and actual execution are in Part F. Planned filenames in the historical STS may differ from consolidated actual filenames; stable TEST and AC IDs are retained.\n\n'+txt+'\n'

def actual_ac_tables():
    acs=[]
    for file in ['f01-auth.md','f02-templates.md','f03-goals.md','f04-entries-progress.md']:
        for line in textfile('docs/sprints/sprint-1/'+file).splitlines():
            if line.startswith('| AC-F'):
                cells=[c.strip() for c in line.strip('|').split('|')]
                acs.append((cells[0],cells[1]))
    maps={
    'F01':['TEST-F01-01','TEST-F01-02','TEST-F01-03','TEST-F01-04','TEST-F01-05 / TEST-F03-06; TEST-F02-05/06','TEST-F01-06; TEST-F02-05/06; TEST-F04-12','TEST-F01-07','TEST-F01-08'],
    'F02':['TEST-F02-01/07','TEST-F02-02/03','TEST-F02-04','TEST-F02-05/06','TEST-F02-05/06','TEST-F02-01/07; TEST-F02-10','TEST-F02-08','TEST-F02-09','TEST-F02-10'],
    'F03':['TEST-F03-01','TEST-F03-02; restart','TEST-F03-03','TEST-F03-04','TEST-F03-05','TEST-F03-06','TEST-F03-07; TEST-F04-14','TEST-F03-08; TEST-F02-10; TEST-F04-16'],
    'F04':['TEST-F04-01/02','TEST-F04-01/02; TEST-F04-16','TEST-F04-03/04','TEST-F04-05/06','TEST-F04-07/08','TEST-F04-09','TEST-F04-10','TEST-F04-11/12','TEST-F04-12/13','TEST-F04-14','TEST-F04-15','TEST-F04-16']}
    all_results=read_json('artifacts/evidence/deliverable-1/api-results.json')['testResults']
    browser=read_json('artifacts/evidence/deliverable-1/browser-results.json')
    titles=[]
    for suite in all_results:
        for result in suite['assertionResults']:
            path=str(suite['name']).replace('\\','/')
            if 'server/tests/' in path:path=path[path.index('server/tests/'):]
            titles.append((result.get('fullName',result.get('title','')),path))
    def walk(suites):
        for suite in suites:
            for spec in suite.get('specs',[]): titles.append((spec['title'],spec.get('file',suite.get('file',''))))
            walk(suite.get('suites',[]))
    walk(browser['suites'])
    out=[]
    for ac,expected in acs:
        f,num=re.search(r'AC-(F\d+)-(\d+)',ac).groups(); label=maps[f][int(num)-1]
        # Real names are chosen by stable TEST prefix; all matching source paths
        # are retained in the machine-readable coverage manifest.
        ids=re.findall(r'TEST-F\d+-\d+',label)
        matches=[(title,path) for title,path in titles if any(x in title for x in ids)]
        if not matches: raise ValueError(f'No actual tests for {ac}: {label}')
        out.append({'ac':ac,'expected':expected,'planned':label,'actual':matches})
    return out

def build_markdown():
    status_note='Candidate application source: '+BASE+'. Main release approval/merge/tag is pending. Do not submit this draft as an accepted main release.' if not RELEASE else 'Submitted main commit: '+RELEASE+'; tag: '+str(TAG or 'commit reference only')+'.'
    parts=[]
    parts.append('# StudyTrack | Deliverable 1\n\nCPE 334 - Engineering baseline and working Sprint 1. Theme 8: Habit and Activity Tracking System; context: personal reading habits. Prepared 6 November 2026; deadline 8 November 2026, 23:59 Asia/Bangkok.\n\n'+STATUS+'\n\nRepository: '+REPO+'\n\n'+status_note+'\n\n'+mdtable(['Member','Student name / ID','GitHub'],[(str(i+1),m['name']+' / '+m['studentId'],m['github']) for i,m in enumerate(MEMBERS)])+'\nNo separate cover page. Student names/full IDs are required by the handout but have not been supplied; handles and the known ID suffixes identify the working allocation only.\n\n[[NAV]]\n')
    parts.append('''# Part A. SRS and product scope
## A1. Problem, context and actors
Students need a small, reliable way to set daily reading goals, record actual minutes and see whether they met the appropriate target. StudyTrack provides shared activity templates while keeping each participant's goals and activity history private.

Participant: creates and reads own goals, records/corrects own activity, and uses own history, schedule and summaries. Program Manager: maintains the shared template catalog, without access to participant goals/history. Anonymous visitor: starts authentication and sees no protected data. One account has one role. Synthetic seed has one manager and two participants.

## A2. Whole-product scope and exclusions
The baseline includes identity/access, templates, goals, daily activity/progress, target/lifecycle revisions, history/corrections/streaks, persisted schedule/reminder representation and summaries across three sprints. Sprint 1 delivers F-01..F-04 as one UI/API/PostgreSQL journey. Later features are allocated now rather than silently dropped.

Excluded: social sharing, leaderboards, AI advice, medical advice/diagnosis, file uploads, external integrations and email/SMS/push delivery. Self-registration, password recovery and email verification are outside the seeded-account baseline. Reminders are represented in-app. No manager consent-based sharing feature is specified.

## A3. Functional requirements
'''+mdtable(['ID','Observable behavior','Allocation'], [('FR-'+i,desc,f+' / S'+s) for i,desc,f,s in FR]))
    parts.append('## A4. Business rules\n\n'+mdtable(['ID','Required invariant','Allocation'], [('BR-'+i,desc,f+' / S'+s) for i,desc,f,s in BR]))
    parts.append('## A5. Measurable non-functional requirements\n\n'+mdtable(['ID / scope','Measurable target','Verification checkpoint'], [('NFR-'+i+'; '+scope,target,verify) for i,target,verify,scope in NFR]))
    parts.append('''## A6. Assumptions, decisions and open questions
DEC-01: Theme8/reading context selected by the team; integer MINUTES gives explicit testable bounds. DEC-02: one new StudyTrack repository/database, separate from TokTickIT. DEC-03: A owns F01/F03/foundation and B owns F02/F04, with cross-review; responsibilities rotate in later work. DEC-04: SRS FR01..19/BR01..13/NFR01..08 are the authoritative stable IDs.

DEC-05: same-origin modular monolith, React/Vite plus Express/TypeScript and PostgreSQL/Prisma. DEC-06: server-side opaque sessions, Argon2id, synchronizer CSRF and exact Origin checks. DEC-07: snapshot template title/unit/bounds and version targets by effective date. DEC-08: domain dates use Asia/Bangkok and PostgreSQL DATE; audit timestamps use UTC. DEC-09: version contracts/tests before implementation and retain actual red/green history. DEC-10: the initial lack of a shared repository was resolved by creating auto4496/studytrack and adding Datakung; it is a historical decision, not a current blocker.

Current open items: full student names/IDs; final main release review/merge/tag; later cloud resources/cost/access; independent UAT partner and TA-approved maintenance change. Conflicting final-video length/rubric in later handouts must be clarified before final delivery; this does not change D1. No unsupported performance SLA is claimed. Scope changes require rationale, affected IDs and review; no scope deletion has been approved in this increment.
''')
    parts.append('# Part B. Feature inventory and traceability\n\n## B1. Complete product feature inventory\n\n'+mdtable(['Feature / outcome','Sprint / lead','Dependencies'],[(i+' '+name+'. '+desc,owner,dep) for i,name,desc,owner,dep in FEATURES]))
    parts.append('## B2. Requirements-to-feature-to-sprint mapping\n\nS1 means implemented and checked on the named candidate; final main acceptance remains a separate gate. S2/S3 are allocated, with detailed contracts/tests required before their implementation.\n\n'+mdtable(['Requirement IDs','Feature / sprint','Verification / current scope'],[(f'FR-{i}',f+' / S'+s,('F01/F02/F03/F04 AC and actual result ledger in Part F' if s=='1' else 'Cross-cutting S1 checks; extend new routes in S2/S3' if s=='1-3' else 'Planned contract and domain/API/UI checks before code')) for i,_,f,s in FR]))
    br_ver={'01':'F02 validation and F03/F04 snapshot tests','02':'F03 AC01/03/07: create/date/target','03':'F03 AC05: one winner under concurrency','04':'F04 AC06/07: duplicate/concurrent','05':'F04 AC04/05: date/snapshot bounds','06':'F04 AC03: HALF_UP/125%; S3 summary planned','07':'All S1 role/owner/forged-field tests; extend S2/S3','08':'S1 historical-target consumer verified; revision mutation planned S2','09':'Streak contract/test matrix planned S2','10':'S1 inactive/snapshot consumers checked; lifecycle writes planned S2','11':'S1 archived fixture bounds checked; lifecycle/correction planned S2','12':'Period/deduplicated-day rules planned S2/S3','13':'Weekday/time/persistence rules planned S3'}
    parts.append(mdtable(['Requirement IDs','Feature / sprint','Verification / current scope'],[(f'BR-{i}',f+' / S'+s,br_ver[i]) for i,_,f,s in BR]))
    parts.append(mdtable(['Requirement IDs','Responsibility / sprint','Verification / current scope'],[(f'NFR-{i}',scope,verify+' '+('Local checks recorded; cloud portion pending.' if i in ['02','03','05'] else 'S1 evidence in Part F; extend at later checkpoint.')) for i,_,verify,scope in NFR]))
    parts.append('''## B3. Coverage and change status
All19 FR,13 BR and8 important NFR have a feature or named system responsibility and sprint allocation. There are no intentionally uncovered baseline requirements. Later-sprint allocation does not mean implementation. BR08/10/11 have S1 read/consumer fixtures; their revision/deactivation/archive mutation workflows remain F05/F06 work. Cloud/CI/UAT/maintenance checkpoints remain pending. B's v0.2 mappings preserved A's IDs; historical draft text is not current acceptance. Scope is unchanged; final release metadata and identity fields are explicit remaining gates.
''')
    parts.append('''# Part C. System-Level SDS
## C1. Architecture and responsibilities
React19/Vite8/TypeScript provides the browser UI, routes and shared API/auth client. Express5/TypeScript handles cookie sessions, identity/role/ownership policies, strict request validation, safe DTOs and errors. Feature services enforce date/target/snapshot rules and transactions. Prisma6.19.3 accesses PostgreSQL17. Database unique/check constraints protect persisted invariants under competing requests.

[[ARCH]]

Development uses one browser origin and Vite /api proxy to Express. Production build is served by the same Express application. Durable PostgreSQL is separate from the disposable application process/container. The browser never supplies authoritative owner/role or progress calculations.

## C2. Data model and constraints
UUID IDs, snake_case database names and camelCase JSON. Domain dates are DATE/ISO YYYY-MM-DD; timestamps are timestamptz/UTC. The following six entities exist in Sprint1; schedule is a future extension.
'''+mdtable(['Entity / relationships','Important fields','Constraints / responsibility'],[
('User','id,emailNormalized,displayName,passwordHash,role,createdAt','Unique normalized email; PARTICIPANT/PROGRAM_MANAGER; hash excluded from DTO.'),
('Session -> User (nullable)','id,tokenHash,csrfToken,userId,createdAt,expiresAt','Unique hashed token; null user for pre-auth CSRF; expired/revoked session denied.'),
('ActivityTemplate -> creator User','id,title,description,unit,minMinutes,maxMinutes,isActive,createdById,timestamps','MINUTES; 1<=min<=max<=1440; title1..100; creator FK; manager checked in API.'),
('Goal -> owner User/template','id,ownerId,templateId,titleSnapshot,unit,min/maxSnapshot,startDate,endDate,status,createdAt','Partial unique(ownerId,templateId) WHERE status=ACTIVE; immutable historical context.'),
('GoalTargetVersion -> Goal','id,goalId,effectiveFrom,targetMinutes,createdAt','Unique(goalId,effectiveFrom); initial version at startDate; latest version <=requested date.'),
('DailyEntry -> Goal','id,goalId,entryDate,minutes,createdAt,updatedAt','Unique(goalId,entryDate); positive integer<=1440; service checks own goal, snapshot bounds/date.'),
('GoalSchedule (planned S3)','goalId,weekday,localTime','Unique(goalId,weekday); weekday1..7/HH:mm; not in current schema.')]))
    parts.append('''[[ER]]

Goal+initial target are created atomically. Entry insertion locks the owned goal FOR SHARE, checks bounds/target and inserts in one transaction; PostgreSQL uniqueness supplies the one-winner guarantee. Progress/list reads use repeatable-read snapshots. Known unique conflicts map to409; unexpected failures roll back and return safe500. A foreign key alone does not enforce role, template-active state or cross-table date/range rules. Later lifecycle writers must use a compatible row-lock order. No S1 deactivate endpoint exists.

Versioned SQL migrations include check/partial unique constraints not fully expressible in the ORM schema. Apply immutable migrations with migrate deploy; future changes add a migration. Seed upserts three synthetic users and two templates, does not reset existing records/passwords. Automated suites use guarded isolated databases, never development.

## C3. UI/navigation and common states
Routes: /login; /manager/templates; /manager/templates/new; /templates; /goals; /goals/new; /goals/:goalId. Later contracts add lifecycle/history/schedule/summary views. Role navigation comes from trusted /auth/me; no role dropdown or owner selector. Labels and visible keyboard focus identify inputs, field errors retain values, pending disables repeated submits, and loading/empty/error/success are distinct. 401 clears private auth state and offers login without replaying mutations. 403/404 show safe messages; backend still enforces access.

Date inputs send Bangkok date-only strings. Future-start goal shows a notice without an invalid entry fetch. Saved dates show persisted progress; a late response cannot replace a newly selected date. Lost POST responses reconcile via GET before another write. Template titles may duplicate, so unknown template-create outcomes require catalog inspection and do not claim exactly-once creation. Progress label can exceed100%; the visual bar caps at100%.

## C4. API conventions and DTOs
Same-origin JSON UTF-8 under /api, no permissive CORS. Unsafe authenticated JSON requests require cookie, exact configured Origin, X-CSRF-Token and Content-Type:application/json. Success is {data:DTO}; collections add meta:{page,pageSize,total}; logout204 has no body. Bounded pagination defaults1/20 with pageSize<=100; deterministic sorts. Unknown body/query keys reject on the documented strict surfaces. Invalid JSON/UUID/date syntax400; invalid values422; anonymous401; wrong role/CSRF/origin403; missing/cross-owner404; duplicate409; unsupported body415; safe unexpected500. Error={error:{code,message,fields?:{field:string},requestId}}. Request body limit16KiB.

UserDTO exposes id,email,displayName,role. TemplateDTO exposes id,title,description,unit,minMinutes,maxMinutes,isActive,createdAt,updatedAt. GoalDTO exposes id,templateId,templateTitle,unit,minMinutes,maxMinutes,startDate,endDate,status,targetMinutes,targetEffectiveFrom,createdAt. EntryDTO exposes id,goalId,entryDate,minutes,targetMinutes,progressPercent,achieved,createdAt,updatedAt. No password/session digest or server creator/owner impersonation input is exposed. GoalDTO's target is current (initial for future-start); EntryDTO resolves the entry date's version.
'''+mdtable(['Operation','Participant','Manager / anonymous'],[
('GET auth/csrf; POST auth/login','Bootstrap/valid credentials, CSRF+Origin','Same login flow; anonymous bootstrap allowed'),
('GET auth/me; POST auth/logout','Own authenticated identity/session','Own authenticated identity/session; anonymous401'),
('GET templates/list/detail','Active only; includeInactive=true403','Shared catalog; inactive filter/detail allowed; anonymous401'),
('POST templates','403 even forged role','Manager201 with strict payload; anonymous401'),
('POST/GET goals; GET goal detail','Own only; cross-owner detail404','403; anonymous401'),
('POST/list entries; GET progress','Own goal only; cross-owner404','403; anonymous401')]))
    parts.append('''## C5. Authentication lifecycle and ownership
Passwords are Argon2id with unique salt, memory19456KiB, iterations2, parallelism1. Fixture strings are synthetic; seed passwords are private environment values. Invalid email/password share generic401. Session cookie holds random32-byte base64url ID; database stores SHA256 token digest and a separate random CSRF token. Pre-auth session lasts30min; valid login rotates/revokes prior session and CSRF then issues fixed8h session. Expiry is enforced server-side, not sliding client time. /auth/me reads identity, /auth/csrf bootstraps token and auth endpoints are no-store. Logout deletes current DB session and clears cookie; replay fails, independent sessions remain valid.

Cookie studytrack.sid is HttpOnly, SameSite=Lax, Path=/ with no Domain; Secure in production HTTPS. Exact Origin and synchronizer token protect unsafe requests, including login. Role is read from trusted user record. Private goal lookup scopes id AND ownerId; manager never bypasses that policy. DTO allowlists, safe errors and request IDs avoid credential/private-row leakage.

## C6. Configuration, deployment and verification design
'''+mdtable(['Variable','Purpose / handling'],[
('DATABASE_URL','Private PostgreSQL URL for application; durable DB outside app filesystem.'),
('TEST_DATABASE_URL','Different PostgreSQL DB with explicit test marker; isolated destructive fixtures only.'),
('APP_ORIGIN / PORT / NODE_ENV','Exact browser origin, API port, development/test/production mode; never client-owned policy.'),
('POSTGRES_PASSWORD','Private local Compose credential; generated, ignored, not in PDF.'),
('SEED_MANAGER_PASSWORD / SEED_PARTICIPANT_PASSWORD','Private generated synthetic-account seed passwords; placeholders refused.'),
('API_PROXY_TARGET / PLAYWRIGHT_CHANNEL','Local dev proxy/browser configuration; not secrets.')]))
    parts.append('''Plan for Lab5: package the production build as a stateless application container; use HTTPS container hosting and managed PostgreSQL on GCP with external secret configuration, durable database storage and controlled migrations. Add PR build/tests, required failed-check gate proof, repeatable accepted-main delivery, health/version identification and post-deploy normal/rejection/access/persistence checks. Exact resources, IAM/cost and workflow require the delivery checkpoint; none are provisioned or claimed complete here. No completed Docker app, CI/CD, cloud URL or demo video is required for D1.

Unit checks cover important logic; API+real PostgreSQL covers transactions, constraints, auth/ownership; selected browser journeys cover critical flows and state recovery. Independent UAT is performed by another real team in Lab6, not inferred from automation.
''')
    parts.append('''# Part D. Three-sprint plan
## D1. Goals, allocation and completion outcomes
'''+mdtable(['Sprint / checkpoint','Features, lead and dependencies','Completion outcome'],[
('1: by8Nov','F01 A -> F02 B -> F03 A -> F04 B. Shared identity/schema/DTO/date rules; peer review across owners.','Working manager-template -> participant-goal -> entry -> persisted progress, negative/access/concurrency checks, reviewed staging/main release and A-F PDF.'),
('2: internal9-22Nov; complete by29Nov','F05 A lifecycle/target changes -> F06 B history/correction/streak. Depends on accepted S1 and agreed version/snapshot/stop semantics.','Every F05/F06 AC implemented, tested/reviewed/integrated; historical calculations unchanged by later target revisions; deployed candidate for D2.'),
('3:23Nov-13Dec; progress29Nov','F07 A schedule/reminder; F08 B real summary/integration. F07 dependsF03/F05; F08 dependsF04/F05/F06.','ByD2 both contracts and >=1 meaningful implemented/tested workflow/rule; byFinal complete baseline, failure/access/usability/regression/UAT/deployment/docs.')]))
    parts.append('''## D2. Feasibility, gates and shared work
S1 is deliberately one complete vertical slice instead of many empty screens: seed identities, one unit, explicit date/duplicate rules, no registration/recovery/social/external delivery. Contracts/test design can proceed while dependencies are being implemented; authoritative access/persistence evidence must use the actual API/database. Each owner performs requirements/design/tests/code and reviews the other; no permanent frontend/backend-only learning role.

4-6Nov: finish release setup/evidence/PDF and resolve review findings. 7Nov: integrated candidate, fresh-run/setup and document checks. 8Nov: final-head peer release review, clean-main/tag and PDF consistency, then one LEB2 team submission before23:59. These are remaining targets, not invented completed events.

9-15Nov: A leads Docker/persistence/config, B leads CI/gate/deploy, both exercise delivery.9-22Nov: F05/F06 parallel with Lab6; at least4 cross-team cases and an accepted defect fix plus independent retest.17-29Nov: instructor/TA-approved change to implemented behavior for Lab7, with impact/contract/red-green/regression/redeploy and five dated metrics.23-29Nov: real S3 progress alongside completed S2 and deployed D2. Aim for near-complete product by29Nov before1-11Dec exams;12-13Dec bounded fixes/final regression/report/video.

Risk controls: resolve shared schema/auth/DTO changes before dependent code; compatible lock order for lifecycle; preserve actual failure reports and current-source results; identify owner/dependency/next date for bounded remaining work. Do not replace a baseline feature with generic hardening. If independent UAT finds no real defect, consult TA rather than inventing one. Equal commit counts are not required.
''')
    parts.append('''# Part E. Sprint 1 engineering contracts
The following contracts contain feature design, applicable UI/API/data, stable AC, planned STS and DoD directly in this PDF. Original pre-implementation version/status is historical. F01/F03 began in11cdfe5; B drafts e3714d0 were reconciled inee14477 before F02/F04 code. PartF maps planned IDs to actual consolidated files/names/results. Final-head peer acceptance and release history are explicitly separate from pre-code design.

## E0. Shared transport and exact endpoints
'''+mdtable(['Method / path','Input and result','Key failure outcomes'],[
('GET /api/auth/csrf','data:{csrfToken,expiresAt}; anonymous pre-auth cookie if needed','Safe internal500'),
('POST /api/auth/login','{email,password}+CSRF/origin ->200 user,csrfToken,expiresAt; rotate cookie','Credentials401, validation422, CSRF/origin403'),
('GET /api/auth/me; POST /api/auth/logout','Authenticated identity200; revoke/logout204','Anonymous/expired401; unsafe token/origin403'),
('GET /api/templates; GET /:templateId','Authenticated catalog/detail; page/pageSize; manager includeInactive=true','Anonymous401; participant inactive filter403; missing/invisible404'),
('POST /api/templates','Manager {title,description?,minMinutes,maxMinutes}->201 TemplateDTO','401/403/422; server owns unit/status/creator'),
('POST /api/goals','Participant {templateId,dailyTargetMinutes,startDate}->201 GoalDTO','Missing404,inactive422,range/date422,ACTIVE duplicate409'),
('GET /api/goals; GET /:goalId','Own list/detail; bounded page/pageSize/status','401/403; cross-owner/missing404'),
('POST /api/goals/:goalId/entries','Own {entryDate,minutes}->201 EntryDTO','Date syntax400, bounds422,duplicate409,401/403/404'),
('GET /api/goals/:goalId/entries','Own paged EntryDTO[] + meta; date DESC/id ASC','Invalid query422;401/403/404'),
('GET /api/goals/:goalId/progress?date=YYYY-MM-DD','goalId,date,actualMinutes,targetMinutes,progressPercent,achieved,entryId/null','Required date; same date bounds;401/403/404/400/422')]))
    for fname,f in [('f01-auth.md','F-01'),('f02-templates.md','F-02'),('f03-goals.md','F-03'),('f04-entries-progress.md','F-04')]:parts.append(contract(fname,f))
    parts.append('''## E5. Product Definition of Done
All required behavior and important negative/boundary/role cases are implemented. Planned meaningful unit/API/PostgreSQL/browser verification is actually executed; failures/skips and limits are explicit. ACs map to real test IDs/files/names/results/source. Contracts precede code with visible justified revisions; intended-behavior red/green is retained. The teammate inspects changes and assertions, fixes are re-reviewed, features integrate into staging and the reviewed release reaches main. Setup/docs/evidence are current and both members can explain sampled design/tests/behavior. Candidate checks alone do not complete pending main release or later-sprint/cloud/UAT work.
''')
    parts.append('''# Part F. Working Sprint 1 and verification
## F1. Version and execution scope
Application evidence below identifies source85f510f0d73b84f39c08fbf3ef36e43b232bb044. Report/readiness edits do not change application or test sources; equivalence is checked. Main release metadata remains pending until actual final-head peer approval and merge. All current full-suite checks are automated; screenshot inspection is visual review, not independent human UAT.

Fresh checkout: npm ci installed229 packages/audited230 with0 vulnerabilities. Generated private environment files; migrated newly created, isolated D1 development and test databases; ran seed twice with unchanged3 users/2 templates. Alternate UI/API3400/5400 avoids occupied defaults. DB instance uses loopback25433 with different database names studytrack_d1_dev_20261104 and studytrack_d1_test_20261104. Original development/test databases were not reset.

[[RESULTS]]

## F2. Program demonstrations
The following are real local UI/API/PostgreSQL scripted checks on the named application source. Synthetic manager/student1/student2 roles are distinct from team identities. Safe response dumps retain status/domain values only, without credentials/tokens. Each screenshot caption states role, starting conditions, action and expected/actual outcome. Refer to the single source reference above for this entire demonstration set.

[[DEMONSTRATIONS]]

## F3. Complete AC-to-actual-test result mapping
Each of the37 Sprint1 ACs below retains its contract TEST IDs, concrete actual file/name and PASS result from the recorded suites. Combined names consolidate planned split files; the mapping is not a claim that historical planned filenames all exist. Unit/API rows were exercised in the117-check run; browser rows in the24-check run. Restart supplements persistence. Full parameterized names and reports remain in the repository.

[[ACMAP]]

## F4. Two actual test excerpts
These selected unchanged excerpts include setup and assertions from actual automated sources, not pseudocode. Both tests passed in the117-check result. Sensitive headers refer only to synthetic in-memory fixtures; no token values are printed.

[[TESTEXCERPTS]]

## F5. Meaningful TDD and correction history
Contract baseline11cdfe5 preceded application implementation. Red2fc6252 ran6 checks:3 passed/3 failed (logout/rule assertions failed against unimplemented behavior, with real login/PostgreSQL fixture working). Greena13858f reran the same6:6passed/0failed/0skipped. Expanded checks were added without treating an environment failure as domain TDD.

[[TDD]]

B F02 contractee14477 preceded red0e1ca17 (15fail/1pass) and greena3769d4; B F04 red d709741 had30fail against missing routes before implementation. Final integrated code passes all117/24. Historical fixture-clock/session and browser logout-timing failures are retained in author evidence; they were corrected without removing expiry/logout assertions. PR3 review found localhost case/root-dot guard bypass: review-red db199eb had2fail/7pass, fixd2efada had9guardpass plus full40 API/10browser at that revision. Current117 includes the corrected guard. These historical failed counts are disclosed separately from current full-suite0fail/0skip.

## F6. Engineering workflow, review and contribution
[[HISTORY]]

Two sampled completed issue chains: Issue4/F02 -> codex/f02-templates -> PR6 -> A substantive approval on ec681e9 -> staging18e5882; Issue5/F04 -> codex/f04-entries-progress -> PR7 -> A substantive approval on36fc9b6 -> staging85f510f. Both were closed and markedDone after feature acceptance. PR3 A/F01/F03 was reviewed by B with a concrete guard finding and subsequent corrected-head approval, staging1a4b74b. Staging-to-main release is a separate pending peer review; this PDF must be refreshed after it occurs.

[[BOARD]]
'''+mdtable(['Member','Contribution supported by history','Peer review / shared work'],[
('A / auto4496; ID suffix70','Product/SRS/System SDS/data/auth foundation; F01/F03 contract/tests/implementation; guard correction; independent B verification; readiness/report assembly.','Reviewed B PR6/7 with actual66/16 and117/24 checks; integrated candidates, setup and evidence. B reviewed A PR3.'),
('B / Datakung; ID suffix68','Feature inventory/traceability/sprint/UI conventions; F02/F04 contracts/tests/implementation; daily progress/recovery/real restart evidence.','Reviewed A PR3, identified P2 guard defect and approved corrected head; supplied integration/handoff evidence. A reviewed B PR6/7.')])+'''
AI-assisted engineering: both members used Codex within a requirements-driven workflow. Work requests defined feature scope, shared interfaces, business rules, acceptance criteria and expected verification. Codex assisted with design, implementation, test preparation, execution and documentation. Generated changes were checked against versioned contracts, test assertions and actual build/test results; recorded failures and teammate-review findings guided corrections. Work remained traceable through Issues, feature branches, commits and reviewed integration. Acceptance relied on observable behavior and retained evidence rather than generated completion claims. AI-assisted review and execution are disclosed. Both members remain responsible for understanding and explaining the design, tests and released behavior.

## F7. Reproduction and final submission gates
Prerequisites: Node>=22.12, npm, Git, Docker Desktop/Linux PostgreSQL17 and Edge(Windows) or installed Playwright Chromium. See the commands below; environment examples contain placeholders and setup generates private random credentials.

```sh
npm ci
npm run setup:local
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
# Sequential verification on distinct TEST_DATABASE_URL:
npm run db:test:migrate
npm test
npm run build
npx playwright test --config playwright.member-b.config.ts
npx tsx scripts/member-b-restart.ts
```

Synthetic accounts: manager@studytrack.test uses private SEED_MANAGER_PASSWORD; student1@studytrack.test and student2@studytrack.test use private SEED_PARTICIPANT_PASSWORD. No password/token is embedded in the PDF. Seed reruns preserve existing accounts. Exact Origin/cookie/CSRF configuration must match the opened UI. The test guard normalizes localhost case/root-dot/loopback and refuses an equal dev target; never run destructive suites on development. If ports are occupied, configure alternate documented URLs/ports or an isolated PostgreSQL target without application-source changes.

Current limitations: F05..F08 remain planned; lifecycle consumers are tested through fixtures but no revision/archive/deactivate UI/API is claimed. No independent UAT, cloud deployment, required CI gate, containerized application or final video is claimed. Main release approval/merge/tag and full student identities are still finalization gates. Repository accessibility must be checked for the TA; Lab5 separately requires public visibility until grading ends. No visibility/billing/IAM operation is part of this preparation.

Before submission: teammate reviews the preparation changes and final staging release PR; merge reviewed release into main; run final clean-main checks and record immutable accepted commit/tag; update this PDF release metadata/history and names/full IDs; verify page navigation/readability; submit one team PDF through LEB2 before8Nov23:59. Later commits must not silently replace the assessed version.

## F8. Source and evidence index
Course sources: group_work_specs_v1.pdf (theme8, engineering workflow) and project_deliverable_1_v1.pdf (8 pages, PartsA-F, self-contained PDF and main-release requirements). Source documents are retained unchanged in repository sources/. Detailed baseline source files: docs/srs.md, docs/features.md, docs/traceability.md, docs/system-sds.md, docs/sprints/plan.md, docs/sprints/sprint-1/*.md and docs/integration-contract.md. Actual execution JSON/logs, selected screenshots and review manifests are under artifacts/evidence/. The engineering content required for assessment is embedded in this PDF; links support targeted verification.
''')
    result='\n\n'.join(parts)
    if META.get('submissionScheduleStatus'):
        result=result.replace('[[NAV]]','Schedule note: '+META['submissionScheduleStatus']+'\n\n[[NAV]]',1)
    if RELEASE:
        replacements={
          'No separate cover page. Student names/full IDs are required by the handout but have not been supplied; handles and the known ID suffixes identify the working allocation only.':'Student names and full IDs are supplied by the team. The report begins with project information and navigation, followed immediately by Part A.',
          'Current open items: full student names/IDs; final main release review/merge/tag; later cloud resources/cost/access; independent UAT partner and TA-approved maintenance change.':'Resolved on 4 November: both student identities supplied, release PR9 approved and merged to main. Current open items are later cloud resources/cost/access, independent UAT partner and TA-approved maintenance change.',
          'S1 means implemented and checked on the named candidate; final main acceptance remains a separate gate.':'S1 means implemented, checked and accepted through reviewed release PR9 on the named main commit.',
          '4-6Nov: finish release setup/evidence/PDF and resolve review findings. 7Nov: integrated candidate, fresh-run/setup and document checks. 8Nov: final-head peer release review, clean-main/tag and PDF consistency, then one LEB2 team submission before23:59. These are remaining targets, not invented completed events.':'The original internal plan reserved4-6Nov for implementation,7Nov for candidate checks and8Nov for release/submission. Actual feature and release reviews completed on4Nov; the accepted main is verified and tagged. Remaining work is joint PDF review and one LEB2 team submission before8Nov23:59.',
          'Application evidence below identifies source85f510f0d73b84f39c08fbf3ef36e43b232bb044. Report/readiness edits do not change application or test sources; equivalence is checked. Main release metadata remains pending until actual final-head peer approval and merge. All current full-suite checks are automated; screenshot inspection is visual review, not independent human UAT.':f'Accepted main source: {RELEASE}; immutable tag: {TAG}. The primary API/unit, browser, build and restart outputs below were run on a clean detached checkout of this exact main commit. Fresh-install/seed and scripted screenshots were produced on85f510f; git comparison confirms identical application, tests, package and runtime configuration through accepted main. This is the explicit version exception for that demonstration/setup set. Report utility changes do not alter the product. Full-suite checks are automated; screenshot inspection is visual review, not independent human UAT.',
          'Main release approval/merge/tag and full student identities are still finalization gates.':'Main release approval/merge/tag and both full student identities are recorded. Joint review of this PDF precedes course submission.',
          'Staging-to-main release is a separate pending peer review; this PDF must be refreshed after it occurs.':f'Staging-to-main PR9 was authored by Datakung, separately approved by auto4496 at0c0915e, and merged as{RELEASE}; tag{TAG} records the accepted version. Clean-main checks are the primary current results above.',
          'Before submission: teammate reviews the preparation changes and final staging release PR; merge reviewed release into main; run final clean-main checks and record immutable accepted commit/tag; update this PDF release metadata/history and names/full IDs; verify page navigation/readability; submit one team PDF through LEB2 before8Nov23:59. Later commits must not silently replace the assessed version.':'Before submission: both students check the final PDF, including page navigation, identities and release references, and ensure the assessor can access the repository. Submit one self-contained PDF per team through LEB2 by 8 November 2026 at 23:59 Asia/Bangkok. The reviewed Sprint 1 main release, immutable tag and clean-main results are recorded above. Submission remains pending. Later commits must not silently replace the assessed version.',
          'Scope is unchanged; final release metadata and identity fields are explicit remaining gates.':'Scope is unchanged; final main release metadata and both student identities are now recorded. Final PDF checking and course submission remain.',
          'Initial draft had no execution evidence; current A results are separate from still-pending B review and full product integration':'At the original contract date there was no execution evidence or completed peer integration. Current completed review, integration and results are recorded in Part F',
          'A implementation exists; B review, manager-created-template integration and full F-04 journey are still pending':'At the original contract date, the complete manager-created-template/F04 journey and peer acceptance were future work. Their completed execution and review history are recorded in Part F',
          'Candidate checks alone do not complete pending main release or later-sprint/cloud/UAT work.':'Main release completion is demonstrated by the actual reviewed merge and clean-main results in Part F; these checks do not certify later-sprint/cloud/UAT work.'
        }
        for old,new in replacements.items():
            if old not in result:raise ValueError('Expected report status text not found: '+old[:65])
            result=result.replace(old,new)
    return result

PAGE_W,PAGE_H=A4
M=43
W=PAGE_W-2*M
GREEN=colors.HexColor('#205b4d'); MUTED=colors.HexColor('#5a6b65'); INK=colors.HexColor('#21312c'); LIGHT=colors.HexColor('#edf3ef')
for n,f in [('Body','calibri.ttf'),('Bold','calibrib.ttf'),('Italic','calibrii.ttf'),('Mono','consola.ttf')]:pdfmetrics.registerFont(TTFont(n,'C:/Windows/Fonts/'+f))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Italic',boldItalic='Bold')
styles={
 'body':ParagraphStyle('body',fontName='Body',fontSize=9.1,leading=12.5,textColor=INK,spaceAfter=6,splitLongWords=True),
 'small':ParagraphStyle('small',fontName='Body',fontSize=7.9,leading=10.5,textColor=MUTED,spaceAfter=4),
 'cell':ParagraphStyle('cell',fontName='Body',fontSize=8,leading=10.5,textColor=INK,splitLongWords=True),
 'th':ParagraphStyle('th',fontName='Bold',fontSize=8.3,leading=11,textColor=colors.white),
 'h1':ParagraphStyle('h1',fontName='Bold',fontSize=18,leading=22,textColor=GREEN,spaceBefore=12,spaceAfter=10,keepWithNext=True),
 'h2':ParagraphStyle('h2',fontName='Bold',fontSize=12.1,leading=16,textColor=GREEN,spaceBefore=10,spaceAfter=6,keepWithNext=True),
 'h3':ParagraphStyle('h3',fontName='Bold',fontSize=10.4,leading=14,textColor=GREEN,spaceBefore=8,spaceAfter=5,keepWithNext=True),
 'code':ParagraphStyle('code',fontName='Mono',fontSize=7.7,leading=10,textColor=INK,spaceBefore=4,spaceAfter=8,leftIndent=5,borderPadding=7,backColor=colors.HexColor('#f1f4f2'))}

def normalize(s):
    return s.replace('\ufeff','').replace('—',' - ').replace('–','-').replace('‑','-').replace('→',' -> ').replace('×',' x ').replace('≥','>=').replace('≤','<=').replace('’',"'").replace('“','"').replace('”','"').replace('…','...')
def inline(s):
    s=html.escape(normalize(s))
    s=re.sub(r'`([^`]+)`',lambda m:'<font name="Mono" size="7.7">'+m.group(1)+'</font>',s)
    s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
    def link(m):
        label,url=m.groups()
        if not url.startswith(('https://','http://')):return label
        return '<link href="'+html.escape(html.unescape(url),quote=True)+'" color="#205b4d">'+label+'</link>'
    s=re.sub(r'\[([^]]+)\]\(([^)]+)\)',link,s)
    return s
def p(s,style='body'):return Paragraph(inline(s),styles[style])
def table(head,rows,widths=None):
    if widths is None and head==['Feature / outcome','Sprint / lead','Dependencies']:
        widths=[W*.58,W*.15,W*.27]
    if widths is None:
        n=len(head)
        ratios={2:[.26,.74],3:[.18,.45,.37],4:[.16,.22,.4,.22],5:[.13,.08,.37,.24,.18],6:[.12,.22,.23,.17,.13,.13]}.get(n,[1/n]*n)
        widths=[W*x for x in ratios]
    data=[[p(c,'th') for c in head]]+[[p(str(c),'cell') for c in row] for row in rows]
    t=LongTable(data,colWidths=widths,repeatRows=1,hAlign='LEFT',splitByRow=1,splitInRow=1)
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),GREEN),('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,LIGHT]),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LINEBELOW',(0,0),(-1,0),.7,GREEN),('LINEBELOW',(0,1),(-1,-1),.3,colors.HexColor('#d9e3dd'))]))
    return t
def code(s,maxlines=None):
    lines=[]
    for line in normalize(s).splitlines():
        if len(line)>112:
            lines.extend(textwrap.wrap(line,width=112,initial_indent='',subsequent_indent='    ',replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False))
        else:lines.append(line)
    if maxlines:lines=lines[-maxlines:]
    return Preformatted('\n'.join(lines),styles['code'])

def box(d,x,y,w,h,title,body):
    d.add(Rect(x,y,w,h,rx=6,ry=6,fillColor=LIGHT,strokeColor=GREEN,strokeWidth=.7))
    d.add(String(x+8,y+h-17,title,fontName='Bold',fontSize=9,fillColor=GREEN))
    for i,line in enumerate(body):d.add(String(x+8,y+h-32-i*12,line,fontName='Body',fontSize=7.7,fillColor=INK))
def arrow(d,x1,y1,x2,y2):
    d.add(Line(x1,y1,x2,y2,strokeColor=GREEN,strokeWidth=1))
    if x2>x1:d.add(Polygon([x2,y2,x2-5,y2+3,x2-5,y2-3],fillColor=GREEN,strokeColor=GREEN))
    elif y2<y1:d.add(Polygon([x2,y2,x2-3,y2+5,x2+3,y2+5],fillColor=GREEN,strokeColor=GREEN))
def arch():
    d=Drawing(W,118)
    for x,title,b in [(0,'Browser',['React / routes / forms','Cookie + CSRF client']), (180,'API and services',['Express / policies / rules','Transactions / safe DTOs']), (360,'PostgreSQL',['Prisma / migrations','Unique and check constraints'])]:box(d,x,27,148,78,title,b)
    arrow(d,148,66,180,66);arrow(d,328,66,360,66)
    d.add(String(2,8,'Same-origin /api  |  Server authority  |  Durable database separate from application lifecycle',fontName='Body',fontSize=8,fillColor=MUTED))
    return d
def er():
    d=Drawing(W,252)
    boxes=[(0,158,'User',['UUID / identity / role']), (180,158,'Goal',['owner / template / snapshots']), (360,158,'DailyEntry',['goal / date / minutes']), (0,35,'Session',['user / digest / expiry']), (180,35,'ActivityTemplate',['creator / title / range']), (360,35,'GoalTargetVersion',['goal / effectiveFrom / target'])]
    for x,y,t,b in boxes:box(d,x,y,148,68,t,b)
    arrow(d,148,190,180,190);arrow(d,328,190,360,190);arrow(d,74,158,74,103)
    arrow(d,254,103,254,158);arrow(d,328,174,435,103)
    d.add(String(5,235,'1 User -> many Goals / Sessions / Templates; 1 Goal -> many Entries and TargetVersions',fontName='Body',fontSize=8,fillColor=MUTED))
    d.add(String(3,10,'GoalSchedule is planned for Sprint 3 and is not an implemented entity in this schema.',fontName='Body',fontSize=8,fillColor=MUTED))
    return d

class PartHeading(Paragraph):
    def __init__(self,text,part):super().__init__(inline(text),styles['h1']);self.part=part
class Doc(BaseDocTemplate):
    def __init__(self,path):
        super().__init__(str(path),pagesize=A4,leftMargin=M,rightMargin=M,topMargin=45,bottomMargin=42,title='StudyTrack - CPE334 Deliverable1',author='StudyTrack team: auto4496 and Datakung')
        self.part_pages={};self.current='StudyTrack'
        frame=Frame(M,42,W,PAGE_H-87,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='standard',frames=[frame],onPage=self.page_header))
    def afterFlowable(self,f):
        if isinstance(f,PartHeading):
            self.part_pages[f.part]=self.page;self.current='Part '+f.part
            self.canv.bookmarkPage('part'+f.part);self.canv.addOutlineEntry(f.getPlainText(),'part'+f.part,0)
    def page_header(self,c,doc):
        c.setStrokeColor(colors.HexColor('#ccdbd2'));c.setLineWidth(.5);c.line(M,PAGE_H-29,PAGE_W-M,PAGE_H-29)
        c.setFont('Bold',7.8);c.setFillColor(GREEN);c.drawString(M,PAGE_H-21,'STUDYTRACK  /  CPE 334')
        c.setFont('Body',7.2);c.setFillColor(MUTED);c.drawRightString(PAGE_W-M,PAGE_H-21,'DELIVERABLE 1  |  06 NOV 2026')
        c.line(M,29,PAGE_W-M,29);c.setFont('Body',7);c.drawString(M,18,'Review candidate - pending final main release / identity metadata' if not RELEASE else 'Submitted release: '+RELEASE[:12]);c.drawRightString(PAGE_W-M,18,str(doc.page))

def image_flow(path,caption,maxheight=470):
    from PIL import Image as PILImage
    path=ROOT/path
    if not path.exists():return [p('Evidence image is pending capture: '+path.name,'small')]
    with PILImage.open(path) as im:w,h=im.size
    scale=min(W/w,maxheight/h)
    return [KeepTogether([p(caption,'small'),Image(str(path),width=w*scale,height=h*scale,hAlign='LEFT'),Spacer(1,9)])]

def special(token,pages):
    if token=='NAV':
        labels={'A':'SRS; FR01-19 / BR01-13 / NFR01-08','B':'F01-08 inventory and complete allocation','C':'Architecture/data/auth/UI/API/deployment plan','D':'Three-sprint goals/dependencies/outcomes','E':'F01-04 / AC / STS / Product DoD','F':'Demonstrations/results/history/contributions'}
        keys=list(labels);rows=[]
        for i,k in enumerate(keys):
            first=pages.get(k,'-');last=(pages.get(keys[i+1],0)-1) if i<5 and pages.get(keys[i+1]) else pages.get('END','-')
            rows.append((k,str(first)+'-'+str(last),labels[k]))
        return [table(['Part','Pages','Required content / IDs'],rows,[W*.1,W*.13,W*.77]),Spacer(1,7)]
    if token=='ARCH':return [arch()]
    if token=='ER':return [er()]
    if token=='RESULTS':
        a=read_json('artifacts/evidence/deliverable-1/api-results.json');b=read_json('artifacts/evidence/deliverable-1/browser-results.json')
        flows=[table(['Command','Actual result'],[
        ('npm test',f"{a['numPassedTests']} passed / {a['numFailedTests']} failed / {a['numPendingTests']} skipped; 8 test files"),
        ('npx playwright test --config playwright.member-b.config.ts',f"{b['stats']['expected']} passed / {b['stats']['unexpected']} failed / {b['stats']['skipped']} skipped; desktop+mobile"),
        ('npm run build','PASS: server/client typecheck and Vite production output'),
        ('npx tsx scripts/member-b-restart.ts','PASS: actual API process restart and persisted45/60=75%'),
        ('npm ci; migrate; seed twice','PASS:229 installed;0 vulnerabilities;3 users/2 templates after rerun')]),Spacer(1,8)]
        for filename in ['api-output.txt','browser-output.txt','build-output.txt','restart-output.txt']:
            lines=textfile('artifacts/evidence/deliverable-1/'+filename).splitlines()
            if filename=='api-output.txt':lines=[x for x in lines if 'Test Files' in x or 'Tests  ' in x or 'Duration ' in x or 'Start at' in x]
            elif filename=='browser-output.txt':lines=[x for x in lines if 'passed (' in x or 'failed' in x or 'skipped' in x or 'Running ' in x]
            elif filename=='build-output.txt':lines=[x for x in lines if 'build:' in x or 'tsc ' in x or 'built in ' in x or 'modules transformed' in x]
            flows += [p('Actual output excerpt: '+filename,'small'),code('\n'.join(lines))]
        return flows
    if token=='DEMONSTRATIONS':
        flows=[]
        demos=[('screenshots/manager-template.png','SC-01 / AC-F02-01/09: Manager, logged in; enter a reading template/range and save. Expected201 and persistent catalog item. Actual scripted flow created the template, then participant selected that same ID.'),('screenshots/goal-create.png','SC-02 / AC-F03-01/08: Participant/student1 selects the manager-created template, target60 and Bangkok today. Expected201 with own goal+initial target. Actual persisted goal created.'),('screenshots/entry-validation.png','SC-03 / AC-F04-05/11: Participant has own valid goal; enter0 minutes and submit. Expected visible bounds error with no accepted activity. Actual form rejected; later valid45-minute write succeeded.'),('screenshots/progress-retrieved.png','SC-04 / AC-F04-01/02/12: Participant records45 toward60, reloads. Expected saved45/60 and75%, same entry identity. Actual persisted API/DB retrieval matched; screenshot shows retrieved result.'),('screenshots/login-rejected.png','SC-05 / AC-F01-02/08: Anonymous submits synthetic wrong credentials. Expected generic rejection and no authenticated view. Actual invalid-login error visible.'),('screenshots/mobile-progress.png','SC-06 / NFR-06 / AC-F04-11: Same participant opens saved goal at390x844. Expected readable, no horizontal overflow, saved75%. Actual screenshot and geometry check passed.')]
        for path,caption in demos:flows+=image_flow('artifacts/evidence/deliverable-1/'+path,caption,360)
        results=read_json('artifacts/evidence/deliverable-1/demonstrations.json')
        flows += [p('Safe API/database screen dumps - expected and actual','h3'),table(['Scenario / role','Expected','Actual'],[(x['scenario'],str(x['expected']),str(x['actual'])) for x in results['checks']]),p('Sanitized retrieval response (no cookies or CSRF values)','small'),code(json.dumps(results['savedProgress'],indent=2))]
        return flows
    if token=='ACMAP':
        acs=actual_ac_tables();flows=[]
        (SRC/'ac-results.json').write_text(json.dumps(acs,indent=2,ensure_ascii=False),encoding='utf-8')
        for f in ['F01','F02','F03','F04']:
            flows.append(p(f+' acceptance results','h3'));rows=[]
            for row in acs:
                if '-'+f+'-' not in row['ac']:continue
                title,path=row['actual'][0]
                # Include a real selected full test title, not only a vague prefix.
                selected=title.split(' > ')[-1]
                if len(selected)>220:selected=selected[:217]+'...'
                files=sorted(set(x[1] for x in row['actual']))
                rows.append((row['ac']+' / PASS',row['planned'],selected+'; file(s): '+', '.join(files)))
            flows.append(table(['AC / result','Planned TEST IDs','Actual test name / file'],rows,[W*.16,W*.24,W*.6]))
        return flows
    if token=='TESTEXCERPTS':
        entries=textfile('server/tests/integration/entries.test.ts')
        start=entries.index('  it("TEST-F04-10:');end=entries.index('  it("TEST-F04-11:',start)
        goals=textfile('server/tests/integration/goals.test.ts');start2=goals.index('  it("TEST-F01-05 / TEST-F03-06:');end2=goals.index('    const manager =',start2)
        return [p('Domain invariant: two competing writes, exactly one row (TEST-F04-10)','h3'),code(entries[start:end]),p('Role/ownership: anonymous and cross-owner rejection (TEST-F01-05 / TEST-F03-06; selected beginning)','h3'),code(goals[start2:end2])]
    if token=='TDD':
        red=textfile('artifacts/evidence/member-a/red-output.txt');green=textfile('artifacts/evidence/member-a/green-initial-output.txt')
        r=[l for l in red.splitlines() if 'status' in l or '501' in l or 'not implemented' in l or 'Tests  ' in l or 'Test Files' in l]
        g=[l for l in green.splitlines() if 'Tests ' in l or 'Test Files' in l or 'Duration' in l]
        return [p('Actual retained red2fc6252 and initial greena13858f output','small'),code('\n'.join(r[-12:]+['--- GREEN a13858f ---']+g[-5:]))]
    if token=='HISTORY':
        history=read_json('artifacts/evidence/deliverable-1/github-history.json')
        rows=[]
        for item in history['pullRequests']:
            revs=item.get('reviews',[])
            description='; '.join(r['author']['login']+': '+r['state']+' on '+r['commit']['oid'][:7] for r in revs)
            rows.append(('#'+str(item['number'])+' '+item['title'],item['headRefName']+' -> '+item['baseRefName'],description+'; '+item['state']+'; merge '+((item.get('mergeCommit') or {}).get('oid','pending')[:12])))
        flows=[table(['PR / feature','Branch chain','Actual review / integration'],rows)]
        for item in history['pullRequests']:
            if item['number'] in [3,6,7,9]:
                for r in item.get('reviews',[]):
                    if r['state'] in ['CHANGES_REQUESTED','APPROVED']:
                        body=re.sub(r'\s+',' ',r.get('body',''))
                        flows.append(p('Actual review excerpt, PR'+str(item['number'])+', '+r['author']['login']+', '+r['state']+': '+body[:1050],'small'))
        log=history.get('contractHistory','')
        if log:flows += [p('Actual contract/TDD chronology (selected git log)','small'),code(log)]
        return flows
    if token=='BOARD':
        snap=read_json('artifacts/evidence/deliverable-1/github-history.json')
        rows=[(x.get('title',''),x.get('status',''),x.get('content',{}).get('url','')) for x in snap.get('board',{}).get('items',[])]
        return [p('Actual board snapshot; feature completion and final release are distinct','h3'),table(['Work item','Status','Reference'],rows)]
    raise ValueError(token)

def parse(md,pages):
    flows=[];lines=md.splitlines();i=0;firstpart=True
    while i<len(lines):
        line=lines[i].strip();i+=1
        if not line:continue
        match=re.fullmatch(r'\[\[([A-Z]+)\]\]',line)
        if match:flows+=special(match.group(1),pages);continue
        if line.startswith('```'):
            content=[]
            while i<len(lines) and not lines[i].strip().startswith('```'):content.append(lines[i]);i+=1
            i+=1;flows.append(code('\n'.join(content)));continue
        if line.startswith('|') and i<len(lines) and re.match(r'^\|[\s:|\-]+\|$',lines[i].strip()):
            head=[x.strip() for x in line.strip('|').split('|')];i+=1;rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                rows.append([x.strip() for x in lines[i].strip().strip('|').split('|')]);i+=1
            flows += [table(head,rows),Spacer(1,8)];continue
        m=re.match(r'^(#{1,3})\s+(.+)$',line)
        if m:
            level=len(m.group(1));title=m.group(2)
            part=re.match(r'Part ([A-F])\.',title)
            if part:
                if not firstpart:flows.append(PageBreak())
                firstpart=False;flows.append(PartHeading(title,part.group(1)))
            else:flows.append(p(title,'h'+str(level)))
            continue
        if line.startswith('- '):flows.append(p('• '+line[2:]));continue
        block=[line]
        while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|\[\[|- )',lines[i].strip()):block.append(lines[i].strip());i+=1
        flows.append(p(' '.join(block)))
    return flows

def main():
    OUT.parent.mkdir(parents=True,exist_ok=True);SRC.mkdir(parents=True,exist_ok=True)
    md=build_markdown();(SRC/'report-source.md').write_text(md,encoding='utf-8')
    pages={}
    for iteration in range(3):
        doc=Doc(OUT);doc.build(parse(md,pages));new={**doc.part_pages,'END':doc.page}
        if new==pages:break
        pages=new
    (SRC/'page-navigation.json').write_text(json.dumps(pages,indent=2),encoding='utf-8')
    print(json.dumps({'pdf':str(OUT),'pages':pages,'status':STATUS},indent=2))

if __name__=='__main__':main()
