import { test, expect } from '@playwright/test';

test('all pages, evidence anchors and locally bundled Mermaid work', async ({ page, baseURL }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const failed = [];
  page.on('response', (response) => { if (response.status() >= 400 && response.url().startsWith(baseURL)) failed.push(response.url()); });
  await page.goto('./');
  await expect(page.locator('main h1')).toContainText('玄方篇');
  await page.getByRole('navigation').getByRole('link', { name: '考据报告' }).click();
  await expect(page.locator('.mermaid svg')).toBeVisible();
  await page.locator('.diagram summary').click();
  await expect(page.locator('.diagram details code')).toContainText('flowchart TD');
  await page.getByRole('navigation').getByRole('link', { name: '资料索引' }).click();
  await expect(page.locator('#S35A')).toBeAttached();
  await page.goto('sources/#S35A');
  await expect(page.locator('#s35a-山雨欲来风满楼')).toContainText('山雨');
  expect(new URL(page.url()).pathname).toBe(new URL('sources/', baseURL).pathname);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test('Chinese search, case-insensitive source IDs, empty state and result navigation', async ({ page, baseURL }) => {
  await page.goto('./');
  await page.keyboard.press('/');
  const input = page.getByRole('searchbox');
  await expect(input).toBeFocused();
  await expect(page.locator('#search-status')).toContainText('至少');
  await input.fill('木禺');
  await expect(page.locator('#search-results li').first()).toBeVisible();
  await input.fill('一个肯定不存在的检索词');
  await expect(page.locator('#search-status')).toContainText('没有找到');
  await input.fill('s35a');
  await expect(page.locator('#search-results li').first()).toBeVisible();
  await page.locator('#search-results a').first().click();
  expect(page.url().startsWith(baseURL)).toBe(true);
  const hash = decodeURIComponent(new URL(page.url()).hash.slice(1));
  expect(await page.evaluate((id) => Boolean(document.getElementById(id)), hash)).toBe(true);
});

test('search indexes text beyond the former 1200-character cutoff', async ({ page, request }) => {
  const records = await (await request.get('search-index.json')).json();
  const record = records.find((item) => item.text.length > 1500);
  expect(record).toBeTruthy();
  const query = record.text.slice(-45, -20);
  await page.goto('./');
  await page.keyboard.press('/');
  await expect(page.locator('#search-status')).toContainText('至少');
  await page.getByRole('searchbox').fill(query);
  await expect(page.locator('#search-results')).toContainText(record.title);
  await expect(page.locator('#search-results')).toContainText(query);
});

test('typing while the index loads updates after loading, Escape restores focus', async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route('**/search-index.json', async (route) => { await gate; await route.continue(); });
  await page.goto('./');
  const button = page.getByRole('button', { name: '搜索' });
  await button.click();
  await page.getByRole('searchbox').fill('木禺');
  await expect(page.locator('#search-status')).toContainText('正在加载');
  release();
  await expect(page.locator('#search-results li').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  await expect(button).toBeFocused();
});

test('failed search fetch shows a useful error and retries on reopening', async ({ page }) => {
  let attempts = 0;
  await page.route('**/search-index.json', (route) => ++attempts === 1 ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.continue());
  await page.goto('./');
  await page.keyboard.press('/');
  await expect(page.locator('#search-status')).toContainText('加载失败');
  await page.getByRole('searchbox').fill('梁鸢');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: '搜索' })).toBeFocused();
  await page.keyboard.press('/');
  await expect(page.locator('#search-results li').first()).toBeVisible();
  expect(attempts).toBe(2);
});

test('mobile menu, wide tables and keyboard skip link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('report/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到正文' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const menu = page.getByRole('button', { name: '菜单' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation')).toBeVisible();
  await menu.click();
  await expect(page.getByRole('navigation')).not.toBeVisible();
  const table = page.locator('.table-scroll').first();
  await table.focus();
  await expect(table).toBeFocused();
  expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  const before = await table.evaluate((element) => element.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.mermaid svg')).toBeVisible();
  const diagram = page.getByRole('region', { name: '人物关系图，可横向滚动' });
  await diagram.focus();
  expect(await diagram.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  expect(await page.locator('.mermaid svg').evaluate((element) => element.getBoundingClientRect().width / element.viewBox.baseVal.width)).toBeGreaterThanOrEqual(0.9);
});

test('mobile navigation and complete articles remain usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(baseURL);
    await expect(page.getByRole('button', { name: '搜索' })).not.toBeVisible();
    await page.getByRole('navigation').getByRole('link', { name: '考据报告' }).click();
    await expect(page.locator('main h1')).toContainText('考据报告');
    await expect(page.locator('.mermaid')).toContainText('flowchart TD');
    await page.getByRole('navigation').getByRole('link', { name: '资料索引' }).click();
    await expect(page.locator('#S35A')).toBeAttached();
  } finally { await context.close(); }
});

test('Mermaid failure exposes the diagram source', async ({ page }) => {
  await page.route('**/mermaid.esm.min.mjs', (route) => route.abort());
  await page.goto('report/');
  await expect(page.locator('.diagram details')).toHaveAttribute('open', '');
  await expect(page.locator('.diagram details code')).toBeVisible();
});

test('dark mode renders Mermaid and reduced motion disables smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('report/');
  await expect(page.locator('.mermaid svg')).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  expect(await page.locator('.diagram').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(32, 37, 32)');
});
