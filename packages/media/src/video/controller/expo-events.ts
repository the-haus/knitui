/**
 * `expo-video` player event wiring for {@link ExpoVideoController}. Extracted
 * from the controller so the class stays focused on the imperative API + state
 * mapping; this file owns the block that subscribes to the player's events and
 * maps them onto the shared state snapshot + emitted events.
 *
 * The wiring needs the controller's (otherwise protected) state plumbing plus a
 * couple of its private methods, so the controller passes those in via the
 * {@link ExpoEventHost} contract. Cross-platform: the web backend emits a subset
 * of these events (no `sourceLoad`, no track-change events), so duration is read
 * live from the player rather than from `sourceLoad`.
 */
import type {
  AudioTrack as ExpoAudioTrack,
  SubtitleTrack as ExpoSubtitleTrack,
  VideoPlayer,
} from "expo-video";

import type {
  VideoControllerState,
  VideoError,
  VideoEventType,
  VideoStatus,
  VideoTrack,
} from "../types";

interface ExpoSubscription {
  remove(): void;
}

/** Bound state/event plumbing + private hooks the wiring drives. */
export interface ExpoEventHost {
  setState(patch: Partial<VideoControllerState>): void;
  emitEvent(type: VideoEventType, payload: unknown): void;
  updateActiveCue(): void;
  ingestTracks(
    audio: ExpoAudioTrack[],
    subtitles: ExpoSubtitleTrack[],
    video: VideoTrack[] | unknown[],
  ): void;
  readonly state: VideoControllerState;
}

/**
 * Subscribe to every relevant `expo-video` player event, registering each
 * subscription via `sub` so the controller can remove them on dispose.
 */
export function bindExpoEvents(
  host: ExpoEventHost,
  p: VideoPlayer,
  sub: (subscription: ExpoSubscription) => void,
): void {
  // Each handler only translates its backend event into `setState`; the granular
  // playback events (statusChange / playingChange / timeUpdate / volumeChange /
  // playbackRateChange / durationChange / playToEnd / error) all fan out from the
  // diff in BaseMediaController.deriveEvents, so this wiring never hand-emits them.
  // Only `sourceLoad` — a backend one-shot that's not a pure state diff — is emitted
  // here.
  sub(
    p.addListener("statusChange", ({ status, error }) => {
      // The web backend never emits `sourceLoad`; pick up the now-known duration
      // (and liveness) from the player when it becomes ready.
      host.setState({
        status: mapStatus(status),
        error: error ? toVideoError(error) : null,
        duration: liveDuration(p, host.state.duration),
        isLive: p.isLive,
      });
    }),
  );
  sub(
    p.addListener("playingChange", ({ isPlaying }) => {
      host.setState({ playing: isPlaying, ended: isPlaying ? false : host.state.ended });
    }),
  );
  sub(
    p.addListener("timeUpdate", ({ currentTime, bufferedPosition }) => {
      // Keep duration fresh from the player (the web backend has no `sourceLoad`,
      // and a stream's duration can grow as it loads).
      host.setState({
        currentTime,
        bufferedPosition,
        duration: liveDuration(p, host.state.duration),
      });
      host.updateActiveCue();
    }),
  );
  sub(
    p.addListener("volumeChange", ({ volume }) => {
      host.setState({ volume });
    }),
  );
  sub(
    p.addListener("mutedChange", ({ muted }) => {
      host.setState({ muted });
    }),
  );
  sub(
    p.addListener("playbackRateChange", ({ playbackRate }) => {
      host.setState({ playbackRate });
    }),
  );
  sub(
    p.addListener(
      "sourceLoad",
      ({ duration, availableAudioTracks, availableSubtitleTracks, availableVideoTracks }) => {
        host.ingestTracks(availableAudioTracks, availableSubtitleTracks, availableVideoTracks);
        host.setState({ duration, isLive: p.isLive });
        host.emitEvent("sourceLoad", { duration });
      },
    ),
  );
  sub(
    p.addListener("playToEnd", () => {
      host.setState({ ended: true, playing: false });
    }),
  );
  sub(
    p.addListener("subtitleTrackChange", ({ subtitleTrack }) => {
      host.setState({ subtitleTrackId: subtitleTrack ? trackId(subtitleTrack) : null });
    }),
  );
  sub(
    p.addListener("audioTrackChange", ({ audioTrack }) => {
      host.setState({ audioTrackId: audioTrack ? trackId(audioTrack) : null });
    }),
  );
}

/* helpers ------------------------------------------------------------------- */

/** The player's current duration if it's a usable finite number, else the fallback. */
function liveDuration(p: VideoPlayer, fallback: number): number {
  return Number.isFinite(p.duration) && p.duration > 0 ? p.duration : fallback;
}

export function mapStatus(status: string): VideoStatus {
  switch (status) {
    case "loading":
      return "loading";
    case "readyToPlay":
      return "readyToPlay";
    case "error":
      return "error";
    default:
      return "idle";
  }
}

export function trackId(
  track: { id?: string; language?: string; label?: string },
  index = 0,
): string {
  return track.id ?? track.language ?? track.label ?? `track-${index}`;
}

export function toVideoError(error: unknown): VideoError {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return { message };
  }
  if (typeof error === "string" && error) return { message: error };
  return { message: "This video could not be played." };
}
