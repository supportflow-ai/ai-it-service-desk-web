import { describe, expect, it } from 'vitest';
import { readSupportTeam, readSupportTeams, readTeamMembers } from './supportTeamContract';

describe('supportTeamContract', () => {
  const validTeam = {
    id: 'team-net',
    code: 'NET',
    name: 'Đội Mạng',
    description: 'Xử lý sự cố mạng',
    leadId: 'user-1',
    leadName: 'Trưởng Nhóm Mạng',
    categories: ['NET', 'VPN'],
    memberCount: 5,
    isDefaultTriage: false,
    status: 'active',
    createdAt: '2026-11-01T00:00:00Z',
  };

  const validMember = {
    userId: 'user-1',
    fullName: 'Kỹ thuật viên 1',
    role: 'Lead',
    joinedAt: '2026-11-01T00:00:00Z',
  };

  it('reads valid support team', () => {
    expect(readSupportTeam(validTeam)).toEqual(validTeam);
  });

  it('throws on invalid support team', () => {
    expect(() => readSupportTeam({ id: 123 })).toThrow();
    expect(() => readSupportTeam(null)).toThrow();
    expect(() => readSupportTeam({ ...validTeam, categories: ['INVALID_CAT'] })).toThrow();
  });

  it('reads list of support teams', () => {
    expect(readSupportTeams([validTeam])).toEqual([validTeam]);
    expect(readSupportTeams([])).toEqual([]);
    expect(() => readSupportTeams('not an array')).toThrow();
  });

  it('reads team members', () => {
    expect(readTeamMembers([validMember])).toEqual([validMember]);
    expect(readTeamMembers([])).toEqual([]);
    expect(() => readTeamMembers([{ role: 'Invalid' }])).toThrow();
  });
});
