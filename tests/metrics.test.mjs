import test from 'node:test';
import assert from 'node:assert/strict';
import {D1} from './fixtures/d1.mjs';
import {handleMetrics,maintainMetrics} from '../src/metrics-service.mjs';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const origin='https://nocturne.example';
const environment=()=>({DB:new D1(),SITE_ORIGIN:origin,METRIC_LIMIT:{limit:async()=>({success:true})}});
const body=()=>({session:crypto.randomUUID(),events:['visit','start_open'],source:'direct',device:'mobile'});
const req=(b,headers={})=>new Request(origin+'/api/metrics',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'X-Nocturne':'1',...headers},body:JSON.stringify(b)});
test('a browser measurement failure cannot prevent starting the diagnosis',async()=>{
 const source=(await readFile('src/metrics.mjs','utf8')).replace(/^import .*;$/m,'').replace(/export /g,'');
 let scheduled=0;
 const context=vm.createContext({eligibilityReady:()=>true,ensureEligibility:()=>{},navigator:{},Date,URL,innerWidth:390,location:{hostname:'example.invalid',pathname:'/'},document:{referrer:'',addEventListener(){}},sessionStorage:{getItem(){throw Error('Storage denied');}},crypto:{randomUUID(){throw Error('Unavailable in embedded browser');}},setTimeout(){scheduled++;},clearTimeout(){}});
 vm.runInContext(source,context);
 assert.doesNotThrow(()=>vm.runInContext("measure('quiz_start')",context));
 assert.equal(scheduled,0);
});
test('anonymous counts deduplicate repeated events and retries within a tab session',async()=>{
 const e=environment(),b=body(),now=Date.now();
 assert.equal((await handleMetrics(req(b),e,now)).status,200);
 await handleMetrics(req(b),e,now);
 await handleMetrics(req({...b,events:['quiz_start','quiz_start']}),e,now);
 const rows=(await e.DB.prepare('SELECT event,SUM(n) n FROM nocturne_metric_daily GROUP BY event').all()).results;
 assert.deepEqual(Object.fromEntries(rows.map(r=>[r.event,r.n])),{quiz_start:1,start_open:1,visit:1});
 const stored=await e.DB.prepare('SELECT * FROM nocturne_metric_events LIMIT 1').first();
 assert.notEqual(stored.session,b.session);assert.deepEqual(Object.keys(stored).sort(),['created_at','event','session']);
 assert.equal(await e.DB.prepare('SELECT SUM(n) n FROM nocturne_metric_quota').first('n'),3);
});
test('measurement rejects injected personal fields, arbitrary events, cross-origin writes and missing rate guards',async()=>{
 const e=environment(),b=body();
 for(const change of [{age:'20-24'},{answers:[1]},{url:'/s/private'},{events:['anything']},{source:'https://example.com/?private=1'},{events:[]}])assert.equal((await handleMetrics(req({...b,...change}),e)).status,400);
 assert.equal((await handleMetrics(req(b,{Origin:'https://evil.example'}),e)).status,403);
 assert.equal((await handleMetrics(req(b,{'X-Nocturne':'bad'}),e)).status,403);
 assert.equal((await handleMetrics(req(b),{...e,METRIC_LIMIT:null})).status,503);
 assert.equal((await handleMetrics(req(b),{...e,METRIC_LIMIT:{limit:async()=>({success:false})}})).status,429);
 assert.equal((await handleMetrics(req(b,{'DNT':'1'}),e)).status,200);
 assert.equal((await handleMetrics(req(b,{'Sec-GPC':'1'}),e)).status,200);
 assert.equal(await e.DB.prepare('SELECT COUNT(*) n FROM nocturne_metric_events').first('n'),0);
 assert.equal((await handleMetrics(req({ ...b,session:'x'.repeat(2000)}),e)).status,400);
});
test('daily cap is atomic and separate from answering quotas; short-lived deduplication is erased while aggregates remain',async()=>{
 const e=environment(),now=Date.now();await e.DB.prepare("INSERT INTO nocturne_metric_quota VALUES(date('now'),19999)").run();
 assert.equal((await handleMetrics(req(body()),e,now)).status,429);
 assert.equal(await e.DB.prepare('SELECT COUNT(*) n FROM nocturne_metric_events').first('n'),0);
 assert.equal(await e.DB.prepare('SELECT SUM(n) n FROM nocturne_metric_quota').first('n'),19999);
 const b=body();b.events=['visit'];await handleMetrics(req(b),e,now);
 assert.equal(await e.DB.prepare('SELECT COUNT(*) n FROM nocturne_quota').first('n'),0);
 await maintainMetrics(e,now+3*86400000);
 assert.equal(await e.DB.prepare('SELECT COUNT(*) n FROM nocturne_metric_events').first('n'),0);
 assert.equal(await e.DB.prepare('SELECT SUM(n) n FROM nocturne_metric_daily').first('n'),1);
});

test('browser cleanup drops queued events and a pending response cannot restore the measurement session',async()=>{
 const source=(await readFile('src/metrics.mjs','utf8')).replace(/^import .*;$/m,'').replace(/export /g,'');const values=new Map();let done,calls=0;
 const context=vm.createContext({eligibilityReady:()=>true,ensureEligibility:()=>{},navigator:{},Date,URL,innerWidth:390,location:{hostname:'example.invalid',pathname:'/'},document:{referrer:'',addEventListener(){}},sessionStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},crypto,setTimeout(){return 1;},clearTimeout(){},fetch:()=>{calls++;return new Promise(resolve=>{done=resolve;});}});
 vm.runInContext(source,context);context.measure('quiz_start');const pending=context.flush();assert.equal(calls,1);context.measure('quiz_complete');context.clearBrowserMeasurements();done({ok:true});await pending;await context.flush();assert.equal(calls,1);assert.equal(values.has('nocturne_metrics'),false);
});
