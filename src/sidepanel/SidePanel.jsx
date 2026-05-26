import { useEffect, useRef, useState } from 'react';
import { Settings, PenSquare, Clock, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { useClaude } from '../hooks/useClaude.js';
import DraftEditor from '../components/DraftEditor.jsx';
import VariantTabs from '../components/VariantTabs.jsx';
import HookLibrary from '../components/HookLibrary.jsx';
import HistoryDrawer from '../components/HistoryDrawer.jsx';
import CalendarView from '../components/CalendarView.jsx';

const TONES = ['professional', 'casual', 'witty', 'thoughtful', 'bold', 'story'];

const PLACEHOLDERS = {
  linkedin: [
    'A lesson I learned from failing my first startup…',
    'Why most hiring loops are broken (and what fixed mine)…',
    'The unglamorous truth about closing my first $50k deal…',
    'A framework I use to plan every quarter…',
  ],
  x: [
    'Why most dev interviews are broken',
    'The 80/20 of writing clean code',
    'One habit that doubled my output',
    'What I wish I knew at 25',
  ],
};

export default function SidePanel() {
  const [tab, setTab] = useState('compose'); // compose | history | calendar
  const [platform, setPlatform] = useState('linkedin');
  const [tone, setTone] = useState('professional');
  const [hookId, setHookId] = useState(null);
  const [topic, setTopic] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('unknown'); // unknown | trained | empty
  const [mode, setMode] = useState('variants'); // single | variants
  const [variants, setVariants] = useState(null);
  const [chosenDraft, setChosenDraft] = useState(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const textareaRef = useRef(null);

  const single = useClaude('DRAFT_POST');
  const multi = useClaude('DRAFT_VARIANTS');
  const loading = single.loading || multi.loading;
  const error = single.error || multi.error;

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_VOICE' }).then(v => {
      if (v && (v.story || v.writingStyle || v.rawSamples)) setVoiceStatus('trained');
      else setVoiceStatus('empty');
    }).catch(() => setVoiceStatus('empty'));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS[platform].length), 4500);
    return () => clearInterval(id);
  }, [platform]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 220) + 'px';
    }
  }, [topic]);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setVariants(null);
    setChosenDraft(null);
    if (mode === 'variants') {
      const res = await multi.generate({ topic, platform, tone, hookId });
      if (res?.variants) setVariants(res.variants);
    } else {
      const res = await single.generate({ topic, platform, tone, hookId });
      if (res?.draft) setChosenDraft(res.draft);
    }
  }

  function handlePickVariant(text) {
    setChosenDraft(text);
  }

  function handleRestoreFromHistory(d) {
    setChosenDraft(d.text);
    setPlatform(d.platform || 'linkedin');
    setTone(d.tone || 'professional');
    setTopic(d.topic || '');
    setHookId(d.hookId || null);
    setVariants(null);
    setTab('compose');
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Header
        voiceStatus={voiceStatus}
        onOpenSettings={() => chrome.runtime.openOptionsPage()}
      />

      <Tabs tab={tab} setTab={setTab} />

      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        {tab === 'compose' && (
          <ComposeTab
            platform={platform} setPlatform={setPlatform}
            tone={tone} setTone={setTone}
            hookId={hookId} setHookId={setHookId}
            topic={topic} setTopic={setTopic}
            mode={mode} setMode={setMode}
            placeholder={PLACEHOLDERS[platform][placeholderIdx]}
            textareaRef={textareaRef}
            loading={loading}
            error={error}
            voiceStatus={voiceStatus}
            variants={variants}
            chosenDraft={chosenDraft}
            onGenerate={handleGenerate}
            onPickVariant={handlePickVariant}
            onRegenerate={handleGenerate}
            onClearDraft={() => { setChosenDraft(null); setVariants(null); }}
          />
        )}
        {tab === 'history' && (
          <HistoryDrawer onRestore={handleRestoreFromHistory} />
        )}
        {tab === 'calendar' && (
          <CalendarView />
        )}
      </div>
    </div>
  );
}

