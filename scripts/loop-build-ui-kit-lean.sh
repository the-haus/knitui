#!/usr/bin/env bash
#
# loop-build-ui-kit-lean.sh
# -------------------------
# Token-lean variant of loop-build-ui-kit.sh. Same goal — repeatedly invoke
# Claude Code (headless) to grow THIS monorepo into a cross-platform UI kit whose
# PUBLIC API mirrors Mantine, built on Tamagui — but restructured to spend far
# fewer tokens per iteration.
#
# WHAT MAKES IT LEAN (vs. loop-build-ui-kit.sh)
#   1. ONE Claude session per iteration. The original spawned 3+ separate
#      headless sessions each iteration (reflect→plan, execute, demo, + fix
#      retries); every one re-read the journal, recs, plan, on-disk component
#      state, and the Mantine/Tamagui references from scratch. This version does
#      reflect → plan → execute → demo → self-typecheck in a SINGLE session, so
#      those files are read once, not 3×.
#   2. The big architecture/rules block is written ONCE to a rules file
#      (.ui-kit-rules.md) at startup and referenced by path. The original pasted
#      that ~90-line block (context_preamble) inline into every prompt — 3–5× per
#      iteration. Now each prompt is a few lines that point at the rules file,
#      which the session reads on demand (one tool read instead of repeated
#      inline input tokens).
#   3. A turn cap (--max-turns, MAX_TURNS) bounds runaway sessions.
#   4. Prompts explicitly tell Claude to read only the reference/component files
#      it needs this iteration, not to re-read everything.
#
# Everything else — progress tracking, build/improve cycles, the recommendations
# backlog, the diff-scoped strict-typing gate, live streaming — is preserved.
#
# Usage
#   scripts/loop-build-ui-kit-lean.sh                 # run with defaults
#   BATCH_SIZE=2 MAX_ITERATIONS=50 scripts/loop-build-ui-kit-lean.sh
#   MAX_TURNS=120 scripts/loop-build-ui-kit-lean.sh   # raise the per-session turn cap
#   STREAM=text scripts/loop-build-ui-kit-lean.sh     # only final answers
#   DRY_RUN=1 scripts/loop-build-ui-kit-lean.sh       # show the plan, build nothing
#
# Live + persisted output:
#   - Terminal shows readable activity in real time (STREAM=pretty).
#   - .ui-kit-logs/iter-NNN-*.log        readable transcript per iteration
#   - .ui-kit-logs/iter-NNN-*.log.jsonl  full raw stream-json for that iteration
#
# NOTE: This runs Claude with --dangerously-skip-permissions so it can edit
# files and run builds unattended. Only run it in a repo/branch you trust.

set -euo pipefail

# ----------------------------------------------------------------------------
# Configuration (override any of these via environment variables)
# ----------------------------------------------------------------------------
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
# Mantine source (for the component prop API) — vendored in-repo under tmp/.
MANTINE_REF="${MANTINE_REF:-$REPO_DIR/tmp/mantine}"
# Tamagui UI source (for idiomatic cross-platform implementation patterns).
TAMAGUI_REF="${TAMAGUI_REF:-$REPO_DIR/tmp/tamagui/ui}"

PROGRESS_FILE="${PROGRESS_FILE:-$REPO_DIR/.ui-kit-progress}"
LOG_DIR="${LOG_DIR:-$REPO_DIR/.ui-kit-logs}"
JOURNAL="${JOURNAL:-$REPO_DIR/.ui-kit-journal.md}"          # running reflection log
PLAN_FILE="${PLAN_FILE:-$REPO_DIR/.ui-kit-plan.md}"         # current iteration plan
RECS_FILE="${RECS_FILE:-$REPO_DIR/.ui-kit-recommendations.md}"  # backlog of ideas
# Architecture/rules written ONCE at startup and referenced by every prompt,
# instead of being pasted inline each time (the big token saver).
RULES_FILE="${RULES_FILE:-$REPO_DIR/.ui-kit-rules.md}"

