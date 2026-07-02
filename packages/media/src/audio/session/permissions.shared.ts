/**
 * Platform-free microphone-permission contract. The single, cross-platform
 * {@link ./permissions} implementation (over expo-audio) returns this normalized
 * shape so callers are platform-agnostic.
 */
export type AudioPermissionStatus = "granted" | "denied" | "undetermined";

export interface AudioPermissionResponse {
  /** Whether recording is currently permitted. */
  granted: boolean;
  /** Normalized permission status. */
  status: AudioPermissionStatus;
  /** Whether the user can still be prompted (false once permanently denied). */
  canAskAgain: boolean;
}
