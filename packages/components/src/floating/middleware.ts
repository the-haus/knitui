/**
 * Positioning middleware for the floating core. API-compatible with the subset of
 * `@floating-ui` this kit uses:
 *
 * - {@link offset} — gutter + skidding between reference and floating.
 * - {@link flip} — flip to the opposite side when the current one overflows.
 * - {@link shift} — slide along the cross axis to stay within the viewport.
 * - {@link limitShift} — limiter that keeps a shifted element attached to its reference.
 * - {@link arrow} — cross-axis arrow coordinate that keeps the arrow pointing at
 *   the reference even after `shift`/`flip` moved the floating element.
 *
 * {@link size}, {@link hide} and {@link inline} are provided for API stability
 * (they are re-exported from `@knitui/hooks`) but are not used by the kit's own
 * components — they are intentionally lean.
 */
import {
  clamp,
  type Coords,
  detectOverflow,
  getAlignment,
  getOppositeSide,
  getSide,
  isVerticalSide,
  type Middleware,
  type MiddlewareState,
  type Rect,
} from "./core";

/** Object form of {@link offset}'s value (mirrors floating-ui's `OffsetOptions`). */
export type OffsetOptions = {
  /** Distance (gutter) between reference and floating along the main axis. */
  mainAxis?: number;
  /** Skidding along the cross axis. */
  crossAxis?: number;
  /** Skidding for aligned placements only, along the alignment axis. */
  alignmentAxis?: number | null;
};

/** A plain number (main-axis gutter) or the per-axis object form. */
export type OffsetValue = number | OffsetOptions;

/**
 * Displace the floating element from its reference: `mainAxis` opens a gutter
 * away from the reference, `crossAxis` skids it along the perpendicular axis, and
 * `alignmentAxis` skids aligned placements toward/away from their aligned edge.
 */
export function offset(value: OffsetValue = 0): Middleware {
  return {
    name: "offset",
    fn(state) {
      const side = getSide(state.placement);
      const alignment = getAlignment(state.placement);
      const vertical = isVerticalSide(side);
      const opts: OffsetOptions = typeof value === "number" ? { mainAxis: value } : value;
      const main = opts.mainAxis ?? 0;
      const cross = opts.crossAxis ?? 0;

      let dx = 0;
      let dy = 0;

      // Main axis: push the floating element away from the reference.
      if (side === "top") dy -= main;
      else if (side === "bottom") dy += main;
      else if (side === "left") dx -= main;
      else dx += main;

      // Cross axis: skid perpendicular to the main axis.
      if (vertical) dx += cross;
      else dy += cross;

      // Alignment axis: applies to aligned placements only; `end` skids the
      // opposite way to `start` so the value is intuitive regardless of side.
      if (opts.alignmentAxis != null && alignment) {
        const sign = alignment === "end" ? -1 : 1;
        if (vertical) dx += opts.alignmentAxis * sign;
        else dy += opts.alignmentAxis * sign;
      }

      const data: Coords = { x: dx, y: dy };
      return { x: state.x + dx, y: state.y + dy, data };
    },
  };
}

/** Options for {@link flip}. */
export type FlipOptions = {
  /** Virtual padding around the boundary when testing for overflow. @default 0 */
  padding?: number;
};

/**
 * When the floating element overflows the viewport on its placement side, flip it
 * to the opposite side (preserving alignment). Each candidate is tried at most
 * once; if every candidate overflows, the last one is kept.
 */
export function flip(options: FlipOptions = {}): Middleware {
  const padding = options.padding ?? 0;
  return {
    name: "flip",
    fn(state: MiddlewareState) {
      const overflow = detectOverflow(state, padding);
      const side = getSide(state.placement);
      const alignment = getAlignment(state.placement);

      // Only the main-axis side matters for flipping.
      if (overflow[side] <= 0) return {};

      const opposite = getOppositeSide(side);
      const next = (
        alignment ? `${opposite}-${alignment}` : opposite
      ) as MiddlewareState["placement"];

      const prev = (state.middlewareData.flip as { tried?: string[] } | undefined)?.tried ?? [
        state.initialPlacement,
      ];
      if (prev.includes(next)) {
        // Exhausted the fallbacks — keep the current placement.
        return {};
      }

      return { data: { tried: [...prev, next] }, reset: { placement: next } };
    },
  };
}

