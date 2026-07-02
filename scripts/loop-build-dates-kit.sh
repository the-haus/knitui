#!/usr/bin/env bash
#
# loop-build-dates-kit.sh
# -----------------------
# Repeatedly invokes Claude Code (headless) to grow a NEW workspace package,
# @knitui/dates, whose PUBLIC API mirrors @mantine/dates (calendars, date & time
# pickers), built on Tamagui via our existing @knitui/components + @knitui/core
# primitives (so each component works on web + native from one source).
#
# This is the dates-specific sibling of scripts/loop-build-ui-kit.sh. It works
# the SAME way (reflect -> plan -> execute -> validate -> demo, resumable from
# disk), but targets @knitui/dates and references the Mantine *dates* source plus
# the already-built @knitui/components kit instead of Tamagui's UI source.
#
# Architecture the loop builds into:
#   - @knitui/dates (packages/dates) holds ALL date/time components, one folder per
#     component (src/<Name>/<Name>.tsx + src/<Name>/index.ts), composed from the
#     @knitui/components primitives (Input, InputBase, Popover, Button,
#     UnstyledButton, CloseButton, Box, Text, …) + @knitui/core helpers + dayjs.
#   - It does NOT re-build base UI primitives — those already live in
#     @knitui/components. @knitui/dates depends on @knitui/components, @knitui/core,
#     @knitui/hooks and dayjs.
#   - Components import ONLY from @knitui/components, @knitui/core, @knitui/hooks,
#     `dayjs`, and sibling @knitui/dates folders.
#
# How it works
#   1. Reads the component list from the vendored Mantine dates source
#      (DATES_REF, default $REPO_DIR/tmp/mantine/dates — auto-detects
#      .../src/components). The already-built @knitui/components kit
#      (COMPONENTS_REF, default packages/components/src) is offered as the
#      implementation reference (how our Input/Popover/Button/etc. look). If no
#      reference is found, falls back to a built-in, dependency-ordered list.
#   2. Each iteration is reflect -> plan -> execute -> validate -> demo:
#        - Claude reflects on prior iterations (journal + the real package state)
#          and writes a focused plan (.dates-kit-plan.md) that both adds new
#          components and improves existing ones.
#        - Claude executes that plan into packages/dates, then a typecheck gates
#          it (failures get bounded "fix it" retries).
#        - Claude then adds/extends a demo section in @knitui/demo so the new /
#          improved components are showcased there, and the typecheck gates it
#          again. BOTH apps — Next.js (apps/web) and Expo (apps/example) — render
#          that demo, so the live gallery always reflects the latest kit.
#      Progress is derived from what actually exists on disk, so it's resumable.
#   3. When a build cycle reaches TARGET_FRACTION coverage, Claude reviews the
#      whole kit and appends NEW recommendations to .dates-kit-recommendations.md.
#      The loop then works that backlog (improve phase) and regenerates ideas
#      each cycle until it converges or hits MAX_CYCLES / MAX_ITERATIONS.
#   4. You can watch Claude work live: STREAM=pretty (default) renders every
#      message, tool call, file edit and command as it happens.
#
# Usage
#   scripts/loop-build-dates-kit.sh                 # run with defaults (live output)
#   BATCH_SIZE=2 MAX_ITERATIONS=50 scripts/loop-build-dates-kit.sh
#   STREAM=json scripts/loop-build-dates-kit.sh     # raw stream-json instead
#   STREAM=text scripts/loop-build-dates-kit.sh     # only final answers
#   DRY_RUN=1 scripts/loop-build-dates-kit.sh       # show the plan, build nothing
#
# Live + persisted output:
#   - Terminal shows readable activity in real time (STREAM=pretty).
#   - .dates-kit-logs/iter-NNN-*.log        readable transcript per iteration
#   - .dates-kit-logs/iter-NNN-*.log.jsonl  full raw stream-json for that iteration
#
# NOTE: This runs Claude with --dangerously-skip-permissions so it can edit
# files and run builds unattended. Only run it in a repo/branch you trust.

set -euo pipefail

# ----------------------------------------------------------------------------
# Configuration (override any of these via environment variables)
# ----------------------------------------------------------------------------
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
# Mantine DATES source (for the component prop API) — vendored in-repo under tmp/.
DATES_REF="${DATES_REF:-$REPO_DIR/tmp/mantine/dates}"
# The already-built kit (idiomatic cross-platform implementation patterns to
# compose from): our own @knitui/components source.
COMPONENTS_REF="${COMPONENTS_REF:-$REPO_DIR/packages/components/src}"

