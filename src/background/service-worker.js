import { callClaude } from '../lib/claude.js';
import {
  buildReplyPrompt,
  buildDraftPostPrompt,
  buildVariantsPrompt,
  buildRefinePrompt,
  buildScoringPrompt,
  buildVoiceExtractionPrompt,
  buildIntentReplyPrompt,
} from '../lib/prompts.js';
import { COMMENT_LENGTH_BY_ID, INTENT_BY_ID } from '../lib/intents.js';
import { HOOK_BY_ID } from '../lib/hooks.js';
import {
  getApiKey,
  getSettings,
  saveSettings,
  getVoiceProfile,
  saveVoiceProfile,
  saveDraftToHistory,
  getDraftHistory,
  deleteDraftFromHistory,
  clearDraftHistory,
  getScheduledPosts,
  addScheduledPost,
  updateScheduledPost,
  deleteScheduledPost,
} from '../lib/storage.js';
import { scrapeLinkedInProfile } from '../lib/linkedinScraper.js';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Only accept messages from our own extension surfaces (popup, sidepanel,
  // options, content scripts). External pages cannot reach here today because
  // no `externally_connectable` is declared, but enforce explicitly for
  // defense in depth.
  if (sender?.id !== chrome.runtime.id) {
    sendResponse({ error: 'UNAUTHORIZED_SENDER' });
    return false;
  }
  handleMessage(msg, sender).then(sendResponse).catch(err => sendResponse({ error: err.message }));
  return true; // keep channel open for async response
});

// Reminder alarms for scheduled posts
const ALARM_PREFIX = 'schedPost_';

async function syncScheduledAlarms() {
  try {
    const scheduled = await getScheduledPosts();
    const existing = await chrome.alarms.getAll();
    for (const a of existing) {
      if (a.name.startsWith(ALARM_PREFIX)) await chrome.alarms.clear(a.name);
    }
    const now = Date.now();
    for (const p of scheduled) {
      if (p.status === 'done' || p.scheduledFor <= now) continue;
      chrome.alarms.create(`${ALARM_PREFIX}${p.id}`, { when: p.scheduledFor });
    }
  } catch (err) {
    console.warn('[alarms] sync failed:', err);
  }
}