BATCH_SIZE="${BATCH_SIZE:-3}"          # rough scope per iteration (new components)
MAX_ITERATIONS="${MAX_ITERATIONS:-100}"
RETRY_LIMIT="${RETRY_LIMIT:-2}"        # extra fix attempts per failing iteration
TARGET_FRACTION="${TARGET_FRACTION:-90}"  # a build "cycle" completes at this %% built
MAX_CYCLES="${MAX_CYCLES:-3}"          # build cycle + this many improvement cycles
# Per-session turn cap. One combined session does more than the old split steps,
# so this is generous; lower it to clamp tokens harder, raise it if work gets
# cut off mid-iteration. Empty = no cap.
MAX_TURNS="${MAX_TURNS:-80}"

MODEL="${MODEL:-}"                     # e.g. claude-opus-4-8 ; empty = account default
FALLBACK_MODEL="${FALLBACK_MODEL:-}"   # e.g. claude-sonnet-4-6
VALIDATE_CMD="${VALIDATE_CMD:-pnpm typecheck}"  # turbo: typechecks all packages
DRY_RUN="${DRY_RUN:-0}"

# Type-strictness gate. `tsc` happily passes code that uses `any`, `as any`, or
# suppression comments — so on TOP of the typecheck we reject those escape
# hatches. It is DIFF-SCOPED: at startup we snapshot the loose-typing hits that
# ALREADY exist (a few are unavoidable — Tamagui's strict style types reject
# valid runtime values like `tag`, `animation`, `verticalAlign:"middle"`, the
# CSS `inherit` keyword). Those pre-existing hits are tolerated; the gate fails
# only when an iteration INTRODUCES a new one. Set STRICT_TYPES=0 to disable.
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

# Where built components live (their own workspace package, not inside core).
COMPONENTS_PKG_NAME="${COMPONENTS_PKG_NAME:-@knitui/components}"
COMPONENTS_PKG_DIR="${COMPONENTS_PKG_DIR:-packages/components}"

# Shared demo screen that lives in @knitui/demo and is rendered by BOTH apps —
# Next.js (apps/web) and Expo (apps/example). After each iteration the loop asks
# Claude to showcase the new/improved components here.
DEMO_PKG_NAME="${DEMO_PKG_NAME:-@knitui/demo}"
DEMO_FILE="${DEMO_FILE:-$REPO_DIR/packages/demo/src/DemoScreen.tsx}"

