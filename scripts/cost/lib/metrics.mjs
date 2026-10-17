// Cost and quality metrics for the fixed SDD scenario (docs/COST-BASELINE.md).
//
// Input is what `claude plugin eval --json` writes: one result document per
// eval invocation, with per-run scores, costs and a tracePath. The trace is the
// run's stream-json transcript; its closing `result` line carries tokens per
// model, API turns, latency and the agent's own cost. Judge (LLM grader) cost is
// kept separate, because it is the price of measuring, not of the workflow.

import { existsSync, readFileSync } from 'node:fs';

/** Parse one stream-json trace into token, call and latency numbers. */
export function readTrace(text) {
  const messageIds = new Set();
  const toolUses = new Map(); // tool_use id -> tool name
  let result = null;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.type === 'assistant' && event.message) {
      if (event.message.id) messageIds.add(event.message.id);
      for (const block of event.message.content ?? []) {
        if (block.type === 'tool_use') toolUses.set(block.id ?? `${toolUses.size}`, block.name);
      }
    } else if (event.type === 'result') {
      result = event;
    }
  }

  const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const models = {};
  const modelUsage = result?.modelUsage ?? {};
  if (Object.keys(modelUsage).length) {
    // modelUsage covers every model the run used, subagents included.
    for (const [model, u] of Object.entries(modelUsage)) {
      tokens.input += u.inputTokens ?? 0;
      tokens.output += u.outputTokens ?? 0;
      tokens.cacheRead += u.cacheReadInputTokens ?? 0;
      tokens.cacheWrite += u.cacheCreationInputTokens ?? 0;
      models[model] = { costUsd: u.costUSD ?? null };
    }
  } else if (result?.usage) {
    tokens.input = result.usage.input_tokens ?? 0;
    tokens.output = result.usage.output_tokens ?? 0;
    tokens.cacheRead = result.usage.cache_read_input_tokens ?? 0;
    tokens.cacheWrite = result.usage.cache_creation_input_tokens ?? 0;
  }

  const toolCallsByName = {};
  for (const name of toolUses.values()) toolCallsByName[name] = (toolCallsByName[name] ?? 0) + 1;

  return {
    hasResult: Boolean(result),
    isError: Boolean(result?.is_error),
    agentCostUsd: result?.total_cost_usd ?? null,
    latencySeconds: result?.duration_ms != null ? result.duration_ms / 1000 : null,
    apiSeconds: result?.duration_api_ms != null ? result.duration_api_ms / 1000 : null,
    turns: result?.num_turns ?? null,
    apiCalls: messageIds.size,
    toolCalls: toolUses.size,
    toolCallsByName,
    tokens,
    models,
  };
}

/**
 * Flatten eval result documents into one record per run of the with-plugin arm.
 * `readFile` is injectable for tests; traces that are missing (the eval deleted
 * its temp dir: run with --keep-temp) leave the trace fields null.
 */
export function collectRuns(results, scenario, { readFile = defaultRead } = {}) {
  const critical = scenario?.criticalGraders ?? {};
  const runs = [];
  for (const doc of results) {
    const plugin = doc.suite?.plugins?.[0] ?? {};
    for (const c of doc.cases ?? []) {
      (c.arms?.with ?? []).forEach((run, index) => {
        const traceText = run.tracePath ? readFile(run.tracePath) : null;
        const trace = traceText != null ? readTrace(traceText) : null;
        const failedGraders = (run.graders ?? []).filter((g) => g.scored !== false && !g.passed).map((g) => g.name);
        const judgeCostUsd = run.judgeCostUsd ?? 0;
        runs.push({
          case: c.name,
          run: index + 1,
          startedAt: run.startedAt ?? null,
          plugin: plugin.name ?? null,
          pluginVersion: plugin.version ?? null,
          claudeVersion: doc.claudeVersion ?? null,
          passed: Boolean(run.passed) && !run.error,
          score: run.score ?? 0,
          error: run.error ?? null,
          failedGraders,
          criticalFailures: failedGraders.filter((g) => (critical[c.name] ?? []).includes(g)),
          // Prefer the trace's own cost; the eval's per-run costUsd includes judge calls.
          agentCostUsd: trace?.agentCostUsd ?? (run.costUsd != null ? run.costUsd - judgeCostUsd : null),
          judgeCostUsd,
          latencySeconds: trace?.latencySeconds ?? run.durationSeconds ?? null,
          turns: trace?.turns ?? run.turns ?? null,
          apiCalls: trace?.apiCalls ?? null,
          toolCalls: trace?.toolCalls ?? null,
          toolCallsByName: trace?.toolCallsByName ?? null,
          tokens: trace?.tokens ?? null,
          models: trace ? Object.keys(trace.models) : [],
          traceFound: Boolean(trace?.hasResult),
        });
      });
    }
  }
  return runs;
}

