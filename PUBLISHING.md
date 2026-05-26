# Publishing EngageFlow AI to the Chrome Web Store

This guide covers the complete path from local build to a public listing on the Chrome Web Store, including everything required to make the extension production-ready and pass review.

---

## 1. Pre-Publication Audit

Before touching the store, harden the extension.

### 1.1 Manifest hygiene (`manifest.json`)

Review the following before each release:

| Field | Current | Production guidance |
|-------|---------|---------------------|
| `manifest_version` | 3 | MV3 is mandatory. MV2 listings are no longer accepted. |
| `name` | "EngageFlow AI — AI for LinkedIn & X" | Keep under 45 characters. Avoid trademark terms ("LinkedIn", "X", "Twitter") in the *name itself* — describe the function instead (e.g. "EngageFlow AI — Social Reply Assistant"). LinkedIn/X branding in name = frequent rejection. |
| `version` | 1.0.0 | Must be 1–4 dot-separated integers (`1.0.0` or `1.0.0.1`). Increment on every upload. |
| `description` | present | Max 132 characters. Used in store search. |
| `permissions` | `storage`, `activeTab`, `scripting`, `sidePanel` | Justify each in the listing. Drop any unused. |
| `host_permissions` | linkedin, x, twitter, anthropic | Each one triggers extra review. `api.anthropic.com` host permission can be removed if all API calls go through the service worker via `fetch` (allowed without host permission for non-CORS endpoints) — but Anthropic responses need it, so keep it and justify. |
| `icons` | 16/32/48/128 | All four sizes required. 128×128 is the store icon. |
| `web_accessible_resources` | `assets/*` | Narrow as much as possible. |

Add these fields before submission:

```json
{
  "author": "Your Name or Company",
  "homepage_url": "https://your-landing-page.example",
  "minimum_chrome_version": "116"
}
```

`minimum_chrome_version` should match the lowest Chrome that supports every API you use (Side Panel API requires Chrome 114+).

### 1.2 Code & build checklist

- [ ] `npm run build` produces a clean `dist/` with no warnings.
- [ ] No `console.log` calls left in production code (strip via Vite/terser).
- [ ] No `eval`, `new Function`, or inline `<script>` — MV3 rejects them.
- [ ] No remote code loading. All JS executed by the extension must ship inside the package. Calling APIs is fine; loading scripts from a CDN is not.
- [ ] Content Security Policy is the MV3 default (no `unsafe-eval`, no remote scripts). Do not loosen it unless absolutely required.
- [ ] Source maps are excluded from the uploaded ZIP (keep them locally for debugging).
- [ ] No secrets, API keys, or tokens in the bundle. The Anthropic key must come from the user via the options page and live in `chrome.storage` only.
- [ ] All `fetch` URLs use HTTPS.
- [ ] DOM selectors for LinkedIn / X feeds are wrapped in try/catch — sites change markup constantly and silent breakage is better than thrown errors in users' feeds.
- [ ] Service worker handles `chrome.runtime.onInstalled` and `onStartup` cleanly (no top-level work that assumes a tab exists).

### 1.3 Privacy & data handling

The Chrome Web Store **requires** disclosure of every category of user data the extension touches. EngageFlow AI handles:

- Anthropic API key (user-provided, stored locally in `chrome.storage.local` — never transmitted anywhere except `api.anthropic.com`).
- User voice samples / past posts (stored locally; sent to Anthropic only when generating).
- Post content scraped from LinkedIn / X feeds (sent to Anthropic at generation time; not persisted by the extension).

Required artifacts:

1. **Privacy policy URL** — public, HTTPS, must specifically cover what the extension does. A Notion page, GitHub Pages site, or a `/privacy` route on your landing page works. Required for any extension that handles user-entered content.
2. **Data usage disclosures** in the Web Store dashboard — declare each category (Personally identifiable info: No; Authentication info: Yes — API key; User-generated content: Yes; Web history: No).
3. **Two certification checkboxes** in the dashboard:
   - "I do not sell or transfer user data to third parties outside the approved use cases."
   - "I do not use or transfer user data for purposes unrelated to my item's single purpose."
   - "I do not use or transfer user data to determine creditworthiness or for lending purposes."

### 1.4 Permissions justification

You will be asked, in plain text, to justify each permission. Prepare these answers now:

