import { describe, it, expect } from 'vitest';
import { HOOK_PATTERNS, HOOK_BY_ID } from '../../../src/lib/hooks.js';

describe('HOOK_PATTERNS', () => {
  it('exposes at least one pattern', () => {
    expect(HOOK_PATTERNS.length).toBeGreaterThan(0);
  });

  it('every pattern has required fields', () => {
    for (const p of HOOK_PATTERNS) {
      expect(p.id).toBeTypeOf('string');
      expect(p.label).toBeTypeOf('string');
      expect(p.description).toBeTypeOf('string');
      expect(p.instruction).toBeTypeOf('string');
      expect(p.example).toBeTypeOf('string');
      expect(p.id.length).toBeGreaterThan(0);
    }
  });

  it('pattern ids are unique', () => {
    const ids = HOOK_PATTERNS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('HOOK_BY_ID', () => {
  it('indexes every pattern by id', () => {
    for (const p of HOOK_PATTERNS) {
      expect(HOOK_BY_ID[p.id]).toBe(p);
    }
  });

  it('returns undefined for unknown id', () => {
    expect(HOOK_BY_ID['nope']).toBeUndefined();
  });
});
