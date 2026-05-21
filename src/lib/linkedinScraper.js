// Orchestrates LinkedIn profile import by opening the profile in a background
// tab, scrolling it, then navigating to the activity page and scrolling again.
// Runs in the service worker. The injected `scrollAndExtractText` runs in
// the LinkedIn tab via chrome.scripting.executeScript.

export async function scrapeLinkedInProfile(profileUrl, onProgress) {
  const normalized = normalizeProfileUrl(profileUrl);
  if (!normalized) throw new Error('INVALID_URL');

  report(onProgress, 'opening', 'Opening LinkedIn profile…');
  const tab = await chrome.tabs.create({ url: normalized, active: false });

  try {
    await waitForTabComplete(tab.id);
    report(onProgress, 'scrolling-profile', 'Scrolling profile…');
    const profileResult = await runInTab(tab.id, scrollAndExtractText);

    const activityUrl = normalized.replace(/\/$/, '') + '/recent-activity/all/';
    report(onProgress, 'opening-activity', 'Opening activity…');
    await chrome.tabs.update(tab.id, { url: activityUrl });
    await waitForTabComplete(tab.id);
    report(onProgress, 'scrolling-activity', 'Scrolling activity…');
    const activityResult = await runInTab(tab.id, scrollAndExtractText);

    return {
      profileUrl: normalized,
      profileText: profileResult?.text || '',
      activityText: activityResult?.text || '',
    };
  } finally {
    chrome.tabs.remove(tab.id).catch(() => {});
  }
}

function report(cb, stage, message) {
  if (typeof cb === 'function') cb({ stage, message });
}

function normalizeProfileUrl(url) {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.endsWith('linkedin.com')) return null;
    if (!u.pathname.startsWith('/in/')) return null;
    const slug = u.pathname.replace(/^\/in\//, '').replace(/\/.*$/, '');
    if (!slug) return null;
    return `https://www.linkedin.com/in/${slug}`;
  } catch {
    return null;
  }
}

async function waitForTabComplete(tabId, timeoutMs = 60000) {
  // Check current status — listener may miss `complete` if it already fired.
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      await waitForReadyState(tabId, timeoutMs);
      return;
    }
  } catch {}

  // Wait for `complete` event, falling back to readyState poll.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('TAB_LOAD_TIMEOUT'));
    }, timeoutMs);

    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });

  await waitForReadyState(tabId, timeoutMs);
}

async function waitForReadyState(tabId, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => ({
          ready: document.readyState,
          hasMain: !!document.querySelector('main'),
          url: location.href,
        }),
      });
      const r = res?.result;
      if (r?.ready === 'complete' && r.hasMain) {
        await new Promise(rr => setTimeout(rr, 1200));
        return;
      }
    } catch {
      // tab may be navigating; retry
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('TAB_READYSTATE_TIMEOUT');
}

async function runInTab(tabId, func) {
  const results = await chrome.scripting.executeScript({ target: { tabId }, func });
  return results?.[0]?.result;
}

// Injected into the LinkedIn tab. Must be self-contained: no outer references.
async function scrollAndExtractText() {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < 12; i++) {
    window.scrollBy(0, 1400);
    await sleep(650);
  }
  // Click any "see more" buttons in the about/experience sections so collapsed
  // text becomes part of innerText.
  const seeMoreButtons = Array.from(document.querySelectorAll('button')).filter(b => {
    const t = (b.innerText || '').trim().toLowerCase();
    return t === 'see more' || t === '…see more' || t === '... see more';
  });
  for (const btn of seeMoreButtons.slice(0, 30)) {
    try { btn.click(); } catch {}
  }
  await sleep(800);

  window.scrollTo(0, 0);
  await sleep(400);

  const main = document.querySelector('main') || document.body;
  const text = (main.innerText || '')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 45000);

  return { url: location.href, text };
}
