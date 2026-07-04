import type { ReactElement, ReactNode } from "react";
import type { PanGesture } from "react-native-gesture-handler";
import type { SharedValue, WithSpringConfig, WithTimingConfig } from "react-native-reanimated";

import type { LayoutChangeEvent, SlotStyles, StyleProp, ViewStyle } from "@knitui/core";

import type { CarouselMode } from "./engine/types";
import type { SlideSource } from "./source";
import type { CarouselStyles } from "./view/chrome";

export type { CarouselMode } from "./engine/types";

/** A layout/animation worklet: maps an item's progress (0 = centered) to a style. */
export type AnimationStyle = (progress: number, index: number) => ViewStyle;

/** Tuning for `mode="parallax"`. */
export interface ParallaxConfig {
  /** How far adjacent items are pulled toward center, px (default 100). */
  parallaxScrollingOffset?: number;
  /** Scale of the centered item (default 0.8). */
  parallaxScrollingScale?: number;
  /** Scale of the neighbours (default `parallaxScrollingScale ** 2`). */
  parallaxAdjacentItemScale?: number;
}

/** Tuning for `mode="horizontal-stack" | "vertical-stack"`. */
export interface StackConfig {
  /** Number of cards visible in the deck (default 3). */
  showLength?: number;
  /** Distance a leaving card flies off, px (default = viewport size). */
  moveSize?: number;
  /** Step between stacked cards, px (default 18). */
  stackInterval?: number;
  /** Scale step per stacked card (default 0.04). */
  scaleInterval?: number;
  /** Opacity step per stacked card (default 0.1). */
  opacityInterval?: number;
  /** Rotation of a leaving card, deg (default 30). */
  rotateZDeg?: number;
  /** Which side the deck is anchored / cards exit toward (default "left"). */
  snapDirection?: "left" | "right";
}

/** Tuning for `mode="fade"` — pinned slides that crossfade in place. */
export interface FadeConfig {
  /** Scale a fully-faded slide shrinks to (1 = pure crossfade, no zoom). Default 1. */
  scale?: number;
}

/** Tuning for `mode="scale"` — a normal slider that shrinks/dims off-center slides. */
export interface ScaleConfig {
  /** Scale of fully off-center slides (default 0.85). */
  inactiveScale?: number;
  /** Opacity of fully off-center slides (default 1). */
  inactiveOpacity?: number;
}

/** Tuning for `mode="rotate"` — a fanned slider that tilts neighbouring slides. */
export interface RotateConfig {
  /** Max tilt of a one-page-away slide, deg (default 12). */
  rotateZDeg?: number;
  /** Scale of fully off-center slides (default 0.92). */
  inactiveScale?: number;
}

/** Tuning for `mode="coverflow"` — overlapping 3D cards that face the centre. */
export interface CoverflowConfig {
  /** Rotation of a one-page-away slide toward the viewer, deg (default 50). */
  rotateYDeg?: number;
  /** Scale of fully off-center slides (default 0.85). */
  inactiveScale?: number;
  /** Fraction of a page each neighbour is offset — lower overlaps more (default 0.55). */
  spacing?: number;
  /** 3D perspective depth, px; 0 disables (default 800). */
  perspective?: number;
}

/** Tuning for `mode="flip"` — a pinned card that flips to reveal the next slide. */
export interface FlipConfig {
  /** 3D perspective depth, px; 0 = a flat flip (default 0). */
  perspective?: number;
  /** Flip around the vertical (`"y"`, default) or horizontal (`"x"`) axis. */
  axis?: "x" | "y";
}

/** Tuning for `mode="cube"` — slides hinge on their shared edge like a turning cube. */
export interface CubeConfig {
  /** 3D perspective depth, px; 0 disables (default 800). */
  perspective?: number;
}

/** Tuning for `mode="depth"` — the leaving slide zooms through while the next rises from behind. */
export interface DepthConfig {
  /** Scale the incoming slide grows from (default 0.85). */
  inactiveScale?: number;
  /** Scale the leaving slide zooms up to as it fades through (default 1.3). */
  outgoingScale?: number;
}

/** The settle/scroll animation. `withAnimation` takes precedence over `scrollAnimationDuration`. */
export type WithAnimation =
  | { type: "spring"; config: WithSpringConfig }
  | { type: "timing"; config: WithTimingConfig };

/** Info passed to `renderItem`. */
export interface RenderItemInfo<T> {
  item: T;
  /** Index into the real `data` array. */
  index: number;
  /** This item's live progress (0 = centered, ±1 = one page away). */
  progress: SharedValue<number>;
}

