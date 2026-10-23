import {promises as fs} from 'node:fs';
import {chromium} from '/opt/runtime/node_modules/playwright/index.mjs';
import {verifyUiFlow} from '../../scripts/ui-flow.mjs';
await fs.mkdir('/tmp/home', {recursive: true});
const origin = 'http://127.0.0.1:8778';
let ready = false;
for (let i = 0; i < 200; i++) {
  try { const r = await fetch(origin + '/api/config', {signal: AbortSignal.timeout(1000)}); const value = await r.json(); if (r.ok && value.localTest === true) { ready = true; break; } } catch {}
  await new Promise(r => setTimeout(r, 150));
}
if (!ready) { console.log(JSON.stringify({passed: false, checks: [{id: 'local-server', passed: false}], screenshots: []})); process.exit(2); }
const browser = await chromium.launch({headless: true, chromiumSandbox: true, args: ['--disable-background-networking']});
try { console.log(JSON.stringify(await verifyUiFlow({browser, origin, outputDir: '/artifacts'}))); }
finally { await browser.close(); }
