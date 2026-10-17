#!/usr/bin/env node
// Measure the fixed SDD scenario (scripts/cost/scenario.json) for
// docs/COST-BASELINE.md, from `claude plugin eval --json` results.
//
// Usage:
//   node scripts/cost/measure.mjs collect --label <name> --out <file.json> <result.json>...
//       One record per run: tokens, API and tool calls, cost, latency, pass,
//       critical failures. Prints the summary table as Markdown.
//   node scripts/cost/measure.mjs compare <before.json> <after.json>
//       Medians, 95% bootstrap intervals and the quality gate. Exit 1 when the
//       gate fails or the two measurements are not comparable.
//
// Run the eval with --keep-temp, or the traces (tokens, calls) are gone before
// collect reads them. scripts/cost/run-scenario.sh does both steps.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectRuns, compare, report } from './lib/metrics.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const scenario = JSON.parse(readFileSync(join(root, 'scripts/cost/scenario.json'), 'utf8'));

const usd = (x) => (x == null ? '–' : `$${x.toFixed(4)}`);
const num = (x) => (x == null ? '–' : Math.round(x).toLocaleString('en-US'));
const sec = (x) => (x == null ? '–' : `${x.toFixed(1)} s`);
const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);

function git(...args) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim(); } catch { return null; }
}

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[++i];
    else opts._.push(argv[i]);
  }
  return opts;
}

function summaryTable(rep) {
  const rows = [['scenario (all cases)', rep.overall], ...Object.entries(rep.cases)];
  const out = [
    '| Case | Runs | Pass rate | Median cost | Cost per success | Median latency | Input | Output | Cache read | Cache write | API calls | Tool calls | Critical failures |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const [name, s] of rows) {
    out.push(`| ${name} | ${s.runs} | ${pct(s.passRate)} | ${usd(s.medianAgentCostUsd)} | ${usd(s.costPerSuccessUsd)} | ${sec(s.medianLatencySeconds)} | ${num(s.medianTokens.input)} | ${num(s.medianTokens.output)} | ${num(s.medianTokens.cacheRead)} | ${num(s.medianTokens.cacheWrite)} | ${num(s.medianApiCalls)} | ${num(s.medianToolCalls)} | ${s.criticalFailures.length || 0} |`);
  }
  return out.join('\n');
}

function collect(opts) {
  if (!opts.label || !opts.out || !opts._.length) throw new Error('collect needs --label, --out and at least one result.json');
  const results = opts._.map((p) => JSON.parse(readFileSync(p, 'utf8')));
  const runs = collectRuns(results, scenario);
  if (!runs.length) throw new Error('no runs found in the result files');

  const rep = report(runs);
  const versions = [...new Set(runs.map((r) => r.pluginVersion))];
  const record = {
    label: opts.label,
    measuredAt: new Date().toISOString(),
    commit: opts.commit ?? git('rev-parse', 'HEAD'),
    pluginDirty: Boolean(git('status', '--porcelain', '--', scenario.plugin)),
    pluginVersions: versions,
    claudeVersions: [...new Set(runs.map((r) => r.claudeVersion))],
    scenario,
    runs,
    report: rep,
  };
  mkdirSync(dirname(opts.out), { recursive: true });
  writeFileSync(opts.out, `${JSON.stringify(record, null, 2)}\n`);

  const o = rep.overall;
  console.log(`## ${opts.label}\n`);
  console.log(`- Plugin: \`${scenario.plugin}\` ${versions.join(', ')} at \`${record.commit ?? 'unknown commit'}\`${record.pluginDirty ? ' (uncommitted changes in the plugin)' : ''}`);
  console.log(`- Models used: ${o.models.join(', ') || 'unknown (no traces)'}`);
  console.log(`- Runs: ${o.runs}, passed ${o.passed}, errored ${o.errors}; agent cost ${usd(o.totalAgentCostUsd)}, judge cost ${usd(o.totalJudgeCostUsd)}`);
  if (o.criticalFailures.length) console.log(`- Critical failures: ${o.criticalFailures.join(', ')}`);
  if (o.missingTraces) console.log(`- ⚠ ${o.missingTraces} run(s) had no trace; tokens and calls are missing for them. Run the eval with --keep-temp.`);
  console.log(`\n${summaryTable(rep)}\n\nWrote ${opts.out}`);
}

