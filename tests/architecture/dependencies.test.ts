import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { analyzeArchitecture, dependencies, readProductionSources } from '../../tools/architecture.mjs';

describe('architecture', () => {
  it('keeps the real production graph within its boundaries and acyclic', () => {
    expect(analyzeArchitecture(readProductionSources())).toEqual([]);
  });
  it.each([
    ['src/shared/lib/bad.ts', "import { useAuth } from '@/features/auth';", 'Shared imports'],
    ['src/features/auth/model/bad.ts', "import config from '@/app/config';", 'Feature imports'],
    ['src/app/bad.ts', "import type { User } from '@/features/auth/model/auth.types';", 'Deep feature'],
    ['src/features/tickets/model/bad.ts', "export { sessionStore } from '../../auth/lib/sessionStore';", 'Deep feature'],
    ['src/shared/lib/bad.ts', "export const page = () => import('@/features/tickets');", 'Shared imports'],
    ['src/features/auth/pages/bad.ts', "import { authApi } from '../api/authApi';", 'UI imports'],
    ['src/features/auth/model/bad.ts', "import { useState } from 'react';", 'UI dependency'],
    ['src/features/auth/model/bad.ts', 'const token = localStorage.getItem("token");', 'Browser I/O'],
    ['src/shared/lib/bad.ts', "import { user } from '../../../tests/fixtures';", 'Production imports'],
    ['src/features/auth/lib/bad.ts', "import { TicketCategory } from '@/features/tickets';", 'outside allowlist'],
    ['src/features/tickets/hooks/bad.ts', "import { useAuth } from '../index';", 'own public index'],
    ['src/features/auth/pages/bad.ts', 'fetch("/api/auth/me");', 'HTTP outside'],
  ])('rejects %s: %s', (file, source, message) => {
    expect(analyzeArchitecture(new Map([[file, source]])).join('\n')).toContain(message);
  });
  it('parses type import expressions and computed dynamic imports', () => {
    expect(dependencies("type User = import('@/features/auth').User; import(target);", 'example.ts').imports)
      .toEqual(['@/features/auth', '<computed-import>']);
  });
  it('detects cycles through imports and re-exports', () => {
    const sources = new Map([
      ['src/shared/lib/a.ts', "export { b } from './b'; export const a = 1;"],
      ['src/shared/lib/b.ts', "import { a } from './a'; export const b = a;"],
    ]);
    expect(analyzeArchitecture(sources).join('\n')).toContain('Dependency cycle');
  });
  it('allows local internals and approved public feature imports', () => {
    expect(analyzeArchitecture(new Map([
      ['src/features/tickets/model/example.ts', "import type { User } from '@/features/auth';"],
      ['src/app/example.ts', "export { TicketListPage } from '@/features/tickets';"],
    ]))).toEqual([]);
  });
  it('ESLint boundaries rejects an alias deep import and a relative upward import', async () => {
    const eslint = new ESLint();
    for (const [filePath, source] of [
      ['src/app/bootstrap.ts', "import { sessionStore } from '@/features/auth/lib/sessionStore';"],
      ['src/shared/api/apiClient.ts', "import config from '../../app/config';"],
    ]) {
      const results = await eslint.lintText(source ?? '', { filePath });
      expect(results.flatMap((result) => result.messages).some((message) => message.ruleId === 'boundaries/dependencies')).toBe(true);
    }
  });
});
