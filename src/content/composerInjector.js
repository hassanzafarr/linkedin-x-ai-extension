import { mountIntentPicker, unmountIntentPicker } from './intentPicker.js';

const BTN_ATTR = 'data-engageflow-composer-btn';
const LOG = (...args) => console.log('[EngageFlow injector]', ...args);

export function initComposerInjector(platform) {
  LOG('init for', platform);
  const scan = () => scanAndInject(platform);
  scan();
  const observer = new MutationObserver(() => {
    clearTimeout(observer._t);
    observer._t = setTimeout(scan, 200);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanAndInject(platform) {
  if (platform === 'x') {
    injectX();
  } else if (platform === 'linkedin') {
    injectLinkedIn();
  }
}

function injectX() {
  // Strategy: find every tweetTextarea_*. For each one, walk up to find the
  // nearest toolbar (supporting both case variations and role="toolbar").
  // Append our icon at the start of that toolbar.
  const textareas = document.querySelectorAll('[data-testid^="tweetTextarea_"]');

  textareas.forEach(textArea => {
    // Walk up parents to find the nearest toolbar belonging to this composer
    let cur = textArea.parentElement;
    let toolbar = null;
    while (cur && cur !== document.body) {
      toolbar = cur.querySelector('[data-testid="toolBar"], [data-testid="toolbar"], [role="toolbar"]');
      if (toolbar) break;
      cur = cur.parentElement;
    }

    if (!toolbar) {
      LOG('no toolbar found near textarea', textArea);
      return;
    }
    if (toolbar.querySelector(`[${BTN_ATTR}]`)) return;

    const article = findNearestArticle(textArea);
    const getContext = () => ({
      composerEl: textArea,
      postText: extractPostText(article, 'x'),
      platform: 'x',
    });

    const btn = makeIconButton(getContext);
    // Prepend so we appear before native icons (matches Teract behavior)
    toolbar.insertBefore(btn, toolbar.firstChild);
    LOG('injected X composer button into toolbar', toolbar);
  });
}

function injectLinkedIn() {
  // LinkedIn comment box toolbars contain emoji + image + GIF buttons in a flex row.
  // Comment editor: .comments-comment-box, post composer: .share-box
  const editors = document.querySelectorAll('.ql-editor[contenteditable="true"], div[role="textbox"][contenteditable="true"]');
  editors.forEach(editor => {
    const form = editor.closest('form, .comments-comment-texteditor, .share-creation-state, .comments-comment-box');
    if (!form) return;
    const toolbar = form.querySelector('.comments-comment-box__detour-container, .editor-toolbar, .display-flex.flex-row, .comments-comment-texteditor__detour-button-container')
      || form.querySelector('button[aria-label*="emoji" i], button[aria-label*="image" i]')?.parentElement;
    if (!toolbar) return;
    if (toolbar.querySelector(`[${BTN_ATTR}]`)) return;

    const post = form.closest('.feed-shared-update-v2, [data-id]') || findNearestArticle(form);

    const getContext = () => ({
      composerEl: editor,
      postText: extractPostText(post, 'linkedin'),
      platform: 'linkedin',
    });

    const btn = makeIconButton(getContext);
    toolbar.appendChild(btn);
  });
}

function findNearestArticle(node) {
  let cur = node;
  while (cur && cur !== document.body) {
    if (cur.tagName === 'ARTICLE') return cur;
    cur = cur.parentElement;
  }
  return null;
}

function extractPostText(postNode, platform) {
  if (!postNode) return '';
  const selector = platform === 'x'
    ? '[data-testid="tweetText"]'
    : '.feed-shared-update-v2__description, .update-components-text';
  const el = postNode.querySelector(selector);
  return el ? (el.innerText || el.textContent || '').trim() : '';
}

function makeIconButton(getContext) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute(BTN_ATTR, 'true');
  btn.setAttribute('aria-label', 'EngageFlow AI reply');
  btn.title = 'EngageFlow AI reply';
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 9999px;
    border: none;
    background: transparent;
    color: #10b981;
    cursor: pointer;
    margin: 0 2px;
    padding: 0;
    transition: background 0.15s;
  `;
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z"/>
      <circle cx="19" cy="4" r="1.2" fill="currentColor"/>
      <circle cx="5"  cy="20" r="1.2" fill="currentColor"/>
    </svg>
  `;
  btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(16,185,129,0.12)'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ctx = getContext();
    mountIntentPicker({
      anchor: btn,
      postText: ctx.postText,
      platform: ctx.platform,
      composerEl: ctx.composerEl,
      onClose: unmountIntentPicker,
    });
  });
  return btn;
}
