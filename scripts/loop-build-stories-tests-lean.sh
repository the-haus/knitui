#!/usr/bin/env bash
#
# loop-build-stories-tests-lean.sh
# --------------------------------
# Sibling of loop-build-ui-kit-lean.sh. Instead of GROWING the component set, it
# repeatedly invokes Claude Code (headless) to give EVERY component that already
# exists in @knitui/components a Storybook story AND a Jest + React Testing Library
# test that exercises its real functionality — and to FIX the component source
# whenever a test (or honest inspection) shows behaviour that is broken, missing,
# or diverges from the Mantine public API it mirrors.
#
# BOTH toolchains are ALREADY set up in packages/components:
#   - Jest/RTL: jest.config.js, babel.config.js, jest.setup.ts, src/test-utils.tsx,
#     and src/Button/Button.test.tsx as the canonical example. Tests use
#     @testing-library/react and render the cross-platform Tamagui components on the
#     WEB target via react-native-web in jsdom, so no native/reanimated mocking is
#     needed.
#   - Storybook (@storybook/react-vite): .storybook/main.ts + .storybook/preview.tsx,
#     globbing src/**/*.stories.@(ts|tsx). Tamagui renders web natively, so there is
#     NO react-native-web rendering pipeline to wire up (only a couple of stray bare
#     `react-native` imports are aliased to react-native-web in viteFinal).
# The loop writes per-component stories + tests against those existing harnesses. The
# one-time setup session is now only a FALLBACK for a checkout where the toolchain is
# missing; on a normal checkout it is skipped and the loop verifies the toolchain by
# running the gate instead.
#
# It reuses the lean design of loop-build-ui-kit-lean.sh verbatim:
#   1. ONE Claude session per iteration (reflect → plan → execute → validate).
#   2. The big rules block is written ONCE to a rules file and referenced by path
#      rather than pasted inline every prompt (the main per-iteration token save).
#   3. A per-session turn cap (--max-turns) bounds runaway sessions.
#   4. Prompts tell Claude to read ONLY the component/story/test files it needs.
#
# WHAT'S DIFFERENT FROM THE BUILD LOOP
#   - The work-list is the components ALREADY on disk under packages/components/src
#     (not the Mantine target set). A component is "done" here when it has BOTH a
#     <Name>.stories.tsx AND a <Name>.test.tsx.
#   - Both the Jest + RTL test harness AND Storybook already exist (see above). The
#     one-time setup session is a FALLBACK only: if the toolchain is detected as
#     present (jest config + .storybook + the package scripts), the loop skips the
#     Claude setup session entirely and just runs the gate to confirm it works; it
#     bootstraps via Claude only when something is genuinely missing.
#   - The validation gate runs `typecheck`, the test suite, AND a Storybook
#     production build (so EVERY story must compile and its module graph resolve —
#     a broken/throwing-on-import story fails the iteration), plus the diff-scoped
#     strict-typing gate. Tests AND stories are the spec: any failure fails the
#     iteration and Claude must fix the ROOT CAUSE — preferring to fix the component
#     over weakening the test or deleting the story.
#
# Usage
#   scripts/loop-build-stories-tests-lean.sh                  # run with defaults
#   BATCH_SIZE=4 MAX_ITERATIONS=60 scripts/loop-build-stories-tests-lean.sh
#   ONLY="Button,Card,Switch" scripts/loop-build-stories-tests-lean.sh   # subset
#   SKIP_SETUP=1 scripts/loop-build-stories-tests-lean.sh     # toolchain exists already
#   STREAM=text scripts/loop-build-stories-tests-lean.sh      # only final answers
#   DRY_RUN=1 scripts/loop-build-stories-tests-lean.sh        # show the plan, write nothing
#
# Live + persisted output:
#   - Terminal shows readable activity in real time (STREAM=pretty).
#   - .stories-tests-logs/iter-NNN-*.log        readable transcript per iteration
#   - .stories-tests-logs/iter-NNN-*.log.jsonl  full raw stream-json for that iteration
#
# NOTE: This runs Claude with --dangerously-skip-permissions so it can edit
# files, install dev deps, and run builds/tests unattended. Only run it in a
# repo/branch you trust.

set -euo pipefail

# ----------------------------------------------------------------------------
# Configuration (override any of these via environment variables)
# ----------------------------------------------------------------------------
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
# Mantine source (the PUBLIC prop API + behaviour the tests assert against) —
# vendored in-repo under tmp/. Optional; tests fall back to Mantine knowledge.
MANTINE_REF="${MANTINE_REF:-$REPO_DIR/tmp/mantine}"

PROGRESS_FILE="${PROGRESS_FILE:-$REPO_DIR/.stories-tests-progress}"
LOG_DIR="${LOG_DIR:-$REPO_DIR/.stories-tests-logs}"
JOURNAL="${JOURNAL:-$REPO_DIR/.stories-tests-journal.md}"          # running reflection log
PLAN_FILE="${PLAN_FILE:-$REPO_DIR/.stories-tests-plan.md}"         # current iteration plan
RECS_FILE="${RECS_FILE:-$REPO_DIR/.stories-tests-recommendations.md}"  # backlog of ideas
# Architecture/rules written ONCE at startup and referenced by every prompt,
# instead of being pasted inline each time (the big token saver).
RULES_FILE="${RULES_FILE:-$REPO_DIR/.stories-tests-rules.md}"

