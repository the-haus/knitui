"use client";

import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from "react";

import type { Map as MLMap } from "maplibre-gl";

import type { LngLat, LngLatBounds, ViewPadding } from "../../types/primitives";
import { useMapContext } from "../MapView/MapView.context";
import type {
  CameraAnimationOptions,
  CameraCenterOptions,
  CameraEasing,
  CameraOptions,
  CameraProps,
  CameraRef,
  CameraStop,
  InitialViewState,
} from "./Camera.types";

// ── Helpers ─────────────────────────────────────────────────────────

function toPaddingOptions(
  padding?: ViewPadding,
): { top: number; bottom: number; left: number; right: number } | undefined {
  if (!padding) return undefined;
  return {
    top: padding.top ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
    right: padding.right ?? 0,
  };
}

function tupleEquals(a: readonly number[] | undefined, b: readonly number[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function paddingEquals(a: ViewPadding | undefined, b: ViewPadding | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.bottom === b.bottom && a.left === b.left && a.right === b.right;
}

/**
 * Whether two camera stops describe the same camera. Every field is a scalar, a
 * short number tuple or a four-number padding object, so this is a handful of
 * `===` checks — replaces a `JSON.stringify` that used to run in the render body.
 */
function cameraStopEquals(a: CameraStop | null, b: CameraStop): boolean {
  if (!a) return false;
  const prev = a as Record<string, unknown>;
  const next = b as Record<string, unknown>;
  return (
    tupleEquals(prev.center as number[] | undefined, next.center as number[] | undefined) &&
    tupleEquals(prev.bounds as number[] | undefined, next.bounds as number[] | undefined) &&
    prev.bearing === next.bearing &&
    prev.pitch === next.pitch &&
    prev.zoom === next.zoom &&
    prev.duration === next.duration &&
    prev.easing === next.easing &&
    paddingEquals(prev.padding as ViewPadding | undefined, next.padding as ViewPadding | undefined)
  );
}

function resolveEasing(easing?: CameraEasing, duration?: number): "flyTo" | "easeTo" | "jumpTo" {
  if (easing === "fly") return "flyTo";
  if (easing === "linear") return "easeTo";
  if (easing === "ease") return "easeTo";
  if (duration && duration > 0) return "easeTo";
  return "jumpTo";
}

// Exported for unit testing the camera-stop → MapLibre call mapping.
export function applyStop(map: MLMap, stop: CameraStop): void {
  // Stop any in-progress animation
  if (map.isMoving()) {
    map.stop();
  }

  if ("bounds" in stop && stop.bounds) {
    const padding = toPaddingOptions(stop.padding);
    const fitOptions: Record<string, unknown> = {
      padding,
      duration: stop.duration ?? 0,
    };

    if (stop.bearing !== undefined) fitOptions.bearing = stop.bearing;
    if (stop.pitch !== undefined) fitOptions.pitch = stop.pitch;

    const bounds = stop.bounds;
    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      fitOptions as Parameters<MLMap["fitBounds"]>[1],
    );
    return;
  }

  const options: Record<string, unknown> = {};

  if ("center" in stop && stop.center) {
    options.center = [stop.center[0], stop.center[1]];
  }
  if (stop.zoom !== undefined) {
    options.zoom = stop.zoom;
  }
  if (stop.bearing !== undefined) {
    options.bearing = stop.bearing;
  }
  if (stop.pitch !== undefined) {
    options.pitch = stop.pitch;
  }
  if (stop.padding) {
    options.padding = toPaddingOptions(stop.padding);
  }

  const duration = ("duration" in stop ? stop.duration : undefined) ?? 0;
  options.duration = duration;

  const easing = "easing" in stop ? stop.easing : undefined;
  const mode = resolveEasing(easing, duration);

  switch (mode) {
    case "flyTo":
      map.flyTo(options as Parameters<MLMap["flyTo"]>[0]);
      break;
    case "easeTo": {
      const easeOptions = { ...options } as Parameters<MLMap["easeTo"]>[0];
      // Only set `easing` for the linear case. Passing `easing: undefined`
      // explicitly would overwrite MapLibre's `defaultEasing` (it merges
      // options via `for (const k in src)`), leaving `easing` undefined and
      // throwing every animation frame — so the ease silently never runs.
      if (easing === "linear") {
        easeOptions.easing = (t: number) => t;
      }
      map.easeTo(easeOptions);
      break;
    }
    case "jumpTo":
    default:
      map.jumpTo(options as Parameters<MLMap["jumpTo"]>[0]);
      break;
  }
}

function applyInitialViewState(map: MLMap, ivs: InitialViewState): void {
  const options: Record<string, unknown> = { duration: 0 };

  if ("center" in ivs && ivs.center) {
    options.center = [ivs.center[0], ivs.center[1]];
  }
  if ("bounds" in ivs && ivs.bounds) {
    const bounds = ivs.bounds;
    // Only forward bearing/pitch when defined — passing an explicit
    // `bearing: undefined` makes MapLibre's fitBounds normalize it to NaN
    // (`"bearing" in options` is true) and crash in `_calcMatrices`.
    const fitOptions: Record<string, unknown> = {
      padding: toPaddingOptions(ivs.padding),
      duration: 0,
    };
    if (ivs.bearing !== undefined) fitOptions.bearing = ivs.bearing;
    if (ivs.pitch !== undefined) fitOptions.pitch = ivs.pitch;

    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      fitOptions as Parameters<MLMap["fitBounds"]>[1],
    );
    return;
  }
  if (ivs.zoom !== undefined) options.zoom = ivs.zoom;
  if (ivs.bearing !== undefined) options.bearing = ivs.bearing;
  if (ivs.pitch !== undefined) options.pitch = ivs.pitch;
  if (ivs.padding) options.padding = toPaddingOptions(ivs.padding);

  map.jumpTo(options as Parameters<MLMap["jumpTo"]>[0]);
}

