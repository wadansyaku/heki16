const {NAMED_DOSSIERS,LEGACY_TYPE_CODES}=require('../src/dossier-catalog.mjs');
const {ART_FILES}=require('../src/art.mjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const config=JSON.parse(read('wrangler.jsonc')),html=read('dist/index.html'),headers=read('dist/_headers'),manifest=JSON.parse(read('dist/version.json'));
assert.ok(!/data-action="sample"|結果の見本/.test(html),'The initial home must not show removed result samples');
const codes=[];for(const a of 'DS')for(const b of 'WC')for(const c of 'NA')for(const d of 'XP')codes.push(a+b+c+d);
const allowed=['404.html','THIRD_PARTY_NOTICES.txt','_headers','_redirects','index.html','robots.txt','sitemap.xml','version.json','favicon.svg','app.css','dossier-catalog.mjs','result-reading.mjs','app.mjs','content.mjs','diagnosis.mjs','tags.mjs','profile.mjs','phrasing.mjs','share-compat.mjs','share-v5.mjs','nocturne.mjs','nocturne-v1.mjs','nocturne-v2.mjs','nocturne-v3.mjs','copy.mjs','art.mjs',...ART_FILES,'presentation.mjs','vault.mjs','browser-cleanup.mjs','metrics.mjs','affiliate-core.mjs','affiliate-client.mjs','affiliate-catalog.mjs','consent.mjs','publication-writer.mjs','eligibility-core.mjs','eligibility-client.mjs','x-share.mjs','navigation.mjs','types/index.html','guide/index.html','privacy/index.html','advertising/index.html','evidence/index.html','library/index.html',...['fantasy','conversation','boundaries'].map(s=>`library/${s}/index.html`),...NAMED_DOSSIERS.map(entry=>`types/${entry.id}/index.html`),'types/undetermined/index.html'];
const walk=(folder,prefix='')=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name),prefix+entry.name+'/'):[prefix+entry.name]);
assert.deepEqual(walk(path.join(root,'dist')).sort(),allowed.sort());
assert.deepEqual(Object.keys(config).sort(),['$schema','name','compatibility_date','workers_dev','preview_urls','observability','assets','main','limits','vars','d1_databases','r2_buckets','ratelimits','triggers','routes'].sort());
assert.deepEqual(config.routes,[{pattern:'kuseiro.com',custom_domain:true},{pattern:'nocturne.ai-yu-me.com',custom_domain:true}]);assert.equal(config.vars.SITE_ORIGIN,'https://kuseiro.com');assert.equal(config.vars.LEGACY_SITE_ORIGIN,'https://nocturne.aiyume.workers.dev');assert.equal(config.vars.LEGACY_CUSTOM_SITE_ORIGIN,'https://nocturne.ai-yu-me.com');assert.deepEqual(config.assets.run_worker_first,['/api/*','/s/*','/out/*']);assert.equal(config.vars.LOCAL_TEST_MODE,undefined);assert.equal(config.main,'src/worker.mjs');assert.ok(config.limits.cpu_ms<=250);assert.equal(config.d1_databases.length,1);assert.equal(config.r2_buckets.length,1);assert.equal(config.ratelimits.length,3);assert.deepEqual(config.triggers.crons,['*/15 * * * *']);assert.equal(config.assets.not_found_handling,'404-page');assert.equal(config.observability.enabled,false);assert.equal(config.preview_urls,false);
const adConfig=JSON.parse(read('config/monetization.json')),catalog=read('dist/affiliate-catalog.mjs');
if(adConfig.enabled){
 const formPolicy=headers.match(/form-action ([^;\n]+)/)[1];
 assert.ok(formPolicy.includes('https://mfco.link')&&formPolicy.includes('https://myfans.jp'),'The native PR form must permit both official redirect origins');
 assert.ok(!formPolicy.includes('*'),'Advertising must not permit arbitrary form destinations');
}
assert.deepEqual(JSON.parse(catalog.match(/^export const campaigns=(.*);$/m)[1]),require('../scripts/monetization.cjs').publicCampaigns(require('../scripts/monetization.cjs').validateMonetization(adConfig)));
if(!adConfig.enabled){assert.match(catalog,/export const personalizationEnabled=false;/);assert.equal(read('dist/index.html').includes('PR · myfans'),false);}
const js=read('dist/app.mjs');assert.match(js,/credentials:'same-origin'/);assert.match(js,/X-Nocturne/);assert.ok(!/XMLHttpRequest|WebSocket/.test(js));assert.match(headers,/connect-src 'self' https:\/\/challenges.cloudflare.com/);assert.match(headers,/frame-ancestors 'none'/);assert.ok(!/script-src[^;\n]*(?:unsafe-inline|unsafe-eval)/.test(headers));assert.ok(!/TURNSTILE_SECRET|CLOUDFLARE_API_TOKEN|__TURNSTILE_SITEKEY__/.test(js));
assert.equal(manifest.indexSha256,crypto.createHash('sha256').update(html).digest('hex'));assert.equal(manifest.runtimeApiEnabled,true);assert.equal(manifest.engineVersion,'nocturne24-4');assert.equal(manifest.researchIntakeEnabled,!!JSON.parse(read('config/research.json')).sitekey);assert.equal(config.vars.RESEARCH_ENABLED,manifest.researchIntakeEnabled?'true':'false');
for(const [route,hash] of Object.entries(manifest.assets)){const file=route.endsWith('/')?route.slice(1)+'index.html':route.slice(1);assert.ok(allowed.includes(file));assert.equal(hash,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'dist',file))).digest('hex'));}assert.equal(Object.keys(manifest.assets).length,allowed.length-3);
const initialMain=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];assert.ok(!initialMain.includes('${'));assert.ok(initialMain.replace(/<[^>]+>/g,'').includes('「SかMか」だけでは、言い切れない。'));assert.equal([...initialMain.matchAll(/data-action="start"/g)].length,1);assert.ok(!/18問|32問|旧版|新版|品質ゲート|補正係数/.test(html));assert.ok(!/noindex/i.test(html));assert.match(html,/rel="canonical" href="https:\/\/kuseiro\.com\/"/);
// Crawlers read the initial HTML without running the eligibility or app scripts.
for(const file of allowed.filter(file=>file.endsWith('index.html'))){
 const page=read('dist/'+file);
 assert.match(page,/<meta name="twitter:card" content="summary_large_image">/,file);
 for(const attribute of ['property="og:image"','name="twitter:image"']){
  const value=page.match(new RegExp('<meta '+attribute+' content="([^"]+)"'))?.[1];
  assert.ok(value,`${file}: the social card must have an explicit image`);
  const image=new URL(value);assert.equal(image.origin,config.vars.SITE_ORIGIN);assert.equal(image.search,'');
  assert.ok(manifest.assets[image.pathname],`${file}: social image must be a published asset`);
  assert.ok(fs.statSync(path.join(root,'dist',image.pathname)).size<5*1024*1024);
 }
 assert.match(page,/<meta property="og:image:width" content="1200">/);
 assert.match(page,/<meta property="og:image:height" content="800">/);
}
assert.match(read('dist/robots.txt'),/User-agent: \*\nAllow: \//);
const sitemap=read('dist/sitemap.xml');assert.equal([...sitemap.matchAll(/<loc>/g)].length,10+NAMED_DOSSIERS.length+1);assert.ok(!sitemap.includes('/legacy/'));assert.match(read('dist/_redirects'),/\/legacy\/ \/* 302/);assert.match(read('dist/404.html'),/noindex/);
for(const file of allowed.filter(file=>file.endsWith('index.html'))){const page=read('dist/'+file),route='/'+file.replace(/index\.html$/,'');assert.ok(sitemap.includes('https://kuseiro.com'+route));assert.ok(page.includes(`rel="canonical" href="https://kuseiro.com${route}"`));assert.ok(!/<script\b[^>]*\bsrc\s*=\s*["']https?:/i.test(page));assert.ok(!/18問|32問|旧版を開く|新しい質問|Cron|α係数|補正係数/.test(page));for(const m of page.matchAll(/href="(\/[^"?#]*)"/g)){const target=m[1].endsWith('/')?m[1].slice(1)+'index.html':m[1].slice(1);assert.ok(allowed.includes(target),`Broken internal link ${route} -> ${target}`);}}
console.log('Deployment checks passed: one canonical experience, static-first routing, bounded APIs, CSP, asset allowlist, SEO and release hashes.');

for(const file of allowed.filter(file=>file.endsWith('index.html'))){const page=read('dist/'+file),exempt=['privacy/index.html','advertising/index.html'].includes(file);assert.equal(page.includes('data-eligibility-required'),!exempt,file);assert.ok(page.includes('eligibility-loading')||exempt,file);for(const route of ['home','profile','find'])assert.ok(page.includes('href="/#'+route+'"')||file==='index.html'&&page.includes('href="#'+route+'"'),file+' lacks '+route);assert.ok(page.includes('aria-label="メニューを開く"'),file);}
if(!adConfig.enabled||!adConfig.personalizationEnabled){for(const file of ['privacy/index.html','advertising/index.html'])assert.ok(read('dist/'+file).includes('現在、回答や結果に応じた広告の選別は行っていません。'));}
assert.ok(!/id="adult"/.test(js));assert.match(read('dist/eligibility-client.mjs'),/18歳以上で、/);assert.match(read('dist/eligibility-client.mjs'),/高校生ではない方ですか/);

const redirects=read('dist/_redirects');
for(const code of LEGACY_TYPE_CODES)for(const suffix of ['', '/', '/index.html'])assert.ok(redirects.includes(`/types/${code}${suffix} /types/ 301\n`),'Legacy catalog URL must redirect: '+code+suffix);
const library=read('dist/types/index.html');assert.ok(!/16の関係性|16タイプ|40タイプ/.test(library));assert.match(library,/data-catalog="pending"/);
for(const file of allowed.filter(file=>file.endsWith('index.html')))assert.ok(!/16の関係性|16タイプ|40問|共有画像のタグ選択|裏スイッチ/.test(read('dist/'+file)),file+' contains retired product copy');

const robots=read('dist/robots.txt'),twitterRules=robots.split('User-agent: Twitterbot\n')[1]?.split('\n\n')[0],defaultRules=robots.split('User-agent: *\n')[1];
assert.ok(twitterRules&&twitterRules.includes('Allow: /\n')&&!twitterRules.includes('Disallow: /s/'),'Twitterbot must be able to fetch public result previews');
for(const rules of [twitterRules,defaultRules])for(const path of ['/api/','/legacy/'])assert.ok(rules.includes('Disallow: '+path));
assert.ok(defaultRules.includes('Disallow: /s/'),'General crawlers remain excluded from shared results');
