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
import { isWeb } from "@knitui/core";
import type {
  AudioTrack as ExpoAudioTrack,
  SubtitleTrack as ExpoSubtitleTrack,
  VideoPlayer,
} from "@knitui/media/native/video";

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

/** `HTMLMediaElement.HAVE_FUTURE_DATA`: enough is buffered to keep playing. */
const HAVE_FUTURE_DATA = 3;

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
  /** Whether playback has been asked for, independent of whether it's underway. */
  readonly wantsPlay: boolean;
  /** Playback ran to the end, so the intent is spent. */
  clearPlayIntent(): void;
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
      const mapped = mapStatus(status);
      host.setState({
        status: mapped,
        // Backends drop `playing` while they buffer; the player is still playing as
        // far as anyone using it is concerned, and the toggle has to offer "Pause".
        playing: mapped === "error" ? false : host.state.playing || isWaitingToPlay(host, mapped),
        error: error ? toVideoError(error) : null,
        duration: liveDuration(p, host.state.duration),
        isLive: p.isLive,
      });
    }),
  );
  sub(
    p.addListener("playingChange", ({ isPlaying }) => {
      host.setState({
        playing: isPlaying || isWaitingToPlay(host, host.state.status),
        ended: isPlaying ? false : host.state.ended,
      });
    }),
  );
  sub(
    p.addListener("timeUpdate", ({ currentTime, bufferedPosition }) => {
      const resumed = host.state.status === "loading" && hasResumedOnWeb(p);
      // Keep duration fresh from the player (the web backend has no `sourceLoad`,
      // and a stream's duration can grow as it loads).
      host.setState({
        ...(resumed ? { status: "readyToPlay" as const } : null),
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
      host.clearPlayIntent();
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

/**
 * WEB: whether a stall is over though `canplay` never came. That backend clears
 * `loading` only on that event, which a resuming element doesn't always fire, so ask
 * the element. Time moving isn't enough: a tick can land just as a stall begins.
 * Native status is accurate and needs none of this.
 */
function hasResumedOnWeb(p: VideoPlayer): boolean {
  if (!isWeb || !p.playing) return false;
  const elements = (p as { _mountedVideos?: Set<HTMLVideoElement> })._mountedVideos;
  return !!elements && [...elements].every((el) => el.readyState >= HAVE_FUTURE_DATA);
}

/** Whether playback was asked for and is only held up by loading. */
function isWaitingToPlay(host: ExpoEventHost, status: VideoStatus): boolean {
  return host.wantsPlay && status === "loading";
}

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
