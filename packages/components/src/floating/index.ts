export { computePosition } from "./core";

export type {
  Alignment,
  Coords,
  Middleware,
  MiddlewareData,
  MiddlewareReturn,
  MiddlewareState,
  Placement,
  Rect,
  Side,
  Strategy,
} from "./core";

/**
 * Self-contained cross-platform floating (positioning) layer. Replaces the
 * `@floating-ui/*` dependency with a small engine that computes positions in
 * window coordinates and subtracts the floating element's container origin, so it
 * works correctly inside Portals (teleported content) on web and native alike.
 *
 * Only the middleware the kit needs is implemented fully (`offset`/`flip`/
 * `shift`/`limitShift`/`arrow`); `size`/`hide`/`inline` are lean and exist for
 * API stability.
 */
export { arrow, flip, hide, inline, limitShift, offset, shift, size } from "./middleware";

export type { ArrowOptions } from "./middleware";

export { autoUpdate } from "./platform";

export {
  FloatingOverrideContext,
  useFloating,
  type UseFloatingFn,
  type UseFloatingOverrideFn,
  type UseFloatingProps,
  type UseFloatingReturn,
} from "./useFloating";
