// ───────────────────────────────────────────────────────────────────────────
// LevelsGroup — mirrors the `@mantine/dates` `LevelsGroup` API, built on
// `@knitui/components` (`Box`) + `@knitui/core` (`styled`/`withStaticProperties`).
// It is the side-by-side FRAME that holds `numberOfColumns` calendar levels —
// the flex-row layout that `MonthLevelGroup`/`YearLevelGroup`/`DecadeLevelGroup`
// each wrap. Mantine's `.levelsGroup` is a flex row with a fixed gap and a
// `data-full-width` stretch modifier; this is the cross-platform twin.
//
// Cross-platform: web + native from this single source. The root is the
// `styled(Box)` frame (never an HTML `<div>`) so it lays out and styles
// identically everywhere; no react-native-web-only API is used.
//
// On the kit checklist (see `_reference/README.md`), LevelsGroup is a PURE
// LAYOUT FRAME — it OWNS NO CELLS and renders no consumer-composed sub-regions,
// so most leaf-styling rules live DOWNSTREAM and intentionally do NOT live here:
//   - #2 shared `size` context, #3 derived `cell-metrics` cell sizing, #4
//     theme-ramp colors, #12 hover/press/disabled interaction live in the level
//     parts (`MonthLevel`/`YearsList`/`PickerControl`/`CalendarHeader`) that this
//     frame composes — LevelsGroup renders no cells, so it carries no `size`
//     context (it forwards `size` to the levels, which own the variant).
//   - #6 marker slots are not introduced: a group is layout with no composed
//     sub-regions of its own (parity with Mantine, which renders only its
//     children). #7 per-slot `styles`/per-item passthrough and #8 value/#9
//     locale/#10 bounds belong to the data-driven group wrappers, not this frame.
// What this frame DOES carry: provenance header (#1); the `styled(Box)` root
// Frame (#5); the `fullWidth` stretch as a boolean VARIANT, not a dynamic style
// prop, which is the compiler-safe form (#15 — no `._o-0`-style dynamic flatten);
// `.styleable` ref + style-prop forwarding to the root (#13); the styled Frame
// exposed via `withStaticProperties` (#14). A11y (#11) is deliberately
// FORWARDABLE rather than baked: Mantine's `LevelsGroup` carries no role of its
// own, and the callers pass `role="group"` (see `DecadeLevelGroup`), so the role
// flows through unchanged via `{...rest}` and is not hard-coded here.
// ───────────────────────────────────────────────────────────────────────────
import { Box } from "@knitui/components";
import { type GetProps, styled, withStaticProperties } from "@knitui/core";

import { type CalendarSize, CELL_SPACING } from "../cell-metrics";

/**
 * The flex-row frame that lays calendar levels side by side. Mirrors Mantine's
 * `.levelsGroup` (a flex row with a gap between columns) — here a `styled(Box)`
 * so it renders identically on web + native, never an HTML `<div>`. The
 * `fullWidth` boolean variant maps Mantine's `data-full-width` (stretch each
 * column to an equal share of the container).
 */
const LevelsGroupFrame = styled(Box, {
  name: "LevelsGroup",
  flexDirection: "row",
  // A small fixed gap between adjacent level columns, matching the calendar's
  // shared cell spacing so columns read as one calendar (Mantine uses a fixed
  // `var(--_levels-group-gap)` here).
  columnGap: CELL_SPACING * 4,

  variants: {
    /** Stretch the group (and so each column) to the full container width. */
    fullWidth: {
      true: { flex: 1, width: "100%" },
    },
  } as const,

  defaultVariants: { fullWidth: false },
});

// The frame's own style props flow through, minus `size` (a passthrough this
// component swallows — see `LevelsGroupProps.size`).
type LevelsGroupFrameProps = Omit<GetProps<typeof LevelsGroupFrame>, "size">;

export interface LevelsGroupProps extends LevelsGroupFrameProps {
  /**
   * Calendar size of the levels rendered inside. Accepted for API parity and so
   * the group can be sized alongside its children; the row layout itself does
   * not vary by size, so it is a passthrough (no `createStyledContext` is needed
   * — `LevelsGroup` renders no cells of its own).
   */
  size?: CalendarSize;

  /** Stretch the group to the full width of its container. @default false */
  fullWidth?: boolean;
}

/**
 * `LevelsGroup` — the side-by-side column layout that holds `numberOfColumns`
 * calendar levels (used by `MonthLevelGroup`/`YearLevelGroup`/`DecadeLevelGroup`).
 * A pure layout wrapper around `role="grid"` levels, so it carries no role of its
 * own (parity with Mantine — callers pass `role="group"`). `size` is accepted for
 * parity but swallowed: the row layout does not depend on it and forwarding it to
 * the host would leak an unknown attribute. Forwards its ref + style props to the
 * root frame, exposed as `LevelsGroup.Frame`.
 *
 * @example
 * <LevelsGroup role="group">
 *   <MonthLevel month="2024-01-01" />
 *   <MonthLevel month="2024-02-01" />
 * </LevelsGroup>
 */
const LevelsGroupComponent = LevelsGroupFrame.styleable<LevelsGroupProps>(function LevelsGroup(
  { size: _size, ...rest },
  ref,
) {
  // `size` is intentionally swallowed: the row layout does not depend on it,
  // and forwarding it to the host would leak an unknown attribute. Levels are
  // sized by their own `size` prop, set by the parent group.
  void _size;

  return <LevelsGroupFrame ref={ref} {...rest} />;
});

LevelsGroupComponent.displayName = "@knitui/dates/LevelsGroup";

/**
 * #14 `withStaticProperties` exposes the `styled(Box)` root as `LevelsGroup.Frame`
 * (the single extension point — `styled(LevelsGroup.Frame, …)`), so a consumer can
 * reach and extend the frame. The group owns no other styled parts — every
 * cell/control lives in the level it composes.
 */
export const LevelsGroup = withStaticProperties(LevelsGroupComponent, {
  Frame: LevelsGroupFrame,
});
