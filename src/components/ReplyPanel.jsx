import { useState, useEffect } from 'react';
import ReplyCard from './ReplyCard.jsx';
import { safeSendMessage, ExtensionInvalidatedError } from '../lib/messaging.js';

export default function ReplyPanel({ postText, platform, onClose }) {
  const [state, setState] = useState('loading');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    generate();
  }, []);

  async function generate() {
    setState('loading');
    setError('');
    try {
      const result = await safeSendMessage({
        type: 'GENERATE_REPLY',
        postText,
        platform,
      });
      if (result.error === 'NO_API_KEY') {
        setState('no-key');
        return;
      }
      if (result.error === 'FREE_LIMIT_REACHED') {
        setState('free-limit');
        return;
      }
      if (result.error) throw new Error(result.error);
      setSuggestions(result.suggestions);
      setState('loaded');
    } catch (err) {
      if (err instanceof ExtensionInvalidatedError) {
        setError('Extension was updated — please refresh the page.');
      } else {
        const msg = err.message === 'RATE_LIMIT'
          ? 'Rate limit hit — wait a moment and retry.'
          : 'Failed to generate replies. Check your API key in settings.';
        setError(msg);
      }
      setState('error');
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">✦ EngageFlow AI Replies</span>
        <button className="close-btn" onClick={onClose} title="Close">✕</button>
      </div>

      {state === 'loading' && (
        <div className="loading">
          <span className="spinner" />
          Drafting replies in your voice…
        </div>
      )}

      {state === 'no-key' && (
        <div className="no-key-msg">
          No Claude API key set.{' '}
          <a onClick={() => chrome.runtime.openOptionsPage()}>Open Settings</a>
        </div>
      )}

      {state === 'free-limit' && (
        <div className="no-key-msg">
          Free replies used up. Add your own Anthropic API key to keep going.{' '}
          <a onClick={() => chrome.runtime.openOptionsPage()}>Open Settings</a>
        </div>
      )}

      {state === 'error' && (
        <div className="error">
          {error}
          <br />
          <button className="btn btn-copy" style={{ marginTop: 8, flex: 'none' }} onClick={generate}>
            Retry
          </button>
        </div>
      )}

      {state === 'loaded' && suggestions.map((text, i) => (
        <ReplyCard key={i} text={text} platform={platform} />
      ))}
    </div>
  );
}