PROGRESS_FILE="${PROGRESS_FILE:-$REPO_DIR/.dates-kit-progress}"
LOG_DIR="${LOG_DIR:-$REPO_DIR/.dates-kit-logs}"
JOURNAL="${JOURNAL:-$REPO_DIR/.dates-kit-journal.md}"          # running reflection log
PLAN_FILE="${PLAN_FILE:-$REPO_DIR/.dates-kit-plan.md}"         # current iteration plan
RECS_FILE="${RECS_FILE:-$REPO_DIR/.dates-kit-recommendations.md}"  # backlog of ideas

BATCH_SIZE="${BATCH_SIZE:-2}"          # rough scope per iteration (new components)
MAX_ITERATIONS="${MAX_ITERATIONS:-100}"
RETRY_LIMIT="${RETRY_LIMIT:-2}"        # extra fix attempts per failing iteration
TARGET_FRACTION="${TARGET_FRACTION:-90}"  # a build "cycle" completes at this %% built
MAX_CYCLES="${MAX_CYCLES:-3}"          # build cycle + this many improvement cycles

MODEL="${MODEL:-}"                     # e.g. claude-opus-4-8 ; empty = account default
FALLBACK_MODEL="${FALLBACK_MODEL:-}"   # e.g. claude-sonnet-4-6
# Typecheck only the dates package (+ its workspace deps resolve to source).
VALIDATE_CMD="${VALIDATE_CMD:-pnpm --filter @knitui/dates typecheck}"
DRY_RUN="${DRY_RUN:-0}"

# Type-strictness gate. `tsc` happily passes code that uses `any`, `as any`, or
# suppression comments — so on TOP of the typecheck we reject those escape
# hatches. It is DIFF-SCOPED: at startup we snapshot the loose-typing hits that
# ALREADY exist. Those pre-existing hits are tolerated; the gate fails only when
# an iteration INTRODUCES a new one. Set STRICT_TYPES=0 to disable.
STRICT_TYPES="${STRICT_TYPES:-1}"
# ERE of forbidden loose-typing patterns: any annotations/casts/arrays/generics
# and the TS suppression directives. Override to tune what counts as a leak.
STRICT_TYPE_PATTERN="${STRICT_TYPE_PATTERN:-(\bas any\b|\bas unknown as\b|:[[:space:]]*any\b|\bany\[\]|<[[:space:]]*any[[:space:]]*[,>]|,[[:space:]]*any[[:space:]]*>|@ts-ignore|@ts-nocheck|@ts-expect-error)}"
# Snapshot of pre-existing loose-typing hits, written once at startup. The gate
# subtracts these so only NEWLY introduced leaks fail. Delete it to re-baseline.
STRICT_BASELINE_FILE="${STRICT_BASELINE_FILE:-$LOG_DIR/.strict-baseline}"
# How Claude's activity is shown live: "pretty" (streamed + human-readable),
# "json" (raw stream-json), or "text" (final answer only, no live activity).
STREAM="${STREAM:-pretty}"

# Where built components live (the NEW dates workspace package).
COMPONENTS_PKG_NAME="${COMPONENTS_PKG_NAME:-@knitui/dates}"
COMPONENTS_PKG_DIR="${COMPONENTS_PKG_DIR:-packages/dates}"

# Shared demo gallery that lives in @knitui/demo and is rendered by BOTH apps —
# Next.js (apps/web) and Expo (apps/example). Sections are registered in
# registry.ts; the loop adds a `<Name>Section.tsx` per component there.
DEMO_PKG_NAME="${DEMO_PKG_NAME:-@knitui/demo}"
DEMO_SECTIONS_DIR="${DEMO_SECTIONS_DIR:-$REPO_DIR/packages/demo/src/sections}"
DEMO_REGISTRY="${DEMO_REGISTRY:-$DEMO_SECTIONS_DIR/registry.ts}"

# ----------------------------------------------------------------------------
# Built-in fallback component list (DEPENDENCY ORDER: foundations first so later
# components build on earlier ones — mirrors @mantine/dates' own index order).
# Used only if the Mantine dates clone can't be read.
# ----------------------------------------------------------------------------
FALLBACK_COMPONENTS=(
  # --- foundation: context, utils-bearing primitives ---
  DatesProvider HiddenDatesInput TimeValue
  # --- calendar building blocks ---
  Day WeekdaysRow PickerControl Month MonthsList YearsList CalendarHeader
  # --- levels (single + grouped) ---
  DecadeLevel YearLevel MonthLevel LevelsGroup
  DecadeLevelGroup YearLevelGroup MonthLevelGroup
  # --- composed calendars ---
  Calendar MiniCalendar
  # --- inline pickers (value selection on the calendar) ---
  YearPicker MonthPicker DatePicker
  # --- input bases & free-typed date inputs ---
  PickerInputBase DateInput
  # --- time ---
  SpinInput TimeInput TimePicker TimeGrid
  # --- date+time composed ---
  DateTimePicker InlineDateTimePicker
  # --- input-trigger pickers (popover + text input) ---
  YearPickerInput MonthPickerInput DatePickerInput
)

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
log()  { printf '\033[1;36m[loop]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[loop]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[loop]\033[0m %s\n' "$*" >&2; exit 1; }

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

