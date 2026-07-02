/**
 * Forwards a controller's granular events to a player root's declarative
 * callback props. Audio and video had byte-identical effects for this (the
 * `onReady` latch on the first `readyToPlay`, plus `onStatusChange` /
 * `onPlayingChange` / `onTimeUpdate` / `onEnded` / `onError`), so the wiring lives
 * here once and both roots call it.
 *
 * The events used (`statusChange` / `playingChange` / `timeUpdate` / `playToEnd` /
 * `error`) are all part of {@link BaseMediaEventMap}, so any media controller
 * satisfies the structural `on` contract.
 *
 * T1 tier: T0 + React.
 */
import * as React from "react";

import type { MediaError, MediaStatus, MediaTimeUpdate } from "../../shared";

/** The granular-event subscriber surface every media controller exposes. */
export interface MediaCallbackController {
  on(
    type: "statusChange",
    listener: (payload: { status: MediaStatus; error: MediaError | null }) => void,
  ): () => void;
  on(type: "playingChange", listener: (payload: { playing: boolean }) => void): () => void;
  on(type: "timeUpdate", listener: (payload: MediaTimeUpdate) => void): () => void;
  on(type: "playToEnd", listener: () => void): () => void;
  on(type: "error", listener: (payload: MediaError) => void): () => void;
}

/** The declarative callback props a player root forwards. */
export interface MediaCallbacks {
  /** Fired once, the first time the source reaches `readyToPlay`. */
  onReady?: () => void;
  onStatusChange?: (status: MediaStatus, error: MediaError | null) => void;
  onPlayingChange?: (playing: boolean) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (error: MediaError) => void;
}

/** Subscribe the given callbacks to the controller's events for the effect's life. */
export function useMediaCallbacks(
  controller: MediaCallbackController,
  callbacks: MediaCallbacks,
): void {
  const { onReady, onStatusChange, onPlayingChange, onTimeUpdate, onEnded, onError } = callbacks;
  React.useEffect(() => {
    const readyFired = { done: false };
    const unsubs = [
      controller.on("statusChange", (p) => {
        onStatusChange?.(p.status, p.error);
        if (p.status === "readyToPlay" && !readyFired.done) {
          readyFired.done = true;
          onReady?.();
        }
      }),
      onPlayingChange && controller.on("playingChange", (p) => onPlayingChange(p.playing)),
      onTimeUpdate && controller.on("timeUpdate", (p) => onTimeUpdate(p.currentTime)),
      onEnded && controller.on("playToEnd", () => onEnded()),
      onError && controller.on("error", (e) => onError(e)),
    ].filter(Boolean) as Array<() => void>;
    return () => unsubs.forEach((u) => u());
  }, [controller, onReady, onStatusChange, onPlayingChange, onTimeUpdate, onEnded, onError]);
}
