// UI text lookup. Every string the site shows lives in en.json; components
// refer to it by key.
//
//   t('header.menu')                         → "Menu"
//   t('search.noMatches', { query })         → "No matches for “foo”"
//   tn('common.changes', 3)                  → "3 changes" (plural rules for the locale)
//   rich('onboarding.add.vscode', { repo }, { setup: (c) => <a href=…>{c}</a> })
//
// Messages may contain {name} placeholders and, for rich(), the tags <b>, <em>,
// <code>, <kbd> plus any tag the caller supplies (used for links). Other text
// in angle brackets, such as "<plugin>", is left as written.
import { createElement, Fragment, type ReactNode } from 'react';
import messages from './en.json';

type Messages = typeof messages;
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : T[K] extends readonly unknown[] ? never : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;
/** Keys of plural groups, e.g. "common.changes" for common.changes.one/other. */
export type PluralKey = MessageKey extends infer K ? (K extends `${infer P}.other` ? P : never) : never;
type Vars = Record<string, string | number>;
type RichVars = Record<string, ReactNode>;
type Tag = (children: ReactNode) => ReactNode;

export const LANG = messages.meta.lang;
export const MONTHS = messages.date.months;

function lookup(key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  return typeof node === 'string' ? node : undefined;
}

function message(key: string): string {
  const text = lookup(key);
  if (text === undefined) {
    if (import.meta.env.DEV) console.warn(`Missing UI text: ${key}`);
    return key;
  }
  return text;
}

const fill = (text: string, vars: Vars = {}) => text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));

/** Plain text with {placeholders} filled in. */
export function t(key: MessageKey, vars?: Vars): string {
  return fill(message(key), vars);
}

const pluralRules = new Intl.PluralRules(LANG);

/** Plural text: picks key.one / key.other / … for `count`, which is also {count}. */
export function tn(key: PluralKey, count: number, vars?: Vars): string {
  const form = lookup(`${key}.${pluralRules.select(count)}`) ?? message(`${key}.other`);
  return fill(form, { ...vars, count });
}

/** Label for a value that comes from data, e.g. label('types', 'skill') → "Skill". Unknown ids are shown as they are. */
export function label(group: 'types' | 'typeCodes' | 'changeKinds' | 'badges' | 'categories' | 'statuses', id: string): string {
  return lookup(`${group}.${id}`) ?? (group === 'typeCodes' ? id.toUpperCase() : id);
}

const BASE_TAGS: Record<string, Tag> = {
  b: (c) => createElement('strong', null, c),
  em: (c) => createElement('em', null, c),
  code: (c) => createElement('code', null, c),
  kbd: (c) => createElement('kbd', null, c),
};
const TOKEN = /<(\/?)([a-zA-Z][\w-]*)>|\{(\w+)\}/g;

/** Text with inline markup. Placeholders may be strings or elements. */
export function rich(key: MessageKey, vars: RichVars = {}, tags: Record<string, Tag> = {}): ReactNode {
  const text = message(key);
  const known = { ...BASE_TAGS, ...tags };
  const stack: { tag: string | null; children: ReactNode[]; open: string }[] = [{ tag: null, children: [], open: '' }];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const top = stack[stack.length - 1];
    if (m.index! > last) top.children.push(text.slice(last, m.index));
    last = m.index! + m[0].length;
    const [raw, closing, tag, name] = m;
    if (name !== undefined) top.children.push(name in vars ? vars[name] : raw);
    else if (!known[tag]) top.children.push(raw);
    else if (!closing) stack.push({ tag, children: [], open: raw });
    else if (top.tag === tag) {
      stack.pop();
      stack[stack.length - 1].children.push(known[tag](createElement(Fragment, null, ...top.children)));
    } else top.children.push(raw);
  }
  stack[stack.length - 1].children.push(text.slice(last));
  // An unclosed tag is shown as written.
  while (stack.length > 1) {
    const frame = stack.pop()!;
    stack[stack.length - 1].children.push(frame.open, ...frame.children);
  }
  return createElement(Fragment, null, ...stack[0].children);
}

/** rich() for a plural group: picks the form for `count`, which is also {count}. */
export function richN(key: PluralKey, count: number, vars: RichVars = {}, tags: Record<string, Tag> = {}): ReactNode {
  const form = `${key}.${pluralRules.select(count)}`;
  return rich((lookup(form) !== undefined ? form : `${key}.other`) as MessageKey, { count, ...vars }, tags);
}
