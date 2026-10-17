import { createContext, useContext } from 'react';

export interface OnboardingContextValue {
  /** Open the guide, optionally for one plugin (contextual mode). */
  open: (plugin: string | null) => void;
  /** Contextual plugin for the guide on /get-started, set by open() there. */
  pagePlugin: string | null;
}

export const OnboardingContext = createContext<OnboardingContextValue>({ open: () => {}, pagePlugin: null });
export const useOnboardingGuide = () => useContext(OnboardingContext);
