import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {REPO_ROOT} from './db.mjs';
import {parseCsv,pick} from './csv.mjs';
export const TABLES=['products','sources','inquiries','reviews','handoffs','events'];
export const READS={
 products:'select * from products order by name',
 sources:'select s.*,p.name as product from sources s join products p on p.id=s.product_id order by p.name,s.title,s.version',
 inquiries:'select * from inquiry_desk order by received_on,id',
 triage:"select * from inquiry_desk where state='open' order by case when kind='medical' then 1 else 0 end,due_on,id",
 'due-replies':'select subject,product,owner,due_on,days_late from due_replies order by due_on,id',
 'source-review':'select * from source_review order by valid_until,id',
 escalations:'select * from escalation_desk order by subject,handoff_id',
 attention:'select * from attention order by subject,reason',
 compliance:'select * from compliance_findings order by subject,rule',
 'retention-review':'select id,subject,owner,state,retention_on from inquiry_desk where retention_on<=current_date order by retention_on,id',
 activity:'select * from events order by created_at,id'
};
export const QUESTIONS=[
 ['Which owners have overdue medical replies?',"select owner,count(*) as overdue from due_replies where days_late>0 group by owner order by owner"],
 ['Which products have unanswered requests with missing request evidence?',"select product,count(*) as missing from inquiry_desk where request_evidence='' and state<>'closed' group by product order by product"],
 ['Which source versions expire in the next month with linked requests?',"select product,title,version,valid_until,linked_inquiries from source_review where not withdrawn and valid_until>=current_date order by product,title"],
 ['Which approved replies refer to an expired or withdrawn source?',"select subject,issue from compliance_findings where rule='SOURCE' order by subject"],
 ['Which specialist handoffs still lack an acknowledgement?',"select subject,kind,team,reference from escalation_desk where acknowledged_by is null order by subject"],
 ['Which products generate both medical and specialist work?',"select product,count(*) as requests,count(distinct kind) as kinds from inquiry_desk group by product having count(distinct kind)>1 order by product"],
 ['Which closed records have reached their retention review date?',"select subject,owner,retention_on from inquiry_desk where state='closed' and retention_on<=current_date order by retention_on"],
 ['Which requests are ready but have no recorded response?',"select subject,owner,due_on from inquiry_desk where state='ready' and response_ref is null order by due_on"],
 ['How much imported history awaits reconciliation by source status?',"select coalesce(source_status,'Unknown') as source_status,count(*) as requests from inquiries where state='imported' group by source_status order by source_status"],
 ['Which owners carry work across more than one product?',"select owner,count(distinct product) as products,count(*) as requests from inquiry_desk where state<>'closed' group by owner having count(distinct product)>1 order by owner"]
];
export const COMMANDS=[...Object.keys(READS),'inquiry','insights','add-product','add-source','withdraw-source','add-inquiry','assign','activate','submit-review','approve-review','record-response','revise-response','escalate','acknowledge-handoff','close','log','import','export','weekly-review','draft-response'];
export function req(o,k){const v=o[k];if(typeof v!=='string'||!v.trim())throw Error(`--${k} is required`);return v.trim();}
export function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid ISO date: ${v}`);return v;}
const today=()=>new Date().toISOString().slice(0,10);
const kind=(v)=>{v=String(v).trim().toLowerCase();if(!['medical','safety','quality'].includes(v))throw Error('kind must be medical, safety or quality');return v;};
export async function resolve(db,table,term,label='subject'){
 if(!TABLES.includes(table))throw Error('Unknown record type');
 if(!term)throw Error(`${table} reference required`);
 const columns=table==='products'?'name':table==='sources'?'title':table==='inquiries'?'subject':'id::text';
 const rows=await db.query(`select * from ${table} where id::text like $1 or lower(${columns})=lower($2) order by id`,[String(term)+'%',String(term)]);
 if(rows.length!==1)throw Error(`${rows.length?'Ambiguous':'No matching'} ${table}: ${term}\n${rows.map(r=>`${r.id} ${r[label]||r.name||r.title||''}`).join('\n')}`);
 return rows[0];
}
async function event(db,id,action,actor,reference){await db.query('insert into events(inquiry_id,action,actor,reference) values($1,$2,$3,$4)',[id,action,actor,reference]);}
export async function transaction(db,fn){await db.exec('BEGIN');try{const r=await fn();await db.exec('COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function active(db,term){const found=await resolve(db,'inquiries',term);const [i]=await db.query('select * from inquiries where id=$1 for update',[found.id]);if(['closed','imported'].includes(i.state))throw Error('Closed or imported inquiry is not active');return i;}
async function validSource(db,sourceId,productId){const found=await resolve(db,'sources',sourceId);const [s]=await db.query('select * from sources where id=$1 for share',[found.id]);if(s.product_id!==productId)throw Error('Source product does not match inquiry');if(s.withdrawn||String(s.valid_until)<today())throw Error('Source expired or withdrawn');return s;}
function writeLocal(file,data){file=path.resolve(file);mkdirSync(path.dirname(file),{recursive:true,mode:0o700});writeFileSync(file,data,{mode:0o600});return file;}
const FLAGS={
 'add-product':['name'],'add-source':['product','title','version','reference','approver','evidence','valid-until'],
 'withdraw-source':['evidence'],'add-inquiry':['product','subject','requester','evidence','owner','kind','received','due','retention'],
 assign:['owner'],activate:['owner','evidence','due','retention'],'submit-review':['source','response'],
 'approve-review':['decision','evidence'],'record-response':['evidence'],'revise-response':['evidence'],escalate:['team','reference'],
 'acknowledge-handoff':['evidence'],close:['evidence'],log:['reference'],import:['map','dry-run'],export:['file']
};
export async function run(db,cmd,args=[],o={}){
 for(const k of Object.keys(o))if(!['json','actor',...(FLAGS[cmd]||[])].includes(k))throw Error(`Unknown flag --${k} for ${cmd}`);
 if(o['dry-run']!==undefined&&o['dry-run']!==true)throw Error('--dry-run takes no value');

 if(READS[cmd])return db.query(READS[cmd]);
 if(cmd==='insights'){const result=[];for(const [question,sql] of QUESTIONS)result.push({question,rows:await db.query(sql)});return result;}
 if(cmd==='inquiry'){const i=await resolve(db,'inquiries',args[0]);return {...i,reviews:await db.query('select * from reviews where inquiry_id=$1 order by created_at,id',[i.id]),handoffs:await db.query('select * from handoffs where inquiry_id=$1 order by created_at,id',[i.id]),events:await db.query('select * from events where inquiry_id=$1 order by created_at,id',[i.id])};}
 if(cmd==='export'){const out={format:'medical-information-v1',exported_at:new Date().toISOString()};await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of TABLES)out[t]=await db.query(`select * from ${t} order by id`);}finally{await db.exec('ROLLBACK');}return {file:writeLocal(req(o,'file'),JSON.stringify(out,null,2)+'\n'),counts:Object.fromEntries(TABLES.map(t=>[t,out[t].length]))};}
 if(cmd==='import')return importSalesforce(db,args,o);
 if(cmd==='weekly-review'){
  const sections=[];for(const c of ['due-replies','attention','compliance'])sections.push(`## ${c}\n\n${JSON.stringify(await run(db,c),null,2)}`);
  return {file:writeLocal(path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts','weekly-review.md'),'# Medical desk weekly review\n\nFictional data if demo was seeded. Internal working copy.\n\n'+sections.join('\n\n'))};
 }
 if(cmd==='draft-response'){
  const i=await run(db,'inquiry',args,o);
  return {file:writeLocal(path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts',`response-cover-${i.id}.md`),`# Response cover sheet: internal draft\n\nRequest: ${i.id}\nSubject: ${i.subject}\nOwner: ${i.owner}\nStatus: ${i.state}\n\nNo medical answer is generated. A qualified medical reviewer prepares the answer in the controlled document system. Verify source validity and review evidence before recording a response.\n\n${JSON.stringify(i.reviews,null,2)}\n`)};
 }
 if(!COMMANDS.includes(cmd))throw Error(`Unknown command: ${cmd}`);
 return transaction(db,async()=>{
  const actor=req(o,'actor');
  if(cmd==='add-product'){const [p]=await db.query('insert into products(name) values($1) returning *',[req(o,'name')]);await event(db,null,'add-product',actor,p.id);return p;}
  if(cmd==='add-source'){
   const p=await resolve(db,'products',req(o,'product'));const until=date(req(o,'valid-until'));if(until<today())throw Error('New source must be current');
   const [s]=await db.query('insert into sources(product_id,title,version,reference,approver,approval_evidence,valid_until) values($1,$2,$3,$4,$5,$6,$7) returning *',[p.id,req(o,'title'),req(o,'version'),req(o,'reference'),req(o,'approver'),req(o,'evidence'),until]);await event(db,null,'add-source',actor,s.id);return s;
  }
  if(cmd==='withdraw-source'){const s=await resolve(db,'sources',args[0]);const evidence=req(o,'evidence');const [v]=await db.query('update sources set withdrawn=true where id=$1 returning *',[s.id]);await event(db,null,'withdraw-source',actor,`${s.id} ${evidence}`);return v;}
  if(cmd==='add-inquiry'){
   const p=await resolve(db,'products',req(o,'product'));const received=date(o.received||today()),due=date(req(o,'due')),retention=date(req(o,'retention'));
   const [i]=await db.query('insert into inquiries(product_id,subject,requester_ref,request_evidence,owner,kind,received_on,due_on,retention_on) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',[p.id,req(o,'subject'),req(o,'requester'),req(o,'evidence'),req(o,'owner'),kind(req(o,'kind')),received,due,retention]);await event(db,i.id,cmd,actor,i.request_evidence);return i;
  }
  if(cmd==='approve-review'){
   const r=await resolve(db,'reviews',args[0]);const i=await active(db,r.inquiry_id);if(r.decision!=='pending'||i.state!=='review')throw Error('Review is not pending');
   if(actor.toLowerCase()===r.preparer.toLowerCase())throw Error('Independent reviewer required');
   const decision=req(o,'decision');if(!['approved','rejected'].includes(decision))throw Error('decision must be approved or rejected');
   if(decision==='approved')await validSource(db,r.source_id,i.product_id);
   const evidence=req(o,'evidence');const [v]=await db.query('update reviews set decision=$1,reviewer=$2,evidence=$3 where id=$4 returning *',[decision,actor,evidence,r.id]);
   await db.query('update inquiries set state=$1 where id=$2',[decision==='approved'?'ready':'open',i.id]);await event(db,i.id,cmd,actor,evidence);return v;
  }
  if(cmd==='acknowledge-handoff'){
   const h=await resolve(db,'handoffs',args[0]);await active(db,h.inquiry_id);if(h.acknowledged_at)throw Error('Handoff already acknowledged');const ref=req(o,'evidence');
   const [v]=await db.query('update handoffs set acknowledged_by=$1,acknowledgement_ref=$2,acknowledged_at=now() where id=$3 returning *',[actor,ref,h.id]);await event(db,h.inquiry_id,cmd,actor,ref);return v;
  }
  if(cmd==='activate'){
   const i=await resolve(db,'inquiries',args[0]);if(i.state!=='imported')throw Error('Only imported history can be activated');
   const [v]=await db.query("update inquiries set state='open',owner=$1,request_evidence=$2,due_on=$3,retention_on=$4 where id=$5 returning *",[req(o,'owner'),req(o,'evidence'),date(req(o,'due')),date(req(o,'retention')),i.id]);await event(db,i.id,cmd,actor,v.request_evidence);return v;
  }
  const i=await active(db,args[0]);
  if(cmd==='assign'){const [v]=await db.query('update inquiries set owner=$1 where id=$2 returning *',[req(o,'owner'),i.id]);await event(db,i.id,cmd,actor,v.owner);return v;}
  if(cmd==='log'){const reference=req(o,'reference');await event(db,i.id,'follow-up',actor,reference);return {id:i.id,logged:true};}
  if(cmd==='submit-review'){
   if(i.kind!=='medical')throw Error('Specialist requests must use the handoff workflow');if(i.state!=='open')throw Error('Inquiry must be open for review');if(!i.request_evidence)throw Error('Request evidence required');
   const s=await validSource(db,req(o,'source'),i.product_id);
   const [v]=await db.query('insert into reviews(inquiry_id,source_id,preparer,response_ref) values($1,$2,$3,$4) returning *',[i.id,s.id,actor,req(o,'response')]);await db.query("update inquiries set state='review' where id=$1",[i.id]);await event(db,i.id,cmd,actor,v.id);return v;
  }
  if(cmd==='revise-response'){
   if(i.kind!=='medical'||i.state!=='ready'||i.response_ref)throw Error('Only an undelivered ready response can be revised');
   const evidence=req(o,'evidence');const [v]=await db.query("update inquiries set state='open' where id=$1 returning *",[i.id]);await event(db,i.id,cmd,actor,evidence);return v;
  }
  if(cmd==='record-response'){
   if(i.kind!=='medical'||i.state!=='ready'||i.response_ref)throw Error('Ready medical inquiry without a recorded response required');
   const rows=await db.query("select * from reviews where inquiry_id=$1 and decision='approved' order by created_at desc,id desc limit 1",[i.id]);if(!rows.length)throw Error('Approved review required');await validSource(db,rows[0].source_id,i.product_id);
   const ref=req(o,'evidence');const [v]=await db.query('update inquiries set response_ref=$1,response_on=current_date where id=$2 returning *',[ref,i.id]);await event(db,i.id,cmd,actor,ref);return v;
  }
  if(cmd==='escalate'){
   if(i.kind==='medical')throw Error('Use a separately classified safety or quality request for specialist handoff');
   const [v]=await db.query('insert into handoffs(inquiry_id,team,reference,actor) values($1,$2,$3,$4) returning *',[i.id,req(o,'team'),req(o,'reference'),actor]);await event(db,i.id,cmd,actor,v.id);return v;
  }
  if(cmd==='close'){
   if(i.kind==='medical'){
    if(i.state!=='ready'||!i.response_ref)throw Error('Reviewed and recorded response required');
    const [r]=await db.query("select * from reviews where inquiry_id=$1 and decision='approved' order by created_at desc,id desc limit 1",[i.id]);if(!r)throw Error('Approved review required');await validSource(db,r.source_id,i.product_id);
   }else{
    const [h]=await db.query('select * from handoffs where inquiry_id=$1 and acknowledged_at is not null',[i.id]);if(!h)throw Error('Acknowledged specialist handoff required');
    const [n]=await db.query('select count(*) as n from handoffs where inquiry_id=$1 and acknowledged_at is null',[i.id]);if(Number(n.n))throw Error('Outstanding handoffs must be acknowledged');
   }
   const evidence=req(o,'evidence');const [v]=await db.query("update inquiries set state='closed' where id=$1 returning *",[i.id]);await event(db,i.id,cmd,actor,evidence);return v;
  }
  throw Error(`Unimplemented command: ${cmd}`);
 });
}
export const IMPORT_COLUMNS={external_id:'Inquiry ID',subject:'Subject',product:'Product',owner:'Owner',kind:'Request Type',received:'Created Date',due:'Due Date',retention:'Retention Review Date',requester:'Requester Reference',evidence:'Request Evidence',status:'Status'};
async function importSalesforce(db,args,o){
 if(args[0]!=='salesforce'||!args[1])throw Error('import salesforce <report.csv> [--map=columns.json] [--dry-run] --actor=<operator>');
 const actor=req(o,'actor');const custom=o.map?JSON.parse(readFileSync(o.map,'utf8')):{};
 if(Object.keys(custom).some(k=>!Object.hasOwn(IMPORT_COLUMNS,k))||Object.values(custom).some(v=>typeof v!=='string'||!v.trim()))throw Error('Unknown or invalid import mapping');
 const mapping={...IMPORT_COLUMNS,...custom}, rows=parseCsv(readFileSync(args[1],'utf8'));
 if(!rows.length)throw Error('Import has no data rows');
 const seen=new Set(),prepared=[];
 for(const row of rows){const v={};for(const [k,col] of Object.entries(mapping))v[k]=pick(row,col).trim();
  for(const k of ['external_id','subject','product','owner','kind','received','due','retention','requester'])if(!v[k])throw Error(`Missing ${mapping[k]}`);
  if(seen.has(v.external_id))throw Error('Duplicate Inquiry ID in file');seen.add(v.external_id);
  v.kind=kind(v.kind);for(const k of ['received','due','retention'])v[k]=date(v[k]);
  if(v.due<v.received||v.retention<v.received)throw Error('Due and retention dates cannot precede receipt');
  prepared.push({...v,hash:createHash('sha256').update(JSON.stringify(v)).digest('hex')});
 }
 await db.exec('BEGIN');let inserted=0,skipped=0;
 try{
  for(const v of prepared){const [existing]=await db.query('select id,import_hash from inquiries where external_id=$1',[v.external_id]);
   if(existing){if(existing.import_hash!==v.hash)throw Error(`Changed import for ${v.external_id}; reconcile explicitly, no silent overwrite`);skipped++;continue;}
   let [p]=await db.query('select id from products where lower(name)=lower($1)',[v.product]);if(!p)[p]=await db.query('insert into products(name) values($1) returning id',[v.product]);
   const [i]=await db.query("insert into inquiries(external_id,import_hash,product_id,subject,requester_ref,request_evidence,owner,kind,state,source_status,received_on,due_on,retention_on) values($1,$2,$3,$4,$5,$6,$7,$8,'imported',$9,$10,$11,$12) returning id",[v.external_id,v.hash,p.id,v.subject,v.requester,v.evidence,v.owner,v.kind,v.status,v.received,v.due,v.retention]);
   await event(db,i.id,'import',actor,v.external_id);inserted++;
  }
  await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');
 }catch(e){await db.exec('ROLLBACK');throw e;}
 return {inserted,skipped,dry_run:Boolean(o['dry-run']),ignored_columns:Object.keys(rows[0]).filter(c=>!Object.values(mapping).some(x=>x.toLowerCase()===c.toLowerCase()))};
}
