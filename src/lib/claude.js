const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(prompt, apiKey) {
  if (!apiKey) throw new Error('NO_API_KEY');
  const cleanKey = apiKey.trim();

  console.log('[Claude] Request start. Key prefix:', cleanKey.slice(0, 12), 'length:', cleanKey.length);

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
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (networkErr) {
    console.error('[Claude] Network error:', networkErr);
    throw new Error(`NETWORK_ERROR: ${networkErr.message}`);
  }

  const rawBody = await response.text().catch(() => '');
  console.log('[Claude] Response status:', response.status, 'body:', rawBody);

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
  const trimmed = text.trim();
  // If it's wrapped in ```json ... ``` or similar codeblock
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(codeBlockRegex);
  if (match) {
    return match[1].trim();
  }
  return trimmed;
}
