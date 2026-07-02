/**
 * Microphone permissions — a thin, cross-platform pass-through to `expo-audio`.
 * `expo-audio` resolves to its native module on device and to its `.web` backend
 * in the browser, where `getRecordingPermissionsAsync` / `requestRecordingPermissionsAsync`
 * are implemented over the Permissions API + a `getUserMedia` probe. A SINGLE
 * file drives both — there is no hand-written web permission path anymore.
 */
import type { PermissionResponse } from "expo";
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from "expo-audio";

import { type AudioPermissionResponse, type AudioPermissionStatus } from "./permissions.shared";

function map(response: PermissionResponse): AudioPermissionResponse {
  const status: AudioPermissionStatus = response.granted
    ? "granted"
    : response.canAskAgain
      ? "undetermined"
      : "denied";
  return { granted: response.granted, status, canAskAgain: response.canAskAgain };
}

/** Read the current microphone permission. */
export async function getRecordingPermissions(): Promise<AudioPermissionResponse> {
  return map(await getRecordingPermissionsAsync());
}

/** Prompt for microphone access. */
export async function requestRecordingPermissions(): Promise<AudioPermissionResponse> {
  return map(await requestRecordingPermissionsAsync());
}