export type RenderItem<T> = (info: RenderItemInfo<T>) => ReactElement | null;

/**
 * `onProgressChange` accepts either a callback or a `SharedValue<number>`. When
 * a shared value is passed, the carousel writes the fractional absolute progress
 * into it on the UI thread (no JS hop) — ideal for driving `<Pagination>`.
 */
export type OnProgressChange =
  | ((offsetProgress: number, absoluteProgress: number) => void)
  | SharedValue<number>;

/** Options for the imperative navigation methods. */
export interface ScrollToOptions {
  /** Absolute target index. Takes precedence over `count`. */
  index?: number;
  /** Relative move (e.g. `-2` = back two). */
  count?: number;
  /** Animate the transition (default true). */
  animated?: boolean;
  /** Called when the transition settles. */
  onFinished?: () => void;
}

export type StepOptions = Omit<ScrollToOptions, "index">;

/** Imperative handle exposed via `ref`. */
export interface CarouselRef {
  next: (opts?: StepOptions) => void;
  prev: (opts?: StepOptions) => void;
  scrollTo: (opts?: ScrollToOptions) => void;
  getCurrentIndex: () => number;
}

export interface CarouselProps<T> {
  /* Data & render -------------------------------------------------------- */
  /** Eager data array. Provide this OR `source` (for lazy/remote data). */
  data?: T[];
  /**
   * Lazily-loaded slide source (remote/virtualized). Only the items in the
   * virtualization window are fetched; set `windowSize` to control how many.
   * See {@link createAsyncSlideSource}.
   */
  source?: SlideSource<T>;
  renderItem: RenderItem<T>;
  /** Rendered for a windowed slide whose data hasn't loaded yet (async source). */
  renderPlaceholder?: (index: number) => ReactElement | null;
  /**
   * Duplicate a tiny looped list (1→3, 2→4) so the ring fills seamlessly.
   * Default true. Only applies to eager `data` with `loop` and <3 items.
   */
  autoFillData?: boolean;
  /** Stable keys (recommended on web / for reordering). Defaults to index. */
  keyExtractor?: (item: T, index: number) => string;

  /* Index ---------------------------------------------------------------- */
  /** Uncontrolled initial index (default 0). */
  defaultIndex?: number;
  /** Controlled active index. Pair with `onIndexChange`. */
  index?: number;
  /** Fired whenever the settled active index changes (controlled companion). */
  onIndexChange?: (index: number) => void;

  /* Sizing --------------------------------------------------------------- */
  /** Container style — set the carousel's width/height here. */
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Page size (snap & animation unit) along the scroll axis. Defaults to the measured container. */
  itemSize?: number;
  /**
   * Horizontal page size (snap & animation unit). Axis-specific alias for
   * {@link CarouselProps.itemSize}; used when `vertical` is false. `itemSize`
   * takes precedence if both are set.
   */
  itemWidth?: number;
  /**
   * Vertical page size (snap & animation unit). Axis-specific alias for
   * {@link CarouselProps.itemSize}; used when `vertical` is true. `itemSize`
   * takes precedence if both are set.
   */
  itemHeight?: number;
  /** Lay items out vertically instead of horizontally. */
  vertical?: boolean;

  /* Loop / mode ---------------------------------------------------------- */
  loop?: boolean;
  mode?: CarouselMode;
  modeConfig?:
    | ParallaxConfig
    | StackConfig
    | FadeConfig
    | ScaleConfig
    | RotateConfig
    | CoverflowConfig
    | FlipConfig
    | CubeConfig
    | DepthConfig;
  /** A worklet `(progress, index) => ViewStyle` that overrides `mode`. */
  customAnimation?: AnimationStyle;
  /**
   * @experimental Force the travel direction for programmatic navigation
   * (`scrollTo({ index })`, autoplay) in `loop` mode. `"positive"` always moves
   * forward, `"negative"` always moves backward; unset travels the short way.
   */
  fixedDirection?: "positive" | "negative";

