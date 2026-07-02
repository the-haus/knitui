import * as React from "react";

import { Box, type OverlayProps } from "@knitui/components";
import {
  createSlot,
  defineSlots,
  type GetProps,
  type SlotAccessor,
  slotStyles,
  type SlotStyles,
  styled,
} from "@knitui/core";

/**
 * Tamagui styling surface for `@knitui/sheet`.
 *
 * Every part the sheet *owns* is a real `styled(Box)` here — theme-aware,
 * token-driven, overridable via the per-slot `styles` prop. The motion-driven
 * host (the animated `Animated.View`/painted `View` that carries the panel's
 * `translateY`) is deliberately NOT styled here: a Reanimated worklet / the web
 * painter owns its `transform`, and sharing such a node with a Tamagui animation
 * driver breaks (repo memory `loop-animation-reanimated-host`). The styled
 * `SheetFrame` sits *inside* that host and owns the themeable surface only.
 */

/* ── Styled chrome ──────────────────────────────────────────────────────── */

/**
 * The visible panel surface. Fills its animated host (`flex: 1`) so the
 * background extends to the bottom of the screen — no gap shows through if a
 * spring overshoots past the most-open snap. `position: "relative"` is REQUIRED:
 * a Tamagui `Box` defaults to `static` on web, which would let absolutely-
 * positioned children (a close button, decorative layers) anchor to the wrong
 * ancestor; RN/RNW Views are relative by default.
 */
export const SheetFrame = styled(Box, {
  name: "Sheet",
  position: "relative",
  flex: 1,
  backgroundColor: "$background",
  borderTopLeftRadius: "$lg",
  borderTopRightRadius: "$lg",
  overflow: "hidden",

  variants: {
    /** Top-corner rounding scale. */
    size: {
      sm: { borderTopLeftRadius: "$sm", borderTopRightRadius: "$sm" },
      md: { borderTopLeftRadius: "$md", borderTopRightRadius: "$md" },
      lg: { borderTopLeftRadius: "$lg", borderTopRightRadius: "$lg" },
      xl: { borderTopLeftRadius: "$xl", borderTopRightRadius: "$xl" },
    },
  } as const,

  defaultVariants: { size: "lg" },
});

/**
 * The drag handle (grabber) shown at the top of the panel. A short, rounded bar,
 * centered. Tapping it cycles snap points (wired in the root). Sits in its own
 * padded row so the whole strip is an easy touch target.
 */
export const SheetHandleBar = styled(Box, {
  name: "SheetHandle",
  alignSelf: "center",
  width: 40,
  height: 5,
  borderRadius: 999,
  backgroundColor: "$color7",
  marginVertical: "$sm",
});

/** Wrapper row around the handle so the entire strip is pressable / spaced. */
export const SheetHandleRow = styled(Box, {
  name: "SheetHandleRow",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: "$xs",
});

/* ── Marker slots ───────────────────────────────────────────────────────── */

/**
 * The composition API. Mirrors the documented anatomy:
 *
 *   <Sheet>
 *     <Sheet.Overlay />
 *     <Sheet.Handle />
 *     <Sheet.Frame>{content}</Sheet.Frame>
 *   </Sheet>
 *
 * These markers render nothing; the root collects them from `children` and
 * renders its own controlled, animated parts. `Sheet.Frame`'s children are the
 * panel content; if no `Sheet.Frame` is present, plain children fold into it.
 */
export const SheetSlots = defineSlots({
  /** Customizes / enables the scrim. Props spread onto the `Overlay`. */
  Overlay: createSlot<"Overlay", OverlayProps>("Overlay"),
  /** Customizes / enables the drag handle. Props spread onto the handle bar. */
  Handle: createSlot<"Handle", GetProps<typeof SheetHandleBar>>("Handle"),
  /** The panel content host. Props spread onto `SheetFrame`. */
  Frame: createSlot<"Frame", GetProps<typeof SheetFrame>>("Frame"),
});

/* ── Per-slot styles ────────────────────────────────────────────────────── */

/**
 * Named style slots. Each key maps to the props of the styled part it targets,
 * so `styles={{ root: { backgroundColor: "$blue2" } }}` is sugar for
 * `<Sheet.Frame backgroundColor="$blue2" />`. The one rule:
 * `defaults < styles[slot] < explicit props < inline`.
 */
export interface SheetStyles {
  /** The panel surface (`Sheet.Frame`). */
  root?: GetProps<typeof SheetFrame>;
  /** The scrim (`Sheet.Overlay`). */
  overlay?: OverlayProps;
  /** The drag handle bar (`Sheet.Handle`). */
  handle?: GetProps<typeof SheetHandleBar>;
}

export const SHEET_SLOT_KEYS = [
  "root",
  "overlay",
  "handle",
] as const satisfies readonly (keyof SheetStyles)[];

/** Distributes the `styles` map down to parts rendered by nested children. */
const SheetStylesContext = React.createContext<SlotStyles<SheetStyles> | undefined>(undefined);

export const SheetStylesProvider = SheetStylesContext.Provider;

/** Build the typed slot accessor over the sheet's `styles` map. */
export function useSheetSlots(styles?: SlotStyles<SheetStyles>): SlotAccessor<SheetStyles> {
  return slotStyles<SheetStyles>(styles, SHEET_SLOT_KEYS, "Sheet");
}
