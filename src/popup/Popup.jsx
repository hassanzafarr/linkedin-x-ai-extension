import { useState, useEffect } from 'react';
import { getApiKey } from '../lib/storage.js';

export default function Popup() {
  const [hasKey, setHasKey] = useState(null);

  useEffect(() => {
    getApiKey().then(key => setHasKey(!!key));
  }, []);

  async function openSidePanel() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ windowId: tab.windowId });
    window.close();
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  return (
    <div className="w-[260px] p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">D</div>
        <span className="font-bold text-base text-slate-100">Draftly</span>
      </div>

      {hasKey === null && (
        <div className="card mb-3 h-8 animate-pulse" />
      )}

      {hasKey === false && (
        <div className="bg-violet-900 border border-violet-700 rounded-lg px-3 py-2 mb-3 text-xs text-violet-300">
          ⚠ Set your Gemini API key to activate AI features.
        </div>
      )}

      {hasKey === true && (
        <div className="bg-emerald-950 border border-emerald-900 rounded-lg px-3 py-2 mb-3 text-xs text-emerald-300">
          ✓ API key active
        </div>
      )}

      <button onClick={openSidePanel} className="btn-primary w-full py-2.5 text-sm mb-2">
        ✦ Open Draft Panel
      </button>

      <button onClick={openOptions} className="btn-secondary w-full py-2.5 text-sm border border-solid border-indigo-800">
        ⚙ Settings
      </button>

      <p className="mt-3 text-[11px] text-slate-500 text-center">
        Hover posts on LinkedIn or X to draft replies
      </p>
    </div>
  );
}
