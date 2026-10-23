#!/usr/bin/env node
import {promises as fs} from 'node:fs';
import {initialize, run, status, control, validateSpec, specHash, EngineError} from './engine.mjs';
const [command, ...args] = process.argv.slice(2);
function options(values) {
  const result = {};
  for (let index = 0; index < values.length; index++) {
    const key = values[index];
    if (!key.startsWith('--') || result[key] !== undefined) throw new EngineError('INVALID_ARGUMENT');
    if (['--allow-paid', '--allow-external', '--one-step'].includes(key)) result[key] = true;
    else { if (!values[index + 1] || values[index + 1].startsWith('--')) throw new EngineError('INVALID_ARGUMENT'); result[key] = values[++index]; }
  }
  const allowed = {'hash': ['--spec'], 'init': ['--spec', '--workspace', '--state', '--approved-sha256'], 'run': ['--state', '--allow-paid', '--allow-external', '--one-step', '--product-profile'], 'status': ['--state'], 'pause': ['--state'], 'resume': ['--state'], 'kill': ['--state']};
  if (!allowed[command] || Object.keys(result).some(key => !allowed[command].includes(key))) throw new EngineError('INVALID_ARGUMENT');
  return result;
}
try {
  const flags = options(args);
  let result;
  if (command === 'hash') result = {sha256: specHash(validateSpec(JSON.parse(await fs.readFile(flags['--spec'], 'utf8'))))};
  else if (command === 'init') result = await initialize({specPath: flags['--spec'], workspace: flags['--workspace'], stateDir: flags['--state'], approvedHash: flags['--approved-sha256']});
  else if (command === 'status') result = await status(flags['--state']);
  else if (['pause', 'resume', 'kill'].includes(command)) result = await control(flags['--state'], command);
  else result = await run(flags['--state'], {allowPaid: flags['--allow-paid'], allowExternal: flags['--allow-external'], oneStep: flags['--one-step'], productProfile: flags['--product-profile']});
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status === 'stopped' || result.status === 'killed') process.exitCode = 2;
} catch (error) {
  // Never echo exception messages, source text, child stdout/stderr, credentials, or arbitrary paths.
  const code = error instanceof EngineError ? error.code : 'INVALID_INPUT_OR_ENVIRONMENT';
  process.stderr.write(`${JSON.stringify({error: code})}\n`);
  process.exitCode = code === 'BUSY' ? 3 : 2;
}
