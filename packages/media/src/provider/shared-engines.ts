/**
 * The process-wide engines and the hub over them, as one object. `<MediaProvider>`
 * publishes this, and code outside React (a route guard, a call handler) can reach
 * the same hub through {@link getSharedMediaHub}.
 */
import { getSharedAudioSession } from "../audio/session/audio-engine";
import { getSharedVideoSession } from "../video/session/video-engine";
import type { MediaEngines } from "./context";
import { MediaHub } from "./media-hub";

let shared: MediaEngines | null = null;

export function getSharedMediaEngines(): MediaEngines {
  const audio = getSharedAudioSession();
  const video = getSharedVideoSession();
  // The engines can be rebuilt under us (tests reset them): follow them.
  if (!shared || shared.audio !== audio || shared.video !== video) {
    shared?.hub.dispose();
    shared = { audio, video, hub: new MediaHub({ audio, video }) };
  }
  return shared;
}

/** The hub over the shared engines, for code that is not a component. */
export function getSharedMediaHub(): MediaHub {
  return getSharedMediaEngines().hub;
}
