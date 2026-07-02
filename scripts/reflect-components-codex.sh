#!/usr/bin/env bash
#
# reflect-components-codex.sh
# ---------------------------
# Resumable Codex loop for auditing existing @knitui/components components against
# the documentation in docs/ and making scoped improvements where useful.
#
# The script discovers component folders under packages/components/src, invokes
# `codex exec` on a small batch, asks Codex to reflect against the docs,
# improve only what is defensible, then runs targeted validation for the touched
# component folder(s). Progress is persisted so the loop can be stopped/resumed.
#
# Usage:
#   scripts/reflect-components-codex.sh
#   BATCH_SIZE=2 scripts/reflect-components-codex.sh
#   ONLY="Button,ActionIcon,Loader" scripts/reflect-components-codex.sh
#   RECHECK=1 ONLY="Button" scripts/reflect-components-codex.sh
#   DRY_RUN=1 scripts/reflect-components-codex.sh
#
# Useful environment variables:
#   BATCH_SIZE=1                number of components per Codex session
#   MAX_ITERATIONS=999          max sessions to run
#   ONLY=""                     comma-separated component subset
#   RECHECK=0                   ignore progress when 1
#   RESET_PROGRESS=0            clear progress before starting when 1
#   MODEL=""                    pass a Codex model, e.g. gpt-5-codex
#   CODEX_PROFILE=""            pass a Codex profile
#   CODEX_SANDBOX=workspace-write
#   CODEX_APPROVAL=never
#   CODEX_DANGER=0              set 1 to bypass approvals/sandbox
#   RUN_LINT=1                  eslint component-local files
#   RUN_TEST=1                  run matching Jest tests when present
#   RUN_TYPECHECK=0             off by default because repo-wide typecheck may
#                               be blocked by unrelated existing errors
#   TYPECHECK_CMD="pnpm --filter @knitui/components typecheck"
#   RETRY_LIMIT=1               ask Codex to fix validation failures this many times
#   STREAM=json                 pass --json to codex exec and store JSONL logs
#   DRY_RUN=0                   print planned batches without running Codex

set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
COMPONENTS_PKG_NAME="${COMPONENTS_PKG_NAME:-@knitui/components}"
COMPONENTS_PKG_DIR="${COMPONENTS_PKG_DIR:-packages/components}"
DOCS_DIR="${DOCS_DIR:-$REPO_DIR/docs}"

LOG_DIR="${LOG_DIR:-$REPO_DIR/.component-reflect-logs}"
PROGRESS_FILE="${PROGRESS_FILE:-$REPO_DIR/.component-reflect-progress}"
JOURNAL_FILE="${JOURNAL_FILE:-$REPO_DIR/.component-reflect-journal.md}"

BATCH_SIZE="${BATCH_SIZE:-1}"
MAX_ITERATIONS="${MAX_ITERATIONS:-999}"
ONLY="${ONLY:-}"
RECHECK="${RECHECK:-0}"
RESET_PROGRESS="${RESET_PROGRESS:-0}"
DRY_RUN="${DRY_RUN:-0}"

MODEL="${MODEL:-}"
CODEX_PROFILE="${CODEX_PROFILE:-}"
CODEX_SANDBOX="${CODEX_SANDBOX:-workspace-write}"
CODEX_APPROVAL="${CODEX_APPROVAL:-never}"
CODEX_DANGER="${CODEX_DANGER:-0}"
CODEX_EXTRA_ARGS="${CODEX_EXTRA_ARGS:-}"
STREAM="${STREAM:-text}"

RUN_LINT="${RUN_LINT:-1}"
RUN_TEST="${RUN_TEST:-1}"
RUN_TYPECHECK="${RUN_TYPECHECK:-0}"
TYPECHECK_CMD="${TYPECHECK_CMD:-pnpm --filter @knitui/components typecheck}"
RETRY_LIMIT="${RETRY_LIMIT:-1}"

log()  { printf '\033[1;36m[reflect]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[reflect]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[reflect]\033[0m %s\n' "$*" >&2; exit 1; }

command -v codex >/dev/null 2>&1 || die "codex CLI not found on PATH."
[[ -d "$DOCS_DIR" ]] || die "Docs dir not found: $DOCS_DIR"
[[ -d "$REPO_DIR/$COMPONENTS_PKG_DIR/src" ]] || die "Components src dir not found: $COMPONENTS_PKG_DIR/src"

