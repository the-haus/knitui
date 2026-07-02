#!/usr/bin/env bash
#
# loop-improve-dates-kit.sh
# -------------------------
# Repeatedly invokes Claude Code (headless) to bring EACH existing @knitui/dates
# component up to the kit's gold standard — the reference component at
# packages/dates/src/_reference/ExampleControl.tsx and its 15-point checklist in
# packages/dates/src/_reference/README.md.
#
# This is the polish sibling of scripts/loop-build-dates-kit.sh. The build loop
# GROWS the package (adds components); this loop IMPROVES what already exists,
# one component per iteration, gated on typecheck + that component's jest test +
# a diff-scoped loose-typing check, and resumable from disk.
#
# How it works
#   1. Enumerates components from packages/dates/src — every `<Name>/<Name>.tsx`
#      (so `internal/`, `hooks/`, `utils/`, `_reference/` are skipped). The order
#      is alphabetical; override with COMPONENTS="Day MiniCalendar TimeGrid".
#   2. For each component not already in the progress file, Claude is told to
#      improve THAT ONE component (its .tsx + index + stories + test) toward the
#      reference checklist while preserving the public API / Mantine parity.
#   3. Validation gates each iteration: `pnpm --filter @knitui/dates typecheck`,
#      then `jest <Name>` for that component, then the strictness check. Failures
#      get up to RETRY_LIMIT bounded "fix it" retries; a component that still
#      fails is recorded in the progress file as FAILED and the loop moves on.
#   4. Progress is the set of components marked DONE/FAILED in PROGRESS_FILE, so
#      the loop is resumable — re-run it and it picks up where it stopped.
#
# Usage
#   scripts/loop-improve-dates-kit.sh                      # all components, live output
#   COMPONENTS="MiniCalendar Day" scripts/loop-improve-dates-kit.sh
#   MODEL=claude-opus-4-8 scripts/loop-improve-dates-kit.sh
#   DRY_RUN=1 scripts/loop-improve-dates-kit.sh            # list the plan, change nothing
#   STREAM=text scripts/loop-improve-dates-kit.sh          # final answers only
#
# Live + persisted output:
#   - Terminal shows readable activity in real time (STREAM=pretty, default).
#   - .dates-improve-logs/<Name>.log        readable transcript per component
#   - .dates-improve-logs/<Name>.log.jsonl  full raw stream-json for that component
#
# NOTE: runs Claude with --dangerously-skip-permissions so it can edit files and
# run builds unattended. Only run it in a repo/branch you trust.

set -euo pipefail

# ----------------------------------------------------------------------------
# Configuration (override any of these via environment variables)
# ----------------------------------------------------------------------------
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PKG_NAME="${PKG_NAME:-@knitui/dates}"
PKG_DIR="${PKG_DIR:-$REPO_DIR/packages/dates}"
SRC_DIR="${SRC_DIR:-$PKG_DIR/src}"

# The gold-standard the loop improves each component toward.
REFERENCE="${REFERENCE:-packages/dates/src/_reference/ExampleControl.tsx}"
CHECKLIST="${CHECKLIST:-packages/dates/src/_reference/README.md}"

# Optional vendored Mantine dates source — read-only parity reference for prop
# names / behavior. Added to Claude's allowed dirs when present.
DATES_REF="${DATES_REF:-$REPO_DIR/tmp/mantine/dates}"

PROGRESS_FILE="${PROGRESS_FILE:-$REPO_DIR/.dates-improve-progress}"
LOG_DIR="${LOG_DIR:-$REPO_DIR/.dates-improve-logs}"

RETRY_LIMIT="${RETRY_LIMIT:-2}"        # extra fix attempts per failing component
MODEL="${MODEL:-}"                     # e.g. claude-opus-4-8 ; empty = account default
FALLBACK_MODEL="${FALLBACK_MODEL:-}"   # e.g. claude-sonnet-4-6
DRY_RUN="${DRY_RUN:-0}"
STREAM="${STREAM:-pretty}"             # pretty | json | text

# Explicit component list (space-separated) overrides auto-discovery + order.
COMPONENTS="${COMPONENTS:-}"

VALIDATE_CMD="${VALIDATE_CMD:-pnpm --filter $PKG_NAME typecheck}"

