/**
 * The low-level React positioning hook. Stores the reference/floating elements,
 * measures them through the platform layer (`./platform`, web/native split),
 * runs {@link computePosition}, and converts the window-space result into
 * coordinates relative to the floating element's own container by subtracting the
 * measured container origin. That subtraction is the crux of correct positioning
 * inside Portals: the floating element can be teleported anywhere and the numbers
 * still land it on its reference.
 */
import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import {
  computePosition,
  type Dimensions,
  type Middleware,
  type MiddlewareData,
  type Placement,
  type Strategy,
} from "./core";
import { getViewport, measure } from "./platform";

/** The reference/floating refs + their setters (a ref callback friendly shape). */
export type FloatingRefs = {
  reference: React.MutableRefObject<TamaguiElement | null>;
  floating: React.MutableRefObject<TamaguiElement | null>;
  setReference: (node: TamaguiElement | null) => void;
  setFloating: (node: TamaguiElement | null) => void;
};

/** Props accepted by {@link usePosition} (and, extended, by `useFloating`). */
export type UsePositionProps = {
  /** Requested placement (may be flipped by the `flip` middleware). @default "bottom" */
  placement?: Placement;
  /** Positioning strategy. @default "absolute" */
  strategy?: Strategy;
  /** Ordered middleware pipeline (offset/flip/shift/custom). */
  middleware?: Middleware[];
  /**
   * Called with `(reference, floating, update)` once both elements are mounted;
   * returns a cleanup. Pass `autoUpdate` to keep the position in sync.
   */
  whileElementsMounted?: (
    reference: TamaguiElement,
    floating: TamaguiElement,
    update: () => void,
  ) => () => void;
};

/** The value returned by {@link usePosition} / `useFloating`. */
export type UsePositionReturn = {
  x: number | null;
  y: number | null;
  placement: Placement;
  strategy: Strategy;
  middlewareData: MiddlewareData;
  isPositioned: boolean;
  /**
   * Recompute the position. Pass the floating element's measured size (e.g. from
   * its `onLayout`) so native skips an extra async measure and repositions
   * reactively when the content size changes.
   */
  update: (floatingSize?: Dimensions) => void;
  refs: FloatingRefs;
  elements: { reference: TamaguiElement | null; floating: TamaguiElement | null };
  floatingStyles: { position: Strategy; top: number; left: number };
};

type PositionData = {
  x: number | null;
  y: number | null;
  placement: Placement;
  strategy: Strategy;
  middlewareData: MiddlewareData;
  isPositioned: boolean;
};