function defaultRead(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

export function median(values) {
  const v = values.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

const sum = (values) => values.reduce((n, x) => n + (typeof x === 'number' ? x : 0), 0);

/** Summary of a set of runs: the numbers docs/COST-BASELINE.md records. */
export function summarize(runs) {
  const passed = runs.filter((r) => r.passed);
  const agentCost = sum(runs.map((r) => r.agentCostUsd));
  const tokens = (k) => median(runs.map((r) => r.tokens?.[k]));
  return {
    runs: runs.length,
    passed: passed.length,
    passRate: runs.length ? passed.length / runs.length : null,
    errors: runs.filter((r) => r.error).length,
    criticalFailures: runs.flatMap((r) => r.criticalFailures.map((g) => `${r.case}/${g}`)),
    medianAgentCostUsd: median(runs.map((r) => r.agentCostUsd)),
    totalAgentCostUsd: agentCost,
    totalJudgeCostUsd: sum(runs.map((r) => r.judgeCostUsd)),
    costPerSuccessUsd: passed.length ? agentCost / passed.length : null,
    medianLatencySeconds: median(runs.map((r) => r.latencySeconds)),
    medianTokens: { input: tokens('input'), output: tokens('output'), cacheRead: tokens('cacheRead'), cacheWrite: tokens('cacheWrite') },
    medianApiCalls: median(runs.map((r) => r.apiCalls)),
    medianToolCalls: median(runs.map((r) => r.toolCalls)),
    models: [...new Set(runs.flatMap((r) => r.models))].sort(),
    missingTraces: runs.filter((r) => !r.traceFound).length,
  };
}

/** Per-case summaries plus the whole scenario. */
export function report(runs) {
  const cases = [...new Set(runs.map((r) => r.case))];
  return {
    overall: summarize(runs),
    cases: Object.fromEntries(cases.map((c) => [c, summarize(runs.filter((r) => r.case === c))])),
  };
}

// Small seeded PRNG so a comparison prints the same interval every time.
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 95% bootstrap interval for median(after) - median(before). With the handful
 * of runs this lab uses the interval is wide; that is the point: a difference
 * whose interval contains 0 is reported as noise, not as a saving.
 */
export function medianDiffInterval(before, after, { iterations = 10000, seed = 1 } = {}) {
  const a = before.filter(Number.isFinite);
  const b = after.filter(Number.isFinite);
  if (a.length < 2 || b.length < 2) return null;
  const rand = mulberry32(seed);
  const pick = (v) => Array.from(v, () => v[Math.floor(rand() * v.length)]);
  const diffs = [];
  for (let i = 0; i < iterations; i++) diffs.push(median(pick(b)) - median(pick(a)));
  diffs.sort((x, y) => x - y);
  return { low: diffs[Math.floor(iterations * 0.025)], high: diffs[Math.floor(iterations * 0.975)] };
}

/**
 * Compare a baseline with an optimized run of the same scenario.
 * Quality gate: no errored runs, pass rate not lower, and no critical grader
 * failing after the change that did not fail before (a new critical false
 * negative). A saving is real only when its interval lies entirely below 0.
 */
export function compare(beforeRuns, afterRuns) {
  const before = summarize(beforeRuns);
  const after = summarize(afterRuns);

  const metric = (pick) => {
    const b = beforeRuns.map(pick);
    const a = afterRuns.map(pick);
    const mb = median(b);
    const ma = median(a);
    const interval = medianDiffInterval(b, a);
    let verdict = 'insufficient data';
    if (interval) verdict = interval.high < 0 ? 'lower' : interval.low > 0 ? 'higher' : 'within noise';
    return { before: mb, after: ma, diff: mb != null && ma != null ? ma - mb : null, relative: mb ? (ma - mb) / mb : null, interval, verdict };
  };

  const metrics = {
    agentCostUsd: metric((r) => r.agentCostUsd),
    latencySeconds: metric((r) => r.latencySeconds),
    inputTokens: metric((r) => r.tokens?.input),
    outputTokens: metric((r) => r.tokens?.output),
    cacheReadTokens: metric((r) => r.tokens?.cacheRead),
    apiCalls: metric((r) => r.apiCalls),
    toolCalls: metric((r) => r.toolCalls),
  };

  const newCritical = [...new Set(after.criticalFailures)].filter((f) => !before.criticalFailures.includes(f));
  const gate = {
    noErrors: before.errors === 0 && after.errors === 0,
    passRateNotLower: after.passRate != null && before.passRate != null && after.passRate >= before.passRate,
    noNewCriticalFailures: newCritical.length === 0,
    newCriticalFailures: newCritical,
  };
  gate.passed = gate.noErrors && gate.passRateNotLower && gate.noNewCriticalFailures;

  const realSaving = metrics.agentCostUsd.verdict === 'lower' || metrics.latencySeconds.verdict === 'lower';
  const outcome = !gate.passed ? 'failed quality gate' : realSaving ? 'success' : 'no saving beyond noise';

  return { before, after, metrics, gate, outcome };
}
