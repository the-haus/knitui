import * as React from "react";

import { type ActionIconProps, Box } from "@knitui/components";
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
 * Tamagui styling surface for `@knitui/carousel` (see
 * `docs/carousel-tamagui-slot-integration.md`).
 *
 * Every part the carousel *owns* is a real `styled(Box)` here — theme-aware,
 * token-driven, overridable via the per-slot `styles` prop. The motion-driven
 * nodes (the per-slide `Animated.View`/painted `View` and the dot's
 * `Animated.View`) are deliberately NOT styled here: a Reanimated worklet / the
 * web rAF painter own their `transform`/`opacity`, and sharing such a node with
 * a Tamagui animation driver breaks (repo memory `loop-animation-reanimated-host`).
 * Instead the styled `SlideBox` / `CarouselDot` sit *inside* those hosts and own
 * the themeable visuals only.
 */

/* ── Styled chrome ──────────────────────────────────────────────────────── */

/**
 * The carousel region. Owns clipping + main axis; accepts Tamagui props + `style`.
 *
 * `position: "relative"` is REQUIRED: RN/react-native-web Views default to
 * relative, but a Tamagui `Box` defaults to `static` on web — without this the
 * absolutely-positioned controls / indicators / overlay would anchor to the
 * wrong ancestor and the slides would size against the viewport.
 */
export const CarouselFrame = styled(Box, {
  name: "Carousel",
  position: "relative",
  overflow: "hidden",
  variants: {
    orientation: {
      horizontal: { flexDirection: "row" },
      vertical: { flexDirection: "column" },
    },
  } as const,
  defaultVariants: { orientation: "horizontal" },
});

/**
 * The scrolling viewport that holds the track. `box-none` so slides get presses.
 * `position: "relative"` makes it the containing block for the absolutely-
 * positioned slide hosts (RN/RNW Views are relative by default; a Tamagui `Box`
 * is `static` on web, which would let the slides escape and size wrongly).
 */
export const CarouselViewport = styled(Box, {
  name: "CarouselViewport",
  position: "relative",
  flex: 1,
  pointerEvents: "box-none",
});

/**
 * Per-slide visual box. Sits inside the animated/painted slide host and owns
 * padding / radius / background / border / shadow. Transparent + `flex:1` by
 * default so it's layout-neutral until the consumer styles it via `styles.slide`.
 */
export const SlideBox = styled(Box, {
  name: "CarouselSlide",
  flex: 1,
});

/**
 * Absolute overlay row that holds the built-in prev/next controls. Insets the
 * buttons from the edges by default (`controlsPosition="inside"`); the parent
 * overrides `top`/`bottom`/`left`/`right` to `0` for `"outside"`.
 */
export const CarouselControls = styled(Box, {
  name: "CarouselControls",
  position: "absolute",
  top: "$sm",
  bottom: "$sm",
  left: "$sm",
  right: "$sm",
  alignItems: "center",
  justifyContent: "space-between",
  pointerEvents: "box-none",
});

/**
 * Positioned wrapper for the built-in indicators — pins the dots row to the
 * bottom edge (horizontal) or trailing edge (vertical), `box-none` so the dots
 * still take taps while the rest of the overlay passes presses through.
 */
export const CarouselIndicators = styled(Box, {
  name: "CarouselIndicators",
  position: "absolute",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "box-none",
  variants: {
    orientation: {
      horizontal: { left: 0, right: 0, bottom: "$sm" },
      vertical: { top: 0, bottom: 0, right: "$sm" },
    },
  } as const,
  defaultVariants: { orientation: "horizontal" },
});

/** Full-bleed overlay host for the `Carousel.Overlay` marker slot. */
export const CarouselOverlay = styled(Box, {
  name: "CarouselOverlay",
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: "box-none",
});

/** Pagination dots container. */
export const CarouselDots = styled(Box, {
  name: "CarouselDots",
  flexDirection: "row",
  alignSelf: "center",
  alignItems: "center",
  gap: "$xs",
});

