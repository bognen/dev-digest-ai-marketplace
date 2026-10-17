// Keyword search shared by the header type-ahead and the results page.
// Every word must match; a word in the name scores 3, elsewhere 1.

export interface Searchable {
  name: string;
  title?: string | null;
  description: string;
  tags: string[];
  plugin: string;
  type: string;
}

export const queryTerms = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

/** Matching items, best first (stable for equal scores). */
export function rank<T extends Searchable>(all: T[], query: string): T[] {
  const words = queryTerms(query);
  if (!words.length) return all.slice();
  return all
    .map((a, i) => {
      const name = `${a.name} ${a.title ?? ''}`.toLowerCase();
      const text = `${a.description} ${a.tags.join(' ')} ${a.plugin} ${a.type}`.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (name.includes(w)) score += 3;
        else if (text.includes(w)) score += 1;
        else return null;
      }
      return { a, score, i };
    })
    .filter((x): x is { a: T; score: number; i: number } => x !== null)
    .sort((x, y) => y.score - x.score || x.i - y.i)
    .map((x) => x.a);
}

/** Splits text into plain and matching parts, for <mark> highlighting. */
export function highlightParts(text: string, terms: string[]): { text: string; hit: boolean }[] {
  if (!terms.length || !text) return [{ text, hit: false }];
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text.split(re).filter(Boolean).map((part) => ({ text: part, hit: terms.includes(part.toLowerCase()) }));
}
