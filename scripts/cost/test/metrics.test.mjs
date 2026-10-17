// node --test "scripts/cost/test/*.test.mjs"
// Shapes follow a real `claude plugin eval --json` result (schemaVersion 1,
// Claude Code 2.1.302) and its stream-json trace.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectRuns, compare, median, readTrace, summarize } from '../lib/metrics.mjs';

const scenario = { criticalGraders: { 'planner-plan-only': ['no-code-or-other-files'] } };

function trace({ cost, ms, turns = 4, tools = ['Read', 'Write'], model = 'claude-sonnet-5-5' }) {
  const lines = [
    { type: 'system', subtype: 'init', model },
    // One API message can arrive as several events with the same id.
    { type: 'assistant', message: { id: 'msg_1', content: [{ type: 'text', text: 'hi' }] } },
    { type: 'assistant', message: { id: 'msg_1', content: [{ type: 'tool_use', id: 'tu_1', name: tools[0] }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'tu_1' }] } },
    { type: 'assistant', message: { id: 'msg_2', content: tools.slice(1).map((name, i) => ({ type: 'tool_use', id: `tu_${i + 2}`, name })) } },
    {
      type: 'result', is_error: false, duration_ms: ms, duration_api_ms: ms - 500, num_turns: turns, total_cost_usd: cost,
      usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 1, cache_creation_input_tokens: 1 },
      modelUsage: {
        [model]: { inputTokens: 1000, outputTokens: 200, cacheReadInputTokens: 5000, cacheCreationInputTokens: 300, costUSD: cost * 0.8 },
        'claude-haiku-5-5': { inputTokens: 100, outputTokens: 20, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, costUSD: cost * 0.2 },
      },
    },
  ];
  return lines.map((l) => JSON.stringify(l)).join('\n');
}

function result(runs) {
  const traces = {};
  const doc = {
    schemaVersion: 1,
    claudeVersion: '2.1.302',
    suite: { plugins: [{ name: 'sdd-engineering', version: '1.0.1' }] },
    cases: [{
      name: 'planner-plan-only',
      arms: {
        with: runs.map((r, i) => {
          const tracePath = `/tmp/claude-eval-${i}/out/trace.jsonl`;
          if (r.cost != null) traces[tracePath] = trace(r);
          return {
            score: r.passed ? 1 : 0.5,
            passed: r.passed,
            turns: 0,
            costUsd: (r.cost ?? 0.3) + 0.01,
            judgeCostUsd: 0.01,
            durationSeconds: 99,
            error: r.error ?? null,
            tracePath,
            graders: [
              { name: 'plan-written', passed: true, scored: true },
              { name: 'no-code-or-other-files', passed: !r.critical, scored: true },
              { name: 'skill-fired', passed: false, scored: false },
            ],
          };
        }),
      },
    }],
  };
  return { doc, readFile: (p) => traces[p] ?? null };
}

test('readTrace counts API messages once and every tool call, and sums tokens across models', () => {
  const t = readTrace(trace({ cost: 0.5, ms: 12000, tools: ['Read', 'Write', 'Read'] }));
  assert.equal(t.apiCalls, 2);
  assert.equal(t.toolCalls, 3);
  assert.deepEqual(t.toolCallsByName, { Read: 2, Write: 1 });
  assert.deepEqual(t.tokens, { input: 1100, output: 220, cacheRead: 5000, cacheWrite: 300 });
  assert.equal(t.agentCostUsd, 0.5);
  assert.equal(t.latencySeconds, 12);
  assert.deepEqual(Object.keys(t.models).sort(), ['claude-haiku-5-5', 'claude-sonnet-5-5']);
});

test('collectRuns takes the agent cost from the trace and leaves judge cost out', () => {
  const { doc, readFile } = result([{ passed: true, cost: 0.4, ms: 10000 }]);
  const [run] = collectRuns([doc], scenario, { readFile });
  assert.equal(run.agentCostUsd, 0.4);
  assert.equal(run.judgeCostUsd, 0.01);
  assert.equal(run.latencySeconds, 10);
  assert.equal(run.pluginVersion, '1.0.1');
  assert.equal(run.traceFound, true);
  assert.deepEqual(run.failedGraders, []); // unscored graders do not count
});

