import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callClaude } from '../../../src/lib/claude.js';

function mockFetch(status, body) {
  globalThis.fetch = vi.fn(() => Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  }));
}

describe('callClaude', () => {
  beforeEach(() => {
    globalThis.fetch = undefined;
  });

  it('throws NO_API_KEY when key missing', async () => {
    await expect(callClaude('hi', '')).rejects.toThrow('NO_API_KEY');
  });

  it('sends request with correct headers and body', async () => {
    mockFetch(200, { content: [{ text: 'hello' }] });
    await callClaude('my prompt', 'sk-ant-test-key', { maxTokens: 512 });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(opts.headers['x-api-key']).toBe('sk-ant-test-key');
    expect(opts.headers['anthropic-version']).toBe('2023-06-01');
    expect(opts.headers['anthropic-dangerous-direct-browser-access']).toBe('true');

    const body = JSON.parse(opts.body);
    expect(body.max_tokens).toBe(512);
    expect(body.messages[0].content).toBe('my prompt');
    expect(body.model).toMatch(/claude-haiku/);
  });

  it('trims whitespace from api key', async () => {
    mockFetch(200, { content: [{ text: 'x' }] });
    await callClaude('p', '   key-with-spaces   ');
    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers['x-api-key']).toBe('key-with-spaces');
  });

  it('strips ```json codeblock wrapper from response', async () => {
    mockFetch(200, { content: [{ text: '```json\n["a","b"]\n```' }] });
    const result = await callClaude('p', 'k');
    expect(result).toBe('["a","b"]');
  });

  it('strips plain ``` codeblock wrapper', async () => {
    mockFetch(200, { content: [{ text: '```\nhello\n```' }] });
    const result = await callClaude('p', 'k');
    expect(result).toBe('hello');
  });

  it('returns trimmed text when no codeblock', async () => {
    mockFetch(200, { content: [{ text: '   plain reply   ' }] });
    const result = await callClaude('p', 'k');
    expect(result).toBe('plain reply');
  });

  it('throws structured error on non-2xx with API error body', async () => {
    mockFetch(401, { error: { type: 'authentication_error', message: 'invalid x-api-key' } });
    try {
      await callClaude('p', 'k');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err.status).toBe(401);
      expect(err.apiType).toBe('authentication_error');
      expect(err.apiMessage).toMatch(/invalid x-api-key/);
    }
  });

  it('throws structured error on non-2xx with unparseable body', async () => {
    mockFetch(500, 'gateway timeout');
    try {
      await callClaude('p', 'k');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.apiType).toBe('http_error');
      expect(err.message).toMatch(/gateway timeout/);
    }
  });

  it('wraps network failures as NETWORK_ERROR', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('ECONNREFUSED')));
    await expect(callClaude('p', 'k')).rejects.toThrow(/NETWORK_ERROR.*ECONNREFUSED/);
  });
});