# ----------------------------------------------------------------------------
# Built-in fallback component list (ordered: foundations first so later
# components can build on earlier ones). Used only if the Mantine clone fails.
# ----------------------------------------------------------------------------
FALLBACK_COMPONENTS=(
  # --- typography & primitives ---
  Text Title Anchor Code Kbd Mark Highlight Blockquote List
  # --- layout ---
  Center Group Stack Flex SimpleGrid Grid Container Space AspectRatio Paper Card Divider ScrollArea
  # --- buttons & actions ---
  UnstyledButton Button ActionIcon CloseButton CopyButton FileButton
  # --- data display ---
  Avatar Badge ThemeIcon Indicator Image Table Spoiler Timeline Accordion
  # --- feedback ---
  Loader LoadingOverlay Progress RingProgress Skeleton Alert Notification Overlay
  # --- inputs ---
  Input TextInput Textarea PasswordInput NumberInput Checkbox Radio Switch
  Chip SegmentedControl Slider Rating ColorSwatch ColorInput ColorPicker
  Select MultiSelect Autocomplete NativeSelect TagsInput PinInput Fieldset
  # --- navigation ---
  Tabs Stepper Breadcrumbs Pagination NavLink Burger
  # --- overlays ---
  Portal Transition Collapse Tooltip Popover Modal Drawer Menu HoverCard Dialog Affix
  # --- misc ---
  Pill ScrollArea Tree Stepper VisuallyHidden FocusTrap Box Collapse Spoiler
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

# Locate the components directory inside the /tmp reference. Prefers the
# canonical Mantine layout, then falls back to any */components dir, then to
# the reference root itself. Prints the path, or nothing if no reference.
find_components_dir() {
  [[ -d "$MANTINE_REF" ]] || return 1
  local canonical="$MANTINE_REF/packages/@mantine/core/src/components"
  if [[ -d "$canonical" ]]; then echo "$canonical"; return 0; fi
  local found
  found="$(find "$MANTINE_REF" -type d -path '*/core/src/components' 2>/dev/null | head -1)"
  [[ -z "$found" ]] && found="$(find "$MANTINE_REF" -type d -name components 2>/dev/null | head -1)"
  if [[ -n "$found" ]]; then echo "$found"; return 0; fi
  # No components/ dir — assume component folders live at the reference root.
  echo "$MANTINE_REF"; return 0
}

# Print the full ordered component list, one per line.
component_list() {
  local dir
  if dir="$(find_components_dir)" && [[ -n "$dir" ]]; then
    # Component names = sub-dirs that start with an uppercase letter.
    local names
    names="$(find "$dir" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null \
             | grep -E '^[A-Z]' | sort -u)"
    if [[ -n "$names" ]]; then
      echo "$names"
      return 0
    fi
  fi
  warn "No usable Mantine reference under $MANTINE_REF — using built-in component list."
  warn "Put a Mantine checkout there (or set MANTINE_REF=/tmp/...) to use the real one."
  printf '%s\n' "${FALLBACK_COMPONENTS[@]}" | awk '!seen[$0]++'
}

is_done() { grep -qxF "$1" "$PROGRESS_FILE"; }
mark_done() { is_done "$1" || echo "$1" >> "$PROGRESS_FILE"; }

# A component counts as "built" when its source dir exists in the package.
component_built() { [[ -d "$REPO_DIR/$COMPONENTS_PKG_DIR/src/$1" ]]; }

# Reconcile the progress file with what actually exists on disk, and echo the
# built count.
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
# Rules file — written ONCE at startup, referenced (not pasted) by every prompt.
# This is the same architecture/spec content the original pasted inline into
# every prompt; keeping it in a file the session reads on demand is the main
# per-iteration token saving.
# ----------------------------------------------------------------------------
write_rules_file() {
  {
    sed -e "s|__COMPONENTS_PKG_NAME__|$COMPONENTS_PKG_NAME|g" \
        -e "s|__COMPONENTS_PKG_DIR__|$COMPONENTS_PKG_DIR|g" <<'PREAMBLE'
# UI-kit build rules (read fully before touching any component)

You are growing an existing pnpm + Turborepo monorepo (`@knitui/*`) into a
cross-platform UI kit. The PUBLIC API mirrors Mantine's components (prop names,
variants, sizes, compound parts), but the IMPLEMENTATION is our own and is built
entirely on Tamagui. Tamagui handles web + native, so there is no react-native
primitive code to write — you compose our own `Box`/`Text` primitives.

ARCHITECTURE (do not deviate):
  - __COMPONENTS_PKG_NAME__ (dir __COMPONENTS_PKG_DIR__) holds ALL components,
    ONE FOLDER PER COMPONENT:
        __COMPONENTS_PKG_DIR__/src/<Name>/<Name>.tsx   (implementation)
        __COMPONENTS_PKG_DIR__/src/<Name>/index.ts      (export * from "./<Name>")
    and every component is re-exported from __COMPONENTS_PKG_DIR__/src/index.ts.
  - The two base primitives already live here and are the base for everything:
        src/Box   — `styled(View)` from @tamagui/core; carries the Mantine
                    style-prop shorthands (m, my, mx, mt, p, px, bg, c, fz, fw,
                    w, h, maw, mih, pos, …) and all native Tamagui style props.
        src/Text  — `styled(Text)` from @tamagui/core; the text base.
  - @knitui/core is the design-system FOUNDATION (Tamagui is internalized behind
    it). It exports the wrapped essentials you build with:
        styled, createStyledContext, withStaticProperties, GetProps,
        useTheme, Theme, getTokens/getTokenValue, AnimatePresence,
        Provider, useColorScheme, config, themes.
  - @knitui/hooks provides shared hooks (useId, useDisclosure, useMergedRef, …).

IMPORT BOUNDARY (strict):
  - Component files import ONLY from:
        `@knitui/core`  (styled, helpers, theme),
        `@knitui/hooks`,
        sibling component folders via relative paths (e.g. `../Box`, `../Text`,
        `../Spinner`), and
        a local `../internal/*` for shared helpers.
  - DO NOT import `tamagui` (the umbrella) anywhere. DO NOT import `@tamagui/*`
    in component files — the ONLY exceptions are the `Box`/`Text` primitives,
    which define themselves via `@tamagui/core`.

HOW TO BUILD A COMPONENT (idiomatic Tamagui):
  - Compose with `styled(Box, { … })` (or `styled(Text, …)` for text). Put
    layout/static styles in the styled() config; put variants in `variants`
    (e.g. `variant`, `size`, `radius`, boolean mods) with `defaultVariants`.
  - COLOR uses TAMAGUI's theming — NOT Mantine's color system. Do NOT add a
    Mantine-style `color` prop. Accent/color is selected via Tamagui's standard
    `theme` prop (`<Button theme="red" />`), which every styled component already
    accepts, and styles reference the active theme's palette ramp: `$color9` =
    solid accent, `$color1` = contrast text on it, `$color4`/`$color5` = subtle
    tints, `$color11` = accent text, `$color7` = borders, plus the semantic
    tokens `$background`/`$color`/`$borderColor`/`$placeholderColor`. NEVER
    hard-code palette hex per component.
  - STATES: use `hoverStyle` / `pressStyle` / `focusVisibleStyle` props and a
    `disabled` boolean variant. There is NO Interactive/Pressable wrapper and no
    runtime hover state — Tamagui resolves pseudo states (CSS on web, native
    press on native).
  - SIZES: build an explicit `size` variant scale (xs/sm/md/lg/xl) with concrete
    metrics, like the existing `Button`. Share `size`/`variant` down to
    sub-parts (label, sections) via `createStyledContext`.
  - COMPOUND PARTS (Card.Header, Menu.Item, Accordion.Item, …): assemble with
    `withStaticProperties`.
  - BEHAVIOUR (toggles, disclosure, controlled/uncontrolled): build from `Box` +
    React state + @knitui/hooks (see `src/Switch`, `src/Checkbox`,
    `src/internal/use-toggle.ts`). Do NOT reach for a react-native primitive.

HARD RULES:
  - Build the SAME component SET as Mantine, and mirror Mantine's PUBLIC prop API
    with Mantine's NAMES for everything EXCEPT color: `variant`, `size`, `radius`,
    the component's own props, compound sub-components, controlled/uncontrolled
    value props, and ref forwarding. COLOR is the one deliberate divergence — use
    Tamagui's `theme` prop + palette ramp (above), NOT a Mantine `color` prop. The
    look is theme-driven Tamagui, not a 1:1 visual clone.
  - FULL SPEC PER COMPONENT: "done" means every public prop, every variant, every
    size, all compound parts, ref forwarding, and a11y roles/labels are present.
    A bare/partial port does NOT count as built.
  - TYPING IS STRICT AND GATED. Every prop, variant, generic, return value and
    ref must be precisely typed. You MUST NOT use `any`, `as any`,
    `as unknown as`, `any[]`, `<any>`, or the suppression directives
    @ts-ignore / @ts-nocheck / @ts-expect-error — a post-typecheck strictness
    gate FAILS the iteration if YOUR changes INTRODUCE any of these, even when
    `tsc` itself passes. (A handful already exist in the tree and are baselined;
    leave them be — do not spend effort scrubbing pre-existing ones, just don't
    add new ones.) When a runtime value fights Tamagui's strict style
    typing, narrow it locally (a precise type) rather than widening the public
    API or suppressing the error.
  - Match the structure + style of the components already in
    __COMPONENTS_PKG_DIR__/src (study `Button`, `Card`, `Switch`, `Badge`).
  - FINISH EXISTING BEFORE STARTING NEW: before creating a brand-new component,
    audit the ones already in __COMPONENTS_PKG_DIR__/src against their Mantine
    spec and complete any gaps (missing props/variants/sizes/compound parts)
    FIRST.

DEMO SCREEN:
  - The shared demo screen is __DEMO_FILE__ (the __DEMO_PKG_NAME__ package). It is
    rendered by BOTH apps — Next.js (apps/web/app/page.tsx) and Expo
    (apps/example/App.tsx) — so it must stay cross-platform. The exported
    `DemoScreen` wraps its content in `<Provider>`; keep that wrapper intact.
  - In the demo, import EVERYTHING from __COMPONENTS_PKG_NAME__ only (components,
    `Box`, `Text`, `Provider`, `Theme`, `useColorScheme`). Do NOT import
    `@knitui/core`, `tamagui`, `@tamagui/*`, or from __COMPONENTS_PKG_DIR__/src
    directly. Reuse the existing `Section` helper + `Stack`/`Group` layout. No
    `any`. The screen stays one scrollable gallery that compiles + renders.
PREAMBLE
    # Patch in the demo placeholders the heredoc above used.
    echo
    echo "REFERENCES:"
    if [[ -n "${REF_COMPONENTS_DIR:-}" ]]; then
      echo "  - Mantine source (the PUBLIC prop API + behaviour to mirror):"
      echo "      $REF_COMPONENTS_DIR/<Name>"
      [[ -d "${TAMAGUI_REF:-}" ]] && \
      echo "  - Tamagui UI source (idiomatic cross-platform patterns): $TAMAGUI_REF/<name>"
      echo "  Read the Mantine folder for the prop surface, the matching Tamagui"
      echo "  folder for how to express it in Tamagui, then write OUR component on"
      echo "  Box/Text. Never copy Mantine's web DOM; never depend on the tamagui umbrella."
      echo "  Read ONLY the folders for the components you touch this iteration."
    else
      echo "  No local Mantine reference is available; implement each component from"
      echo "  your knowledge of Mantine's public API on top of Box/Text + @knitui/core."
    fi
  } > "$RULES_FILE.tmp"
  # Resolve the demo placeholders (kept literal in the heredoc so they survive sed above).
  sed -e "s|__DEMO_FILE__|$DEMO_FILE|g" \
      -e "s|__DEMO_PKG_NAME__|$DEMO_PKG_NAME|g" \
      -e "s|__COMPONENTS_PKG_NAME__|$COMPONENTS_PKG_NAME|g" \
      -e "s|__COMPONENTS_PKG_DIR__|$COMPONENTS_PKG_DIR|g" \
      "$RULES_FILE.tmp" > "$RULES_FILE"
  rm -f "$RULES_FILE.tmp"
}