/** A limiter passed to {@link shift} (see {@link limitShift}). */
export type ShiftLimiter = {
  fn: (state: MiddlewareState & { proposed: number; axis: "x" | "y" }) => number;
};

/** Options for {@link shift}. */
export type ShiftOptions = {
  /** Keep the floating element this many px from the boundary edge. @default 0 */
  padding?: number;
  /** Caps the shift so the floating element stays attached to its reference. */
  limiter?: ShiftLimiter;
};

/**
 * Slide the floating element along its cross axis so it stays within the viewport
 * (minus `padding`). With a `limiter` (see {@link limitShift}) the shift is capped
 * so the element never detaches from its reference.
 */
export function shift(options: ShiftOptions = {}): Middleware {
  const padding = options.padding ?? 0;
  return {
    name: "shift",
    fn(state) {
      const side = getSide(state.placement);
      const alongX = isVerticalSide(side); // vertical placement → shift on x
      const axis: "x" | "y" = alongX ? "x" : "y";
      const { boundary, rects } = state;

      const start = alongX ? boundary.x : boundary.y;
      const length = alongX ? boundary.width : boundary.height;
      const floatLength = alongX ? rects.floating.width : rects.floating.height;
      const current = alongX ? state.x : state.y;

      const min = start + padding;
      const max = start + length - padding - floatLength;
      let next = clamp(current, min, max);

      if (options.limiter) {
        next = options.limiter.fn({ ...state, proposed: next, axis });
      }

      return alongX ? { x: next } : { y: next };
    },
  };
}

/** Options for {@link limitShift}. */
export type LimitShiftOptions = {
  /** Extra px the floating element may extend past the reference edge. @default 0 */
  offset?: number;
};

/**
 * Limiter for {@link shift}: prevents the floating element from being shifted so
 * far that it detaches from its reference along the shift axis. It clamps the
 * proposed coordinate to the span where the floating box still overlaps the
 * reference (optionally extended by `offset`).
 */
export function limitShift(options: LimitShiftOptions = {}): ShiftLimiter {
  const extra = options.offset ?? 0;
  return {
    fn(state) {
      const { proposed, axis, rects } = state;
      const ref = rects.reference;
      const refStart = axis === "x" ? ref.x : ref.y;
      const refLength = axis === "x" ? ref.width : ref.height;
      const floatLength = axis === "x" ? rects.floating.width : rects.floating.height;

      // Keep at least a corner of the floating box overlapping the reference.
      const lower = refStart - floatLength - extra;
      const upper = refStart + refLength + extra;
      return Math.max(lower, Math.min(proposed, upper));
    },
  };
}

/** Options for {@link size}. */
export type SizeOptions = {
  padding?: number;
  /** Called with the space available to the floating element within the viewport. */
  apply?: (args: {
    availableWidth: number;
    availableHeight: number;
    rects: { reference: Rect; floating: Rect };
  }) => void;
};

/**
 * Reports the space available to the floating element within the viewport via the
 * `apply` callback. Lean: it does not mutate styles itself.
 */
export function size(options: SizeOptions = {}): Middleware {
  const padding = options.padding ?? 0;
  return {
    name: "size",
    fn(state) {
      const overflow = detectOverflow(state, padding);
      const side = getSide(state.placement);
      const availableHeight =
        state.rects.floating.height - Math.max(0, side === "top" ? overflow.top : overflow.bottom);
      const availableWidth =
        state.rects.floating.width - Math.max(0, side === "left" ? overflow.left : overflow.right);
      options.apply?.({
        availableWidth: Math.max(0, availableWidth),
        availableHeight: Math.max(0, availableHeight),
        rects: state.rects,
      });
      return {};
    },
  };
}

