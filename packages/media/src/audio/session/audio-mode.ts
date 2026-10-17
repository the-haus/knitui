/**
 * The global audio-session API — WEB. The browser has no audio session to
 * configure, so `setAudioMode` is a no-op; `setIsAudioActive(false)` pauses every
 * kit web player and holds them paused until re-enabled; notification permission
 * is the browser `Notification` API (relevant only for MediaSession now-playing).
 * The native build passes through to expo-audio (`audio-mode.native.ts`).
 */
import { setWebAudioActive } from "../web/web-audio-player";
import type {
  AudioModeConfig,
  AudioSessionApi,
  NotificationPermissionResult,
} from "./audio-mode.shared";

export function setAudioMode(_mode: AudioModeConfig): Promise<void> {
  return Promise.resolve();
}

export function setIsAudioActive(active: boolean): Promise<void> {
  setWebAudioActive(active);
  return Promise.resolve();
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionResult> {
  // Absent the API, report granted so cross-platform call sites stay uniform.
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
