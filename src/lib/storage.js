export const getVoiceProfile = () =>
  chrome.storage.local.get('voiceProfile').then(r => r.voiceProfile ?? null);

export const saveVoiceProfile = (data) =>
  chrome.storage.local.set({ voiceProfile: data });

export const getApiKey = () =>
  chrome.storage.sync.get(['claudeApiKey', 'geminiApiKey']).then(r => r.claudeApiKey || r.geminiApiKey || '');

export const saveApiKey = (key) =>
  chrome.storage.sync.set({ claudeApiKey: key });

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
