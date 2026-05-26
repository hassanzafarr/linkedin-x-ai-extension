import { test, expect } from './fixtures.js';

test.describe('extension loads', () => {
  test('service worker registers', async ({ extensionId }) => {
    expect(extensionId).toMatch(/^[a-z]{32}$/);
  });

  test('options page renders', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await expect(page).toHaveTitle(/.+/);
    const body = await page.locator('body').innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test('popup page renders', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    const body = await page.locator('body').innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test('sidepanel page renders', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    const body = await page.locator('body').innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});