# Locate the components directory inside the Mantine dates reference. Prefers the
# canonical layout, then falls back to any */components dir, then the ref root.
find_components_dir() {
  [[ -d "$DATES_REF" ]] || return 1
  local canonical="$DATES_REF/src/components"
  if [[ -d "$canonical" ]]; then echo "$canonical"; return 0; fi
  local found
  found="$(find "$DATES_REF" -type d -path '*/src/components' 2>/dev/null | head -1)"
  [[ -z "$found" ]] && found="$(find "$DATES_REF" -type d -name components 2>/dev/null | head -1)"
  if [[ -n "$found" ]]; then echo "$found"; return 0; fi
  echo "$DATES_REF"; return 0
}

# Print the full ordered component list, one per line. We keep the curated
# dependency order from FALLBACK_COMPONENTS as the spine, then append any extra
# component dirs the Mantine reference exposes that we didn't enumerate.
component_list() {
  local dir names=""
  if dir="$(find_components_dir)" && [[ -n "$dir" ]]; then
    names="$(find "$dir" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null \
             | grep -E '^[A-Z]' | sort -u)"
  fi
  if [[ -z "$names" ]]; then
    warn "No usable Mantine dates reference under $DATES_REF — using built-in list."
    warn "Put a Mantine checkout there (or set DATES_REF=/path/...) to use the real one."
    printf '%s\n' "${FALLBACK_COMPONENTS[@]}" | awk '!seen[$0]++'
    return 0
  fi
  # Curated order first (only those that actually exist in the reference), then
  # any reference dirs not in our curated list (alphabetical), de-duplicated.
  {
    local c
    for c in "${FALLBACK_COMPONENTS[@]}"; do
      printf '%s\n' "$names" | grep -qxF "$c" && echo "$c"
    done
    printf '%s\n' "$names"
  } | awk '!seen[$0]++'
}

is_done() { grep -qxF "$1" "$PROGRESS_FILE"; }
mark_done() { is_done "$1" || echo "$1" >> "$PROGRESS_FILE"; }

# A component counts as "built" when its source dir exists in the package.
component_built() { [[ -d "$REPO_DIR/$COMPONENTS_PKG_DIR/src/$1" ]]; }

# Reconcile the progress file with what actually exists on disk, echo built count.
sync_progress() {
  local built=0 c
  for c in "${ALL_COMPONENTS[@]}"; do
    if component_built "$c"; then mark_done "$c"; built=$((built + 1)); fi
  done
  echo "$built"
}

# Comma-joined list of components NOT yet built (capped) for the planner.
remaining_list() {
  local out="" c n=0
  for c in "${ALL_COMPONENTS[@]}"; do
    component_built "$c" && continue
    out+="${out:+, }$c"; n=$((n + 1))
    (( n >= 40 )) && { out+=", ..."; break; }
  done
  echo "$out"
}

# Count of open (unchecked) recommendation items in the backlog.
open_recs() { local n; n="$(grep -cE '^\- \[ \]' "$RECS_FILE" 2>/dev/null)" || true; echo "${n:-0}"; }

