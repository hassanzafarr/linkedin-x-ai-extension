import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import IntentPicker from '../components/IntentPicker.jsx';

const HOST_ID = 'engageflow-intent-host';

let currentRoot = null;
let currentHost = null;
let outsideClickHandler = null;

export function mountIntentPicker({ anchor, postText, platform, composerEl, onClose }) {
  unmountIntentPicker();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    top: 0; left: 0;
    width: 0; height: 0;
    overflow: visible;
  `;
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = pickerStyles();
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);
  document.body.appendChild(host);
  currentHost = host;

  const rect = anchor.getBoundingClientRect();
  const panelWidth = 340;
  const left = Math.max(8, Math.min(window.innerWidth - panelWidth - 8, rect.left));
  const top = rect.bottom + 8;
  mountPoint.style.cssText = `
    position: fixed;
    left: ${left}px;
    top: ${top}px;
    width: ${panelWidth}px;
    z-index: 2147483647;
  `;

  currentRoot = createRoot(mountPoint);
  currentRoot.render(createElement(IntentPicker, {
    postText,
    platform,
    onPick: (reply) => {
      insertIntoComposer(composerEl, reply, platform);
      unmountIntentPicker();
    },
    onClose: () => {
      unmountIntentPicker();
      onClose?.();
    },
  }));

  outsideClickHandler = (e) => {
    if (!host.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) {
      unmountIntentPicker();
    }
  };
  setTimeout(() => document.addEventListener('click', outsideClickHandler), 50);
}

export function unmountIntentPicker() {
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler);
    outsideClickHandler = null;
  }
  if (currentRoot) {
    try { currentRoot.unmount(); } catch {}
    currentRoot = null;
  }
  if (currentHost) {
    currentHost.remove();
    currentHost = null;
  }
}

function insertIntoComposer(el, text, platform) {
  if (!el) return;
  el.focus();

  // execCommand insertText works for both Draft.js (X) and Quill (LinkedIn) since it
  // fires input events the editors listen to. Avoid setting innerText directly,
  // which both editors ignore for their internal model.
  const ok = document.execCommand && document.execCommand('insertText', false, text);
  if (ok) return;

  // Fallback: dispatch InputEvent with data on contenteditable
  const event = new InputEvent('beforeinput', {
    inputType: 'insertText',
    data: text,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(event);

  // Last-resort fallback for X: write into element + fire input
  if (platform === 'x') {
    el.innerText = (el.innerText || '') + text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function pickerStyles() {
  return `
    *, *::before, *::after { box-sizing: border-box; }
    :host { all: initial; }
    .panel {
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      color: #fafafa;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #a1a1aa;
    }
    .close {
      background: none;
      border: none;
      color: #71717a;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
      transition: color 0.15s;
    }
    .close:hover { color: #fafafa; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .intent {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 6px;
      padding: 8px 10px;
      color: #e4e4e7;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      transition: background 0.12s, border-color 0.12s;
    }
    .intent:hover { background: #27272a; border-color: #3f3f46; }
    .intent.selected { background: #10b981; border-color: #059669; color: white; }
    .intent:disabled { opacity: 0.5; cursor: not-allowed; }
    .custom-row {
      grid-column: 1 / -1;
      display: flex;
      gap: 6px;
    }
    .custom-input {
      flex: 1;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 6px;
      padding: 6px 8px;
      color: #fafafa;
      font-size: 12px;
      outline: none;
      transition: border-color 0.15s;
    }
    .custom-input:focus { border-color: #10b981; }
    .status {
      margin-top: 10px;
      font-size: 12px;
      color: #a1a1aa;
      min-height: 16px;
    }
    .status.error { color: #f87171; }
    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #27272a;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-right: 6px;
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
}
