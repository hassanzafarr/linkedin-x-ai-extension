import { describe, expect, it } from 'vitest';
import { COMMENT_LENGTHS, INTENT_BY_ID, INTENTS, countSentences, validateReplyLength } from '../../../src/lib/intents.js';

describe('comment intents', () => {
  it('includes funny and witty reply intents', () => {
    expect(INTENT_BY_ID.funny?.label).toBe('Funny');
    expect(INTENT_BY_ID.witty?.label).toBe('Witty');
  });

  it('keeps intent ids unique', () => {
    const ids = INTENTS.map(intent => intent.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('comment lengths', () => {
  it('offers short, medium, and long options', () => {
    expect(COMMENT_LENGTHS.map(option => option.id)).toEqual(['short', 'medium', 'long']);
  });

  describe('countSentences', () => {
    it('returns 0 for empty or null text', () => {
      expect(countSentences('')).toBe(0);
      expect(countSentences(null)).toBe(0);
      expect(countSentences(undefined)).toBe(0);
    });

    it('counts single sentence correctly', () => {
      expect(countSentences('This is a short reply.')).toBe(1);
      expect(countSentences('Is this a sentence?')).toBe(1);
      expect(countSentences('Wow!')).toBe(1);
    });

    it('counts multiple sentences correctly', () => {
      expect(countSentences('First sentence. Second sentence! Third sentence?')).toBe(3);
    });

    it('ignores decimals and common abbreviations', () => {
      expect(countSentences('This is version 3.5 of the software, e.g. for the U.S. market. It is ready.')).toBe(2);
    });

    it('counts text without trailing punctuation as one sentence', () => {
      expect(countSentences('Hello world')).toBe(1);
    });
  });

  describe('validateReplyLength', () => {
    it('validates short length (exactly 1 sentence)', () => {
      expect(validateReplyLength('Only one sentence.', 'short')).toBe(true);
      expect(validateReplyLength('One sentence. Two sentences.', 'short')).toBe(false);
      expect(validateReplyLength('', 'short')).toBe(false);
    });

    it('validates medium length (2-3 sentences)', () => {
      expect(validateReplyLength('One sentence.', 'medium')).toBe(false);
      expect(validateReplyLength('One. Two.', 'medium')).toBe(true);
      expect(validateReplyLength('One. Two. Three.', 'medium')).toBe(true);
      expect(validateReplyLength('One. Two. Three. Four.', 'medium')).toBe(false);
    });

    it('validates long length (3-5 sentences)', () => {
      expect(validateReplyLength('One. Two.', 'long')).toBe(false);
      expect(validateReplyLength('One. Two. Three.', 'long')).toBe(true);
      expect(validateReplyLength('One. Two. Three. Four.', 'long')).toBe(true);
      expect(validateReplyLength('One. Two. Three. Four. Five.', 'long')).toBe(true);
      expect(validateReplyLength('One. Two. Three. Four. Five. Six.', 'long')).toBe(false);
    });
  });
});

