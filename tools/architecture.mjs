import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs';

export const featureDependencies = { auth: [], tickets: ['auth'], 'ai-assistance': ['tickets'] };
const slash = (value) => value.replaceAll('\\', '/');
const isTest = (file) => /(?:^|\/)(?:tests|e2e)\//.test(file) || /\.test\.[cm]?[jt]sx?$/.test(file);

/** Parse syntax, including type imports, exports, require and dynamic import. */
export function dependencies(source, filename) {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports = [];
  const calls = [];
  const globals = new Set();
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) imports.push(node.argument.literal.text);
    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require')) {
        const argument = node.arguments[0];
        imports.push(argument && ts.isStringLiteral(argument) ? argument.text : '<computed-import>');
      }
      if (ts.isIdentifier(node.expression)) calls.push(node.expression.text);
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'fetch') calls.push('fetch');
    }
    if (ts.isIdentifier(node) && ['window', 'document', 'localStorage', 'sessionStorage', 'XMLHttpRequest'].includes(node.text)) globals.add(node.text);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return { imports, calls, globals };
}

export function analyzeArchitecture(sources, root = process.cwd()) {
  const normalized = new Map([...sources].map(([name, text]) => [slash(name), text]));
  const config = ts.readConfigFile(path.join(root, 'tsconfig.app.json'), ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  const host = {
    ...ts.sys,
    fileExists: (file) => normalized.has(slash(path.relative(root, file))) || ts.sys.fileExists(file),
    readFile: (file) => normalized.get(slash(path.relative(root, file))) ?? ts.sys.readFile(file),
  };
  const errors = [];
  const graph = new Map();
  for (const [file, source] of normalized) {
    if (!file.startsWith('src/') || file.endsWith('.d.ts') || isTest(file)) continue;
    const feature = file.match(/^src\/features\/([^/]+)\//)?.[1];
    const area = file.split('/')[1];
    const model = /\/model\//.test(file);
    const ui = /\/(?:pages|components)\//.test(file);
    const parsed = dependencies(source, file);
    const edges = [];
    const fail = (reason) => errors.push(`${file}: ${reason}`);
    if (!['app', 'shared', 'features'].includes(area) && !['src/main.tsx', 'src/App.tsx'].includes(file)) fail('Unknown production area');
    if (feature && !Object.hasOwn(featureDependencies, feature)) fail('Feature needs an explicit dependency policy');
    if (parsed.calls.includes('fetch') && !file.startsWith('src/shared/api/')) fail('HTTP outside Shared API');
    if (parsed.globals.has('XMLHttpRequest') && !file.startsWith('src/shared/api/')) fail('HTTP outside Shared API');
    if (model && parsed.globals.size) fail('Browser I/O in model');
    for (const specifier of parsed.imports) {
      if (specifier === '<computed-import>') { fail('Computed dependency cannot be verified'); continue; }
      if (/^(axios|node-fetch|cross-fetch|ky)(\/|$)/.test(specifier) && !file.startsWith('src/shared/api/')) fail('HTTP implementation outside Shared API');
      if (model && /^(react|react-dom|antd|react-router-dom|@tanstack\/react-query)(\/|$)/.test(specifier)) fail('UI dependency in model');
      const resolved = ts.resolveModuleName(specifier, path.join(root, file), options, host).resolvedModule;
      if (!resolved) { if (specifier.startsWith('@/') || specifier.startsWith('.')) fail(`Unresolved dependency ${specifier}`); continue; }
      if (resolved.isExternalLibraryImport) continue;
      const target = slash(path.relative(root, resolved.resolvedFileName));
      if (isTest(target)) fail('Production imports test/mock');
      if (!target.startsWith('src/')) continue;
      edges.push(target);
      const targetArea = target.split('/')[1];
      const targetFeature = target.match(/^src\/features\/([^/]+)\//)?.[1];
      if (['src/main.tsx', 'src/App.tsx'].includes(file) && targetArea !== 'app' && target !== 'src/App.tsx') fail('Entry imports outside App');
      if (area === 'shared' && targetArea !== 'shared') fail('Shared imports a higher layer');
      if (feature && !['shared', 'features'].includes(targetArea)) fail('Feature imports App/entry');
      if (targetFeature && feature !== targetFeature) {
        if (target !== `src/features/${targetFeature}/index.ts`) fail('Deep feature import');
        if (feature && !featureDependencies[feature]?.includes(targetFeature)) fail('Feature edge outside allowlist');
      }
      if (feature && target === `src/features/${feature}/index.ts` && file !== target) fail('Internal import of own public index');
      if (ui && /\/features\/[^/]+\/api\//.test(target)) fail('UI imports feature API');
      if (model && (/\/(?:api|hooks|components|pages|lib)\//.test(target) && !target.startsWith('src/shared/lib/'))) fail('Model imports I/O or presentation layer');
      if (/\/api\//.test(file) && /\/(?:hooks|components|pages)\//.test(target)) fail('API imports presentation layer');
    }
    graph.set(file, edges);
  }
  const visited = new Set();
  const stack = [];
  function visit(file) {
    if (stack.includes(file)) { errors.push(`Dependency cycle: ${[...stack.slice(stack.indexOf(file)), file].join(' → ')}`); return; }
    if (visited.has(file)) return;
    visited.add(file); stack.push(file);
    for (const target of graph.get(file) ?? []) visit(target);
    stack.pop();
  }
  for (const file of graph.keys()) visit(file);
  return [...new Set(errors)];
}

export function readProductionSources(root = process.cwd()) {
  const sources = new Map();
  function read(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) read(file);
      else if (/\.[jt]sx?$/.test(file)) sources.set(slash(path.relative(root, file)), fs.readFileSync(file, 'utf8'));
    }
  }
  read(path.join(root, 'src'));
  return sources;
}
