import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { load, save } from '../lib/storage';
import { MonitorIcon, MoonIcon, SunIcon } from './Icons';
import s from './ThemeToggle.module.css';

type Theme = 'light' | 'dark' | null; // null = follow the system
const ORDER: Theme[] = [null, 'light', 'dark'];

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
}

export function ThemeToggle() {
  // The stored theme is applied before first paint (index.html); this only
  // syncs the label after hydration. The icon follows <html data-theme> in CSS.
  const [theme, setTheme] = useState<Theme>(null);
  useEffect(() => setTheme(load<Theme>('theme')), []);

  return (
    <button
      type="button"
      className={`btn btn-secondary btn-icon ${s.toggle}`}
      data-theme-toggle
      aria-label={t('theme.ariaLabel', { theme: t(`theme.${theme ?? 'system'}`) })}
      onClick={() => {
        const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
        save('theme', next);
        apply(next);
        setTheme(next);
      }}
    >
      <MonitorIcon className={s.system} />
      <SunIcon className={s.light} />
      <MoonIcon className={s.dark} />
    </button>
  );
}