docs_files() {
  find "$DOCS_DIR" -maxdepth 1 -type f -name '*.md' | sort
}

[[ -n "$(docs_files)" ]] || die "No .md docs found in: $DOCS_DIR"

mkdir -p "$LOG_DIR"
touch "$PROGRESS_FILE" "$JOURNAL_FILE"

if [[ "$RESET_PROGRESS" == "1" ]]; then
  : > "$PROGRESS_FILE"
fi

component_exists() {
  local name="$1"
  [[ -d "$REPO_DIR/$COMPONENTS_PKG_DIR/src/$name" ]]
}

discover_components() {
  find "$REPO_DIR/$COMPONENTS_PKG_DIR/src" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; \
    | grep -E '^[A-Z]' \
    | sort
}

only_components() {
  printf '%s\n' "$ONLY" \
    | tr ',' '\n' \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
    | awk 'NF'
}

is_done() {
  local name="$1"
  [[ "$RECHECK" == "0" ]] && grep -qxF "$name" "$PROGRESS_FILE"
}

mark_done() {
  local name="$1"
  grep -qxF "$name" "$PROGRESS_FILE" || printf '%s\n' "$name" >> "$PROGRESS_FILE"
}

join_by_comma() {
  local first=1 item
  for item in "$@"; do
    if [[ "$first" == "1" ]]; then
      printf '%s' "$item"
      first=0
    else
      printf ', %s' "$item"
    fi
  done
}

component_files_for_prompt() {
  local name="$1"
  local dir="$COMPONENTS_PKG_DIR/src/$name"
  printf '%s\n' \
    "$dir/$name.tsx" \
    "$dir/index.ts" \
    "$dir/$name.stories.tsx" \
    "$dir/$name.test.tsx"
}

existing_component_files() {
  local name="$1"
  local dir="$REPO_DIR/$COMPONENTS_PKG_DIR/src/$name"
  [[ -d "$dir" ]] || return 0
  find "$dir" -maxdepth 1 -type f \( -name '*.ts' -o -name '*.tsx' \) -print | sort
}

component_eslint_args() {
  local name="$1"
  local f rel
  while IFS= read -r f; do
    rel="${f#"$REPO_DIR/$COMPONENTS_PKG_DIR/"}"
    printf '%s\n' "$rel"
  done < <(existing_component_files "$name")
}