# ----------------------------------------------------------------------------
# Prompt builders (short — they POINT at $RULES_FILE instead of inlining it).
# ----------------------------------------------------------------------------

# The whole iteration in ONE session: reflect → plan → execute → demo → check.
iterate_prompt() {  # $1=phase  $2=remaining list  $3=open-rec count
  local phase="$1" remaining="$2" open="$3"
  cat <<PROMPT
UI-KIT ITERATION — phase: $phase

FIRST read $RULES_FILE and follow it exactly (architecture, import boundary,
full-spec-per-component, strict typing, demo rules). It replaces a long inline
brief; do not ask for the rules again.

This is one iteration of a long-running loop. Persisted state:
  - Journal (past iterations):        $JOURNAL
  - Recommendations backlog:          $RECS_FILE
  - Previous plan:                     $PLAN_FILE
On disk: built components are folders under $COMPONENTS_PKG_DIR/src/<Name>/.
  - Missing vs. the Mantine set: $remaining
  - Open recommendations in the backlog: $open

Do ALL of the following in THIS one session, in order. Keep reads focused — only
open the reference/component/demo files you actually need; do NOT re-read the
whole tree.

  1. REFLECT — append a SHORT dated entry (a few lines) to $JOURNAL: what now
     exists on disk, and the most important quality gap you see.
  2. PLAN — overwrite $PLAN_FILE with a concrete single-iteration plan:
       - build phase   → ~$BATCH_SIZE new components from the missing list,
                         plus 1 small improvement to something already built.
       - improve phase → the highest-value open recommendations + parity / a11y /
                         theming / typing refinements to existing components.
     Name the exact files to touch and what "done" looks like.
  3. EXECUTE the plan. Before any NEW component, complete gaps in EXISTING ones
     against their full Mantine spec first. Each component is its own folder
     (<Name>/<Name>.tsx + index.ts), re-exported from $COMPONENTS_PKG_DIR/src/index.ts,
     built on Box/Text + @knitui/core, fully typed (no \`any\` leaks), theme-driven,
     with hover/press/focusVisible states + a \`disabled\` variant. If you address
     items in $RECS_FILE, tick them (\`- [ ]\` → \`- [x]\`).
  4. DEMO — update $DEMO_FILE so the components you added/improved this iteration
     are showcased (key variants, sizes, states, accent themes), per the demo
     rules in $RULES_FILE. Keep existing sections intact.
  5. Run \`$VALIDATE_CMD\` and fix any type errors YOU introduced before stopping.

Stay within the scope of $PLAN_FILE this iteration.
PROMPT
}

# Run at the END of a full cycle: review the whole kit and grow the backlog.
recommend_prompt() {  # $1 = cycle number
  local cycle="$1"
  cat <<PROMPT
CYCLE $cycle COMPLETE — GENERATE NEW RECOMMENDATIONS

Architecture rules: $RULES_FILE (read it if you haven't this session). Review the
ENTIRE kit in $COMPONENTS_PKG_DIR/src against Mantine and production-quality
cross-platform standards.

Read $RECS_FILE FIRST so you do not repeat items already listed (checked or
unchecked). Then append NEW, deduplicated ideas under a header line:
  "## Cycle $cycle recommendations"
one "- [ ] <actionable recommendation>" per line. Cover: missing components /
sub-components / variants vs. Mantine; inconsistent prop/type APIs; web+native
correctness and the import boundary; theming (palette ramp \$color1…\$color12),
accessibility, docs, and tests.

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
  [[ -n "${REF_COMPONENTS_DIR:-}" ]] && args+=(--add-dir "$MANTINE_REF")
  [[ -n "$MODEL" ]] && args+=(--model "$MODEL")
  [[ -n "$FALLBACK_MODEL" ]] && args+=(--fallback-model "$FALLBACK_MODEL")
  [[ -n "$MAX_TURNS" ]] && args+=(--max-turns "$MAX_TURNS")

  # `|| warn` keeps a non-zero claude exit from killing the loop (set -e).
  case "$STREAM" in
    pretty)
      # Stream events → raw .jsonl log → pretty-printer → terminal + readable log.
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
# Whitespace in the matched text is collapsed/trimmed so that pure reformatting
# (indentation, prettier) doesn't make a pre-existing hit look "new".
strict_hits_raw() {
  local targets=()
  [[ -d "$REPO_DIR/$COMPONENTS_PKG_DIR/src" ]] && targets+=("$REPO_DIR/$COMPONENTS_PKG_DIR/src")
  [[ -f "$DEMO_FILE" ]] && targets+=("$DEMO_FILE")
  [[ ${#targets[@]} -gt 0 ]] || return 0
  # Only TS sources; ignore generated declaration files.
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

# Diff-scoped strictness check: fail only on loose-typing hits that are NOT in
# the startup baseline. Prints the new offending file:line matches; returns
# non-zero when any new ones are found.
type_strictness_report() {
  local current new
  current="$(strict_hits_raw)" || true
  [[ -z "$current" ]] && return 0
  if [[ ! -f "$STRICT_BASELINE_FILE" ]]; then
    # No baseline captured (e.g. invoked standalone) — fall back to global scan.
    new="$current"
  else
    # Consume one baseline entry per matching current hit; the rest are new.
    new="$(printf '%s\n' "$current" | awk -F'\t' '
      NR == FNR { base[$0]++; next }                 # baseline pass: KEY -> count
      {
        key = $1; sub(/:[0-9]+$/, "", key); key = key FS $2;
        if (base[key] > 0) { base[key]--; next }     # tolerate one pre-existing
        print $0;                                    # surplus = newly introduced
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
  # tsc passed — now enforce strict typing on top of it.
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
  log "Using Mantine reference: $REF_COMPONENTS_DIR"
else
  log "No Mantine reference found under $MANTINE_REF — using built-in component list."
fi

# Write the rules file once, now that REF_COMPONENTS_DIR is known.
write_rules_file
log "Architecture rules written to $RULES_FILE (referenced by every prompt, not inlined)."

ALL_COMPONENTS=()
while IFS= read -r _c; do
  [[ -n "$_c" ]] && ALL_COMPONENTS+=("$_c")
done < <(component_list)
[[ ${#ALL_COMPONENTS[@]} -gt 0 ]] || die "Could not determine a component list."

total=${#ALL_COMPONENTS[@]}
log "Target: $total components. A build cycle completes at >= ${TARGET_FRACTION}% built."
log "Max iterations: $MAX_ITERATIONS | Max cycles: $MAX_CYCLES | Scope/iter: ~$BATCH_SIZE | Turn cap: ${MAX_TURNS:-none}"
log "Journal: $JOURNAL | Plan: $PLAN_FILE | Recommendations: $RECS_FILE"

if [[ "$DRY_RUN" == "1" ]]; then
  log "DRY_RUN — target components (build order):"
  printf '  %s\n' "${ALL_COMPONENTS[@]}"
  log "Rules file preview:"
  sed 's/^/  /' "$RULES_FILE"
  exit 0
fi

# Capture the strict-typing baseline once, so the gate only fails on NEW hits.
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
    # Backlog drained — close this cycle, start a new one with fresh ideas.
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
    # Everything built but below target rounding — treat as cycle done.
    phase="improve"
    continue
  fi

  # ---- Normal iteration: ONE session does reflect → plan → execute → demo --
  (( iteration++ ))
  ts="$(date +%Y%m%d-%H%M%S)"
  logfile="$LOG_DIR/iter-$(printf '%03d' "$iteration")-$ts.log"
  remaining="$(remaining_list)"
  log "Iteration $iteration (cycle $cycle/$phase): reflect → plan → execute → demo  (log: $logfile)"

  run_claude "$(iterate_prompt "$phase" "$remaining" "$open")" "$logfile"
  # Single validation gate per iteration (the one session changed both the
  # components and the demo), with bounded fix retries.
  validate_with_retries "iter $iteration" "$logfile" || true
done

built_count="$(sync_progress)"
log "Loop finished after $iteration iteration(s), $cycle cycle(s)."
log "$built_count/$total components built. Progress: $PROGRESS_FILE"
log "Reflection journal: $JOURNAL"
log "Open recommendations remaining: $(open_recs) (see $RECS_FILE)"
