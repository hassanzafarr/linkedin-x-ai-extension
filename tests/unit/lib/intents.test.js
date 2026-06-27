import { describe, expect, it } from 'vitest';
import { COMMENT_LENGTHS, INTENT_BY_ID, INTENTS, countSentences, countWords, validateReplyLength } from '../../../src/lib/intents.js';

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

  describe('countWords', () => {
    it('counts words in a reply', () => {
      expect(countWords('Short, useful reply.')).toBe(3);
      expect(countWords('')).toBe(0);
    });
  });

  describe('validateReplyLength', () => {
    it('validates short length (exactly 1 brief sentence)', () => {
      expect(validateReplyLength('Only one sentence.', 'short')).toBe(true);
      expect(validateReplyLength('This reply is intentionally far too long for the stricter short mode.', 'short')).toBe(false);
      expect(validateReplyLength('One sentence. Two sentences.', 'short')).toBe(false);
      expect(validateReplyLength('', 'short')).toBe(false);
    });

    it('validates medium length (1-2 compact sentences)', () => {
      expect(validateReplyLength('One sentence.', 'medium')).toBe(true);
      expect(validateReplyLength('One. Two.', 'medium')).toBe(true);
      expect(validateReplyLength('One. Two. Three.', 'medium')).toBe(false);
      expect(validateReplyLength('This reply keeps going with enough extra words to exceed the compact medium cap and should fail validation because it is still adding unnecessary filler words.', 'medium')).toBe(false);
    });

    it('validates long length (2-3 tight sentences)', () => {
      expect(validateReplyLength('One. Two.', 'long')).toBe(true);
      expect(validateReplyLength('One. Two. Three.', 'long')).toBe(true);
      expect(validateReplyLength('One. Two. Three. Four.', 'long')).toBe(false);
      expect(validateReplyLength('This reply keeps adding words until it goes beyond the reduced long cap, with too much filler and unnecessary explanation throughout the whole response, making it feel slower and less useful than the product should allow. It has two sentences, but the total number of words is intentionally too high for validation to pass cleanly.', 'long')).toBe(false);
    });
  });
});