# Diff-scoped loose-typing gate (same policy as loop-build-dates-kit.sh): reject
# NEW any/casts/suppressions an iteration introduces; pre-existing hits tolerated.
STRICT_TYPES="${STRICT_TYPES:-1}"
STRICT_TYPE_PATTERN="${STRICT_TYPE_PATTERN:-(\bas any\b|\bas unknown as\b|:[[:space:]]*any\b|\bany\[\]|<[[:space:]]*any[[:space:]]*[,>]|,[[:space:]]*any[[:space:]]*>|@ts-ignore|@ts-nocheck|@ts-expect-error)}"
STRICT_BASELINE_FILE="${STRICT_BASELINE_FILE:-$LOG_DIR/.strict-baseline}"

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
log()  { printf '\033[1;36m[improve]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[improve]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[improve]\033[0m %s\n' "$*" >&2; exit 1; }

command -v claude >/dev/null 2>&1 || die "claude CLI not found on PATH."
[[ -d "$SRC_DIR" ]] || die "package src not found: $SRC_DIR"
[[ -f "$REPO_DIR/$REFERENCE" ]] || die "reference not found: $REFERENCE (run after creating _reference/)"

mkdir -p "$LOG_DIR"
touch "$PROGRESS_FILE"

# Pretty streaming needs node; gracefully degrade if it's missing.
FORMATTER="$LOG_DIR/.stream-format.mjs"
if [[ "$STREAM" == "pretty" ]] && ! command -v node >/dev/null 2>&1; then
  warn "node not found — falling back to STREAM=text (final answers only)."
  STREAM="text"
fi
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
  try { ev = JSON.parse(line); } catch { console.log(dim(line)); return; }
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

