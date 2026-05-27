# Chrome Web Store Listing — EngageFlow AI

## Short Description (132 chars max)
AI reply suggestions and post drafts for LinkedIn & X, in your own voice. Powered by Claude via your own API key.

## Full Description

**EngageFlow AI** is your AI-powered growth co-pilot for LinkedIn and X (Twitter).

### What it does
- **Reply suggestions** — click "Draft Reply" on any post to get 3 AI-generated replies in your own voice
- **Feed Scanner** — highlights high-value posts in your feed worth engaging with
- **Post drafts** — compose original posts with AI assistance in your tone and style
- **Voice Profile** — import your writing style from your own LinkedIn profile so AI matches how you actually write
- **Draft history & scheduling** — save, schedule, and manage posts from the side panel

### How it works
The extension reads visible post content from your LinkedIn and X feeds to generate contextual reply suggestions. When you use the LinkedIn Import feature, it opens your own profile in a background tab and reads your posts to learn your writing style. All AI generation is done via the Anthropic Claude API using **your own API key** — we have no backend and receive none of your data.

### Privacy
- No EngageFlow AI servers — your data never leaves your device (except what you send to Anthropic via your own API key)
- No account required
- No analytics or tracking
- Full data export and deletion available in Settings
- [Privacy Policy](https://hassanzafarr.github.io/linkedin-x-ai-extension/legal/privacy-policy.html)

### Data disclosure (required by Chrome Web Store policy)
This extension reads publicly visible text content from LinkedIn and X pages you are viewing in order to generate AI reply suggestions. When you use the "Import from LinkedIn" feature, the extension opens your LinkedIn profile in a background tab to read your posts and extract your writing style. This data is sent to the Anthropic Claude API using your own API key. No data is transmitted to EngageFlow AI.

### Requirements
- An Anthropic API key (get one at console.anthropic.com)
- Chrome 116+

---

## Category
Productivity

## Language
English

## Privacy Policy URL
https://hassanzafarr.github.io/linkedin-x-ai-extension/legal/privacy-policy.html

## Single Purpose Description (for CWS review)
Generates AI-powered reply suggestions and post drafts for LinkedIn and X using the user's own Anthropic API key and writing style profile.

## Permission Justifications (for CWS review)

| Permission | Justification |
|---|---|
| `storage` | Saves API key, voice profile, draft history, and settings locally |
| `activeTab` | Reads visible post content on the active LinkedIn/X tab when user triggers a reply suggestion |
| `scripting` | Injects the reply panel UI into LinkedIn/X pages |
| `sidePanel` | Displays the main compose, history, and calendar panel |
| `alarms` | Fires scheduled post reminders |
| `notifications` | Notifies user when a scheduled post time arrives |
| `host_permissions: linkedin.com, x.com, twitter.com` | Required to inject content scripts and read DOM content on these platforms |
| `host_permissions: api.anthropic.com` | Required to call the Anthropic Claude API for AI generation |
