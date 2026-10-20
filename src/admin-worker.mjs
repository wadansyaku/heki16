import {adminIdentity} from './admin-auth.mjs';
import {adminHTML,adminCSS,adminJS} from './admin-ui.mjs';
import {aggregateUsage} from './nocturne-service.mjs';
import {INSTRUMENT,SCENES,FACETS,MOODS,AGES,GENDERS} from './nocturne.mjs';

const headers={
  'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
  'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};
const respond=(body,status=200,type='text/plain; charset=utf-8')=>new Response(body,{status,headers:{...headers,'Content-Type':type}});

export async function readAdminReport(env,now=Date.now()){
  // The owner sees aggregated, bounded database reads, never the raw answer rows.
  const rows=await env.DB.prepare('SELECT account_id,instrument,consent,answers,dwell,visited,cursor,timeframe,mood,age,gender,time_band,created_at,last_seen,completed_at,profile FROM nocturne_records WHERE created_at>=? AND instrument=? ORDER BY created_at DESC LIMIT 2000').bind(now-7*86400000,INSTRUMENT).all();
  const report=aggregateUsage(rows.results,now);
  return {...report,scenes:SCENES.map(q=>({id:q.id,text:q.text})),labels:{facets:Object.fromEntries(FACETS.map(f=>[f.id,f.label])),moods:MOODS,ages:AGES,genders:GENDERS},sampleLimit:2000};
}

export default {
  async fetch(request,env,ctx){
    const identity=await adminIdentity(request,env,ctx);
    if(!identity)return respond('管理者のログインが必要です。',403);
    if(request.method!=='GET')return respond('この画面は閲覧専用です。',405);
    const path=new URL(request.url).pathname;
    if(path==='/')return respond(adminHTML,200,'text/html; charset=utf-8');
    if(path==='/admin.css')return respond(adminCSS,200,'text/css; charset=utf-8');
    if(path==='/admin.js')return respond(adminJS,200,'text/javascript; charset=utf-8');
    if(path==='/favicon.ico')return respond(null,204);
    if(path!=='/api/report')return respond('見つかりません。',404);
    if(!env.DB||!env.ADMIN_LIMIT)return respond('現在、集計を読み込めません。',503);
    if(!(await env.ADMIN_LIMIT.limit({key:identity.email})).success)return respond('少し待ってから更新してください。',429);
    try{return respond(JSON.stringify(await readAdminReport(env)),200,'application/json; charset=utf-8');}
    catch{return respond('集計を取得できませんでした。もう一度更新してください。',503);}
  }
};
