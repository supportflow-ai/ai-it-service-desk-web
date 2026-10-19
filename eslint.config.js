import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import { featureDependencies } from './tools/architecture.mjs';

const features = Object.keys(featureDependencies);
const boundaryPolicies = [
  { from: { file: { categories: 'entry' } }, allow: [
    { to: { element: { type: 'app' } } }, { to: { file: { categories: 'entry' } } },
  ] },
  { from: { element: { type: 'app' } }, allow: { to: { element: { types: ['app', 'shared', ...features] } } } },
  { from: { element: { type: 'shared' } }, allow: { to: { element: { type: 'shared' } } } },
  ...features.map((feature) => ({ from: { element: { type: feature } }, allow: { to: { element: { types: [feature, 'shared', ...featureDependencies[feature]] } } } })),
  ...features.map((feature) => ({
    from: { element: { type: `!${feature}` } },
    disallow: { to: { element: { type: feature, fileInternalPath: '!index.ts' } } },
  })),
];

export default tseslint.config(
  { ignores: ['dist', '.cache', 'playwright-report', 'test-results'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.d.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/root-path': import.meta.dirname,
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'shared', pattern: 'src/shared' },
        ...features.map((feature) => ({ type: feature, pattern: `src/features/${feature}` })),
      ],
      'boundaries/files': [{ pattern: 'src/{main,App}.tsx', category: 'entry' }],
      'boundaries/dependency-nodes': ['import', 'export', 'dynamic-import', 'require'],
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
    },
    rules: { 'boundaries/dependencies': ['error', { default: 'disallow', policies: boundaryPolicies }] },
  },
);
