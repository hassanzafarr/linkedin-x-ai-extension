import { useEffect, useState } from 'react';
import { Trash2, Calendar as CalIcon, Copy } from 'lucide-react';

export default function CalendarView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | week

  async function reload() {
    setLoading(true);
    const res = await chrome.runtime.sendMessage({ type: 'LIST_SCHEDULED' });
    setItems(res?.scheduled || []);
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  async function remove(id) {
    await chrome.runtime.sendMessage({ type: 'DELETE_SCHEDULED', id });
    setItems(prev => prev.filter(p => p.id !== id));
  }

  async function copy(text) {
    await navigator.clipboard.writeText(text);
  }

  if (loading) {
    return <div className="text-sm text-zinc-500 py-6 text-center">Loading…</div>;
  }
  if (!items.length) {
    return (
      <div className="text-center py-10">
        <CalIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">Nothing scheduled.</p>
        <p className="text-xs text-zinc-600 mt-1">Schedule a draft to plan your week.</p>
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Scheduled ({items.length})
        </div>
        <div className="flex gap-1 p-0.5 bg-zinc-900 rounded">
          <button
            onClick={() => setView('list')}
            className={`px-2 py-0.5 text-xs rounded ${view === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >List</button>
          <button
            onClick={() => setView('week')}
            className={`px-2 py-0.5 text-xs rounded ${view === 'week' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >Week</button>
        </div>
      </div>

      {view === 'list' ? (
        <ListView items={items} onRemove={remove} onCopy={copy} />
      ) : (
        <WeekView items={items} onRemove={remove} onCopy={copy} />
      )}
    </div>
  );
}

function ListView({ items, onRemove, onCopy }) {
  return (
    <div className="space-y-2">
      {items.map(p => (
        <ScheduledRow key={p.id} item={p} onRemove={onRemove} onCopy={onCopy} />
      ))}
    </div>
  );
}

function WeekView({ items, onRemove, onCopy }) {
  const days = nextSevenDays();
  return (
    <div className="space-y-3">
      {days.map(d => {
        const dayItems = items.filter(i => sameDay(i.scheduledFor, d));
        return (
          <div key={d.toISOString()}>
            <div className="text-xs font-medium text-zinc-400 mb-1.5">
              {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              <span className="text-zinc-600 ml-2">({dayItems.length})</span>
            </div>
            {dayItems.length === 0 ? (
              <div className="text-xs text-zinc-700 italic pl-2">empty</div>
            ) : (
              <div className="space-y-1.5">
                {dayItems.map(p => (
                  <ScheduledRow key={p.id} item={p} compact onRemove={onRemove} onCopy={onCopy} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ScheduledRow({ item, compact, onRemove, onCopy }) {
  const overdue = item.scheduledFor < Date.now() && item.status !== 'done';
  return (
    <div className={`${compact ? 'p-2' : 'p-3'} bg-zinc-900 border rounded-md ${overdue ? 'border-amber-900/60' : 'border-zinc-800'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs ${overdue ? 'text-amber-400' : 'text-zinc-500'}`}>
          {formatTime(item.scheduledFor)} · {item.platform === 'x' ? 'X' : 'LinkedIn'}
          {overdue && ' · due'}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onCopy(item.text)} className="text-zinc-500 hover:text-zinc-200" title="Copy">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={() => onRemove(item.id)} className="text-zinc-500 hover:text-red-400" title="Delete">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className={`${compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'} text-zinc-200 whitespace-pre-wrap`}>
        {item.text}
      </div>
    </div>
  );
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}
function nextSevenDays() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * 86400000));
}
function sameDay(ts, d) {
  const x = new Date(ts);
  return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate();
}
