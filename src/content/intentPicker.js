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
    isolation: isolate;
  `;
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = pickerStyles();
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  document.body.appendChild(host);
  currentHost = host;

  // ── Stacking context fix for LinkedIn modals ──
  // LinkedIn post modals create a new CSS stacking context (via transform /
  // will-change / isolation) that traps any document.body child behind it.
  // Fix: walk up from the anchor and neutralise any ancestor that has
  // transform or will-change set, so our fixed-position panel can paint
  // above everything.
  breakAncestorStackingContexts(anchor);

  const rect = anchor.getBoundingClientRect();
  const panelWidth = 340;
  const margin = 8;
  const left = Math.max(margin, Math.min(window.innerWidth - panelWidth - margin, rect.left));

  // Flip above the anchor when there isn't enough room below (e.g. comment box
  // near the bottom of the viewport). Cap height and let the panel scroll so it
  // never gets clipped off-screen.
  const spaceBelow = window.innerHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;
  const placeAbove = spaceBelow < 320 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(160, (placeAbove ? spaceAbove : spaceBelow));

  const vEdge = placeAbove
    ? `bottom: ${window.innerHeight - rect.top + margin}px;`
    : `top: ${rect.bottom + margin}px;`;

  mountPoint.style.cssText = `
    position: fixed;
    left: ${left}px;
    ${vEdge}
    width: ${panelWidth}px;
    max-height: ${maxHeight}px;
    overflow-y: auto;
    overscroll-behavior: contain;
    z-index: 2147483647;
  `;

  currentRoot = createRoot(mountPoint);
  currentRoot.render(createElement(IntentPicker, {
    postText,
    platform,
    onPick: (reply) => {
      // IMPORTANT: unmount the popup FIRST so it stops stealing focus,
      // then insert text into the composer with a small delay.
      unmountIntentPicker();
      setTimeout(() => {
        insertIntoComposer(composerEl, reply, platform);
      }, 120);
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

/**
 * Walk up from the anchor and remove CSS properties that create stacking
 * contexts on ancestor elements (transform, will-change, isolation, filter).
 * This allows our fixed-position panel on document.body to paint above
 * LinkedIn's post modals, which otherwise trap child z-index values.
 * We store original values so they could be restored, but in practice
 * LinkedIn re-applies them on next render anyway.
 */
function breakAncestorStackingContexts(anchor) {
  let cur = anchor.parentElement;
  let depth = 0;
  while (cur && cur !== document.body && depth < 30) {
    const cs = window.getComputedStyle(cur);
    // A stacking context is created by: transform != none, will-change
    // containing transform/opacity, isolation:isolate, filter != none.
    if (
      cs.transform !== 'none' ||
      cs.isolation === 'isolate' ||
      cs.filter !== 'none' ||
      (cs.willChange && cs.willChange !== 'auto' && cs.willChange !== '')
    ) {
      if (cs.transform !== 'none') cur.style.transform = 'none';
      if (cs.isolation === 'isolate') cur.style.isolation = 'auto';
      if (cs.filter !== 'none') cur.style.filter = 'none';
      if (cs.willChange && cs.willChange !== 'auto') cur.style.willChange = 'auto';
    }
    cur = cur.parentElement;
    depth++;
  }
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

function findEditorElement(el) {
  if (!el) return null;
  // If el is already contenteditable, use it
  if (el.getAttribute('contenteditable') === 'true') return el;
  // Look for contenteditable child (X wraps the editor in a testid div)
  const child = el.querySelector('[contenteditable="true"]');
  if (child) return child;
  // Look for contenteditable sibling inside the same form/container
  const container = el.closest('[role="dialog"]') || el.closest('form') || el.parentElement;
  if (container) {
    const editor = container.querySelector('div[role="textbox"][contenteditable="true"]');
    if (editor) return editor;
  }
  return el;
}

function findQuillInstance(editor) {
  if (!editor) return null;

  try {
    if (window.Quill?.find) {
      const found = window.Quill.find(editor);
      if (found?.insertText) return found;
    }
  } catch {}

  let cur = editor;
  while (cur && cur !== document.body) {
    if (cur.__quill?.insertText) return cur.__quill;
    cur = cur.parentElement;
  }
  return null;
}

function selectionIsInside(editor) {
  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  return editor.contains(range.startContainer) && editor.contains(range.endContainer);
}

function placeCaretAtEnd(editor) {
  editor.focus();
  if (selectionIsInside(editor)) return;

  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);

  const selection = window.getSelection?.();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function insertWithQuill(editor, text) {
  const quill = findQuillInstance(editor);
  if (!quill) return false;

  quill.focus();
  const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
  if (range.length) quill.deleteText(range.index, range.length, 'user');
  quill.insertText(range.index, text, 'user');
  quill.setSelection(range.index + text.length, 0, 'user');
  return true;
}

function pastePlainText(editor, text) {
  try {
    const before = editor.textContent || '';
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const event = new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    const notCanceled = editor.dispatchEvent(event);
    const changed = (editor.textContent || '') !== before;
    return !notCanceled || changed;
  } catch {
    return false;
  }
}

function execInsertText(editor, text) {
  placeCaretAtEnd(editor);
  if (!document.execCommand) return false;
  const inserted = document.execCommand('insertText', false, text);
  if (inserted) {
    editor.dispatchEvent(new InputEvent('input', {
      inputType: 'insertText',
      data: text,
      bubbles: true,
      composed: true,
    }));
  }
  return inserted;
}

function beforeInputInsertText(editor, text) {
  editor.dispatchEvent(new InputEvent('beforeinput', {
    inputType: 'insertText',
    data: text,
    bubbles: true,
    cancelable: true,
    composed: true,
  }));
}

function insertIntoComposer(el, text, platform) {
  if (!el) return;

  const editor = findEditorElement(el);
  if (!editor) return;
  placeCaretAtEnd(editor);

  if (platform === 'linkedin') {
    if (insertWithQuill(editor, text)) return;
    if (pastePlainText(editor, text)) return;
    if (execInsertText(editor, text)) return;
    beforeInputInsertText(editor, text);
    return;
  }

  if (platform === 'x') {
    if (pastePlainText(editor, text)) return;
    if (execInsertText(editor, text)) return;
    beforeInputInsertText(editor, text);
    return;
  }

  if (pastePlainText(editor, text)) return;
  if (execInsertText(editor, text)) return;
  beforeInputInsertText(editor, text);
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
    .length-row {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px;
      padding: 3px;
      border-radius: 7px;
      background: #18181b;
      border: 1px solid #27272a;
    }
    .length-option {
      min-width: 0;
      height: 28px;
      border: none;
      border-radius: 5px;
      background: transparent;
      color: #a1a1aa;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
    }
    .length-option:hover { color: #fafafa; }
    .length-option.selected { background: #27272a; color: #fafafa; }
    .length-option:disabled { opacity: 0.5; cursor: not-allowed; }
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