# ----------------------------------------------------------------------------
# Prompt builders
# ----------------------------------------------------------------------------
context_preamble() {
  sed -e "s|__COMPONENTS_PKG_NAME__|$COMPONENTS_PKG_NAME|g" \
      -e "s|__COMPONENTS_PKG_DIR__|$COMPONENTS_PKG_DIR|g" <<'PREAMBLE'
You are growing a NEW package, __COMPONENTS_PKG_NAME__ (dir __COMPONENTS_PKG_DIR__),
inside an existing pnpm + Turborepo monorepo (`@knitui/*`). Its PUBLIC API mirrors
@mantine/dates — calendars, date & time pickers (prop names, compound parts,
controlled/uncontrolled value props, ref forwarding) — but the IMPLEMENTATION is
our own and is built on Tamagui via the ALREADY-BUILT @knitui/components +
@knitui/core primitives. Tamagui handles web + native, so there is NO react-native
or DOM primitive code to write — you compose existing components and Box/Text.

WHAT ALREADY EXISTS (do NOT rebuild it):
  - @knitui/components is the full base UI kit (a Mantine-on-Tamagui port). It
    already exports the building blocks date pickers need, including: `Input`,
    `InputBase`, `Popover`, `Button`, `UnstyledButton`, `ActionIcon`,
    `CloseButton`, `Box`, `Text`, `Group`, `Stack`, `SimpleGrid`, `ScrollArea`,
    `Paper`, plus the size/variant/theme conventions. Reuse these — never
    reimplement an input, popover, or button here.
  - @knitui/core is the design-system FOUNDATION (Tamagui internalized behind it).
    It exports the wrapped essentials you build with: styled, createStyledContext,
    withStaticProperties, GetProps, useTheme, Theme, getTokens/getTokenValue,
    AnimatePresence, Provider, useColorScheme, config, themes.
  - @knitui/hooks provides shared hooks (useId, useUncontrolled, useDisclosure,
    useMergedRef, …).
  - `dayjs` is a dependency of __COMPONENTS_PKG_NAME__ and is the date engine —
    use it for ALL date math/formatting/parsing, exactly as @mantine/dates does
    (Mantine is also dayjs-based, so its logic ports almost directly).

ARCHITECTURE (do not deviate):
  - __COMPONENTS_PKG_NAME__ holds ALL date/time components, ONE FOLDER PER
    COMPONENT:
        __COMPONENTS_PKG_DIR__/src/<Name>/<Name>.tsx   (implementation)
        __COMPONENTS_PKG_DIR__/src/<Name>/index.ts      (export * from "./<Name>")
    and every component is re-exported from __COMPONENTS_PKG_DIR__/src/index.ts.
  - Shared date utilities and hooks live alongside, mirroring the Mantine source
    layout: __COMPONENTS_PKG_DIR__/src/utils/* and __COMPONENTS_PKG_DIR__/src/hooks/*
    (e.g. use-dates-state, use-uncontrolled-dates, clamp-date, assign-time,
    get-formatted-date). Port these as needed so components can build on them.
  - `DatesProvider` supplies locale/format/timezone context (a React context),
    just like @mantine/dates; components read it via a `useDatesContext` hook.

IMPORT BOUNDARY (strict):
  - Component files import ONLY from:
        `@knitui/components` (Input, Popover, Button, Box, Text, … and types),
        `@knitui/core`       (styled, helpers, theme),
        `@knitui/hooks`,
        `dayjs`            (and dayjs plugins, e.g. customParseFormat),
        and sibling folders within __COMPONENTS_PKG_DIR__/src via relative paths
        (e.g. `../Calendar`, `../Day`, `../utils/clamp-date`).
  - DO NOT import `tamagui` (the umbrella) or `@tamagui/*` anywhere — go through
    @knitui/components / @knitui/core. DO NOT import `@mantine/*`. DO NOT import any
    react-native primitive directly; compose @knitui/components + Box/Text.

HOW TO BUILD A COMPONENT:
  - Port Mantine's behaviour/state machine (date selection, level navigation
    decade↔year↔month↔day, keyboard handling, clamping to min/max, range
    selection, controlled/uncontrolled value) faithfully — Mantine's logic is
    dayjs-based and ports almost 1:1. Keep its PUBLIC prop NAMES.
  - Build the VISUALS from @knitui/components + `styled(Box, { … })` /
    `styled(Text, …)` from @knitui/core. Calendar grids = `SimpleGrid`/`Box`;
    day/month/year cells = an `UnstyledButton`-based control (`PickerControl`,
    `Day`) with `variant`/`size` variants + `selected`/`inRange`/`disabled`
    boolean variants; the input-trigger pickers wrap our `Input`/`InputBase` and
    open a `Popover`.
  - COLOR uses TAMAGUI's theming — NOT Mantine's color system. Do NOT add a
    Mantine-style `color` prop. Accent is the Tamagui `theme` prop
    (`<DatePicker theme="blue" />`) and styles reference the active theme's
    palette ramp: `$color9` = solid accent (selected day bg), `$color1` =
    contrast text on it, `$color4`/`$color5` = subtle tints (in-range bg),
    `$color11` = accent text, `$color7` = borders, plus semantic
    `$background`/`$color`/`$borderColor`. NEVER hard-code palette hex.
  - STATES: use `hoverStyle` / `pressStyle` / `focusVisibleStyle` props and a
    `disabled` boolean variant — no runtime hover state, no Pressable wrapper.
  - SIZES: reuse the kit's `size` scale (xs/sm/md/lg/xl) and share `size` down to
    sub-parts via `createStyledContext`, matching @knitui/components.
  - COMPOUND PARTS / static sub-components: assemble with `withStaticProperties`.
  - CONTROLLED/UNCONTROLLED value handling: use @knitui/hooks (`useUncontrolled`)
    + the ported `use-uncontrolled-dates` / `use-dates-state` hooks. Format and
    parse via `dayjs` honouring `DatesProvider` locale/format.

HARD RULES:
  - Build the SAME component SET as @mantine/dates, and mirror its PUBLIC prop API
    with Mantine's NAMES for everything EXCEPT color: value/defaultValue/onChange,
    `type` (default/range/multiple), level props, `minDate`/`maxDate`,
    `numberOfColumns`, `firstDayOfWeek`, `weekendDays`, `excludeDate`, format
    props, `withCellSpacing`, compound parts, ref forwarding. COLOR is the one
    deliberate divergence — use Tamagui's `theme` prop + palette ramp (above).
  - FULL SPEC PER COMPONENT: "done" means every public prop, every level/type,
    sizes, all compound/static parts, ref forwarding, and a11y roles/labels are
    present. A bare/partial port does NOT count as built.
  - CROSS-PLATFORM: everything must run on web AND native. No `window`/`document`
    reach-arounds (guard via @knitui/core helpers like `isWeb` when unavoidable),
    no DOM-only events; keyboard handling uses the kit's cross-platform patterns.
  - TYPING IS STRICT AND GATED. Every prop, variant, generic, return value and
    ref must be precisely typed. You MUST NOT use `any`, `as any`,
    `as unknown as`, `any[]`, `<any>`, or the suppression directives
    @ts-ignore / @ts-nocheck / @ts-expect-error — a post-typecheck strictness
    gate FAILS the iteration if YOUR changes INTRODUCE any of these, even when
    `tsc` itself passes. Narrow locally rather than widening the public API.
  - Match the structure + style of @knitui/components/src (study how `Input`,
    `Popover`, `Combobox`, `Button` are organized — folders, variants,
    createStyledContext, withStaticProperties, index.ts barrels).
  - FINISH EXISTING BEFORE STARTING NEW: before creating a brand-new component,
    audit the ones already in __COMPONENTS_PKG_DIR__/src against their Mantine
    spec and complete any gaps (missing props/levels/types/parts) FIRST.
PREAMBLE
  echo
  if [[ -n "${REF_COMPONENTS_DIR:-}" ]]; then
    echo "REFERENCES (read before implementing; do NOT copy verbatim):"
    echo "  - Mantine dates source (the PUBLIC prop API + behaviour to mirror):"
    echo "      $REF_COMPONENTS_DIR/<Name>"
    echo "      (shared logic to port: $DATES_REF/src/utils and $DATES_REF/src/hooks)"
    [[ -d "${COMPONENTS_REF:-}" ]] && \
    echo "  - Our @knitui/components source (how to express it on Tamagui — Input," \
         "Popover, Button, Box/Text, variants, createStyledContext): $COMPONENTS_REF/<Name>"
    echo "  Read the Mantine folder for the prop surface + dayjs state logic, the"
    echo "  matching @knitui/components for how to express UI in our kit, then write"
    echo "  OUR component. Never copy Mantine's web DOM/CSS; never depend on the"
    echo "  tamagui umbrella, @tamagui/*, or @mantine/*."
  else
    echo "No local Mantine dates reference is available; implement each component"
    echo "from your knowledge of @mantine/dates' public API on top of"
    echo "@knitui/components + @knitui/core + dayjs."
  fi
}

# Step 1 of each iteration: reflect on prior work, then write a fresh plan.
reflect_plan_prompt() {  # $1=phase  $2=remaining list  $3=open-rec count
  local phase="$1" remaining="$2" open="$3"
  context_preamble
  cat <<PROMPT

REFLECT, THEN PLAN THE NEXT ITERATION (phase: $phase)
You are running inside a loop that grows this dates kit over many iterations.
State is persisted in these files — read them before doing anything:
  - Journal (history of past iterations):   $JOURNAL
  - Recommendations backlog (open ideas):   $RECS_FILE
  - Previous plan:                           $PLAN_FILE

Also inspect the real state of the package on disk:
  - Built components live in $COMPONENTS_PKG_DIR/src/ (each <Name>/ is one).
  - Components still missing vs. the Mantine dates set: $remaining
  - Open recommendations in the backlog: $open

Do TWO things, and ONLY these two (do NOT implement components in this step):
  1. REFLECT: append a short dated entry to $JOURNAL summarizing the PREVIOUS
     iteration's outcome as you can infer it from disk — what now exists, what
     looks unfinished or inconsistent, and any quality gaps (missing
     levels/types, weak typing, web-only code that won't run on native, no
     DatesProvider wiring, no theme wiring).
  2. PLAN: (over)write $PLAN_FILE with a focused, single-iteration plan that
     BOTH extends and improves the kit. RESPECT DEPENDENCY ORDER — build
     foundations (DatesProvider, utils, hooks, Day, Month, levels) before the
     composed calendars and the input-trigger pickers that consume them. In the
     "$phase" phase, weight it toward:
       - build phase   → ~$BATCH_SIZE new components from the missing list (in
                         dependency order), plus 1 small improvement to something
                         already built.
       - improve phase → the highest-value open recommendations + refinements
                         to existing components (parity, a11y, theming, types).
     Keep the plan to roughly one iteration of work. Make it concrete: name the
     components/files to touch and what "done" looks like.
PROMPT
}

# Step 2: execute the plan that step 1 wrote.
execute_prompt() {
  context_preamble
  cat <<PROMPT

EXECUTE THE PLAN
Read $PLAN_FILE and carry it out now.
  - BEFORE creating any new component, audit the components already in
    $COMPONENTS_PKG_DIR/src against their full Mantine dates spec (read the
    matching Mantine reference folder for each). If an existing component is
    missing any props, levels, types (default/range/multiple), sizes, compound
    sub-components, ref forwarding, or accessibility behavior, COMPLETE those
    gaps FIRST.
  - Port shared logic into $COMPONENTS_PKG_DIR/src/utils/* and
    $COMPONENTS_PKG_DIR/src/hooks/* as needed (dayjs-based date math, clamping,
    range state, controlled/uncontrolled value, formatting) — mirror the Mantine
    layout. These are NOT counted as "components" but are required for them.
  - Create each component as its OWN folder:
        $COMPONENTS_PKG_DIR/src/<Name>/<Name>.tsx   (implementation)
        $COMPONENTS_PKG_DIR/src/<Name>/index.ts       (export * from "./<Name>")
    Build the UI from \`@knitui/components\` (Input, Popover, Button, Box, Text, …)
    and \`styled\`/\`createStyledContext\`/\`withStaticProperties\`/\`GetProps\` from
    \`@knitui/core\`; do date math with \`dayjs\`. Fully typed (no \`any\` leaks).
  - For EACH component, implement the COMPLETE Mantine public surface — every
    prop, every level/type, every \`size\`, all compound parts, ref forwarding and
    a11y roles/labels. A bare port does NOT count as done.
  - STYLING is theme-driven Tamagui, and must be complete:
      * variants for \`size\` (× selected/inRange/disabled/outside modifiers) with
        \`defaultVariants\`;
      * color via Tamagui's \`theme\` prop + the palette ramp (\$color1…\$color12) +
        semantic tokens (NO Mantine \`color\` prop; never hard-code palette hex);
      * states via \`hoverStyle\`/\`pressStyle\`/\`focusVisibleStyle\` + a \`disabled\`
        variant (no Pressable, no runtime hover state).
  - Behaviour (selection, level navigation, controlled/uncontrolled, clamping)
    is built from @knitui/components + React state + @knitui/hooks + dayjs — NOT
    react-native primitives, NOT DOM. Locale/format/timezone come from
    \`DatesProvider\` via \`useDatesContext\`.
  - IMPORT BOUNDARY: component files import ONLY from \`@knitui/components\`,
    \`@knitui/core\`, \`@knitui/hooks\`, \`dayjs\`, and sibling folders (\`../Name\`,
    \`../utils/...\`). No \`tamagui\` umbrella, no \`@tamagui/*\`, no \`@mantine/*\`.
  - Export every new/changed public API from $COMPONENTS_PKG_DIR/src/index.ts.
  - If the plan addresses items from $RECS_FILE, tick them off (\`- [ ]\` → \`- [x]\`)
    once actually implemented.

When finished, run \`$VALIDATE_CMD\` and fix any type errors you introduced
before stopping. Stay within the scope of $PLAN_FILE this iteration.
PROMPT
}

# Step 3: after executing the plan, refresh the shared demo so the new/improved
# components are actually showcased in both apps.
demo_prompt() {
  context_preamble
  cat <<PROMPT

UPDATE THE DEMO GALLERY
The plan for this iteration has been executed. Now showcase the date components
you just added or improved in the shared demo gallery (the $DEMO_PKG_NAME
package), which is rendered by BOTH apps — Next.js (apps/web) and Expo
(apps/example) — so it must stay cross-platform (Tamagui handles web + native).

The demo is section-based:
  - Each section is a file $DEMO_SECTIONS_DIR/<Name>Section.tsx exporting a
    \`<Name>Section\` React component, using the shared \`Section\` helper from
    \`./shared\` (read $DEMO_SECTIONS_DIR/shared.tsx and an existing section such
    as AlertSection.tsx or PopoverSection.tsx to copy the pattern).
  - Sections are registered in $DEMO_REGISTRY (the \`SECTIONS\` array). Add an
    import + one \`{ id, name, group: "Dates", Component }\` entry per new section,
    keeping the array tidy. Group ALL date sections under \`group: "Dates"\`.

Do this:
  - For every component newly built or meaningfully improved this iteration that
    is a USER-FACING component (DatePicker, DateInput, DatePickerInput,
    DateTimePicker, MonthPicker, YearPicker, Calendar, MiniCalendar, TimeInput,
    TimePicker, TimeGrid, etc. — not internal parts like Day/PickerControl),
    add or extend its \`<Name>Section.tsx\` demonstrating its key props/levels/
    types, sizes, and accent colors via \`<Theme name="…">\`, with the picker
    typically wrapped so it has visible state (use React state for value).
  - Import the date components from \`$COMPONENTS_PKG_NAME\` and layout primitives
    (\`Stack\`, \`Group\`, \`Text\`, \`Theme\`) from \`@knitui/components\`. Do NOT import
    \`@knitui/core\`, \`tamagui\`, \`@tamagui/*\`, \`@mantine/*\`, or from
    $COMPONENTS_PKG_DIR/src directly.
  - No \`any\`. Keep existing sections intact. Each section must compile + render.

When finished, run \`$VALIDATE_CMD\` plus \`pnpm --filter $DEMO_PKG_NAME typecheck\`
and fix any type errors you introduced in the demo before stopping. Stay scoped
to the demo sections in this step.
PROMPT
}

# Run at the END of a full cycle: review the whole kit and grow the backlog.
recommend_prompt() {  # $1 = cycle number
  local cycle="$1"
  context_preamble
  cat <<PROMPT

CYCLE $cycle COMPLETE — GENERATE NEW RECOMMENDATIONS
A full cycle just finished: the kit now covers (almost) all target components.
Step back and review the ENTIRE kit in $COMPONENTS_PKG_DIR/src against
@mantine/dates and against production-quality cross-platform standards.

Append NEW, deduplicated improvement/extension ideas to $RECS_FILE as a markdown
checklist. First read the file so you do NOT repeat items already listed
(checked or unchecked). Start your additions with a header line:
  "## Cycle $cycle recommendations"
Then one "- [ ] <actionable recommendation>" per line. Cover gaps such as:
  - missing components, sub-components, levels, or \`type\` modes vs. Mantine
  - inconsistent prop/types APIs across components; DatesProvider parity
    (locale, firstDayOfWeek, weekendDays, format, timezone)
  - cross-platform (web + native) correctness; keyboard navigation; the import
    boundary (no @tamagui/*, tamagui umbrella, or @mantine/* leaking in)
  - theming (palette ramp \$color1…\$color12 + sub-themes), accessibility
    (roles/labels/focus on calendar grids), docs, and test gaps
If, after honest review, there is genuinely nothing worth adding, append the
single line "## Cycle $cycle recommendations: none — kit is solid" and stop.
PROMPT
}

fix_prompt() {  # $1 = validation output
  cat <<PROMPT
Validation is failing after the last change. It runs \`$VALIDATE_CMD\` AND a
type-strictness gate. Below is the output. Fix the errors WITHOUT removing
functionality, then re-run the check until it passes.

Fix the ROOT CAUSE with precise types. You MUST NOT silence errors with \`any\`,
\`as any\`, \`as unknown as\`, \`any[]\`, \`<any>\`, or @ts-ignore / @ts-nocheck /
@ts-expect-error — the strictness gate rejects NEW occurrences of those and will
keep failing. The gate is diff-scoped: any strictness failure above is from a
hatch YOUR change introduced (pre-existing ones are baselined and ignored), so
fix the lines it names, not unrelated pre-existing ones. If a runtime value
fights Tamagui's strict style typing, narrow it locally (a precise type/cast)
rather than widening or suppressing.

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
strict_hits_raw() {
  local targets=()
  [[ -d "$REPO_DIR/$COMPONENTS_PKG_DIR/src" ]] && targets+=("$REPO_DIR/$COMPONENTS_PKG_DIR/src")
  [[ -d "$DEMO_SECTIONS_DIR" ]] && targets+=("$DEMO_SECTIONS_DIR")
  [[ ${#targets[@]} -gt 0 ]] || return 0
  grep -rnE "$STRICT_TYPE_PATTERN" --include='*.ts' --include='*.tsx' "${targets[@]}" 2>/dev/null \
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

validate() {  # writes output to stdout, returns cmd exit code
  local out rc=0
  out="$( cd "$REPO_DIR" && eval "$VALIDATE_CMD" 2>&1 )" || rc=$?
  printf '%s\n' "$out"
  (( rc != 0 )) && return "$rc"
  if [[ "$STRICT_TYPES" == "1" ]]; then
    local strict_out
    strict_out="$(type_strictness_report)" || { printf '%s\n' "$strict_out"; return 1; }
  fi
  return 0
}

# ----------------------------------------------------------------------------
# Main loop
# ----------------------------------------------------------------------------
# Resolve the reference components dir once (empty string => use built-in list).
REF_COMPONENTS_DIR=""
if _d="$(find_components_dir)" && [[ -n "$_d" ]] && \
   [[ -n "$(find "$_d" -mindepth 1 -maxdepth 1 -type d -name '[A-Z]*' 2>/dev/null | head -1)" ]]; then
  REF_COMPONENTS_DIR="$_d"
  log "Using Mantine dates reference: $REF_COMPONENTS_DIR"
else
  log "No Mantine dates reference found under $DATES_REF — using built-in list."
fi
[[ -d "$COMPONENTS_REF" ]] && log "Implementation reference (our kit): $COMPONENTS_REF"

ALL_COMPONENTS=()
while IFS= read -r _c; do
  [[ -n "$_c" ]] && ALL_COMPONENTS+=("$_c")
done < <(component_list)
[[ ${#ALL_COMPONENTS[@]} -gt 0 ]] || die "Could not determine a component list."

total=${#ALL_COMPONENTS[@]}
log "Target: $total components ($COMPONENTS_PKG_NAME). A build cycle completes at >= ${TARGET_FRACTION}% built."
log "Max iterations: $MAX_ITERATIONS | Max cycles: $MAX_CYCLES | Scope/iter: ~$BATCH_SIZE"
log "Journal: $JOURNAL | Plan: $PLAN_FILE | Recommendations: $RECS_FILE"

if [[ "$DRY_RUN" == "1" ]]; then
  log "DRY_RUN — target components (build order):"
  printf '  %s\n' "${ALL_COMPONENTS[@]}"
  exit 0
fi

# Capture the strict-typing baseline once so pre-existing hits are tolerated.
if [[ "$STRICT_TYPES" == "1" && ! -f "$STRICT_BASELINE_FILE" ]]; then
  strict_hits_raw > "$STRICT_BASELINE_FILE" || true
  log "Captured strict-typing baseline → $STRICT_BASELINE_FILE ($(wc -l < "$STRICT_BASELINE_FILE" | tr -d ' ') hit(s))."
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
phase="build"      # build => still filling out the component set; improve => backlog
while (( iteration < MAX_ITERATIONS )); do
  built_count="$(sync_progress)"
  pct=$(( built_count * 100 / total ))
  open="$(open_recs)"
  log "Cycle $cycle ($phase): $built_count/$total built (${pct}%), $open open recommendation(s)."

  # ---- Cycle boundary handling --------------------------------------------
  if [[ "$phase" == "build" ]] && (( pct >= TARGET_FRACTION )); then
    ts="$(date +%Y%m%d-%H%M%S)"
    reclog="$LOG_DIR/cycle-$(printf '%02d' "$cycle")-recommend-$ts.log"
    log "Build cycle $cycle complete (${pct}%). Generating recommendations → $RECS_FILE"
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
      log "No new recommendations produced — the kit has converged. 🎉 Stopping."
      break
    fi
    continue
  fi

  if [[ "$phase" == "build" ]] && (( built_count >= total )); then
    phase="improve"
    continue
  fi

  # ---- Normal iteration: reflect + plan, then execute ----------------------
  (( iteration++ ))
  ts="$(date +%Y%m%d-%H%M%S)"
  logfile="$LOG_DIR/iter-$(printf '%03d' "$iteration")-$ts.log"
  remaining="$(remaining_list)"
  log "Iteration $iteration (cycle $cycle/$phase): reflect → plan → execute  (log: $logfile)"

  run_claude "$(reflect_plan_prompt "$phase" "$remaining" "$open")" "$logfile"
  run_claude "$(execute_prompt)" "$logfile"
  validate_with_retries "iter $iteration" "$logfile" || true

  # Refresh the shared demo so the new/improved components show up live in both
  # apps, then gate it with the typecheck again.
  log "Iteration $iteration: updating demo sections → $DEMO_SECTIONS_DIR"
  run_claude "$(demo_prompt)" "$logfile"
  validate_with_retries "iter $iteration (demo)" "$logfile" || true
done

built_count="$(sync_progress)"
log "Loop finished after $iteration iteration(s), $cycle cycle(s)."
log "$built_count/$total components built. Progress: $PROGRESS_FILE"
log "Reflection journal: $JOURNAL"
log "Open recommendations remaining: $(open_recs) (see $RECS_FILE)"
