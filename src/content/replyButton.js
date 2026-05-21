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

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute(TRIGGER_ATTR, 'true');
    btn.title = 'EngageFlow AI Reply';
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 9999px;
      border: none;
      background: transparent;
      color: #10b981;
      cursor: pointer;
      margin-left: 6px;
      padding: 0;
      transition: background 0.15s, transform 0.1s;
      vertical-align: middle;
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

    // Inject next to the anchor as a sibling instead of inside it
    if (anchor.parentNode) {
      anchor.after(btn);
    } else {
      anchor.appendChild(btn);
    }
  });
}
