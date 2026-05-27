const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(prompt, apiKey, { maxTokens = 1024 } = {}) {
  if (!apiKey) throw new Error('NO_API_KEY');
  const cleanKey = apiKey.trim();

  let response;
  try {
    response = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (networkErr) {
    throw new Error(`NETWORK_ERROR: ${networkErr.message}`);
  }

  const rawBody = await response.text().catch(() => '');

  if (!response.ok) {
    let parsed;
    try { parsed = JSON.parse(rawBody); } catch { parsed = null; }
    const apiMessage = parsed?.error?.message || rawBody || 'unknown';
    const apiType = parsed?.error?.type || 'http_error';
    const err = new Error(`${response.status} ${apiType}: ${apiMessage}`);
    err.status = response.status;
    err.apiType = apiType;
    err.apiMessage = apiMessage;
    throw err;
  }

  const data = JSON.parse(rawBody);
  const text = data.content[0].text;
  return extractJSON(text);
}

function extractJSON(text) {
  let s = text.trim();
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const fence = s.match(codeBlockRegex);
  if (fence) s = fence[1].trim();

  // Pull first {...} or [...] block out of surrounding prose
  const firstObj = s.indexOf('{');
  const firstArr = s.indexOf('[');
  const start = (firstObj === -1) ? firstArr
              : (firstArr === -1) ? firstObj
              : Math.min(firstObj, firstArr);
  if (start === -1) return s;

  const openChar = s[start];
  const closeChar = openChar === '{' ? '}' : ']';
  const lastClose = s.lastIndexOf(closeChar);
  if (lastClose > start) s = s.slice(start, lastClose + 1);

  return s.trim();
}
