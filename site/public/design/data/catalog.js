// Sample catalog shaped like the generated catalog.json (spec section 2).
export const BUILD_DATE = '2026-10-16';
export const NEW_WINDOW_DAYS = 14;

export const marketplace = {
  name: 'dev-digest',
  repo: '<org>/<repo>',
  repoUrl: 'https://github.com/org/repo',
  stars: '1.2k',
};

export const categories = [
  { slug: 'development', name: 'Development', icon: 'code', blurb: 'Code review, git workflows and refactoring.' },
  { slug: 'testing', name: 'Testing', icon: 'flask', blurb: 'Test generation, coverage and flaky-test triage.' },
  { slug: 'devops', name: 'DevOps', icon: 'server', blurb: 'Deploys, infrastructure and CI pipelines.' },
  { slug: 'data', name: 'Data', icon: 'database', blurb: 'Databases, CSV files and query analysis.' },
  { slug: 'documents', name: 'Documents', icon: 'file', blurb: 'PDFs, invoices, receipts and forms.' },
  { slug: 'writing', name: 'Writing', icon: 'pen', blurb: 'Docs, READMEs and release notes.' },
  { slug: 'productivity', name: 'Productivity', icon: 'zap', blurb: 'Meetings, standups and issue trackers.' },
  { slug: 'security', name: 'Security', icon: 'shield', blurb: 'Secret scanning, audits and threat models.' },
];

export const synonyms = {
  pdf: ['document'], document: ['pdf', 'doc'], documents: ['pdf'], doc: ['document', 'docs'], docs: ['documentation', 'readme'],
  k8s: ['kubernetes'], kubernetes: ['k8s', 'helm'], test: ['qa', 'tests'], tests: ['qa'], qa: ['test', 'tests'], testing: ['qa', 'tests'],
  invoice: ['bill', 'receipt'], invoices: ['bill', 'receipt'], receipt: ['invoice'], bill: ['invoice'],
  db: ['database', 'sql'], database: ['sql', 'postgres'], postgres: ['postgresql', 'sql'], postgresql: ['postgres'], sql: ['database'],
  pr: ['review'], review: ['pr'], deploy: ['rollout', 'release'], ci: ['pipelines', 'actions'], secret: ['secrets', 'token'], secrets: ['token', 'credentials'],
  changelog: ['release'], notes: ['summary'], summary: ['summarise', 'digest'], summarize: ['summary', 'digest'], lint: ['format'],
};

