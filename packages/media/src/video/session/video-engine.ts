/**
 * Entry for the shared video engine — WEB. One kit-owned {@link WebVideoPlayer}
 * wrapped in the same {@link ExpoVideoController} and generic session the native
 * build uses. The `<video>` element is VISUAL: it is rendered once by
 * {@link MediaProvider} (through `VideoSurface`) and teleported into the active
 * player's frame. The native build creates an `expo-video` player instead
 * (`video-engine.native.ts`); the web build never loads expo.
 */
import type { VideoPlayer } from "expo-video";
import * as React from "react";

import { MediaContext } from "../../provider/context";
import { ExpoVideoController } from "../controller/expo-controller";
import { WebVideoPlayer } from "../web/web-video-player";
import { buildVideoEngine, type VideoEngine } from "./video-engine.shared";

/** Create a fresh, isolated video engine (owned by `<MediaProvider>`). */
export function createVideoEngine(): VideoEngine {
  // The controller is typed over expo's `VideoPlayer`; the web player implements
  // the part of it the controller calls.
  const player = new WebVideoPlayer(null) as unknown as VideoPlayer;
  return buildVideoEngine(new ExpoVideoController(player));
}

let singleton: VideoEngine | null = null;

/** The process-wide video engine — the ONE real player for the whole app. */
export function getSharedVideoSession(): VideoEngine {
  if (!singleton) singleton = createVideoEngine();
  return singleton;
}

/** TEST ONLY: dispose and clear the process singleton. */
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
