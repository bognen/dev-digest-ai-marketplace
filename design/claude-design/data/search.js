// Client-side keyword search (spec 5.3, MVP). Mirrors the MiniSearch config:
// intent parsing → synonym expansion → fuzzy/prefix match with field boosts.
const FILLER = new Set('i im need needs want wanted looking look for a an the that can could to me my some something which help helps with tool tools please find get is are of on in and or do does it thing'.split(' '));
const TYPE_WORDS = { skill: 'skill', skills: 'skill', agent: 'agent', agents: 'agent', subagent: 'agent', subagents: 'agent', command: 'command', commands: 'command', slash: 'command', hook: 'hook', hooks: 'hook', mcp: 'mcp', server: 'mcp', servers: 'mcp', plugin: 'plugin', plugins: 'plugin' };
const BOOST = { name: 3, tags: 2, description: 2, plugin: 1.5, body: 1 };

export const words = (t) => String(t || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

export function stem(w) {
  w = w.toLowerCase();
  if (w.length > 4) for (const s of ['ing', 'ers', 'er', 'ed', 'es', 's']) if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); break; }
  if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

export function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

export function parseQuery(q, syn = {}) {
  const ws = words(q); let type = null; const terms = [];
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i];
    if (TYPE_WORDS[w]) { if (!type) type = TYPE_WORDS[w]; continue; }
    if (FILLER.has(w)) continue;
    terms.push(w);
  }
  const expanded = [];
  terms.forEach((t) => (syn[t] || []).forEach((s) => words(s).forEach((x) => { if (!terms.includes(x) && !expanded.includes(x)) expanded.push(x); })));
  return { raw: q, terms, type, expanded, stems: terms.map(stem), expStems: expanded.map(stem), text: terms.join(' ') };
}

export function buildIndex(arts) {
  return arts.map((a) => ({ a, f: {
    name: words(a.name).map(stem), tags: a.tags.flatMap(words).map(stem), description: words(a.description).map(stem),
    plugin: words(a.plugin).map(stem), body: words(a.bodyText).map(stem),
  } }));
}

function match(term, toks) {
  let best = 0;
  for (const t of toks) {
    if (t === term) return 1;
    if (term.length >= 2 && t.startsWith(term)) best = Math.max(best, 0.75);
    else if (term.length >= 5 && Math.abs(term.length - t.length) <= 1 && lev(term, t) <= 1) best = Math.max(best, 0.5);
  }
  return best;
}

export function search(index, p) {
  if (!p.terms.length) return [];
  const out = [];
  for (const d of index) {
    let score = 0, hit = 0;
    for (const s of p.stems) { let b = 0; for (const k in BOOST) b = Math.max(b, match(s, d.f[k]) * BOOST[k]); if (b > 0) hit++; score += b; }
    for (const s of p.expStems) { let b = 0; for (const k in BOOST) b = Math.max(b, match(s, d.f[k]) * BOOST[k]); score += b * 0.5; }
    if (score > 0) out.push({ a: d.a, score: score * (0.4 + hit / p.stems.length) });
  }
  return out.sort((x, y) => y.score - x.score);
}

// Did-you-mean: replace each unknown term with the closest catalog word (edit distance ≤ 2).
export function suggest(index, p) {
  const vocab = new Set();
  index.forEach((d) => { words(d.a.name).forEach((w) => vocab.add(w)); d.a.tags.forEach((t) => words(t).forEach((w) => vocab.add(w))); });
  let changed = false;
  const fixed = p.terms.map((t) => {
    if (vocab.has(t)) return t;
    let best = t, bd = 3;
    vocab.forEach((v) => { const d = lev(t, v); if (d < bd) { bd = d; best = v; } });
    if (best !== t) changed = true;
    return best;
  });
  return changed ? [fixed.join(' ')] : [];
}
