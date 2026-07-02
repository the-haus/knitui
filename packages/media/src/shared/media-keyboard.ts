/**
 * Pure keyboard-shortcut mapping common to both media players. DOM-free so it can
 * be unit-tested directly; each domain's web root translates a `keydown` into one
 * of these actions and applies it against the controller. The audio domain uses
 * this set verbatim (no video surface); the video domain wraps it and adds the
 * fullscreen / picture-in-picture keys. Mirrors the de-facto YouTube / native
 * player shortcut set.
 */
export interface MediaKeyOptions {
  /** Seconds for arrow-key seeking. Default 5. */
  seekStep?: number;
  /** Volume delta for arrow-key volume. Default 0.1. */
  volumeStep?: number;
  /** Playback-rate delta for `<` / `>`. Default 0.25. */
  rateStep?: number;
}

export type MediaKeyAction =
  | { type: "togglePlay" }
  | { type: "seekBy"; seconds: number }
  | { type: "seekToFraction"; fraction: number }
  | { type: "toggleMute" }
  | { type: "adjustVolume"; delta: number }
  | { type: "adjustRate"; delta: number };

/**
 * Maps a `KeyboardEvent.key` to a media action, or `null` if the key is not a
 * shortcut (the caller should then let the event through). Letter keys are
 * case-insensitive.
 */
export function resolveMediaKeyAction(
  key: string,
  options: MediaKeyOptions = {},
): MediaKeyAction | null {
  const seekStep = options.seekStep ?? 5;
  const volumeStep = options.volumeStep ?? 0.1;
  const rateStep = options.rateStep ?? 0.25;

  // Digit 0–9 → jump to that tenth of the timeline.
  if (key.length === 1 && key >= "0" && key <= "9") {
    return { type: "seekToFraction", fraction: Number(key) / 10 };
  }

  switch (key) {
    case " ":
    case "Spacebar": // legacy Edge/IE
    case "k":
    case "K":
      return { type: "togglePlay" };
    case "ArrowLeft":
      return { type: "seekBy", seconds: -seekStep };
    case "ArrowRight":
      return { type: "seekBy", seconds: seekStep };
    case "j":
    case "J":
      return { type: "seekBy", seconds: -10 };
    case "l":
    case "L":
      return { type: "seekBy", seconds: 10 };
    case "ArrowUp":
      return { type: "adjustVolume", delta: volumeStep };
    case "ArrowDown":
      return { type: "adjustVolume", delta: -volumeStep };
    case "Home":
      return { type: "seekToFraction", fraction: 0 };
    case "End":
      return { type: "seekToFraction", fraction: 1 };
    case "m":
    case "M":
      return { type: "toggleMute" };
    case ">":
      return { type: "adjustRate", delta: rateStep };
    case "<":
      return { type: "adjustRate", delta: -rateStep };
    default:
      return null;
  }
}

/** The minimal controller surface {@link applyMediaKeyAction} drives. */
export interface MediaKeyTarget {
  togglePlay(): void;
  seekBy(seconds: number): void | Promise<void>;
  seekTo(seconds: number): void | Promise<void>;
  toggleMuted(): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setPlaybackRate(rate: number): void;
}

/** The state fields {@link applyMediaKeyAction} reads to compute its commands. */
export interface MediaKeyState {
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
}

/**
 * Apply a resolved {@link MediaKeyAction} against a controller. Both player roots
 * share this for the common keys; the video root handles its two extra actions
 * (fullscreen / picture-in-picture) before delegating the rest here. Rate is
 * clamped to `[0.25, 4]` and volume to `[0, 1]`, matching the player chrome.
 */
export function applyMediaKeyAction(
  controller: MediaKeyTarget,
  state: MediaKeyState,
  action: MediaKeyAction,
): void {
  switch (action.type) {
    case "togglePlay":
      controller.togglePlay();
      break;
    case "seekBy":
      void controller.seekBy(action.seconds);
      break;
    case "seekToFraction": {
      const d = state.duration;
      if (Number.isFinite(d) && d > 0) void controller.seekTo(d * action.fraction);
      break;
    }
    case "toggleMute":
      controller.toggleMuted();
      break;
    case "adjustVolume": {
      const v = Math.min(1, Math.max(0, state.volume + action.delta));
      controller.setVolume(v);
      if (state.muted && action.delta > 0) controller.setMuted(false);
      break;
    }
    case "adjustRate":
      controller.setPlaybackRate(Math.min(4, Math.max(0.25, state.playbackRate + action.delta)));
      break;
  }
}
