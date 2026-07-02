#!/usr/bin/env bash
#
# loop-test-dates-kit.sh
# ----------------------
# Repeatedly invokes Claude Code (headless) to give EVERY component that already
# exists in @knitui/dates a thorough Jest + React Testing Library test, until MOST
# OF EACH COMPONENT'S FEATURES ARE ACTUALLY COVERED — measured by per-component
# code coverage, not merely "a test file exists". When a test (or honest
# inspection against the @mantine/dates public API it mirrors) shows behaviour
# that is broken, missing, or divergent, it FIXES the component source instead of
# weakening the test.
#
# It is the dates-specific, coverage-driven sibling of
# scripts/loop-build-stories-tests-lean.sh. It shares that script's lean design
# (one Claude session per iteration; the big rules block written ONCE to a file
# and referenced by path; a per-session turn cap; live pretty-streamed output;
# diff-scoped strict-typing gate; reflect → plan → execute → validate, resumable
# from disk) and reuses the dates context from scripts/loop-build-dates-kit.sh.
#
# WHY COVERAGE DRIVES IT
#   The components already exist (packages/dates/src/<Name>) and the Jest/RTL
#   toolchain is already configured (jest.config.js, jest.setup.ts — both cloned
#   from @knitui/components, rendering the cross-platform Tamagui components on the
#   WEB target via react-native-web in jsdom). Today only the pure dayjs utils and
#   hooks are tested; the COMPONENTS have no tests. So "done" here is not a binary
#   "has a <Name>.test.tsx" — it is "has a test AND that test drives the
#   component's source past COVERAGE_TARGET% statements". Each iteration the loop:
#     1. runs the suite WITH coverage (one run serves both the pass/fail gate and
#        the per-component coverage map),
#     2. picks the LOWEST-COVERED components (the ones whose features are least
#        exercised) as the work-list,
#     3. has Claude reflect → plan → write/deepen their tests (and fix the source
#        when the test exposes a real bug) → re-run the gate.
#   Progress is derived from the real coverage map on disk, so it is resumable and
#   converges on "most features covered" rather than "a test file is present".
#
# HOW IT WORKS (each iteration = ONE Claude session)
#   reflect → plan (.dates-test-plan.md) → execute → validate. The validation gate
#   = `typecheck` AND the dates test suite (run with --coverage) AND a diff-scoped
#   strict-typing check. Tests are the spec: a failure fails the iteration and
#   Claude must fix the ROOT CAUSE, preferring to fix the component over weakening
#   the test. When a coverage "cycle" reaches TARGET_FRACTION of components at
#   target, Claude reviews the whole suite and appends NEW recommendations
#   (.dates-test-recommendations.md); the loop then works that backlog and
#   regenerates ideas each cycle until it converges or hits MAX_CYCLES /
#   MAX_ITERATIONS.
#
# Usage
#   scripts/loop-test-dates-kit.sh                          # run with defaults (live output)
#   BATCH_SIZE=3 MAX_ITERATIONS=60 scripts/loop-test-dates-kit.sh
#   COVERAGE_TARGET=85 scripts/loop-test-dates-kit.sh        # raise the bar per component
#   ONLY="Calendar,DatePicker,TimeInput" scripts/loop-test-dates-kit.sh   # subset
#   STREAM=text scripts/loop-test-dates-kit.sh               # only final answers
#   DRY_RUN=1 scripts/loop-test-dates-kit.sh                 # show the work-list, write nothing
#
# Live + persisted output:
#   - Terminal shows readable activity in real time (STREAM=pretty, the default).
#   - .dates-test-logs/iter-NNN-*.log        readable transcript per iteration
#   - .dates-test-logs/iter-NNN-*.log.jsonl  full raw stream-json for that iteration
#
# NOTE: This runs Claude with --dangerously-skip-permissions so it can edit files
# and run the test suite unattended. Only run it in a repo/branch you trust.

set -euo pipefail

# ----------------------------------------------------------------------------
# Configuration (override any of these via environment variables)
# ----------------------------------------------------------------------------
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# The dates package we are covering with tests.
DATES_PKG_NAME="${DATES_PKG_NAME:-@knitui/dates}"
DATES_PKG_DIR="${DATES_PKG_DIR:-packages/dates}"

# References the tests assert against (read, never copied):
#   - Mantine DATES source = the PUBLIC prop API + behaviour each test pins down.
#   - Our @knitui/components source = the building blocks the dates kit composes,
#     and the canonical test style to mirror (Button.test.tsx, test-utils.tsx).
DATES_REF="${DATES_REF:-$REPO_DIR/tmp/mantine/dates}"
COMPONENTS_REF="${COMPONENTS_REF:-$REPO_DIR/packages/components/src}"

PROGRESS_FILE="${PROGRESS_FILE:-$REPO_DIR/.dates-test-progress}"
LOG_DIR="${LOG_DIR:-$REPO_DIR/.dates-test-logs}"
JOURNAL="${JOURNAL:-$REPO_DIR/.dates-test-journal.md}"           # running reflection log
PLAN_FILE="${PLAN_FILE:-$REPO_DIR/.dates-test-plan.md}"          # current iteration plan
RECS_FILE="${RECS_FILE:-$REPO_DIR/.dates-test-recommendations.md}"  # backlog of ideas
# Architecture/rules written ONCE at startup and referenced by every prompt.
RULES_FILE="${RULES_FILE:-$REPO_DIR/.dates-test-rules.md}"

BATCH_SIZE="${BATCH_SIZE:-6}"           # components to cover/deepen per iteration
MAX_ITERATIONS="${MAX_ITERATIONS:-100}"
RETRY_LIMIT="${RETRY_LIMIT:-2}"         # extra fix attempts per failing iteration
# A coverage "cycle" completes when this %% of components are at COVERAGE_TARGET.
TARGET_FRACTION="${TARGET_FRACTION:-90}"
# Per-component completeness bar: a component counts as "covered" when it has a
# test AND its source statements coverage is at least this percent.
COVERAGE_TARGET="${COVERAGE_TARGET:-80}"
MAX_CYCLES="${MAX_CYCLES:-2}"           # coverage cycle + this many audit/improve cycles
# Per-session turn cap (one session plans + writes several tests + fixes sources +
# runs the suite). Scales with BATCH_SIZE — more components per iteration need more
# turns. Empty = no cap. Lower to clamp tokens, raise if work is cut off.
MAX_TURNS="${MAX_TURNS:-150}"

