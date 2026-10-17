#!/usr/bin/env bash
# Run the fixed SDD scenario (scripts/cost/scenario.json) and record it for
# docs/COST-BASELINE.md.
#
# Usage: scripts/cost/run-scenario.sh <label>          e.g. baseline, optimized
#
# Writes docs/cost/<label>.json (one record per run, commit this) and keeps the
# raw eval output in .cost-runs/<label>/ (git-ignored).
#
# Needs Linux, macOS or WSL2: the cases grant Bash, and `claude plugin eval`
# refuses to run a shell tool it cannot sandbox. On Linux/WSL2 that sandbox
# needs bubblewrap and socat. Also needs node and a logged-in claude.
#
# Every run spends real money on your credential. MAX_COST_USD (default 25)
# caps each eval invocation.
set -euo pipefail

label=${1:?usage: run-scenario.sh <label>}
root=$(cd "$(dirname "$0")/../.." && pwd)
cd "$root"

field() { node -e "const s=require('./scripts/cost/scenario.json'); const v=s[process.argv[1]]; console.log(Array.isArray(v)?v.join('\n'):v)" "$1"; }
plugin=$(field plugin)
model=$(field model)
runs=$(field runsPerCase)
mapfile -t cases < <(field cases)

if [ -n "$(git status --porcelain -- "$plugin")" ]; then
  echo "⚠ $plugin has uncommitted changes; the record will say so, and the commit SHA will not describe what ran." >&2
fi

raw=".cost-runs/$label"
mkdir -p "$raw"
results=()
for c in "${cases[@]}"; do
  echo "▶ $c ($runs runs, $model)"
  # Exit 1 means a case scored below the threshold: that is a result, not a failure of this script.
  status=0
  claude plugin eval "$plugin" \
    --case "$c" --runs "$runs" --model "$model" --ablation none \
    --scaffold --allow-tools Bash Write Edit --trust-plugin \
    --keep-temp --no-publish --max-cost-usd "${MAX_COST_USD:-25}" \
    --output-dir "$raw/$c" --json "$raw/$c.json" || status=$?
  if [ "$status" -gt 1 ]; then echo "✘ eval for $c stopped with exit $status (cost ceiling, credentials or interrupt)" >&2; exit "$status"; fi
  results+=("$raw/$c.json")
done

node scripts/cost/measure.mjs collect --label "$label" --out "docs/cost/$label.json" "${results[@]}"

# The kept sandboxes are only needed for the traces collect just read.
node -e '
  const fs = require("fs"), path = require("path");
  for (const f of process.argv.slice(1)) {
    for (const c of JSON.parse(fs.readFileSync(f, "utf8")).cases ?? []) for (const r of c.arms?.with ?? []) {
      const dir = r.tracePath && path.dirname(path.dirname(r.tracePath));
      if (dir && /claude-eval-/.test(path.basename(dir))) fs.rmSync(dir, { recursive: true, force: true });
    }
  }' "${results[@]}"
