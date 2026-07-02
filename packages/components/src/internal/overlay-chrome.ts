import { type SlotAccessor, slotStyles, type SlotStyles } from "./styles";

/**
 * Shared per-slot chrome resolver for the FLOATING family (`Popover` / `Tooltip` /
 * `HoverCard` / `Menu`) — the overlay analog of {@link resolveModalChromeSlots}
 * (`Modal/modal-base.tsx`), which does the same job for the Modal/Drawer family.
 *
 * Each of these components used to roll its own ad-hoc `slotStyles(…)` call plus a
 * bespoke `s.merge("overlay", overlayProps)` line for the deprecated alias. This
 * hoists that into ONE place so the slot vocabulary and the kit's "explicit beats
 * sugar" precedence are defined once, not re-derived per component.
 *
 * ## Canonical floating slot vocabulary
 *
 * `overlay` (the scrim), `dropdown` (the floating frame), `arrow` (the pointer).
 * Components layer their own extra slots (e.g. Menu's `item`/`label`/`divider`,
 * Tooltip's `label`/`text`, HoverCard's `target`) on top via the `M` type
 * parameter — the canonical three are always part of the dev-warning vocabulary,
 * the extras are passed in by the caller.
 *
 * ## Precedence — "explicit beats sugar" (the ONE rule)
 *
 * Mirrors `internal/styles.ts`, low → high:
 *
 *   defaults  <  styles[slot]  <  explicit xxxProps  <  inline props on a composed part
 *
 * - `get(slot)` reads a slot's sugar for parts with no competing explicit prop;
 *   spread it UNDER the part's inline props at the call site.
 * - `merge(slot, explicit)` layers the slot sugar UNDER a deprecated `xxxProps`
 *   alias (e.g. `overlayProps`), so the explicit alias wins — use it to migrate a
 *   legacy raw prop to a `@deprecated` alias of its slot.
 *
 * The returned `getter` is the same shape `slotStyles` yields, so call sites that
 * already use `s.get`/`s.merge` adopt this with no change beyond the constructor.
 */

/** The three slot keys every floating overlay shares. */
export const OVERLAY_CHROME_SLOTS = ["overlay", "dropdown", "arrow"] as const;

/** A canonical floating-chrome slot key. */
export type OverlayChromeSlot = (typeof OVERLAY_CHROME_SLOTS)[number];

/**
 * Build a typed slot accessor for a floating overlay's `styles` map. `M` is the
 * component's own slot→props map (it must include the canonical `overlay`/
 * `dropdown`/`arrow` keys where the component renders them, plus any extras).
 *
 * `extraSlots` are the component-specific slot keys beyond the canonical three
 * (e.g. Menu's `item`/`label`/`divider`); they join the dev-warning vocabulary so
 * an unknown-slot typo still warns. Pass `[]` when the component only uses the
 * canonical slots.
 *
 * Not a React hook in the rules-of-hooks sense (it calls no hooks), but named
 * `useOverlayChrome` to read naturally at the top of a component body and to match
 * the family's call-site convention; safe to call unconditionally during render.
 */
export function useOverlayChrome<M>(
  styles: SlotStyles<M> | undefined,
  extraSlots: readonly (keyof M & string)[],
  displayName: string,
): SlotAccessor<M> {
  // The canonical three are always part of the known-slot vocabulary so the
  // dev-warning recognises them; the component layers its extras on top. The
  // canonical keys are statically members of `OverlayChromeSlot`; the narrowing to
  // `keyof M & string` is the documented bridge (the component's `M` declares them,
  // see `internal/styles.ts` / `Modal/modal-base.tsx` for the same pattern) — a floating
  // overlay's slot map is expected to carry the canonical keys it renders.
  const knownSlots = [...(OVERLAY_CHROME_SLOTS as readonly string[]), ...extraSlots] as (keyof M &
    string)[];
  return slotStyles<M>(styles, knownSlots, displayName);
}
