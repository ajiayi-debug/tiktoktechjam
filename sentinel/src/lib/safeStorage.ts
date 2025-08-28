type Store = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const mem = new Map<string, string>();

export const safeStorage: Store = (() => {
  // Lynx iOS main thread may not expose localStorage
  const ls = (globalThis as { localStorage?: Storage }).localStorage;
  if (ls) {
    return {
      getItem(key) {
        try { return ls.getItem(key); } catch { return null; }
      },
      setItem(key, value) {
        try { ls.setItem(key, value); } catch { /* ignore quota/permission */ }
      },
      removeItem(key) {
        try { ls.removeItem(key); } catch { /* ignore */ }
      },
    };
  }
  // Fallback in-memory storage so app still works
  return {
    getItem(key) { return mem.get(key) ?? null; },
    setItem(key, value) { mem.set(key, value); },
    removeItem(key) { mem.delete(key); },
  };
})();
