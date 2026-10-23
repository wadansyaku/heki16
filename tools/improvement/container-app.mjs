import {promises as fs} from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const ROOT = '/project';
await fs.mkdir('/tmp/home', {recursive: true});
await fs.symlink('/opt/nocturne/node_modules', '/project/node_modules');
const env = {...process.env, XDG_CONFIG_HOME: '/tmp/home', XDG_CACHE_HOME: '/tmp/home'};
const execute = args => new Promise(resolve => {
  const child = spawn(process.execPath, args, {cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe']});
  let text = '', size = 0;
  const timer = setTimeout(() => child.kill('SIGKILL'), 120000);
  const consume = b => { size += b.length; if (size > 1e6) child.kill('SIGKILL'); else text += b; };
  child.stdout.on('data', consume); child.stderr.on('data', consume);
  child.on('error', () => { clearTimeout(timer); resolve({code: -1, text: ''}); });
  child.on('close', code => { clearTimeout(timer); resolve({code: size > 1e6 ? -1 : code, text}); });
});
const mode = process.argv[2], checks = [];
const commands = [['build', ['scripts/prepare-deploy.cjs']]];
if (mode === 'tests') {
  const files = (await fs.readdir('/project/tests')).filter(f => f.endsWith('.test.mjs')).sort().map(f => 'tests/' + f);
  commands.push(['legacy-tests', ['tests/core.cjs','src/legacy.html']], ['node-tests', ['--test', '--test-reporter=tap', ...files]], ['monetization-tests', ['tests/monetization.cjs']], ['deployment-tests', ['tests/deployment.cjs']]);
}
for (const [id, args] of commands) {
  const result = await execute(args);
  let passed = result.code === 0;
  if (id === 'node-tests') {
    const count = Number(result.text.match(/^# tests (\d+)$/m)?.[1]);
    passed &&= count > 0 && Number(result.text.match(/^# pass (\d+)$/m)?.[1]) === count && /^# fail 0$/m.test(result.text);
  }
  checks.push({id, passed, ...(id === 'node-tests' ? {failedTests: result.text.split('\n').filter(l => /^not ok /.test(l)).map(l => l.slice(0, 250))} : {})});
  if (!passed) { console.log(JSON.stringify({checks, passed: false})); process.exit(2); }
}
if (mode === 'tests') { console.log(JSON.stringify({checks, passed: true})); process.exit(0); }
if (mode !== 'server') process.exit(2);
const config = JSON.parse(await fs.readFile('/project/wrangler.jsonc', 'utf8'));
config.name = 'nocturne-local-qa'; config.routes = []; config.triggers = {crons: []};
config.main = path.join(ROOT, config.main); config.assets.directory = path.join(ROOT, config.assets.directory);
config.vars = {...config.vars, SITE_ORIGIN: 'http://127.0.0.1:8778', LOCAL_TEST_MODE: 'true'};
for (const db of config.d1_databases) { db.database_name = 'nocturne-local-qa'; db.database_id = '00000000-0000-0000-0000-000000000000'; db.migrations_dir = '/project/migrations'; }
for (const b of config.r2_buckets) b.bucket_name = 'nocturne-local-qa';
await fs.writeFile('/tmp/wrangler.json', JSON.stringify(config));
const wrangler = '/opt/nocturne/node_modules/wrangler/bin/wrangler.js';
const migrated = await execute([wrangler, 'd1','migrations','apply','DB','--local','--config','/tmp/wrangler.json','--persist-to','/tmp/state']);
if (migrated.code !== 0) process.exit(2);
const server = spawn(process.execPath, [wrangler,'dev','--local','--config','/tmp/wrangler.json','--ip','127.0.0.1','--port','8778','--persist-to','/tmp/state'], {cwd: ROOT, env, stdio: 'ignore'});
server.on('exit', code => process.exit(code || 0));
for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => server.kill(signal));
