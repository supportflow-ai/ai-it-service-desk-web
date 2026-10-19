import { analyzeArchitecture, readProductionSources } from './architecture.mjs';

const errors = analyzeArchitecture(readProductionSources());
if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else process.stdout.write('Architecture boundaries and dependency graph: PASS\n');
