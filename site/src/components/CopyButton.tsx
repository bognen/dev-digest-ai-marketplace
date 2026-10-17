import { useEffect, useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n';
import { announce, copyText } from '../lib/copy';

interface Props {
  text: string;
  className?: string;
  ariaLabel?: string;
  /** Shown before the label, e.g. an icon or corner marks. */
  children?: ReactNode;
  label?: string;
  /** Icon button: the label is for screen readers only. */
  iconOnly?: boolean;
}

/** Copies `text`; the label reads "Copied" for a moment afterwards. */
export function CopyButton({ text, className = 'btn btn-ghost', ariaLabel, children, label = t('common.copy'), iconOnly = false }: Props) {
  const [result, setResult] = useState<'ok' | 'fail' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      data-copy
      data-copied={result === 'ok' ? '' : undefined}
      onClick={async () => {
        if (!text.trim()) return;
        const ok = await copyText(text.trim());
        setResult(ok ? 'ok' : 'fail');
        announce(ok ? t('common.copiedAnnouncement') : t('common.copyFailed'));
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setResult(null), 1800);
      }}
    >
      {children}
      <span className={iconOnly ? 'visually-hidden' : undefined}>{result === 'ok' ? t('common.copied') : result === 'fail' ? t('common.copyFailed') : label}</span>
    </button>
  );
}