test('collectRuns falls back to the eval numbers when the trace is gone', () => {
  const { doc, readFile } = result([{ passed: true, cost: null }]);
  const [run] = collectRuns([doc], scenario, { readFile });
  assert.equal(run.traceFound, false);
  assert.ok(Math.abs(run.agentCostUsd - 0.3) < 1e-9);
  assert.equal(run.latencySeconds, 99);
  assert.equal(run.tokens, null);
});

test('an errored run never counts as passed, and critical graders are flagged', () => {
  const { doc, readFile } = result([
    { passed: true, cost: 0.4, ms: 1000, error: 'timed out after 900s' },
    { passed: false, cost: 0.4, ms: 1000, critical: true },
  ]);
  const runs = collectRuns([doc], scenario, { readFile });
  assert.equal(runs[0].passed, false);
  assert.deepEqual(runs[1].criticalFailures, ['no-code-or-other-files']);
  const s = summarize(runs);
  assert.equal(s.errors, 1);
  assert.equal(s.passRate, 0);
  assert.equal(s.costPerSuccessUsd, null);
});

test('cost per successful workflow divides all agent cost by the passing runs', () => {
  const { doc, readFile } = result([
    { passed: true, cost: 0.3, ms: 1000 },
    { passed: false, cost: 0.3, ms: 1000 },
    { passed: true, cost: 0.6, ms: 1000 },
  ]);
  const s = summarize(collectRuns([doc], scenario, { readFile }));
  assert.ok(Math.abs(s.costPerSuccessUsd - 0.6) < 1e-9);
  assert.equal(s.medianAgentCostUsd, 0.3);
});

const runsOf = (specs) => {
  const { doc, readFile } = result(specs);
  return collectRuns([doc], scenario, { readFile });
};

test('compare reports a clear drop in cost as a saving', () => {
  const before = runsOf([0.50, 0.52, 0.51, 0.53, 0.50].map((cost) => ({ passed: true, cost, ms: 60000 })));
  const after = runsOf([0.30, 0.31, 0.29, 0.30, 0.32].map((cost) => ({ passed: true, cost, ms: 60000 })));
  const c = compare(before, after);
  assert.equal(c.metrics.agentCostUsd.verdict, 'lower');
  assert.equal(c.gate.passed, true);
  assert.equal(c.outcome, 'success');
});

test('compare calls overlapping results noise, not a saving', () => {
  const before = runsOf([0.40, 0.55, 0.47].map((cost) => ({ passed: true, cost, ms: 60000 })));
  const after = runsOf([0.42, 0.50, 0.38].map((cost) => ({ passed: true, cost, ms: 60000 })));
  const c = compare(before, after);
  assert.equal(c.metrics.agentCostUsd.verdict, 'within noise');
  assert.equal(c.outcome, 'no saving beyond noise');
});

test('a new critical false negative fails the gate even when it is cheaper', () => {
  const before = runsOf([0.5, 0.5, 0.5].map((cost) => ({ passed: true, cost, ms: 60000 })));
  const after = runsOf([
    { passed: true, cost: 0.2, ms: 30000 },
    { passed: false, cost: 0.2, ms: 30000, critical: true },
    { passed: true, cost: 0.2, ms: 30000 },
  ]);
  const c = compare(before, after);
  assert.equal(c.gate.noNewCriticalFailures, false);
  assert.deepEqual(c.gate.newCriticalFailures, ['planner-plan-only/no-code-or-other-files']);
  assert.equal(c.outcome, 'failed quality gate');
});

test('median handles even counts and ignores missing values', () => {
  assert.equal(median([3, 1, null, 2, 4]), 2.5);
  assert.equal(median([]), null);
});
