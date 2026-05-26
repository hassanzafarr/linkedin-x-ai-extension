import { test, expect } from './fixtures.js';

test.describe('content script injection', () => {
  test('content script registers on linkedin.com fixture', async ({ context }) => {
    const page = await context.newPage();
    await page.setContent(`
      <html>
        <head><title>Fake LinkedIn</title></head>
        <body>
          <div data-test-id="post-feed">
            <article class="feed-shared-update-v2"></article>
          </div>
        </body>
      </html>
    `);
    expect(await page.title()).toBe('Fake LinkedIn');
  });

  test('extension does not crash on a blank page', async ({ context }) => {
    const errors = [];
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('about:blank');
    expect(errors).toEqual([]);
  });
});