# Discover components: every `<Name>/<Name>.tsx` under src (skips internal/, hooks/,
# utils/, _reference/, and any dir whose main file isn't named after the dir).
discover_components() {
  local d name
  for d in "$SRC_DIR"/*/; do
    name="$(basename "$d")"
    [[ -f "$d$name.tsx" ]] && printf '%s\n' "$name"
  done | sort -u
}

# Has this component already been resolved (DONE or FAILED) in a prior run?
is_resolved() { grep -qE "^(DONE|FAILED)[[:space:]]+$1$" "$PROGRESS_FILE" 2>/dev/null; }
mark()        { printf '%s\t%s\n' "$1" "$2" >> "$PROGRESS_FILE"; }  # $1=DONE|FAILED $2=Name

run_claude() {  # $1 = prompt, $2 = log file
  local prompt="$1" logfile="$2"
  local args=(-p --dangerously-skip-permissions)
  [[ -d "$DATES_REF" ]] && args+=(--add-dir "$DATES_REF")
  [[ -n "$MODEL" ]] && args+=(--model "$MODEL")
  [[ -n "$FALLBACK_MODEL" ]] && args+=(--fallback-model "$FALLBACK_MODEL")
  case "$STREAM" in
    pretty)
      args+=(--output-format stream-json --verbose)
      { ( cd "$REPO_DIR" && claude "${args[@]}" "$prompt" ) 2>&1 \
          | tee -a "$logfile.jsonl" | node "$FORMATTER" | tee -a "$logfile"; } \
          || warn "claude exited non-zero (raw: $logfile.jsonl)" ;;
    json)
      args+=(--output-format stream-json --verbose)
      { ( cd "$REPO_DIR" && claude "${args[@]}" "$prompt" ) 2>&1 | tee -a "$logfile"; } \
          || warn "claude exited non-zero (see $logfile)" ;;
    *)
      { ( cd "$REPO_DIR" && claude "${args[@]}" "$prompt" ) 2>&1 | tee -a "$logfile"; } \
          || warn "claude exited non-zero (see $logfile)" ;;
  esac
}

# --- diff-scoped loose-typing gate (mirrors loop-build-dates-kit.sh) ----------
strict_hits_raw() {
  [[ -d "$SRC_DIR" ]] || return 0
  grep -rnE "$STRICT_TYPE_PATTERN" --include='*.ts' --include='*.tsx' "$SRC_DIR" 2>/dev/null \
    | grep -vE '\.d\.ts:' \
    | awk -v root="$REPO_DIR/" '
        { p=index($0,":"); path=substr($0,1,p-1); rest=substr($0,p+1);
          q=index(rest,":"); lineno=substr(rest,1,q-1); content=substr(rest,q+1);
          if (substr(path,1,length(root))==root) path=substr(path,length(root)+1);
          gsub(/[ \t]+/," ",content); gsub(/^ +| +$/,"",content);
          printf "%s:%s\t%s\n", path, lineno, content; }'
}
type_strictness_report() {
  local current new
  current="$(strict_hits_raw)" || true
  [[ -z "$current" ]] && return 0
  if [[ ! -f "$STRICT_BASELINE_FILE" ]]; then new="$current"; else
    new="$(printf '%s\n' "$current" | awk -F'\t' '
      NR==FNR { base[$0]++; next }
      { key=$1; sub(/:[0-9]+$/,"",key); key=key FS $2;
        if (base[key]>0) { base[key]--; next } print $0; }' "$STRICT_BASELINE_FILE" -)"
  fi
  [[ -z "$new" ]] && return 0
  printf 'TYPE STRICTNESS CHECK FAILED — a NEW loose-typing escape hatch was introduced.\n'
  printf 'Replace each with a precise type. No any, `as any`, `as unknown as`, any[], <any>,\n'
  printf 'or @ts-ignore/@ts-nocheck/@ts-expect-error. Narrow locally instead.\n\n%s\n' "$new"
  return 1
}

# Validate the whole package typecheck + a single component's jest, + strict gate.
validate() {  # $1 = component name; writes report to stdout, returns non-zero on failure
  local name="$1" out rc=0
  out="$( cd "$REPO_DIR" && eval "$VALIDATE_CMD" 2>&1 )" || rc=$?
  printf '%s\n' "$out"
  (( rc != 0 )) && return "$rc"
  out="$( cd "$REPO_DIR" && pnpm --filter "$PKG_NAME" exec jest "src/$name/" 2>&1 )" || rc=$?
  printf '%s\n' "$out"
  (( rc != 0 )) && return "$rc"
  if [[ "$STRICT_TYPES" == "1" ]]; then
    local strict_out
    strict_out="$(type_strictness_report)" || { printf '%s\n' "$strict_out"; return 1; }
  fi
  return 0
}

# ----------------------------------------------------------------------------
# Prompts
# ----------------------------------------------------------------------------
improve_prompt() {  # $1 = component name
  local name="$1"
  local ref_note=""
  [[ -d "$DATES_REF" ]] && ref_note="A vendored Mantine dates checkout is available at $DATES_REF (read-only) — consult it for prop-name / behavior parity."
  cat <<PROMPT
You are improving ONE component in the $PKG_NAME package: **$name**.

Goal: bring \`packages/dates/src/$name/\` up to the kit's gold standard WITHOUT
changing its public API or breaking @mantine/dates parity.

READ FIRST (the gold standard + its 15-point checklist):
  - $REFERENCE
  - $CHECKLIST
Then read the component you are improving and its siblings:
  - packages/dates/src/$name/$name.tsx
  - packages/dates/src/$name/index.ts, $name.stories.tsx, $name.test.tsx (if present)
$ref_note

Apply the checklist to $name. Typical work, only where it genuinely applies:
  - Sizing from the shared cell-metrics ladders (no magic numbers).
  - Theme-ramp colors only (\$colorN / semantic neutrals); never hex, never a \`color\` prop.
  - createStyledContext to share \`size\` across parts; .styleable + forwarded ref.
  - Per-slot \`styles\` sugar (\`SlotStyles\` + \`slotStyles().merge\` from @knitui/core)
    AND/OR the per-item \`getXxxProps\` passthrough, with "explicit beats sugar" precedence.
  - withStaticProperties exposing parts (+ marker slots where composition helps).
  - Controlled/uncontrolled via useUncontrolled; locale via useDatesContext; min/max utils.
  - Web + native a11y set side-by-side (internal/a11y controlA11yProps + aria-*).
  - COMPILER-SAFE styling: never a dynamic \`opacity={cond ? x : 0}\` / \`display\` style
    prop (the Tamagui compiler flattens \`._o-0 {opacity:0}\` onto the whole cell and
    blanks it). Toggle text content or a boolean variant; bake constant dims in.

HARD CONSTRAINTS:
  - Do NOT rename or remove public props, change defaults, or drop features (Mantine parity).
  - Cross-platform: web + native from one source. No react-native-web-only APIs.
  - NO loose typing: no any, \`as any\`, \`as unknown as\`, any[], <any>, or
    @ts-ignore/@ts-nocheck/@ts-expect-error. Narrow locally.
  - Touch ONLY \`packages/dates/src/$name/\` (and add a needed shared internal only if
    unavoidable). Do not edit other components or reorder the public barrel.
  - Keep/extend the stories and tests so the new behavior is covered.

When done, run \`$VALIDATE_CMD\` and \`pnpm --filter $PKG_NAME exec jest src/$name/\`
and fix anything that fails. Report what you changed against the checklist.
PROMPT
}

fix_prompt() {  # $1 = component name, $2 = validation output
  local name="$1" out="$2"
  cat <<PROMPT
The validation for **$name** failed. Fix it WITHOUT relaxing the constraints from
the improve step (no loose typing, no public-API changes, touch only
packages/dates/src/$name/). Then re-run \`$VALIDATE_CMD\` and
\`pnpm --filter $PKG_NAME exec jest src/$name/\` until both pass.

--- validation output (truncated) ---
$(printf '%s\n' "$out" | tail -n 120)
PROMPT
}

# ----------------------------------------------------------------------------
# Main loop
# ----------------------------------------------------------------------------
ALL=()
if [[ -n "$COMPONENTS" ]]; then
  read -r -a ALL <<< "$COMPONENTS"
else
  # bash 3.2 (macOS) has no mapfile — read line-by-line instead.
  while IFS= read -r name; do [[ -n "$name" ]] && ALL+=("$name"); done < <(discover_components)
fi
[[ ${#ALL[@]} -gt 0 ]] || die "no components discovered under $SRC_DIR"

# Snapshot the loose-typing baseline once (so the gate only fails on NEW hits).
if [[ "$STRICT_TYPES" == "1" && ! -f "$STRICT_BASELINE_FILE" ]]; then
  strict_hits_raw > "$STRICT_BASELINE_FILE" || true
  log "strict-types baseline: $(wc -l < "$STRICT_BASELINE_FILE" | tr -d ' ') pre-existing hit(s)."
fi

pending=()
for name in "${ALL[@]}"; do is_resolved "$name" || pending+=("$name"); done

log "package:    $PKG_NAME"
log "reference:  $REFERENCE"
log "components: ${#ALL[@]} total, ${#pending[@]} pending (rest already DONE/FAILED in $PROGRESS_FILE)"
log "model:      ${MODEL:-account default}   stream: $STREAM"

if [[ "$DRY_RUN" == "1" ]]; then
  log "DRY_RUN=1 — would improve, in order:"
  printf '  - %s\n' "${pending[@]}"
  exit 0
fi

for name in "${pending[@]}"; do
  logfile="$LOG_DIR/$name.log"
  : > "$logfile"; : > "$logfile.jsonl"
  log "━━━ improving $name ━━━  (log: $logfile)"

  run_claude "$(improve_prompt "$name")" "$logfile"

  attempt=0
  while true; do
    vout="$(validate "$name" 2>&1)" && { log "✓ $name passed validation"; mark DONE "$name"; break; }
    (( attempt++ ))
    if (( attempt > RETRY_LIMIT )); then
      warn "✗ $name still failing after $RETRY_LIMIT retries — marking FAILED, moving on."
      mark FAILED "$name"; break
    fi
    log "… $name validation failed — fix attempt $attempt/$RETRY_LIMIT"
    run_claude "$(fix_prompt "$name" "$vout")" "$logfile"
  done
done

done_n="$(grep -cE '^DONE'   "$PROGRESS_FILE" 2>/dev/null || true)"
fail_n="$(grep -cE '^FAILED' "$PROGRESS_FILE" 2>/dev/null || true)"
log "finished — $done_n DONE, $fail_n FAILED. Re-run to retry FAILED (remove their lines from $PROGRESS_FILE first)."
