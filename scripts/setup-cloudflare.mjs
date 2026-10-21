import fs from 'node:fs';
const base='https://api.cloudflare.com/client/v4/accounts/f1a9b8d47ffd7c8ff96a0546a71c6d2a';
async function api(path,method='GET',body){const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!j.success)throw Error(path+': '+j.errors?.map(e=>e.message).join(';'));return j.result;}
let db=(await api('/d1/database')).find(d=>d.name==='heki16-research');
if(!db)db=await api('/d1/database','POST',{name:'heki16-research',primary_location_hint:'apac'});
let buckets=await api('/r2/buckets');
if(!buckets.buckets.some(b=>b.name==='heki16-evidence'))await api('/r2/buckets','POST',{name:'heki16-evidence',locationHint:'apac'});
let widget=(await api('/challenges/widgets')).find(w=>w.name==='heki16-research');
try{
 widget=widget?await api('/challenges/widgets/'+widget.sitekey):await api('/challenges/widgets','POST',{name:'heki16-research',domains:['nocturne.ai-yu-me.com','nocturne.aiyume.workers.dev','heki16-pro.aiyume.workers.dev'],mode:'managed'});
 await api('/workers/scripts/nocturne/secrets','PUT',{name:'TURNSTILE_SECRET',type:'secret_text',text:widget.secret});
}catch{widget=null;console.log('Turnstile setup unavailable: research intake remains closed.');}
// No secrets are written to the repository or printed.
const c=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8'));
Object.assign(c,{main:'src/worker.mjs',limits:{cpu_ms:50},vars:{SITE_ORIGIN:'https://nocturne.ai-yu-me.com',LEGACY_SITE_ORIGIN:'https://nocturne.aiyume.workers.dev',RESEARCH_ENABLED:widget?'true':'false',RECOVERY_MODE:'off'},d1_databases:[{binding:'DB',database_name:'heki16-research',database_id:db.uuid,migrations_dir:'migrations'}],r2_buckets:[{binding:'EVIDENCE',bucket_name:'heki16-evidence'}],ratelimits:[{name:'API_LIMIT',namespace_id:'164651810',simple:{limit:10,period:60}},{name:'GLOBAL_LIMIT',namespace_id:'164651811',simple:{limit:120,period:60}}],triggers:{crons:['*/15 * * * *']}});
c.assets.run_worker_first=['/api/*'];c.assets.binding='ASSETS';
fs.writeFileSync('wrangler.jsonc',JSON.stringify(c,null,2)+'\n');
fs.writeFileSync('config/research.json',JSON.stringify({sitekey:widget?.sitekey||''},null,2)+'\n');
console.log(JSON.stringify({database:db.name,bucket:'heki16-evidence',widget:widget?.name||null,secretsConfigured:!!widget}));
