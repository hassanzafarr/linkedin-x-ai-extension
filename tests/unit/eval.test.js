import { describe, it, expect } from 'vitest';
import { buildIntentReplyPrompt } from '../../src/lib/prompts.js';
import { countSentences, validateReplyLength } from '../../src/lib/intents.js';
import { callClaude } from '../../src/lib/claude.js';

const apiKey = process.env.ANTHROPIC_API_KEY;

// Skip the entire suite if no API key is provided
describe.skipIf(!apiKey)('Claude Prompt Response Live Evaluation', () => {
  const testPost = 'We just launched our new developer platform today! It makes integrating payment APIs 10x faster. Check it out and let us know what you think.';

  async function evaluateReplyWithJudge(reply) {
    const judgePrompt = `Evaluate the following social media comment on a scale of 1 to 5:
Comment: "${reply}"

Criteria:
5 - Sounds exactly like a natural, casual, and conversational human writing on LinkedIn or Twitter.
4 - Sounds mostly natural, but has a slight corporate or polished feel.
3 - Sounds a bit robotic, neutral, or like standard AI text.
2 - Sounds very robotic, repetitive, or full of AI jargon.
1 - Completely robotic, spammy, or unusable.

Return ONLY a single integer (1, 2, 3, 4, or 5) representing your score. Do not write any other text.`;

    const rawResponse = await callClaude(judgePrompt, apiKey);
    const scoreText = rawResponse.trim().match(/[1-5]/)?.[0];
    return scoreText ? parseInt(scoreText, 10) : null;
  }

  const testCases = [
    {
      platform: 'x',
      intentLabel: 'Add Value',
      intentInstruction: 'Add a new insight, perspective, or angle that builds on the original post.',
      lengthId: 'short',
      lengthLabel: 'Short',
      lengthInstruction: 'Keep it very short: write exactly 1 crisp sentence, 4 to 10 words max.',
    },
    {
      platform: 'linkedin',
      intentLabel: 'Funny',
      intentInstruction: 'Write a light, genuinely funny reply that still fits the post. Keep it workplace-safe.',
      lengthId: 'medium',
      lengthLabel: 'Medium',
      lengthInstruction: 'Keep it compact: write 1 to 2 short sentences, 24 words max total.',
    },
    {
      platform: 'linkedin',
      intentLabel: 'Share Experience',
      intentInstruction: 'Share a brief, concrete first-person experience that relates to the post.',
      lengthId: 'long',
      lengthLabel: 'Long',
      lengthInstruction: 'Keep it skimmable: write 2 to 3 tight sentences, 45 words max total.',
    },
  ];

  testCases.forEach(({ platform, intentLabel, intentInstruction, lengthId, lengthLabel, lengthInstruction }) => {
    it(`evaluates ${platform} - ${intentLabel} - ${lengthLabel}`, async () => {
      const prompt = buildIntentReplyPrompt({
        postText: testPost,
        voiceProfile: null,
        platform,
        intentLabel,
        intentInstruction,
        lengthLabel,
        lengthInstruction,
      });

      const reply = await callClaude(prompt, apiKey);
      console.log(`\n--- Test Case: ${platform} | ${intentLabel} | ${lengthLabel} ---`);
      console.log(`Generated Reply: "${reply}"`);

      // 1. Dash and Hyphen checks
      expect(reply).not.toContain('--');
      expect(reply).not.toContain('—');
      expect(reply).not.toContain('–');

      // 2. Hollow opener check
      expect(reply).not.toMatch(/^(great post|absolutely|totally agree|i agree)/i);

      // 3. Sentence count check
      const sentencesCount = countSentences(reply);
      const isLengthValid = validateReplyLength(reply, lengthId);
      console.log(`Sentence Count: ${sentencesCount} (Expected for ${lengthLabel})`);
      expect(isLengthValid).toBe(true);

      // 4. Platform length limits
      if (platform === 'x') {
        expect(reply.length).toBeLessThan(280);
      } else {
        expect(reply.length).toBeLessThan(1200);
      }

      // 5. LLM-as-a-judge score check
      const judgeScore = await evaluateReplyWithJudge(reply);
      console.log(`LLM Judge Score: ${judgeScore} / 5`);
      expect(judgeScore).toBeTypeOf('number');
      expect(judgeScore).toBeGreaterThanOrEqual(4);
    }, 15000); // 15s timeout for live API calls
  });
});
