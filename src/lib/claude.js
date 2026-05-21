const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(prompt, apiKey) {
  if (!apiKey) throw new Error('NO_API_KEY');
  const cleanKey = apiKey.trim();

  const response = await fetch(CLAUDE_URL, {
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

  if (response.status === 401 || response.status === 403) throw new Error('INVALID_API_KEY');
  if (response.status === 429) throw new Error('RATE_LIMIT');
  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('Claude API Error:', response.status, errorBody);
    throw new Error(`CLAUDE_ERROR_${response.status}`);
  }

  const data = await response.json();
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
