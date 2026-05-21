import { useState } from 'react';
import { INTENTS } from '../lib/intents.js';
import { safeSendMessage, ExtensionInvalidatedError } from '../lib/messaging.js';

export default function IntentPicker({ postText, platform, onPick, onClose }) {
  const [activeId, setActiveId] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [copied, setCopied] = useState(false);

  async function pick(intentId, note) {
    setActiveId(intentId);
    setError('');
    setStatus('Generating…');
    setGeneratedReply('');
    try {
      const result = await safeSendMessage({
        type: 'GENERATE_INTENT_REPLY',
        postText,
        platform,
        intentId,
        customNote: note || '',
      });
      if (result?.error) throw new Error(result.error);
      if (!result?.reply) throw new Error('Empty reply');
      setGeneratedReply(result.reply);
      setStatus('');
    } catch (err) {
      console.error('[IntentPicker]', err);
      if (err instanceof ExtensionInvalidatedError) {
        setError('Extension was updated — please refresh the page.');
      } else {
        setError(err.message || 'Failed');
      }
      setStatus('');
      setActiveId(null);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleInsert() {
    onPick(generatedReply);
  }

  function handleRegenerate() {
    setGeneratedReply('');
    setCopied(false);
    setActiveId(null);
  }

  // ── Result view: show generated reply with Copy / Insert ──
  if (generatedReply) {
    return (
      <div className="panel">
        <div className="header">
          <div className="title">EngageFlow AI</div>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleRegenerate} title="Try again">↻</button>
            <button className="close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>
        <div className="reply-preview">{generatedReply}</div>
        <div className="actions-row">
          <button className={`action-btn ${copied ? 'copied' : 'copy'}`} onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button className="action-btn insert" onClick={handleInsert}>Insert</button>
        </div>
      </div>
    );
  }

  // ── Intent picker view ──
  return (
    <div className="panel">
      <div className="header">
        <div className="title">EngageFlow AI</div>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="grid">
        {INTENTS.map(intent => (
          <button
            key={intent.id}
            className={`intent ${activeId === intent.id ? 'selected' : ''}`}
            onClick={() => pick(intent.id)}
            disabled={!!activeId}
            title={intent.instruction}
          >
            {intent.label}
          </button>
        ))}

        {!customMode ? (
          <button
            className="intent"
            style={{ gridColumn: '1 / -1' }}
            onClick={() => setCustomMode(true)}
            disabled={!!activeId}
          >
            Custom…
          </button>
        ) : (
          <div className="custom-row">
            <input
              className="custom-input"
              autoFocus
              placeholder="Describe the reply you want…"
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customNote.trim()) pick('custom', customNote);
                if (e.key === 'Escape') setCustomMode(false);
              }}
              disabled={!!activeId}
            />
            <button
              className="intent"
              style={{ flex: 'none' }}
              onClick={() => pick('custom', customNote)}
              disabled={!customNote.trim() || !!activeId}
            >
              Go
            </button>
          </div>
        )}
      </div>

      <div className={`status ${error ? 'error' : ''}`}>
        {error ? error : status ? <><span className="spinner" />{status}</> : ''}
      </div>
    </div>
  );
}
