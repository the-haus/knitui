/**
 * Platform-free types + contract for the global audio session controls. The
 * implementation ({@link ./audio-mode}) is a single, cross-platform pass-through
 * to expo-audio. Mirrors expo-audio's `AudioMode` / `setAudioModeAsync` /
 * `setIsAudioActiveAsync` / `requestNotificationPermissionsAsync`.
 */

/** How the session interacts with other apps' audio. */
export type InterruptionMode = "mixWithOthers" | "doNotMix" | "duckOthers";

/**
 * Global audio session configuration. A platform-free projection of expo-audio's
 * `AudioMode`. Web largely ignores these (the browser has no audio session), but
 * the type is shared so app code can configure both platforms from one call.
 */
export interface AudioModeConfig {
  /** Allow playback while the device is in silent mode (iOS). */
  playsInSilentMode?: boolean;
  /** How to interact with other audio. Default `'mixWithOthers'`. */
  interruptionMode?: InterruptionMode;
  /** Allow recording in this session (iOS). */
  allowsRecording?: boolean;
  /** Keep the session active in the background (requires config-plugin setup). */
  shouldPlayInBackground?: boolean;
  /** Route playback through the earpiece while recording (iOS). */
  shouldRouteThroughEarpiece?: boolean;
  /** Allow recording to continue in the background. */
  allowsBackgroundRecording?: boolean;
}

/** Result of a notification-permission request (platform-free). */
export interface NotificationPermissionResult {
  granted: boolean;
  status: "granted" | "denied" | "undetermined";
  canAskAgain: boolean;
}

/** The session API both platforms implement. */
export interface AudioSessionApi {
  /** Configure the global audio session. No-op on web. */
  setAudioMode(mode: AudioModeConfig): Promise<void>;
  /** Enable/disable the audio subsystem globally. */
  setIsAudioActive(active: boolean): Promise<void>;
  /**
   * Request permission to post media-playback notifications (Android lock-screen
   * controls). Resolves granted on platforms that don't need it.
   */
  requestNotificationPermissions(): Promise<NotificationPermissionResult>;
}
