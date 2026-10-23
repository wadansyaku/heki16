// Trusted, bounded offline fixture. Never executes source, shell, or an agent-provided command.
import {promises as fs} from 'node:fs';
import path from 'node:path';
let input = '';
for await (const chunk of process.stdin) input += chunk;
const step = JSON.parse(input);
if (step.delayMs) await new Promise(resolve => setTimeout(resolve, step.delayMs));
if (step.mode === 'hang') await new Promise(() => { setInterval(() => {}, 1000); });
if (step.mode === 'exit') process.exit(2);
if (step.mode === 'write-many') for (const file of step.files) { await fs.mkdir(path.dirname(file.path), {recursive: true}); await fs.writeFile(file.path, file.content); }
if (['write', 'forbidden', 'tamper-check'].includes(step.mode)) {
  const target = step.mode === 'forbidden' ? 'outside.txt' : step.mode === 'tamper-check' ? 'checks/acceptance.json' : step.path;
  await fs.mkdir(path.dirname(target), {recursive: true});
  await fs.writeFile(target, step.content ?? 'changed\n');
}
// Deliberately claims success even when the actual acceptance condition is false.
process.stdout.write(JSON.stringify({passed: true, result: 'complete'}));
