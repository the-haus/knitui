/**
 * `@knitui/media` — the hybrid, cross-platform media kit (audio + video).
 *
 * Audio and video each have their own collision-free entry point (the two
 * domains share several engine helper names — `WEB_CAPABILITIES`,
 * `resolveKeyAction`, `progressOf`, … — with different meanings, so they cannot
 * share a single flat barrel). Import the components from the subpaths:
 *
 *   import { Audio, useAudioController } from "@knitui/media/audio";
 *   import { Video, useVideoController } from "@knitui/media/video";
 *
 * This ROOT entry exports the one cross-domain piece: `<MediaProvider>`. Mount it
 * once near your app root — it owns the single shared `<audio>` / `<video>` and is
 * REQUIRED for any player to render (the surfaces teleport into the active player,
 * so without the provider there is nothing to mount the real element into):
 *
 *   import { MediaProvider, useMediaState } from "@knitui/media";
 *
 * Truly-shared primitives (the typed emitter, the clock formatter, the generic
 * media types / state helpers / controller core) live in the package-internal
 * `src/shared` + `src/core` modules — not a public subpath.
 */
export {
  audioHostName,
  type MediaEngines,
  useMediaEngines,
  videoHostName,
} from "./provider/context";
export { MediaProvider, type MediaProviderProps } from "./provider/MediaProvider";
export { type MediaState, useMediaState } from "./provider/useMediaState";
