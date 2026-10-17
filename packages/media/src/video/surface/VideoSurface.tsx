/**
 * The video surface — WEB: the kit's {@link WebVideoView} (`<video>`), bound to
 * the {@link ExpoVideoController}'s web player. The native build renders
 * expo-video's `VideoView` (`VideoSurface.native.tsx`).
 *
 * The view (not the player) owns fullscreen and Picture-in-Picture, so the view
 * handle is registered with the controller and its fullscreen / PiP callbacks
 * are forwarded back. Sidecar caption files (`textTracks`) go to the controller,
 * which fetches, parses and paints them with the kit's own overlay.
 */
import * as React from "react";

import type { ExpoVideoController, ExpoVideoViewHandle } from "../controller/expo-controller";
import { VideoSurfaceFrame } from "../Video.shared";
import type { WebVideoPlayer } from "../web/web-video-player";
import { WebVideoView } from "../web/WebVideoView";
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

const FULLSCREEN = { enable: true } as const;

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
  const viewRef = React.useRef<ExpoVideoViewHandle | null>(null);

  React.useEffect(() => {
    expo.attachView(viewRef.current);
    return () => expo.attachView(null);
  }, [expo]);

  React.useEffect(() => {
    expo.setTextTracks(textTracks ?? []);
  }, [expo, textTracks]);

  return (
    <VideoSurfaceFrame {...frameProps}>
      <WebVideoView
        ref={viewRef}
        player={expo.player as unknown as WebVideoPlayer}
        style={SURFACE_FILL}
        contentFit={contentFit}
        nativeControls={nativeControls}
        allowsPictureInPicture={allowsPictureInPicture}
        fullscreenOptions={FULLSCREEN}
        onFullscreenEnter={() => expo.notifyFullscreen(true)}
        onFullscreenExit={() => expo.notifyFullscreen(false)}
        onPictureInPictureStart={() => expo.notifyPictureInPicture(true)}
        onPictureInPictureStop={() => expo.notifyPictureInPicture(false)}
      />
    </VideoSurfaceFrame>
  );
}
