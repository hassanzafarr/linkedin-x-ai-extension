import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getApiKey } from '../lib/storage.js';
import { useTheme } from '../hooks/useTheme.js';

export default function Popup() {
  const [hasKey, setHasKey] = useState(null);
  const [theme, toggleTheme] = useTheme();

  const dark = theme === 'dark';

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

  const styles = {
    root: {
      width: 280,
      padding: 18,
      background: dark ? '#0a0a0a' : '#ffffff',
      color: dark ? '#fafafa' : '#09090b',
      fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    logo: {
      width: 28, height: 28, background: '#10b981', borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, color: 'white', fontWeight: 600,
    },
    name: { fontWeight: 600, fontSize: 15, color: dark ? '#fafafa' : '#09090b' },
    themeBtn: {
      padding: '4px', borderRadius: 6, border: 'none', cursor: 'pointer',
      background: dark ? '#18181b' : '#f4f4f5',
      color: dark ? '#a1a1aa' : '#71717a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    noKeyAlert: {
      background: dark ? '#18181b' : '#f9fafb',
      border: `1px solid ${dark ? '#27272a' : '#e5e7eb'}`,
      borderRadius: 6,
      padding: '10px 12px', marginBottom: 12, fontSize: 12,
      color: dark ? '#a1a1aa' : '#6b7280',
    },
    hasKeyAlert: {
      background: dark ? '#022c22' : '#ecfdf5',
      border: `1px solid ${dark ? '#064e3b' : '#a7f3d0'}`,
      borderRadius: 6,
      padding: '10px 12px', marginBottom: 12, fontSize: 12,
      color: dark ? '#6ee7b7' : '#065f46',
    },
    primaryBtn: {
      width: '100%', padding: '10px 0', background: '#10b981', color: 'white',
      border: 'none', borderRadius: 6, fontWeight: 500, fontSize: 13,
      cursor: 'pointer', marginBottom: 8, transition: 'background 0.15s',
    },
    secondaryBtn: {
      width: '100%', padding: '10px 0',
      background: dark ? '#18181b' : '#f4f4f5',
      color: dark ? '#e4e4e7' : '#374151',
      border: `1px solid ${dark ? '#27272a' : '#d1d5db'}`,
      borderRadius: 6, fontWeight: 500, fontSize: 13,
      cursor: 'pointer', transition: 'background 0.15s',
    },
    footer: { marginTop: 14, fontSize: 11, color: dark ? '#52525b' : '#9ca3af', textAlign: 'center', lineHeight: 1.5 },
  };

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>E</div>
          <span style={styles.name}>EngageFlow AI</span>
        </div>
        <button
          onClick={toggleTheme}
          style={styles.themeBtn}
          title={`Switch to ${dark ? 'light' : 'dark'} mode`}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {hasKey === false && (
        <div style={styles.noKeyAlert}>
          Set your Claude API key to activate AI features.
        </div>
      )}

      {hasKey === true && (
        <div style={styles.hasKeyAlert}>
          API key active
        </div>
      )}

      <button
        onClick={openSidePanel}
        style={styles.primaryBtn}
        onMouseEnter={e => e.currentTarget.style.background = '#059669'}
        onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
      >
        Open Draft Panel
      </button>

      <button
        onClick={openOptions}
        style={styles.secondaryBtn}
        onMouseEnter={e => e.currentTarget.style.background = dark ? '#27272a' : '#e5e7eb'}
        onMouseLeave={e => e.currentTarget.style.background = dark ? '#18181b' : '#f4f4f5'}
      >
        Settings
      </button>

      <div style={styles.footer}>
        Hover posts on LinkedIn or X to draft replies
      </div>
    </div>
  );
}