export const plugins = [
  { name: 'pdf-tools', version: '1.3.0', category: 'documents', author: 'Dima Bognen', addedAt: '2026-05-12', updatedAt: '2026-10-14',
    description: 'Read, extract, fill and summarise PDF documents, including scanned invoices and receipts.', keywords: ['pdf', 'ocr', 'documents'],
    readmeHtml: '<p>pdf-tools bundles everything Claude Code needs to work with PDF files: text and table extraction, OCR for scans, form filling and summaries.</p><h2>Install</h2><pre><code>/plugin install pdf-tools@dev-digest</code></pre><h2>Requirements</h2><p>OCR uses <code>tesseract</code> if it is on your PATH. Without it, scanned pages are skipped with a warning.</p>',
    changelog: [
      { version: '1.3.0', date: '2026-10-14', notes: ['Added invoice-parser with OCR fallback for scanned PDFs'] },
      { version: '1.2.0', date: '2026-10-06', notes: ['Added pdf-digest', 'Deprecated doc-summarizer in favour of pdf-digest'] },
      { version: '1.1.0', date: '2026-08-20', notes: ['pdf-forms keeps field validation when flattening'] },
    ] },
  { name: 'git-helpers', version: '2.1.0', category: 'development', author: 'Lena Ortiz', addedAt: '2026-04-20', updatedAt: '2026-10-11',
    description: 'Pull request review, commit messages and changelogs for git-based teams.', keywords: ['git', 'review', 'commits'],
    readmeHtml: '<p>git-helpers adds a reviewing agent, commit and changelog commands, and a hook that stops broken commits.</p><h2>Install</h2><pre><code>/plugin install git-helpers@dev-digest</code></pre>',
    changelog: [
      { version: '2.1.0', date: '2026-10-11', notes: ['pr-reviewer groups comments by severity', 'pr-reviewer skips generated files'] },
      { version: '2.0.3', date: '2026-09-02', notes: ['/changelog respects pre-release tags'] },
    ] },
  { name: 'data-kit', version: '0.9.2', category: 'data', author: 'Sam Whitfield', addedAt: '2026-07-15', updatedAt: '2026-10-09',
    description: 'Query databases and profile data files without leaving Claude Code.', keywords: ['sql', 'data', 'database'],
    readmeHtml: '<p>data-kit connects Claude Code to PostgreSQL through a read-only MCP server and adds analysis helpers.</p><h2>Setup</h2><pre><code>export DATABASE_URL=postgres://readonly@localhost/app</code></pre>',
    changelog: [{ version: '0.9.2', date: '2026-10-09', notes: ['First release of the postgres MCP server (read-only)'] }] },
  { name: 'qa-guard', version: '1.1.0', category: 'testing', author: 'Priya Raman', addedAt: '2026-03-30', updatedAt: '2026-09-24',
    description: 'Tests, coverage and lint checks that run while Claude works.', keywords: ['tests', 'lint', 'coverage'],
    readmeHtml: '<p>qa-guard keeps quality checks inside the loop: lint before writes, test generation and coverage reports.</p>',
    changelog: [
      { version: '1.1.0', date: '2026-09-24', notes: ['test-writer iterates until tests pass', 'Removed legacy-lint (replaced by pre-commit-lint)'] },
      { version: '1.0.2', date: '2026-07-30', notes: ['/coverage supports pnpm workspaces'] },
    ] },
  { name: 'ops-pack', version: '1.0.4', category: 'devops', author: 'Tomás Reyes', addedAt: '2026-06-10', updatedAt: '2026-10-07',
    description: 'Kubernetes deploys, Terraform reviews and CI access for on-call engineers.', keywords: ['kubernetes', 'terraform', 'ci'],
    readmeHtml: '<p>ops-pack helps with deploys and incidents. The GitHub Actions MCP server needs a token with <code>actions:read</code>.</p>',
    changelog: [{ version: '1.0.4', date: '2026-10-07', notes: ['k8s-deploy validates Helm values against the chart schema'] }] },
  { name: 'sec-tools', version: '0.6.0', category: 'security', author: 'Noor Haddad', addedAt: '2026-08-01', updatedAt: '2026-09-29',
    description: 'Secret scanning, dependency audits and threat models.', keywords: ['security', 'audit', 'secrets'],
    readmeHtml: '<p>sec-tools catches secrets before they are written and audits dependencies on request.</p>',
    changelog: [{ version: '0.6.0', date: '2026-09-29', notes: ['Added secret-scan hook'] }] },
  { name: 'docs-writer', version: '1.4.1', category: 'writing', author: 'Dima Bognen', addedAt: '2026-04-02', updatedAt: '2026-10-02',
    description: 'READMEs, API references and release notes in your team\u2019s style.', keywords: ['docs', 'writing', 'api'],
    readmeHtml: '<p>docs-writer writes and maintains documentation from your code and merged pull requests.</p>',
    changelog: [{ version: '1.4.1', date: '2026-10-02', notes: ['api-doc-writer reads OpenAPI 3.1 files'] }] },
  { name: 'workflow-kit', version: '0.3.0', category: 'productivity', author: 'Ana Novak', addedAt: '2026-08-18', updatedAt: '2026-10-12',
    description: 'Standups, meeting notes and Linear tickets from inside Claude Code.', keywords: ['productivity', 'meetings', 'issues'],
    readmeHtml: '<p>workflow-kit connects Claude Code to Linear and turns your day\u2019s work into updates.</p>',
    changelog: [
      { version: '0.3.0', date: '2026-10-12', notes: ['Added session-summary hook'] },
      { version: '0.2.1', date: '2026-09-18', notes: ['Added linear MCP server'] },
    ] },
];

