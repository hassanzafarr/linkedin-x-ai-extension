import { callClaude } from '../lib/claude.js';
import { buildReplyPrompt, buildDraftPostPrompt, buildScoringPrompt, buildVoiceExtractionPrompt, buildIntentReplyPrompt } from '../lib/prompts.js';
import { INTENT_BY_ID } from '../lib/intents.js';
import { getApiKey, getSettings, saveSettings, getVoiceProfile, saveVoiceProfile } from '../lib/storage.js';
import { scrapeLinkedInProfile } from '../lib/linkedinScraper.js';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender).then(sendResponse).catch(err => sendResponse({ error: err.message }));
  return true; // keep channel open for async response
});

async function handleMessage(msg, sender) {
  switch (msg.type) {
    case 'GENERATE_REPLY':   return await generateReply(msg);
    case 'DRAFT_POST':       return await draftPost(msg);
    case 'SCORE_POST':       return await scorePost(msg);
    case 'GET_SETTINGS':     return await getAllSettings();
    case 'SAVE_SETTINGS':    return await persistSettings(msg);
    case 'GET_VOICE':        return await getVoiceProfile();
    case 'SAVE_VOICE':       return await saveVoiceProfile(msg.voiceProfile);
    case 'TEST_API_KEY':     return await testApiKey(msg.apiKey);
    case 'IMPORT_LINKEDIN':  return await importLinkedIn(msg, sender);
    case 'GENERATE_INTENT_REPLY': return await generateIntentReply(msg);
    default: throw new Error(`Unknown message type: ${msg.type}`);
  }
}

async function generateReply({ postText, platform }) {
  const [apiKey, voiceProfile] = await Promise.all([getApiKey(), getVoiceProfile()]);
  const prompt = buildReplyPrompt({ postText, voiceProfile, platform });
  const raw = await callClaude(prompt, apiKey);
  const suggestions = JSON.parse(raw);
  if (!Array.isArray(suggestions)) throw new Error('PARSE_ERROR');
  return { suggestions };
}

async function draftPost({ topic, platform, tone }) {
  const [apiKey, voiceProfile] = await Promise.all([getApiKey(), getVoiceProfile()]);
  const prompt = buildDraftPostPrompt({ topic, platform, tone, voiceProfile });
  const raw = await callClaude(prompt, apiKey);
  // draft prompt returns plain text, not JSON
  const draft = typeof raw === 'string' ? raw.replace(/^"|"$/g, '').trim() : raw;
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
  return JSON.parse(raw);
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

async function generateIntentReply({ postText, platform, intentId, customNote }) {
  const [apiKey, voiceProfile] = await Promise.all([getApiKey(), getVoiceProfile()]);
  if (!apiKey) throw new Error('NO_API_KEY');

  const intent = INTENT_BY_ID[intentId];
  const intentLabel = intent?.label || 'Custom';
  const intentInstruction = intent?.instruction
    || 'Follow the user-provided direction exactly. Write a single reply that fits the post.';

  const prompt = buildIntentReplyPrompt({
    postText,
    voiceProfile,
    platform,
    intentLabel,
    intentInstruction,
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
    const raw = await callClaude(prompt, apiKey);

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (parseErr) {
      console.error('[IMPORT_LINKEDIN] JSON parse fail:', parseErr, raw);
      return { ok: false, error: 'PARSE_ERROR: Claude returned non-JSON output.' };
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
