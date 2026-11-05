import {
  FormOutlined,
  LockOutlined,
  PaperClipOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeSwitch } from '../layouts/ThemeSwitch';

interface Feature { icon: ReactNode; title: string; text: string }

const features: readonly Feature[] = [
  { icon: <FormOutlined />, title: 'Gửi và theo dõi yêu cầu', text: 'Chọn danh mục, mô tả sự cố và xem trạng thái của yêu cầu từ lúc gửi đến khi đóng.' },
  { icon: <UnorderedListOutlined />, title: 'Hàng đợi cho kỹ thuật viên', text: 'Lọc theo trạng thái, danh mục và mức ưu tiên; nhận xử lý hoặc phân công ngay trong không gian làm việc.' },
  { icon: <LockOutlined />, title: 'Trao đổi và ghi chú nội bộ', text: 'Bình luận công khai với người yêu cầu. Ghi chú nội bộ chỉ kỹ thuật viên và quản trị viên nhìn thấy.' },
  { icon: <PaperClipOutlined />, title: 'Tệp đính kèm', text: 'Đính kèm PDF, PNG, JPG, DOCX, TXT hoặc ZIP, tối đa 10 MB mỗi tệp.' },
];

const upcoming: readonly Pick<Feature, 'title' | 'text'>[] = [
  { title: 'Gợi ý phân loại bằng AI', text: 'Kỹ thuật viên sẽ nhận gợi ý danh mục, mức ảnh hưởng và mức khẩn cấp để xem xét. Mọi quyết định vẫn do con người duyệt.' },
  { title: 'Kho tri thức', text: 'Bài viết hướng dẫn để tự tìm câu trả lời trước khi gửi yêu cầu.' },
];

const steps = [
  { title: 'Gửi yêu cầu', text: 'Người yêu cầu mô tả sự cố, chọn danh mục và đính kèm tệp nếu cần.' },
  { title: 'Tiếp nhận và xử lý', text: 'Kỹ thuật viên nhận hoặc được phân công, trao đổi và cập nhật trạng thái.' },
  { title: 'Giải quyết và xác nhận', text: 'Khi đã giải quyết, người yêu cầu đóng yêu cầu, hoặc mở lại nếu vấn đề chưa ổn.' },
];

const roles = [
  { title: 'Người yêu cầu', items: ['Gửi và theo dõi yêu cầu của mình', 'Bình luận và đính kèm tệp', 'Đóng hoặc mở lại khi đã giải quyết'] },
  { title: 'Kỹ thuật viên', items: ['Xem hàng đợi, nhận xử lý hoặc phân công', 'Trao đổi với người yêu cầu', 'Ghi chú nội bộ và đánh dấu đã giải quyết'] },
  { title: 'Quản trị viên', items: ['Có đầy đủ quyền của kỹ thuật viên', 'Thao tác thay chủ yêu cầu: sửa, đóng, mở lại, hủy'] },
];

