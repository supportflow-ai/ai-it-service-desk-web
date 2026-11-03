import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const manifest = JSON.parse(read('tests/contracts/backend-source.json'));
const specText = read('tests/contracts/backend-openapi.json');
const hash = createHash('sha256').update(specText.replaceAll('\r\n', '\n')).digest('hex');
if (hash !== manifest.sha256) throw new Error('OpenAPI checksum changed: review and update the source manifest.');
const spec = JSON.parse(specText);

function type(schema) {
  if (schema.$ref) return schema.$ref.split('/').at(-1);
  let value;
  if (schema.enum) value = schema.enum.map((item) => JSON.stringify(item)).join(' | ');
  else if (schema.type === 'array') value = `Array<${type(schema.items)}>`;
  else if (schema.type === 'object') {
    if (schema.properties) value = object(schema);
    else value = `Record<string, ${typeof schema.additionalProperties === 'object' ? type(schema.additionalProperties) : 'unknown'}>`;
  } else value = { string: 'string', integer: 'number', number: 'number', boolean: 'boolean' }[schema.type] ?? 'unknown';
  return schema.nullable ? `${value} | null` : value;
}

function object(schema) {
  return `{\n${Object.entries(schema.properties ?? {}).map(([name, property]) =>
    `  ${JSON.stringify(name)}${schema.required?.includes(name) ? '' : '?'}: ${type(property)};`).join('\n')}\n}`;
}

const output = '// Generated from backend-openapi.json by tools/backend-contract.mjs. Do not edit.\n\n'
  + Object.entries(spec.components.schemas).map(([name, schema]) => `export type ${name} = ${type(schema)};`).join('\n\n') + '\n';
if (process.argv.includes('--generate')) writeFileSync(resolve(root, 'tests/contracts/backend.generated.ts'), output);
else if (read('tests/contracts/backend.generated.ts').replaceAll('\r\n', '\n') !== output)
  throw new Error('Generated contract differs. Run npm run contract:generate after reviewing OpenAPI.');

// Cross-repo CI can supply the exact backend checkout; no network or guessed branch.
const index = process.argv.indexOf('--backend-file');
if (index >= 0) {
  const upstream = JSON.parse(readFileSync(resolve(process.argv[index + 1]), 'utf8'));
  if (JSON.stringify(upstream) !== JSON.stringify(spec)) throw new Error('Backend/frontend OpenAPI drift detected.');
}
console.log(`Backend contract OK: ${Object.keys(spec.components.schemas).length} schemas; base ${manifest.baseCommit}; ${manifest.sourceState}.`);
