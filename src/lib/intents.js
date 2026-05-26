export const INTENTS = [
  { id: 'add_value',       label: 'Add Value',       instruction: 'Add a new insight, perspective, or angle that builds on the original post. Move the conversation forward.' },
  { id: 'funny',           label: 'Funny',           instruction: 'Write a light, genuinely funny reply that still fits the post. Keep it workplace-safe and avoid sarcasm that could sound dismissive.' },
  { id: 'witty',           label: 'Witty',           instruction: 'Write a clever, polished reply with a sharp turn of phrase. Make it memorable without sounding try-hard.' },
  { id: 'share_experience',label: 'Share Experience',instruction: 'Share a brief, concrete first-person experience that relates to the post. Specific, not generic.' },
  { id: 'ask_question',    label: 'Ask Question',    instruction: 'Ask one sharp, specific question that draws out more from the author. Avoid yes/no.' },
  { id: 'provide_insight', label: 'Provide Insight', instruction: 'Offer a distinct analytical insight or framing the author may not have considered.' },
  { id: 'express_support', label: 'Express Support', instruction: 'Affirm the author warmly and specifically — name what resonated. Never use empty phrases like "Great post!" or "Totally agree".' },
  { id: 'highlight_point', label: 'Highlight Point', instruction: 'Pull out the single most important point in the post and explain why it matters.' },
  { id: 'share_story',     label: 'Share Story',     instruction: 'Tell a short, relevant micro-story (2-4 sentences) from your own experience that connects to the post.' },
  { id: 'suggest_resource',label: 'Suggest Resource',instruction: 'Recommend a book, tool, framework, or article that fits — only if genuinely useful. One concrete reference.' },
  { id: 'offer_alternative',label:'Offer Alternative',instruction: 'Respectfully present an alternative view or approach. Disagree without dismissing.' },
  { id: 'connect_ideas',   label: 'Connect Ideas',   instruction: 'Connect the post to an adjacent idea, field, or pattern — show the bridge.' },
];

export const INTENT_BY_ID = Object.fromEntries(INTENTS.map(i => [i.id, i]));

export const COMMENT_LENGTHS = [
  { id: 'short',  label: 'Short',  instruction: 'Keep it short: write exactly 1 crisp sentence, ideally under 140 characters unless the idea needs a little more room.' },
  { id: 'medium', label: 'Medium', instruction: 'Use a medium length: write exactly 2 to 3 concise sentences with enough context to feel thoughtful, while staying within the platform limit.' },
  { id: 'long',   label: 'Long',   instruction: 'Use a longer reply: write exactly 3 to 5 tight sentences, with a fuller explanation while staying skimmable and within the platform limit.' },
];

export const COMMENT_LENGTH_BY_ID = Object.fromEntries(COMMENT_LENGTHS.map(i => [i.id, i]));

export function countSentences(text) {
  if (!text) return 0;
  // Clean up common abbreviations/decimals to avoid false sentence breaks
  const cleaned = text
    .replace(/(?:\b[a-zA-Z]\.)+(?=\s|$)/g, '')
    .replace(/\b(?:e\.g\.|i\.e\.|vs\.)/gi, '')
    .replace(/\b\d+\.\d+\b/g, '');

  const sentences = cleaned.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [];
  if (sentences.length === 0 && cleaned.trim().length > 0) {
    return 1;
  }
  return sentences.length;
}

export function validateReplyLength(reply, lengthId) {
  const count = countSentences(reply);
  if (lengthId === 'short') {
    return count === 1;
  }
  if (lengthId === 'medium') {
    return count >= 2 && count <= 3;
  }
  if (lengthId === 'long') {
    return count >= 3 && count <= 5;
  }
  return true;
}

