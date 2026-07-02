/**
 * Shared prop type for the video surface. The surface renders the actual
 * playback element — the `expo-video` `VideoView` (its native view on device,
 * its `.web` `HTMLVideoElement` wrapper in the browser) — and binds it to the
 * controller.
 */
import type { GetProps } from "@knitui/core";

import type { VideoController } from "../controller/video-controller-base";
import type { VideoContentFit } from "../types";
import type { VideoSurfaceFrame, VideoTextTrack } from "../Video.shared";

export interface VideoSurfaceProps {
  controller: VideoController;
  contentFit: VideoContentFit;
  /** Use the platform's built-in native controls instead of the kit chrome. */
  nativeControls?: boolean;
  allowsPictureInPicture?: boolean;
  /** Sidecar subtitle/caption files (fetched + rendered by the controller). */
  textTracks?: VideoTextTrack[];
  /** Style overrides for the surface frame. */
  frameProps?: GetProps<typeof VideoSurfaceFrame>;
}
