/**
 * THE control-system contract — the stable, intentionally-small public surface
 * that sized/colored controls outside `@knitui/components` (notably `@knitui/media`)
 * share with the kit's own components.
 *
 * Everything here is a pure re-export of the canonical primitives that live in
 * `src/internal/` — the SAME tables Button/ActionIcon/Input/Menu derive from.
 * Exposing them here lets sibling packages size, color, and icon-wire their
 * controls against the one source of truth instead of re-declaring drifting
 * copies. There is **no behaviour** in this module; it is a barrel.
 *
 * Stability: treat these as public API. The shape is pinned by
 * `src/__tests__/control-system.test.ts`. Add to it deliberately.
 *
 *  - Size:   `SizeKey` / `SIZE_KEYS` / `DEFAULT_SIZE` / `controlMetrics` / `resolveSizePx`
 *  - Embed:  `toEmbeddedControlSize` (+ its key types) — step a nested control down one key
 *  - Icon:   `CONTROL_ICON_SIZE` / `controlIconSize` / `ControlIconProvider`
 *  - Color:  read-only variant ladders + `VARIANT_KEYS` / `VariantKey`
 */

// Icon sizing ladder + the provider that auto-sizes/colors icons in a control.
export { CONTROL_ICON_SIZE, controlIconSize } from "./internal/control-icon-size";

// Size scale — the sizing twin of the color ladders.
export {
  controlMetrics,
  DEFAULT_SIZE,
  resolveSizePx,
  SIZE_KEYS,
  type SizeKey,
} from "./internal/control-metrics";

export { ControlIconProvider, type ControlIconProviderProps } from "./internal/ControlIconProvider";
// Embedded-control step-down (a chip inside a field, a scrubber inside a bar).
export {
  type EmbeddableSizeKey,
  type EmbeddedControlSize,
  toEmbeddedControlSize,
} from "./internal/embedded-control-size";

// Color ladders — read-only; spread onto a frame's styled base. See
// `internal/variant-colors.ts` for the full table and design rationale.
export {
  VARIANT_FILL,
  VARIANT_FOREGROUND_EMPHASIS,
  VARIANT_FOREGROUND_MUTED,
  VARIANT_INTERACTION,
  VARIANT_KEYS,
  type VariantKey,
} from "./internal/variant-colors";