| Permission | Justification text |
|------------|--------------------|
| `storage` | Save the user's Anthropic API key, voice profile samples, and UI preferences across sessions. |
| `activeTab` | Read the currently focused LinkedIn or X tab so the user can request AI replies for posts they are viewing. |
| `scripting` | Inject reply suggestion overlays and the side panel composer into LinkedIn and X feeds. |
| `sidePanel` | Provide the post drafting composer in Chrome's side panel UI. |
| Host: `linkedin.com`, `x.com`, `twitter.com` | The extension's core function is overlaying AI suggestions on these sites. |
| Host: `api.anthropic.com` | All AI generation runs through Anthropic's Messages API. |
| Remote code | None. All executable code ships inside the package. |

### 1.5 Single purpose

Chrome Web Store requires a "single purpose" statement. Suggested:

> EngageFlow AI helps users draft posts and replies on LinkedIn and X by generating suggestions through the Anthropic Claude API based on the user's writing samples.

Multiple features are fine as long as they all serve one purpose.

---

## 2. Required Listing Assets

Prepare these files before opening the dashboard. The store will not let you submit without them.

### 2.1 Icons

- `icon-128.png` — 128×128, PNG with transparency, the store icon. Already in `icons/`.
- The other sizes (16, 32, 48) are bundled via `manifest.json` for in-browser UI.

### 2.2 Screenshots