chrome.alarms?.onAlarm?.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  const id = alarm.name.slice(ALARM_PREFIX.length);
  const list = await getScheduledPosts();
  const post = list.find(p => p.id === id);
  if (!post) return;
  try {
    await chrome.notifications.create(`notify_${id}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: `Post reminder: ${post.platform === 'x' ? 'X' : 'LinkedIn'}`,
      message: post.text.slice(0, 200),
      priority: 2,
    });
  } catch (err) {
    console.warn('[notifications] failed:', err);
  }
  await updateScheduledPost(id, { status: 'notified' });
});

chrome.runtime.onInstalled.addListener(syncScheduledAlarms);
chrome.runtime.onStartup.addListener(syncScheduledAlarms);

async function handleMessage(msg, sender) {
  switch (msg.type) {
    case 'GENERATE_REPLY':   return await generateReply(msg);
    case 'DRAFT_POST':       return await draftPost(msg);
    case 'DRAFT_VARIANTS':   return await draftVariants(msg);
    case 'REFINE_DRAFT':     return await refineDraft(msg);
    case 'SCORE_POST':       return await scorePost(msg);
    case 'GET_SETTINGS':     return await getAllSettings();
    case 'SAVE_SETTINGS':    return await persistSettings(msg);
    case 'GET_VOICE':        return await getVoiceProfile();
    case 'SAVE_VOICE':       return await saveVoiceProfile(msg.voiceProfile);
    case 'TEST_API_KEY':     return await testApiKey(msg.apiKey);
    case 'IMPORT_LINKEDIN':  return await importLinkedIn(msg, sender);
    case 'GENERATE_INTENT_REPLY': return await generateIntentReply(msg);
    case 'SAVE_DRAFT':       return { entry: await saveDraftToHistory(msg.draft) };
    case 'LIST_DRAFTS':      return { drafts: await getDraftHistory() };
    case 'DELETE_DRAFT':     await deleteDraftFromHistory(msg.id); return { ok: true };
    case 'CLEAR_DRAFTS':     await clearDraftHistory(); return { ok: true };
    case 'LIST_SCHEDULED':   return { scheduled: await getScheduledPosts() };
    case 'ADD_SCHEDULED':    { const entry = await addScheduledPost(msg.post); await syncScheduledAlarms(); return { entry }; }
    case 'UPDATE_SCHEDULED': await updateScheduledPost(msg.id, msg.patch); await syncScheduledAlarms(); return { ok: true };
    case 'DELETE_SCHEDULED': await deleteScheduledPost(msg.id); await syncScheduledAlarms(); return { ok: true };
    default: throw new Error(`Unknown message type: ${msg.type}`);
  }
}

async function generateReply({ postText, platform }) {
  const [apiKey, voiceProfile] = await Promise.all([getApiKey(), getVoiceProfile()]);
  const prompt = buildReplyPrompt({ postText, voiceProfile, platform });
  const raw = await callClaude(prompt, apiKey);
  let suggestions;
  try { suggestions = JSON.parse(raw); } catch { throw new Error('PARSE_ERROR'); }
  if (!Array.isArray(suggestions)) throw new Error('PARSE_ERROR');
  return { suggestions };
}

async function draftPost({ topic, platform, tone, hookId }) {
  const [apiKey, voiceProfile] = await Promise.all([getApiKey(), getVoiceProfile()]);
  const hookPattern = hookId ? HOOK_BY_ID[hookId] : null;
  const prompt = buildDraftPostPrompt({ topic, platform, tone, voiceProfile, hookPattern });
  const raw = await callClaude(prompt, apiKey);
  const draft = typeof raw === 'string' ? raw.replace(/^"|"$/g, '').trim() : raw;
  return { draft };
}

async function draftVariants({ topic, platform, tone, hookId }) {
  const [apiKey, voiceProfile] = await Promise.all([getApiKey(), getVoiceProfile()]);
  const hookPattern = hookId ? HOOK_BY_ID[hookId] : null;
  const prompt = buildVariantsPrompt({ topic, platform, tone, voiceProfile, hookPattern });
  const raw = await callClaude(prompt, apiKey, { maxTokens: platform === 'linkedin' ? 4000 : 2000 });
  let variants;
  try { variants = JSON.parse(raw); }
  catch { throw new Error('PARSE_ERROR'); }
  if (!Array.isArray(variants) || variants.length === 0) throw new Error('PARSE_ERROR');
  return { variants: variants.slice(0, 3).map(v => String(v).trim()) };
}

async function refineDraft({ currentDraft, refineAction, customInstruction, platform }) {
  const [apiKey, voiceProfile] = await Promise.all([getApiKey(), getVoiceProfile()]);
  const prompt = buildRefinePrompt({ currentDraft, refineAction, customInstruction, platform, voiceProfile });
  const raw = await callClaude(prompt, apiKey);
  const draft = typeof raw === 'string' ? raw.replace(/^"|"$/g, '').trim() : String(raw);
  return { draft };
}

async function scorePost({ postText, platform }) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    // fall back to heuristic if no API key
    return { score: 50, reasons: ['Heuristic score — set API key for AI scoring'] };
  }
  const prompt = buildScoringPrompt({ postText, platform });
  const raw = await callClaude(prompt, apiKey);
  try { return JSON.parse(raw); } catch { throw new Error('PARSE_ERROR'); }
}

async function getAllSettings() {
  const [settings, voiceProfile] = await Promise.all([getSettings(), getVoiceProfile()]);
  return { ...settings, voiceProfile };
}

async function persistSettings({ settings, voiceProfile }) {
  const tasks = [];
  if (settings) tasks.push(saveSettings(settings));
  if (voiceProfile !== undefined) tasks.push(saveVoiceProfile(voiceProfile));
  await Promise.all(tasks);
  return { ok: true };
}

async function generateIntentReply({ postText, platform, intentId, commentLength, customNote }) {
  const [apiKey, voiceProfile] = await Promise.all([getApiKey(), getVoiceProfile()]);
  if (!apiKey) throw new Error('NO_API_KEY');

  const intent = INTENT_BY_ID[intentId];
  const length = COMMENT_LENGTH_BY_ID[commentLength] || COMMENT_LENGTH_BY_ID.short;
  const intentLabel = intent?.label || 'Custom';
  const intentInstruction = intent?.instruction
    || 'Follow the user-provided direction exactly. Write a single reply that fits the post.';

  const prompt = buildIntentReplyPrompt({
    postText,
    voiceProfile,
    platform,
    intentLabel,
    intentInstruction,
    lengthLabel: length.label,
    lengthInstruction: length.instruction,
    customNote,
  });

  const raw = await callClaude(prompt, apiKey);
  const reply = typeof raw === 'string' ? raw.replace(/^"|"$/g, '').trim() : String(raw);
  return { reply };
}

async function importLinkedIn({ profileUrl }, sender) {
  const apiKey = await getApiKey();
  if (!apiKey) return { ok: false, error: 'NO_API_KEY: Set your Claude API key first.' };

  const senderTabId = sender?.tab?.id;
  const emit = (payload) => {
    chrome.runtime.sendMessage({ type: 'IMPORT_LINKEDIN_PROGRESS', ...payload }).catch(() => {});
    if (senderTabId) chrome.tabs.sendMessage(senderTabId, { type: 'IMPORT_LINKEDIN_PROGRESS', ...payload }).catch(() => {});
  };

  try {
    emit({ stage: 'starting', message: 'Starting import…' });

    const { profileText, activityText, profileUrl: normalized } = await scrapeLinkedInProfile(
      profileUrl,
      (p) => emit(p),
    );

    if (!profileText && !activityText) {
      return { ok: false, error: 'NO_DATA: Could not read the profile. Make sure you are logged in to LinkedIn in this Chrome.' };
    }

    emit({ stage: 'analyzing', message: 'Analyzing voice with Claude…' });
    const prompt = buildVoiceExtractionPrompt({ profileText, activityText });
    const raw = await callClaude(prompt, apiKey, { maxTokens: 6000 });

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (parseErr) {
      const preview = (raw || '').slice(0, 300).replace(/\n/g, ' ');
      return { ok: false, error: `PARSE_ERROR: Claude returned non-JSON output. First 300 chars: ${preview}` };
    }

    const samples = Array.isArray(parsed?.samples) ? parsed.samples : [];
    const rawSamples = samples.join('\n\n---\n\n');
    const story = typeof parsed?.story === 'string' ? parsed.story : '';
    const writingStyle = typeof parsed?.writingStyle === 'string' ? parsed.writingStyle : '';

    emit({ stage: 'done', message: `Imported ${samples.length} samples.` });

    return {
      ok: true,
      profileUrl: normalized,
      name: parsed?.name || '',
      headline: parsed?.headline || '',
      story,
      writingStyle,
      rawSamples,
      sampleCount: samples.length,
    };
  } catch (err) {
    console.error('[IMPORT_LINKEDIN] failed:', err);
    emit({ stage: 'error', message: err.message });
    return { ok: false, error: err.message };
  }
}

async function testApiKey(apiKey) {
  try {
    await callClaude('Return the JSON: {"ok": true}', apiKey);
    return { ok: true };
  } catch (err) {
    console.error('[TEST_API_KEY] failed:', err);
    return {
      ok: false,
      error: err.message,
      status: err.status,
      apiType: err.apiType,
      apiMessage: err.apiMessage,
    };
  }
}
