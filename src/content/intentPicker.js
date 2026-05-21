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

  // For X: simulate a paste event — this is the most reliable way to trigger
  // X's internal React/Draft.js state update so the Reply button activates.
  if (platform === 'x') {
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(pasteEvent);
      return;
    } catch (e) {
      // fall through to other methods
    }
  }

  // execCommand insertText works for Quill (LinkedIn) and some other editors
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
    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #a1a1aa;
    }
    .close, .icon-btn {
      background: none;
      border: none;
      color: #71717a;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
      transition: color 0.15s;
    }
    .close:hover, .icon-btn:hover { color: #fafafa; }
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

    /* Reply preview */
    .reply-preview {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      line-height: 1.55;
      color: #e4e4e7;
      margin-bottom: 10px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .actions-row {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }
    .action-btn {
      flex: 1;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s, border-color 0.15s;
      text-align: center;
    }
    .action-btn.copy {
      background: transparent;
      color: #e4e4e7;
      border-color: #3f3f46;
    }
    .action-btn.copy:hover { background: #27272a; }
    .action-btn.copied {
      background: #022c22;
      color: #6ee7b7;
      border-color: #064e3b;
    }
    .action-btn.insert {
      background: #10b981;
      color: white;
      border-color: #059669;
    }
    .action-btn.insert:hover { background: #059669; }

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

