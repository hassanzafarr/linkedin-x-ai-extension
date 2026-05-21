import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import ReplyPanel from '../components/ReplyPanel.jsx';

const HOST_ID = 'draftly-reply-host';

let currentRoot = null;
let currentHost = null;
let outsideClickHandler = null;

export function mountReplyPanel(postText, platform, anchorNode) {
  unmountReplyPanel();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    overflow: visible;
  `;

  const shadow = host.attachShadow({ mode: 'open' });

  // Inject Tailwind CSS into shadow DOM via a link to the web-accessible resource
  const style = document.createElement('style');
  style.textContent = getShadowStyles();
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  mountPoint.id = 'draftly-panel-root';
  shadow.appendChild(mountPoint);

  document.body.appendChild(host);
  currentHost = host;

  // Position panel near the anchor
  const rect = anchorNode.getBoundingClientRect();
  mountPoint.style.cssText = `
    position: fixed;
    top: ${Math.min(rect.bottom + 8, window.innerHeight - 380)}px;
    left: ${Math.max(rect.left, 8)}px;
    width: 380px;
    z-index: 2147483647;
  `;

  currentRoot = createRoot(mountPoint);
  currentRoot.render(
    createElement(ReplyPanel, {
      postText,
      platform,
      onClose: unmountReplyPanel,
    })
  );

  // Close on outside click
  outsideClickHandler = (e) => {
    if (!host.contains(e.target) && e.target !== anchorNode) {
      unmountReplyPanel();
    }
  };
  setTimeout(() => document.addEventListener('click', outsideClickHandler), 100);
}

export function unmountReplyPanel() {
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler);
    outsideClickHandler = null;
  }
  if (currentRoot) {
    currentRoot.unmount();
    currentRoot = null;
  }
  if (currentHost) {
    currentHost.remove();
    currentHost = null;
  }
}

function getShadowStyles() {
  return `
    *, *::before, *::after { box-sizing: border-box; }
    :host { all: initial; }
    #draftly-panel-root {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #fafafa;
    }
    .panel {
      background: #0a0a0a;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      width: 380px;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .panel-title {
      font-size: 11px;
      font-weight: 600;
      color: #a1a1aa;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .close-btn {
      background: none;
      border: none;
      color: #71717a;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
      line-height: 1;
      transition: color 0.15s;
    }
    .close-btn:hover { color: #fafafa; }
    .loading {
      text-align: center;
      color: #a1a1aa;
      padding: 24px 0;
      font-size: 13px;
    }
    .error {
      color: #f87171;
      font-size: 13px;
      padding: 12px 0;
    }
    .reply-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
    }
    .reply-text {
      font-size: 13px;
      color: #e4e4e7;
      margin-bottom: 10px;
      line-height: 1.55;
    }
    .reply-actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      flex: 1;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn-copy {
      background: transparent;
      color: #e4e4e7;
      border-color: #27272a;
    }
    .btn-copy:hover { background: #27272a; }
    .btn-insert {
      background: #10b981;
      color: white;
    }
    .btn-insert:hover { background: #059669; }
    .btn-copied {
      background: #022c22;
      color: #6ee7b7;
      border-color: #064e3b;
    }
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #27272a;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .no-key-msg {
      font-size: 12px;
      color: #a1a1aa;
      text-align: center;
      padding: 8px 0;
    }
    .no-key-msg a {
      color: #34d399;
      cursor: pointer;
      text-decoration: none;
    }
    .no-key-msg a:hover { text-decoration: underline; }
  `;
}