  /* Gesture / scroll ----------------------------------------------------- */
  /**
   * How the track scrolls.
   *
   * - `"transform"` (default) — the custom reanimated engine: a single scroll
   *   offset drives every slide's transform. Powers `loop`, the transition
   *   `mode`s (parallax/fade/cube/…), virtualization, and async `source`.
   * - `"native"` — a real platform scroll container (an `Animated.ScrollView` on
   *   native, an overflow-scroll surface on web). You get the OS's own momentum,
   *   rubber-band overscroll, accessible scrolling, and free (non-paged)
   *   scrolling. This is the "normal scroll" mode.
   *
   * Native mode trades some features for that: it always mounts every slide (no
   * windowed virtualization), forces `loop` off, and ignores the transition
   * `mode`/`customAnimation` (slides lay out in normal flow, start-aligned).
   * `snapEnabled` / `pagingEnabled` / `overscrollEnabled`, `vertical`, `itemSize`,
   * the imperative `ref`, controlled `index`, pagination and `onProgressChange`
   * all keep working. Default `"transform"`.
   */
  scrollMode?: "transform" | "native";
  enabled?: boolean;
  pagingEnabled?: boolean;
  snapEnabled?: boolean;
  overscrollEnabled?: boolean;
  /** Max items mounted at once (virtualization). Default: all. */
  windowSize?: number;
  /**
   * How many extra items to pre-load ahead of the mounted window, in the
   * direction of travel. Lets an async {@link CarouselProps.source} fetch the
   * pages a slide needs *before* it scrolls into view, hiding network latency
   * (no placeholder flash while moving one way). No effect on eager `data`
   * (already in memory). Defaults to `windowSize` for a source, else `0`.
   */
  prefetchCount?: number;
  maxScrollDistancePerSwipe?: number;
  minScrollDistancePerSwipe?: number;
  /** Mutate the underlying RNGH pan gesture (native). */
  gestureConfig?: (gesture: PanGesture) => PanGesture;
  /** Enable mouse-wheel / trackpad scrolling (web, default true). */
  wheelEnabled?: boolean;
  /** Enable arrow / Home / End keyboard navigation (web, default true). */
  keyboardEnabled?: boolean;

  /* Autoplay & timing ---------------------------------------------------- */
  autoPlay?: boolean;
  autoPlayReverse?: boolean;
  autoPlayInterval?: number;
  scrollAnimationDuration?: number;
  withAnimation?: WithAnimation;

  /* Offset shared value -------------------------------------------------- */
  /**
   * The carousel's translation (scroll offset, px) shared value. Pass one to
   * observe — or imperatively drive — the live offset from outside. If omitted,
   * the carousel owns one internally. Must be a stable reference.
   */
  scrollOffsetValue?: SharedValue<number>;
  /**
   * @deprecated Use {@link CarouselProps.scrollOffsetValue} instead (same
   * behaviour, clearer name).
   */
  defaultScrollOffsetValue?: SharedValue<number>;

  /* Observability -------------------------------------------------------- */
  /** Engine writes the fractional absolute progress here (the pagination seam). */
  progress?: SharedValue<number>;
  /** Callback, or a `SharedValue<number>` the engine writes absolute progress into. */
  onProgressChange?: OnProgressChange;
  onScrollStart?: () => void;
  onScrollEnd?: (index: number) => void;
  onSnapToItem?: (index: number) => void;

  onLayout?: (event: LayoutChangeEvent) => void;

  /* Styling & chrome ----------------------------------------------------- */
  /**
   * Per-slot style sugar — props spread onto the matching styled part
   * (`root` / `viewport` / `slide` / `controls` / `control` / `dots` / `dot` /
   * `activeDot`). Thin sugar over the styled parts; explicit props always win.
   */
  styles?: SlotStyles<CarouselStyles>;
  /** Render built-in prev/next nav buttons (`ActionIcon` + chevrons). */
  withControls?: boolean;
  /** Where the built-in controls sit: inset from the edges, or pinned to them. */
  controlsPosition?: "inside" | "outside";
  /** Render the built-in pagination dots, auto-wired to the carousel's progress. */
  withIndicators?: boolean;
  /**
   * Full override for a built-in nav button. Receives the direction and the
   * wired handler/disabled state; return your own control. `styles.control`
   * covers the light-touch case, this the heavy one.
   */
  renderControl?: (
    direction: "prev" | "next",
    props: { onPress: () => void; disabled: boolean; accessibilityLabel: string },
  ) => ReactElement | null;
  /**
   * Marker-slot children — `Carousel.Controls` / `Carousel.Indicators` /
   * `Carousel.Overlay`. Slides stay `data` + `renderItem` driven; these are the
   * chrome around the track.
   */
  children?: ReactNode;

  /* A11y ----------------------------------------------------------------- */
  accessibilityLabel?: string;
  testID?: string;
}
