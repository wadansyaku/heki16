import {promises as fs} from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec = promisify(execFile);
const fail = code => { const e = Error(code); e.code = code; throw e; };
export function validateRuntime(runtime) {
  if (runtime?.version !== 1 || !/^unix:\/[^,\r\n]+$/.test(runtime.dockerHost || '') || !/^sha256:[a-f0-9]{64}$/.test(runtime.image || '') || !/^[a-f0-9]{64}$/.test(runtime.lockSha256 || '') || !/^[a-f0-9]{64}$/.test(runtime.seccompSha256 || '') || !path.isAbsolute(runtime.seccompPath || '')) fail('CONTAINER_RUNTIME_INVALID');
  return runtime;
}
export async function docker(runtime, args, timeout = 10000) {
  validateRuntime(runtime);
  try { return (await exec('docker', ['--host', runtime.dockerHost, ...args], {timeout, maxBuffer: 1e6, env: {PATH: process.env.PATH}})).stdout.trim(); }
  catch { fail('CONTAINER_RUNTIME_UNAVAILABLE'); }
}
export const runtimeNames = () => ['audit', 'tests', 'app', 'browser'];
export function containerArgs(runtime, {name, network = 'none', user, role = 'app'}) {
  validateRuntime(runtime);
  if (!/^improvement-[a-f0-9]{24}-(?:audit|tests|app|browser)$/.test(name) || !/^[1-9]\d*:\d+$/.test(user) || !(network === 'none' || /^container:improvement-[a-f0-9]{24}-app$/.test(network))) fail('CONTAINER_OPTIONS_INVALID');
  const args = ['--host', runtime.dockerHost, 'run', '--name', name, '--pull', 'never', '--init', '--log-driver', 'none', '--network', network, '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--pids-limit', role === 'browser' ? '256' : '128', '--memory', role === 'browser' ? '1536m' : '1024m', '--cpus', '1', '--user', user, '--shm-size', '256m', '--tmpfs', '/tmp:rw,nosuid,nodev,size=256m', '--workdir', '/project', '--env', 'HOME=/tmp/home', '--env', 'TMPDIR=/tmp', '--env', 'CI=true', '--env', 'WRANGLER_SEND_METRICS=false', '--env', 'NO_UPDATE_NOTIFIER=1', '--env', 'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright'];
  args[args.indexOf('--tmpfs') + 1] = '/tmp:rw,exec,nosuid,nodev,size=256m';
  if (role === 'browser') { args[args.indexOf('--workdir') + 1] = '/tmp'; args.push('--security-opt', `seccomp=${runtime.seccompPath}`); }
  else args.push('--tmpfs', `/project:rw,nosuid,nodev,noexec,size=256m,uid=${user.split(':')[0]},gid=${user.split(':')[1]},mode=0700`);
  return args;
}
export function bind(source, target, readonly = true) {
  if (!path.isAbsolute(source) || /[,\r\n]/.test(source) || !/^\/[a-zA-Z0-9_./-]+$/.test(target) || target.includes('/../')) fail('CONTAINER_MOUNT_INVALID');
  return ['--mount', `type=bind,src=${source},dst=${target}${readonly ? ',readonly' : ''}`];
}
export async function cleanupContainerRuntime(record) {
  if (!record) return;
  validateRuntime(record.runtime);
  if (!/^[a-f0-9]{64}$/.test(record.owner)) fail('CONTAINER_OWNERSHIP_INVALID');
  for (const name of record.names) {
    if (!/^improvement-[a-f0-9]{24}-(?:audit|tests|app|browser)$/.test(name)) fail('CONTAINER_OWNERSHIP_INVALID');
    const ids = await docker(record.runtime, ['ps', '-a', '--filter', `name=^/${name}$`, '--format', '{{.ID}}']);
    if (!ids) continue;
    const info = JSON.parse(await docker(record.runtime, ['inspect', name]));
    if (info.length !== 1 || info[0].Config?.Labels?.['nocturne.verification.owner'] !== record.owner) fail('CONTAINER_OWNERSHIP_INVALID');
    await docker(record.runtime, ['rm', '-f', name]);
  }
}
export async function inspectIsolation(runtime, name, expectedNetwork) {
  const [value] = JSON.parse(await docker(runtime, ['inspect', name]));
  const c = value.HostConfig;
  if (c.Privileged || !c.ReadonlyRootfs || !c.CapDrop?.includes('ALL') || c.CapAdd?.length || !c.SecurityOpt?.includes('no-new-privileges') || c.NetworkMode !== expectedNetwork || c.PidMode || c.IpcMode === 'host' || c.PortBindings && Object.keys(c.PortBindings).length || !/^[1-9]\d*:\d+$/.test(value.Config.User) || c.PidsLimit <= 0 || c.PidsLimit > 256 || c.NanoCpus <= 0 || c.NanoCpus > 1e9 || c.Memory > 1610612736 || c.Memory <= 0 || value.Mounts.some(m => m.Type === 'bind' && !['/trusted','/project/src','/project/tests','/project/tools','/project/scripts','/project/config','/project/migrations','/project/package.json','/project/package-lock.json','/project/wrangler.jsonc','/project/THIRD_PARTY_NOTICES.md','/artifacts'].includes(m.Destination) && !/^\/project\/src\/[a-z][a-z0-9-]*\.(?:html|mjs|js|cjs|css)$/.test(m.Destination))) fail('CONTAINER_ISOLATION_REJECTED');
  if (value.Mounts.some(m => m.Type === 'bind' && m.RW && m.Destination !== '/artifacts')) fail('CONTAINER_ISOLATION_REJECTED');
  return {nonroot: true, readOnlyRoot: true, capabilitiesDropped: true, noPrivilegeEscalation: true, externalNetwork: false, privatePidNamespace: true, resourceLimits: true};
}
