import { describe, it, expect } from 'vitest';
import {
  getVoiceProfile,
  saveVoiceProfile,
  getApiKey,
  saveApiKey,
  getSettings,
  saveSettings,
  getDraftHistory,
  saveDraftToHistory,
  deleteDraftFromHistory,
  clearDraftHistory,
  getScheduledPosts,
  addScheduledPost,
  updateScheduledPost,
  deleteScheduledPost,
} from '../../../src/lib/storage.js';

describe('voice profile', () => {
  it('returns null when unset', async () => {
    expect(await getVoiceProfile()).toBeNull();
  });

  it('round-trips a saved profile', async () => {
    await saveVoiceProfile({ name: 'Ada', story: 's' });
    expect(await getVoiceProfile()).toEqual({ name: 'Ada', story: 's' });
  });
});

describe('api key', () => {
  it('returns empty string when no key', async () => {
    expect(await getApiKey()).toBe('');
  });

  it('saves trimmed key under claudeApiKey in local storage', async () => {
    await saveApiKey('   sk-ant-xyz   ');
    expect(chrome.storage.local._store.get('claudeApiKey')).toBe('sk-ant-xyz');
    expect(chrome.storage.sync._store.get('claudeApiKey')).toBeUndefined();
    expect(await getApiKey()).toBe('sk-ant-xyz');
  });

  it('falls back to geminiApiKey if claudeApiKey absent', async () => {
    await chrome.storage.local.set({ geminiApiKey: 'gemini-key' });
    expect(await getApiKey()).toBe('gemini-key');
  });

  it('prefers claudeApiKey over geminiApiKey', async () => {
    await chrome.storage.local.set({ claudeApiKey: 'c', geminiApiKey: 'g' });
    expect(await getApiKey()).toBe('c');
  });

  it('migrates legacy key from sync to local on first read', async () => {
    await chrome.storage.sync.set({ claudeApiKey: 'legacy-key' });
    expect(await getApiKey()).toBe('legacy-key');
    expect(chrome.storage.local._store.get('claudeApiKey')).toBe('legacy-key');
    expect(chrome.storage.sync._store.get('claudeApiKey')).toBeUndefined();
  });
});

describe('settings', () => {
  it('returns defaults when nothing stored', async () => {
    const s = await getSettings();
    expect(s).toEqual({
      claudeApiKey: '',
      feedScannerEnabled: true,
      feedScannerThreshold: 60,
      replyEnabled: true,
      defaultTone: 'professional',
    });
  });

  it('persists changed settings', async () => {
    await saveSettings({ defaultTone: 'witty', feedScannerThreshold: 75 });
    const s = await getSettings();
    expect(s.defaultTone).toBe('witty');
    expect(s.feedScannerThreshold).toBe(75);
    expect(s.feedScannerEnabled).toBe(true);
  });
});

describe('draft history', () => {
  it('starts empty', async () => {
    expect(await getDraftHistory()).toEqual([]);
  });

  it('prepends new entries with generated id and timestamp', async () => {
    const entry = await saveDraftToHistory({ text: 'hello', platform: 'x', tone: 'witty', topic: 't' });
    expect(entry.id).toMatch(/^d_/);
    expect(entry.createdAt).toBeTypeOf('number');
    const list = await getDraftHistory();
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe('hello');
  });

  it('newest entry comes first', async () => {
    await saveDraftToHistory({ text: 'first', platform: 'x' });
    await saveDraftToHistory({ text: 'second', platform: 'x' });
    const list = await getDraftHistory();
    expect(list[0].text).toBe('second');
    expect(list[1].text).toBe('first');
  });

  it('caps history at 30 entries', async () => {
    for (let i = 0; i < 35; i++) {
      await saveDraftToHistory({ text: `d${i}`, platform: 'x' });
    }
    const list = await getDraftHistory();
    expect(list).toHaveLength(30);
    expect(list[0].text).toBe('d34');
  });

  it('deletes a draft by id', async () => {
    const a = await saveDraftToHistory({ text: 'a', platform: 'x' });
    await saveDraftToHistory({ text: 'b', platform: 'x' });
    await deleteDraftFromHistory(a.id);
    const list = await getDraftHistory();
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe('b');
  });

  it('clears all drafts', async () => {
    await saveDraftToHistory({ text: 'a', platform: 'x' });
    await clearDraftHistory();
    expect(await getDraftHistory()).toEqual([]);
  });
});

describe('scheduled posts', () => {
  it('starts empty', async () => {
    expect(await getScheduledPosts()).toEqual([]);
  });

  it('adds and sorts by scheduledFor ascending', async () => {
    await addScheduledPost({ text: 'late', platform: 'x', scheduledFor: 3000 });
    await addScheduledPost({ text: 'early', platform: 'x', scheduledFor: 1000 });
    await addScheduledPost({ text: 'mid', platform: 'x', scheduledFor: 2000 });
    const list = await getScheduledPosts();
    expect(list.map(p => p.text)).toEqual(['early', 'mid', 'late']);
  });

  it('new posts default to status=pending', async () => {
    const e = await addScheduledPost({ text: 't', platform: 'x', scheduledFor: 1 });
    expect(e.status).toBe('pending');
  });

  it('updates a scheduled post', async () => {
    const e = await addScheduledPost({ text: 't', platform: 'x', scheduledFor: 1 });
    await updateScheduledPost(e.id, { status: 'posted' });
    const list = await getScheduledPosts();
    expect(list[0].status).toBe('posted');
    expect(list[0].text).toBe('t');
  });

  it('deletes a scheduled post', async () => {
    const a = await addScheduledPost({ text: 'a', platform: 'x', scheduledFor: 1 });
    await addScheduledPost({ text: 'b', platform: 'x', scheduledFor: 2 });
    await deleteScheduledPost(a.id);
    const list = await getScheduledPosts();
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe('b');
  });
});
