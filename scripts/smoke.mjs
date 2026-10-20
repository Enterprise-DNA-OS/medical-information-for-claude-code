import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,readdirSync} from 'node:fs';
import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';import {migrate} from './migrate.mjs';
import {run,COMMANDS,READS,TABLES} from './lib/medical.mjs';import {parseCsv} from './lib/csv.mjs';
const temp=mkdtempSync(path.join(os.tmpdir(),'medical-test-'));
process.env.DATA_DIR=path.join(temp,'db');process.env.OUTPUT_DIR=temp;
// The CI URL must identify a disposable database. Never fall back to a business DATABASE_URL.
if(process.env.TEST_DATABASE_URL)process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;else process.env.DATABASE_URL='';
const db=await getDb();const covered=new Set();let assertions=0;
async function call(cmd,args=[],o={}){covered.add(cmd);return run(db,cmd,args,o);}
async function fails(cmd,args,o,pattern){await assert.rejects(()=>call(cmd,args,o),pattern);assertions++;}
function child(script,args=[],status=0){const p=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts',script),...args],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(p.status,status,p.stderr||p.stdout);assertions++;return p.stdout;}
const a={actor:'Operator'},future='2099-01-01';
try{
 assert.equal((await migrate(db)).ran.length,1);assert.equal((await migrate(db)).ran.length,0);
 const seed=readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8');await db.exec(seed);await db.exec(seed);
 assert.equal((await db.query('select * from inquiries')).length,6);
 for(const cmd of Object.keys(READS))assert.ok(Array.isArray(await call(cmd)));
 assert.equal((await call('insights')).length,10);
 assert.equal((await call('inquiry',['30000000-0000-4000-8000-000000000001'])).subject,'Approved document request');
 const p=await call('add-product',[],{...a,name:'Test Product'});
 await fails('add-product',[],{...a,name:'test product'},/unique/);
 const s=await call('add-source',[],{...a,product:p.id,title:'Controlled source',version:'v1',reference:'controlled://source',approver:'Reviewer',evidence:'approval://1','valid-until':future});
 const opts={...a,product:p.id,subject:'Test request',requester:'hcp-test',evidence:'request://test',owner:'Operator',kind:'medical',received:'2026-01-01',due:'2026-01-02',retention:future};
 const i=await call('add-inquiry',[],opts);
 await fails('add-inquiry',[],{...opts,due:'2026-02-30'},/Invalid ISO/);
 await fails('add-inquiry',[],{...opts,due:'2025-01-01'},/check constraint/);
 await fails('add-inquiry',[],{...opts,kind:'clinical'},/kind must/);
 await call('assign',[i.id],{...a,owner:'Coordinator'});
 await call('log',[i.id],{...a,reference:'followup://1'});
 await fails('close',[i.id],{...a,evidence:'closed://1'},/Reviewed/);
 await fails('record-response',[i.id],{...a,evidence:'sent://1'},/Ready/);
 await fails('submit-review',[i.id],{...a,source:'20000000-0000-4000-8000-000000000001',response:'controlled://reply'},/does not match/);
 const rev=await call('submit-review',[i.id],{...a,source:s.id,response:'controlled://reply'});
 await fails('approve-review',[rev.id],{...a,decision:'approved',evidence:'review://1'},/Independent/);
 await call('approve-review',[rev.id],{actor:'Reviewer',decision:'rejected',evidence:'review://reject'});
 const rev2=await call('submit-review',[i.id],{...a,source:s.id,response:'controlled://reply-v2'});
 await call('approve-review',[rev2.id],{actor:'Reviewer',decision:'approved',evidence:'review://2'});
 await call('record-response',[i.id],{...a,evidence:'delivery://1'});
 await fails('record-response',[i.id],{...a,evidence:'delivery://duplicate'},/Ready/);
 await call('close',[i.id],{...a,evidence:'close://1'});
 await fails('assign',[i.id],{...a,owner:'Other'},/not active/);
 const safety=await call('add-inquiry',[],{...opts,subject:'Specialist request',kind:'safety'});
 await fails('submit-review',[safety.id],{...a,source:s.id,response:'controlled://unsafe'},/Specialist/);
 await fails('close',[safety.id],{...a,evidence:'closed://unsafe'},/Acknowledged/);
 const h=await call('escalate',[safety.id],{...a,team:'Safety team',reference:'safety://case-1'});
 await call('acknowledge-handoff',[h.id],{actor:'Safety specialist',evidence:'receipt://case-1'});
 await call('close',[safety.id],{...a,evidence:'admin-close://1'});
 // Source withdrawal invalidates an already approved response.
 const i2=await call('add-inquiry',[],{...opts,subject:'Withdrawal check'});
 const r2=await call('submit-review',[i2.id],{...a,source:s.id,response:'controlled://reply-3'});
 await call('approve-review',[r2.id],{actor:'Reviewer',decision:'approved',evidence:'review://3'});
 await call('withdraw-source',[s.id],{...a,evidence:'withdrawal://1'});
 await fails('record-response',[i2.id],{...a,evidence:'delivery://bad'},/expired or withdrawn/);
 assert.ok((await call('compliance')).some(x=>x.id===i2.id&&x.rule==='SOURCE'));
 await call('revise-response',[i2.id],{...a,evidence:'revision://source-withdrawn'});
 const current=await call('add-source',[],{...a,product:p.id,title:'Controlled source',version:'v2',reference:'controlled://source-v2',approver:'Reviewer',evidence:'approval://2','valid-until':future});
 const replacement=await call('submit-review',[i2.id],{...a,source:current.id,response:'controlled://revised'});
 await call('approve-review',[replacement.id],{actor:'Reviewer',decision:'approved',evidence:'review://replacement'});
 await call('record-response',[i2.id],{...a,evidence:'delivery://replacement'});
 await fails('revise-response',[i2.id],{...a,evidence:'invalid'},/undelivered/);

 await fails('submit-review',['30000000-0000-4000-8000-000000000001'],{...a,source:'20000000-0000-4000-8000-000000000002',response:'bad'},/expired/);
 // Case-insensitive exact names and ambiguous partial IDs.
 assert.equal((await call('inquiry',['WITHDRAWAL CHECK'])).id,i2.id);
 await fails('inquiry',['30000000'],{},/Ambiguous/);
 const csv=path.join(REPO_ROOT,'tests/fixtures/salesforce.csv');
 assert.equal((await call('import',['salesforce',csv],{...a,'dry-run':true})).inserted,2);
 assert.equal((await db.query('select * from inquiries where external_id is not null')).length,0);
 assert.equal((await call('import',['salesforce',csv],a)).inserted,2);
 assert.equal((await call('import',['salesforce',csv],a)).skipped,2);
 const [imported]=await db.query("select * from inquiries where external_id='SF-DEMO-001'");assert.equal(imported.state,'imported');assert.equal(imported.source_status,'Closed');
 await fails('close',[imported.id],{...a,evidence:'invalid'},/not active/);
 await call('activate',[imported.id],{...a,owner:'Operator',evidence:'reconciled://1',due:future,retention:future});
 assert.equal((await call('import',['salesforce',csv],a)).skipped,2);
 assert.equal((await call('inquiry',[imported.id])).state,'open');
 // A changed record rolls back an earlier new product and record in the same import.
 const text=readFileSync(csv,'utf8'),lines=text.trim().split('\n');
 const bad=path.join(temp,'bad.csv');writeFileSync(bad,[lines[0],lines[1].replace('SF-DEMO-001','SF-NEW').replace('Demo Product Alpha','Rollback Product'),lines[2].replace('Specialist callback','Changed callback')].join('\n'));
 await fails('import',['salesforce',bad],a,/Changed import/);
 assert.equal((await db.query("select * from products where name='Rollback Product'")).length,0);
 const malformed=path.join(temp,'malformed.csv');writeFileSync(malformed,text.replace('2026-10-08','2026-02-31'));
 await fails('import',['salesforce',malformed],a,/Invalid ISO/);
 await fails('import',['salesforce',csv],{...a,dryrun:true},/Unknown flag/);
 await fails('import',['salesforce',csv],{...a,'dry-run':'false'},/takes no value/);
 assert.equal(parseCsv('\ufeffA,B\r\n"one\ntwo","a""b"\r\n')[0].B,'a"b');
 assert.throws(()=>parseCsv('A,A\n1,2'),/unique/);assert.throws(()=>parseCsv('A,B\n"bad,2'),/unclosed/);
 const file=path.join(temp,'export.json');const exported=await call('export',[],{file});assert.equal(Object.keys(exported.counts).length,TABLES.length);
 const saved=JSON.parse(readFileSync(file,'utf8'));for(const t of TABLES)assert.equal(saved[t].length,(await db.query(`select * from ${t}`)).length);
 assert.ok(readFileSync((await call('weekly-review')).file,'utf8').includes('compliance'));
 assert.ok(readFileSync((await call('draft-response',[i.id])).file,'utf8').includes('No medical answer'));
 // Escape untrusted labels in HTML documents.
 await db.query('update inquiries set subject=$1 where id=$2',['<script>alert(1)</script>',i.id]);
 assert.deepEqual(COMMANDS.filter(c=>!covered.has(c)),[]);
 await db.close();
 // Child processes exercise the entry points after the embedded database lock is released.
 const human=child('medical.mjs',['attention']);assert.ok(human.includes('subject'));
 const machine=JSON.parse(child('medical.mjs',['products','--json']));assert.ok(machine.some(x=>x.name==='Test Product'));
 const ambiguous=JSON.parse(child('medical.mjs',['inquiry','30000000','--json'],1));assert.match(ambiguous.error,/Ambiguous/);
 child('medical.mjs',['--help']);child('medical.mjs',['unknown'],1);
 child('view.mjs');child('docs.mjs');
 assert.equal(readdirSync(path.join(temp,'views')).length,3);
 const docs=readdirSync(path.join(temp,'docs-out','request-cover')).map(f=>readFileSync(path.join(temp,'docs-out','request-cover',f),'utf8')).join('\n');
 assert.ok(docs.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!docs.includes('<script>alert(1)</script>'));
 console.log(`PASS: ${covered.size} commands; migrations, seed, workflow gates, import rollback/idempotence, exports, drafts, HTML and CLI checks (${assertions} subprocess/negative checks).`);
}catch(e){try{await db.close();}catch{}throw e;}finally{rmSync(temp,{recursive:true,force:true});}
