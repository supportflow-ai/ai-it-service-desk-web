import { describe, expect, it } from 'vitest';
import { readServiceCategories, readServiceCategory } from './serviceCatalogContract';

describe('serviceCatalogContract', () => {
  const validCategory = {
    id: 'cat-net',
    code: 'NET',
    name: 'Mạng & Wi-Fi',
    description: 'Sự cố kết nối mạng LAN và Wi-Fi',
    targetTeamId: 'team-net',
    targetTeamName: 'Đội Mạng & Hạ tầng',
    defaultPriority: 'P2' as const,
    targetResolutionHours: 8,
    status: 'active' as const,
    ticketCount: 12,
  };

  it('reads a valid service category', () => {
    expect(readServiceCategory(validCategory)).toEqual(validCategory);
  });

  it('throws on invalid service category', () => {
    expect(() => readServiceCategory(null)).toThrow();
    expect(() => readServiceCategory({ id: 'cat' })).toThrow();
    expect(() => readServiceCategory({ ...validCategory, defaultPriority: 'P99' })).toThrow();
  });

  it('reads a list of service categories', () => {
    expect(readServiceCategories([validCategory])).toEqual([validCategory]);
    expect(readServiceCategories([])).toEqual([]);
    expect(() => readServiceCategories('invalid')).toThrow();
  });
});
