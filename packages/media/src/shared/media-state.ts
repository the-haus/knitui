/**
 * Pure, platform-free state helpers shared by both media domains (`@knitui/media/audio`
 * and `@knitui/media/video`). DOM-free / RN-free / React-free so they can be unit-tested
 * directly and reused by every web and native adapter. Each domain keeps only its own
 * `createInitialState` (the field set differs); these structural helpers live here once.
 */
import type { BaseMediaState } from "./media-types";

/** Coerce an `unknown` registry-config value to a number, else the fallback. */
export const numberOr = (v: unknown, fallback: number): number =>
  typeof v === "number" ? v : fallback;

/** Coerce an `unknown` registry-config value to a boolean, else the fallback. */
export const booleanOr = (v: unknown, fallback: boolean): boolean =>
  typeof v === "boolean" ? v : fallback;

/**
 * The neutral starting values for the {@link BaseMediaState} fields, before any
 * source has loaded. Each domain's `createInitialState` spreads this and adds its
 * own fields, so the common defaults are declared in exactly one place.
 */
export function createBaseState(overrides?: Partial<BaseMediaState>): BaseMediaState {
  return {
    status: "idle",
    playing: false,
    currentTime: 0,
    duration: 0,
    bufferedPosition: -1,
    volume: 1,
    muted: false,
    playbackRate: 1,
    loop: false,
    isLive: false,
    ended: false,
    error: null,
    ...overrides,
  };
}

/**
 * Produces the next snapshot from a patch, returning the SAME reference when the
 * patch changes nothing — so subscribers can bail out cheaply (`prev === next`).
 * Generic so every controller (audio player/playlist/recorder, video) and the
 * shared media-session core share ONE merge — `undefined` patch values are
 * treated as "no change".
 */
export function mergeState<T extends object>(prev: T, patch: Partial<T>): T {
  let changed = false;
  for (const key in patch) {
    const k = key as keyof T;
    if (patch[k] !== undefined && patch[k] !== prev[k]) {
      changed = true;
      break;
    }
  }
  if (!changed) return prev;
  return { ...prev, ...patch };
}

/**
 * Playback progress as a fraction in `[0, 1]`. Returns `0` when the duration is
 * unknown or non-finite (live streams), so a progress bar never jumps to a
 * bogus value.
 */
export function progressOf(state: { currentTime: number; duration: number }): number {
  const { currentTime, duration } = state;
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const ratio = currentTime / duration;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
}

/**
 * Buffered fraction in `[0, 1]` from a buffered position. `-1` (unknown) yields
 * `0`. Used to paint the buffered underlay on the scrubber.
 */
export function bufferedFractionOf(state: { bufferedPosition: number; duration: number }): number {
  const { bufferedPosition, duration } = state;
  if (bufferedPosition < 0) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const ratio = bufferedPosition / duration;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
}

/**
 * Picks the buffered end nearest-but-not-past the current time from a list of
 * `[start, end]` ranges (the shape produced by `HTMLMediaElement.buffered`).
 * Returns `-1` when no range contains the current time.
 */
export function bufferedEndForTime(
  ranges: ReadonlyArray<readonly [number, number]>,
  currentTime: number,
): number {
  for (const [start, end] of ranges) {
    if (currentTime >= start && currentTime <= end) {
      return end;
    }
  }
  // Fall back to the furthest range end that begins before the current time.
  let best = -1;
  for (const [start, end] of ranges) {
    if (start <= currentTime && end > best) best = end;
  }
  return best;
}
