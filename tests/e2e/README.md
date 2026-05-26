# E2E tests

Playwright tests load the built extension from `dist/` in a real Chromium instance.

## Run

```bash
npm run build          # produce dist/
npm run test:e2e:install   # one-time: download Chromium
npm run test:e2e
```

## Notes

- Headed mode is required for Chrome extensions (Playwright cannot run them headless).
- Tests use fake/local HTML fixtures rather than hitting real linkedin.com or x.com to avoid auth, ToS issues, and flakiness.
- The `context` fixture spins up a persistent Chromium context with the extension loaded.
- `extensionId` resolves the generated extension id from the service worker URL.