function Header({ voiceStatus, onOpenSettings }) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center text-white font-semibold text-sm">E</div>
          <div>
            <div className="font-semibold text-zinc-100 text-sm leading-tight">EngageFlow AI</div>
            <div className="text-[11px] text-zinc-500 leading-tight">Posts in your voice</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border transition-colors ${
              voiceStatus === 'trained'
                ? 'bg-emerald-600/15 border-emerald-700/50 text-emerald-300 hover:bg-emerald-600/25'
                : 'bg-amber-600/10 border-amber-700/40 text-amber-300 hover:bg-amber-600/20'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {voiceStatus === 'trained' ? 'Voice: trained' : 'Voice: set up'}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-900"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Tabs({ tab, setTab }) {
  const tabs = [
    { id: 'compose', label: 'Compose', icon: PenSquare },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];
  return (
    <div className="flex border-b border-zinc-900 px-2 bg-zinc-950 sticky top-0 z-10">
      {tabs.map(t => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              active
                ? 'text-emerald-400 border-emerald-500'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function ComposeTab({
  platform, setPlatform, tone, setTone, hookId, setHookId,
  topic, setTopic, mode, setMode, placeholder, textareaRef,
  loading, error, voiceStatus,
  variants, chosenDraft, onGenerate, onPickVariant, onRegenerate, onClearDraft,
}) {
  return (
    <div className="pt-4 space-y-4">
      {voiceStatus === 'empty' && (
        <div className="flex gap-2 p-2.5 bg-amber-600/10 border border-amber-700/40 rounded-md text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">No voice profile yet.</div>
            <div className="text-amber-200/80">Drafts use generic tone. Set up your voice in Settings for posts that sound like you.</div>
          </div>
        </div>
      )}

      <Section title="Platform">
        <div className="grid grid-cols-2 gap-2">
          {['linkedin', 'x'].map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${
                platform === p
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {p === 'linkedin' ? 'LinkedIn' : 'X / Twitter'}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Tone">
        <div className="grid grid-cols-3 gap-1.5">
          {TONES.map(t => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                tone === t
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Opening hook">
        <HookLibrary selectedId={hookId} onSelect={setHookId} />
      </Section>

      <div>
        <label className="label">What do you want to post about?</label>
        <textarea
          ref={textareaRef}
          className="input-field"
          rows={3}
          placeholder={placeholder}
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onGenerate(); }}
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-zinc-500">⌘/Ctrl+Enter to generate</p>
          <p className={`text-xs ${topic.length < 15 && topic.length > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
            {topic.length} chars{topic.length > 0 && topic.length < 15 ? ' · add more detail' : ''}
          </p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-zinc-900 rounded-md">
        <button
          onClick={() => setMode('variants')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
            mode === 'variants' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          3 variants
        </button>
        <button
          onClick={() => setMode('single')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
            mode === 'single' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Single draft
        </button>
      </div>

      <button
        className="btn-primary w-full py-3"
        onClick={onGenerate}
        disabled={loading || !topic.trim()}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-emerald-200/60 border-t-white rounded-full animate-spin" />
            Drafting in your voice…
          </span>
        ) : mode === 'variants' ? 'Generate 3 variants' : 'Generate post'}
      </button>

      {error === 'NO_API_KEY' && (
        <div className="card text-center">
          <p className="text-sm text-zinc-400 mb-2">No API key set.</p>
          <button
            className="text-emerald-400 text-sm hover:text-emerald-300 hover:underline"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            Open Settings →
          </button>
        </div>
      )}

      {error && error !== 'NO_API_KEY' && (
        <div className="card border-red-900/50 bg-red-950/20">
          <p className="text-sm text-red-400">
            {error === 'RATE_LIMIT'
              ? 'Rate limit hit. Wait a moment and retry.'
              : error === 'PARSE_ERROR'
                ? 'AI returned malformed output. Try again.'
                : `Generation failed: ${error}`}
          </p>
        </div>
      )}

      {variants && !chosenDraft && !loading && (
        <VariantTabs variants={variants} platform={platform} onSelect={onPickVariant} />
      )}

      {chosenDraft && !loading && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Draft</div>
            <button
              onClick={onClearDraft}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >Clear</button>
          </div>
          <DraftEditor
            draft={chosenDraft}
            platform={platform}
            topic={topic}
            tone={tone}
            hookId={hookId}
            onRegenerate={onRegenerate}
          />
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}
