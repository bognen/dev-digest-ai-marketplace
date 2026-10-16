// localStorage wrapper: every read and write is guarded so the site keeps
// working when storage is blocked (private windows, disabled site data).
const PREFIX = 'ddm:';

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage unavailable — state lives for this page view only
  }
}

// Onboarding progress, shared by the /get-started page, the drawer and the Start card.
export const STEP_COUNTED = ['prereq', 'add', 'install', 'verify', 'update'];

let memoryOnboarding = null;

export function getOnboarding() {
  const state = load('onboarding') ?? memoryOnboarding ?? {};
  return { done: Array.isArray(state.done) ? state.done : [], tab: state.tab ?? 'cli' };
}

export function setOnboarding(next) {
  memoryOnboarding = next;
  save('onboarding', next);
  document.documentElement.toggleAttribute('data-connected', next.done.includes('add'));
  document.dispatchEvent(new CustomEvent('ddm:onboarding', { detail: next }));
}