export function usePosition(props: UsePositionProps): UsePositionReturn {
  "use no memo";

  const placement = props.placement ?? "bottom";
  const strategy = props.strategy ?? "absolute";
  const { middleware, whileElementsMounted } = props;

  const [referenceEl, setReferenceEl] = React.useState<TamaguiElement | null>(null);
  const [floatingEl, setFloatingEl] = React.useState<TamaguiElement | null>(null);

  const referenceRef = React.useRef<TamaguiElement | null>(null);
  const floatingRef = React.useRef<TamaguiElement | null>(null);
  const mountedRef = React.useRef(true);
  // The floating element's size, supplied by its `onLayout` (see `update`). When
  // set, native uses it instead of an async measure — reliable and timely, and a
  // change to it (content resized) re-runs positioning.
  const floatingSizeRef = React.useRef<Dimensions | null>(null);
  // Coalesce overlapping async (native) measurements: at most one is in flight,
  // and a request that arrives mid-measure re-runs once when it settles (so the
  // final layout's measurement is never dropped).
  const measuringRef = React.useRef(false);
  const pendingRef = React.useRef(false);

  // Latest config, read by the stable `update` callback so it never goes stale.
  const latest = React.useRef({ placement, strategy, middleware });
  latest.current = { placement, strategy, middleware };

  const [data, setData] = React.useState<PositionData>({
    x: null,
    y: null,
    placement,
    strategy,
    middlewareData: {},
    isPositioned: false,
  });

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const update = React.useCallback((floatingSize?: Dimensions) => {
    if (
      floatingSize &&
      Number.isFinite(floatingSize.width) &&
      Number.isFinite(floatingSize.height)
    ) {
      floatingSizeRef.current = { width: floatingSize.width, height: floatingSize.height };
    }

    const reference = referenceRef.current;
    const floating = floatingRef.current;
    if (!reference || !floating) return;
    // If a measurement is still in flight, mark that another is wanted and bail;
    // it will re-run once when the current one settles.
    if (measuringRef.current) {
      pendingRef.current = true;
      return;
    }
    measuringRef.current = true;
    pendingRef.current = false;

    const cfg = latest.current;
    void measure(reference, floating, cfg.strategy, floatingSizeRef.current)
      .then((m) => {
        if (!mountedRef.current || !m.reference || !m.floating) return;
        // Wait for real layout: a 0×0 box means the element hasn't laid out yet,
        // and positioning against it would flash the overlay at the wrong spot.
        // The consumer's `onLayout` re-runs `update()` once it has real size.
        if (m.reference.width === 0 && m.reference.height === 0) return;
        if (m.floating.width === 0 && m.floating.height === 0) return;
        const result = computePosition(m.reference, m.floating, {
          placement: cfg.placement,
          strategy: cfg.strategy,
          middleware: cfg.middleware,
          boundary: getViewport(),
        });
        const x = result.x - m.containerOrigin.x;
        const y = result.y - m.containerOrigin.y;
        // Opt-in diagnostics: set `globalThis.__KNITUI_FLOATING_DEBUG__ = true`
        // (e.g. in a screen) to log what was measured vs. computed. Helps pinpoint
        // a placement issue: compare the reference rect to the resolved x/y.
        if ((globalThis as { __KNITUI_FLOATING_DEBUG__?: boolean }).__KNITUI_FLOATING_DEBUG__) {
          // eslint-disable-next-line no-console
          console.log("[floating]", {
            reference: m.reference,
            floatingSize: m.floating,
            containerOrigin: m.containerOrigin,
            viewport: getViewport(),
            requested: cfg.placement,
            resolved: { x, y, placement: result.placement },
          });
        }
        setData((prev) => {
          // Bail out of re-renders when nothing moved (avoids churn when an
          // overlay sits still). The middleware data is only compared on the cheap
          // path where coords are unchanged.
          if (
            prev.isPositioned &&
            prev.x === x &&
            prev.y === y &&
            prev.placement === result.placement &&
            prev.strategy === cfg.strategy &&
            JSON.stringify(prev.middlewareData) === JSON.stringify(result.middlewareData)
          ) {
            return prev;
          }
          return {
            x,
            y,
            placement: result.placement,
            strategy: cfg.strategy,
            middlewareData: result.middlewareData,
            isPositioned: true,
          };
        });
      })
      .finally(() => {
        measuringRef.current = false;
        if (pendingRef.current) update();
      });
  }, []);

  const setReference = React.useCallback((node: TamaguiElement | null) => {
    if (referenceRef.current === node) return;
    referenceRef.current = node;
    setReferenceEl(node);
  }, []);

  const setFloating = React.useCallback((node: TamaguiElement | null) => {
    if (floatingRef.current === node) return;
    floatingRef.current = node;
    setFloatingEl(node);
  }, []);

  // Position once both elements exist; subscribe to live updates if requested.
  React.useEffect(() => {
    if (!referenceEl || !floatingEl) {
      if (!floatingEl) {
        // Floating element unmounted: forget its size and mark not-positioned so
        // the next open re-measures cleanly.
        floatingSizeRef.current = null;
        setData((d) => (d.isPositioned ? { ...d, isPositioned: false } : d));
      }
      return;
    }
    if (whileElementsMounted) {
      return whileElementsMounted(referenceEl, floatingEl, update);
    }
    update();
    return undefined;
  }, [referenceEl, floatingEl, whileElementsMounted, update]);

  // Reposition when the requested placement/strategy changes while open.
  React.useEffect(() => {
    if (referenceRef.current && floatingRef.current) update();
  }, [placement, strategy, update]);

  const refs = React.useMemo<FloatingRefs>(
    () => ({ reference: referenceRef, floating: floatingRef, setReference, setFloating }),
    [setReference, setFloating],
  );

  // Memoize the derived objects so overlay consumers (Popover/Tooltip/HoverCard/
  // Menu/Combobox dropdown) that spread `floatingStyles` or read `elements` get
  // STABLE identities across unrelated parent renders. `data` only changes
  // identity when a coordinate actually moves (the `setData` bail-out upstream),
  // so these stay referentially equal while the overlay sits still. Manual memos
  // are required because this hook opts out of the compiler (`"use no memo"`).
  const elements = React.useMemo(
    () => ({ reference: referenceEl, floating: floatingEl }),
    [referenceEl, floatingEl],
  );

  const floatingStyles = React.useMemo(
    () => ({ position: data.strategy, top: data.y ?? 0, left: data.x ?? 0 }),
    [data.strategy, data.y, data.x],
  );

  return React.useMemo<UsePositionReturn>(
    () => ({
      x: data.x,
      y: data.y,
      placement: data.placement,
      strategy: data.strategy,
      middlewareData: data.middlewareData,
      isPositioned: data.isPositioned,
      update,
      refs,
      elements,
      floatingStyles,
    }),
    [data, update, refs, elements, floatingStyles],
  );
}