/**
 * A single pagination dot. Theme-aware (`$color8` → `$color12` on `active`),
 * replacing the old hardcoded `#11181C`. The default `Pagination` animates this
 * directly on Tamagui's driver (`animation` + `scale`/`opacity` per `active`);
 * the progress-driven `Pagination.Basic`/`Custom` variants instead wrap a
 * reanimated host (never share one node with a Tamagui animation driver).
 */
export const CarouselDot = styled(Box, {
  name: "CarouselDot",
  width: 8,
  height: 8,
  borderRadius: 999,
  backgroundColor: "$color8",
  variants: {
    active: {
      true: { backgroundColor: "$color12" },
    },
  } as const,
});

/* ── Marker slots ───────────────────────────────────────────────────────── */

/**
 * Optional, consumer-placed chrome around the track. Slides themselves stay
 * `data` + `renderItem` driven (virtualization needs the data model) — these
 * markers are for the chrome only. They render nothing; the parent collects
 * them from `children` and renders its own controlled parts.
 */
export const CarouselSlots = defineSlots({
  /** Custom prev/next cluster (replaces the built-in `withControls`). */
  Controls: createSlot<"Controls">("Controls"),
  /** Custom pagination cluster (replaces the built-in `withIndicators`). */
  Indicators: createSlot<"Indicators">("Indicators"),
  /** Arbitrary absolute overlay (scrims, captions, badges, …). */
  Overlay: createSlot<"Overlay">("Overlay"),
});

/* ── Per-slot styles ────────────────────────────────────────────────────── */

/**
 * Named style slots. Each key maps to the props of the styled part it targets,
 * so `styles={{ dot: { backgroundColor: "$blue9" } }}` is sugar for
 * `<Carousel.Dot backgroundColor="$blue9" />`. The one rule:
 * `defaults < styles[slot] < explicit xxxProps < inline`.
 */
export interface CarouselStyles {
  /** The carousel region (`Carousel.Frame`). */
  root?: GetProps<typeof CarouselFrame>;
  /** The scrolling viewport (`Carousel.Viewport`). */
  viewport?: GetProps<typeof CarouselViewport>;
  /** Every slide's visual box (`Carousel.Slide`). */
  slide?: GetProps<typeof SlideBox>;
  /** The built-in controls overlay (`Carousel.Controls`). */
  controls?: GetProps<typeof CarouselControls>;
  /** Each built-in nav button (`ActionIcon`). */
  control?: Partial<ActionIconProps>;
  /** The built-in indicators container (`Carousel.Dots`). */
  dots?: GetProps<typeof CarouselDots>;
  /** Each dot (`Carousel.Dot`). */
  dot?: GetProps<typeof CarouselDot>;
  /** The active dot (merged over `dot`). */
  activeDot?: GetProps<typeof CarouselDot>;
}

export const CAROUSEL_SLOT_KEYS = [
  "root",
  "viewport",
  "slide",
  "controls",
  "control",
  "dots",
  "dot",
  "activeDot",
] as const satisfies readonly (keyof CarouselStyles)[];

/**
 * Distributes the `styles` map down to the slide-level parts rendered by child
 * components (`Item` / `Item.web`) without widening their prop contracts — the
 * `Tabs` pattern (`docs/carousel-tamagui-slot-integration.md` §5.4).
 */
const CarouselStylesContext = React.createContext<SlotStyles<CarouselStyles> | undefined>(
  undefined,
);

export const CarouselStylesProvider = CarouselStylesContext.Provider;

/** Build the typed slot accessor over the carousel's `styles` map. */
export function useCarouselSlots(
  styles?: SlotStyles<CarouselStyles>,
): SlotAccessor<CarouselStyles> {
  return slotStyles<CarouselStyles>(styles, CAROUSEL_SLOT_KEYS, "Carousel");
}

/** Slide-level accessor — reads the `styles.slide` props off context. */
export function useSlideStyle(): GetProps<typeof SlideBox> | undefined {
  const styles = React.useContext(CarouselStylesContext);
  return useCarouselSlots(styles).get("slide");
}
