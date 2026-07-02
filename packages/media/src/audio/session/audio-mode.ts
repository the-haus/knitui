/**
 * The global audio-session API — a thin, cross-platform pass-through to
 * `expo-audio`'s session functions. `expo-audio` resolves to its native module on
 * device and to its `.web` backend in the browser, so a SINGLE file drives both:
 * `setAudioModeAsync` is a real no-op on web (the browser has no audio session),
 * and `setIsAudioActiveAsync` pauses active web players when toggled off.
 *
 * The one native-only function is `requestNotificationPermissionsAsync` (Android
 * lock-screen controls); it is absent from the web backend, so we feature-detect
 * it and fall back to the browser `Notification` API there.
 */
import {
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  setIsAudioActiveAsync,
} from "expo-audio";

import type {
  AudioModeConfig,
  AudioSessionApi,
  NotificationPermissionResult,
} from "./audio-mode.shared";

export function setAudioMode(mode: AudioModeConfig): Promise<void> {
  return setAudioModeAsync(mode);
}

export function setIsAudioActive(active: boolean): Promise<void> {
  return setIsAudioActiveAsync(active);
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionResult> {
  // Native (Android): delegate to expo-audio. The web backend doesn't ship this
  // function, so `requestNotificationPermissionsAsync` is `undefined` there.
  if (typeof requestNotificationPermissionsAsync === "function") {
    const res = await requestNotificationPermissionsAsync();
    return {
      granted: res.granted,
      status:
        res.status === "granted" ? "granted" : res.status === "denied" ? "denied" : "undetermined",
      canAskAgain: res.canAskAgain,
    };
  }

  // Web best-effort: the `Notification` API is the closest analogue, and is only
  // relevant if the app also surfaces now-playing via MediaSession. Absent it,
  // report granted so cross-platform call sites stay uniform.
  const N = (globalThis as { Notification?: { requestPermission?: () => Promise<string> } })
    .Notification;
  if (!N || typeof N.requestPermission !== "function") {
    return { granted: true, status: "granted", canAskAgain: false };
  }
  try {
    const result = await N.requestPermission();
    const granted = result === "granted";
    return {
      granted,
      status: granted ? "granted" : result === "denied" ? "denied" : "undetermined",
      canAskAgain: result === "default",
    };
  } catch {
    return { granted: false, status: "denied", canAskAgain: false };
  }
}

export const audioSession: AudioSessionApi = {
  setAudioMode,
  setIsAudioActive,
  requestNotificationPermissions,
};
