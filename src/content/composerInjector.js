import { mountIntentPicker, unmountIntentPicker } from './intentPicker.js';

const BTN_ATTR = 'data-engageflow-composer-btn';

export function initComposerInjector(platform) {
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
  });
}

function injectLinkedIn() {
  // LinkedIn comment box toolbars contain emoji + image + GIF buttons in a flex row.
  // Comment editor: .comments-comment-box, post composer: .share-box.
  // LinkedIn ships frequent DOM/class changes, so we don't rely on exact toolbar
  // class names. Instead we anchor off the editor, find the action-button row by
  // walking up from a known action button (emoji/photo/GIF), and fall back to a
  // floating button pinned to the editor when no toolbar row can be found.
  const editors = document.querySelectorAll('.ql-editor[contenteditable="true"], .tiptap[contenteditable="true"], div[role="textbox"][contenteditable="true"]');
  editors.forEach(editor => {
    const form = editor.closest(
      'form, .comments-comment-texteditor, .share-creation-state, .comments-comment-box, .comments-comment-box-comment__text-editor'
    ) || editor.parentElement;
    if (!form) return;

    // Skip if we already injected for this editor's form.
    if (form.querySelector(`[${BTN_ATTR}]`)) return;

    const toolbar = findLinkedInToolbar(form, editor);

    const getContext = () => ({
      composerEl: editor,
      postText: findLinkedInPostText(editor),
      platform: 'linkedin',
    });

    const btn = makeIconButton(getContext);

    if (toolbar) {
      // Prepend so our icon is the first visible item (avoids being clipped
      // when overflow:hidden cuts off the last child).
      toolbar.insertBefore(btn, toolbar.firstChild);

      // Fix overflow:hidden on toolbar and up to 4 ancestor levels.
      // LinkedIn's modern DOM wraps toolbars in containers that clip overflow.
      fixOverflowClipping(toolbar);

      // Verify visibility after layout — if still clipped, fall back to floating.
      requestAnimationFrame(() => {
        const rect = btn.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          btn.remove();
          const fallbackBtn = makeIconButton(getContext);
          mountFloatingLinkedInButton(form, editor, fallbackBtn);
        }
      });
    } else {
      mountFloatingLinkedInButton(form, editor, btn);
    }
  });
}

// Locate the LinkedIn comment-box action-button row. Tries known class names,
// then derives the row by walking up from an actual action button.
function findLinkedInToolbar(form, editor) {
  const byClass = form.querySelector(
    '.comments-comment-box__detour-container, .comments-comment-texteditor__detour-button-container, .comments-comment-box-comment__detour-container, .editor-toolbar, .share-creation-state__additional-toolbar'
  );
  if (byClass) return byClass;

  // Find a native action button, then climb to the flex row that holds it.
  const actionBtn = form.querySelector(
    'button[aria-label*="emoji" i], button[aria-label*="image" i], button[aria-label*="photo" i], button[aria-label*="gif" i], button[aria-label*="media" i], button[aria-label*="attach" i]'
  );
  if (actionBtn) {
    // Prefer a parent that contains multiple buttons (the toolbar row).
    let cur = actionBtn.parentElement;
    let depth = 0;
    while (cur && cur !== form && depth < 4) {
      if (cur.querySelectorAll('button').length >= 1 && cur !== editor) return cur;
      cur = cur.parentElement;
      depth++;
    }
    return actionBtn.parentElement;
  }

  return null;
}

// Walk up from the toolbar and set overflow:visible on any ancestor that
// clips content. Limited to 4 levels to avoid breaking unrelated layout.
function fixOverflowClipping(el) {
  let cur = el;
  for (let i = 0; i < 5 && cur && cur !== document.body; i++) {
    const style = window.getComputedStyle(cur);
    if (style.overflow === 'hidden' || style.overflowX === 'hidden') {
      cur.style.overflow = 'visible';
    }
    cur = cur.parentElement;
  }
}

