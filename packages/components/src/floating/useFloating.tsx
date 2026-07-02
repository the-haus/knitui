/**
 * Public cross-platform `useFloating`. Wraps the low-level {@link usePosition}
 * hook with:
 * - a `rounded` middleware so the floating element lands on whole pixels (no
 *   sub-pixel blur), and
 * - a {@link FloatingOverrideContext} escape hatch so a parent (e.g. a hoverable
 *   popover group) can swap in a coordinated implementation.
 *
 * The return shape matches what `Popover`/`Tooltip`/`HoverCard` consume:
 * `{ x, y, placement, strategy, isPositioned, update, middlewareData, refs, … }`.
 */
import * as React from "react";

import type { Middleware } from "./core";
import { usePosition, type UsePositionProps, type UsePositionReturn } from "./use-position";

export type UseFloatingReturn = UsePositionReturn;

export type UseFloatingProps = UsePositionProps & {
  /**
   * Native-only hint kept for API compatibility; positioning is computed in
   * window coordinates, so it has no effect.
   */
  sameScrollView?: boolean;
};

export type UseFloatingFn = (props: UseFloatingProps) => UseFloatingReturn;
export type UseFloatingOverrideFn = (props?: UseFloatingProps) => UseFloatingReturn;

/**
 * Lets a parent swap in a coordinated `useFloating`. Defaults to `null` → the
 * built-in implementation is used.
 */
export const FloatingOverrideContext = React.createContext<UseFloatingOverrideFn | null>(null);

/** Snap the resolved coordinates to whole pixels to avoid sub-pixel blur. */
const rounded: Middleware = {
  name: "rounded",
  fn({ x, y }) {
    return { x: Math.round(x), y: Math.round(y) };
  },
};

export const useFloating = (props: UseFloatingProps): UseFloatingReturn => {
  "use no memo";

  const override = React.useContext(FloatingOverrideContext);
  const { sameScrollView: _sameScrollView, ...rest } = props;
  const impl = override ?? usePosition;
  return impl({ ...rest, middleware: [...(rest.middleware ?? []), rounded] });
};
