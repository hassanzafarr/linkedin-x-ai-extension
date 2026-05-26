import { useState } from 'react';
import { Sparkles, ChevronDown, X } from 'lucide-react';
import { HOOK_PATTERNS } from '../lib/hooks.js';

export default function HookLibrary({ selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const selected = HOOK_PATTERNS.find(h => h.id === selectedId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors border ${
          selected
            ? 'bg-emerald-600/15 border-emerald-700/50 text-emerald-200'
            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          {selected ? (
            <span className="truncate"><span className="font-medium">Hook:</span> {selected.label}</span>
          ) : (
            <span className="text-zinc-400">Pick an opening hook (optional)</span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onSelect(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onSelect(null); } }}
              className="p-0.5 rounded hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-md shadow-xl max-h-72 overflow-y-auto">
          {HOOK_PATTERNS.map(h => (
            <button
              key={h.id}
              type="button"
              onClick={() => { onSelect(h.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 hover:bg-zinc-900 border-b border-zinc-900 last:border-b-0 ${
                h.id === selectedId ? 'bg-emerald-600/10' : ''
              }`}
            >
              <div className="text-sm font-medium text-zinc-100">{h.label}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{h.description}</div>
              <div className="text-xs text-zinc-600 mt-1 italic line-clamp-2">"{h.example}"</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
