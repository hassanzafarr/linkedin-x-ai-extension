export const HOOK_PATTERNS = [
  {
    id: 'contrarian',
    label: 'Contrarian',
    description: 'Challenge a widely-held belief',
    instruction: 'Open with a sentence that directly contradicts conventional wisdom in the topic area, then back it up.',
    example: "Everyone says hustle culture is dead. They're wrong. Here's what changed:",
  },
  {
    id: 'story',
    label: 'Personal story',
    description: 'Drop into a moment',
    instruction: 'Open in the middle of a specific scene from your own experience. Time, place, who said what.',
    example: 'Three years ago, my co-founder quit by text message at 2am.',
  },
  {
    id: 'stat',
    label: 'Surprising stat',
    description: 'Lead with a hard number',
    instruction: 'Open with a concrete statistic, percentage, or number that reframes the topic.',
    example: '92% of my best ideas came from conversations I almost skipped.',
  },
  {
    id: 'question',
    label: 'Sharp question',
    description: 'Provoke thought',
    instruction: 'Open with one short, pointed question the reader cannot easily answer.',
    example: 'What would your job look like if AI could do 40% of it tomorrow?',
  },
  {
    id: 'confession',
    label: 'Confession',
    description: 'Admit something uncomfortable',
    instruction: 'Open by admitting a mistake, embarrassment, or unpopular truth about yourself or your work.',
    example: "I shipped a bug that cost us $40k last month. Here's what I learned:",
  },
  {
    id: 'list',
    label: 'List teaser',
    description: 'Promise structured value',
    instruction: 'Open with a numbered promise of the value to come (e.g., "5 lessons", "3 mistakes", "7 patterns").',
    example: '7 things I wish I knew before raising a seed round:',
  },
  {
    id: 'before_after',
    label: 'Before / After',
    description: 'Show transformation',
    instruction: 'Open by contrasting a past state with a present state. Concrete, no fluff.',
    example: 'Two years ago I had 200 followers. Today I closed a $50k deal from a DM. Here is the unglamorous story:',
  },
  {
    id: 'framework',
    label: 'Framework drop',
    description: 'Name a model',
    instruction: 'Open by naming a 2-4 word framework or mental model, then teach it.',
    example: "I call it the 80/15/5 rule. It's how I plan every quarter:",
  },
  {
    id: 'pattern',
    label: 'Pattern observation',
    description: 'Name what you keep seeing',
    instruction: "Open with 'I keep seeing…' or 'I've noticed…' followed by a specific recurring pattern.",
    example: "I keep seeing the same mistake from junior PMs in their first 90 days:",
  },
  {
    id: 'curiosity_gap',
    label: 'Curiosity gap',
    description: 'Tease without telling',
    instruction: 'Open with a hint that something surprising or counterintuitive is about to be revealed, without giving it away.',
    example: 'The single best hiring question I ever stole from a 70-year-old CEO:',
  },
];

export const HOOK_BY_ID = Object.fromEntries(HOOK_PATTERNS.map(h => [h.id, h]));
