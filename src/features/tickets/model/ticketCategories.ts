import type { TicketCategory } from './ticket.types';

export const ticketCategoryLabels: Record<TicketCategory, string> = {
  ACC: 'Tài khoản & Mật khẩu', NET: 'Mạng & Wi-Fi', VPN: 'VPN', MAIL: 'Email',
  SW: 'Cài đặt phần mềm', HW: 'Phần cứng', PRINT: 'Máy in', ACCESS: 'Cấp quyền truy cập',
  EQUIP: 'Thiết bị phòng họp/văn phòng', SEC: 'Sự cố bảo mật', OTHER: 'Khác',
};
