// Helpers shared by the server render and the browser. UI text is in src/i18n.
import { MONTHS, t } from '../i18n';

export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

const parts = (iso: string) => {
  const d = new Date(iso);
  return { day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()], year: d.getUTCFullYear() };
};

/** "16 Oct 2026" (format and month names from en.json). */
export function formatDate(iso: string | null | undefined): string {
  return iso ? t('date.long', parts(iso)) : '';
}

/** "14 Oct", for timelines where the year is implied. */
export function formatShortDate(iso: string | null | undefined): string {
  return iso ? t('date.short', parts(iso)) : '';
}

/** Tag variant per change kind / status badge. */
export const CHANGE_TAGS: Record<string, string> = { new: 'tag-accent', updated: 'tag-outline', deprecated: 'tag-neutral', removed: 'tag-neutral', beta: 'tag-neutral' };

/** Plugin names accepted from URLs (?plugin=). */
export const isPluginName = (s: string | null | undefined): s is string => !!s && /^[A-Za-z0-9._-]{1,100}$/.test(s);
