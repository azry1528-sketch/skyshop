/**
 * localStorage sécurisé : Safari/iOS (mode privé, PWA, stockage bloqué, quota plein)
 * peut lever une exception à l'accès ou à l'écriture. Ici, on ne plante jamais :
 * on retombe sur une mémoire temporaire.
 */
const mem = new Map<string, string>();

const getLS = (): Storage | null => {
  try {
    if (typeof window === "undefined") return null;
    const ls = window.localStorage;
    const k = "__sk_test__";
    ls.setItem(k, "1");
    ls.removeItem(k);
    return ls;
  } catch {
    return null;
  }
};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      const ls = getLS();
      if (ls) return ls.getItem(key);
    } catch { /* ignore */ }
    return mem.has(key) ? (mem.get(key) as string) : null;
  },
  setItem(key: string, value: string): void {
    mem.set(key, value);
    try { getLS()?.setItem(key, value); } catch { /* ignore */ }
  },
  removeItem(key: string): void {
    mem.delete(key);
    try { getLS()?.removeItem(key); } catch { /* ignore */ }
  },
};
