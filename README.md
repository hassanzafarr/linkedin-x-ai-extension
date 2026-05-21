<p align="center">
  <img src="./icons/logo.png" alt="EngageFlow AI Logo" width="128" height="128" />
</p>

<h1 align="center">EngageFlow AI</h1>

<p align="center">
  <strong>A premium, high-performance social media co-pilot for LinkedIn & X, fully powered by Claude 3.5 Haiku.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-violet?style=for-the-badge" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Model-Claude%203.5%20Haiku-electricblue?style=for-the-badge" alt="Claude 3.5 Haiku" />
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Tailwind-indigo?style=for-the-badge" alt="Stack" />
</p>

---

## ✨ Features

EngageFlow AI is a state-of-the-art browser assistant that helps professionals, developers, and creators scale their social media presence directly within their feeds.

*   ✍️ **Ghostwriter Post Drafting:** Instantly craft professional posts or X threads on the side panel in four distinct tones: *Professional, Casual, Witty, and Thoughtful*.
*   🗣️ **AI-Powered Voice Profiles:** Paste samples of your past writing to train the AI. It will automatically match your unique vocabulary, structure, and pacing in all generation tasks.
*   💬 **Smart Value-Adding Replies:** Hover over any post on LinkedIn or X/Twitter to generate exactly 3 highly relevant reply cards. Suggestions focus on starting questions, professional insights, or specific affirmations—no hollow openers like "Great post!".
*   🔍 **Feed Scanner & Scoring:** Automatically scans your feed to score posts based on engagement potential, highlighting high-value posts that align with your industry (ideal for thought leadership networking).
*   ⚡ **Powered by Claude 3.5 Haiku:** Integrated directly with Anthropic’s fastest compact model for ultra-low latency, highly sophisticated text suggestions.

---

## 🛠️ Tech Stack

*   **Frontend Core:** React 18 & Vite
*   **Styling System:** Vanilla CSS & Tailwind CSS for maximum responsiveness and high-end glassmorphic visuals
*   **Extension Runtime:** Chrome Extension Manifest V3 (Service Worker, Sidepanel API, Content Scripts, Options page)
*   **AI Engine:** Anthropic Messages API (`claude-3-5-haiku-20241022`)

---

## 🚀 Installation & Setup

### 1. Build the Extension
First, install the local dependencies and build the extension package:

```bash
# Install dependencies
npm install

# Compile the extension (production bundle)
npm run build
```

### 2. Load the Unpacked Extension into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer mode** (toggle switch in the top-right corner).
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `dist` directory from this project's root folder.

### 3. Setup Your Claude API Key
1. Go to [console.anthropic.com](https://console.anthropic.com/) to obtain your Anthropic API Key.
2. Open the extension's settings page by clicking the **Settings ⚙️** button inside the EngageFlow popup or by selecting options in Chrome.
3. Paste your Claude API Key (starts with `sk-ant-...`) and save settings.
4. Paste 3–10 of your past posts to initialize your **Voice Profile**.

---

## 📂 Project Structure

```
├── dist/                     # Compiled production extension assets
├── icons/                    # App brand assets & resized logos
│   ├── logo.png              # Master branding image
│   ├── icon-16.png           # 16x16 extension bar icon
│   ├── icon-32.png           # 32x32 context menu icon
│   ├── icon-48.png           # 48x48 extensions list icon
│   └── icon-128.png          # 128x128 Chrome Web Store icon
├── src/
│   ├── background/
│   │   └── service-worker.js # Handles API requests & extension events
│   ├── components/           # Reusable React components (ReplyCards, Editors)
│   ├── content/              # Script injected to render overlays on LinkedIn & X
│   ├── hooks/
│   │   └── useClaude.js      # React hook to communicate with the background worker
│   ├── lib/
│   │   ├── claude.js         # Direct Anthropic Messages fetch service
│   │   ├── prompts.js        # Dynamic prompt engineering templates
│   │   └── storage.js        # Local & sync storage managers
│   ├── options/              # Extension configuration UI settings
│   ├── popup/                # Minimal Chrome extension quick action popup
│   └── sidepanel/            # Complex post creation overlay interface
├── manifest.json             # Extension MV3 configuration & permissions
├── package.json              # Developer scripts & dependencies
└── tailwind.config.js        # Custom Tailwind styling theme
```

---

## 💻 Developer Scripts

In the project directory, you can run:

| Command | Action |
| :--- | :--- |
| `npm run build` | Compiles the production build of the extension into `dist/`. |
| `npm run dev` | Watches all source files and automatically rebuilds into `dist/` on change. |

---

## 🛡️ License

This project is open-source and available under the MIT License.