BATCH_SIZE="${BATCH_SIZE:-4}"          # components to cover per iteration
MAX_ITERATIONS="${MAX_ITERATIONS:-100}"
RETRY_LIMIT="${RETRY_LIMIT:-2}"        # extra fix attempts per failing iteration
TARGET_FRACTION="${TARGET_FRACTION:-100}" # an audit "cycle" completes at this %% covered
MAX_CYCLES="${MAX_CYCLES:-2}"          # coverage cycle + this many audit/improve cycles
# Per-session turn cap. One combined session does a lot (plan, write story+test
# for several components, fix sources, run the suite), so this is generous; lower
# to clamp tokens, raise if work gets cut off mid-iteration. Empty = no cap.
MAX_TURNS="${MAX_TURNS:-100}"

MODEL="${MODEL:-}"                     # e.g. claude-opus-4-8 ; empty = account default
FALLBACK_MODEL="${FALLBACK_MODEL:-}"   # e.g. claude-sonnet-4-6
DRY_RUN="${DRY_RUN:-0}"

# Restrict the work-list to a comma-separated subset (handy for re-running a few).
ONLY="${ONLY:-}"

# ---- Validation gate -------------------------------------------------------
# The gate = typecheck AND the test suite AND a Storybook build AND a diff-scoped
# strict-typing check.
TYPECHECK_CMD="${TYPECHECK_CMD:-pnpm typecheck}"   # turbo: typechecks all packages
# Runs the component package's test suite ONCE (non-watch) via the package's "test"
# script; adjust if you place tests elsewhere.
TEST_CMD="${TEST_CMD:-pnpm --filter @knitui/components test}"
# Builds Storybook so EVERY story is actually compiled and its imports resolved —
# this is what makes story coverage "complete": a story that fails to compile,
# imports something that doesn't exist, or throws at module load FAILS the gate and
# Claude must fix it (the component/story), same as a failing test. It's a vite
# production build, so it catches compile/type/module-resolution errors (not in-
# browser render throws). Set BUILD_STORYBOOK=0 to skip (e.g. for a fast tests-only
# pass). The package's "build-storybook" script must exist.
BUILD_STORYBOOK="${BUILD_STORYBOOK:-1}"
STORYBOOK_CMD="${STORYBOOK_CMD:-pnpm --filter @knitui/components build-storybook}"

# Type-strictness gate (identical contract to the build loop): tsc passes `any`
# / `as any` / suppression comments happily, so on TOP of typecheck we reject
# those escape hatches. DIFF-SCOPED: pre-existing hits are baselined at startup
# and tolerated; the gate fails only when an iteration INTRODUCES a new one.
# Set STRICT_TYPES=0 to disable.
STRICT_TYPES="${STRICT_TYPES:-1}"
STRICT_TYPE_PATTERN="${STRICT_TYPE_PATTERN:-(\bas any\b|\bas unknown as\b|:[[:space:]]*any\b|\bany\[\]|<[[:space:]]*any[[:space:]]*[,>]|,[[:space:]]*any[[:space:]]*>|@ts-ignore|@ts-nocheck|@ts-expect-error)}"
STRICT_BASELINE_FILE="${STRICT_BASELINE_FILE:-$LOG_DIR/.strict-baseline}"

# How Claude's activity is shown live: "pretty" (streamed + human-readable),
# "json" (raw stream-json), or "text" (final answer only, no live activity).
STREAM="${STREAM:-pretty}"

# Test-completeness hints: each iteration, statically extract every component's
# custom `variants` (names + values) and its `…Props` members and flag the ones
# the matching <Name>.test.tsx never references, then feed that list to the
# prompt so the loop deepens thin tests instead of just adding shallow ones. This
# is a best-effort HINT (it can't see props tested indirectly and misses
# dynamic/functional variants), so it never fails the gate — it only guides the
# model. Needs `node` (already used for STREAM=pretty); auto-skips if absent. 0=off.
COMPLETENESS_HINTS="${COMPLETENESS_HINTS:-1}"
# Max components to include in the per-iteration completeness report (bounds prompt size).
COMPLETENESS_MAX="${COMPLETENESS_MAX:-25}"

# Components package (what we cover) and the one-time toolchain bootstrap.
COMPONENTS_PKG_NAME="${COMPONENTS_PKG_NAME:-@knitui/components}"
COMPONENTS_PKG_DIR="${COMPONENTS_PKG_DIR:-packages/components}"
# Skip the toolchain bootstrap (set when Storybook is already configured; the
# Jest test harness is already set up regardless).
SKIP_SETUP="${SKIP_SETUP:-0}"
SETUP_MARKER="${SETUP_MARKER:-$LOG_DIR/.setup-done}"

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
log()  { printf '\033[1;36m[stories]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[stories]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[stories]\033[0m %s\n' "$*" >&2; exit 1; }

command -v claude >/dev/null 2>&1 || die "claude CLI not found on PATH."

mkdir -p "$LOG_DIR"
touch "$PROGRESS_FILE" "$JOURNAL" "$RECS_FILE"

# Pretty streaming needs node; gracefully degrade if it's missing.
FORMATTER="$LOG_DIR/.stream-format.mjs"
if [[ "$STREAM" == "pretty" ]] && ! command -v node >/dev/null 2>&1; then
  warn "node not found — falling back to STREAM=text (final answers only)."
  STREAM="text"
fi

# Write the live formatter: turns Claude's stream-json into readable lines so
# you can watch every message, tool call, file edit and command as it happens.
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

# Test-completeness extractor (needs node). Given a component source file and its
# test file as argv, it statically pulls the component's testable surface — the
# names AND values of every key in the styled() `variants: { … }` block(s), plus
# the member names of its `…Props` type/interface — and prints, on ONE line, the
# variants/values/props the test file never references. Best-effort and noisy by
# design; the model treats it as a hint, not gospel. Empty output => no gaps found.
COMPLETENESS_SCRIPT="$LOG_DIR/.completeness.cjs"
if [[ "$COMPLETENESS_HINTS" == "1" ]] && command -v node >/dev/null 2>&1; then
  cat > "$COMPLETENESS_SCRIPT" <<'JS'