- **Required:** at least 1, up to 5.
- **Size:** 1280×800 or 640×400 (1280×800 strongly preferred — sharper).
- **Format:** PNG or JPEG, no alpha.
- **Content:** real product UI. Mock/Photoshopped screens can trigger rejection. Cover: side panel composer, reply card overlay on a post, options page, feed scoring badge.
- **No prohibited content:** no other extensions' UIs, no copyrighted material you don't own (LinkedIn/X UI in the background is acceptable since the extension's purpose is integrating with them).

### 2.3 Promotional tiles (optional but recommended)

- **Small tile:** 440×280 PNG. Shown in store search results. If you skip it, the listing visibility drops sharply.
- **Marquee tile:** 1400×560 PNG. Only used if Google features the extension.

### 2.4 Listing copy

| Field | Length | Notes |
|-------|--------|-------|
| Title | ≤ 45 chars | Avoid trademarks. |
| Summary | ≤ 132 chars | Appears under the title in search. |
| Description | ≤ 16,000 chars | Markdown not supported — plain text with line breaks. Lead with the value proposition, then features, then how it works. |
| Category | — | "Productivity" or "Social & Communication". |
| Language | — | English first; add localized listings later. |

### 2.5 Support

- **Support email** — required. Use a real, monitored address (not your personal one).
- **Support URL** — optional, but a GitHub Issues link or a help page improves trust.

---

## 3. Developer Account & Fees

1. Create a Chrome Web Store developer account at https://chrome.google.com/webstore/devconsole/.
2. Pay the one-time **$5 USD registration fee** (per Google account, lifetime).
3. Verify your developer identity — Google now requires identity verification (name, address, sometimes phone) before your first publish. Allow several days.
4. If publishing under a company name, set the account to "Group publisher" and verify a domain you own via Search Console. This unlocks the publisher badge and reduces phishing-impersonation rejections.

---

## 4. Packaging the Extension

The store accepts a ZIP of the **built** extension — not the source repo.

```powershell
# 1. Clean build
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm ci
npm run build

# 2. Verify dist contains manifest.json at its ROOT (not inside a subfolder)
Get-ChildItem dist | Select-Object Name

# 3. Create the upload ZIP (manifest must be at root of the ZIP)
Compress-Archive -Path dist\* -DestinationPath engageflow-ai-v1.0.0.zip -Force
```

ZIP rules:

- `manifest.json` must be at the **root** of the archive. If you zip the `dist/` folder itself, the manifest ends up one level deep and the store rejects it.
- Strip `.map` files unless you intentionally want them shipped.
- Max ZIP size: 2 GB (you will be nowhere near this).
- No empty directories, no `__MACOSX/`, no `.DS_Store`.

Tag the matching git commit:

```powershell
git tag -a v1.0.0 -m "Chrome Web Store release v1.0.0"
git push origin v1.0.0
```

---

## 5. Submitting to the Chrome Web Store

1. Sign in at https://chrome.google.com/webstore/devconsole/.
2. Click **New item**, upload the ZIP.
3. Fill in the **Store listing** tab: title, summary, description, category, language, screenshots, icon, promo tiles, support email.
4. Fill in **Privacy practices**:
   - Single purpose statement.
   - Permission justifications (one for each, including remote code = "I am not using remote code").
   - Data usage disclosures (categories collected, how they are used, whether sold/transferred).
   - Privacy policy URL.
5. **Distribution**:
   - Visibility: Public, Unlisted, or Private (group of trusted testers).
   - Regions: All, or restrict.
   - Pricing: Free (paid extensions were deprecated; use your own billing if needed).
6. Click **Submit for review**.

### 5.1 Review timeline

- **Typical:** 1–3 business days for an established account.
- **First submission:** 1–3 weeks. New developers and extensions with broad host permissions (`linkedin.com`, `x.com`) get manual review.
- **Common rejection reasons for this extension:**
  - Trademarked terms ("LinkedIn", "Twitter") in the listing title.
  - Insufficient justification for `host_permissions`.
  - Missing or vague privacy policy.
  - Screenshots showing functionality the extension does not actually have.
  - Requesting permissions the code never uses.

### 5.2 If rejected

The rejection email cites a specific policy section. Fix the issue, bump the version (you cannot resubmit the same version number), repackage, and upload as an update. Replies on the same item — do not create a new listing.

---

## 6. Production Readiness Checklist

Beyond Web Store requirements, ship these for real users.

### 6.1 Reliability

- [ ] Service worker re-registers handlers on `onStartup` (MV3 workers die after 30s idle).
- [ ] All `chrome.storage` reads tolerate missing keys (first install, post-update).
- [ ] All Anthropic API calls have:
  - Timeout (e.g. `AbortController` with 30s limit).
  - Retry with exponential backoff on 429 / 5xx.
  - User-visible error states — never a silent failure.
- [ ] Content scripts use `MutationObserver` with debouncing — LinkedIn re-renders the feed aggressively, and unthrottled handlers will spike CPU.
- [ ] Selectors are version-tolerant: prefer `[data-testid]` and stable ARIA roles over class names. Add a single config file mapping site → selectors so they can be updated without code changes elsewhere.

### 6.2 Security

- [ ] API key is **never** logged, sent to analytics, or transmitted anywhere except `api.anthropic.com`.
- [ ] All user content sent to Anthropic is sanitized of obvious PII patterns where reasonable (or disclose clearly in the privacy policy).
- [ ] No `innerHTML` with untrusted content — use `textContent` or DOMPurify if HTML is unavoidable.
- [ ] CSP in `manifest.json` left at MV3 default.
- [ ] No third-party analytics SDKs that load remote code. If you need telemetry, use `fetch` to your own endpoint with anonymized event payloads.

### 6.3 Performance

- [ ] Content bundle (`content.js`) under ~200 KB minified. LinkedIn pages are heavy already.
- [ ] React in the side panel and popup uses production build (`process.env.NODE_ENV === "production"`).
- [ ] No layout thrash from injected overlays — use `position: absolute` over the host site, not insertions that reflow the feed.
- [ ] Lazy-load anything the user does not immediately need (e.g. the voice-training UI in options).

### 6.4 Observability

- [ ] Versioned error logging to `chrome.storage.local` ring buffer (e.g. last 50 errors). Exposed from the options page so users can copy a debug report.
- [ ] Manifest `version` matches `package.json` version matches git tag — automate this with a release script.

### 6.5 Update strategy

- Chrome auto-updates extensions every few hours. There is no rollback. Treat every release as immediately live for the entire user base.
- Keep a `CHANGELOG.md` and mention version changes in the store listing description.
- Test the upgrade path: install the previous version, then load the new build, and verify stored data still works.

### 6.6 Legal

- [ ] Privacy policy live and accurate.
- [ ] Terms of service (recommended even if not required).
- [ ] LICENSE file in the repo (MIT already declared in README).
- [ ] Anthropic Usage Policies acknowledged — your extension is a downstream user of their API and the same content rules apply.
- [ ] Note in the listing: this is an independent product, not affiliated with LinkedIn, X Corp, or Anthropic.

---

## 7. Post-Launch

- Monitor the **Stats** tab in the dev console: installs, weekly users, uninstalls, ratings.
- Respond to reviews within a few days — the store ranks responsiveness.
- Watch for LinkedIn / X markup changes weekly; have a fast-patch path ready.
- Anthropic model deprecations: subscribe to their changelog and pin the model in `src/lib/claude.js` to a specific ID, not a moving alias.

---

## 8. Quick Release Procedure

Once everything above is set up, a release looks like:

```powershell
# 1. Bump version
# Edit manifest.json and package.json to new version, then:
git commit -am "release: v1.0.1"

# 2. Build & package
npm ci
npm run build
Compress-Archive -Path dist\* -DestinationPath engageflow-ai-v1.0.1.zip -Force

# 3. Tag
git tag -a v1.0.1 -m "v1.0.1"
git push origin main --tags

# 4. Upload ZIP at https://chrome.google.com/webstore/devconsole/
# 5. Submit for review
```

That is the entire production-ready publishing flow.
