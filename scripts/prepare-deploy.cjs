const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
require('./build-content.cjs');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const legacy = fs.readFileSync(path.join(dist, 'legacy/index.html'),'utf8');
const scripts = [...legacy.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
const hashes = scripts.filter(match=>match[1].trim()).map(match => `'sha256-${crypto.createHash('sha256').update(match[1]).digest('base64')}'`);
const policy = [
  "default-src 'none'",
  `script-src 'self' https://challenges.cloudflare.com ${hashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join('; ');

fs.writeFileSync(path.join(dist, '_headers'), `/*
  Content-Security-Policy: ${policy}
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000
  Cache-Control: public, max-age=0, must-revalidate
/version.json
  X-Robots-Tag: noindex
/THIRD_PARTY_NOTICES.txt
  X-Robots-Tag: noindex
/404
  X-Robots-Tag: noindex
/legacy/*
  X-Robots-Tag: noindex
`);
fs.copyFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(dist, 'THIRD_PARTY_NOTICES.txt'));
const assetHashes = {};
function hashAssets(folder, prefix='') {
  for (const entry of fs.readdirSync(folder, {withFileTypes:true})) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) hashAssets(path.join(folder, entry.name), relative + '/');
    else if (!['_headers', 'version.json'].includes(relative)) {
      const route = relative.endsWith('index.html') ? '/' + relative.slice(0, -10) : '/' + relative;
      assetHashes[route] = sha256(fs.readFileSync(path.join(folder, entry.name)));
    }
  }
}
hashAssets(dist);
fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify({
  version: pkg.version,
  engineVersion: 'reflection-1',
  legacyEngineVersion: '16.64.3',
  indexSha256: sha256(html),
  hosting: 'cloudflare-static-assets',
  runtimeApiEnabled: true,
  researchIntakeEnabled: !!JSON.parse(fs.readFileSync(path.join(root,'config/research.json'),'utf8')).sitekey,
  assets: assetHashes
}, null, 2) + '\n');
console.log(`Prepared Cloudflare release ${pkg.version}; research routes isolated from static pages.`);
