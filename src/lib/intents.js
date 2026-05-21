export const INTENTS = [
  { id: 'add_value',       label: 'Add Value',       instruction: 'Add a new insight, perspective, or angle that builds on the original post. Move the conversation forward.' },
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
