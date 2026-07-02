/**
 * Pure state helpers for the audio controllers. DOM-free / RN-free so they can
 * be unit-tested directly and shared by both the web and native adapters. The
 * structural helpers (`mergeState`, `progressOf`, `bufferedFractionOf`,
 * `bufferedEndForTime`) live once in `@knitui/media`'s shared internals and are
 * re-exported here so existing `../engine` imports keep working; only the
 * audio-shaped `createInitialState` is domain-specific.
 */
import {
  bufferedEndForTime,
  bufferedFractionOf,
  createBaseState,
  mergeState,
  progressOf,
} from "../../shared";
import type { AudioControllerState } from "../types";

export { bufferedEndForTime, bufferedFractionOf, mergeState, progressOf };

/** The neutral starting snapshot before any source has loaded. */
export function createInitialState(
  overrides?: Partial<AudioControllerState>,
): AudioControllerState {
  return {
    ...createBaseState(),
    shouldCorrectPitch: true,
    isBuffering: false,
    isLoaded: false,
    lockScreenActive: false,
    metadata: null,
    ...overrides,
  };
}
