import { useState, useEffect } from 'react';
import { getApiKey, saveApiKey, getVoiceProfile, saveVoiceProfile, getSettings, saveSettings } from '../lib/storage.js';

export default function Options() {
  const [apiKey, setApiKey] = useState('');
  const [voiceSamples, setVoiceSamples] = useState('');
  const [story, setStory] = useState('');
  const [writingStyle, setWritingStyle] = useState('');
  const [feedEnabled, setFeedEnabled] = useState(true);
  const [replyEnabled, setReplyEnabled] = useState(true);
  const [threshold, setThreshold] = useState(60);
  const [defaultTone, setDefaultTone] = useState('professional');

  const [testStatus, setTestStatus] = useState('idle'); // idle | testing | ok | error
  const [testError, setTestError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved

  const [profileUrl, setProfileUrl] = useState('');
  const [importStatus, setImportStatus] = useState('idle'); // idle | running | ok | error
  const [importStage, setImportStage] = useState('');
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState(null);

  useEffect(() => {
    function onProgress(msg) {
      if (msg?.type === 'IMPORT_LINKEDIN_PROGRESS') {
        setImportStage(msg.message || msg.stage || '');
      }
    }
    chrome.runtime.onMessage.addListener(onProgress);
    return () => chrome.runtime.onMessage.removeListener(onProgress);
  }, []);

  useEffect(() => {
    Promise.all([getApiKey(), getVoiceProfile(), getSettings()]).then(([key, voice, settings]) => {
      setApiKey(key || '');
      setVoiceSamples(voice?.rawSamples || '');
      setStory(voice?.story || '');
      setWritingStyle(voice?.writingStyle || '');
      setFeedEnabled(settings.feedScannerEnabled);
      setReplyEnabled(settings.replyEnabled);
      setThreshold(settings.feedScannerThreshold);
      setDefaultTone(settings.defaultTone);
    });
  }, []);

  async function testConnection() {
    setTestStatus('testing');
    setTestError('');
    const trimmed = apiKey.trim();
    console.log('[Options] Testing key. Prefix:', trimmed.slice(0, 12), 'length:', trimmed.length);
    const result = await chrome.runtime.sendMessage({ type: 'TEST_API_KEY', apiKey: trimmed });
    console.log('[Options] Test result:', result);
    setTestStatus(result.ok ? 'ok' : 'error');
    if (result.ok) {
      // Persist immediately so refresh doesn't drop the key.
      saveApiKey(trimmed).catch(err => console.error('[Options] saveApiKey failed:', err));
    } else {
      setTestError(result.error || 'Unknown error');
    }
    setTimeout(() => setTestStatus('idle'), 8000);
  }

  function persistApiKeyOnBlur() {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    saveApiKey(trimmed).catch(err => console.error('[Options] saveApiKey failed:', err));
  }

  async function importFromLinkedIn() {
    setImportStatus('running');
    setImportError('');
    setImportSummary(null);
    setImportStage('Starting…');
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'IMPORT_LINKEDIN',
        profileUrl: profileUrl.trim(),
      });
      console.log('[Options] Import result:', result);
      if (!result?.ok) {
        setImportStatus('error');
        setImportError(result?.error || 'Unknown error');
        return;
      }
      if (result.rawSamples) {
        setVoiceSamples(prev => prev ? `${prev}\n\n---\n\n${result.rawSamples}` : result.rawSamples);
      }
      if (result.story) setStory(result.story);
      if (result.writingStyle) setWritingStyle(result.writingStyle);
      setImportSummary({
        name: result.name,
        headline: result.headline,
        count: result.sampleCount,
      });
      setImportStatus('ok');
    } catch (err) {
      setImportStatus('error');
      setImportError(err.message || String(err));
    }
  }

  async function handleSave() {
    setSaveStatus('saving');
    await Promise.all([
      saveApiKey(apiKey),
      saveVoiceProfile({ rawSamples: voiceSamples, story, writingStyle, updatedAt: Date.now() }),
      saveSettings({ feedScannerEnabled: feedEnabled, replyEnabled, feedScannerThreshold: threshold, defaultTone }),
    ]);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }

  const sampleBytes = new TextEncoder().encode(voiceSamples).length;
  const sampleKB = (sampleBytes / 1024).toFixed(1);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">D</div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">EngageFlow AI Settings</h1>
          <p className="text-xs text-slate-400">AI for LinkedIn &amp; X</p>
        </div>
      </div>

      {/* API Key */}
      <div className="card mb-5">
        <div className="section-title">Claude API Key</div>
        <div className="flex gap-2">
          <input
            type="password"
            className="input-field"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onBlur={persistApiKeyOnBlur}
          />
          <button
            className="btn-secondary whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold"
            onClick={testConnection}
            disabled={!apiKey || testStatus === 'testing'}
          >
            {testStatus === 'testing' ? '…' : testStatus === 'ok' ? '✓ OK' : testStatus === 'error' ? '✕ Failed' : 'Test'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Get an API key at{' '}
          <a className="text-violet-400 hover:underline" href="https://console.anthropic.com/" target="_blank" rel="noreferrer">
            console.anthropic.com
          </a>
        </p>
        {testError && (
          <pre className="text-xs text-red-400 mt-2 whitespace-pre-wrap break-all bg-red-950/30 border border-red-900/50 rounded p-2">
            {testError}
          </pre>
        )}
      </div>

      {/* Voice Profile */}
      <div className="card mb-5">
        <div className="section-title">Voice Profile</div>

        <label className="label">Import from LinkedIn</label>
        <div className="flex gap-2">
          <input
            type="url"
            className="input-field"
            placeholder="https://linkedin.com/in/your-profile"
            value={profileUrl}
            onChange={e => setProfileUrl(e.target.value)}
            disabled={importStatus === 'running'}
          />
          <button
            className="btn-secondary whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold"
            onClick={importFromLinkedIn}
            disabled={!profileUrl || importStatus === 'running' || !apiKey}
          >
            {importStatus === 'running' ? '…' : importStatus === 'ok' ? '✓ Imported' : 'Import'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Make sure you are logged in to LinkedIn in this Chrome. We open your profile in a background tab, scroll it, and analyze visible text. Takes ~30–45s.
        </p>
        {importStatus === 'running' && (
          <p className="text-xs text-violet-300 mt-2">{importStage}</p>
        )}
        {importStatus === 'ok' && importSummary && (
          <p className="text-xs text-emerald-400 mt-2">
            Imported {importSummary.count} samples
            {importSummary.name && ` for ${importSummary.name}`}
            {importSummary.headline && ` — ${importSummary.headline}`}.
          </p>
        )}
        {importStatus === 'error' && importError && (
          <pre className="text-xs text-red-400 mt-2 whitespace-pre-wrap break-all bg-red-950/30 border border-red-900/50 rounded p-2">
            {importError}
          </pre>
        )}

        <label className="label mt-4">Your story in a few sentences</label>
        <p className="text-xs text-slate-500 mb-1">What you work on and care about. Auto-filled from LinkedIn import — edit if needed.</p>
        <textarea
          className="input-field"
          rows={4}
          placeholder="I work on… I care about… The unique experiences that shape how I show up in comments."
          value={story}
          onChange={e => setStory(e.target.value)}
        />

        <label className="label mt-4">Writing style</label>
        <p className="text-xs text-slate-500 mb-1">How you write — tone, sentence length, recurring patterns. Auto-filled from import.</p>
        <textarea
          className="input-field"
          rows={4}
          placeholder="Conversational, short sentences, occasional bullet lists, no emojis…"
          value={writingStyle}
          onChange={e => setWritingStyle(e.target.value)}
        />

        <label className="label mt-4">Voice samples</label>
        <textarea
          className="input-field"
          rows={8}
          placeholder="Paste your past posts and comments here, or use LinkedIn import above. The AI will learn your tone, vocabulary, and style from these examples..."
          value={voiceSamples}
          onChange={e => setVoiceSamples(e.target.value)}
        />
        <p className={`text-xs mt-1 ${sampleBytes > 40000 ? 'text-amber-400' : 'text-slate-500'}`}>
          {sampleKB} KB used {sampleBytes > 40000 && '— consider trimming to keep quality high'}
        </p>
      </div>

      {/* Feature Toggles */}
      <div className="card mb-5">
        <div className="section-title">Features</div>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-200 font-medium">Feed Scanner</div>
              <div className="text-xs text-slate-500">Highlight high-value posts in your feed</div>
            </div>
            <input
              type="checkbox"
              className="w-4 h-4 accent-violet-500"
              checked={feedEnabled}
              onChange={e => setFeedEnabled(e.target.checked)}
            />
          </label>

          {feedEnabled && (
            <div>
              <label className="label">Score threshold: {threshold}</label>
              <input
                type="range" min="30" max="90" step="5"
                className="w-full accent-violet-500"
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Show more</span><span>Show less</span>
              </div>
            </div>
          )}

          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-200 font-medium">Reply Suggestions</div>
              <div className="text-xs text-slate-500">Show "Draft Reply" button on posts</div>
            </div>
            <input
              type="checkbox"
              className="w-4 h-4 accent-violet-500"
              checked={replyEnabled}
              onChange={e => setReplyEnabled(e.target.checked)}
            />
          </label>

          <div>
            <label className="label">Default tone</label>
            <select
              className="input-field"
              value={defaultTone}
              onChange={e => setDefaultTone(e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="witty">Witty</option>
              <option value="thoughtful">Thoughtful</option>
            </select>
          </div>
        </div>
      </div>

      <button
        className="btn-primary w-full py-3 text-base"
        onClick={handleSave}
        disabled={saveStatus === 'saving'}
      >
        {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
