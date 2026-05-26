export function buildReplyPrompt({ postText, voiceProfile, platform }) {
  const voiceSection = buildVoiceContext(voiceProfile)
    || 'Write in a professional yet personable tone.';

  const platformCtx = platform === 'linkedin'
    ? 'LinkedIn (professional audience, up to 1200 chars per reply)'
    : 'X/Twitter (concise, under 280 characters)';

  return `You are a social media ghostwriter helping me reply to a ${platform} post.

${voiceSection}

## Post I want to reply to:
${postText.slice(0, 1500)}

## Instructions
Generate exactly 3 reply options. Each reply must:
- Match my writing voice from the examples above
- Be appropriate for ${platformCtx}
- Add genuine value: an insight, a question, or a specific affirmation, never generic filler
- NOT start with "Great post!", "Absolutely!", "I totally agree", or similar hollow openers
- Always write in a humanized, natural, and conversational way (avoid sounding robotic or like stereotypical AI text)
- Be ready to post with no editing needed
- NEVER use em dashes (—), en dashes (–), or double hyphens (--). Use commas, periods, or parentheses instead

Return ONLY a valid JSON array with exactly 3 strings. No markdown, no explanation.
Example: ["reply one", "reply two", "reply three"]`;
}

export function buildIntentReplyPrompt({
  postText,
  voiceProfile,
  platform,
  intentLabel,
  intentInstruction,
  lengthLabel = 'Medium',
  lengthInstruction = 'Use a medium length: 2 to 3 concise sentences with enough context to feel thoughtful.',
  customNote,
}) {
  const voiceSection = buildVoiceContext(voiceProfile)
    || 'Write in a professional yet personable tone.';

  const platformCtx = platform === 'linkedin'
    ? 'LinkedIn (professional audience, up to 1200 chars)'
    : 'X/Twitter (under 280 characters, one tweet)';

  const customSection = customNote?.trim()
    ? `\n## Extra direction from me\n${customNote.trim().slice(0, 500)}\n`
    : '';

  return `You are a social media ghostwriter helping me reply to a ${platform} post.

${voiceSection}

## Post I want to reply to
${(postText || '').slice(0, 1500)}

## Reply intent: ${intentLabel}
${intentInstruction}

## Reply length: ${lengthLabel}
${lengthInstruction}
${customSection}
## Rules
- Match my voice from the examples above
- ${platformCtx}
- Strictly follow this length constraint: ${lengthInstruction}. This constraint is a hard requirement and overrides any other instructions (such as intent guidelines).
- Always write in a humanized, natural, and conversational way (avoid sounding robotic or like stereotypical AI text)
- Never open with "Great post!", "Absolutely!", "Totally agree", or similar hollow phrases
- NEVER use em dashes (—), en dashes (–), or double hyphens (--). Use commas, periods, or parentheses instead
- One reply only, ready to post, no preamble or explanation

Return ONLY the reply text. No JSON, no markdown, no quotes around it.`;
}

export function buildDraftPostPrompt({ topic, platform, tone, voiceProfile, hookPattern }) {
  const charLimit = platform === 'x'
    ? 'Keep it under 280 characters for a single tweet, or structure as a thread (max 5 tweets, each clearly separated by "---", each under 280 chars).'
    : 'LinkedIn allows up to 3000 characters. Aim for 150–400 words for best engagement. Use line breaks for readability.';

  const voiceSection = buildVoiceContext(voiceProfile);
  const hookSection = hookPattern
    ? `\n## Required opening pattern\nHook style: ${hookPattern.label}.\nPattern: ${hookPattern.instruction}\nExample opener (for inspiration, do not copy verbatim): "${hookPattern.example}"\n`
    : '';

  return `You are a social media ghostwriter.
${voiceSection}

Write a ${platform === 'linkedin' ? 'LinkedIn' : 'X/Twitter'} post about the following topic.

Topic: ${topic}
Tone: ${tone}
${hookSection}
Rules:
- ${charLimit}
- Match my writing voice from the examples above
- Open with a hook that stops the scroll
- ${platform === 'linkedin' ? 'End with a question or call-to-action to drive comments.' : 'Be punchy. Every word earns its place.'}
- Always write in a humanized, natural, and conversational way (avoid sounding robotic or like stereotypical AI text)
- No hashtag spam. Maximum 2 to 3 relevant hashtags only if they add value
- NEVER use em dashes (—), en dashes (–), or double hyphens (--). Use commas, periods, or parentheses instead
- Return ONLY the post text, nothing else. No markdown formatting, no labels.`;
}

