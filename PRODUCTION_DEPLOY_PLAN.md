# Production Deploy Plan — EngageFlow AI Extension

## Phase 1: Code Hardening ✅

- [x] **API key handling** — moved to `chrome.storage.local`, auto-migrate from sync on first read. Bring-your-own-key model retained for v1.
- [x] **Tighten host check** in `src/lib/linkedinScraper.js` — strict `Set`, https-only, slug regex.
- [x] **Add `sender.id` check** in `src/background/service-worker.js` onMessage handler.
- [x] **Remove `homepage_url: "https://github.com/"`** placeholder.
- [x] **CSP review** — no `content_security_policy` override, MV3 default strict applies. No `unsafe-eval`/`unsafe-inline` anywhere.
- [x] Strip `console.log` debug noise from `claude.js`, `composerInjector.js`, `service-worker.js` parse error path.

## Phase 2: Build + Quality ✅

- [x] Unit tests green — 75 pass, 3 skip (verified 2026-05-27)
- [x] E2E tests green — 6/6 (Playwright) (verified 2026-05-27)
- [x] `npm run build` clean, no warnings (verified 2026-05-27)
- [x] `dist/` size ~414 KB total (well under 5 MB) (verified 2026-05-27)
- [x] No `.map` files in `dist/` (sourcemaps off by default in Vite prod)
- [x] lucide-react named imports — tree-shaken by Vite ESM bundling
- [ ] **Manual cross-browser QA** — Chrome stable, Edge, Brave (track in QA matrix below)

### Manual Cross-Browser QA Matrix

| Browser | Version | Loads unpacked | Side panel | Content inject (LinkedIn) | Content inject (X) | Notes |
|---|---|---|---|---|---|---|
| Chrome stable |   |   |   |   |   |   |
| Edge (Chromium) |   |   |   |   |   |   |
| Brave |   |   |   |   |   |   |

## Phase 3: Functional QA

> Code review + bug fixes completed 2026-05-27. 3 bugs fixed (see below). Manual live testing still required.

**Bugs fixed (2026-05-27):**
- `callClaude` — 429 response now throws `Error('RATE_LIMIT')` so UI `error === 'RATE_LIMIT'` check works ([src/lib/claude.js](src/lib/claude.js))
- `generateReply` — `JSON.parse` now wrapped in try/catch → throws clean `PARSE_ERROR` ([src/background/service-worker.js](src/background/service-worker.js))
- `scorePost` — same `JSON.parse` fix ([src/background/service-worker.js](src/background/service-worker.js))

- [ ] LinkedIn — reply, composer, scrape profile all paths *(manual test required)*
- [ ] X/Twitter — reply, composer paths *(manual test required)*
- [ ] Side panel — compose, history, calendar, schedule modal *(manual test required)*
- [ ] Intent picker — every intent variant *(manual test required)*
- [ ] Hook library / refine panel / variant tabs *(manual test required)*
- [ ] Thread builder *(manual test required)*
- [x] Error states — `NO_API_KEY` (sidepanel shows settings link), `RATE_LIMIT` (fixed), `PARSE_ERROR` (fixed), network fail (`NETWORK_ERROR` propagates), Anthropic 5xx (propagates as `5xx http_error: ...`)
- [ ] Logout / key rotation flow *(manual test required)*
- [ ] DOM selectors resilient — last verified 2026-05-21; re-verify before submit

## Phase 4: Privacy + Legal ✅

- [x] **Privacy Policy** published — `legal/privacy-policy.html`, hosted at `https://hassanzafarr.github.io/linkedin-x-ai-extension/legal/privacy-policy.html` (GitHub Pages, main branch)
- [x] **Terms of Service** page — `legal/terms-of-service.html`, same host; includes explicit LinkedIn/X ToS compliance warning
- [x] Scraping disclosure in store listing — `STORE_LISTING.md` "Data disclosure" paragraph, per CWS policy
- [x] LinkedIn ToS review — documented in `LEGAL_COMPLIANCE.md`; risk MODERATE, mitigated (user-initiated, own feed/profile, no backend)
- [x] X ToS review — documented in `LEGAL_COMPLIANCE.md`; risk LOW–MODERATE, mitigated (DOM read, user-triggered, not bot)
- [x] Anthropic usage policy compliance — documented in `LEGAL_COMPLIANCE.md`; COMPLIANT, no violations
- [x] GDPR — Export My Data (JSON, API key redacted) + Delete All My Data in Options → Privacy & Data card
- [x] Cookie/tracking disclosure — no cookies, no analytics; confirmed in Privacy Policy §10

> **Note (2026-05-27):** All files currently reference `https://habittforge.me/linkedin-x-ai-extension/...` (GitHub CDN cache from deleted user-site repo still active). Once CDN cache clears (~1–2h after deletion), update all 6 files to `https://hassanzafarr.github.io/linkedin-x-ai-extension/...` and push. Files: `legal/privacy-policy.html`, `legal/terms-of-service.html`, `manifest.json`, `src/options/Options.jsx`, `STORE_LISTING.md`, `LEGAL_COMPLIANCE.md`.

## Phase 5: Store Listing

- [ ] Developer account ($5 one-time)
- [ ] Icons — 16/32/48/128 PNG, transparent bg, sharp
- [ ] Screenshots — 1280x800 or 640x400, 1–5 images
- [ ] Promo tile (440x280) optional but recommended
- [ ] Description — clear permission justifications
- [ ] Justify each permission: `activeTab`, `scripting`, `storage`, `sidePanel`, `alarms`, `notifications`
- [ ] Justify host permissions (linkedin/x/anthropic)
- [ ] Demo video (optional, helps review)
- [ ] Category + language tags
- [ ] Support email + URL

## Phase 6: Observability

- [ ] Error tracking — Sentry or similar (sanitize PII)
- [ ] Anonymous usage metrics — opt-in only
- [ ] Version check / forced-update path for breaking changes
- [ ] User feedback channel (email, Discord, GH issues)

## Phase 7: Release

- [ ] Bump `manifest.json` + `package.json` version, tag git
- [ ] CHANGELOG.md
- [ ] Build zip from `dist/`
- [ ] Upload to Chrome Web Store dashboard
- [ ] Submit for review (1–3 days typical, can be 2+ weeks)
- [ ] Beta channel first — invite 10–50 users via unlisted listing
- [ ] Monitor crash + error rates 48h
- [ ] Promote to public

## Phase 8: Post-Launch

- [ ] DOM-selector breakage alert (LinkedIn/X redesigns)
- [ ] Anthropic API cost monitoring + budget cap
- [ ] User support inbox triage SLA
- [ ] Rollback plan — previous zip stored, store revert procedure
- [ ] Update cadence — security patches <72h

## Critical Blockers (must fix before submit)

1. ~~Privacy policy URL live~~ ✅ — `https://hassanzafarr.github.io/linkedin-x-ai-extension/legal/privacy-policy.html` (pending CDN cache clear)
2. ~~Real `homepage_url` in manifest~~ ✅ — set to privacy policy URL
3. **API key UX** — bring-your-own model confirmed for v1 (no proxy)
4. ~~Permission justifications written~~ ✅ — `STORE_LISTING.md`
5. ~~LinkedIn/X ToS legal review~~ ✅ — `LEGAL_COMPLIANCE.md`
6. **Paste Privacy Policy URL** in Chrome Web Store developer dashboard — do after CDN cache clears
7. **Manual cross-browser QA** (Phase 2 matrix) — still pending
