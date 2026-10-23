const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {validateAffiliateConfig} = require('../src/affiliate-config.mjs');
const {DELIVERY_CONTROL_KEY} = require('../src/affiliate-service.mjs');
const root = path.resolve(__dirname, '..');
const evidenceBucket=JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8')).r2_buckets.find(binding=>binding.binding==='EVIDENCE')?.bucket_name;
if(!evidenceBucket)throw Error('Evidence bucket binding is required.');
const [action, destination = '--local', ...extra] = process.argv.slice(2);
if (!['status','stop','start'].includes(action) || !['--local','--remote'].includes(destination) || extra.length) {
  console.error('Usage: node scripts/affiliate-control.cjs status|stop|start [--local|--remote]');
  process.exit(2);
}
if (action === 'start' && !validateAffiliateConfig(JSON.parse(fs.readFileSync(path.join(root,'config/monetization.json'),'utf8'))).length) {
  console.error('Approved media, a completed publication review, and an active generated link are required before starting delivery.');
  process.exit(2);
}
const run = (args, input) => spawnSync(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),...args],{cwd:root,stdio:['pipe','inherit','inherit'],shell:false,...(input?{input}:{})}).status === 0;
if (action === 'status') {
  console.log('Delivery requires both D1 and R2 to be enabled; a missing R2 control means stopped.');
  const db=run(['d1','execute','DB',destination,'--command',"SELECT name,enabled,updated_at FROM nocturne_delivery_controls WHERE name='affiliate'"]);
  const r2=run(['r2','object','get',evidenceBucket+'/'+DELIVERY_CONTROL_KEY,destination,'--pipe']);
  process.exit(db&&r2?0:1);
}
const now=Date.now(),enabled=action==='start';
const sql=`INSERT INTO nocturne_delivery_controls(name,enabled,updated_at) VALUES('affiliate',${enabled?1:0},${now}) ON CONFLICT(name) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at`;
const database=()=>run(['d1','execute','DB',destination,'--command',sql]);
const durable=()=>run(['r2','object','put',evidenceBucket+'/'+DELIVERY_CONTROL_KEY,destination,'--pipe','--content-type','application/json'],JSON.stringify({v:1,enabled,updatedAt:now}));
// Stop outside D1 first, so a later database restore cannot silently re-enable ads.
let ok;if(enabled){ok=database()&&durable();}else{const r2=durable();const db=database();ok=r2&&db;}
if(!ok)console.error('Control update is incomplete. Do not treat delivery as safely restarted or durably stopped until both stores confirm.');
process.exit(ok?0:1);