export function buildVariantsPrompt({ topic, platform, tone, voiceProfile, hookPattern }) {
  const charLimit = platform === 'x'
    ? 'Each variant: under 280 characters single tweet, OR a thread with tweets separated by "---" (each tweet under 280 chars, max 5 tweets).'
    : 'Each variant: 150 to 400 words, line breaks for readability, up to 3000 chars.';

  const voiceSection = buildVoiceContext(voiceProfile);
  const hookSection = hookPattern
    ? `\n## Required opening pattern (apply to all 3 variants)\n${hookPattern.label}: ${hookPattern.instruction}\n`
    : '';

  return `You are a social media ghostwriter producing 3 DISTINCT variants of a ${platform === 'linkedin' ? 'LinkedIn' : 'X/Twitter'} post.

${voiceSection}

Topic: ${topic}
Tone: ${tone}
${hookSection}
Variant guidance:
- Variant 1: lead with a personal story or specific moment.
- Variant 2: lead with a contrarian or pattern-breaking statement.
- Variant 3: lead with a concrete number, list, or framework.

Rules for every variant:
- ${charLimit}
- Match my writing voice from the examples above
- Each variant must feel meaningfully different. Different opener, different structure
- Always write in a humanized, natural, and conversational way (avoid sounding robotic or like stereotypical AI text)
- No hashtag spam. Maximum 2 to 3 relevant hashtags only if they add value
- NEVER use em dashes (—), en dashes (–), or double hyphens (--). Use commas, periods, or parentheses instead
- No hollow phrases ("Great question", "Hot take", "Let me tell you")
- ${platform === 'linkedin' ? 'End with a question or CTA to drive comments.' : 'Punchy. Every word earns its place.'}

Return ONLY a valid JSON array of exactly 3 strings, where each string is the full post text. No markdown, no commentary.
Example: ["variant one full text", "variant two full text", "variant three full text"]`;
}

export function buildRefinePrompt({ currentDraft, refineAction, customInstruction, platform, voiceProfile }) {
  const platformCtx = platform === 'x'
    ? 'X/Twitter (under 280 chars per tweet, threads separated by "---")'
    : 'LinkedIn (up to 3000 chars, line breaks OK)';

  const voiceSection = buildVoiceContext(voiceProfile);
  const customSection = customInstruction?.trim()
    ? `\nAdditional instruction: ${customInstruction.trim().slice(0, 300)}`
    : '';

  return `You are refining an existing ${platform} post draft. Keep the core message but apply the requested change.

${voiceSection}

## Current draft
${(currentDraft || '').slice(0, 4000)}

## Refinement requested
${refineAction}${customSection}

Rules:
- Preserve the core topic and intent
- Stay in my voice from the examples above
- Fit ${platformCtx}
- Always write in a humanized, natural, and conversational way (avoid sounding robotic or like stereotypical AI text)
- NEVER use em dashes (—), en dashes (–), or double hyphens (--). Use commas, periods, or parentheses instead
- Return ONLY the refined post text. No preamble, no quotes, no markdown.`;
}

function buildVoiceContext(voiceProfile) {
  if (!voiceProfile) return '';
  const parts = [];
  if (voiceProfile.story?.trim()) {
    parts.push(`## About me\n${voiceProfile.story.trim().slice(0, 1500)}`);
  }
  if (voiceProfile.writingStyle?.trim()) {
    parts.push(`## How I write\n${voiceProfile.writingStyle.trim().slice(0, 1500)}`);
  }
  if (voiceProfile.rawSamples?.trim()) {
    parts.push(`## Examples of my writing\n${voiceProfile.rawSamples.slice(0, 3000)}`);
  }
  return parts.join('\n\n');
}

export function buildVoiceExtractionPrompt({ profileText, activityText }) {
  return `You will be given raw text scraped from a LinkedIn profile page and the user's recent-activity page. Build a writing-voice profile for this user.

## Profile page text
${(profileText || '').slice(0, 14000)}

## Activity page text
${(activityText || '').slice(0, 22000)}

## Task
Produce four things:

1. **name** — user's full name (or empty string if not visible).
2. **headline** — current professional headline (or empty string).
3. **story** — a 3-5 sentence first-person summary of what the user works on, builds, and cares about. Based ONLY on the scraped text. Write as the user ("I am…", "I work on…"). Include their role, domain, current focus, and any unique experiences or themes evident from posts. Minimum 30 characters.
4. **writingStyle** — a 3-6 sentence description of HOW the user writes (tone, sentence length, formality, use of lists/emojis/hashtags, recurring rhetorical moves, vocabulary patterns). Written in third-person about the user's style ("They tend to…", "Posts often…"). Minimum 15 characters. Based on the actual samples — do not invent.
5. **samples** — 5-10 of the user's own posts/comments that best represent their voice. Strip UI artifacts ("see more", "Like", "Comment", reaction counts, "Activity", "Posts", other users' names, ads, sponsored snippets). Keep only complete first-person writing, each 1-12 sentences.

Return ONLY valid JSON, no markdown, no commentary:
{
  "name": "...",
  "headline": "...",
  "story": "...",
  "writingStyle": "...",
  "samples": ["...", "..."]
}`;
}

export function buildScoringPrompt({ postText, platform }) {
  return `Rate the following ${platform} post on engagement potential for a professional in tech or business.

Post:
${postText.slice(0, 800)}

Score guidelines:
- 80–100: High-value — trending topic, thought-provoking, strong discussion potential
- 50–79: Moderate — relevant but not exceptional
- 0–49: Low — generic, spammy, or off-topic

Return ONLY valid JSON: { "score": <0-100>, "reasons": ["reason1", "reason2"] }`;
}
