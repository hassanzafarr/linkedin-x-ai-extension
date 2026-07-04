export const getVoiceProfile = () =>
  chrome.storage.local.get('voiceProfile').then(r => r.voiceProfile ?? null);

export const saveVoiceProfile = (data) =>
  chrome.storage.local.set({ voiceProfile: data });

// API key kept in local-only storage so it never syncs across the user's
// Chrome profile. Migrate any legacy value that was previously stored in
// chrome.storage.sync on first read.
const API_KEY_FIELDS = ['claudeApiKey', 'geminiApiKey'];

async function migrateApiKeyFromSync() {
  try {
    const synced = await chrome.storage.sync.get(API_KEY_FIELDS);
    const key = synced.claudeApiKey || synced.geminiApiKey;
    if (!key) return '';
    await chrome.storage.local.set({ claudeApiKey: key });
    await chrome.storage.sync.remove(API_KEY_FIELDS);
    return key;
  } catch {
    return '';
  }
}

export const getApiKey = async () => {
  const local = await chrome.storage.local.get(API_KEY_FIELDS);
  const key = local.claudeApiKey || local.geminiApiKey;
  if (key) return key;
  return migrateApiKeyFromSync();
};

export const saveApiKey = (key) =>
  chrome.storage.local.set({ claudeApiKey: key.trim() });

// Anonymous per-install ID used to meter the free trial server-side. Not
// tied to any account — just lets the backend count replies per install.
// Stored in sync (tied to the Chrome profile) rather than local, and
// deliberately excluded from "Delete All My Data" (see Options.jsx), so
// clearing local storage or that button can't be used to reset the trial.
export const getInstallId = async () => {
  const synced = await chrome.storage.sync.get('installId');
  if (synced.installId) return synced.installId;
  // Migrate anyone who got an ID before this moved to sync storage.
  const local = await chrome.storage.local.get('installId');
  if (local.installId) {
    await chrome.storage.sync.set({ installId: local.installId });
    return local.installId;
  }
  const id = crypto.randomUUID();
  await chrome.storage.sync.set({ installId: id });
  return id;
};

export const FREE_TRIAL_LIMIT = 5;

// Best-effort local cache of the free-trial count for display. The backend
// is the source of truth; this just avoids a round trip to show the UI badge.
export const getFreeTrialRemaining = async () => {
  const { freeTrialRemaining } = await chrome.storage.local.get('freeTrialRemaining');
  return typeof freeTrialRemaining === 'number' ? freeTrialRemaining : FREE_TRIAL_LIMIT;
};

export const saveFreeTrialRemaining = (remaining) =>
  chrome.storage.local.set({ freeTrialRemaining: Math.max(0, remaining) });

export const getFreeTrialStatus = async () => ({
  remaining: await getFreeTrialRemaining(),
  limit: FREE_TRIAL_LIMIT,
});

const SETTINGS_FIELDS = [
  'feedScannerEnabled',
  'feedScannerThreshold',
  'replyEnabled',
  'defaultTone',
];

export const getSettings = async () => {
  const [settings, claudeApiKey] = await Promise.all([
    chrome.storage.sync.get(SETTINGS_FIELDS),
    getApiKey(),
  ]);
  return {
    claudeApiKey,
    feedScannerEnabled: settings.feedScannerEnabled ?? true,
    feedScannerThreshold: settings.feedScannerThreshold ?? 60,
    replyEnabled: settings.replyEnabled ?? true,
    defaultTone: settings.defaultTone ?? 'professional',
  };
};

export const saveSettings = (settings) => {
  const { claudeApiKey, geminiApiKey, ...rest } = settings;
  const tasks = [chrome.storage.sync.set(rest)];
  const key = claudeApiKey ?? geminiApiKey;
  if (typeof key === 'string') tasks.push(saveApiKey(key));
  return Promise.all(tasks);
};

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
