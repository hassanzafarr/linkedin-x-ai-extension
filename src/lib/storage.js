export const getVoiceProfile = () =>
  chrome.storage.local.get('voiceProfile').then(r => r.voiceProfile ?? null);

export const saveVoiceProfile = (data) =>
  chrome.storage.local.set({ voiceProfile: data });

export const getApiKey = () =>
  chrome.storage.sync.get(['claudeApiKey', 'geminiApiKey']).then(r => r.claudeApiKey || r.geminiApiKey || '');

export const saveApiKey = (key) =>
  chrome.storage.sync.set({ claudeApiKey: key.trim() });

export const getSettings = () =>
  chrome.storage.sync.get([
    'claudeApiKey',
    'geminiApiKey',
    'feedScannerEnabled',
    'feedScannerThreshold',
    'replyEnabled',
    'defaultTone',
  ]).then(r => ({
    claudeApiKey: r.claudeApiKey || r.geminiApiKey || '',
    feedScannerEnabled: r.feedScannerEnabled ?? true,
    feedScannerThreshold: r.feedScannerThreshold ?? 60,
    replyEnabled: r.replyEnabled ?? true,
    defaultTone: r.defaultTone ?? 'professional',
  }));

export const saveSettings = (settings) =>
  chrome.storage.sync.set(settings);

const DRAFTS_KEY = 'draftHistory';
const SCHEDULED_KEY = 'scheduledPosts';
const MAX_HISTORY = 30;

export const getDraftHistory = () =>
  chrome.storage.local.get(DRAFTS_KEY).then(r => Array.isArray(r[DRAFTS_KEY]) ? r[DRAFTS_KEY] : []);

export const saveDraftToHistory = async (draft) => {
  const list = await getDraftHistory();
  const entry = {
    id: `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text: draft.text,
    platform: draft.platform,
    tone: draft.tone,
    topic: draft.topic,
    hookId: draft.hookId || null,
    createdAt: Date.now(),
  };
  const next = [entry, ...list].slice(0, MAX_HISTORY);
  await chrome.storage.local.set({ [DRAFTS_KEY]: next });
  return entry;
};

export const deleteDraftFromHistory = async (id) => {
  const list = await getDraftHistory();
  await chrome.storage.local.set({ [DRAFTS_KEY]: list.filter(d => d.id !== id) });
};

export const clearDraftHistory = () =>
  chrome.storage.local.set({ [DRAFTS_KEY]: [] });

export const getScheduledPosts = () =>
  chrome.storage.local.get(SCHEDULED_KEY).then(r => Array.isArray(r[SCHEDULED_KEY]) ? r[SCHEDULED_KEY] : []);

export const addScheduledPost = async (post) => {
  const list = await getScheduledPosts();
  const entry = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text: post.text,
    platform: post.platform,
    scheduledFor: post.scheduledFor,
    status: 'pending',
    createdAt: Date.now(),
  };
  const next = [...list, entry].sort((a, b) => a.scheduledFor - b.scheduledFor);
  await chrome.storage.local.set({ [SCHEDULED_KEY]: next });
  return entry;
};

export const updateScheduledPost = async (id, patch) => {
  const list = await getScheduledPosts();
  const next = list.map(p => p.id === id ? { ...p, ...patch } : p);
  await chrome.storage.local.set({ [SCHEDULED_KEY]: next });
};

export const deleteScheduledPost = async (id) => {
  const list = await getScheduledPosts();
  await chrome.storage.local.set({ [SCHEDULED_KEY]: list.filter(p => p.id !== id) });
};
