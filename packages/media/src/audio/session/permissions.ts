/**
 * Microphone permissions — WEB: the Permissions API to read, a `getUserMedia`
 * probe to prompt. The native build passes through to expo-audio
 * (`permissions.native.ts`).
 */
import { getUserMedia } from "../../shared/web-media";
import type { AudioPermissionResponse } from "./permissions.shared";

const GRANTED: AudioPermissionResponse = { granted: true, status: "granted", canAskAgain: true };
const DENIED: AudioPermissionResponse = { granted: false, status: "denied", canAskAgain: true };

async function queryMicrophone(): Promise<PermissionState | null> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return null;
  try {
    const { state } = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return state;
  } catch {
    // Firefox doesn't know the `microphone` permission name.
    return null;
  }
}

/** Read the current microphone permission (prompts when the browser can't say). */
export async function getRecordingPermissions(): Promise<AudioPermissionResponse> {
  const state = await queryMicrophone();
  if (state === "granted") return GRANTED;
  if (state === "denied") return DENIED;
  return requestRecordingPermissions();
}

/** Prompt for microphone access. */
export async function requestRecordingPermissions(): Promise<AudioPermissionResponse> {
  try {
    const stream = await getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return GRANTED;
  } catch {
    return DENIED;
  }
}