/** Static three-row preview of the queue. Placeholder bars stand in for text, so it shows no invented tickets. */
function QueuePreview() {
  const rows = [
    { label: 'Đã gửi', tone: 'neutral' },
    { label: 'Đang xử lý', tone: 'info' },
    { label: 'Đã giải quyết', tone: 'ok' },
  ] as const;
  return (
    <div className="lp-preview" aria-hidden="true">
      <div className="lp-preview-bar"><span /><span /><span /></div>
      {rows.map((row) => (
        <div className="lp-preview-row" key={row.label}>
          <div className="lp-preview-lines"><i className="lp-ph lp-ph-short" /><i className="lp-ph" /></div>
          <span className={`lp-chip lp-chip-${row.tone}`}>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="lp">
      <a className="lp-skip" href="#noi-dung">Bỏ qua tới nội dung</a>

      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <Link to="/" className="lp-brand" aria-label="SupportFlow — IT Service Desk">
            <span className="lp-brand-name">Support<span>Flow</span></span>
            <span className="lp-brand-sub">IT Service Desk</span>
          </Link>
          <nav className="lp-nav" aria-label="Các phần của trang">
            <a href="#tinh-nang">Tính năng</a>
            <a href="#quy-trinh">Quy trình</a>
            <a href="#vai-tro">Vai trò</a>
          </nav>
          <div className="lp-actions">
            <ThemeSwitch />
            <Link to="/login" className="lp-btn lp-btn-secondary">Đăng nhập</Link>
            <Link to="/register" className="lp-btn lp-btn-primary lp-hide-narrow">Đăng ký</Link>
          </div>
        </div>
      </header>

      <main id="noi-dung">
        <section className="lp-hero">
          <div className="lp-container lp-hero-inner">
            <div className="lp-hero-copy">
              <h1>Gửi yêu cầu IT một lần, theo dõi đến khi xong</h1>
              <p className="lp-lead">
                SupportFlow là hệ thống IT Service Desk nội bộ: nhân viên gửi yêu cầu hỗ trợ, kỹ thuật viên tiếp nhận và xử lý có thứ tự,
                mọi trao đổi được lưu lại ở một nơi.
              </p>
              <div className="lp-cta">
                <Link to="/login" className="lp-btn lp-btn-primary">Đăng nhập</Link>
                <Link to="/register" className="lp-btn lp-btn-secondary">Tạo tài khoản</Link>
              </div>
              <p className="lp-note">Tài khoản mới mặc định là Người yêu cầu.</p>
            </div>
            <div className="lp-hero-visual">
              <QueuePreview />
              <p className="lp-caption">Hình minh họa</p>
            </div>
          </div>
        </section>

        <section id="tinh-nang" className="lp-section" aria-labelledby="tinh-nang-title">
          <div className="lp-container">
            <h2 id="tinh-nang-title">Mọi thứ cho một vòng đời yêu cầu</h2>
            <p className="lp-section-lead">Những gì bạn dùng được ngay hôm nay.</p>
            <ul className="lp-grid lp-grid-4">
              {features.map((feature) => (
                <li className="lp-card" key={feature.title}>
                  <span className="lp-icon" aria-hidden="true">{feature.icon}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </li>
              ))}
            </ul>

            <h3 className="lp-subhead">Đang phát triển</h3>
            <ul className="lp-grid lp-grid-2">
              {upcoming.map((item) => (
                <li className="lp-card lp-card-soon" key={item.title}>
                  <span className="lp-soon">Sắp có</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="quy-trinh" className="lp-section lp-section-alt" aria-labelledby="quy-trinh-title">
          <div className="lp-container">
            <h2 id="quy-trinh-title">Từ lúc gửi đến khi xong</h2>
            <ol className="lp-grid lp-grid-3 lp-steps">
              {steps.map((step, index) => (
                <li className="lp-card" key={step.title}>
                  <span className="lp-step-no" aria-hidden="true">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="vai-tro" className="lp-section" aria-labelledby="vai-tro-title">
          <div className="lp-container">
            <h2 id="vai-tro-title">Mỗi vai trò làm đúng việc của mình</h2>
            <ul className="lp-grid lp-grid-3">
              {roles.map((role) => (
                <li className="lp-card" key={role.title}>
                  <h3>{role.title}</h3>
                  <ul className="lp-list">
                    {role.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-final" aria-labelledby="bat-dau-title">
          <div className="lp-container lp-final-inner">
            <h2 id="bat-dau-title">Bắt đầu gửi yêu cầu đầu tiên</h2>
            <div className="lp-cta lp-cta-center">
              <Link to="/register" className="lp-btn lp-btn-primary">Tạo tài khoản</Link>
              <Link to="/login" className="lp-btn lp-btn-secondary">Đăng nhập</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <span>SupportFlow AI · IT Service Desk</span>
          <span>
            <Link to="/login">Đăng nhập</Link> · <Link to="/register">Đăng ký</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
