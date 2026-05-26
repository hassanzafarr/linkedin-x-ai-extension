import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';

const REFINE_ACTIONS = [
  { id: 'shorter', label: 'Shorter', instruction: 'Cut the length by at least 30% without losing the core message. Trim weak words.' },
  { id: 'longer', label: 'Expand', instruction: 'Expand with one extra concrete detail, example, or context. Do not pad with filler.' },
  { id: 'punchier', label: 'Punchier', instruction: 'Make every sentence punchier. Strip filler, use stronger verbs, shorter sentences.' },
  { id: 'more_story', label: 'More story', instruction: 'Add a concrete first-person micro-story or scene to ground the abstract points.' },
  { id: 'less_formal', label: 'Less formal', instruction: 'Make it more conversational and human. Drop corporate-speak.' },
  { id: 'more_pro', label: 'More polished', instruction: 'Tighten the language. Make it sound more professional and authoritative without being stiff.' },
  { id: 'stronger_hook', label: 'Stronger hook', instruction: 'Rewrite only the opening line to be more scroll-stopping. Keep the rest intact.' },
  { id: 'add_cta', label: 'Add CTA', instruction: 'Add a clear closing question or call-to-action that invites comments.' },
  { id: 'no_emoji', label: 'No emojis', instruction: 'Remove all emojis. Keep the meaning.' },
  { id: 'no_hashtags', label: 'No hashtags', instruction: 'Remove all hashtags.' },
];

export default function RefinePanel({ onRefine, loading }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  function runCustom() {
    if (!customText.trim()) return;
    onRefine({
      action: customText.trim(),
      instruction: customText.trim(),
      custom: customText.trim(),
    });
    setCustomText('');
    setCustomOpen(false);
  }

  return (
    <div className="refine-panel">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        <Wand2 className="w-3 h-3" /> Refine
      </div>
      <div className="flex flex-wrap gap-1.5">
        {REFINE_ACTIONS.map(a => (
          <button
            key={a.id}
            disabled={loading}
            onClick={() => onRefine({ action: a.label, instruction: a.instruction })}
            className="px-2.5 py-1 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md text-zinc-300 transition-colors disabled:opacity-40"
          >
            {a.label}
          </button>
        ))}
        <button
          disabled={loading}
          onClick={() => setCustomOpen(o => !o)}
          className="px-2.5 py-1 text-xs bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-700/40 rounded-md text-emerald-200 transition-colors disabled:opacity-40"
        >
          + Custom
        </button>
      </div>

      {customOpen && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runCustom(); }}
            placeholder="e.g. swap the example for one from healthcare"
            className="input-field text-xs py-1.5"
          />
          <button
            onClick={runCustom}
            disabled={!customText.trim() || loading}
            className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
          >
            Apply
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
          <Loader2 className="w-3 h-3 animate-spin" /> Refining…
        </div>
      )}
    </div>
  );
}
