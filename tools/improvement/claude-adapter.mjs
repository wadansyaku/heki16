import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const exec = promisify(execFile);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const fail = code => { const error = new Error(code); error.code = code; throw error; };
const secure = ['--pull', 'never', '--log-driver', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--pids-limit', '64', '--memory', '512m', '--cpus', '1', '--user', `${process.getuid?.() ?? 0}:${process.getgid?.() ?? 0}`, '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m'];
async function docker(args, timeout = 10000) {
  try { return (await exec('docker', args, {timeout, maxBuffer: 100000, env: {PATH: process.env.PATH}})).stdout.trim(); }
  catch { fail('DOCKER_ISOLATION_UNAVAILABLE'); }
}
const keys = ['kind', 'image', 'claudeVersion', 'model', 'providerHardCapUsd'];
export function validateClaudeConfig(spec) {
  const config = spec.adapter;
  if (Object.keys(config).some(key => !keys.includes(key)) || !/^sha256:[a-f0-9]{64}$/.test(config.image) || !/^2\.1\.\d+$/.test(config.claudeVersion) || Number(config.claudeVersion.split('.')[2]) < 286 || !/^claude-[a-z0-9-]{3,100}$/.test(config.model)) fail('INVALID_CLAUDE_PROFILE');
  return config;
}
export async function claudePreflight(spec, {allowPaid, allowExternal, timeoutMs = 30000}) {
  const config = validateClaudeConfig(spec);
  if (!allowPaid || !allowExternal) fail('EXTERNAL_PAID_DISABLED');
  if (!(spec.budget.maxCostUsd > 0)) fail('COST_BUDGET_REQUIRED');
  // The CLI ceiling alone is not a bank-side hard spending limit. Operator approval must include one.
  if (!(Number.isFinite(config.providerHardCapUsd) && config.providerHardCapUsd > 0 && config.providerHardCapUsd <= spec.budget.maxCostUsd)) fail('PROVIDER_HARD_CAP_REQUIRED');
  if (!process.env.IMPROVEMENT_ANTHROPIC_API_KEY) fail('DEDICATED_API_KEY_REQUIRED');
  if (!(process.getuid?.() > 0)) fail('NONROOT_OPERATOR_REQUIRED');
  const deadline = Date.now() + timeoutMs;
  const checkedDocker = args => { const remaining = deadline - Date.now(); if (remaining <= 0) fail('WALL_TIME_LIMIT'); return docker(args, Math.min(remaining, 10000)); };
  await checkedDocker(['info', '--format', '{{json .ServerVersion}}']);
  const image = JSON.parse(await checkedDocker(['image', 'inspect', config.image]));
  if (image.length !== 1 || image[0].Id !== config.image || Object.keys(image[0].Config?.Volumes ?? {}).length || (image[0].Config?.Env ?? []).some(entry => !/^(?:PATH|HOME|LANG|LC_ALL|TZ|NODE_VERSION|YARN_VERSION)=/.test(entry))) fail('IMAGE_PROFILE_REJECTED');
  const version = await checkedDocker(['run', '--rm', '--network', 'none', ...secure, '--entrypoint', '/usr/bin/timeout', config.image, '5s', 'claude', '--version']);
  if (!new RegExp(`^${config.claudeVersion.replaceAll('.', '\\.')}\\b`).test(version)) fail('CLAUDE_VERSION_MISMATCH');
  const help = await checkedDocker(['run', '--rm', '--network', 'none', ...secure, '--entrypoint', '/usr/bin/timeout', config.image, '5s', 'claude', '--help']);
  if (['--bare', '--max-budget-usd', '--max-turns', '--tools', '--strict-mcp-config', '--permission-mode'].some(flag => !help.includes(flag))) fail('CLAUDE_FLAGS_UNSUPPORTED');
  return {runtime: 'docker-internal-network', cliVersion: config.claudeVersion};
}
export async function runClaude(spec, state, stage, {runProcess, timeoutMs, shouldStop}) {
  const config = validateClaudeConfig(spec);
  if (!path.isAbsolute(stage) || /[,\r\n]/.test(stage) || /[,\r\n]/.test(ROOT)) fail('INVALID_RUNTIME_PATH');
  const [agent, proxy, network] = state.activeRuntime;
  const deadline = Date.now() + timeoutMs;
  const checkedDocker = async args => { const stop = await shouldStop?.(); if (stop) fail(stop); const remaining = deadline - Date.now(); if (remaining <= 0) fail('ATTEMPT_TIMEOUT'); return docker(args, Math.min(remaining, 10000)); };
  // A timeout inside each container bounds orphan lifetime after controller SIGKILL.
  const seconds = `${Math.max(1, Math.ceil(timeoutMs / 1000))}s`;
  await checkedDocker(['network', 'create', '--internal', network]);
  const netInfo = JSON.parse(await checkedDocker(['network', 'inspect', network]));
  if (netInfo.length !== 1 || netInfo[0].Internal !== true) fail('DOCKER_ISOLATION_UNAVAILABLE');
  await checkedDocker(['run', '-d', '--rm', '--name', proxy, '--network', 'bridge', ...secure, '--mount', `type=bind,src=${path.join(ROOT, 'egress-proxy.mjs')},dst=/proxy.mjs,readonly`, '--entrypoint', '/usr/bin/timeout', config.image, seconds, 'node', '/proxy.mjs']);
  await checkedDocker(['network', 'connect', network, proxy]);
  const networks = JSON.parse(await checkedDocker(['inspect', proxy, '--format', '{{json .NetworkSettings.Networks}}']));
  const proxyIp = networks[network]?.IPAddress;
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(proxyIp ?? '')) fail('DOCKER_ISOLATION_UNAVAILABLE');
  const prompt = JSON.stringify({role: 'implementation', goal: spec.goal, background: spec.background, allowedFiles: spec.allowedFiles, acceptance: spec.acceptance, previousFailures: state.verification, instructions: 'Modify only allowedFiles. Produce a candidate. Acceptance and publication are controlled independently. Do not collect data, publish, install dependencies, or edit policy.'});
  const args = ['run', '--rm', '-i', '--name', agent, '--network', network, '--dns', '127.0.0.1', ...secure,
    '--mount', `type=bind,src=${stage},dst=/workspace`, '--workdir', '/workspace',
    '--env', 'ANTHROPIC_API_KEY', '--env', `HTTPS_PROXY=http://${proxyIp}:8787`, '--env', `HTTP_PROXY=http://${proxyIp}:8787`, '--env', 'NO_PROXY=',
    '--env', 'HOME=/tmp/home', '--env', 'CLAUDE_CONFIG_DIR=/tmp/claude', '--env', 'DISABLE_AUTOUPDATER=1', '--env', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1',
    '--entrypoint', '/usr/bin/timeout', config.image, seconds, 'claude', '--bare', '-p', '--output-format', 'json', '--model', config.model,
    '--max-turns', '8', '--max-budget-usd', String(state.attempt.reservedCostUsd), '--tools', 'Read,Edit,Write,Glob,Grep', '--allowedTools', 'Read,Edit,Write,Glob,Grep',
    '--permission-mode', 'dontAsk', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}'];
  // No host HOME, cloud tokens, SSH agent, Docker socket, git credential files, MCP, hooks, or Bash.
  if (deadline <= Date.now()) fail('ATTEMPT_TIMEOUT');
  return runProcess('docker', args, {cwd: stage, input: prompt, timeoutMs: deadline - Date.now(), shouldStop, env: {ANTHROPIC_API_KEY: process.env.IMPROVEMENT_ANTHROPIC_API_KEY}});
}
