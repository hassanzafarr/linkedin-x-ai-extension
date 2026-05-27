# Production Deploy Plan — EngageFlow AI Extension

## Phase 1: Code Hardening ✅

- [x] **API key handling** — moved to `chrome.storage.local`, auto-migrate from sync on first read. Bring-your-own-key model retained for v1.
- [x] **Tighten host check** in `src/lib/linkedinScraper.js` — strict `Set`, https-only, slug regex.
- [x] **Add `sender.id` check** in `src/background/service-worker.js` onMessage handler.
- [x] **Remove `homepage_url: "https://github.com/"`** placeholder.
- [x] **CSP review** — no `content_security_policy` override, MV3 default strict applies. No `unsafe-eval`/`unsafe-inline` anywhere.
- [x] Strip `console.log` debug noise from `claude.js`, `composerInjector.js`, `service-worker.js` parse error path.

## Phase 2: Build + Quality ✅

- [x] Unit tests green — 75 pass, 3 skip
- [x] E2E tests green — 6/6 (Playwright)
- [x] `npm run build` clean, no warnings
- [x] `dist/` size 532 KB total (well under 5 MB)
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

- [ ] LinkedIn — reply, composer, scrape profile all paths
- [ ] X/Twitter — reply, composer paths
- [ ] Side panel — compose, history, calendar, schedule modal
- [ ] Intent picker — every intent variant
- [ ] Hook library / refine panel / variant tabs
- [ ] Thread builder
- [ ] Error states — invalid API key, 429 rate limit, network fail, Anthropic 5xx
- [ ] Logout / key rotation flow
- [ ] DOM selectors resilient — LinkedIn/X change layout often

## Phase 4: Privacy + Legal

- [ ] **Privacy Policy** published (required by Chrome Web Store) — what data collected, sent where (Anthropic API), retention
- [ ] **Terms of Service** page
- [ ] Disclose scraping behavior in store listing
- [ ] Review LinkedIn ToS — automated scraping risk for users
- [ ] Review X ToS
- [ ] Anthropic usage policy compliance (no abuse, no PII bulk processing)
- [ ] GDPR — data export/delete if EU users
- [ ] Cookie/tracking disclosure if analytics added

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

1. Privacy policy URL live
2. Real `homepage_url` in manifest
3. API key UX — bring-your-own vs proxy decision
4. Permission justifications written
5. LinkedIn/X ToS legal review
