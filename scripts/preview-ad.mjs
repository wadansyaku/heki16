// Render the actual client in an isolated review harness. Never enables delivery.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {selectPromotions,promotionForm,AD_CONSENT,adConsentApplies} from '../src/affiliate-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2];if(!output||!path.isAbsolute(output)||path.resolve(output).startsWith(root+'/'))throw Error('NEW_PRIVATE_OUTPUT_REQUIRED');
const config=JSON.parse(await fs.readFile(path.join(root,'config/monetization.json'),'utf8'));
const campaigns=config.campaigns.map(c=>({...c,url:'/out/'+c.id}));let content='',title='';
const context=vm.createContext({campaigns,personalizationEnabled:false,selectPromotions,promotionForm,AD_CONSENT,adConsentApplies,
 measure:()=>{},ensureEligibility:async()=>{},eligibilityReady:()=>true,fetch:async()=>({ok:true,json:async()=>({enabled:true})}),
 document:{addEventListener:()=>{}},window:{addEventListener:()=>{}}});
vm.runInContext((await fs.readFile(path.join(root,'src/affiliate-client.mjs'),'utf8')).replace(/^import .*;\n/gm,'').replace(/^export /gm,''),context);
await context.openPromotion({profile:{},recordId:'synthetic-review-only',showModal:(t,html)=>{title=t;content=html;}});
await fs.mkdir(output,{mode:0o700});
await fs.copyFile(path.join(root,'dist/app.css'),path.join(output,'app.css'));
await fs.writeFile(path.join(output,'index.html'),`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="stylesheet" href="app.css"><title>広告物確認用・非公開</title><body style="min-height:100dvh;display:grid;place-items:center;padding:20px"><div style="width:min(520px,100%)"><p style="font-size:12px;color:var(--muted);margin-bottom:16px">掲載前の確認用 · 広告配信は停止中</p><section class="deck" style="height:auto;padding:24px"><h2 style="margin-bottom:20px">${title}</h2>${content.replace(/<form\b[^>]*>/g,'<form>').replace(/type="submit"/g,'type="button" aria-disabled="true"')}</section></div></body></html>`,{flag:'wx',mode:0o600});
console.log('Private creative preview prepared; production flags unchanged.');
