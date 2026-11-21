import { test, expect } from './fixtures';
import { othersPublished, ticketA } from '../tests/fixtures';

// TC-429 and TC-430: the demo viewports (laptop and both tablet orientations) must not scroll the page
// sideways or hide the sign-out control, and a production build must run each role's pages without
// console errors. Wide tables scroll inside their own card, so only the page itself is measured.
const viewports = [
  { name: 'laptop', width: 1366, height: 768, sidebar: 'expanded' },
  { name: 'tablet landscape', width: 1024, height: 768, sidebar: 'expanded' },
  { name: 'tablet portrait', width: 768, height: 1024, sidebar: 'collapsed' },
] as const;

const article = { ...othersPublished, content: '## Các bước\n\n1. Mở **VPN**' };
const pages = [
  ['Requester', '/'], ['Requester', '/tickets/new'], ['Requester', '/requester-dashboard/tickets'],
  ['Requester', `/requester-dashboard/tickets/${ticketA.id}`], ['Requester', '/knowledge'], ['Requester', `/knowledge/${article.id}`],
  ['Agent', '/agent-workspace'], ['Agent', `/agent-workspace/tickets/${ticketA.id}`], ['Agent', '/knowledge/manage'],
  ['Admin', '/admin-panel'], ['Admin', '/agent-workspace'],
] as const;

for (const viewport of viewports) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const [role, path] of pages) {
      test(`${role} ${path.replace(ticketA.id, ':id').replace(article.id, ':id')}: no sideways page scroll, no console errors`, async ({ page, api }) => {
        api.roles = [role];
        api.articles = [article];
        const problems: string[] = [];
        page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') problems.push(`${message.type()}: ${message.text()}`); });
        page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
        await page.addInitScript(() => localStorage.setItem('token', 'restored'));
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
        expect(width.scroll, 'the page must not scroll sideways').toBeLessThanOrEqual(width.client);

        const signOut = await page.getByRole('button', { name: 'Đăng xuất' }).boundingBox();
        expect(signOut, 'the sign-out button is visible').not.toBeNull();
        expect((signOut?.x ?? 0) + (signOut?.width ?? 0), 'the sign-out button is inside the viewport').toBeLessThanOrEqual(viewport.width);

        const sidebar = await page.locator('.ant-layout-sider').first().boundingBox();
        if (viewport.sidebar === 'collapsed') expect(sidebar?.width ?? 0, 'the sidebar folds to icons on a tablet').toBeLessThanOrEqual(80);
        else expect(sidebar?.width ?? 0, 'the sidebar stays open on a laptop').toBeGreaterThanOrEqual(200);

        expect(problems).toEqual([]);
      });
    }
  });
}
