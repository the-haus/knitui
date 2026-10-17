/**
 * Entry for the shared video engine: one imperatively-created `expo-video` player
 * (NOT the `useVideoPlayer` hook, so its lifecycle is owned by the engine, not a
 * component) wrapped in an {@link ExpoVideoController} and the generic session.
 *
 * Cross-platform — `expo-video` resolves to its native module on device and to
 * its `.web` backend in the browser. The `VideoView` is VISUAL: it is rendered
 * once by {@link MediaProvider} and teleported into the active player's frame,
 * binding to this controller's player via the surface.
 */
import { createVideoPlayer } from "expo-video";
import * as React from "react";

import { MediaContext } from "../../provider/context";
import { ExpoVideoController } from "../controller/expo-controller";
import { buildVideoEngine, type VideoEngine } from "./video-engine.shared";

/** Create a fresh, isolated video engine (owned by `<MediaProvider>`). */
export function createVideoEngine(): VideoEngine {
  const player = createVideoPlayer(null);
  return buildVideoEngine(new ExpoVideoController(player));
}

let singleton: VideoEngine | null = null;

/**
 * The process-wide video engine — the ONE real `expo-video` player for the whole
 * app. Both `<MediaProvider>` and the no-provider fallback resolve THIS, so there
 * is never a second, competing player. Idempotent, so a StrictMode/double-invoked
 * caller gets the same instance.
 */
export function getSharedVideoSession(): VideoEngine {
  if (!singleton) singleton = createVideoEngine();
  return singleton;
}

/**
 * TEST ONLY: dispose and clear the process singleton so the next
 * {@link getSharedVideoSession} builds a fresh one. Lets each test start from a
 * clean shared player (the engine is process-global in production and never torn
 * down there).
 */
export function resetSharedVideoSessionForTests(): void {
  singleton?.dispose();
  singleton = null;
}

/**
 * Resolve the shared video engine: from the {@link MediaProvider} when present,
 * else the process-wide singleton (so non-UI / test code still works).
 */
export function useVideoEngine(): VideoEngine {
  const engines = React.useContext(MediaContext);
  return engines?.video ?? getSharedVideoSession();
}
