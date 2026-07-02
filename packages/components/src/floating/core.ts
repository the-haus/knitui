/**
 * Cross-platform floating positioning core — a small, self-contained engine that
 * replaces the `@floating-ui/*` dependency. All math runs in a single
 * **window/viewport coordinate space**: the reference rect, the boundary
 * (viewport), and the returned coordinates are all window-relative. The platform
 * layer ({@link file://./platform.ts}) then subtracts the floating element's
 * container origin, so the result is correct whether the floating element is
 * rendered inline OR teleported into a full-screen portal host — that is what
 * makes this work properly inside Portals on both web and native.
 *
 * The middleware contract mirrors `@floating-ui` closely enough that the existing
 * `offset`/`flip`/`shift` usage and custom middleware (e.g. Popover's
 * `knituiReferenceWidth`) keep working unchanged.
 */

/** Alignment along the cross axis of a side. */
export type Alignment = "start" | "end";
/** The four primary sides a floating element can be placed on. */
export type Side = "top" | "right" | "bottom" | "left";
/** A side combined with an alignment, e.g. `"bottom-start"`. */
export type AlignedPlacement = `${Side}-${Alignment}`;
/** Every supported placement (4 sides × {centered, start, end}). */
export type Placement = Side | AlignedPlacement;
/** Positioning strategy applied to the floating element. */
export type Strategy = "absolute" | "fixed";
/** A point. */
export type Coords = { x: number; y: number };
/** A box in some coordinate space. */
export type Rect = Coords & { width: number; height: number };
/** Width/height only. */
export type Dimensions = { width: number; height: number };
/** The measured reference and floating boxes handed to middleware. */
export type ElementRects = { reference: Rect; floating: Rect };
/** Bag of per-middleware output, keyed by middleware `name`. */
export type MiddlewareData = Record<string, unknown> & {
  arrow?: Partial<Coords> & { centerOffset: number };
  hide?: { referenceHidden?: boolean; escaped?: boolean };
  offset?: Coords;
};

/** The state passed to every middleware `fn`, in window coordinates. */
export type MiddlewareState = Coords & {
  /** The placement requested by the caller (before any flip). */
  initialPlacement: Placement;
  /** The current (possibly flipped) placement. */
  placement: Placement;
  strategy: Strategy;
  middlewareData: MiddlewareData;
  rects: ElementRects;
  /** The boundary used for overflow detection (the viewport), window-relative. */
  boundary: Rect;
};

/** What a middleware may return: coordinate nudges, data, and/or a reset. */
export type MiddlewareReturn = Partial<Coords> & {
  data?: Record<string, unknown>;
  /** `reset` restarts the pipeline, optionally with a new placement (flip). */
  reset?: true | { placement?: Placement };
};

/** A positioning middleware. */
export type Middleware = {
  name: string;
  fn: (state: MiddlewareState) => MiddlewareReturn;
};

/** Result of {@link computePosition}. */
export type ComputePositionReturn = {
  x: number;
  y: number;
  placement: Placement;
  strategy: Strategy;
  middlewareData: MiddlewareData;
};

/** The side of a placement, e.g. `"bottom-start"` → `"bottom"`. */
export const getSide = (placement: Placement): Side => placement.split("-")[0] as Side;

/** The alignment of a placement, e.g. `"bottom-start"` → `"start"` (or `undefined`). */
export const getAlignment = (placement: Placement): Alignment | undefined =>
  placement.split("-")[1] as Alignment | undefined;

/** The opposite side, e.g. `"top"` → `"bottom"`. */
export const getOppositeSide = (side: Side): Side =>
  (({ top: "bottom", bottom: "top", left: "right", right: "left" }) as const)[side];

/** Whether a placement's main axis is vertical (top/bottom) — its cross axis is x. */
export const isVerticalSide = (side: Side): boolean => side === "top" || side === "bottom";

const clamp = (value: number, min: number, max: number): number =>
  // `max` can be < `min` when the floating element is larger than the boundary;
  // pin to `min` (the start edge) in that case rather than producing NaN.
  Math.max(min, Math.min(value, max <= min ? min : max));

