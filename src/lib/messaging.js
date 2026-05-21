/**
 * Safe wrapper around chrome.runtime.sendMessage that detects
 * "Extension context invalidated" errors and shows a user-friendly
 * message instead of a cryptic crash.
 *
 * This happens when the extension is reloaded/updated while a
 * content script is still running on the page.
 */
export async function safeSendMessage(msg) {
  try {
    // chrome.runtime.id is undefined when context is invalidated
    if (!chrome.runtime?.id) {
      throw new ExtensionInvalidatedError();
    }
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    if (isContextInvalidated(err)) {
      throw new ExtensionInvalidatedError();
    }
    throw err;
  }
}

export class ExtensionInvalidatedError extends Error {
  constructor() {
    super('Extension was updated — please refresh the page to continue.');
    this.name = 'ExtensionInvalidatedError';
  }
}

function isContextInvalidated(err) {
  if (!chrome.runtime?.id) return true;
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('extension context invalidated') ||
    msg.includes('message port closed') ||
    msg.includes('could not establish connection')
  );
}
