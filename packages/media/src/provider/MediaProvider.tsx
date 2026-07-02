/**
 * `<MediaProvider>` — the single provider for the whole media kit.
 *
 * Mount it ONCE near the app root. It owns the two shared engines (one real
 * `<audio>`, one real `<video>`) and renders BOTH real elements as surfaces that
 * are teleported — via the kit `Portal`, which re-parents the live node rather
 * than re-rendering it — into whichever player is currently active. Switching the
 * active player moves the SAME element, so playback never reloads, and there is
 * only ever one `<audio>` / one `<video>` in the tree.
 *
 * This generalizes the old per-domain `VideoEngineProvider` to cover audio too,
 * so audio + video share one provider and one source of current media state
 * ({@link useMediaState}).
 */
import * as React from "react";

import { Portal } from "@knitui/components";

import type { ExpoAudioController } from "../audio/controller/expo-controller";
import { getSharedAudioSession } from "../audio/session/audio-engine";
import { AudioStatusBridge } from "../audio/session/AudioStatusBridge";
import { AudioSurface } from "../audio/surface/AudioSurface";
import type { VideoSurfaceConfig } from "../video/hooks/useVideoController.shared";
import { getSharedVideoSession } from "../video/session/video-engine";
import { SURFACE_FILL, VideoSurface } from "../video/surface/VideoSurface";
import { audioHostName, MediaContext, type MediaEngines, videoHostName } from "./context";

export interface MediaProviderProps {
  children: React.ReactNode;
}

/** The slice of a session this provider tracks: its active player id, reactively. */
interface ActiveIdSession {
  subscribe(listener: () => void): () => void;
  readonly activeId: string | null;
}

/** Subscribe to a session's active-player id (which host to teleport into). */
function useActiveId(session: ActiveIdSession): string | null {
  return React.useSyncExternalStore(
    React.useCallback((l) => session.subscribe(l), [session]),
    () => session.activeId,
    () => session.activeId,
  );
}

export function MediaProvider({ children }: MediaProviderProps): React.ReactElement {
  // Resolve the PROCESS-WIDE engines, never per-provider instances. There is one
  // real `<audio>` / one real `<video>` per process, period — so the engines are
  // module singletons and the provider only PUBLISHES them, it does not own their
  // lifecycle. This matters for three reasons, all of which previously spawned a
  // second, competing player (the "I hear two audios" / "chrome frozen" bugs):
  //
  //   1. StrictMode (and Next.js dev) double-invokes a `useState` initializer, so a
  //      `createAudioEngine()` there built TWO players and orphaned one, never
  //      disposed. The singleton getters are idempotent — the second call returns
  //      the same instance.
  //   2. Two `<MediaProvider>`s (nested, or one per screen) each minted their own
  //      engine; now they share the one instance.
  //   3. `useAudioEngine()` falls back to `getSharedAudioSession()` when a consumer
  //      sits outside any provider. With a per-provider engine that fallback was a
  //      DIFFERENT object, so the stray consumer drove a second player while the
  //      chrome watched the first. Provider-engine ≡ fallback-engine now.
  //
  // Because the engines are process-global, the provider does NOT dispose them on
  // unmount — tearing them down on a StrictMode unmount left the controllers deaf
  // (subscriptions gone) and froze the chrome at 0:00 across the remount.
  const engines = React.useMemo<MediaEngines>(
    () => ({ audio: getSharedAudioSession(), video: getSharedVideoSession() }),
    [],
  );

  // Track each session's active player so we know which host to teleport into.
  const audioActiveId = useActiveId(engines.audio.session);
  const videoActiveId = useActiveId(engines.video.session);

  const videoSurface = videoActiveId
    ? (engines.video.session.getConfig(videoActiveId)?.surface as VideoSurfaceConfig | undefined)
    : undefined;

  return (
    <MediaContext.Provider value={engines}>
      {children}

      {/* Drive the shared audio player's status from a commit-phase hook — the
          controller's imperative listener doesn't fire on iOS (see AudioStatusBridge). */}
      <AudioStatusBridge controller={engines.audio.session.controller as ExpoAudioController} />

      {/* Audio has no element to teleport (expo-audio owns its own); the surface
          is an inert no-op, kept for symmetry with the video teleport. */}
      {audioActiveId ? (
        <Portal hostName={audioHostName(audioActiveId)}>
          <AudioSurface controller={engines.audio.session.controller} />
        </Portal>
      ) : null}

      {/* The single shared <video> teleports into the active video player's frame. */}
      {videoActiveId ? (
        <Portal hostName={videoHostName(videoActiveId)}>
          <VideoSurface
            controller={engines.video.session.controller}
            contentFit={videoSurface?.contentFit ?? "contain"}
            nativeControls={videoSurface?.nativeControls}
            allowsPictureInPicture={videoSurface?.allowsPictureInPicture}
            textTracks={videoSurface?.textTracks}
            frameProps={SURFACE_FILL}
          />
        </Portal>
      ) : null}
    </MediaContext.Provider>
  );
}
