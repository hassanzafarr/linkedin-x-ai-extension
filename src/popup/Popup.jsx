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
    <div style={{
      width: 280,
      padding: 18,
      background: '#0a0a0a',
      color: '#fafafa',
      fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 28, height: 28, background: '#10b981', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: 'white', fontWeight: 600,
        }}>E</div>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#fafafa' }}>EngageFlow AI</span>
      </div>

      {hasKey === false && (
        <div style={{
          background: '#18181b', border: '1px solid #27272a', borderRadius: 6,
          padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#a1a1aa',
        }}>
          Set your Claude API key to activate AI features.
        </div>
      )}

      {hasKey === true && (
        <div style={{
          background: '#022c22', border: '1px solid #064e3b', borderRadius: 6,
          padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#6ee7b7',
        }}>
          API key active
        </div>
      )}

      <button
        onClick={openSidePanel}
        style={{
          width: '100%', padding: '10px 0', background: '#10b981', color: 'white',
          border: 'none', borderRadius: 6, fontWeight: 500, fontSize: 13,
          cursor: 'pointer', marginBottom: 8, transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#059669'}
        onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
      >
        Open Draft Panel
      </button>

      <button
        onClick={openOptions}
        style={{
          width: '100%', padding: '10px 0', background: '#18181b', color: '#e4e4e7',
          border: '1px solid #27272a', borderRadius: 6, fontWeight: 500, fontSize: 13,
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#27272a'}
        onMouseLeave={e => e.currentTarget.style.background = '#18181b'}
      >
        Settings
      </button>

      <div style={{ marginTop: 14, fontSize: 11, color: '#52525b', textAlign: 'center', lineHeight: 1.5 }}>
        Hover posts on LinkedIn or X to draft replies
      </div>
    </div>
  );
}