const R = (type, name, plugin, description, tags, o = {}) => ({ type, name, plugin, description, tags, ...o });

const RAW = [
  R('skill', 'invoice-parser', 'pdf-tools', 'Extracts line items, totals and VAT from PDF invoices, including scanned ones via OCR. Returns structured JSON or CSV.', ['pdf', 'ocr', 'finance', 'invoices', 'csv'],
    { addedAt: '2026-10-14', examples: ['Parse the invoices in ./inbox and give me a CSV of line items', 'What is the total VAT across these three PDF invoices?', 'Extract supplier, invoice number and due date from invoice-0423.pdf'], requires: { tools: ['Read', 'Bash'] },
      files: ['SKILL.md', 'scripts/extract.py', 'reference/vat-rates.md'],
      bodyHtml: '<p>Extracts structured data from PDF invoices. Works on text PDFs directly and falls back to OCR for scanned pages.</p><h2>What you get</h2><ul><li>Supplier, invoice number, issue and due dates</li><li>Line items with quantity, unit price and VAT rate</li><li>Totals, checked against the sum of line items</li></ul><h2>Output format</h2><pre><code>{\n  "supplier": "Northwind Ltd",\n  "number": "INV-0423",\n  "total": 1284.50,\n  "lines": [ { "item": "Hosting", "qty": 1, "unit": 1070.42, "vat": 0.2 } ]\n}</code></pre><h2>Notes</h2><p>Ask for CSV if you want one row per line item. Totals that do not match are flagged rather than corrected.</p>' }),
  R('skill', 'receipt-ocr', 'pdf-tools', 'Reads photographed or scanned receipts and returns merchant, date, total and tax as JSON.', ['ocr', 'finance', 'receipts'], { addedAt: '2026-06-02' }),
  R('skill', 'pdf-forms', 'pdf-tools', 'Fills and flattens PDF forms from a JSON payload while keeping field validation intact.', ['pdf', 'forms'], { addedAt: '2026-05-12', updatedAt: '2026-08-20' }),
  R('skill', 'pdf-digest', 'pdf-tools', 'Turns long PDF documents into a one-page brief with section headings, key figures and open questions.', ['pdf', 'summary', 'reports'], { addedAt: '2026-10-06' }),
  R('skill', 'doc-summarizer', 'pdf-tools', 'Summarises PDF documents into short bullet lists. Replaced by pdf-digest, which keeps tables and figures.', ['pdf', 'summary'], { addedAt: '2026-05-12', updatedAt: '2026-10-06', status: 'deprecated', replacement: 'pdf-tools/skill/pdf-digest' }),
  R('command', '/pdf-extract', 'pdf-tools', 'Extracts text, tables or images from a PDF into a folder next to it.', ['pdf', 'tables'], { addedAt: '2026-07-01', argumentHint: '<file.pdf> [--tables|--images]' }),

  R('agent', 'pr-reviewer', 'git-helpers', 'Reviews a pull request diff for bugs, missing tests and style drift, then leaves inline comments grouped by severity.', ['git', 'review', 'code-quality'], { addedAt: '2026-04-20', updatedAt: '2026-10-11', requires: { tools: ['Read', 'Grep', 'Bash(git *)'], model: 'sonnet' }, examples: ['Use the pr-reviewer agent on my current branch', 'Review PR #482 and focus on missing tests'] }),
  R('command', '/changelog', 'git-helpers', 'Drafts a CHANGELOG entry from commits since the last tag, grouped into Added, Changed and Fixed.', ['git', 'release', 'changelog'], { addedAt: '2026-04-20', updatedAt: '2026-09-02', argumentHint: '[since-tag]' }),
  R('command', '/commit-msg', 'git-helpers', 'Writes a Conventional Commits message for the staged changes.', ['git', 'commits'], { addedAt: '2026-05-04', argumentHint: '[scope]' }),
  R('skill', 'conventional-commits', 'git-helpers', 'Teaches Claude your commit message rules and checks messages before they are written.', ['git', 'commits', 'style'], { addedAt: '2026-04-20' }),
  R('hook', 'commit-guard', 'git-helpers', 'Blocks git commit when staged files contain merge-conflict markers or debug statements.', ['git', 'safety'], { addedAt: '2026-06-14', event: 'PreToolUse' }),

  R('mcp', 'postgres', 'data-kit', 'Read-only MCP server for PostgreSQL. Lets Claude inspect schemas and run SELECT queries against a connection you provide.', ['sql', 'postgres', 'database'], { addedAt: '2026-10-09', status: 'beta', requires: { env: ['DATABASE_URL'] } }),
  R('skill', 'csv-profiler', 'data-kit', 'Profiles a CSV file: column types, null rates, outliers and suggested cleaning steps.', ['csv', 'data-quality', 'analysis'], { addedAt: '2026-07-15' }),
  R('agent', 'sql-analyst', 'data-kit', 'Answers business questions by writing, running and explaining SQL against your connected database.', ['sql', 'analysis', 'reporting'], { addedAt: '2026-07-15', requires: { mcp: ['postgres'], tools: ['Read'], model: 'sonnet' } }),
  R('command', '/explain-query', 'data-kit', 'Explains a slow SQL query plan in plain language and suggests indexes.', ['sql', 'performance'], { addedAt: '2026-07-15', argumentHint: '<query or file.sql>' }),

  R('hook', 'pre-commit-lint', 'qa-guard', 'Runs your project linter before Claude writes a file and blocks the edit if it fails.', ['lint', 'ci', 'format'], { addedAt: '2026-03-30', event: 'PreToolUse' }),
  R('agent', 'test-writer', 'qa-guard', 'Writes unit tests for a changed module, runs them and iterates until they pass.', ['tests', 'unit-tests', 'coverage'], { addedAt: '2026-05-21', updatedAt: '2026-09-24', status: 'beta', requires: { tools: ['Read', 'Write', 'Bash'], model: 'sonnet' } }),
  R('command', '/coverage', 'qa-guard', 'Runs the test suite with coverage and lists the least-covered files touched in this branch.', ['tests', 'coverage'], { addedAt: '2026-03-30', updatedAt: '2026-07-30' }),
  R('skill', 'flaky-test-triage', 'qa-guard', 'Finds tests that fail intermittently from CI logs and proposes fixes or quarantines.', ['tests', 'ci', 'flaky'], { addedAt: '2026-06-03' }),

  R('skill', 'k8s-deploy', 'ops-pack', 'Generates and validates Helm values and Kubernetes manifests, then walks through a staged rollout.', ['kubernetes', 'helm', 'deploy'], { addedAt: '2026-06-10', updatedAt: '2026-10-07' }),
  R('skill', 'terraform-plan-review', 'ops-pack', 'Reads a terraform plan and flags destructive changes, drift and missing tags before you apply.', ['terraform', 'iac', 'review'], { addedAt: '2026-06-10' }),
  R('mcp', 'github-actions', 'ops-pack', 'MCP server for GitHub Actions: list workflow runs, read job logs and re-run failed jobs.', ['ci', 'github', 'pipelines'], { addedAt: '2026-06-24', requires: { env: ['GITHUB_TOKEN'] } }),
  R('command', '/incident', 'ops-pack', 'Starts an incident doc from a template and collects recent deploys and error logs.', ['incident', 'on-call'], { addedAt: '2026-07-08', argumentHint: '<service> [severity]' }),

  R('hook', 'secret-scan', 'sec-tools', 'Scans every file Claude writes for API keys, tokens and private keys and blocks the write on a match.', ['secrets', 'audit', 'safety'], { addedAt: '2026-09-29', event: 'PreToolUse' }),
  R('agent', 'dependency-auditor', 'sec-tools', 'Checks lockfiles for known vulnerabilities and licence problems, then proposes upgrade PRs.', ['dependencies', 'audit', 'cve'], { addedAt: '2026-08-01', requires: { tools: ['Read', 'Bash(npm audit *)'], model: 'sonnet' } }),
  R('skill', 'threat-model', 'sec-tools', 'Builds a STRIDE threat model for a service from its code and architecture notes.', ['threat-model', 'review'], { addedAt: '2026-08-01' }),

  R('skill', 'release-notes', 'docs-writer', 'Writes user-facing release notes from merged PRs, grouped by feature area.', ['release', 'changelog', 'docs'], { addedAt: '2026-04-02' }),
  R('agent', 'api-doc-writer', 'docs-writer', 'Generates and updates reference docs for HTTP APIs from route handlers and OpenAPI files.', ['api', 'docs', 'openapi'], { addedAt: '2026-04-02', updatedAt: '2026-10-02', requires: { tools: ['Read', 'Write', 'Glob'], model: 'sonnet' } }),
  R('command', '/readme', 'docs-writer', 'Creates or refreshes a README with setup, usage and contribution sections.', ['docs', 'readme'], { addedAt: '2026-04-02' }),
  R('skill', 'style-guide', 'docs-writer', 'Applies your team\u2019s writing style guide to docs and UI copy.', ['writing', 'style', 'docs'], { addedAt: '2026-05-19' }),

  R('mcp', 'linear', 'workflow-kit', 'MCP server for Linear: search issues, create tickets and update status from Claude Code.', ['issues', 'linear', 'planning'], { addedAt: '2026-09-18', requires: { env: ['LINEAR_API_KEY'] } }),
  R('skill', 'meeting-notes', 'workflow-kit', 'Turns a meeting transcript into decisions, action items and owners.', ['meetings', 'notes', 'summary'], { addedAt: '2026-08-18' }),
  R('command', '/standup', 'workflow-kit', 'Summarises yesterday\u2019s commits, PRs and tickets into a standup update.', ['standup', 'git', 'summary'], { addedAt: '2026-08-18' }),
  R('hook', 'session-summary', 'workflow-kit', 'Writes a short summary of what changed when a Claude Code session ends.', ['summary', 'notes'], { addedAt: '2026-10-12', event: 'Stop' }),
];

