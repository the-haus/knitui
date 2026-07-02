/**
 * Engine-level types for @knitui/carousel.
 *
 * The engine is the platform-free heart of the carousel: pure functions over a
 * single signed scroll offset. It has NO React, DOM, or reanimated imports, so
 * every function here is directly unit-testable. The reanimated/worklet wiring
 * lives one layer up in `src/motion`.
 *
 * Sign convention (inherited from the reference, kept because it makes the
 * gesture math natural): the scroll `offset` is in pixels along the scroll axis
 * and is NEGATIVE going forward. Item `i` rests at `offset === -i * size`.
 */

/** Built-in transition modes. `customAnimation` overrides these. */
export type CarouselMode =
  | "normal"
  | "parallax"
  | "horizontal-stack"
  | "vertical-stack"
  | "fade"
  | "scale"
  | "rotate"
  | "coverflow"
  | "flip"
  | "cube"
  | "depth";

/**
 * Result of the pure settle calculation (what to do when a drag/fling ends).
 * The motion layer turns this into a concrete reanimated animation.
 */
export type SettleResult =
  | { kind: "decay"; velocity: number }
  /**
   * Animate the offset to `target`. `page` is the (un-wrapped, may be negative
   * or ≥ count in loop mode) landing page index; wrap it with `wrapIndex` for
   * user-facing reporting.
   */
  | { kind: "to"; target: number; page: number };

/** Inputs to the pure `settle` calculation. */
export interface SettleInput {
  /** Current scroll offset in px (forward = negative). */
  offset: number;
  /**
   * Release velocity in px/s along the axis, in OFFSET space (i.e. the same
   * sign as `offset`'s rate of change). Forward flings are negative.
   */
  velocity: number;
  /** Page size = item extent along the scroll axis, px. Must be > 0. */
  size: number;
  /** Number of real data items. */
  count: number;
  loop: boolean;
  /** Cap movement to ±1 page per swipe and always land on a page boundary. */
  pagingEnabled: boolean;
  /** When `!pagingEnabled`, snap to the velocity-projected nearest item. */
  snapEnabled: boolean;
  /**
   * Offset (px) at which the drag began. Required for the `min`/`max`
   * per-swipe distance caps below (they measure travel from this anchor); when
   * omitted, those caps are not applied.
   */
  startOffset?: number;
  /**
   * If set, a single swipe may not carry the offset more than this many px from
   * {@link startOffset}. Requires `startOffset`.
   */
  maxScrollDistancePerSwipe?: number;
  /**
   * If set, a swipe whose total projected travel from {@link startOffset} is
   * below this many px does not change page. Requires `startOffset`.
   */
  minScrollDistancePerSwipe?: number;
}
