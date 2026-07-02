/**
 * The audio surface renders nothing on any platform. `expo-audio` owns its own
 * playback element internally (the native player on device, an internal
 * `<audio>` in its `.web` backend), so unlike `<video>` there is no element for
 * the kit to mount or teleport. Kept as a no-op for symmetry with the video
 * surface and the `<MediaProvider>` teleport plumbing.
 */
import type * as React from "react";

import type { AudioController } from "../controller/audio-controller-base";

export interface AudioSurfaceProps {
  controller: AudioController;
}

export function AudioSurface(_props: AudioSurfaceProps): React.ReactElement | null {
  return null;
}
