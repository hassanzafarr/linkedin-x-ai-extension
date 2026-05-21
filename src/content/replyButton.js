import { mountReplyPanel, unmountReplyPanel } from './replyPanel.js';

const TRIGGER_ATTR = 'data-draftly-trigger';

export function initReplyButtons(platform, config) {
  const scan = () => scanAndInject(platform, config);
  
  // Initial scan
  scan();

  // Watch for dynamic insertions (scrolling, new tweets, modals loading)
  const observer = new MutationObserver(() => {
    clearTimeout(observer._t);
    observer._t = setTimeout(scan, 200);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanAndInject(platform, config) {
  const posts = document.querySelectorAll(config.feedPostSelector);

  posts.forEach(post => {
    if (post.querySelector(`[${TRIGGER_ATTR}]`)) return;

    const anchor = post.querySelector(config.replyButtonAnchor);
    if (!anchor) return;

    // Find the best injection container:
    // On X, the reply button is deeply nested inside wrapper divs with overflow:hidden.
    // We need to find the [role="group"] action bar and append there.
    let actionBar;
    if (platform === 'x') {
      // The action bar on X uses [role="group"] and contains reply, retweet, like, share, views
      actionBar = anchor.closest('[role="group"]');
    }
    // Fallback: use the anchor's parent
    if (!actionBar) {
      actionBar = anchor.parentElement;
    }
    if (!actionBar) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute(TRIGGER_ATTR, 'true');
    btn.title = 'EngageFlow AI Reply';
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
      transition: background 0.15s, transform 0.1s;
      vertical-align: middle;
      flex-shrink: 0;
    `;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z"/>
        <circle cx="19" cy="4" r="1.2" fill="currentColor"/>
        <circle cx="5"  cy="20" r="1.2" fill="currentColor"/>
      </svg>
    `;

    btn.addEventListener('mouseenter', () => { 
      btn.style.background = 'rgba(16, 185, 129, 0.12)'; 
      btn.style.transform = 'scale(1.08)';
    });
    btn.addEventListener('mouseleave', () => { 
      btn.style.background = 'transparent'; 
      btn.style.transform = 'scale(1)';
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const textEl = post.querySelector(config.postTextSelector);
      const postText = textEl ? (textEl.innerText || textEl.textContent || '') : '';

      mountReplyPanel(postText, platform, btn);
    });

    // Append to the action bar container
    actionBar.appendChild(btn);
  });
}