export const collections = [
  { slug: 'starter-pack', title: 'Starter pack', description: 'Three plugins most teams install first: code review, tests and docs.', plugins: ['git-helpers', 'qa-guard', 'docs-writer'] },
];

export const changes = [
  { date: '2026-10-14', kind: 'New', id: 'pdf-tools/skill/invoice-parser', from: '1.2.0', to: '1.3.0', note: 'Added invoice-parser with OCR fallback for scanned PDFs' },
  { date: '2026-10-12', kind: 'New', id: 'workflow-kit/hook/session-summary', from: '0.2.1', to: '0.3.0', note: 'Added session-summary hook' },
  { date: '2026-10-11', kind: 'Updated', id: 'git-helpers/agent/pr-reviewer', from: '2.0.3', to: '2.1.0', note: 'Groups comments by severity and skips generated files' },
  { date: '2026-10-09', kind: 'New', id: 'data-kit/mcp/postgres', from: '', to: '0.9.2', note: 'First release, read-only queries only' },
  { date: '2026-10-07', kind: 'Updated', id: 'ops-pack/skill/k8s-deploy', from: '1.0.3', to: '1.0.4', note: 'Validates Helm values against the chart schema' },
  { date: '2026-10-06', kind: 'New', id: 'pdf-tools/skill/pdf-digest', from: '1.1.0', to: '1.2.0', note: 'One-page briefs that keep tables and figures' },
  { date: '2026-10-06', kind: 'Deprecated', id: 'pdf-tools/skill/doc-summarizer', from: '1.1.0', to: '1.2.0', note: 'Use pdf-digest instead' },
  { date: '2026-10-02', kind: 'Updated', id: 'docs-writer/agent/api-doc-writer', from: '1.4.0', to: '1.4.1', note: 'Reads OpenAPI 3.1 files' },
  { date: '2026-09-29', kind: 'New', id: 'sec-tools/hook/secret-scan', from: '0.5.0', to: '0.6.0', note: 'Blocks writes that contain API keys or private keys' },
  { date: '2026-09-24', kind: 'Updated', id: 'qa-guard/agent/test-writer', from: '1.0.2', to: '1.1.0', note: 'Iterates until generated tests pass' },
  { date: '2026-09-24', kind: 'Removed', id: 'qa-guard/hook/legacy-lint', removed: { type: 'hook', name: 'legacy-lint', plugin: 'qa-guard' }, from: '1.0.2', to: '1.1.0', note: 'Replaced by pre-commit-lint' },
  { date: '2026-09-18', kind: 'New', id: 'workflow-kit/mcp/linear', from: '0.2.0', to: '0.2.1', note: 'Search and update Linear issues' },
];