// ── Component ───────────────────────────────────────────────────────

export const Camera = memo(
  forwardRef<CameraRef, CameraProps>(function Camera(props, ref) {
    const { initialViewState, maxBounds, maxZoom, minZoom, trackUserLocation } = props;
    // CameraProps is Partial<CameraStop> which is a union — access union-specific props via `in`
    const anyProps = props as Record<string, unknown>;
    const center = ("center" in anyProps ? anyProps.center : undefined) as LngLat | undefined;
    const bounds = ("bounds" in anyProps ? anyProps.bounds : undefined) as LngLatBounds | undefined;
    const duration = ("duration" in anyProps ? anyProps.duration : undefined) as number | undefined;
    const easing = ("easing" in anyProps ? anyProps.easing : undefined) as CameraEasing | undefined;
    const { bearing, padding, pitch, zoom } = props;
    const { mapEngine, ready } = useMapContext();
    const map = mapEngine as MLMap | null;
    const defaultAppliedRef = useRef(false);

    // --- Imperative methods ---

    const jumpTo = (options: CameraCenterOptions & CameraOptions): void => {
      if (!map) return;
      applyStop(map, { ...options, duration: 0 });
    };

    const easeTo = (
      options: CameraCenterOptions & CameraOptions & CameraAnimationOptions,
    ): void => {
      if (!map) return;
      applyStop(map, { ...options, easing: options.easing ?? "ease" });
    };

    const flyTo = (options: CameraCenterOptions & CameraOptions & CameraAnimationOptions): void => {
      if (!map) return;
      applyStop(map, { ...options, easing: "fly" });
    };

    const fitBounds = (
      fitBoundsValue: LngLatBounds,
      options?: CameraOptions & CameraAnimationOptions,
    ): void => {
      if (!map) return;
      applyStop(map, { ...options, bounds: fitBoundsValue, easing: options?.easing ?? "ease" });
    };

    const zoomTo = (zoomValue: number, options?: CameraOptions & CameraAnimationOptions): void => {
      if (!map) return;
      applyStop(map, { ...options, zoom: zoomValue, easing: options?.easing ?? "fly" });
    };

    const setStop = async (stop: CameraStop): Promise<void> => {
      if (!map) return;
      applyStop(map, stop);
    };

    useImperativeHandle(ref, (): CameraRef => ({
      jumpTo,
      easeTo,
      flyTo,
      fitBounds,
      zoomTo,
      setStop,
    }));

    // --- Initial view state (applied once on ready) ---

    useEffect(() => {
      if (!ready || !map || defaultAppliedRef.current) return;
      defaultAppliedRef.current = true;

      if (initialViewState) {
        applyInitialViewState(map, initialViewState);
      }
    }, [ready, map, initialViewState]);

    // --- Declarative camera props ---
    // Build the stop object dynamically to satisfy the union type constraint.
    // Memoized on the numeric/scalar inputs (plus the coordinate tuples, which are
    // compared element-wise below) so the render body allocates nothing when
    // nothing moved — this used to be a `JSON.stringify(cameraStop)` on EVERY
    // render of every ancestor.
    const cameraStop = useMemo(
      () =>
        ({
          ...(center ? { center } : {}),
          ...(bounds ? { bounds } : {}),
          bearing,
          pitch,
          zoom,
          padding,
          duration,
          easing,
        }) as CameraStop,
      [center, bounds, bearing, pitch, zoom, padding, duration, easing],
    );

    const prevStopRef = useRef<CameraStop | null>(null);

    const isInitialRef = useRef(true);
    useEffect(() => {
      if (!ready || !map || trackUserLocation) return;

      // Skip the first render — initialViewState handles initial position
      if (isInitialRef.current) {
        isInitialRef.current = false;
        if (!initialViewState) {
          applyStop(map, { ...cameraStop, duration: 0 });
        }
        prevStopRef.current = cameraStop;
        return;
      }

      // Hand-rolled scalar/tuple compare instead of serializing the stop: every
      // field is a number, a short number tuple, a string or a small padding
      // object, so this is a handful of `===` checks with no allocation.
      if (cameraStopEquals(prevStopRef.current, cameraStop)) return;
      prevStopRef.current = cameraStop;

      applyStop(map, cameraStop);
    }, [ready, map, cameraStop, initialViewState, trackUserLocation]);

    // --- Zoom constraints ---

    useEffect(() => {
      if (!map || trackUserLocation) return;
      if (minZoom !== undefined) map.setMinZoom(minZoom);
    }, [map, minZoom, trackUserLocation]);

    useEffect(() => {
      if (!map || trackUserLocation) return;
      if (maxZoom !== undefined) map.setMaxZoom(maxZoom);
    }, [map, maxZoom, trackUserLocation]);

    // --- Max bounds ---

    useEffect(() => {
      if (!map || trackUserLocation) return;
      if (maxBounds) {
        map.setMaxBounds([
          [maxBounds[0], maxBounds[1]],
          [maxBounds[2], maxBounds[3]],
        ]);
      } else {
        map.setMaxBounds(undefined);
      }
    }, [map, maxBounds, trackUserLocation]);

    return null;
  }),
);
