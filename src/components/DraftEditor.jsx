import { useEffect, useState } from 'react';
import { Copy, Check, RefreshCw, Save, Calendar, Layers, ExternalLink } from 'lucide-react';
import RefinePanel from './RefinePanel.jsx';
import ThreadBuilder from './ThreadBuilder.jsx';
import ScheduleModal from './ScheduleModal.jsx';

const X_CHAR_LIMIT = 280;
const LI_SOFT_LIMIT = 3000;

export default function DraftEditor({ draft, platform, topic, tone, hookId, onRegenerate, onSaved }) {
  const [text, setText] = useState(draft);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refineErr, setRefineErr] = useState('');
  const [threadOpen, setThreadOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => { setText(draft); }, [draft]);

  const isThread = text.includes('---');
  const charCount = text.length;
  const limit = platform === 'x' && !isThread ? X_CHAR_LIMIT : LI_SOFT_LIMIT;
  const overLimit = platform === 'x' && !isThread && charCount > X_CHAR_LIMIT;
  const ringPct = Math.min(100, (charCount / limit) * 100);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    await chrome.runtime.sendMessage({
      type: 'SAVE_DRAFT',
      draft: { text, platform, tone, topic, hookId },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onSaved?.();
  }

  async function handleRefine({ action, instruction, custom }) {
    setRefining(true);
    setRefineErr('');
    const res = await chrome.runtime.sendMessage({
      type: 'REFINE_DRAFT',
      currentDraft: text,
      refineAction: action,
      customInstruction: custom || instruction,
      platform,
    });
    setRefining(false);
    if (res?.error) { setRefineErr(res.error); return; }
    if (res?.draft) setText(res.draft);
  }

  function openComposeTab() {
    const url = platform === 'x'
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
      : 'https://www.linkedin.com/feed/';
    if (platform === 'linkedin') navigator.clipboard.writeText(text);
    window.open(url, '_blank');
  }

  return (
    <div className="draft-editor">
      <div className="relative">
        <textarea
          className="draft-textarea pr-14"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={10}
          spellCheck
        />
        <CharRing pct={ringPct} count={charCount} over={overLimit} isThread={isThread} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-300"
          title="Regenerate"
        >
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1 text-xs px-2 py-1 border rounded-md ${
            saved
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
          }`}
        >
          {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {saved ? 'Saved' : 'Save'}
        </button>
        {platform === 'x' && (
          <button
            onClick={() => setThreadOpen(o => !o)}
            className={`flex items-center gap-1 text-xs px-2 py-1 border rounded-md ${
              threadOpen
                ? 'bg-emerald-600/15 border-emerald-700/50 text-emerald-200'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
            }`}
          >
            <Layers className="w-3 h-3" /> Thread
          </button>
        )}
        <button
          onClick={() => setScheduleOpen(true)}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-300"
        >
          <Calendar className="w-3 h-3" /> Schedule
        </button>
        <button
          onClick={openComposeTab}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-300"
          title={platform === 'x' ? 'Open tweet composer' : 'Open LinkedIn (text copied)'}
        >
          <ExternalLink className="w-3 h-3" /> Open
        </button>
        <button
          onClick={handleCopy}
          className={`ml-auto flex items-center gap-1 text-xs px-3 py-1 rounded-md font-medium ${
            copied ? 'bg-emerald-700 text-white' : 'btn-primary'
          }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="mt-3">
        <RefinePanel onRefine={handleRefine} loading={refining} />
        {refineErr && <div className="text-xs text-red-400 mt-1">{refineErr}</div>}
      </div>

      {threadOpen && platform === 'x' && (
        <div className="mt-3">
          <ThreadBuilder
            initialText={text}
            onChange={setText}
            onClose={() => setThreadOpen(false)}
          />
        </div>
      )}

      {scheduleOpen && (
        <ScheduleModal
          text={text}
          platform={platform}
          onClose={() => setScheduleOpen(false)}
          onScheduled={() => {}}
        />
      )}
    </div>
  );
}

function CharRing({ pct, count, over, isThread }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * c;
  const stroke = over ? '#f87171' : pct > 90 ? '#fbbf24' : '#10b981';
  return (
    <div className="absolute top-2 right-2 flex items-center justify-center" title={isThread ? 'Thread' : `${count} chars`}>
      <svg width="32" height="32">
        <circle cx="16" cy="16" r={r} stroke="#27272a" strokeWidth="2.5" fill="none" />
        <circle
          cx="16" cy="16" r={r}
          stroke={stroke} strokeWidth="2.5" fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
        />
      </svg>
      <span className={`absolute text-[10px] font-mono ${over ? 'text-red-400' : 'text-zinc-400'}`}>
        {isThread ? 'T' : count > 999 ? `${Math.floor(count / 100) / 10}k` : count}
      </span>
    </div>
  );
}
