import { describe, expect, it } from 'vitest';
import { TicketCategory } from './ticket.types';
import {
  CATEGORY_TEAM_ROUTING,
  getSupportTeam,
  SUPPORT_TEAMS,
  suggestSupportTeamByCategory,
} from './supportTeams';

describe('supportTeams model', () => {
  it('contains all standard support teams from ADR-016', () => {
    const ids = SUPPORT_TEAMS.map((t) => t.id);
    expect(ids).toContain('team-triage');
    expect(ids).toContain('team-l1');
    expect(ids).toContain('team-network');
    expect(ids).toContain('team-software');
    expect(ids).toContain('team-security');
    expect(ids).toContain('team-hardware');
  });

  it('retrieves support team by id', () => {
    const team = getSupportTeam('team-network');
    expect(team).toBeDefined();
    expect(team?.name).toBe('Đội Mạng & Hạ tầng');
    expect(team?.code).toBe('NET');

    expect(getSupportTeam(undefined)).toBeUndefined();
    expect(getSupportTeam(null)).toBeUndefined();
    expect(getSupportTeam('non-existent')).toBeUndefined();
  });

  it('suggests appropriate team based on ticket category', () => {
    expect(suggestSupportTeamByCategory(TicketCategory.NET).id).toBe('team-network');
    expect(suggestSupportTeamByCategory(TicketCategory.VPN).id).toBe('team-network');
    expect(suggestSupportTeamByCategory(TicketCategory.SW).id).toBe('team-software');
    expect(suggestSupportTeamByCategory(TicketCategory.MAIL).id).toBe('team-software');
    expect(suggestSupportTeamByCategory(TicketCategory.ACC).id).toBe('team-software');
    expect(suggestSupportTeamByCategory(TicketCategory.SEC).id).toBe('team-security');
    expect(suggestSupportTeamByCategory(TicketCategory.ACCESS).id).toBe('team-security');
    expect(suggestSupportTeamByCategory(TicketCategory.HW).id).toBe('team-hardware');
    expect(suggestSupportTeamByCategory(TicketCategory.PRINT).id).toBe('team-hardware');
    expect(suggestSupportTeamByCategory(TicketCategory.EQUIP).id).toBe('team-hardware');
    expect(suggestSupportTeamByCategory(TicketCategory.OTHER).id).toBe('team-l1');
  });

  it('covers all categories in CATEGORY_TEAM_ROUTING', () => {
    for (const category of Object.values(TicketCategory)) {
      expect(CATEGORY_TEAM_ROUTING[category]).toBeDefined();
    }
  });
});