MODEL="${MODEL:-}"                      # e.g. claude-opus-4-8 ; empty = account default
FALLBACK_MODEL="${FALLBACK_MODEL:-}"    # e.g. claude-sonnet-4-6
DRY_RUN="${DRY_RUN:-0}"

# Restrict the work-list to a comma-separated subset (handy for re-running a few).
ONLY="${ONLY:-}"

# ---- Validation gate -------------------------------------------------------
# The gate = typecheck AND the dates test suite (run WITH coverage so a single
# run gives both the pass/fail signal and the per-component coverage map) AND a
# diff-scoped strict-typing check.
TYPECHECK_CMD="${TYPECHECK_CMD:-pnpm --filter $DATES_PKG_NAME typecheck}"
# Jest runs in the package dir (via pnpm --filter exec), so the coverage globs and
# the coverage-summary.json output path are relative to packages/dates.
TEST_CMD="${TEST_CMD:-pnpm --filter $DATES_PKG_NAME exec jest --coverage --coverageReporters=json-summary --coverageReporters=text-summary --collectCoverageFrom='src/**/*.{ts,tsx}' --collectCoverageFrom='!src/**/*.test.*' --collectCoverageFrom='!src/**/*.stories.*' --collectCoverageFrom='!src/**/index.{ts,tsx}'}"
# Where jest writes the machine-readable coverage map the loop parses.
COVERAGE_SUMMARY="${COVERAGE_SUMMARY:-$REPO_DIR/$DATES_PKG_DIR/coverage/coverage-summary.json}"

# Type-strictness gate (identical contract to the sibling loops): tsc passes
# `any` / `as any` / suppression comments happily, so on TOP of typecheck we
# reject those escape hatches. DIFF-SCOPED: pre-existing hits are baselined at
# startup and tolerated; the gate fails only when an iteration INTRODUCES one.
STRICT_TYPES="${STRICT_TYPES:-1}"
STRICT_TYPE_PATTERN="${STRICT_TYPE_PATTERN:-(\bas any\b|\bas unknown as\b|:[[:space:]]*any\b|\bany\[\]|<[[:space:]]*any[[:space:]]*[,>]|,[[:space:]]*any[[:space:]]*>|@ts-ignore|@ts-nocheck|@ts-expect-error)}"
STRICT_BASELINE_FILE="${STRICT_BASELINE_FILE:-$LOG_DIR/.strict-baseline}"

# How Claude's activity is shown live: "pretty" (streamed + human-readable),
# "json" (raw stream-json), or "text" (final answer only, no live activity).
STREAM="${STREAM:-pretty}"

# Test-completeness hints: each iteration, statically extract every component's
# custom `variants` (names + values) and its `…Props` members and flag the ones
# the matching <Name>.test.tsx never references, feeding that list to the prompt
# so the loop deepens thin tests. Best-effort HINT only (it can't see props
# tested indirectly and misses dynamic/functional variants), so it never fails
# the gate. Needs `node`; auto-skips if absent. 0=off.
COMPLETENESS_HINTS="${COMPLETENESS_HINTS:-1}"
COMPLETENESS_MAX="${COMPLETENESS_MAX:-25}"

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
log()  { printf '\033[1;36m[dates-test]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[dates-test]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[dates-test]\033[0m %s\n' "$*" >&2; exit 1; }

command -v claude >/dev/null 2>&1 || die "claude CLI not found on PATH."
command -v node   >/dev/null 2>&1 || die "node not found on PATH (needed to parse coverage)."

mkdir -p "$LOG_DIR"
touch "$PROGRESS_FILE" "$JOURNAL" "$RECS_FILE"

SRC_DIR="$REPO_DIR/$DATES_PKG_DIR/src"
[[ -d "$SRC_DIR" ]] || die "Dates source dir not found: $SRC_DIR"

# Pretty streaming needs node; gracefully degrade if it's missing.
FORMATTER="$LOG_DIR/.stream-format.mjs"
if [[ "$STREAM" == "pretty" ]] && ! command -v node >/dev/null 2>&1; then
  warn "node not found — falling back to STREAM=text (final answers only)."
  STREAM="text"
fi

# Write the live formatter: turns Claude's stream-json into readable lines so you
# can watch every message, tool call, file edit and command as it happens.
if [[ "$STREAM" == "pretty" ]]; then
  cat > "$FORMATTER" <<'JS'
import readline from 'node:readline';
const rl = readline.createInterface({ input: process.stdin });
const c = (n) => (s) => `\x1b[${n}m${s}\x1b[0m`;
const dim = c(2), cyan = c(36), green = c(32), red = c(31), bold = c(1);
const short = (v, n = 160) => {
  v = String(v ?? '').replace(/\s+/g, ' ').trim();
  return v.length > n ? v.slice(0, n) + '…' : v;
};
function toolSummary(name, input = {}) {
  if (name === 'Bash') return short(input.command);
  if (['Edit', 'Write', 'Read', 'NotebookEdit'].includes(name))
    return input.file_path || input.notebook_path || '';
  if (['Grep', 'Glob'].includes(name)) return short(input.pattern || input.query || '');
  if (['Task', 'Agent'].includes(name)) return short(input.description || input.prompt);
  const k = Object.keys(input)[0];
  return k ? short(`${k}=${JSON.stringify(input[k])}`) : '';
}
rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;
  let ev;
  try { ev = JSON.parse(line); } catch { console.log(dim(line)); return; } // pass non-JSON (e.g. stderr) through
  const t = ev.type;
  if (t === 'system' && ev.subtype === 'init') {
    console.log(dim(`▸ session ${ev.session_id || ''}  model=${ev.model || ''}`));
  } else if (t === 'assistant' && ev.message?.content) {
    for (const b of ev.message.content) {
      if (b.type === 'text' && b.text.trim()) console.log(b.text.trim());
      else if (b.type === 'tool_use') console.log(cyan('  🔧 ' + b.name) + ' ' + dim(toolSummary(b.name, b.input)));
    }
  } else if (t === 'user' && ev.message?.content) {
    for (const b of ev.message.content) {
      if (b.type !== 'tool_result') continue;
      let body = b.content;
      if (Array.isArray(body)) body = body.map((x) => x.text || '').join(' ');
      const s = short(body, 100);
      if (s) console.log(dim('     ↳ ' + (b.is_error ? red('error: ') : '') + s));
    }
  } else if (t === 'result') {
    const cost = ev.total_cost_usd != null ? `$${ev.total_cost_usd.toFixed(4)}` : '';
    const dur = ev.duration_ms != null ? `${(ev.duration_ms / 1000).toFixed(1)}s` : '';
    const paint = ev.is_error ? red : green;
    console.log(paint(bold(`▸ ${ev.subtype || 'done'}`) + ` ${dur} ${cost} turns=${ev.num_turns ?? ''}`.replace(/\s+/g, ' ')));
  }
});
JS
fi

