# Legal Compliance Notes — EngageFlow AI

Last reviewed: 2026-05-27

---

## LinkedIn Terms of Service

**Relevant clause:** LinkedIn User Agreement §8.2 — "You agree that you will not… scrape or copy profiles and other data from the Services through any means."

**Risk level: MODERATE**

**Mitigating factors:**
- All scraping is user-initiated (user clicks a button or triggers import) — not automated
- Extension only scrapes the authenticated user's own profile during import
- Feed content is read from the user's own session/DOM, not via LinkedIn's API or via crawling
- No data is sent to or stored on EngageFlow AI servers
- No commercial resale of scraped data
- LinkedIn has tolerated similar personal-use browser extensions (e.g., Dux-Soup, Surfe, Shield)

**Relevant case law:**
- *hiQ Labs v. LinkedIn Corp* (9th Cir. 2022) — public profiles may be accessible; CFAA doesn't prohibit scraping publicly accessible data
- Does not directly protect scraping behind login, but reduces overall CFAA exposure

**Accepted risk:** LinkedIn sends cease-and-desist to commercial scrapers operating at scale. A personal Chrome extension used by individual users on their own feeds is substantially lower risk. Store listing discloses the behavior.

**Recommendations:**
- Never add bulk/batch scraping of other users' profiles
- Do not add features that auto-post or auto-reply without explicit user click
- Keep all scraping user-initiated and single-session

---

## X (Twitter) Terms of Service

**Relevant clause:** X ToS — prohibits "accessing or using the Services using unauthorized means, including without limitation bots, scrapers, crawlers, spiders, data mining or harvesting tools."

**Risk level: LOW–MODERATE**

**Mitigating factors:**
- Extension reads DOM content in user's active browser session — not a bot or crawler
- All actions are user-triggered (click a button)
- No automated posting, liking, following, or DMs
- X's enforcement has historically focused on large-scale API abuse and bot networks
- Extension does not interact with X's API (uses Anthropic API only)

**Note:** X (under current ownership) has become more aggressive about scraping enforcement at scale. The extension's use case (single user, in-browser, user-initiated) is far from their enforcement target.

---

## Anthropic Usage Policy Compliance

**Policy:** https://www.anthropic.com/legal/usage-policy

**Status: COMPLIANT** — No violations identified.

Checklist:
- [x] No spam generation — content is for personal use, user posts manually
- [x] No impersonation — voice profile is user's own writing style
- [x] No harassment or harm — reply suggestions only, user reviews before posting
- [x] No CSAM or adult content targeting minors
- [x] No deceptive political content or influence operations
- [x] No privacy violations — processes publicly visible content only
- [x] User controls their own API key — no shared key that could mask abuse
- [x] No automated bulk actions — all AI calls are user-initiated, one at a time

**Action items:**
- Ensure system prompts do not instruct Claude to circumvent platform policies
- Review prompts in `src/lib/prompts.js` periodically for policy drift
- If adding bulk/batch features in future, re-review Anthropic's rate limit and usage policies

---

## GDPR / Privacy Law Compliance

**Applicability:** Extension targets English-speaking professional users; EU users possible.

**Data controller:** The end user (data stays on their device)
**Data processor:** Anthropic (for API calls under user's own key)
**EngageFlow AI role:** Neither controller nor processor — software tool only

**Implemented:**
- [x] Privacy Policy published and linked from extension
- [x] Terms of Service published
- [x] Data export (JSON) available in Options → "Export My Data"
- [x] Data deletion available in Options → "Delete All My Data"
- [x] API key stored in `chrome.storage.local` (not synced, not transmitted to us)
- [x] No cookies, no analytics, no tracking
- [x] Privacy Policy covers GDPR rights (access, erasure, portability, withdrawal)

---

## Chrome Web Store Policy Compliance

**Single purpose:** ✓ AI content assistance for LinkedIn and X
**Data disclosure:** ✓ Store listing includes data handling disclosure
**Permissions justified:** ✓ All permissions documented in STORE_LISTING.md
**Privacy Policy URL:** Must be set in CWS developer dashboard
  → `https://hassanzafarr.github.io/linkedin-x-ai-extension/legal/privacy-policy.html`

**Before submitting:**
1. Host `legal/` folder at the URL above (GitHub Pages or equivalent)
2. Paste Privacy Policy URL in CWS developer dashboard
3. Complete the CWS data use disclosure form (what data is collected, why, sharing)
4. Set extension category to "Productivity"
5. Include scraping disclosure text from STORE_LISTING.md in the full description
