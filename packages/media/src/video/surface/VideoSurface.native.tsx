/**
 * The video surface: the `expo-video` `VideoView`, bound to the
 * {@link ExpoVideoController}. Cross-platform — `expo-video` resolves to its
 * native `VideoView` on device and to its `.web` `VideoView` (an `HTMLVideoElement`
 * wrapper) in the browser, so this one file drives both.
 *
 * The view (not the player) owns fullscreen and Picture-in-Picture on both
 * platforms, so we register the view ref as the controller's view handle and
 * forward the view's fullscreen/PiP callbacks back into the controller. Sidecar
 * caption files (`textTracks`) are pushed into the controller, which fetches,
 * parses, and paints them with the kit's own overlay.
 */
import { VideoView, type VideoViewProps } from "expo-video";
import * as React from "react";

import { type ExpoVideoController } from "../controller/expo-controller";
import { VideoSurfaceFrame } from "../Video.shared";
import type { VideoSurfaceProps } from "./VideoSurface.shared";

/** Fill the teleport host on both platforms (RN flex box + web absolute box). */
export const SURFACE_FILL = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
} as const;

export function VideoSurface(props: VideoSurfaceProps): React.ReactElement {
  const {
    controller,
    contentFit,
    nativeControls = false,
    allowsPictureInPicture = true,
    textTracks,
    frameProps,
  } = props;
  const expo = controller as ExpoVideoController;
  const viewRef = React.useRef<VideoView | null>(null);

  React.useEffect(() => {
    expo.attachView(viewRef.current);
    return () => expo.attachView(null);
  }, [expo]);

  // Register the sidecar caption files with the controller (it owns the
  // fetch/parse + overlay pipeline on every platform now).
  React.useEffect(() => {
    expo.setTextTracks(textTracks ?? []);
  }, [expo, textTracks]);

  const fullscreenOptions: VideoViewProps["fullscreenOptions"] = { enable: true };

  return (
    <VideoSurfaceFrame {...frameProps}>
      <VideoView
        ref={viewRef}
        player={expo.player}
        style={SURFACE_FILL}
        contentFit={contentFit}
        nativeControls={nativeControls}
        allowsPictureInPicture={allowsPictureInPicture}
        fullscreenOptions={fullscreenOptions}
        onFullscreenEnter={() => expo.notifyFullscreen(true)}
        onFullscreenExit={() => expo.notifyFullscreen(false)}
        onPictureInPictureStart={() => expo.notifyPictureInPicture(true)}
        onPictureInPictureStop={() => expo.notifyPictureInPicture(false)}
      />
    </VideoSurfaceFrame>
  );
}
