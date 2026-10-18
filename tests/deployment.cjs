const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const config = JSON.parse(read('wrangler.jsonc'));
const html = read('dist/index.html');
const headers = read('dist/_headers');
const manifest = JSON.parse(read('dist/version.json'));
const codes=[];
for(const a of 'DS')for(const b of 'WC')for(const c of 'NA')for(const d of 'XP')codes.push(a+b+c+d);
const allowed = ['404.html','THIRD_PARTY_NOTICES.txt','_headers','index.html','robots.txt','sitemap.xml','version.json','app.css','app.mjs','reflection.mjs','legacy/index.html','types/index.html','guide/index.html','privacy/index.html','advertising/index.html','evidence/index.html','library/index.html',...['fantasy','conversation','boundaries'].map(s=>`library/${s}/index.html`),...codes.map(code=>`types/${code}/index.html`)];
const walk=(folder,prefix='')=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name),prefix+entry.name+'/'):[prefix+entry.name]);
assert.deepEqual(walk(path.join(root,'dist')).sort(), allowed.sort(), 'Only approved public assets may be deployed');
assert.deepEqual(Object.keys(config).sort(), ['$schema','name','compatibility_date','workers_dev','preview_urls','observability','assets','main','limits','vars','d1_databases','r2_buckets','ratelimits','triggers'].sort(), 'Review any new runtime capabilities before publishing');
assert.deepEqual(config.assets.run_worker_first, ['/api/*']);
assert.equal(config.main,'src/worker.mjs');
assert.ok(config.limits.cpu_ms<=50);
assert.equal(config.d1_databases.length,1);
assert.equal(config.r2_buckets.length,1);
assert.equal(config.ratelimits.length,2);
assert.deepEqual(config.triggers.crons,['*/15 * * * *']);
assert.equal(config.assets.not_found_handling, '404-page');
assert.equal(config.observability.enabled, false);
assert.equal(config.preview_urls, false);
assert.ok(!fs.existsSync(path.join(root, 'functions')));
const js=read('dist/app.mjs');
assert.deepEqual([...js.matchAll(/fetch\('([^']+)'/g)].map(m=>m[1]).sort(),['/api/reference','/api/research','/api/research/delete']);
assert.ok(!/sendBeacon|XMLHttpRequest|WebSocket/.test(js));
assert.match(headers, /connect-src 'self' https:\/\/challenges.cloudflare.com/);
assert.match(headers, /frame-ancestors 'none'/);
assert.ok(!/script-src[^;\n]*(?:unsafe-inline|unsafe-eval)/.test(headers));
for (const match of read('dist/legacy/index.html').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
  const hash = crypto.createHash('sha256').update(match[1]).digest('base64');
  assert.ok(headers.includes(`'sha256-${hash}'`), 'Every bundled script must be allowed by its exact CSP hash');
}
assert.equal(manifest.indexSha256, crypto.createHash('sha256').update(html).digest('hex'));
assert.equal(manifest.runtimeApiEnabled, true);
assert.equal(manifest.engineVersion,'reflection-1');
assert.equal(manifest.researchIntakeEnabled,!!JSON.parse(read('config/research.json')).sitekey);
assert.equal(config.vars.RESEARCH_ENABLED,manifest.researchIntakeEnabled?'true':'false');
assert.ok(!js.includes('__TURNSTILE_SITEKEY__'));
assert.ok(!/TURNSTILE_SECRET|CLOUDFLARE_API_TOKEN/.test(js));
for(const [route,hash] of Object.entries(manifest.assets)) {
  const file=route.endsWith('/')?route.slice(1)+'index.html':route.slice(1);
  assert.ok(allowed.includes(file));
  assert.equal(hash,crypto.createHash('sha256').update(read('dist/'+file)).digest('hex'));
}
assert.equal(Object.keys(manifest.assets).length,allowed.length-2);
assert.match(html, /name="robots" content="index, follow/);
const initialMain=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
assert.ok(!initialMain.includes('${'),'Static content must not expose unresolved templates');
assert.match(initialMain,/<h1>好きの輪郭を、/,'The primary content is readable before JavaScript');
assert.match(initialMain,/<button[^>]+data-action="sample"[^>]*>見本を見る/,'The sample entry must be a real interactive control');
assert.equal([...initialMain.matchAll(/data-action="start32"/g)].length,2,'Both start entries must be interactive');
assert.ok(!/noindex/i.test(html));
assert.match(html, /rel="canonical" href="https:\/\/heki16-pro\.aiyume\.workers\.dev\/"/);
assert.match(read('dist/sitemap.xml'), /<loc>https:\/\/heki16-pro\.aiyume\.workers\.dev\/<\/loc>/);
assert.ok(!/Disallow:\s*\/\s*$/mi.test(read('dist/robots.txt')));
assert.match(read('dist/404.html'), /noindex/);
const sitemap=read('dist/sitemap.xml');
assert.equal([...sitemap.matchAll(/<loc>/g)].length,26);
assert.ok(!sitemap.includes('/legacy/'));
assert.match(read('dist/legacy/index.html'),/content="noindex, follow"/);
for(const file of allowed.filter(file=>file.endsWith('index.html')&&!file.startsWith('legacy/'))) {
  const page=read('dist/'+file);
  const route='/'+file.replace(/index\.html$/,'');
  assert.ok(sitemap.includes('https://heki16-pro.aiyume.workers.dev'+route),route);
  assert.ok(page.includes(`rel="canonical" href="https://heki16-pro.aiyume.workers.dev${route}"`));
  assert.ok(!/<script\b[^>]*\bsrc\s*=\s*["']https?:/i.test(page),'No third party advertising scripts in this release');
  for(const match of page.matchAll(/href="(\/[^"?#]*)"/g)) {
    const target=match[1].endsWith('/')?match[1].slice(1)+'index.html':match[1].slice(1);
    assert.ok(allowed.includes(target),`Broken internal link: ${route} -> ${match[1]}`);
  }
}
console.log('Deployment boundaries passed: static-first, isolated research APIs, bounded resources, CSP integrity, public asset allowlist, SEO, release hashes.');