const TYPE_DIR = { skill: 'skills', agent: 'agents', command: 'commands', hook: 'hooks', mcp: '', plugin: '' };
const slug = (n) => n.replace(/^\//, '');
const titleCase = (n) => slug(n).split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

function defaultBody(a) {
  const p = `<p>${a.description}</p>`;
  if (a.type === 'skill') return p + `<h2>When Claude uses it</h2><p>Claude loads this skill on its own when a request is about ${a.tags.slice(0, 2).join(' or ')}. You don\u2019t need to name it.</p>`;
  if (a.type === 'agent') return p + `<h2>How to call it</h2><p>Ask Claude to use the <code>${a.name}</code> agent, or let Claude delegate to it when the task matches.</p>`;
  if (a.type === 'command') return p + `<h2>Usage</h2><pre><code>${a.name} ${a.argumentHint || ''}</code></pre>`;
  if (a.type === 'hook') return p + `<h2>Event</h2><p>Runs on <code>${a.event}</code>. Exits with code 2 to block the action and explain why.</p>`;
  if (a.type === 'mcp') return p + `<h2>Setup</h2><p>Set the environment variables below before starting Claude Code.</p><pre><code>${(a.requires?.env || []).map((e) => `export ${e}=…`).join('\n')}</code></pre>`;
  return p;
}

function defaultFiles(a) {
  const s = slug(a.name);
  if (a.type === 'skill') return a.files || ['SKILL.md'];
  if (a.type === 'agent') return [`${s}.md`];
  if (a.type === 'command') return [`${s}.md`];
  if (a.type === 'hook') return ['hooks.json', `${s}.sh`];
  if (a.type === 'mcp') return ['.mcp.json'];
  return ['.claude-plugin/plugin.json', 'README.md', 'CHANGELOG.md'];
}

function build(a) {
  const pl = plugins.find((p) => p.name === a.plugin);
  const s = slug(a.name);
  const id = a.type === 'plugin' ? `${a.plugin}/plugin/${a.plugin}` : `${a.plugin}/${a.type}/${s}`;
  const dir = a.type === 'skill' ? `plugins/${a.plugin}/skills/${s}/` : a.type === 'plugin' || a.type === 'mcp' ? `plugins/${a.plugin}/` : a.type === 'hook' ? `plugins/${a.plugin}/hooks/` : `plugins/${a.plugin}/${TYPE_DIR[a.type]}/`;
  const files = (a.type === 'skill' ? defaultFiles(a) : defaultFiles(a)).map((f) => ({ path: dir + f, url: `${marketplace.repoUrl}/blob/main/${dir}${f}` }));
  return {
    id, slug: s, type: a.type, name: a.name, title: titleCase(a.name), description: a.description, plugin: a.plugin,
    category: a.category || pl.category, tags: a.tags, author: pl.author, version: pl.version,
    addedAt: a.addedAt || pl.addedAt, updatedAt: a.updatedAt || a.addedAt || pl.updatedAt,
    status: a.status || 'stable', replacement: a.replacement || null, installCommand: `/plugin install ${a.plugin}@${marketplace.name}`,
    requires: { mcp: [], env: [], tools: [], model: '', ...(a.requires || {}) }, examples: a.examples || [],
    argumentHint: a.argumentHint || '', event: a.event || '',
    sourceUrl: files[0].url, files, bodyHtml: a.bodyHtml || defaultBody(a),
  };
}

export const artifacts = [
  ...plugins.map((p) => build({ type: 'plugin', name: p.name, plugin: p.name, description: p.description, tags: p.keywords, addedAt: p.addedAt, updatedAt: p.updatedAt, bodyHtml: p.readmeHtml })),
  ...RAW.map(build),
];

const CODE = { plugin: 'PLUGIN', skill: 'SKILL', agent: 'AGENT', command: 'CMD', hook: 'HOOK', mcp: 'MCP' };
export const TYPE_LABEL = { plugin: 'Plugin', skill: 'Skill', agent: 'Agent', command: 'Command', hook: 'Hook', mcp: 'MCP server' };
export const TYPE_PLURAL = { plugin: ['plugin', 'plugins'], skill: ['skill', 'skills'], agent: ['agent', 'agents'], command: ['command', 'commands'], hook: ['hook', 'hooks'], mcp: ['MCP server', 'MCP servers'] };

export const daysAgo = (d) => Math.round((Date.parse(BUILD_DATE) - Date.parse(d)) / 864e5);
export function rel(d) {
  const n = daysAgo(d);
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  if (n < 7) return `${n} days ago`;
  if (n < 30) { const w = Math.floor(n / 7); return w === 1 ? '1 week ago' : `${w} weeks ago`; }
  const m = Math.floor(n / 30); return m === 1 ? '1 month ago' : `${m} months ago`;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (d) => { const x = new Date(d + 'T00:00:00'); return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`; };
export const fmtShort = (d) => { const x = new Date(d + 'T00:00:00'); return `${x.getDate()} ${MONTHS[x.getMonth()]}`; };

export function decorate(a) {
  const isNew = daysAgo(a.addedAt) <= NEW_WINDOW_DAYS;
  const isUpdated = !isNew && daysAgo(a.updatedAt) <= NEW_WINDOW_DAYS;
  const badges = [];
  if (a.status === 'deprecated') badges.push({ label: 'Deprecated', cls: 'tag-neutral' });
  else {
    if (isNew) badges.push({ label: 'New', cls: 'tag-accent' });
    if (isUpdated) badges.push({ label: 'Updated', cls: 'tag-outline' });
    if (a.status === 'beta') badges.push({ label: 'Beta', cls: 'tag-neutral' });
  }
  const flags = [
    { label: 'Valid manifest', ok: true },
    { label: 'Has README', ok: true },
    { label: 'Has examples', ok: a.examples.length > 0 || !!a.argumentHint },
    { label: 'Updated in last 90 days', ok: daysAgo(a.updatedAt) <= 90 },
  ];
  const score = flags.filter((f) => f.ok).length * 20 + Math.min(20, Math.round(a.description.length / 6));
  const url = a.type === 'plugin' ? `/plugins/${a.plugin}` : `/plugins/${a.plugin}/${a.type}/${a.slug}`;
  const bodyText = a.bodyHtml.replace(/<[^>]+>/g, ' ');
  return {
    ...a, code: CODE[a.type], typeLabel: TYPE_LABEL[a.type], isNew, isUpdated, badges, rel: rel(a.updatedAt),
    url, href: '#' + url, bodyText, quality: { flags, score },
    installNote: a.type === 'plugin' ? 'Installs this plugin' : `Installs with ${a.plugin}`,
  };
}
