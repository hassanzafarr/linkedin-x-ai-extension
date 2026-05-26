import { describe, it, expect } from 'vitest';
import {
  buildReplyPrompt,
  buildIntentReplyPrompt,
  buildDraftPostPrompt,
  buildVariantsPrompt,
  buildRefinePrompt,
  buildVoiceExtractionPrompt,
  buildScoringPrompt,
} from '../../../src/lib/prompts.js';

const voice = {
  story: 'I build dev tools.',
  writingStyle: 'Punchy, short sentences.',
  rawSamples: 'Sample post one. Sample post two.',
};

describe('buildReplyPrompt', () => {
  it('includes platform context for linkedin', () => {
    const p = buildReplyPrompt({ postText: 'Hello world', voiceProfile: voice, platform: 'linkedin' });
    expect(p).toMatch(/LinkedIn/);
    expect(p).toMatch(/1200 chars/);
    expect(p).toMatch(/Hello world/);
  });

  it('includes platform context for x', () => {
    const p = buildReplyPrompt({ postText: 'Hi', voiceProfile: voice, platform: 'x' });
    expect(p).toMatch(/280 characters/);
  });

  it('truncates long post text to 1500 chars', () => {
    const longPost = 'x'.repeat(2000);
    const p = buildReplyPrompt({ postText: longPost, voiceProfile: voice, platform: 'x' });
    expect(p).not.toMatch(/x{1501}/);
  });

  it('falls back to default voice when none provided', () => {
    const p = buildReplyPrompt({ postText: 'hi', voiceProfile: null, platform: 'x' });
    expect(p).toMatch(/professional yet personable/);
  });

  it('forbids em/en dashes and double hyphens in instructions', () => {
    const p = buildReplyPrompt({ postText: 'hi', voiceProfile: voice, platform: 'x' });
    expect(p).toMatch(/NEVER use em dashes/);
    expect(p).toMatch(/double hyphens/);
  });

  it('requires humanized language in instructions', () => {
    const p = buildReplyPrompt({ postText: 'hi', voiceProfile: voice, platform: 'x' });
    expect(p).toMatch(/humanized/);
  });
});

describe('buildIntentReplyPrompt', () => {
  it('includes intent label and instruction', () => {
    const p = buildIntentReplyPrompt({
      postText: 'Post',
      voiceProfile: voice,
      platform: 'linkedin',
      intentLabel: 'Agree and amplify',
      intentInstruction: 'Build on the point with a related insight.',
    });
    expect(p).toMatch(/Agree and amplify/);
    expect(p).toMatch(/Build on the point/);
  });

  it('includes requested reply length guidance', () => {
    const p = buildIntentReplyPrompt({
      postText: 'Post',
      voiceProfile: voice,
      platform: 'linkedin',
      intentLabel: 'Witty',
      intentInstruction: 'Write a clever reply.',
      lengthLabel: 'Short',
      lengthInstruction: 'Keep it to 1 crisp sentence.',
    });
    expect(p).toMatch(/Reply length: Short/);
    expect(p).toMatch(/Keep it to 1 crisp sentence/);
    expect(p).toMatch(/- Strictly follow this length constraint: Keep it to 1 crisp sentence\./);
  });

  it('includes custom note when provided', () => {
    const p = buildIntentReplyPrompt({
      postText: 'Post',
      platform: 'x',
      intentLabel: 'Disagree',
      intentInstruction: 'Push back.',
      customNote: '  mention shipping cadence  ',
    });
    expect(p).toMatch(/mention shipping cadence/);
    expect(p).toMatch(/Extra direction from me/);
  });

  it('omits custom section when note is blank', () => {
    const p = buildIntentReplyPrompt({
      postText: 'Post',
      platform: 'x',
      intentLabel: 'Disagree',
      intentInstruction: 'Push back.',
      customNote: '   ',
    });
    expect(p).not.toMatch(/Extra direction from me/);
  });

  it('handles missing postText', () => {
    const p = buildIntentReplyPrompt({
      postText: undefined,
      platform: 'x',
      intentLabel: 'L',
      intentInstruction: 'I',
    });
    expect(p).toBeTypeOf('string');
  });

  it('forbids double hyphens and demands humanized writing in instructions', () => {
    const p = buildIntentReplyPrompt({
      postText: 'Post',
      platform: 'x',
      intentLabel: 'L',
      intentInstruction: 'I',
    });
    expect(p).toMatch(/double hyphens/);
    expect(p).toMatch(/humanized/);
  });
});

