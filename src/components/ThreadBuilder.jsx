import { useMemo, useState } from 'react';
import { GripVertical, Trash2, Plus, Copy, Check } from 'lucide-react';

const X_LIMIT = 280;

export default function ThreadBuilder({ initialText, onChange, onClose }) {
  const [tweets, setTweets] = useState(() => {
    const parts = (initialText || '').split(/\n*---+\n*/).map(p => p.trim()).filter(Boolean);
    return parts.length ? parts : [''];
  });
  const [dragIdx, setDragIdx] = useState(null);
  const [copied, setCopied] = useState(false);

  const joined = useMemo(() => tweets.filter(t => t.trim()).join('\n\n---\n\n'), [tweets]);

  function update(i, val) {
    const next = [...tweets];
    next[i] = val;
    setTweets(next);
    onChange?.(next.filter(t => t.trim()).join('\n\n---\n\n'));
  }
  function add() {
    if (tweets.length >= 10) return;
    const next = [...tweets, ''];
    setTweets(next);
  }
  function remove(i) {
    if (tweets.length === 1) { setTweets(['']); return; }
    const next = tweets.filter((_, idx) => idx !== i);
    setTweets(next);
    onChange?.(next.filter(t => t.trim()).join('\n\n---\n\n'));
  }
  function onDragStart(i) { setDragIdx(i); }
  function onDragOver(e) { e.preventDefault(); }
  function onDrop(i) {
    if (dragIdx === null || dragIdx === i) return;
    const next = [...tweets];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setTweets(next);
    setDragIdx(null);
    onChange?.(next.filter(t => t.trim()).join('\n\n---\n\n'));
  }
  async function copyAll() {
    await navigator.clipboard.writeText(joined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="thread-builder bg-zinc-950 border border-zinc-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-zinc-100">Thread builder ({tweets.length}/10)</div>
        <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-200">Close</button>
      </div>

      <div className="space-y-2">
        {tweets.map((t, i) => {
          const len = t.length;
          const over = len > X_LIMIT;
          return (
            <div
              key={i}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(i)}
              className={`flex gap-2 p-2 bg-zinc-900 border rounded-md ${over ? 'border-red-900/60' : 'border-zinc-800'}`}
            >
              <div className="flex flex-col items-center gap-1 pt-1.5 text-zinc-500">
                <GripVertical className="w-3.5 h-3.5 cursor-grab" />
                <span className="text-xs font-mono">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <textarea
                  value={t}
                  onChange={e => update(i, e.target.value)}
                  placeholder={i === 0 ? 'Opening hook…' : 'Next tweet…'}
                  rows={3}
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${over ? 'text-red-400' : 'text-zinc-500'}`}>
                    {len}/{X_LIMIT}
                  </span>
                  <button onClick={() => remove(i)} className="text-zinc-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={add}
          disabled={tweets.length >= 10}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-300 disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Add tweet
        </button>
        <button
          onClick={copyAll}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md ${copied ? 'bg-emerald-700 text-white' : 'btn-primary'}`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy thread'}
        </button>
      </div>
    </div>
  );
}
