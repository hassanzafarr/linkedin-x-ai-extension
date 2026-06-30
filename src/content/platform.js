// Selectors verified 2026-05-21 — update this date when re-verified after LinkedIn/X DOM changes
export const PLATFORM_CONFIG = {
  linkedin: {
    feedPostSelector: 'div.feed-shared-update-v2, div[data-id], .comments-comment-item, .comments-comments-list__comment-item',
    postTextSelector: '.feed-shared-update-v2__description, .update-components-text, .comments-comment-item__comment-body, .comments-comment-item-content-body',
    engagementSelector: '.social-details-social-counts__reactions-count, .social-details-social-counts, .comments-comment-social-bar',
    replyButtonAnchor: '.feed-shared-social-action-bar, .social-actions-button, .comments-comment-social-bar, button.comment-reply-action',
    composeBoxSelector: '.ql-editor[contenteditable="true"], .tiptap[contenteditable="true"], div[role="textbox"][contenteditable="true"]',
  },
  x: {
    feedPostSelector: 'article[data-testid="tweet"]',
    postTextSelector: '[data-testid="tweetText"]',
    engagementSelector: '[role="group"]',
    replyButtonAnchor: '[data-testid="reply"]',
    composeBoxSelector: '[data-testid="tweetTextarea_0"]',
  },
};

export function getCurrentPlatform() {
  const host = window.location.hostname;
  if (host.includes('linkedin.com')) return 'linkedin';
  if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
  return null;
}
