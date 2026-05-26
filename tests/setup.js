import '@testing-library/jest-dom/vitest';
import { vi, beforeEach } from 'vitest';

function makeStorageArea() {
  const store = new Map();
  return {
    _store: store,
    get: vi.fn((keys) => {
      if (keys == null) {
        return Promise.resolve(Object.fromEntries(store));
      }
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: store.get(keys) });
      }
      if (Array.isArray(keys)) {
        const out = {};
        for (const k of keys) out[k] = store.get(k);
        return Promise.resolve(out);
      }
      const out = {};
      for (const [k, def] of Object.entries(keys)) {
        out[k] = store.has(k) ? store.get(k) : def;
      }
      return Promise.resolve(out);
    }),
    set: vi.fn((obj) => {
      for (const [k, v] of Object.entries(obj)) store.set(k, v);
      return Promise.resolve();
    }),
    remove: vi.fn((keys) => {
      const arr = Array.isArray(keys) ? keys : [keys];
      for (const k of arr) store.delete(k);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
  };
}

globalThis.chrome = {
  storage: {
    local: makeStorageArea(),
    sync: makeStorageArea(),
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    getURL: vi.fn((p) => `chrome-extension://test/${p}`),
    id: 'test-extension-id',
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    sendMessage: vi.fn(),
  },
};

beforeEach(() => {
  chrome.storage.local._store.clear();
  chrome.storage.sync._store.clear();
  vi.clearAllMocks();
});
