/**
 * The kit's WEB video view: a `<video>` element bound to a {@link WebVideoPlayer}
 * (mounted into it on attach, released on detach), with the fullscreen and
 * Picture-in-Picture handle {@link ExpoVideoController} calls and the same
 * callbacks expo-video's `VideoView` fires. The native build renders expo-video's
 * `VideoView` (`surface/VideoSurface.native.tsx`).
 *
 * Adapted from expo-video's `VideoView.web` (MIT, © 650 Industries), minus the
 * multi-view audio-node mixing (one view per player in the kit).
 */
import * as React from "react";

import type { ExpoVideoViewHandle } from "../controller/expo-controller";
import { videoSourceUri, type WebVideoPlayer } from "./web-video-player";

type FullscreenVideo = HTMLVideoElement & {
  webkitRequestFullscreen?: () => Promise<void>;
  webkitEnterFullScreen?: () => Promise<void>;
};

export interface WebVideoViewProps {
  player: WebVideoPlayer | null;
  style?: React.CSSProperties;
  contentFit?: "contain" | "cover" | "fill";
  nativeControls?: boolean;
  allowsPictureInPicture?: boolean;
  fullscreenOptions?: { enable?: boolean };
  playsInline?: boolean;
  crossOrigin?: "anonymous" | "use-credentials";
  onFullscreenEnter?: () => void;
  onFullscreenExit?: () => void;
  onPictureInPictureStart?: () => void;
  onPictureInPictureStop?: () => void;
  onFirstFrameRender?: () => void;
}

export const WebVideoView = React.forwardRef<ExpoVideoViewHandle, WebVideoViewProps>(
  function WebVideoView(props, ref) {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const mountedPlayer = React.useRef<WebVideoPlayer | null>(null);
    const waitingForFirstFrame = React.useRef(false);
    const {
      player,
      onFullscreenEnter,
      onFullscreenExit,
      onPictureInPictureStart,
      onPictureInPictureStop,
      onFirstFrameRender,
    } = props;

    React.useImperativeHandle(ref, () => ({
      enterFullscreen: async () => {
        const video = videoRef.current as FullscreenVideo | null;
        if (!video) return;
        if (video.requestFullscreen) await video.requestFullscreen();
        else if (video.webkitRequestFullscreen) await video.webkitRequestFullscreen();
        else if (video.webkitEnterFullScreen) await video.webkitEnterFullScreen();
      },
      exitFullscreen: async () => {
        if (document.fullscreenElement) await document.exitFullscreen();
      },
      startPictureInPicture: async () => {
        await videoRef.current?.requestPictureInPicture();
      },
      stopPictureInPicture: async () => {
        try {
          await document.exitPictureInPicture();
        } catch (e) {
          if (!(e instanceof DOMException && e.name === "InvalidStateError")) throw e;
        }
      },
    }));

    // Picture-in-Picture + first-frame callbacks.
    React.useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const onEnter = () => onPictureInPictureStart?.();
      const onLeave = () => onPictureInPictureStop?.();
      const onLoadStart = () => {
        waitingForFirstFrame.current = true;
      };
      const onLoadedData = () => {
        if (waitingForFirstFrame.current) onFirstFrameRender?.();
        waitingForFirstFrame.current = false;
      };
      video.addEventListener("enterpictureinpicture", onEnter);
      video.addEventListener("leavepictureinpicture", onLeave);
      video.addEventListener("loadstart", onLoadStart);
      video.addEventListener("loadeddata", onLoadedData);
      return () => {
        video.removeEventListener("enterpictureinpicture", onEnter);
        video.removeEventListener("leavepictureinpicture", onLeave);
        video.removeEventListener("loadstart", onLoadStart);
        video.removeEventListener("loadeddata", onLoadedData);
      };
    }, [onPictureInPictureStart, onPictureInPictureStop, onFirstFrameRender]);

    // Fullscreen callbacks (standard + Safari's video-only fullscreen).
    React.useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const onChange = () => {
        if (document.fullscreenElement === video) onFullscreenEnter?.();
        else onFullscreenExit?.();
      };
      const onSafariEnter = () => onFullscreenEnter?.();
      const onSafariExit = () => onFullscreenExit?.();
      video.addEventListener("fullscreenchange", onChange);
      video.addEventListener("webkitbeginfullscreen", onSafariEnter);
      video.addEventListener("webkitendfullscreen", onSafariExit);
      return () => {
        video.removeEventListener("fullscreenchange", onChange);
        video.removeEventListener("webkitbeginfullscreen", onSafariEnter);
        video.removeEventListener("webkitendfullscreen", onSafariExit);
      };
    }, [onFullscreenEnter, onFullscreenExit]);

    // Mount the element into the player; move it when the player changes.
    React.useEffect(() => {
      const video = videoRef.current;
      if (video && mountedPlayer.current) mountedPlayer.current.unmountVideoView(video);
      if (video && player) player.mountVideoView(video);
      mountedPlayer.current = player;
      if (!player && video) {
        video.removeAttribute("src");
        video.load();
      }
      return () => {
        if (video) player?.unmountVideoView(video);
        mountedPlayer.current = null;
      };
    }, [player]);

    return (
      <video
        ref={videoRef}
        controls={props.nativeControls ?? true}
        controlsList={props.fullscreenOptions?.enable ? undefined : "nofullscreen"}
        crossOrigin={props.crossOrigin}
        disablePictureInPicture={!props.allowsPictureInPicture}
        playsInline={props.playsInline}
        style={{ ...props.style, objectFit: props.contentFit }}
        src={videoSourceUri(player?.src) ?? undefined}
      />
    );
  },
);
