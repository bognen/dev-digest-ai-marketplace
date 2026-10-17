// Onboarding progress, shared by the /get-started page, the drawer and the
// Start card. Kept in localStorage; the server render uses the empty state.
import { useSyncExternalStore } from 'react';
import { load, save } from './storage';

export const STEP_COUNTED = ['prereq', 'add', 'install', 'verify', 'update'];
export const TABS = ['cli', 'desktop', 'ide'] as const;
export type Tab = (typeof TABS)[number];

export interface OnboardingState {
  done: string[];
  tab: Tab;
}

const EMPTY: OnboardingState = { done: [], tab: 'cli' };
let current: OnboardingState | null = null; // also the fallback when storage is blocked
const listeners = new Set<() => void>();

function read(): OnboardingState {
  const s = load<Partial<OnboardingState>>('onboarding') ?? {};
  return {
    done: Array.isArray(s.done) ? s.done : [],
    tab: TABS.includes(s.tab as Tab) ? (s.tab as Tab) : 'cli',
  };
}

function snapshot(): OnboardingState {
  current ??= read();
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'ddm:onboarding') {
      current = read();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function set(next: OnboardingState) {
  current = next;
  save('onboarding', next);
  // The Start card's "connected" state is CSS on <html>, also set before first paint.
  document.documentElement.toggleAttribute('data-connected', next.done.includes('add'));
  listeners.forEach((l) => l());
}

export function useOnboarding(): OnboardingState {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function setStepDone(step: string, done: boolean) {
  const steps = new Set(snapshot().done);
  if (done) steps.add(step);
  else steps.delete(step);
  set({ ...snapshot(), done: [...steps] });
}

export function setTab(tab: Tab) {
  set({ ...snapshot(), tab });
}
