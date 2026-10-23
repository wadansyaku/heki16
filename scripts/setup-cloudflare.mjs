import fs from 'node:fs';
const base='https://api.cloudflare.com/client/v4/accounts/f1a9b8d47ffd7c8ff96a0546a71c6d2a';
const c=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8'));
const dbBinding=c.d1_databases?.find(item=>item.binding==='DB');
const databaseName=dbBinding?.database_name||'nocturne-research';
const bucketName=c.r2_buckets?.find(item=>item.binding==='EVIDENCE')?.bucket_name||'nocturne-evidence';
const configuredSitekey=JSON.parse(fs.readFileSync('config/research.json','utf8')).sitekey;
async function api(path,method='GET',body){const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!j.success)throw Error(path+': '+j.errors?.map(e=>e.message).join(';'));return j.result;}
let db=(await api('/d1/database')).find(d=>d.uuid===dbBinding?.database_id||d.name===databaseName);
if(!db)db=await api('/d1/database','POST',{name:databaseName,primary_location_hint:'apac'});
let buckets=await api('/r2/buckets');
if(!buckets.buckets.some(b=>b.name===bucketName))await api('/r2/buckets','POST',{name:bucketName,locationHint:'apac'});
let widget=(await api('/challenges/widgets')).find(w=>w.sitekey===configuredSitekey||w.name==='KUSEIRO');
try{
 widget=widget?await api('/challenges/widgets/'+widget.sitekey):await api('/challenges/widgets','POST',{name:'KUSEIRO',domains:['kuseiro.com','nocturne.aiyume.workers.dev','heki16-pro.aiyume.workers.dev'],mode:'managed'});
 await api('/workers/scripts/nocturne/secrets','PUT',{name:'TURNSTILE_SECRET',type:'secret_text',text:widget.secret});
}catch{widget=null;console.log('Turnstile setup unavailable: research intake remains closed.');}
// No secrets are written to the repository or printed.
Object.assign(c,{main:'src/worker.mjs',limits:{cpu_ms:50},vars:{SITE_ORIGIN:'https://kuseiro.com',LEGACY_SITE_ORIGIN:'https://nocturne.aiyume.workers.dev',RESEARCH_ENABLED:widget?'true':'false',RECOVERY_MODE:'off'},d1_databases:[{binding:'DB',database_name:db.name,database_id:db.uuid,migrations_dir:'migrations'}],r2_buckets:[{binding:'EVIDENCE',bucket_name:bucketName}],ratelimits:[{name:'API_LIMIT',namespace_id:'164651810',simple:{limit:10,period:60}},{name:'GLOBAL_LIMIT',namespace_id:'164651811',simple:{limit:120,period:60}}],triggers:{crons:['*/15 * * * *']}});
c.assets.run_worker_first=['/api/*'];c.assets.binding='ASSETS';
fs.writeFileSync('wrangler.jsonc',JSON.stringify(c,null,2)+'\n');
fs.writeFileSync('config/research.json',JSON.stringify({sitekey:widget?.sitekey||''},null,2)+'\n');
console.log(JSON.stringify({database:db.name,bucket:bucketName,widget:widget?.name||null,secretsConfigured:!!widget}));
