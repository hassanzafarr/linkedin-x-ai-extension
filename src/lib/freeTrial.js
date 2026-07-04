import { extractJSON } from './claude.js';
import { saveFreeTrialRemaining } from './storage.js';

const FREE_REPLY_URL = 'https://engageflow-ai.vercel.app/api/free-reply';

export async function callFreeTrial(prompt, installId, { maxTokens = 1024 } = {}) {
  let response;
  try {
    response = await fetch(FREE_REPLY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ installId, prompt, maxTokens }),
    });
  } catch (networkErr) {
    throw new Error(`NETWORK_ERROR: ${networkErr.message}`);
  }

  const rawBody = await response.text().catch(() => '');
  let parsed;
  try { parsed = JSON.parse(rawBody); } catch { parsed = null; }

  if (typeof parsed?.remaining === 'number') {
    saveFreeTrialRemaining(parsed.remaining).catch(() => {});
  }

  if (!response.ok) {
    throw new Error(parsed?.error || 'FREE_TRIAL_ERROR');
  }

  return extractJSON(parsed?.text || '');
}