function comparable(a, b) {
  const problems = [];
  const s1 = a.scenario;
  const s2 = b.scenario;
  if (s1.model !== s2.model) problems.push(`model differs: ${s1.model} vs ${s2.model}`);
  if (s1.runsPerCase !== s2.runsPerCase) problems.push(`runsPerCase differs: ${s1.runsPerCase} vs ${s2.runsPerCase}`);
  if (JSON.stringify([...s1.cases].sort()) !== JSON.stringify([...s2.cases].sort())) problems.push('the case lists differ');
  const m1 = a.report.overall.models.join(',');
  const m2 = b.report.overall.models.join(',');
  if (m1 && m2 && m1 !== m2) problems.push(`models used differ: ${m1} vs ${m2} (change one thing at a time)`);
  return problems;
}

function compareCmd(opts) {
  const [beforePath, afterPath] = opts._;
  if (!beforePath || !afterPath) throw new Error('compare needs <before.json> <after.json>');
  const before = JSON.parse(readFileSync(beforePath, 'utf8'));
  const after = JSON.parse(readFileSync(afterPath, 'utf8'));
  const problems = comparable(before, after);
  const c = compare(before.runs, after.runs);

  const row = (name, m, fmt) => {
    const iv = m.interval ? `${fmt(m.interval.low)} … ${fmt(m.interval.high)}` : '–';
    return `| ${name} | ${fmt(m.before)} | ${fmt(m.after)} | ${m.relative == null ? '–' : `${m.relative > 0 ? '+' : ''}${Math.round(m.relative * 100)}%`} | ${iv} | ${m.verdict} |`;
  };
  console.log(`## ${before.label} → ${after.label}\n`);
  console.log(`Commits: \`${before.commit}\` → \`${after.commit}\`\n`);
  console.log('| Metric (median per run) | Before | After | Change | 95% interval of the difference | Verdict |');
  console.log('|---|---|---|---|---|---|');
  console.log(row('Agent cost', c.metrics.agentCostUsd, usd));
  console.log(row('Latency', c.metrics.latencySeconds, sec));
  console.log(row('Input tokens', c.metrics.inputTokens, num));
  console.log(row('Output tokens', c.metrics.outputTokens, num));
  console.log(row('Cache-read tokens', c.metrics.cacheReadTokens, num));
  console.log(row('API calls', c.metrics.apiCalls, num));
  console.log(row('Tool calls', c.metrics.toolCalls, num));
  console.log(`\nCost per successful workflow: ${usd(c.before.costPerSuccessUsd)} → ${usd(c.after.costPerSuccessUsd)}`);
  console.log(`Pass rate: ${pct(c.before.passRate)} → ${pct(c.after.passRate)}\n`);
  console.log('Quality gate:');
  console.log(`- ${c.gate.noErrors ? '✔' : '✘'} no errored runs (before ${c.before.errors}, after ${c.after.errors})`);
  console.log(`- ${c.gate.passRateNotLower ? '✔' : '✘'} pass rate not lower`);
  console.log(`- ${c.gate.noNewCriticalFailures ? '✔' : '✘'} no new critical false negatives${c.gate.newCriticalFailures.length ? `: ${c.gate.newCriticalFailures.join(', ')}` : ''}`);
  for (const p of problems) console.log(`- ✘ not comparable: ${p}`);
  console.log(`\nOutcome: **${problems.length ? 'not comparable' : c.outcome}**`);
  process.exitCode = problems.length || !c.gate.passed ? 1 : 0;
}

const [command, ...rest] = process.argv.slice(2);
try {
  if (command === 'collect') collect(parseArgs(rest));
  else if (command === 'compare') compareCmd(parseArgs(rest));
  else throw new Error('usage: measure.mjs collect|compare … (see the header of this file)');
} catch (error) {
  console.error(`✘ ${error.message}`);
  process.exitCode = 1;
}
