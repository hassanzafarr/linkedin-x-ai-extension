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
            ? 'bg-emerald-600/15 border-emerald-700/50 text-emerald-700 dark:text-emerald-200'
            : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:text-zinc-300'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          {selected ? (
            <span className="truncate"><span className="font-medium">Hook:</span> {selected.label}</span>
          ) : (
            <span className="text-gray-400 dark:text-zinc-400">Pick an opening hook (optional)</span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onSelect(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onSelect(null); } }}
              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-xl max-h-72 overflow-y-auto dark:bg-zinc-950 dark:border-zinc-800">
          {HOOK_PATTERNS.map(h => (
            <button
              key={h.id}
              type="button"
              onClick={() => { onSelect(h.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 dark:hover:bg-zinc-900 dark:border-zinc-900 ${
                h.id === selectedId ? 'bg-emerald-50 dark:bg-emerald-600/10' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">{h.label}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{h.description}</div>
              <div className="text-xs text-gray-400 dark:text-zinc-600 mt-1 italic line-clamp-2">"{h.example}"</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
