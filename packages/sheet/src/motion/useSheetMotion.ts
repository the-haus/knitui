import * as React from "react";
import {
  cancelAnimation,
  type SharedValue,
  useSharedValue,
  type WithSpringConfig,
} from "react-native-reanimated";

import { closedOffset, snapOffsets } from "../engine";
import type { SettleResult } from "../engine";
import { animateOffset } from "./animate";

export interface SheetMotionParams {
  /** Snap points (0–100 % visible, most-visible → least-visible). */
  snapPoints: number[];
  /** Measured available height (px). 0 until the layer has laid out. */
  maxHeight: number;
  /** Per-instance spring override. */
  animationConfig?: WithSpringConfig;
  /** Whether a drag past the lowest snap may dismiss the sheet. */
  dismissOnSnapToBottom: boolean;
  /** Commit a new snap index to component state (controlled/uncontrolled). */
  setPosition: (index: number) => void;
  /** Request the sheet close (drag-to-dismiss / snap-to-bottom). */
  requestClose: () => void;
}

export interface SheetMotion {
  /** The single source of truth: panel translateY (px). */
  offset: SharedValue<number>;
  /** Snap offsets, ascending (index 0 = most open). */
  offsets: number[];
  /** Fully-closed (off-screen) offset. */
  closed: number;
  /** Offset where the scrim begins to fade (the least-open snap). */
  fadeStart: number;
  /** Whether dragging past the lowest snap dismisses. */
  dismissible: boolean;
  /** Spring config in effect (default or per-instance). */
  spring?: WithSpringConfig;
  /** Animate to a snap WITHOUT writing state (external `position` sync). */
  glideTo: (index: number) => void;
  /** Snap from the closed position on open (instant reset → spring up). */
  openFromClosed: (index: number) => void;
  /** Animate to the closed position; `onDone` fires when it settles. */
  animateClose: (onDone: () => void) => void;
  /** Snap to an index AND commit it to state (handle / buttons / api). */
  snapTo: (index: number) => void;
  /** Advance to the next snap, wrapping (handle tap). */
  cycle: (currentIndex: number) => void;
  /** Apply a drag {@link SettleResult} to state (animation already applied UI-thread). */
  handleSettle: (result: SettleResult) => void;
}

/** Far-off-screen sentinel offset used before the layer has measured. */
const OFFSCREEN = 10000;

/** Clamp an index into the snap range. */
function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), Math.max(0, length - 1));
}

/**
 * Owns the panel `offset` SharedValue and derives the snap geometry from the
 * measured height. Returns a controller the gesture, handle, buttons, imperative
 * API, and open/close lifecycle all drive. No React state lives here — snap
 * commits are forwarded to the component via `setPosition`.
 */
export function useSheetMotion(params: SheetMotionParams): SheetMotion {
  const {
    snapPoints,
    maxHeight,
    animationConfig,
    dismissOnSnapToBottom,
    setPosition,
    requestClose,
  } = params;

  // Start parked far off-screen so the panel is invisible until the layer has
  // measured and the open animation parks it at the real closed offset — no
  // first-frame flash of a fully-open panel before the geometry is known.
  const offset = useSharedValue(OFFSCREEN);

  // Stop any in-flight spring when the sheet leaves the tree, so a removed sheet
  // never leaves a reanimated loop running on a detached shared value.
  React.useEffect(() => () => cancelAnimation(offset), [offset]);

  const offsets = React.useMemo(() => snapOffsets(snapPoints, maxHeight), [snapPoints, maxHeight]);
  const closed = closedOffset(maxHeight);
  const fadeStart = offsets.length > 0 ? offsets[offsets.length - 1] : closed;
  const dismissible = dismissOnSnapToBottom;
  const spring = animationConfig;

  const glideTo = React.useCallback(
    (index: number) => {
      if (offsets.length === 0) return;
      animateOffset(offset, offsets[clampIndex(index, offsets.length)], spring);
    },
    [offset, offsets, spring],
  );

  const openFromClosed = React.useCallback(
    (index: number) => {
      if (offsets.length === 0) return;
      offset.value = closed;
      animateOffset(offset, offsets[clampIndex(index, offsets.length)], spring);
    },
    [offset, offsets, closed, spring],
  );

  const animateClose = React.useCallback(
    (onDone: () => void) => {
      animateOffset(offset, closed, spring, onDone);
    },
    [offset, closed, spring],
  );

  const snapTo = React.useCallback(
    (index: number) => {
      if (offsets.length === 0) return;
      const i = clampIndex(index, offsets.length);
      animateOffset(offset, offsets[i], spring);
      setPosition(i);
    },
    [offset, offsets, spring, setPosition],
  );

  const cycle = React.useCallback(
    (currentIndex: number) => {
      if (offsets.length === 0) return;
      snapTo((currentIndex + 1) % offsets.length);
    },
    [offsets.length, snapTo],
  );

  const handleSettle = React.useCallback(
    (result: SettleResult) => {
      if (result.dismiss) requestClose();
      else setPosition(result.index);
    },
    [requestClose, setPosition],
  );

  return {
    offset,
    offsets,
    closed,
    fadeStart,
    dismissible,
    spring,
    glideTo,
    openFromClosed,
    animateClose,
    snapTo,
    cycle,
    handleSettle,
  };
}
