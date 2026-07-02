// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel. Shared by the time-segment leaves (`SpinInput`, `AmPmInput`) so the
// web `.select()`-on-focus narrowing lives in one place (the same extraction
// pattern as `web-cursor`, `focus-element` and `has-prevent-default`).

import { isWeb } from "@knitui/core";

/** A web focus event whose target exposes `.select()` (text selection). */
interface SelectableFocusTarget {
  currentTarget?: { select?: () => void };
  target?: { select?: () => void };
}

/**
 * Select the whole field's text on focus so the next keystroke REPLACES it
 * rather than appending — Mantine does this with `event.currentTarget.select()`
 * and it is the single most important behaviour for the fixed-width time
 * segments (typing into an already-filled segment must overwrite, not append).
 *
 * Web-only: the native counterpart is the declarative `selectTextOnFocus` prop
 * on the RN `TextInput`, so on native this narrows nothing and returns. No DOM
 * types leak — the event is accepted as `unknown` and narrowed at runtime.
 */
export function selectAllOnFocus(event: unknown): void {
  if (!isWeb || typeof event !== "object" || event === null) {
    return;
  }
  const target =
    (event as SelectableFocusTarget).currentTarget ?? (event as SelectableFocusTarget).target;
  target?.select?.();
}
