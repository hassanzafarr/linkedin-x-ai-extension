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
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: #1e1b4b;
      border: 1px solid #4c1d95;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      color: #f1f5f9;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #a78bfa;
    }
    .close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .intent {
      background: #312e81;
      border: 1px solid #4338ca;
      border-radius: 8px;
      padding: 8px 10px;
      color: #e0e7ff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: background 0.12s;
    }
    .intent:hover { background: #4338ca; }
    .intent.selected { background: #16a34a; border-color: #15803d; color: white; }
    .custom-row {
      grid-column: 1 / -1;
      display: flex;
      gap: 6px;
    }
    .custom-input {
      flex: 1;
      background: #0f172a;
      border: 1px solid #4338ca;
      border-radius: 8px;
      padding: 6px 8px;
      color: #e0e7ff;
      font-size: 12px;
    }
    .status {
      margin-top: 10px;
      font-size: 12px;
      color: #94a3b8;
      min-height: 16px;
    }
    .status.error { color: #f87171; }
    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #4c1d95;
      border-top-color: #a78bfa;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-right: 6px;
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
}