# Coverage parser. Reads jest's coverage-summary.json and prints, one component
# per line: "<Name>\t<statements-pct>\t<statements-total>" — aggregating the
# statements of every source file under src/<Name>/ (excluding test/stories/index
# files, which are not instrumented). A component with zero instrumented
# statements (e.g. pure types) prints pct 100 / total 0 and is treated as N/A by
# the caller. Prints nothing if the summary doesn't exist yet.
COVERAGE_SCRIPT="$LOG_DIR/.coverage.cjs"
cat > "$COVERAGE_SCRIPT" <<'JS'
const fs = require('fs');
const path = require('path');
const [summaryPath, srcDir] = process.argv.slice(2);
let summary;
try { summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')); } catch { process.exit(0); }
const agg = new Map(); // component -> { covered, total }
for (const [abs, data] of Object.entries(summary)) {
  if (abs === 'total' || !data || !data.statements) continue;
  const rel = path.relative(srcDir, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) continue;       // outside src/
  const seg = rel.split(path.sep)[0];
  if (!/^[A-Z]/.test(seg)) continue;                                 // only component folders
  if (/\.(test|stories)\.[tj]sx?$/.test(rel)) continue;              // skip test/story files
  if (/(^|[\\/])index\.[tj]sx?$/.test(rel)) continue;                // skip barrels
  const cur = agg.get(seg) || { covered: 0, total: 0 };
  cur.covered += data.statements.covered || 0;
  cur.total += data.statements.total || 0;
  agg.set(seg, cur);
}
for (const [name, { covered, total }] of [...agg.entries()].sort()) {
  const pct = total > 0 ? Math.round((100 * covered) / total) : 100;
  process.stdout.write(`${name}\t${pct}\t${total}\n`);
}
JS

# Test-completeness extractor (needs node) — identical contract to the sibling
# loop: given a component source file and its test file, print the variants /
# values / props the test never references. Best-effort; treated as a hint.
COMPLETENESS_SCRIPT="$LOG_DIR/.completeness.cjs"
if [[ "$COMPLETENESS_HINTS" == "1" ]] && command -v node >/dev/null 2>&1; then
  cat > "$COMPLETENESS_SCRIPT" <<'JS'
const fs = require('fs');
const [name, srcPath, testPath] = process.argv.slice(2);
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const src = read(srcPath), test = read(testPath);
if (!src || !test) process.exit(0);
const code = src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/[^\n]*/g, ' ')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""');
function scanObject(text, open, cb) {
  let depth = 0, cur = '';
  for (let p = open; p < text.length; p++) {
    const c = text[p];
    if (c === '{') { depth++; cur = ''; continue; }
    if (c === '}') { depth--; cur = ''; if (depth === 0) return p; continue; }
    if (c === ':') {
      const t = cur.trim().replace(/^['"]|['"]$/g, '');
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)) cb(t, depth - 1);
      cur = ''; continue;
    }
    if (c === ',' || c === ';' || c === '\n' || c === '(' || c === ')') { cur = ''; continue; }
    cur += c;
  }
  return text.length;
}
const variantNames = new Set(), variantValues = new Set(), propNames = new Set();
let vm;
const variantsRe = /\bvariants\s*[:=]\s*\{/g;
while ((vm = variantsRe.exec(code))) {
  const open = vm.index + vm[0].length - 1;
  const end = scanObject(code, open, (key, d) => {
    if (d === 0) variantNames.add(key);
    else if (d === 1) variantValues.add(key);
  });
  variantsRe.lastIndex = Math.max(end, variantsRe.lastIndex);
}
const pm = code.match(/(?:type|interface)\s+\w*Props\b[^{]*\{/);
if (pm) {
  const open = pm.index + pm[0].length - 1;
  scanObject(code, open, (key, d) => { if (d === 0) propNames.add(key); });
}
const seen = (tok) => new RegExp('\\b' + tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(test);
const trivial = new Set(['true', 'false', 'children', 'style', 'key', 'ref', 'theme']);
const gap = (set) => [...set].filter((t) => !trivial.has(t) && !seen(t));
const cap = (arr, n = 12) => (arr.length > n ? arr.slice(0, n).concat('…') : arr);
const parts = [];
const mv = gap(variantNames), mvals = gap(variantValues), mp = gap(propNames);
if (mvals.length) parts.push(`variant-values[${cap(mvals).join(', ')}]`);
if (mv.length) parts.push(`variant-axes[${cap(mv).join(', ')}]`);
if (mp.length) parts.push(`props[${cap(mp).join(', ')}]`);
if (parts.length) console.log(`${name}: untested ${parts.join(' ')}`);
JS
else
  COMPLETENESS_SCRIPT=""
  [[ "$COMPLETENESS_HINTS" == "1" ]] && warn "node not found — completeness hints disabled (prompt still enforces completeness)."
fi

# The work-list is the components ALREADY on disk (folders under src/ starting
# with an uppercase letter — this naturally excludes hooks/, internal/, utils/).
# Optionally filtered by $ONLY. Printed one per line, sorted.
component_list() {
  local names
  names="$(find "$SRC_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null \
           | grep -E '^[A-Z]' | sort -u)"
  [[ -n "$names" ]] || die "No component folders found under $SRC_DIR."
  if [[ -n "$ONLY" ]]; then
    local keep
    keep="$(printf '%s\n' "$names" | grep -Fx -f <(printf '%s\n' "${ONLY//,/$'\n'}" | sed 's/[[:space:]]//g' | grep -v '^$') || true)"
    [[ -n "$keep" ]] || die "ONLY='$ONLY' matched none of the on-disk components."
    echo "$keep"
  else
    echo "$names"
  fi
}

is_done() { grep -qxF "$1" "$PROGRESS_FILE"; }
mark_done() { is_done "$1" || echo "$1" >> "$PROGRESS_FILE"; }

component_has_test() {
  [[ -f "$SRC_DIR/$1/$1.test.tsx" || -f "$SRC_DIR/$1/$1.test.ts" ]]
}

# Coverage map ("<Name>\t<pct>\t<total>" lines), refreshed from the last gate run
# into a file (bash 3.2 has no associative arrays, matching the sibling scripts).
COVERAGE_MAP_FILE="$LOG_DIR/.coverage-map"
load_coverage() {
  : > "$COVERAGE_MAP_FILE"
  [[ -f "$COVERAGE_SUMMARY" ]] || return 0
  node "$COVERAGE_SCRIPT" "$COVERAGE_SUMMARY" "$SRC_DIR" > "$COVERAGE_MAP_FILE" 2>/dev/null || true
}

# Statement-coverage percent for a component (0 if unknown / not yet measured).
component_pct() {
  [[ -f "$COVERAGE_MAP_FILE" ]] || { echo 0; return 0; }
  awk -F'\t' -v n="$1" '$1 == n { print $2; f = 1 } END { if (!f) print 0 }' "$COVERAGE_MAP_FILE"
}

# A component counts as "covered" when it has a test AND its source coverage is at
# or above the target.
component_covered() {
  component_has_test "$1" || return 1
  (( "$(component_pct "$1")" >= COVERAGE_TARGET ))
}

# Reconcile the progress file with what actually exists on disk, echo the count.
sync_progress() {
  local covered=0 c
  for c in "${ALL_COMPONENTS[@]}"; do
    if component_covered "$c"; then mark_done "$c"; covered=$((covered + 1)); fi
  done
  echo "$covered"
}

# Comma-joined list of components NOT yet covered, LOWEST coverage first (the ones
# whose features are least exercised), each tagged with its state. Capped.
remaining_list() {
  local c tag
  {
    for c in "${ALL_COMPONENTS[@]}"; do
      component_covered "$c" && continue
      if component_has_test "$c"; then tag="$(component_pct "$c")%cov"; else tag="no-test"; fi
      printf '%s\t%s\t%s\n' "$(component_pct "$c")" "$c" "$tag"
    done
  } | sort -n | awk -F'\t' '
      { out = out (NR > 1 ? ", " : "") $2 "(" $3 ")"; if (NR == 40) { out = out ", ..."; exit } }
      END { print out }'
}

# Count of open (unchecked) recommendation items in the backlog.
open_recs() { local n; n="$(grep -cE '^\- \[ \]' "$RECS_FILE" 2>/dev/null)" || true; echo "${n:-0}"; }

component_source_file() {
  local n="$1"
  for f in "$SRC_DIR/$n/$n.tsx" "$SRC_DIR/$n/index.tsx" "$SRC_DIR/$n/index.ts"; do
    [[ -f "$f" ]] && { echo "$f"; return 0; }
  done
  echo ""
}

completeness_gaps() {
  local n="$1" src test
  [[ -n "$COMPLETENESS_SCRIPT" && -f "$COMPLETENESS_SCRIPT" ]] || return 0
  component_has_test "$n" || return 0
  src="$(component_source_file "$n")"; [[ -n "$src" ]] || return 0
  test="$SRC_DIR/$n/$n.test.tsx"; [[ -f "$test" ]] || test="$SRC_DIR/$n/$n.test.ts"
  [[ -f "$test" ]] || return 0
  node "$COMPLETENESS_SCRIPT" "$n" "$src" "$test" 2>/dev/null || true
}

# Per-iteration report: for each component with a test, its coverage% and the
# untested variants/values/props. Bounds prompt size at $COMPLETENESS_MAX.
completeness_report() {
  local c line n=0 had
  for c in "${ALL_COMPONENTS[@]}"; do
    component_has_test "$c" || continue
    had="$(completeness_gaps "$c")"
    printf '  - %s: %s%% statements%s\n' "$c" "$(component_pct "$c")" \
      "${had:+ — ${had#"$c": }}"
    n=$((n + 1))
    if (( n >= COMPLETENESS_MAX )); then
      printf '  - … (more — run with COMPLETENESS_MAX raised)\n'
      break
    fi
  done
  return 0
}

# ----------------------------------------------------------------------------
# One-time bootstrap: the shared render helper for dates tests. Mirrors
# packages/components/src/test-utils.tsx (wraps trees in the kit's <Provider> so
# Tamagui theming resolves). Written deterministically if absent so every test
# imports the same helper; not counted as a component.
# ----------------------------------------------------------------------------
ensure_test_utils() {
  local f="$SRC_DIR/test-utils.tsx"
  [[ -f "$f" ]] && return 0
  cat > "$f" <<'TSX'
/**
 * Shared test helper for @knitui/dates. Re-exports @testing-library/react and
 * overrides `render` so every component tree is wrapped in the kit's <Provider>
 * (Tamagui theming). Import from here in *.test.tsx instead of from
 * @testing-library/react directly.
 *
 *   import { render, screen, fireEvent } from "../test-utils";
 *
 * Components that need locale/format/timezone context should additionally wrap
 * their tree in <DatesProvider> themselves.
 */
import * as React from "react";

import { type RenderOptions, render as rtlRender } from "@testing-library/react";

import { Provider } from "@knitui/core";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <Provider defaultColorScheme="light">{children}</Provider>;
}

function render(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
export { render };
TSX
  log "Bootstrapped shared render helper → $f"
}

# ----------------------------------------------------------------------------
# Rules file — written ONCE at startup, referenced (not pasted) by every prompt.
# ----------------------------------------------------------------------------
write_rules_file() {
  {
    sed -e "s|__DATES_PKG_NAME__|$DATES_PKG_NAME|g" \
        -e "s|__DATES_PKG_DIR__|$DATES_PKG_DIR|g" \
        -e "s|__COVERAGE_TARGET__|$COVERAGE_TARGET|g" \
        -e "s|__TEST_CMD__|$TEST_CMD|g" \
        -e "s|__TYPECHECK_CMD__|$TYPECHECK_CMD|g" <<'PREAMBLE'
# Dates test-coverage rules (read fully before touching any file)

You are adding THOROUGH Jest + React Testing Library TESTS to an existing
cross-platform date/time kit, __DATES_PKG_NAME__ (dir __DATES_PKG_DIR__), whose
components are built on Tamagui via @knitui/components + @knitui/core + dayjs and
whose PUBLIC API mirrors @mantine/dates (prop names, levels decade↔year↔month↔
day, `type` default/range/multiple, controlled/uncontrolled value, compound
parts, ref forwarding) — colour being the one deliberate divergence (Tamagui
`theme` prop + palette ramp, not a Mantine `color` prop). The components ALREADY
exist; your job is COVERAGE and CORRECTNESS, not growing the set.

THE GOAL IS COVERAGE, NOT PRESENCE:
  A component is "done" only when it has a __DATES_PKG_DIR__/src/<Name>/<Name>.test.tsx
  whose assertions drive the component's source past __COVERAGE_TARGET__% statement
  coverage. A test that merely renders the default and stops is NOT done — the
  loop measures real per-component coverage and will keep returning to thin tests.
  Co-locate the test inside the component's own folder, next to <Name>.tsx.

TOOLCHAIN (already configured — do NOT touch jest.config.js or jest.setup.ts):
  - Test runner: Jest, exercised by the gate as `__TEST_CMD__` (which runs with
    coverage). Tests render the cross-platform Tamagui components on the WEB
    target via react-native-web in jsdom (this resolves the CSS animation driver,
    so NO native/reanimated mocking is needed).
  - Rendering/queries: React Testing Library (@testing-library/react) plus
    @testing-library/jest-dom matchers (toBeInTheDocument, toBeVisible,
    toBeDisabled, toHaveTextContent, …) and @testing-library/user-event for
    realistic interaction. Import the render helper from the shared
    __DATES_PKG_DIR__/src/test-utils.tsx, which already wraps trees in the kit's
    `<Provider>`:
        import { render, screen, fireEvent } from "../test-utils";
    STUDY packages/components/src/Button/Button.test.tsx — it is the canonical
    example for this kit; mirror its style. Do NOT add a new render/provider
    helper; reuse test-utils. Import the component under test from "./<Name>".
  - Components/Box/Text/Provider/Theme/DatesProvider import from
    __DATES_PKG_NAME__ or @knitui/components (or a sibling relative path within the
    package). NEVER import `tamagui` or `@tamagui/*` from a test file. Use `dayjs`
    for any date the test constructs/asserts, matching how the component formats.

WHAT A THOROUGH DATES TEST COVERS (assert real BEHAVIOUR, not snapshots):
  - Renders with defaults and exposes its accessibility role/label (calendar
    grids expose grid/row/cell roles and dated labels; inputs expose their role).
  - VALUE FLOW both ways: controlled (`value` + `onChange`) AND uncontrolled
    (`defaultValue`) — onChange fires with the right dayjs/string argument when a
    day/month/year/time is picked, and the displayed selection updates.
  - `type` modes where supported: "default" (single), "range" (start→end, hover
    preview, in-range cells), "multiple" (toggling several). Assert the selected/
    in-range state on the right cells.
  - LEVEL NAVIGATION where supported: clicking the header label moves
    decade↔year↔month↔day; next/previous controls move the period; `level` /
    `defaultLevel`, `numberOfColumns`, `columnsToScroll` behave.
  - CONSTRAINTS: `minDate`/`maxDate` and `excludeDate` disable the right cells and
    block selection; `disabled`/`readOnly` block interaction.
  - PROVIDER PARITY: wrap in <DatesProvider> and assert `firstDayOfWeek`,
    `weekendDays`, `locale`, and format props change the rendered output.
  - Sizes: the `size` scale renders; accent `theme` renders.
  - `ref` forwarding resolves to the expected node.
  Prefer user-facing queries (role, text, label, testID) over implementation
  details so tests survive refactors. Use `it.each` over level/type/size/value
  lists to exercise the full surface compactly.

COMPLETENESS — reflect the WHOLE component:
  Before considering a component covered, enumerate its full surface FROM ITS OWN
  SOURCE (and the Mantine reference) and make sure the test exercises all of it:
  every public prop has at least one assertion proving its documented effect
  (booleans test BOTH branches where behaviour differs); every value of every
  custom `variants` axis renders; every callback fires with the right args in
  BOTH controlled and uncontrolled flows; every compound sub-component mounts and
  its wiring to the parent is asserted. The loop feeds you a heuristic
  "untested variants/values/props" list AND each component's current coverage% —
  treat both as a STARTING point and also reason from the source. If a prop is
  GENUINELY not observable under jsdom (purely visual, no role/text/state effect),
  leave a one-line `// covered:` or `// n/a:` comment saying why, rather than
  silently skipping it.

THE FIX MANDATE (most important):
  Tests are the SPEC. When a test you write — or honest inspection against the
  @mantine/dates public API — reveals that a component is BROKEN, INCOMPLETE, or
  DIVERGENT (a missing prop/level/type, a compound part that doesn't wire up, a
  handler that never fires, a controlled/uncontrolled bug, a clamping/range bug,
  missing a11y roles/labels, broken ref forwarding), FIX THE COMPONENT SOURCE so
  the correct behaviour holds — do NOT weaken, skip, or delete the test to make it
  pass, and do NOT assert the buggy behaviour as if it were intended. Only adjust
  the test when the test itself is wrong. Record every source fix in the journal
  and (if it needs follow-up) the recommendations backlog. Keep component fixes
  within the existing architecture (@knitui/components + Box/Text + @knitui/core,
  theme-driven colour, dayjs date math, DatesProvider context) and the import
  boundary (no `tamagui` umbrella, no `@tamagui/*`, no `@mantine/*`).

TYPING IS STRICT AND GATED (applies to tests and any source fix):
  Every prop, arg, generic, return value and ref must be precisely typed. You MUST
  NOT use `any`, `as any`, `as unknown as`, `any[]`, `<any>`, or the suppression
  directives @ts-ignore / @ts-nocheck / @ts-expect-error — a post-typecheck
  strictness gate FAILS the iteration if YOUR changes INTRODUCE any of these, even
  when `tsc` passes. (A handful already exist in the tree and are baselined; leave
  them.) Narrow locally rather than widening or suppressing.

VALIDATION:
  When finished, run `__TYPECHECK_CMD__` and `__TEST_CMD__` and make both pass,
  fixing the root cause of any failure, before you stop. Stay within the scope of
  the current plan this iteration.

MATCH WHAT EXISTS:
  Study the component's own <Name>.tsx, the matching Mantine reference folder, and
  a couple of the already-tested utils/hooks (src/utils/*, src/hooks/*) and
  components before writing. Keep test style consistent across the kit; reuse
  shared helpers instead of re-deriving them.
PREAMBLE
    echo
    echo "REFERENCES (read before writing a test; do NOT copy verbatim):"
    if [[ -n "${REF_COMPONENTS_DIR:-}" ]]; then
      echo "  - Mantine dates source (the PUBLIC prop API + behaviour each test pins down):"
      echo "      $REF_COMPONENTS_DIR/<Name>"
      echo "      (shared logic to understand: $DATES_REF/src/utils and $DATES_REF/src/hooks)"
    else
      echo "  - No local Mantine dates reference found; assert against your knowledge of"
      echo "    the @mantine/dates public API for each component."
    fi
    [[ -d "$COMPONENTS_REF" ]] && \
      echo "  - Our @knitui/components source (building blocks + canonical test style): $COMPONENTS_REF/<Name>"
    echo "  - Canonical example test to mirror: packages/components/src/Button/Button.test.tsx"
    echo "  - Shared render helper (reuse, do not replace): $DATES_PKG_DIR/src/test-utils.tsx"
  } > "$RULES_FILE"
}

# ----------------------------------------------------------------------------
# Prompt builders (lean: reference the rules file by path, don't paste it).
# ----------------------------------------------------------------------------
reflect_plan_prompt() {  # $1=phase $2=remaining $3=open-recs $4=completeness report
  local phase="$1" remaining="$2" open="$3" report="$4"
  cat <<PROMPT
You are in a loop that gives every component in $DATES_PKG_NAME thorough tests
until most of each component's features are covered (target: ${COVERAGE_TARGET}%
statement coverage per component). Read the rules file FIRST — it is the full
spec and is referenced, not repeated, every iteration:
  - RULES (read fully):                     $RULES_FILE
State is persisted in these files — read them before doing anything:
  - Journal (history of past iterations):   $JOURNAL
  - Recommendations backlog (open ideas):   $RECS_FILE
  - Previous plan:                           $PLAN_FILE

Real state on disk (phase: $phase):
  - Components needing coverage (LOWEST coverage first; "no-test" = none yet):
      $remaining
  - Components that already have a test, with current coverage% and the heuristic
    untested variants/values/props:
$report
  - Open recommendations in the backlog: $open

Do TWO things, and ONLY these two (do NOT write tests in this step):
  1. REFLECT: append a short dated entry to $JOURNAL summarizing the PREVIOUS
     iteration's outcome as you can infer it from disk and the coverage numbers
     above — which tests now exist, which are still thin (low coverage / many
     untested props), and any component bugs the tests exposed.
  2. PLAN: (over)write $PLAN_FILE with a focused, single-iteration plan. In the
     "$phase" phase, weight it toward:
       - coverage phase → write/deepen tests for ~$BATCH_SIZE components from the
                          LOWEST-coverage list above (prefer "no-test" first, then
                          the thinnest), driving each past ${COVERAGE_TARGET}%.
       - improve phase  → the highest-value open recommendations + deepening the
                          components still furthest below target.
     Name the components/files to touch and what "done" looks like for each (the
     specific levels/types/value-flows/props the new test will exercise). Keep it
     to roughly one iteration of work.
PROMPT
}

execute_prompt() {
  cat <<PROMPT
Read the rules file and the plan, then carry the plan out now:
  - RULES (the full spec): $RULES_FILE
  - PLAN (this iteration): $PLAN_FILE

For each component in the plan, write or deepen $DATES_PKG_DIR/src/<Name>/<Name>.test.tsx
so its assertions drive the component past ${COVERAGE_TARGET}% statement coverage,
exercising the WHOLE public surface (value flow controlled+uncontrolled, type
modes, level navigation, min/max/exclude constraints, DatesProvider parity, sizes,
theme, compound parts, ref forwarding) as the rules describe. Reuse the shared
render helper from "../test-utils"; import the component from "./<Name>".

When a test exposes a component that is broken, incomplete, or divergent from the
@mantine/dates public API, FIX THE COMPONENT SOURCE (within the existing
architecture and import boundary) rather than weakening the test — that is the fix
mandate in the rules. Record source fixes in $JOURNAL, and tick off any
$RECS_FILE items you actually implement (\`- [ ]\` → \`- [x]\`).

When finished, run \`$TYPECHECK_CMD\` and \`$TEST_CMD\` and make both pass (fixing
the root cause, never with \`any\`/suppressions) before you stop. Stay within the
scope of $PLAN_FILE this iteration.
PROMPT
}

recommend_prompt() {  # $1 = cycle number
  local cycle="$1"
  cat <<PROMPT
COVERAGE CYCLE $cycle COMPLETE — GENERATE NEW RECOMMENDATIONS.
Most components in $DATES_PKG_NAME are now at or above ${COVERAGE_TARGET}% coverage.
Read the rules file ($RULES_FILE) for context, then step back and review the
ENTIRE test suite under $DATES_PKG_DIR/src against @mantine/dates and against
production-quality cross-platform standards.

Append NEW, deduplicated improvement ideas to $RECS_FILE as a markdown checklist.
First read the file so you do NOT repeat items already listed (checked or not).
Start your additions with a header line:
  "## Cycle $cycle recommendations"
Then one "- [ ] <actionable recommendation>" per line. Cover gaps such as:
  - components still below target or with shallow assertions (rendered but not
    behaviour-verified); untested levels/types/value-flows
  - DatesProvider parity not asserted (firstDayOfWeek, weekendDays, locale, format,
    timezone); keyboard navigation untested; a11y roles/labels on calendar grids
  - controlled/uncontrolled or range/clamping edge cases; component bugs the tests
    revealed but did not yet fix
  - flaky/over-mocked tests, or tests asserting implementation details instead of
    user-facing behaviour
If, after honest review, there is genuinely nothing worth adding, append the single
line "## Cycle $cycle recommendations: none — coverage is solid" and stop.
PROMPT
}

fix_prompt() {  # $1 = validation output
  cat <<PROMPT
Validation is failing after the last change. The gate runs \`$TYPECHECK_CMD\`, the
dates test suite (\`$TEST_CMD\`), AND a diff-scoped type-strictness check. Output
below. Fix the ROOT CAUSE and re-run until it passes.

Per the fix mandate in $RULES_FILE: if a test is failing because the COMPONENT is
wrong (missing/divergent vs the @mantine/dates public API), fix the component
source — do NOT weaken or delete the test to make it pass. Only adjust the test
when the test itself is wrong. You MUST NOT silence type errors with \`any\`,
\`as any\`, \`as unknown as\`, \`any[]\`, \`<any>\`, or @ts-ignore / @ts-nocheck /
@ts-expect-error — the strictness gate rejects NEW occurrences and will keep
failing. The gate is diff-scoped: any strictness failure is from a hatch YOUR
change introduced, so fix the lines it names. Narrow locally instead of widening.

--- validation output ---
$1
--- end output ---
PROMPT
}

run_claude() {  # $1 = prompt, $2 = log file
  local prompt="$1" logfile="$2"
  local args=(-p --dangerously-skip-permissions)
  [[ -n "${REF_COMPONENTS_DIR:-}" ]] && args+=(--add-dir "$DATES_REF")
  [[ -n "$MODEL" ]] && args+=(--model "$MODEL")
  [[ -n "$FALLBACK_MODEL" ]] && args+=(--fallback-model "$FALLBACK_MODEL")
  [[ -n "$MAX_TURNS" ]] && args+=(--max-turns "$MAX_TURNS")

  # `|| warn` keeps a non-zero claude exit from killing the loop (set -e).
  case "$STREAM" in
    pretty)
      args+=(--output-format stream-json --verbose)
      { ( cd "$REPO_DIR" && claude "${args[@]}" "$prompt" ) 2>&1 \
          | tee -a "$logfile.jsonl" \
          | node "$FORMATTER" \
          | tee -a "$logfile"; } || warn "claude exited non-zero (raw: $logfile.jsonl)"
      ;;
    json)
      args+=(--output-format stream-json --verbose)
      { ( cd "$REPO_DIR" && claude "${args[@]}" "$prompt" ) 2>&1 \
          | tee -a "$logfile"; } || warn "claude exited non-zero (see $logfile)"
      ;;
    *)
      { ( cd "$REPO_DIR" && claude "${args[@]}" "$prompt" ) 2>&1 \
          | tee -a "$logfile"; } || warn "claude exited non-zero (see $logfile)"
      ;;
  esac
}

# Emit current loose-typing hits as "<repo-relpath>:<lineno>\t<text>".
strict_hits_raw() {
  [[ -d "$SRC_DIR" ]] || return 0
  grep -rnE "$STRICT_TYPE_PATTERN" --include='*.ts' --include='*.tsx' "$SRC_DIR" 2>/dev/null \
    | grep -vE '\.d\.ts:' \
    | awk -v root="$REPO_DIR/" '
        {
          p = index($0, ":"); path = substr($0, 1, p - 1); rest = substr($0, p + 1);
          q = index(rest, ":"); lineno = substr(rest, 1, q - 1); content = substr(rest, q + 1);
          if (substr(path, 1, length(root)) == root) path = substr(path, length(root) + 1);
          gsub(/[ \t]+/, " ", content); gsub(/^ +| +$/, "", content);
          printf "%s:%s\t%s\n", path, lineno, content;
        }'
}

type_strictness_report() {
  local current new
  current="$(strict_hits_raw)" || true
  [[ -z "$current" ]] && return 0
  if [[ ! -f "$STRICT_BASELINE_FILE" ]]; then
    new="$current"
  else
    new="$(printf '%s\n' "$current" | awk -F'\t' '
      NR == FNR { base[$0]++; next }
      {
        key = $1; sub(/:[0-9]+$/, "", key); key = key FS $2;
        if (base[key] > 0) { base[key]--; next }
        print $0;
      }' "$STRICT_BASELINE_FILE" -)"
  fi
  [[ -z "$new" ]] && return 0
  printf 'TYPE STRICTNESS CHECK FAILED — a NEW loose-typing escape hatch was introduced.\n'
  printf 'Pre-existing hits are tolerated; the lines below are new since the loop started.\n'
  printf 'Replace each with a precise type. Do NOT use any, `as any`, `as unknown as`,\n'
  printf 'any[], <any>, or @ts-ignore/@ts-nocheck/@ts-expect-error. Narrow locally instead.\n\n'
  printf '%s\n' "$new"
  return 1
}

# The gate: typecheck, then the dates test suite (with coverage), then strict.
validate() {  # writes output to stdout, returns non-zero on any failure
  local out rc=0
  out="$( cd "$REPO_DIR" && eval "$TYPECHECK_CMD" 2>&1 )" || rc=$?
  printf '%s\n' "$out"
  (( rc != 0 )) && return "$rc"

  out="$( cd "$REPO_DIR" && eval "$TEST_CMD" 2>&1 )" || rc=$?
  printf '%s\n' "$out"
  (( rc != 0 )) && return "$rc"

  if [[ "$STRICT_TYPES" == "1" ]]; then
    local strict_out
    strict_out="$(type_strictness_report)" || { printf '%s\n' "$strict_out"; return 1; }
  fi
  return 0
}

# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
REF_COMPONENTS_DIR=""
find_components_dir() {
  [[ -d "$DATES_REF" ]] || return 1
  local canonical="$DATES_REF/src/components"
  if [[ -d "$canonical" ]]; then echo "$canonical"; return 0; fi
  local found
  found="$(find "$DATES_REF" -type d -path '*/src/components' 2>/dev/null | head -1)"
  [[ -z "$found" ]] && found="$(find "$DATES_REF" -type d -name components 2>/dev/null | head -1)"
  [[ -n "$found" ]] && { echo "$found"; return 0; }
  return 1
}
if _d="$(find_components_dir)" && [[ -n "$_d" ]] && \
   [[ -n "$(find "$_d" -mindepth 1 -maxdepth 1 -type d -name '[A-Z]*' 2>/dev/null | head -1)" ]]; then
  REF_COMPONENTS_DIR="$_d"
  log "Using Mantine dates reference: $REF_COMPONENTS_DIR"
else
  log "No Mantine dates reference under $DATES_REF — tests assert from Mantine API knowledge."
fi
[[ -d "$COMPONENTS_REF" ]] && log "Building-block + test-style reference: $COMPONENTS_REF"

ALL_COMPONENTS=()
while IFS= read -r _c; do
  [[ -n "$_c" ]] && ALL_COMPONENTS+=("$_c")
done < <(component_list)
[[ ${#ALL_COMPONENTS[@]} -gt 0 ]] || die "Could not determine a component list."

total=${#ALL_COMPONENTS[@]}
log "Target: $total components in $DATES_PKG_NAME at >= ${COVERAGE_TARGET}% statements each."
log "A coverage cycle completes when >= ${TARGET_FRACTION}% of components hit target."
log "Max iterations: $MAX_ITERATIONS | Max cycles: $MAX_CYCLES | Scope/iter: ~$BATCH_SIZE | Turn cap: ${MAX_TURNS:-none}"
log "Journal: $JOURNAL | Plan: $PLAN_FILE | Recommendations: $RECS_FILE | Rules: $RULES_FILE"

if [[ "$DRY_RUN" == "1" ]]; then
  load_coverage
  log "DRY_RUN — components and current coverage:"
  for c in "${ALL_COMPONENTS[@]}"; do
    printf '  %-22s test=%s cov=%s%%\n' "$c" \
      "$(component_has_test "$c" && echo yes || echo no)" "$(component_pct "$c")"
  done
  exit 0
fi

ensure_test_utils
write_rules_file
log "Wrote rules → $RULES_FILE"

# Capture the strict-typing baseline once so pre-existing hits are tolerated.
if [[ "$STRICT_TYPES" == "1" && ! -f "$STRICT_BASELINE_FILE" ]]; then
  strict_hits_raw > "$STRICT_BASELINE_FILE" || true
  log "Captured strict-typing baseline → $STRICT_BASELINE_FILE ($(wc -l < "$STRICT_BASELINE_FILE" | tr -d ' ') hit(s))."
fi

# Baseline coverage run so the first iteration's selection is informed by reality
# (which components already get coverage from existing util/hook tests, if any).
if [[ ! -f "$COVERAGE_SUMMARY" ]]; then
  log "Running a baseline coverage pass (so the first work-list is informed)…"
  ( cd "$REPO_DIR" && eval "$TEST_CMD" ) >/dev/null 2>&1 || \
    warn "Baseline test run reported failures — continuing; the gate will surface them."
fi

validate_with_retries() {  # $1 = label, $2 = log file
  local label="$1" logfile="$2" attempt=0 vout
  while true; do
    if vout="$(validate)"; then
      log "Validation passed ($label)."
      return 0
    fi
    if (( attempt >= RETRY_LIMIT )); then
      warn "Still failing after $RETRY_LIMIT fix attempts ($label); recording and moving on."
      echo "$vout" > "$logfile.validation-fail"
      return 1
    fi
    (( attempt++ ))
    log "Validation failed ($label) — fix attempt $attempt/$RETRY_LIMIT."
    run_claude "$(fix_prompt "$vout")" "$logfile"
  done
}

iteration=0
cycle=1
phase="coverage"   # coverage => still bringing components up to target; improve => backlog
while (( iteration < MAX_ITERATIONS )); do
  load_coverage
  covered_count="$(sync_progress)"
  pct=$(( covered_count * 100 / total ))
  open="$(open_recs)"
  log "Cycle $cycle ($phase): $covered_count/$total components at >=${COVERAGE_TARGET}% (${pct}%), $open open recommendation(s)."

  # ---- Cycle boundary handling --------------------------------------------
  if [[ "$phase" == "coverage" ]] && (( pct >= TARGET_FRACTION )); then
    ts="$(date +%Y%m%d-%H%M%S)"
    reclog="$LOG_DIR/cycle-$(printf '%02d' "$cycle")-recommend-$ts.log"
    log "Coverage cycle $cycle complete (${pct}%). Generating recommendations → $RECS_FILE"
    run_claude "$(recommend_prompt "$cycle")" "$reclog"
    phase="improve"
    continue
  fi

  if [[ "$phase" == "improve" ]] && (( open == 0 )); then
    if (( cycle >= MAX_CYCLES )); then
      log "Reached MAX_CYCLES ($MAX_CYCLES) and backlog is empty — stopping."
      break
    fi
    ts="$(date +%Y%m%d-%H%M%S)"
    cycle=$(( cycle + 1 ))
    reclog="$LOG_DIR/cycle-$(printf '%02d' "$cycle")-recommend-$ts.log"
    log "Improvement backlog empty — opening cycle $cycle, regenerating recommendations."
    run_claude "$(recommend_prompt "$cycle")" "$reclog"
    if (( $(open_recs) == 0 )); then
      log "No new recommendations produced — the suite has converged. 🎉 Stopping."
      break
    fi
    continue
  fi

  # ---- Normal iteration: reflect + plan, then execute ----------------------
  (( iteration++ ))
  ts="$(date +%Y%m%d-%H%M%S)"
  logfile="$LOG_DIR/iter-$(printf '%03d' "$iteration")-$ts.log"
  remaining="$(remaining_list)"
  report="$(completeness_report)"
  log "Iteration $iteration (cycle $cycle/$phase): reflect → plan → execute  (log: $logfile)"

  run_claude "$(reflect_plan_prompt "$phase" "$remaining" "$open" "$report")" "$logfile"
  run_claude "$(execute_prompt)" "$logfile"
  validate_with_retries "iter $iteration" "$logfile" || true
done

load_coverage
covered_count="$(sync_progress)"
log "Loop finished after $iteration iteration(s), $cycle cycle(s)."
log "$covered_count/$total components at >=${COVERAGE_TARGET}% coverage. Progress: $PROGRESS_FILE"
log "Reflection journal: $JOURNAL"
log "Open recommendations remaining: $(open_recs) (see $RECS_FILE)"