describe('buildDraftPostPrompt', () => {
  it('x platform enforces 280 char limit', () => {
    const p = buildDraftPostPrompt({ topic: 't', platform: 'x', tone: 'witty' });
    expect(p).toMatch(/under 280 characters/);
  });

  it('linkedin platform allows 3000 chars', () => {
    const p = buildDraftPostPrompt({ topic: 't', platform: 'linkedin', tone: 'professional' });
    expect(p).toMatch(/up to 3000 characters/);
    expect(p).toMatch(/question or call-to-action/);
  });

  it('embeds hook pattern when provided', () => {
    const hookPattern = { label: 'Contrarian', instruction: 'Challenge convention.', example: 'Everyone is wrong.' };
    const p = buildDraftPostPrompt({ topic: 't', platform: 'x', tone: 'sharp', hookPattern });
    expect(p).toMatch(/Hook style: Contrarian/);
    expect(p).toMatch(/Challenge convention/);
  });
});

describe('buildVariantsPrompt', () => {
  it('asks for 3 distinct variants', () => {
    const p = buildVariantsPrompt({ topic: 'remote work', platform: 'linkedin', tone: 'professional' });
    expect(p).toMatch(/3 DISTINCT variants/);
    expect(p).toMatch(/Variant 1/);
    expect(p).toMatch(/Variant 2/);
    expect(p).toMatch(/Variant 3/);
  });

  it('returns JSON array instruction', () => {
    const p = buildVariantsPrompt({ topic: 't', platform: 'x', tone: 'witty' });
    expect(p).toMatch(/JSON array of exactly 3 strings/);
  });
});

describe('buildRefinePrompt', () => {
  it('includes current draft and refine action', () => {
    const p = buildRefinePrompt({
      currentDraft: 'My draft text',
      refineAction: 'Make it punchier',
      platform: 'x',
    });
    expect(p).toMatch(/My draft text/);
    expect(p).toMatch(/Make it punchier/);
  });

  it('truncates draft to 4000 chars', () => {
    const big = 'a'.repeat(5000);
    const p = buildRefinePrompt({ currentDraft: big, refineAction: 'shorten', platform: 'x' });
    expect(p).not.toMatch(/a{4001}/);
  });

  it('appends custom instruction when given', () => {
    const p = buildRefinePrompt({
      currentDraft: 'd',
      refineAction: 'tweak',
      platform: 'x',
      customInstruction: 'keep the dog metaphor',
    });
    expect(p).toMatch(/keep the dog metaphor/);
  });
});

describe('buildVoiceExtractionPrompt', () => {
  it('returns JSON schema instructions', () => {
    const p = buildVoiceExtractionPrompt({ profileText: 'profile', activityText: 'activity' });
    expect(p).toMatch(/"name"/);
    expect(p).toMatch(/"story"/);
    expect(p).toMatch(/"writingStyle"/);
    expect(p).toMatch(/"samples"/);
  });
});

describe('buildScoringPrompt', () => {
  it('embeds post and asks for JSON score', () => {
    const p = buildScoringPrompt({ postText: 'Test', platform: 'linkedin' });
    expect(p).toMatch(/Test/);
    expect(p).toMatch(/"score"/);
    expect(p).toMatch(/"reasons"/);
  });
});
