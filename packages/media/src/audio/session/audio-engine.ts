/**
 * Entry for the shared audio engine — WEB. One kit-owned `HTMLAudioElement`
 * player ({@link WebAudioPlayer}) wrapped in the same {@link ExpoAudioController}
 * and generic session the native build uses. The native build creates an
 * `expo-audio` player instead (`audio-engine.native.ts`); the web build never
 * loads expo, so `expo-audio` and its native-module runtime stay out of the web
 * bundle.
 *
 * Audio has no visual surface, so there is nothing to teleport.
 */
import type { AudioPlayer } from "expo-audio";
import * as React from "react";

import { MediaContext } from "../../provider/context";
import { ExpoAudioController } from "../controller/expo-controller";
import { WebAudioPlayer } from "../web/web-audio-player";
import { type AudioEngine, buildAudioEngine } from "./audio-engine.shared";

/** Status cadence while playing (see `audio-engine.native.ts`). */
const AUDIO_STATUS_UPDATE_INTERVAL_MS = 250;

/** Create a fresh, isolated audio engine (owned by `<MediaProvider>`). */
export function createAudioEngine(): AudioEngine {
  const player = new WebAudioPlayer(null, { updateInterval: AUDIO_STATUS_UPDATE_INTERVAL_MS });
  // The controller is typed over expo's `AudioPlayer`; the web player implements
  // the part of it the controller calls.
  const controller = new ExpoAudioController(player as unknown as AudioPlayer);
  return buildAudioEngine(controller);
}

let singleton: AudioEngine | null = null;

/** The process-wide audio engine — the ONE real player for the whole app. */
export function getSharedAudioSession(): AudioEngine {
  if (!singleton) singleton = createAudioEngine();
  return singleton;
}

/** TEST ONLY: dispose and clear the process singleton. */
export function resetSharedAudioSessionForTests(): void {
  singleton?.dispose();
  singleton = null;
}

/**
 * Resolve the shared audio engine: from the {@link MediaProvider} when present,
 * else the process-wide singleton (so non-UI / test code still works).
 */
export function useAudioEngine(): AudioEngine {
  const engines = React.useContext(MediaContext);
  return engines?.audio ?? getSharedAudioSession();
}
