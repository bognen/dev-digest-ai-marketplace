// localStorage wrapper: every read and write is guarded so the site keeps
// working when storage is blocked (private windows, disabled site data).
const PREFIX = 'ddm:';

export function load<T = unknown>(key: string, fallback: T | null = null): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage unavailable — state lives for this page view only
  }
}
