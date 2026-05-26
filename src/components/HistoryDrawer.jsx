import { useEffect, useState } from 'react';
import { Trash2, RefreshCw, Clock } from 'lucide-react';

export default function HistoryDrawer({ onRestore }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const res = await chrome.runtime.sendMessage({ type: 'LIST_DRAFTS' });
    setDrafts(res?.drafts || []);
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  async function remove(id) {
    await chrome.runtime.sendMessage({ type: 'DELETE_DRAFT', id });
    setDrafts(prev => prev.filter(d => d.id !== id));
  }

  async function clearAll() {
    if (!confirm('Clear all draft history?')) return;
    await chrome.runtime.sendMessage({ type: 'CLEAR_DRAFTS' });
    setDrafts([]);
  }

  if (loading) {
    return <div className="text-sm text-zinc-500 py-6 text-center">Loading…</div>;
  }
  if (!drafts.length) {
    return (
      <div className="text-center py-10">
        <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">No drafts yet.</p>
        <p className="text-xs text-zinc-600 mt-1">Saved drafts appear here.</p>
      </div>
    );
  }

  return (
    <div className="history-drawer">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          History ({drafts.length})
        </div>
        <div className="flex gap-1">
          <button onClick={reload} className="p-1 text-zinc-500 hover:text-zinc-300" title="Reload">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={clearAll} className="text-xs text-red-400/80 hover:text-red-300">
            Clear all
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {drafts.map(d => (
          <div key={d.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">
                {timeAgo(d.createdAt)} · {d.platform === 'x' ? 'X' : 'LinkedIn'} · {d.tone}
              </span>
              <button onClick={() => remove(d.id)} className="text-zinc-500 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {d.topic && (
              <div className="text-xs text-zinc-400 mb-1 truncate">Topic: {d.topic}</div>
            )}
            <div className="text-sm text-zinc-200 line-clamp-3 whitespace-pre-wrap mb-2">
              {d.text}
            </div>
            <button
              onClick={() => onRestore(d)}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Restore →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
