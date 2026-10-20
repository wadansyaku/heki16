import {adminIdentity} from './admin-auth.mjs';
import {adminHTML,adminCSS,adminJS} from './admin-ui.mjs';
import {readAdminReport,reportFilters} from './admin-report.mjs';
export {readAdminReport} from './admin-report.mjs';

const headers={
  'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
  'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};
const respond=(body,status=200,type='text/plain; charset=utf-8')=>new Response(body,{status,headers:{...headers,'Content-Type':type}});

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
    const params=new URL(request.url).searchParams;
    try{reportFilters(params);}catch{return respond('絞り込みの条件を確認してください。',400);}
    if(!env.DB||!env.ADMIN_LIMIT)return respond('現在、集計を読み込めません。',503);
    if(!(await env.ADMIN_LIMIT.limit({key:identity.email})).success)return respond('少し待ってから更新してください。',429);
    try{return respond(JSON.stringify(await readAdminReport(env,Date.now(),params)),200,'application/json; charset=utf-8');}
    catch{return respond('集計を取得できませんでした。もう一度更新してください。',503);}
  }
};
