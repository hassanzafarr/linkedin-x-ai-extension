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
  // Strategy: find every tweetTextarea or contenteditable textbox inside X composers.
  // For each one, walk up to find the nearest toolbar and inject our icon.
  //
  // Verified X.com data-testid values (2026-05-21):
  //   Textarea:  tweetTextarea_0, tweetTextarea_1, etc.
  //   Toolbar:   toolBar
  //   Buttons:   gifButton, emojiButton, mediaClipAllowed, pollButton, scheduleButton, geoButton
  //   ScrollContainer: ScrollSnap-List [role="tablist"]
  //   Submit:    tweetButton / tweetButtonInline

  const textareas = document.querySelectorAll('[data-testid^="tweetTextarea_"]');

  // If no tweetTextarea found, also try contenteditable textboxes inside composer-like containers
  let targets = Array.from(textareas);
  if (targets.length === 0) {
    // Fallback: find contenteditable textboxes that sit near a tweet button (to avoid matching search bars, etc.)
    document.querySelectorAll('div[role="textbox"][contenteditable="true"]').forEach(el => {
      const container = el.closest('div[data-testid="tweetButton"], div[data-testid="tweetButtonInline"]')?.parentElement
        || el.closest('[role="dialog"]');
      if (container || el.closest('form')) {
        targets.push(el);
      }
    });
  }

  targets.forEach(textArea => {
    // ── Skip non-reply composers ──
    // Only inject our button when there's a tweet being replied to.
    // The main "What's happening?" compose box and the /compose/post modal
    // have no tweet text nearby — skip those.
    const dialog = textArea.closest('[role="dialog"]');
    const container = dialog || textArea.closest('[role="main"]') || document.body;
    const hasTweetContext = !!container.querySelector('[data-testid="tweetText"]');
    if (!hasTweetContext) {
      LOG('skipping non-reply composer (no tweet context)', textArea);
      return;
    }

    // Walk up parents to find the nearest toolbar belonging to this composer
    let cur = textArea.parentElement;
    let toolbar = null;
    while (cur && cur !== document.body) {
      // Primary: look for toolBar by data-testid or role
      toolbar = cur.querySelector('[data-testid="toolBar"], [data-testid="toolbar"], [role="toolbar"]');

      // Secondary: look for the ScrollSnap-List tablist (inner toolbar container on X)
      if (!toolbar) {
        toolbar = cur.querySelector('[data-testid="ScrollSnap-List"][role="tablist"]');
      }

      // Tertiary fallback: locate via actual X composer action buttons
      if (!toolbar) {
        const actionIcon = cur.querySelector(
          '[data-testid="gifButton"], [data-testid="emojiButton"], [data-testid="mediaClipAllowed"], [data-testid="geoButton"], [data-testid="pollButton"], [data-testid="scheduleButton"]'
        );
        if (actionIcon) {
          // The action buttons sit inside a flex container; walk up to find it
          toolbar = actionIcon.closest('[data-testid="toolBar"], [data-testid="toolbar"]')
            || actionIcon.parentElement?.parentElement
            || actionIcon.parentElement;
        }
      }
      if (toolbar) break;
      cur = cur.parentElement;
    }

    if (!toolbar) {
      LOG('no toolbar found near textarea', textArea);
      return;
    }
    if (toolbar.querySelector(`[${BTN_ATTR}]`)) return;

    const getContext = () => ({
      composerEl: textArea,
      postText: extractPostTextX(textArea),
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

/**
 * Extract the post text being replied to on X.
 *
 * On X the reply composer (textarea) is NOT inside the <article> element
 * that holds the tweet text — it's a sibling/cousin inside the same
 * dialog or page container. So we:
 *   1. Try the nearest <article> ancestor (works for inline reply)
 *   2. Try the closest dialog or modal container
 *   3. Try the closest cellInnerDiv (timeline cell)
 *   4. Fall back to searching the whole page for the first tweetText
 */
function extractPostTextX(composerNode) {
  // 1. Direct ancestor article
  const article = findNearestArticle(composerNode);
  if (article) {
    const el = article.querySelector('[data-testid="tweetText"]');
    if (el) return (el.innerText || el.textContent || '').trim();
  }

  // 2. Reply dialog / modal — the tweet is in an article inside the same dialog
  const dialog = composerNode.closest('[role="dialog"]');
  if (dialog) {
    const el = dialog.querySelector('[data-testid="tweetText"]');
    if (el) return (el.innerText || el.textContent || '').trim();
  }

  // 3. Walk up looking for a container that holds both the composer and the tweet
  let cur = composerNode.parentElement;
  while (cur && cur !== document.body) {
    const el = cur.querySelector('[data-testid="tweetText"]');
    if (el) return (el.innerText || el.textContent || '').trim();
    // Stop walking if we hit a major landmark
    if (cur.getAttribute('role') === 'main' || cur.tagName === 'MAIN') break;
    cur = cur.parentElement;
  }

  // 4. Last resort — first tweet text on the page (may not be the right one, but better than nothing)
  const fallback = document.querySelector('[data-testid="tweetText"]');
  return fallback ? (fallback.innerText || fallback.textContent || '').trim() : '';
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
