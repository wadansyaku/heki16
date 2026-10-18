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
const allowed = ['404.html','THIRD_PARTY_NOTICES.txt','_headers','index.html','robots.txt','sitemap.xml','version.json','content.css','types/index.html','guide/index.html','privacy/index.html','advertising/index.html',...codes.map(code=>`types/${code}/index.html`)];
const walk=(folder,prefix='')=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name),prefix+entry.name+'/'):[prefix+entry.name]);
assert.deepEqual(walk(path.join(root,'dist')).sort(), allowed.sort(), 'Only approved public assets may be deployed');
assert.deepEqual(Object.keys(config).sort(), ['$schema','name','compatibility_date','workers_dev','preview_urls','observability','assets'].sort(), 'Review any new runtime capabilities before publishing');
assert.equal(config.assets.run_worker_first, false);
assert.equal(config.assets.not_found_handling, '404-page');
assert.equal(config.observability.enabled, false);
assert.equal(config.preview_urls, false);
assert.ok(!fs.existsSync(path.join(root, 'functions')), 'No billed server functions in this release');
assert.ok(!/\b(?:fetch\s*\(|XMLHttpRequest|sendBeacon\s*\(|WebSocket\s*\()/i.test(html), 'Review outbound data paths before adding APIs');
assert.match(headers, /connect-src 'none'/);
assert.match(headers, /frame-ancestors 'none'/);
assert.ok(!/script-src[^;\n]*(?:unsafe-inline|unsafe-eval)/.test(headers));
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
  const hash = crypto.createHash('sha256').update(match[1]).digest('base64');
  assert.ok(headers.includes(`'sha256-${hash}'`), 'Every bundled script must be allowed by its exact CSP hash');
}
assert.equal(manifest.indexSha256, crypto.createHash('sha256').update(html).digest('hex'));
assert.equal(manifest.runtimeApiEnabled, false);
for(const [route,hash] of Object.entries(manifest.assets)) {
  const file=route.endsWith('/')?route.slice(1)+'index.html':route.slice(1);
  assert.ok(allowed.includes(file));
  assert.equal(hash,crypto.createHash('sha256').update(read('dist/'+file)).digest('hex'));
}
assert.equal(Object.keys(manifest.assets).length,allowed.length-2);
assert.match(html, /name="robots" content="index, follow/);
assert.ok(!/noindex/i.test(html));
assert.match(html, /rel="canonical" href="https:\/\/heki16-pro\.aiyume\.workers\.dev\/"/);
assert.match(read('dist/sitemap.xml'), /<loc>https:\/\/heki16-pro\.aiyume\.workers\.dev\/<\/loc>/);
assert.ok(!/Disallow:\s*\/\s*$/mi.test(read('dist/robots.txt')));
assert.match(read('dist/404.html'), /noindex/);
const sitemap=read('dist/sitemap.xml');
assert.equal([...sitemap.matchAll(/<loc>/g)].length,21);
for(const file of allowed.filter(file=>file.endsWith('index.html'))) {
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
console.log('Deployment boundaries passed: static-only, CSP integrity, public asset allowlist, SEO, release hash.');