run_codex() {
  local prompt="$1"
  local logfile="$2"
  local args=(exec --cd "$REPO_DIR")

  if [[ "$CODEX_DANGER" == "1" ]]; then
    args+=(--dangerously-bypass-approvals-and-sandbox)
  else
    # `codex exec` (non-interactive) has no `--ask-for-approval` flag; the
    # approval policy is only settable via a config override.
    args+=(--sandbox "$CODEX_SANDBOX")
    [[ -n "$CODEX_APPROVAL" ]] && args+=(-c "approval_policy=\"$CODEX_APPROVAL\"")
  fi

  [[ -n "$MODEL" ]] && args+=(--model "$MODEL")
  [[ -n "$CODEX_PROFILE" ]] && args+=(--profile "$CODEX_PROFILE")
  [[ "$STREAM" == "json" ]] && args+=(--json)

  # shellcheck disable=SC2206
  local extra=( $CODEX_EXTRA_ARGS )
  if (( ${#extra[@]} > 0 )); then
    args+=("${extra[@]}")
  fi

  printf '%s\n' "$prompt" | codex "${args[@]}" - 2>&1 | tee "$logfile"
}

build_prompt() {
  local batch_csv="$1"
  local batch_lines="$2"
  cat <<PROMPT
You are auditing and improving existing components in $COMPONENTS_PKG_NAME.

Read and follow ALL documentation in this folder first:
  $DOCS_DIR
$(docs_files | sed "s#^$DOCS_DIR/#  - #")
Treat every file as authoritative; where a template and the specification overlap,
the worked examples in the template show the exact shape to match.

Components in scope for this pass:
$batch_lines

For each scoped component:
1. Read the implementation, index, story, and test files if present:
$(while IFS= read -r component; do component_files_for_prompt "$component"; done <<< "$batch_lines" | sed 's/^/   - /')
2. Reflect against the specification:
   - Tamagui import boundary and Box/Text composition.
   - GetProps-derived public props and Omit for collisions.
   - styleable ref forwarding.
   - withStaticProperties for subparts.
   - token-first sizing for EVERY axis — height, width, and square dimensions
     resolve against the \$ size scale (height: "\$md"), padding/gap/offsets
     against the space scale, radius against the radius scale, text against the
     fontSize scale. See the "Sizing" section of the specification.
   - the full seven-step size scale (xxs, xs, sm, md, lg, xl, xxl) on the size
     variant unless the component has a strong documented reason not to.
   - Tamagui v2 prop names. The host-element prop is \`render\` (NOT the v1 \`tag\`):
     use \`render="ul"\` / \`render={\\\`h\${order}\\\`}\` directly — it is a typed
     first-class prop, so no \`tagProps\` helper, spread object, or cast is needed.
     There is no \`tagProps\` helper; do not reintroduce one. The transition type is
     \`TransitionProp\` (v1's \`AnimationProp\` is gone) and the prop is \`transition\`,
     not \`animation\`. For \`render="a"\`, prefer the \`Anchor\` component.
   - no public Mantine-style color prop.
   - accessibility roles, labels, aria/accessibility state.
   - controlled/uncontrolled behavior where applicable.
   - stories/tests matching the public API.
3. Improve only when the change is clear, scoped, and low-risk. Prefer:
   - replacing raw numeric height/width/dimension values with \$ size tokens, raw
     spacing with space tokens, raw radius with radius tokens, raw font sizes with
     fontSize tokens. Converting a hardcoded control metric to its prescribed token
     is expected here and is NOT a visual redesign — do not skip it.
   - removing any Record<Size, number> metric maps (e.g. ICON sizes, height/width
     tables); map those keys to \$ size tokens instead. Support arbitrary custom
     sizes only through a functional variant, never a Record<Size, number>. Prefer the
     shared helpers in internal/style-props over a hand-rolled ":number"/":string"
     branch: spread squareSizeVariant for square width+height, gapVariant for spacing,
     maxWidthVariant for size caps, fontSizePassthroughVariant for plain font-size
     pass-through; assign radiusVariant/alignVariant/justifyVariant/wrapVariant/
     overflowVariant and the text helpers (fontWeight/textAlign/textTransform/textWrap)
     directly. Only hand-roll a branch when no helper fits.
   - extending a partial size scale (e.g. xs..xl) up to the full seven steps.
   - migrating any leftover v1 host-element \`tag\` usage to the v2 \`render\` prop
     (\`{...tagProps("p")}\` or \`tag="p"\` becomes \`render="p"\`); delete the now-dead
     \`tagProps\` import/helper. Update tests that query \`[tag="x"]\` to query the real
     host element (e.g. \`querySelector("ul")\`), since \`render\` emits a real element.
   - fixing stale prop names, stale docs, missing ref forwarding, missing exports,
     and obvious accessibility gaps;
   - adding or tightening focused tests/stories when the component behavior changes.
4. Do not perform broad visual redesigns or unrelated refactors. Swapping a raw
   numeric metric for its prescribed token does not count as a redesign.
5. Do not use any, as any, as unknown as, any[], <any>, @ts-ignore, @ts-nocheck,
   or @ts-expect-error.
6. Preserve user work. Do not revert unrelated changes.

Append a short dated entry to:
  $JOURNAL_FILE
Include:
  - components reviewed: $batch_csv
  - changes made, or "no code changes needed"
  - any token-system gaps that should be handled in @knitui/core

Before finishing, run targeted validation for files you changed where practical:
  - eslint for touched component files
  - matching Jest tests for the component when tests exist
If validation is blocked by unrelated existing repo errors, note that clearly.
PROMPT
}

build_fix_prompt() {
  local batch_csv="$1"
  local validation_output="$2"
  cat <<PROMPT
The validation step failed after the Codex reflection pass for:
  $batch_csv

Fix the root cause only in the scoped component files. Keep the component aligned
with the documentation in $DOCS_DIR. Do not silence errors with any, as any, as unknown as, any[],
<any>, @ts-ignore, @ts-nocheck, or @ts-expect-error.

Validation output:

$validation_output
PROMPT
}

validate_batch() {
  local output_file="$1"
  shift
  local components=("$@")
  : > "$output_file"

  if [[ "$RUN_LINT" == "1" ]]; then
    local lint_args=()
    local component arg
    for component in "${components[@]}"; do
      while IFS= read -r arg; do
        lint_args+=("$arg")
      done < <(component_eslint_args "$component")
    done
    if (( ${#lint_args[@]} > 0 )); then
      log "eslint ${components[*]}"
      if ! (cd "$REPO_DIR/$COMPONENTS_PKG_DIR" && pnpm exec eslint "${lint_args[@]}") >> "$output_file" 2>&1; then
        return 1
      fi
    fi
  fi

  if [[ "$RUN_TEST" == "1" ]]; then
    local component test_file
    for component in "${components[@]}"; do
      test_file="$REPO_DIR/$COMPONENTS_PKG_DIR/src/$component/$component.test.tsx"
      [[ -f "$test_file" ]] || continue
      log "jest $component"
      if ! (cd "$REPO_DIR" && pnpm --filter "$COMPONENTS_PKG_NAME" test "$component" --runInBand) >> "$output_file" 2>&1; then
        return 1
      fi
    done
  fi

  if [[ "$RUN_TYPECHECK" == "1" ]]; then
    log "typecheck"
    if ! (cd "$REPO_DIR" && bash -lc "$TYPECHECK_CMD") >> "$output_file" 2>&1; then
      return 1
    fi
  fi

  return 0
}

collect_worklist() {
  local all=()
  local name

  if [[ -n "$ONLY" ]]; then
    while IFS= read -r name; do
      component_exists "$name" || die "Unknown component in ONLY: $name"
      all+=("$name")
    done < <(only_components)
  else
    while IFS= read -r name; do
      all+=("$name")
    done < <(discover_components)
  fi

  for name in "${all[@]}"; do
    is_done "$name" && continue
    printf '%s\n' "$name"
  done
}

WORKLIST=()
while IFS= read -r component_name; do
  WORKLIST+=("$component_name")
done < <(collect_worklist)

if (( ${#WORKLIST[@]} == 0 )); then
  log "No components to process. Use RECHECK=1 to audit completed components again."
  exit 0
fi

log "Docs: $DOCS_DIR"
log "Components queued: ${#WORKLIST[@]}"
log "Logs: $LOG_DIR"

if [[ "$DRY_RUN" == "1" ]]; then
  printf '%s\n' "${WORKLIST[@]}"
  exit 0
fi

iteration=0
index=0

while (( index < ${#WORKLIST[@]} && iteration < MAX_ITERATIONS )); do
  iteration=$((iteration + 1))
  batch=()

  for (( i = 0; i < BATCH_SIZE && index < ${#WORKLIST[@]}; i++ )); do
    batch+=("${WORKLIST[$index]}")
    index=$((index + 1))
  done

  batch_csv="$(join_by_comma "${batch[@]}")"
  batch_lines="$(printf '%s\n' "${batch[@]}")"
  stamp="$(date +%Y%m%d-%H%M%S)"
  logfile="$LOG_DIR/iter-$(printf '%03d' "$iteration")-$stamp.log"
  validation_file="$LOG_DIR/iter-$(printf '%03d' "$iteration")-$stamp.validation.log"

  log "iteration $iteration: $batch_csv"

  prompt="$(build_prompt "$batch_csv" "$batch_lines")"
  if ! run_codex "$prompt" "$logfile"; then
    warn "codex exited non-zero for $batch_csv; see $logfile"
  fi

  attempt=0
  until validate_batch "$validation_file" "${batch[@]}"; do
    attempt=$((attempt + 1))
    warn "validation failed for $batch_csv; see $validation_file"
    if (( attempt > RETRY_LIMIT )); then
      die "retry limit exceeded for $batch_csv"
    fi
    fix_logfile="$LOG_DIR/iter-$(printf '%03d' "$iteration")-$stamp-fix-$attempt.log"
    fix_prompt="$(build_fix_prompt "$batch_csv" "$(cat "$validation_file")")"
    if ! run_codex "$fix_prompt" "$fix_logfile"; then
      warn "codex fix attempt exited non-zero for $batch_csv; see $fix_logfile"
    fi
  done

  for component in "${batch[@]}"; do
    mark_done "$component"
  done
  log "done: $batch_csv"
done

remaining=$(( ${#WORKLIST[@]} - index ))
if (( remaining > 0 )); then
  warn "stopped after MAX_ITERATIONS=$MAX_ITERATIONS with $remaining queued components remaining."
else
  log "all queued components processed."
fi
