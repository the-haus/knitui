/**
 * Entry for the shared audio engine: one imperatively-created `expo-audio` player
 * (NOT the `useAudioPlayer` hook, so its lifecycle is owned by the engine, not a
 * component) wrapped in an {@link ExpoAudioController} and the generic session.
 *
 * Cross-platform — `expo-audio` resolves to its native module on device and to
 * its `.web` backend (which owns its own internal `<audio>` element) in the
 * browser, so there is no surface element to create or teleport for audio.
 */
import { createAudioPlayer } from "expo-audio";
import * as React from "react";

import { MediaContext } from "../../provider/context";
import { ExpoAudioController } from "../controller/expo-controller";
import { type AudioEngine, buildAudioEngine } from "./audio-engine.shared";

/**
 * How often the shared player emits a status update (currentTime / buffering / …).
 * expo-audio defaults to 500 ms, which makes the scrubber + timecode visibly step
 * twice a second. The state layer is field-isolated (a tick wakes only the
 * Scrubber / TimeDisplay, never the transport or queue leaves — see
 * `useMediaSelector`), so we can afford a faster cadence: 250 ms gives smooth,
 * 4 Hz time/scrubber updates without dragging the rest of the chrome into it.
 */
const AUDIO_STATUS_UPDATE_INTERVAL_MS = 250;

/** Create a fresh, isolated audio engine (owned by `<MediaProvider>`). */
export function createAudioEngine(): AudioEngine {
  const player = createAudioPlayer(null, { updateInterval: AUDIO_STATUS_UPDATE_INTERVAL_MS });
  const controller = new ExpoAudioController(player);
  return buildAudioEngine(controller);
}

let singleton: AudioEngine | null = null;

/**
 * The process-wide audio engine — the ONE real `expo-audio` player for the whole
 * app. Both `<MediaProvider>` and the no-provider fallback resolve THIS, so there
 * is never a second, competing player. Idempotent, so a StrictMode/double-invoked
 * caller gets the same instance.
 */
export function getSharedAudioSession(): AudioEngine {
  if (!singleton) singleton = createAudioEngine();
  return singleton;
}

/**
 * TEST ONLY: dispose and clear the process singleton so the next
 * {@link getSharedAudioSession} builds a fresh one. Lets each test start from a
 * clean shared player (the engine is process-global in production and never torn
 * down there).
 */
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
