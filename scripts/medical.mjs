import {getDb} from './lib/db.mjs';
import {run,COMMANDS} from './lib/medical.mjs';
const args=[],o={};
for(const token of process.argv.slice(2)){if(token.startsWith('--')){const at=token.indexOf('=');const k=token.slice(2,at<0?undefined:at);if(Object.hasOwn(o,k))throw Error(`Duplicate flag: ${k}`);o[k]=at<0?true:token.slice(at+1);}else args.push(token);}
function cell(x){return x===null||x===undefined?'':typeof x==='object'?JSON.stringify(x):String(x);}
function output(v){
 if(Array.isArray(v)){
  if(!v.length){console.log('(none)');return;}
  if(v[0].question){for(const q of v){console.log('\n'+q.question);output(q.rows);}return;}
  const keys=Object.keys(v[0]);const widths=keys.map(k=>Math.min(64,Math.max(k.length,...v.map(r=>cell(r[k]).length))));
  console.log(keys.map((k,i)=>k.replaceAll('_',' ').padEnd(widths[i])).join('  '));console.log(widths.map(w=>'-'.repeat(w)).join('  '));
  for(const r of v)console.log(keys.map((k,i)=>cell(r[k]).replace(/\n/g,' ').slice(0,widths[i]).padEnd(widths[i])).join('  '));
 }else console.log(JSON.stringify(v,null,2));
}
if(o.help||!args.length){console.log('Medical information administrative desk. No medical answers or sends.\nCommands: '+COMMANDS.join(', ')+'\nFlags use --name=value. See docs/cli.md.');}
else{
 const db=await getDb();try{const result=await run(db,args.shift(),args,o);if(o.json)console.log(JSON.stringify(result,null,2));else output(result);}catch(e){if(o.json)console.log(JSON.stringify({error:e.message}));else console.error(e.message);process.exitCode=1;}finally{await db.close();}
}
