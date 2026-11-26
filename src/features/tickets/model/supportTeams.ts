import type { TicketCategory } from './ticket.types';

export interface SupportTeam {
  id: string;
  code: string;
  name: string;
  description: string;
  leadName?: string;
}

export const SUPPORT_TEAMS: readonly SupportTeam[] = [
  {
    id: 'team-triage',
    code: 'TRIAGE',
    name: 'Hàng đợi phân loại chung (Triage)',
    description: 'Tiếp nhận, phân loại và điều phối phiếu ban đầu',
  },
  {
    id: 'team-l1',
    code: 'L1',
    name: 'IT Helpdesk Cấp 1',
    description: 'Hỗ trợ người dùng trực tiếp, xử lý sự cố cơ bản, phần cứng và văn phòng',
    leadName: 'Trần Văn L1',
  },
  {
    id: 'team-network',
    code: 'NET',
    name: 'Đội Mạng & Hạ tầng',
    description: 'Xử lý sự cố mạng, Wi-Fi, VPN, firewall và thiết bị mạng',
    leadName: 'Nguyễn Văn Mạng',
  },
  {
    id: 'team-software',
    code: 'SW',
    name: 'Đội Phần mềm & Hệ thống',
    description: 'Hỗ trợ phần mềm ứng dụng, tài khoản nội bộ, email và hệ thống nghiệp vụ',
    leadName: 'Lê Thị Phần Mềm',
  },
  {
    id: 'team-security',
    code: 'SEC',
    name: 'Đội An ninh thông tin & Bảo mật',
    description: 'Quản lý quyền truy cập, kiểm tra sự cố bảo mật, mã độc và chính sách IAM',
    leadName: 'Phạm Bảo Mật',
  },
  {
    id: 'team-hardware',
    code: 'HW',
    name: 'Đội Phần cứng & Thiết bị văn phòng',
    description: 'Sửa chữa, cấp phát, bảo trì máy tính, máy in và thiết bị phòng họp',
    leadName: 'Vũ Phần Cứng',
  },
];

export const CATEGORY_TEAM_ROUTING: Record<TicketCategory, string> = {
  ACC: 'team-software',
  NET: 'team-network',
  VPN: 'team-network',
  MAIL: 'team-software',
  SW: 'team-software',
  HW: 'team-hardware',
  PRINT: 'team-hardware',
  ACCESS: 'team-security',
  EQUIP: 'team-hardware',
  SEC: 'team-security',
  OTHER: 'team-l1',
};

export function getSupportTeam(teamId: string | null | undefined): SupportTeam | undefined {
  if (!teamId) return undefined;
  return SUPPORT_TEAMS.find((team) => team.id === teamId);
}

export function suggestSupportTeamByCategory(category: TicketCategory): SupportTeam {
  const targetId = CATEGORY_TEAM_ROUTING[category] ?? 'team-triage';
  return getSupportTeam(targetId) ?? SUPPORT_TEAMS[0]!;
}