export { clamp };

/** Base top-left of the floating box for a placement, in the reference's space. */
export function computeCoordsFromPlacement(
  reference: Rect,
  floating: Dimensions,
  placement: Placement,
): Coords {
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const refCenterX = reference.x + reference.width / 2;
  const refCenterY = reference.y + reference.height / 2;

  let coords: Coords;
  switch (side) {
    case "top":
      coords = { x: refCenterX - floating.width / 2, y: reference.y - floating.height };
      break;
    case "bottom":
      coords = { x: refCenterX - floating.width / 2, y: reference.y + reference.height };
      break;
    case "right":
      coords = { x: reference.x + reference.width, y: refCenterY - floating.height / 2 };
      break;
    case "left":
    default:
      coords = { x: reference.x - floating.width, y: refCenterY - floating.height / 2 };
      break;
  }

  // Alignment shifts the floating box along the cross axis so its start/end edge
  // lines up with the reference's start/end edge.
  if (alignment) {
    if (isVerticalSide(side)) {
      coords.x =
        alignment === "start" ? reference.x : reference.x + reference.width - floating.width;
    } else {
      coords.y =
        alignment === "start" ? reference.y : reference.y + reference.height - floating.height;
    }
  }

  return coords;
}

/**
 * Signed overflow of the floating box (at `x,y` with the floating dimensions)
 * past each edge of the boundary, minus `padding`. A positive value means the
 * floating element overflows on that side by that many pixels.
 */
export function detectOverflow(
  state: MiddlewareState,
  padding = 0,
): { top: number; bottom: number; left: number; right: number } {
  const { x, y, rects, boundary } = state;
  const f = {
    left: x,
    top: y,
    right: x + rects.floating.width,
    bottom: y + rects.floating.height,
  };
  return {
    top: boundary.y + padding - f.top,
    left: boundary.x + padding - f.left,
    bottom: f.bottom - (boundary.y + boundary.height - padding),
    right: f.right - (boundary.x + boundary.width - padding),
  };
}

/** Max number of pipeline restarts (flip resets) before we bail, to be safe. */
const MAX_RESETS = 50;

/**
 * Compute the floating element's top-left coordinates (in the boundary's
 * coordinate space) for the given placement, running the middleware pipeline.
 * Middleware may nudge `x`/`y`, write `data`, or `reset` the pipeline with a new
 * placement (how {@link flip} works).
 */
export function computePosition(
  reference: Rect,
  floating: Dimensions,
  config: {
    placement?: Placement;
    strategy?: Strategy;
    middleware?: Middleware[];
    boundary: Rect;
  },
): ComputePositionReturn {
  const initialPlacement = config.placement ?? "bottom";
  const strategy = config.strategy ?? "absolute";
  const middleware = config.middleware ?? [];
  const rects: ElementRects = {
    reference,
    floating: { x: 0, y: 0, width: floating.width, height: floating.height },
  };

  let placement = initialPlacement;
  let { x, y } = computeCoordsFromPlacement(reference, floating, placement);
  let middlewareData: MiddlewareData = {};
  let resets = 0;

  for (let i = 0; i < middleware.length; i++) {
    const { name, fn } = middleware[i];
    const result = fn({
      x,
      y,
      initialPlacement,
      placement,
      strategy,
      middlewareData,
      rects,
      boundary: config.boundary,
    });

    if (typeof result.x === "number") x = result.x;
    if (typeof result.y === "number") y = result.y;
    if (result.data) {
      middlewareData = {
        ...middlewareData,
        [name]: { ...(middlewareData[name] as object | undefined), ...result.data },
      };
    }

    if (result.reset && resets < MAX_RESETS) {
      resets++;
      if (typeof result.reset === "object" && result.reset.placement) {
        placement = result.reset.placement;
      }
      ({ x, y } = computeCoordsFromPlacement(reference, floating, placement));
      i = -1; // restart the pipeline from the first middleware
    }
  }

  return { x, y, placement, strategy, middlewareData };
}
