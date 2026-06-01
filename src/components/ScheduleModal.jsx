import { useState } from 'react';
import { Calendar, X } from 'lucide-react';

export default function ScheduleModal({ text, platform, onClose, onScheduled }) {
  const [date, setDate] = useState(() => defaultDateStr());
  const [time, setTime] = useState(() => defaultTimeStr());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    const ts = new Date(`${date}T${time}`).getTime();
    if (Number.isNaN(ts)) { setErr('Invalid date/time'); return; }
    if (ts < Date.now()) { setErr('Pick a future time'); return; }
    setSaving(true);
    const res = await chrome.runtime.sendMessage({
      type: 'ADD_SCHEDULED',
      post: { text, platform, scheduledFor: ts },
    });
    setSaving(false);
    if (res?.entry) onScheduled?.(res.entry);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg p-4 dark:bg-zinc-950 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
            <Calendar className="w-4 h-4" /> Schedule reminder
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-zinc-500 mb-3">
          We can't auto-post to {platform === 'x' ? 'X' : 'LinkedIn'} (no public API).
          We'll save the draft and remind you at this time.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="label text-xs">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="label text-xs">Time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="input-field text-sm"
            />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-600 mb-3 max-h-24 overflow-y-auto whitespace-pre-wrap dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
          {text.slice(0, 300)}{text.length > 300 ? '…' : ''}
        </div>

        {err && <div className="text-xs text-red-500 dark:text-red-400 mb-2">{err}</div>}

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm py-2">
            {saving ? 'Saving…' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

function defaultDateStr() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
function defaultTimeStr() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