const fs = require('fs');
const [name, srcPath, testPath] = process.argv.slice(2);
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const src = read(srcPath), test = read(testPath);
if (!src || !test) process.exit(0);
// Strip comments/strings so braces and keys inside them don't confuse the scan.
const code = src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/[^\n]*/g, ' ')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""');

// Walk the object literal that starts at `open` (index of its '{'); call cb(key, depth)
// for every `key:` found, with depth relative to that literal (0 = its own members).
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
// variants: { <name>: { <value>: … } } — may appear more than once (e.g. nested styled()).
let from = 0, vm;
const variantsRe = /\bvariants\s*[:=]\s*\{/g;
while ((vm = variantsRe.exec(code))) {
  const open = vm.index + vm[0].length - 1;
  const end = scanObject(code, open, (key, d) => {
    if (d === 0) variantNames.add(key);          // a variant axis: variant, size, disabled…
    else if (d === 1) variantValues.add(key);     // a value of that axis: filled, xs, true…
  });
  variantsRe.lastIndex = Math.max(end, variantsRe.lastIndex);
}
// `…Props` type/interface members (the hand-written public API beyond Box props).
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
  [[ "$COMPLETENESS_HINTS" == "1" ]] && warn "node not found — test-completeness hints disabled (prompt still enforces completeness)."
fi

# The work-list is the components ALREADY on disk (folders under src/ that start
# with an uppercase letter), minus the `internal` helper dir. Optionally filtered
# by $ONLY. Printed one per line, sorted.
SRC_DIR="$REPO_DIR/$COMPONENTS_PKG_DIR/src"
component_list() {
  [[ -d "$SRC_DIR" ]] || die "Components dir not found: $SRC_DIR"
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

# A component counts as "covered" when it has BOTH a story and a test file.
component_has_story() {
  [[ -f "$SRC_DIR/$1/$1.stories.tsx" || -f "$SRC_DIR/$1/$1.stories.ts" ]]
}
component_has_test() {
  [[ -f "$SRC_DIR/$1/$1.test.tsx" || -f "$SRC_DIR/$1/$1.test.ts" ]]
}
component_covered() { component_has_story "$1" && component_has_test "$1"; }

# Reconcile the progress file with what actually exists on disk, echo the count.
sync_progress() {
  local covered=0 c
  for c in "${ALL_COMPONENTS[@]}"; do
    if component_covered "$c"; then mark_done "$c"; covered=$((covered + 1)); fi
  done
  echo "$covered"
}

# Comma-joined list of components NOT yet covered (capped) for the planner, each
# tagged with what it's still missing.
remaining_list() {
  local out="" c n=0 missing
  for c in "${ALL_COMPONENTS[@]}"; do
    component_covered "$c" && continue
    missing=""
    component_has_story "$c" || missing+="story"
    component_has_test  "$c" || missing+="${missing:+/}test"
    out+="${out:+, }$c($missing)"; n=$((n + 1))
    (( n >= 40 )) && { out+=", ..."; break; }
  done
  echo "$out"
}

# Count of open (unchecked) recommendation items in the backlog.
open_recs() { local n; n="$(grep -cE '^\- \[ \]' "$RECS_FILE" 2>/dev/null)" || true; echo "${n:-0}"; }

# Resolve a component's implementation file (where its variants/Props live).
component_source_file() {
  local n="$1"
  for f in "$SRC_DIR/$n/$n.tsx" "$SRC_DIR/$n/index.tsx" "$SRC_DIR/$n/index.ts"; do
    [[ -f "$f" ]] && { echo "$f"; return 0; }
  done
  echo ""
}

# One compact "untested variants/values/props" line for a component (empty if the
# extractor is off/unavailable, the source/test is missing, or no gaps are found).
completeness_gaps() {
  local n="$1" src test
  [[ -n "$COMPLETENESS_SCRIPT" && -f "$COMPLETENESS_SCRIPT" ]] || return 0
  component_has_test "$n" || return 0
  src="$(component_source_file "$n")"; [[ -n "$src" ]] || return 0
  test="$SRC_DIR/$n/$n.test.tsx"; [[ -f "$test" ]] || test="$SRC_DIR/$n/$n.test.ts"
  [[ -f "$test" ]] || return 0
  node "$COMPLETENESS_SCRIPT" "$n" "$src" "$test" 2>/dev/null || true
}

# Aggregate completeness gaps across the components that already HAVE a test
# (capped at $COMPLETENESS_MAX to bound prompt size). Printed for the prompt + logs.
completeness_report() {
  [[ -n "$COMPLETENESS_SCRIPT" && -f "$COMPLETENESS_SCRIPT" ]] || return 0
  local c line n=0
  for c in "${ALL_COMPONENTS[@]}"; do
    component_has_test "$c" || continue
    line="$(completeness_gaps "$c")"
    [[ -n "$line" ]] || continue
    printf '  - %s\n' "$line"
    n=$((n + 1))
    if (( n >= COMPLETENESS_MAX )); then
      printf '  - … (more — run with COMPLETENESS_MAX raised)\n'
      break
    fi
  done
  return 0
}

# ----------------------------------------------------------------------------
# Rules file — written ONCE at startup, referenced (not pasted) by every prompt.
# ----------------------------------------------------------------------------
write_rules_file() {
  {
    sed -e "s|__COMPONENTS_PKG_NAME__|$COMPONENTS_PKG_NAME|g" \
        -e "s|__COMPONENTS_PKG_DIR__|$COMPONENTS_PKG_DIR|g" \
        -e "s|__TEST_CMD__|$TEST_CMD|g" <<'PREAMBLE'
# Stories + tests build rules (read fully before touching any file)

You are adding STORYBOOK STORIES and FUNCTIONAL TESTS to an existing
cross-platform UI kit (`@knitui/*`) whose components are built on Tamagui and whose
PUBLIC API mirrors Mantine (prop names, variants, sizes, compound parts) — colour
being the one deliberate divergence (Tamagui `theme` prop + palette ramp, not a
Mantine `color` prop). The components already exist; your job is COVERAGE and
CORRECTNESS, not growing the set.

GOAL PER COMPONENT:
  - __COMPONENTS_PKG_DIR__/src/<Name>/<Name>.stories.tsx  — Storybook CSF3 story
  - __COMPONENTS_PKG_DIR__/src/<Name>/<Name>.test.tsx     — Jest + RTL test
  Co-locate both inside the component's own folder, next to <Name>.tsx.

TOOLCHAIN (already configured — do NOT touch jest.config.js, babel.config.js or
jest.setup.ts):
  - Test runner: Jest, run with `__TEST_CMD__`. Tests render the cross-platform
    Tamagui components on the WEB target via react-native-web in jsdom (this
    resolves the CSS animation driver, so NO native/reanimated mocking is needed).
  - Rendering/queries: React Testing Library (@testing-library/react) plus
    @testing-library/jest-dom matchers (toBeInTheDocument, toBeVisible,
    toBeDisabled, toHaveTextContent, …). Import the render helper from the shared
    __COMPONENTS_PKG_DIR__/src/test-utils.tsx, which already wraps trees in the
    kit's `<Provider>`:
        import { render, screen, fireEvent } from "../test-utils";
    STUDY __COMPONENTS_PKG_DIR__/src/Button/Button.test.tsx — it is the canonical
    example; mirror its style. Do NOT add a new render/provider helper; reuse
    test-utils. Import the component under test from "./<Name>".
  - Stories: Storybook on the @storybook/react-vite framework (Tamagui renders web
    natively — there is NO react-native-web rendering pipeline; the .storybook
    config only sets TAMAGUI_TARGET=web and aliases a few stray bare `react-native`
    imports). The config globs __COMPONENTS_PKG_DIR__/src/**/*.stories.@(ts|tsx), so
    new story files are picked up automatically. The validation gate runs
    `build-storybook`, so EVERY story you write must compile and resolve its imports
    — a story that fails to build fails the iteration.
  - Components/Box/Text/Provider/Theme import from __COMPONENTS_PKG_NAME__ (or a
    sibling relative path within the package). NEVER import `tamagui` or
    `@tamagui/*` from a story/test file.

STORIES (CSF3):
  - `export default { title: 'Components/<Name>', component: <Name> }` as
    `Meta<typeof <Name>>`; named exports are `StoryObj<typeof <Name>>`.
  - Cover the meaningful surface: a Default, one story per `variant`, the `size`
    scale, key boolean states (disabled, loading, hover/press where relevant),
    each compound sub-component (Card.Section, Menu.Item, Accordion.Item, …), and
    at least one accent `theme` example. Use `args`/`argTypes` for the props a
    reviewer would toggle. Stories must render without throwing.

TESTS (assert real BEHAVIOUR, not snapshots-only):
  - Renders with defaults and exposes its accessibility role/label.
  - Each public variant/size renders and applies the expected distinction
    (assert on role/text/state/accessibility, not internal class names).
  - Interaction works: controlled AND uncontrolled value flow, onChange/onClick/
    onPress fire with the right args, disabled blocks interaction, keyboard a11y
    where Mantine specifies it.
  - Compound parts render and wire to the parent (context, value, selection).
  - `ref` forwarding resolves to the expected node.
  Prefer user-facing queries (role, text, label, testID) over implementation
  details so tests survive refactors.

COMPLETENESS — the test must reflect the WHOLE component, not a happy path:
  A passing test that only renders the default is NOT done. Before you consider a
  component covered, enumerate its full surface FROM ITS OWN SOURCE (and the
  Mantine reference) and make sure the test exercises all of it:
    - EVERY public prop in the component's `…Props` type / accepted API has at
      least one assertion proving it has the documented effect (not merely that
      passing it doesn't crash). Booleans test BOTH true and false where the
      behaviour differs (e.g. disabled, loading, readOnly, withBorder).
    - EVERY value of EVERY custom `variants` key — each `variant`, each `size`,
      and any other variant axis declared in the `styled(…, { variants: { … } })`
      block — is rendered and asserted (an it.each over the value list is ideal),
      including boolean variants' true/false branches.
    - EVERY callback fires with the right argument(s), in BOTH controlled and
      uncontrolled flows where the component supports value state.
    - EVERY compound sub-component is mounted and its wiring to the parent asserted.
  The loop feeds you a heuristic "test-completeness gaps" list (variant
  names/values and props the current test never references) — treat it as a
  STARTING point, not the full picture: it cannot see props exercised indirectly,
  and it misses dynamic/functional variants, so also reason from the source. If a
  prop or variant is GENUINELY not worth a direct assertion (purely visual with no
  observable/role/text/state effect under jsdom), leave a one-line `// covered:`
  or `// n/a:` comment in the test saying why, so the gap is intentional and
  visible — do not silently skip it.

THE FIX MANDATE (most important):
  Tests are the SPEC. When a test you write — or honest inspection against the
  Mantine public API — reveals that a component is BROKEN, INCOMPLETE, or
  DIVERGENT (a missing prop/variant/size, a compound part that doesn't wire up, a
  handler that never fires, a controlled/uncontrolled bug, missing a11y
  roles/labels, broken ref forwarding), FIX THE COMPONENT SOURCE so the correct
  behaviour holds — do NOT weaken, skip, or delete the test to make it pass, and
  do NOT assert the buggy behaviour as if it were intended. Only adjust the test
  when the test itself is wrong. Record every source fix in the journal and (if
  it needs follow-up) in the recommendations backlog. Keep component fixes within
  the existing architecture: Box/Text + @knitui/core, theme-driven colour,
  hover/press/focusVisible states, a `disabled` variant.

TYPING IS STRICT AND GATED (applies to stories + tests + any source fix):
  Every prop, arg, generic, return value and ref must be precisely typed. You
  MUST NOT use `any`, `as any`, `as unknown as`, `any[]`, `<any>`, or the
  suppression directives @ts-ignore / @ts-nocheck / @ts-expect-error — a
  post-typecheck strictness gate FAILS the iteration if YOUR changes INTRODUCE
  any of these, even when `tsc` itself passes. (A handful already exist in the
  tree and are baselined; leave them.) When a runtime value fights Tamagui's
  strict style typing, narrow it locally rather than widening or suppressing.

MATCH WHAT EXISTS:
  Study the component's own <Name>.tsx and the patterns in a couple of
  already-covered components before writing. Keep story/test style consistent
  across the kit; reuse shared helpers instead of re-deriving them.
PREAMBLE
    echo
    echo "REFERENCES:"
    if [[ -n "${REF_COMPONENTS_DIR:-}" ]]; then
      echo "  - Mantine source (the PUBLIC prop API + behaviour the tests assert against):"
      echo "      $REF_COMPONENTS_DIR/<Name>"
      echo "    Read the matching Mantine folder to learn the prop surface / expected"
      echo "    behaviour, then assert OUR component against it (colour excepted)."
      echo "    Read ONLY the folders for the components you touch this iteration."
    else
      echo "  No local Mantine reference is available; assert each component against"
      echo "  your knowledge of Mantine's public API (prop names, variants, sizes,"
      echo "  compound parts, controlled/uncontrolled flow, a11y), colour excepted."
    fi
  } > "$RULES_FILE"
}

# ----------------------------------------------------------------------------
# Prompt builders (short — they POINT at $RULES_FILE instead of inlining it).
# ----------------------------------------------------------------------------

# ONE-TIME toolchain bootstrap: Jest + RNTL + Storybook, run before iterations.
setup_prompt() {
  cat <<PROMPT
ONE-TIME TOOLCHAIN SETUP (FALLBACK) — stories + tests for $COMPONENTS_PKG_NAME

This runs only when the toolchain was NOT detected on disk. On a normal checkout
both Jest and Storybook already exist and this session is skipped. Set up whatever
is missing so the per-component loop can write and RUN stories and tests. Do ONLY
setup here; do not write component stories/tests yet (a Default smoke story/test for
ONE component as a wiring check is fine).

Install + configure, using this repo's package manager (pnpm) and matching its
existing config style. Match the patterns already in $COMPONENTS_PKG_DIR exactly if
any of these already exist:
  1. Jest as the test runner for $COMPONENTS_PKG_DIR, using @testing-library/react
     (NOT react-native) with @testing-library/jest-dom matchers wired into a setup
     file. Use a jsdom env and map \`react-native\` -> \`react-native-web\` so the
     Tamagui components render on the WEB target under test. Provide a shared
     \`render\` helper (src/test-utils.tsx) that wraps trees in the kit's <Provider>.
     Add a "test" script to $COMPONENTS_PKG_DIR/package.json that runs the suite
     ONCE (non-watch) such that \`$TEST_CMD\` works from the repo root, and a
     matching turbo "test" task.
  2. Storybook (CSF3) with the @storybook/react-vite framework, configured to load
     $COMPONENTS_PKG_DIR/src/**/*.stories.@(ts|tsx). Tamagui renders web natively,
     so there is NO react-native-web rendering pipeline to build — only set
     \`process.env.TAMAGUI_TARGET\` to "web" and alias the few stray bare
     \`react-native\` named imports to \`react-native-web\` in viteFinal. Wire
     "storybook" and "build-storybook" scripts so \`$STORYBOOK_CMD\` works.
  3. A Storybook preview decorator that wraps every story in the kit's <Provider>
     (mirroring the test-utils <Provider> wrapper) so stories get Tamagui theming.

Then prove it works: \`$TYPECHECK_CMD\` passes, \`$TEST_CMD\` runs green (one trivial
smoke test is enough), and \`$STORYBOOK_CMD\` builds. Keep typing strict — no \`any\`
/ suppression directives. Summarise what you installed and the exact commands to run
stories and tests.
PROMPT
}

# The whole iteration in ONE session: reflect → plan → execute → validate.
iterate_prompt() {  # $1=phase  $2=remaining list  $3=open-rec count  $4=completeness gaps
  local phase="$1" remaining="$2" open="$3" completeness="${4:-}"
  cat <<PROMPT
STORIES+TESTS ITERATION — phase: $phase

FIRST read $RULES_FILE and follow it exactly (story format, test expectations,
the FIX MANDATE, strict typing, toolchain). It replaces a long inline brief; do
not ask for the rules again.

This is one iteration of a long-running loop. Persisted state:
  - Journal (past iterations):        $JOURNAL
  - Recommendations backlog:          $RECS_FILE
  - Previous plan:                     $PLAN_FILE
On disk: components are folders under $COMPONENTS_PKG_DIR/src/<Name>/. A component
is "covered" when it has BOTH <Name>.stories.tsx AND <Name>.test.tsx.
  - Not yet covered (with what's missing): $remaining
  - Open recommendations in the backlog: $open
  - Test-completeness gaps (heuristic — variant values/axes and props the current
    <Name>.test.tsx never references; a STARTING point, not the whole picture):
$completeness

Do ALL of the following in THIS one session, in order. Keep reads focused — only
open the component/reference/story/test files you actually need; do NOT re-read
the whole tree.

  1. REFLECT — append a SHORT dated entry (a few lines) to $JOURNAL: coverage so
     far, and any component fixes the last iteration's tests forced.
  2. PLAN — overwrite $PLAN_FILE with a concrete single-iteration plan:
       - coverage phase → pick ~$BATCH_SIZE not-yet-covered components and, for
                          each, the story + test you'll write and the behaviours
                          you'll assert.
       - audit phase    → the highest-value open recommendations AND the
                          test-completeness gaps above: deepen thin tests so they
                          assert EVERY custom variant value, variant axis, and
                          public prop the component declares (see COMPLETENESS in
                          the rules), fill story gaps, and fix component bugs the
                          tests surface. Name the exact files to touch + "done"
                          looks like.
  3. EXECUTE the plan. For each component: write/repair <Name>.stories.tsx (CSF3,
     covers variants/sizes/states/compound parts/a accent theme) and
     <Name>.test.tsx that reflects the component's FULL surface — read its source,
     enumerate every value of every `variants` key plus every public prop, and
     assert each has its documented effect (the gaps list above is a starting
     point; also catch what it misses, and mark any deliberately-untested prop
     with a one-line `// covered:`/`// n/a:` note per the rules). APPLY THE FIX
     MANDATE: when a test or inspection shows the component is broken, incomplete,
     or diverges from Mantine, fix the COMPONENT SOURCE — never weaken the test.
     If you address items in $RECS_FILE, tick them (\`- [ ]\` → \`- [x]\`).
  4. VALIDATE — run \`$TYPECHECK_CMD\`, then \`$TEST_CMD\`, then \`$STORYBOOK_CMD\`
     (the Storybook build — every story you wrote MUST compile and resolve), and
     make ALL pass before stopping. Fix the root cause of any failure (prefer fixing
     the component over the test, per the mandate; fix a broken story rather than
     deleting it); do not silence errors with \`any\` or suppression directives.

Stay within the scope of $PLAN_FILE this iteration.
PROMPT
}

# Run at the END of a full cycle: audit the whole kit and grow the backlog.
recommend_prompt() {  # $1 = cycle number  $2 = completeness gaps
  local cycle="$1" completeness="${2:-}"
  cat <<PROMPT
CYCLE $cycle COMPLETE — GENERATE NEW RECOMMENDATIONS

Rules: $RULES_FILE (read it if you haven't this session). Audit the ENTIRE kit's
test + story COVERAGE and CORRECTNESS in $COMPONENTS_PKG_DIR/src against Mantine's
public API and production cross-platform standards. A component with a passing
test is NOT necessarily complete — judge whether each test exercises the FULL
surface (every custom variant value, every variant axis, every public prop,
controlled+uncontrolled flow, compound parts) per the COMPLETENESS rules.

Heuristic test-completeness gaps to seed (and verify) your audit — variant
values/axes and props the current tests never reference:
$completeness

Read $RECS_FILE FIRST so you do not repeat items already listed (checked or
unchecked). Then append NEW, deduplicated ideas under a header line:
  "## Cycle $cycle recommendations"
one "- [ ] <actionable recommendation>" per line. Cover: components with thin or
missing tests; INCOMPLETE prop/variant coverage (a public prop or a custom
variant value that exists in the source but is never asserted by the test);
untested variants/sizes/states/compound parts; missing story coverage; behaviours
that DIVERGE from Mantine and need a SOURCE FIX (call these
out explicitly as "fix <Component>: <bug>"); a11y gaps (roles/labels/keyboard);
controlled/uncontrolled bugs; ref-forwarding gaps; flaky or implementation-
coupled tests worth hardening.

If, after honest review, there is genuinely nothing worth adding, append the
single line "## Cycle $cycle recommendations: none — coverage is solid" and stop.
PROMPT
}

fix_prompt() {  # $1 = validation output
  cat <<PROMPT
Validation is failing after the last change. The gate runs \`$TYPECHECK_CMD\`, then
\`$TEST_CMD\`, then \`$STORYBOOK_CMD\` (a Storybook production build), then a
type-strictness check. Below is the output. Fix the errors, then re-run until the
gate passes.

Fix the ROOT CAUSE. Tests AND stories are the spec:
  - When a TEST fails because the COMPONENT is broken, incomplete, or diverges from
    its Mantine public API, FIX THE COMPONENT SOURCE — do NOT weaken, skip, or
    delete the test, and do NOT rewrite it to assert the buggy behaviour. Only
    change the test when the test itself is wrong.
  - When the STORYBOOK BUILD fails, a story (or the component it imports) does not
    compile or resolve — fix the story or the component so it builds; do NOT delete
    the story to make the build pass. A story that cannot build is not coverage.

You MUST NOT silence errors with \`any\`, \`as any\`, \`as unknown as\`, \`any[]\`,
\`<any>\`, or @ts-ignore / @ts-nocheck / @ts-expect-error — the strictness gate
rejects NEW occurrences of those and will keep failing. The gate is diff-scoped:
any strictness failure above is from a hatch YOUR change introduced (pre-existing
ones are baselined and ignored), so fix the lines it names. If a runtime value
fights Tamagui's strict style typing, narrow it locally rather than suppressing.

--- validation output ---
$1
--- end output ---
PROMPT
}

run_claude() {  # $1 = prompt, $2 = log file
  local prompt="$1" logfile="$2"
  local args=(-p --dangerously-skip-permissions)
  [[ -n "${REF_COMPONENTS_DIR:-}" ]] && args+=(--add-dir "$MANTINE_REF")
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
    *)  # text: only the final answer, streamed at end of each turn
      { ( cd "$REPO_DIR" && claude "${args[@]}" "$prompt" ) 2>&1 \
          | tee -a "$logfile"; } || warn "claude exited non-zero (see $logfile)"
      ;;
  esac
}

# Emit current loose-typing hits as TSV lines: "<repo-relpath>:<lineno>\t<text>".
# Scans component sources AND the new story/test files.
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

# Diff-scoped strictness check: fail only on hits NOT in the startup baseline.
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

validate() {  # writes output to stdout, returns non-zero on any failure
  local out rc=0
  # 1) typecheck
  out="$( cd "$REPO_DIR" && eval "$TYPECHECK_CMD" 2>&1 )" || rc=$?
  printf '=== %s ===\n%s\n' "$TYPECHECK_CMD" "$out"
  (( rc != 0 )) && return "$rc"
  # 2) test suite
  out="$( cd "$REPO_DIR" && eval "$TEST_CMD" 2>&1 )" || rc=$?
  printf '=== %s ===\n%s\n' "$TEST_CMD" "$out"
  (( rc != 0 )) && return "$rc"
  # 3) Storybook build — every story must compile and resolve its imports.
  if [[ "$BUILD_STORYBOOK" == "1" ]]; then
    out="$( cd "$REPO_DIR" && eval "$STORYBOOK_CMD" 2>&1 )" || rc=$?
    printf '=== %s ===\n%s\n' "$STORYBOOK_CMD" "$out"
    (( rc != 0 )) && return "$rc"
  fi
  # 4) strict-typing gate on top
  if [[ "$STRICT_TYPES" == "1" ]]; then
    local strict_out
    strict_out="$(type_strictness_report)" || { printf '%s\n' "$strict_out"; return 1; }
  fi
  return 0
}

# ----------------------------------------------------------------------------
# Main loop
# ----------------------------------------------------------------------------
# Resolve the Mantine reference dir once (empty => assert from Mantine knowledge).
REF_COMPONENTS_DIR=""
if [[ -d "$MANTINE_REF" ]]; then
  _d="$MANTINE_REF/packages/@mantine/core/src/components"
  [[ -d "$_d" ]] || _d="$(find "$MANTINE_REF" -type d -path '*/core/src/components' 2>/dev/null | head -1)"
  if [[ -n "$_d" && -d "$_d" ]]; then
    REF_COMPONENTS_DIR="$_d"
    log "Using Mantine reference: $REF_COMPONENTS_DIR"
  fi
fi
[[ -z "$REF_COMPONENTS_DIR" ]] && log "No Mantine reference under $MANTINE_REF — asserting from Mantine knowledge."

# Write the rules file once, now that REF_COMPONENTS_DIR is known.
write_rules_file
log "Rules written to $RULES_FILE (referenced by every prompt, not inlined)."

ALL_COMPONENTS=()
while IFS= read -r _c; do
  [[ -n "$_c" ]] && ALL_COMPONENTS+=("$_c")
done < <(component_list)
[[ ${#ALL_COMPONENTS[@]} -gt 0 ]] || die "Could not determine a component list."

total=${#ALL_COMPONENTS[@]}
log "Target: story + test for $total component(s). A coverage cycle completes at >= ${TARGET_FRACTION}%."
log "Max iterations: $MAX_ITERATIONS | Max cycles: $MAX_CYCLES | Scope/iter: ~$BATCH_SIZE | Turn cap: ${MAX_TURNS:-none}"
log "Journal: $JOURNAL | Plan: $PLAN_FILE | Recommendations: $RECS_FILE"

if [[ "$DRY_RUN" == "1" ]]; then
  log "DRY_RUN — components to cover:"
  printf '  %s\n' "${ALL_COMPONENTS[@]}"
  log "Already covered: $(sync_progress)/$total"
  cr="$(completeness_report)"
  if [[ -n "$cr" ]]; then
    log "Test-completeness gaps (heuristic — untested variant values/axes and props):"
    printf '%s\n' "$cr"
  elif [[ -n "$COMPLETENESS_SCRIPT" ]]; then
    log "Test-completeness: no gaps flagged by the heuristic on components that have tests."
  fi
  log "Rules file preview:"
  sed 's/^/  /' "$RULES_FILE"
  exit 0
fi

# Is the Jest + Storybook toolchain already configured on disk? (Both harnesses
# exist on a normal checkout; only a fresh/partial checkout needs the bootstrap.)
toolchain_present() {
  local d="$REPO_DIR/$COMPONENTS_PKG_DIR"
  [[ -f "$d/jest.config.js" || -f "$d/jest.config.ts" || -f "$d/jest.config.cjs" ]] || return 1
  [[ -f "$d/.storybook/main.ts" || -f "$d/.storybook/main.js" ]] || return 1
  [[ -f "$d/package.json" ]] || return 1
  grep -q '"test"' "$d/package.json" && grep -q '"build-storybook"' "$d/package.json"
}

# ---- One-time toolchain check / bootstrap (Jest + Storybook) ---------------
# On a normal checkout both harnesses already exist, so we DON'T run a Claude setup
# session — we just confirm the gate runs and record the marker. Claude bootstrap is
# a fallback for a checkout where the toolchain is genuinely missing.
if [[ "$SKIP_SETUP" == "1" || -f "$SETUP_MARKER" ]]; then
  log "Skipping toolchain bootstrap (SKIP_SETUP=$SKIP_SETUP, marker present: $([[ -f "$SETUP_MARKER" ]] && echo yes || echo no))."
elif toolchain_present; then
  log "Toolchain detected (Jest + Storybook already configured) — no setup session needed."
  if vout="$(validate)"; then
    log "Toolchain verified by the gate (typecheck + tests + Storybook build)."
  else
    ts="$(date +%Y%m%d-%H%M%S)"
    echo "$vout" > "$LOG_DIR/setup-verify-$ts.validation-fail"
    warn "Toolchain present but the gate did not pass cleanly yet (see"
    warn "$LOG_DIR/setup-verify-$ts.validation-fail). Proceeding — the iteration/fix"
    warn "loop will repair the failing tests/stories below."
  fi
  touch "$SETUP_MARKER"
else
  ts="$(date +%Y%m%d-%H%M%S)"
  setuplog="$LOG_DIR/setup-$ts.log"
  warn "Toolchain NOT fully detected — bootstrapping (one-time) → $setuplog"
  run_claude "$(setup_prompt)" "$setuplog"
  # A working runner IS required before bootstrapping component coverage.
  if vout="$(validate)"; then
    touch "$SETUP_MARKER"
    log "Toolchain setup validated. Marker: $SETUP_MARKER"
  else
    echo "$vout" > "$setuplog.validation-fail"
    warn "Toolchain setup did NOT validate cleanly (see $setuplog.validation-fail)."
    warn "Re-run after fixing, or set SKIP_SETUP=1 if you've wired it manually."
    die "Stopping before component iterations — a working test runner is required."
  fi
fi

# Capture the strict-typing baseline once (AFTER setup, so any hatch the toolchain
# legitimately needs is baselined), so the gate only fails on NEW hits.
if [[ "$STRICT_TYPES" == "1" && ! -f "$STRICT_BASELINE_FILE" ]]; then
  strict_hits_raw > "$STRICT_BASELINE_FILE" || true
  log "Strict-typing baseline captured: $(wc -l < "$STRICT_BASELINE_FILE" | tr -d ' ') pre-existing hit(s)."
fi

# Validate with bounded fix retries. $1 = label, $2 = log file.
validate_with_retries() {
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
phase="coverage"   # coverage => still giving components story+test; audit => backlog
while (( iteration < MAX_ITERATIONS )); do
  covered_count="$(sync_progress)"
  pct=$(( covered_count * 100 / total ))
  open="$(open_recs)"
  log "Cycle $cycle ($phase): $covered_count/$total covered (${pct}%), $open open recommendation(s)."

  # ---- Cycle boundary handling --------------------------------------------
  if [[ "$phase" == "coverage" ]] && (( pct >= TARGET_FRACTION )); then
    ts="$(date +%Y%m%d-%H%M%S)"
    reclog="$LOG_DIR/cycle-$(printf '%02d' "$cycle")-recommend-$ts.log"
    log "Coverage cycle $cycle complete (${pct}%). Generating recommendations → $RECS_FILE"
    run_claude "$(recommend_prompt "$cycle" "$(completeness_report)")" "$reclog"
    phase="audit"
    continue
  fi

  if [[ "$phase" == "audit" ]] && (( open == 0 )); then
    if (( cycle >= MAX_CYCLES )); then
      log "Reached MAX_CYCLES ($MAX_CYCLES) and backlog is empty — stopping."
      break
    fi
    ts="$(date +%Y%m%d-%H%M%S)"
    cycle=$(( cycle + 1 ))
    reclog="$LOG_DIR/cycle-$(printf '%02d' "$cycle")-recommend-$ts.log"
    log "Audit backlog empty — opening cycle $cycle, regenerating recommendations."
    run_claude "$(recommend_prompt "$cycle" "$(completeness_report)")" "$reclog"
    if (( $(open_recs) == 0 )); then
      log "No new recommendations produced — coverage has converged. 🎉 Stopping."
      break
    fi
    continue
  fi

  if [[ "$phase" == "coverage" ]] && (( covered_count >= total )); then
    phase="audit"
    continue
  fi

  # ---- Normal iteration: ONE session does reflect → plan → execute → validate
  (( iteration++ ))
  ts="$(date +%Y%m%d-%H%M%S)"
  logfile="$LOG_DIR/iter-$(printf '%03d' "$iteration")-$ts.log"
  remaining="$(remaining_list)"
  completeness="$(completeness_report)"
  log "Iteration $iteration (cycle $cycle/$phase): reflect → plan → execute → validate  (log: $logfile)"
  if [[ -n "$completeness" ]]; then
    gap_n="$(printf '%s\n' "$completeness" | grep -c '^  - ' || true)"
    log "Test-completeness gaps flagged on ${gap_n} component(s) with tests (heuristic; fed to the prompt)."
  fi

  run_claude "$(iterate_prompt "$phase" "$remaining" "$open" "$completeness")" "$logfile"
  validate_with_retries "iter $iteration" "$logfile" || true
done

covered_count="$(sync_progress)"
log "Loop finished after $iteration iteration(s), $cycle cycle(s)."
log "$covered_count/$total components have story + test. Progress: $PROGRESS_FILE"
log "Reflection journal: $JOURNAL"
log "Open recommendations remaining: $(open_recs) (see $RECS_FILE)"
