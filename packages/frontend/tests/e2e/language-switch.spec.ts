import { expect, test, type Page } from '@playwright/test';

/**
 * UI-only smoke tests for the en/zh switcher. All API calls are mocked; no
 * backend is required. The locale lives in a cookie so the root layout can
 * render the right `lang` attribute on the first response.
 */

const USER = {
  id: 'u1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'ADMIN',
  organizationId: 'o1',
  emailVerified: true,
};

async function fakeSession(page: Page) {
  await page.context().addCookies([
    { name: 'amcp_token', value: 'test-token', domain: 'localhost', path: '/' },
  ]);
  await page.addInitScript((user) => {
    localStorage.setItem('amcp_token', 'test-token');
    localStorage.setItem('amcp_user', JSON.stringify(user));
  }, USER);

  await page.route(/\/api\//, async (route) => {
    const url = route.request().url();
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.includes('/api/users/me/onboarding-state')) return json({ onboardingCompletedAt: '2026-01-01T00:00:00Z' });
    if (url.includes('/api/users/me')) return json(USER);
    if (url.includes('/api/organizations/current')) return json({ id: 'o1', name: 'Acme', createdAt: '2026-01-01' });
    if (url.includes('/api/organizations/mine')) return json([{ id: 'o1', name: 'Acme', role: 'ADMIN', joinedAt: '2026-01-01' }]);
    if (url.includes('/api/license/status')) return json({ plan: 'community', status: 'active' });
    if (url.includes('/api/connectors')) return json([]);
    if (url.includes('/api/audit/stats')) return json({ invocations24h: 0, errors24h: 0 });
    if (url.includes('/api/audit/analytics')) return json({ daily: [], topTools: [], totalInvocations: 0, successRate: 100, avgDuration: 0 });
    return json({});
  });
}

test.describe('language switch', () => {
  test('sign-in page switches to Chinese and persists after a reload', async ({ page }) => {
    await page.route(/\/(api|health)\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        // An empty `{}` makes the sign-in page treat the visitor as the first
        // user and flip to the registration form while the test is switching
        // languages. A populated instance keeps the heading stable.
        body: JSON.stringify({ hasUsers: true, registrationEnabled: false, deploymentMode: 'selfhosted' }),
      }),
    );
    await page.goto('/login');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await page.getByRole('button', { name: '简体中文' }).click();
    await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'amcp_locale')?.value).toBe('zh');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();

    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('the sidebar uses the language stored in the cookie', async ({ page }) => {
    await fakeSession(page);
    await page.context().addCookies([
      { name: 'amcp_locale', value: 'zh', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/');

    const aside = page.locator('aside');
    await expect(aside.getByRole('link', { name: '仪表盘' })).toBeVisible();
    await expect(aside.getByRole('link', { name: '连接器', exact: true })).toBeVisible();
    await expect(aside.getByRole('link', { name: '设置' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  });

  test('workspace page headings follow the stored language', async ({ page }) => {
    await fakeSession(page);
    await page.context().addCookies([
      { name: 'amcp_locale', value: 'zh', domain: 'localhost', path: '/' },
    ]);

    const cases: Array<[string, string]> = [
      ['/analytics', '数据分析'],
      ['/logs', '审计日志'],
      ['/mcp-server', 'MCP 服务'],
      ['/knowledge-graph', '知识图谱'],
    ];
    for (const [path, heading] of cases) {
      await page.goto(path);
      await expect(page.locator('header').getByText(heading, { exact: true })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    }
  });

  test('an unsupported locale cookie falls back to English', async ({ page }) => {
    await page.route(/\/(api|health)\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        // An empty `{}` makes the sign-in page treat the visitor as the first
        // user and flip to the registration form while the test is switching
        // languages. A populated instance keeps the heading stable.
        body: JSON.stringify({ hasUsers: true, registrationEnabled: false, deploymentMode: 'selfhosted' }),
      }),
    );
    await page.context().addCookies([
      { name: 'amcp_locale', value: 'de', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/login');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
