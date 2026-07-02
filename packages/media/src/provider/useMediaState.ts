/**
 * `useMediaState` — the single source of "what's currently playing" across the
 * whole kit. Reads the active audio + video snapshots from the one
 * {@link MediaProvider}, so a host app can build a global now-playing bar /
 * mini-player without reaching into individual `<Audio>` / `<Video>` instances.
 */
import * as React from "react";

import type { AudioControllerState } from "../audio/types";
import type { VideoControllerState } from "../video/types";
import { MediaContext } from "./context";

export interface MediaState {
  /** Id of the player that currently owns the shared `<audio>` (or `null`). */
  activeAudioId: string | null;
  /** Id of the player that currently owns the shared `<video>` (or `null`). */
  activeVideoId: string | null;
  /** Live snapshot of the active audio player (or `null` when none is active). */
  audio: AudioControllerState | null;
  /** Live snapshot of the active video player (or `null` when none is active). */
  video: VideoControllerState | null;
}

const EMPTY: MediaState = { activeAudioId: null, activeVideoId: null, audio: null, video: null };

/**
 * Subscribe to the current media state. Must be called under a
 * {@link MediaProvider}; returns an empty state when none is mounted.
 */
export function useMediaState(): MediaState {
  const engines = React.useContext(MediaContext);

  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!engines) return () => {};
      const a = engines.audio.session.subscribe(listener);
      const v = engines.video.session.subscribe(listener);
      return () => {
        a();
        v();
      };
    },
    [engines],
  );

  // Memoize the derived state so useSyncExternalStore's identity check is stable
  // until something actually changes.
  const lastRef = React.useRef<MediaState>(EMPTY);
  const getSnapshot = React.useCallback((): MediaState => {
    if (!engines) return EMPTY;
    const { audio, video } = engines;
    const activeAudioId = audio.session.activeId;
    const activeVideoId = video.session.activeId;
    const audioState = activeAudioId ? audio.session.snapshotFor(activeAudioId) : null;
    const videoState = activeVideoId ? video.session.snapshotFor(activeVideoId) : null;

    const prev = lastRef.current;
    if (
      prev.activeAudioId === activeAudioId &&
      prev.activeVideoId === activeVideoId &&
      prev.audio === audioState &&
      prev.video === videoState
    ) {
      return prev;
    }
    const next: MediaState = {
      activeAudioId,
      activeVideoId,
      audio: audioState,
      video: videoState,
    };
    lastRef.current = next;
    return next;
  }, [engines]);

  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