/** Marks the floating element as hidden when its reference leaves the viewport. */
export function hide(options: { padding?: number } = {}): Middleware {
  const padding = options.padding ?? 0;
  return {
    name: "hide",
    fn(state) {
      const { boundary, rects } = state;
      const ref = rects.reference;
      const referenceHidden =
        ref.x + ref.width < boundary.x + padding ||
        ref.x > boundary.x + boundary.width - padding ||
        ref.y + ref.height < boundary.y + padding ||
        ref.y > boundary.y + boundary.height - padding;
      return { data: { referenceHidden } };
    },
  };
}

/** Options for {@link arrow}. */
export type ArrowOptions = {
  /** Rendered arrow square edge length in px. @default 0 */
  size?: number;
  /**
   * Preferred resting spot: aim at the reference center, or — for aligned
   * placements — pin `offset` px from the aligned edge. @default "center"
   */
  position?: "center" | "side";
  /** Distance from the start/end edge used by `position: "side"`. @default 0 */
  offset?: number;
  /** Min distance kept between the arrow and the floating element's corners. @default 0 */
  padding?: number;
  /**
   * Border radius (px) of the floating element's corners. When set, the arrow is
   * held this far — plus its own rotation overhang — off each corner so its diamond
   * never tucks into the rounded corner. @default 0
   */
  cornerRadius?: number;
};

/**
 * Compute the arrow's cross-axis coordinate (relative to the floating element)
 * so its tip points at the reference. Runs AFTER `offset`/`flip`/`shift`, so the
 * coordinate accounts for any cross-axis sliding those applied: the preferred
 * spot (center, or `offset` from the aligned edge) is clamped to keep the tip
 * over the reference, then to keep the arrow inside the floating element.
 * Writes `{ x | y, centerOffset }` to `middlewareData.arrow` (floating-ui shape);
 * `FloatingArrow` consumes it.
 */
export function arrow(options: ArrowOptions = {}): Middleware {
  const {
    size = 0,
    position = "center",
    offset: sideOffset = 0,
    padding = 0,
    cornerRadius = 0,
  } = options;
  return {
    name: "arrow",
    fn(state) {
      const side = getSide(state.placement);
      const alignment = getAlignment(state.placement);
      const onX = isVerticalSide(side); // top/bottom → the arrow slides along x
      const ref = state.rects.reference;
      const floatStart = onX ? state.x : state.y;
      const floatLength = onX ? state.rects.floating.width : state.rects.floating.height;
      const refStart = onX ? ref.x : ref.y;
      const refLength = onX ? ref.width : ref.height;

      // Arrow top-left (relative to the floating element) that puts the tip —
      // the rotated square's outward corner, at the square's cross-axis center —
      // exactly on the reference center.
      const center = refStart + refLength / 2 - floatStart - size / 2;

      // Preferred spot: the reference center, or pinned toward the aligned edge.
      let next =
        position === "side" && alignment
          ? alignment === "start"
            ? sideOffset
            : floatLength - sideOffset - size
          : center;

      // Keep pointing at the target: the tip must stay within the reference span
      // (matters when `shift` slid the floating element, or the reference is
      // narrower than the side offset).
      next = clamp(next, center - refLength / 2, center + refLength / 2);
      // …but the arrow can never escape the floating element itself, nor tuck into
      // a rounded corner. The rendered arrow is a 45°-rotated square, so its diamond
      // tip overhangs the unrotated box by `(√2−1)·size/2` on each cross-axis end;
      // fold that into the corner keepout so the whole diamond — not just the box —
      // clears a corner of radius `cornerRadius`.
      const overhang = (Math.SQRT2 - 1) * (size / 2);
      const edge = Math.max(padding, cornerRadius > 0 ? cornerRadius + overhang : 0);
      next = clamp(next, edge, floatLength - size - edge);

      return {
        data: { centerOffset: center - next, ...(onX ? { x: next } : { y: next }) },
      };
    },
  };
}

/** Provided for API stability — a no-op passthrough. */
export function inline(): Middleware {
  return { name: "inline", fn: () => ({}) };
}