// When no native toolbar exists yet, pin our button to the top-right of the
// editor so it's always reachable inside the open comment box.
function mountFloatingLinkedInButton(form, editor, btn) {
  // Try known class-based anchors first, then walk up to find a suitable
  // positioned ancestor. Fall back to editor's parent or form.
  const anchor = editor.closest('.comments-comment-box-comment__text-editor, .editor-container')
    || editor.parentElement
    || form;
  if (!anchor) return;
  if (window.getComputedStyle(anchor).position === 'static') {
    anchor.style.position = 'relative';
  }
  // Ensure the anchor doesn't clip our button
  fixOverflowClipping(anchor);
  btn.style.position = 'absolute';
  btn.style.top = '4px';
  btn.style.right = '4px';
  btn.style.zIndex = '999';
  anchor.appendChild(btn);
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

const LINKEDIN_POST_SELECTORS = [
  '.feed-shared-update-v2__description',
  '.update-components-text',
  '.feed-shared-inline-show-more-text',
  '.update-components-update-v2__commentary',
  '.feed-shared-text',
  '[data-test-id="main-feed-activity-card__commentary"]',
];

const LINKEDIN_POST_CONTAINERS = [
  '.feed-shared-update-v2',
  '[data-urn]',
  '[data-id]',
  '.fie-impression-container',
  'article',
];

// Resolve the post body text for a LinkedIn comment box.
// Uses two strategies: legacy class-based selectors (for older LinkedIn DOM)
// and structural DOM walk-up (for 2025+ hashed class names).
function findLinkedInPostText(editor) {
  // ── Strategy 1: Legacy class-based selectors ──
  // Works on older LinkedIn DOMs where class names like .update-components-text
  // are still present.
  let cur = editor.parentElement;
  let depth = 0;
  while (cur && cur !== document.body && depth < 25) {
    const isContainer = LINKEDIN_POST_CONTAINERS.some(sel => cur.matches?.(sel));
    if (isContainer) {
      const text = pickLinkedInCommentary(cur, editor);
      if (text) return text;
    }
    cur = cur.parentElement;
    depth++;
  }

  // Fallback: scan up again accepting any commentary match regardless of container.
  cur = editor.parentElement;
  depth = 0;
  while (cur && cur !== document.body && depth < 25) {
    const text = pickLinkedInCommentary(cur, editor);
    if (text) return text;
    cur = cur.parentElement;
    depth++;
  }

  // ── Strategy 2: Structural walk-up for hashed class names (2025+) ──
  // LinkedIn now uses Webpack-hashed class names (e.g. _39580cbd) and
  // Tiptap/ProseMirror editors. No stable CSS class identifies the post text.
  //
  // Approach: walk up from the editor. At each parent, look at sibling
  // subtrees that do NOT contain the editor. The post content area is a
  // sibling of the comments-section ancestor and is typically the longest
  // text block. We use text-length heuristics to distinguish post content
  // (>150 chars with author info + body) from individual comments (<100 chars)
  // and the entire feed (>8000 chars).
  let branch = editor;
  let bestText = '';
  for (let d = 0; d < 25 && branch && branch !== document.body; d++) {
    const parent = branch.parentElement;
    if (!parent) break;

    for (const sibling of parent.children) {
      // Skip the branch that contains the editor
      if (sibling === branch || sibling.contains(editor)) continue;
      // Skip siblings that contain another editor (e.g. nested comment boxes)
      if (sibling.querySelector('[contenteditable="true"]')) continue;

      const raw = (sibling.innerText || '').trim();
      // Too short = buttons, labels, icons. Too long = entire feed.
      if (raw.length < 40 || raw.length > 8000) continue;

      // Prefer the longest candidate — the post content area (author info +
      // post body + social counts) is always longer than a single comment.
      if (raw.length > bestText.length) {
        bestText = raw;
      }
    }

    // Once we have a substantial candidate (post content area typically
    // includes author name + headline + body, so >150 chars), stop climbing
    // to avoid reaching the feed level where other posts become siblings.
    if (bestText.length >= 150) break;

    branch = parent;
  }

  if (bestText) {
    return cleanLinkedInPostText(bestText).slice(0, 2000);
  }

  return '';
}

// Pull commentary text from a post node, ignoring anything inside the comment
// composer/threads so we don't echo the user's own draft or other comments.
function pickLinkedInCommentary(node, editor) {
  for (const sel of LINKEDIN_POST_SELECTORS) {
    const candidates = node.querySelectorAll(sel);
    for (const el of candidates) {
      if (editor.contains(el) || el.contains(editor)) continue;
      if (el.closest('.comments-comment-item, .comments-comment-entity, form')) continue;
      const text = (el.innerText || el.textContent || '').trim();
      if (text) return text;
    }
  }
  return '';
}

// Strip LinkedIn UI chrome from raw innerText so the AI receives cleaner context.
function cleanLinkedInPostText(raw) {
  return raw
    .replace(/^Feed post\s*/i, '')
    // Remove engagement context lines ("X likes this", "X commented", etc.)
    .replace(/^.*?\s+(likes?|loves?|celebrates?|supports?|finds?)\s+this\s*/im, '')
    // Remove trailing action-bar labels
    .replace(/\n\s*(Like|Comment|Share|Send|Repost|Save|Report)\s*(?=\n|$)/gi, '')
    // Remove trailing social counts ("42 likes", "3 comments")
    .replace(/\n\s*\d+\s*(likes?|comments?|reposts?|reactions?)\s*(?=\n|$)/gi, '')
    // Remove "See more" / "…see more" links
    .replace(/(\.\.\.|…)?\s*see more\s*$/gim, '')
    // Remove "Follow" buttons and connection degree
    .replace(/\n\s*Follow\s*(?=\n|$)/gi, '')
    // Collapse excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


function makeIconButton(getContext) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute(BTN_ATTR, 'true');
  btn.setAttribute('aria-label', 'EngageFlow AI reply');
  btn.title = 'EngageFlow AI reply';
  btn.style.cssText = `
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    min-width: 32px;
    box-sizing: border-box;
    border-radius: 9999px;
    border: none;
    background: transparent;
    color: #10b981;
    cursor: pointer;
    margin: 0 2px;
    padding: 0;
    vertical-align: middle;
    overflow: visible;
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
