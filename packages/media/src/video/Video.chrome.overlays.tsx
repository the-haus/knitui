/**
 * Surface overlays for `<Video>` — the absolutely-positioned layers painted over
 * the video frame (not part of the control bar): the centered big-play button,
 * the buffering spinner, the error message + retry, and the rendered caption
 * cue. Each is capability/state-gated and driven by the {@link VideoContext}.
 */
import * as React from "react";

import { ActionIcon, Button, Loader, Text, useMotionPreset } from "@knitui/components";
import { IconPlayerPlayFilled } from "@knitui/icons/IconPlayerPlayFilled";

import {
  CaptionBubble,
  CaptionText,
  shallowEqual,
  useVideo,
  useVideoState,
  VideoCaptionLayer,
  VideoErrorLayer,
  VideoLayer,
} from "./Video.shared";

/* -------------------------------------------------------------------------- */
/* Captions (rendered cue overlay)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Paints the currently-active caption cue. Driven by `state.activeCueText`,
 * which the native controller computes from sidecar `textTracks`. On web that
 * value stays `null` (the browser paints `<track>` cues itself), so this renders
 * nothing there. The cue sits just above the control bar and lifts further while
 * the chrome is visible so the bar never covers it.
 */
export const CaptionOverlay = React.memo(function CaptionOverlay(): React.ReactElement | null {
  const { controlsVisible, styles } = useVideo("Captions");
  const text = useVideoState((s) => s.activeCueText);
  const motion = useMotionPreset("fade");
  if (!text) return null;
  return (
    <VideoCaptionLayer lifted={controlsVisible} {...motion}>
      <CaptionBubble {...styles?.get("captions")}>
        <CaptionText {...styles?.get("captionText")}>{text}</CaptionText>
      </CaptionBubble>
    </VideoCaptionLayer>
  );
});

/* -------------------------------------------------------------------------- */
/* Big play button (centered overlay while paused)                            */
/* -------------------------------------------------------------------------- */

export const BigPlayButton = React.memo(function BigPlayButton(): React.ReactElement | null {
  const { controller, styles } = useVideo("BigPlayButton");
  const { playing, status } = useVideoState(
    (s) => ({ playing: s.playing, status: s.status }),
    shallowEqual,
  );
  const motion = useMotionPreset("pop");
  if (playing) return null;
  return (
    <VideoLayer centered pointerEvents="box-none" {...motion} {...styles?.get("bigPlay")}>
      <ActionIcon
        size="xl"
        radius="xl"
        variant="filled"
        loading={status === "loading"}
        aria-label="Play"
        onPress={() => controller.play()}
      >
        <IconPlayerPlayFilled />
      </ActionIcon>
    </VideoLayer>
  );
});

/* -------------------------------------------------------------------------- */
/* Buffering overlay                                                          */
/* -------------------------------------------------------------------------- */

export const BufferingOverlay = React.memo(function BufferingOverlay(): React.ReactElement | null {
  const { styles } = useVideo("Buffering");
  const { status, playing } = useVideoState(
    (s) => ({ status: s.status, playing: s.playing }),
    shallowEqual,
  );
  const motion = useMotionPreset("fade");
  // Show whenever the player is loading but not actively playing (initial load
  // or a stalled paused seek). Once it IS playing, the play/pause button's own
  // spinner is the buffering indicator, so the centered overlay steps aside to
  // avoid a redundant second one.
  if (status !== "loading" || playing) return null;
  return (
    <VideoLayer centered pointerEvents="none" {...motion} {...styles?.get("buffering")}>
      <Loader size="md" aria-label="Buffering" />
    </VideoLayer>
  );
});

/* -------------------------------------------------------------------------- */
/* Error overlay (message + retry)                                            */
/* -------------------------------------------------------------------------- */

export const ErrorOverlay = React.memo(function ErrorOverlay(): React.ReactElement | null {
  const { controller } = useVideo("Error");
  const { status, error } = useVideoState(
    (s) => ({ status: s.status, error: s.error }),
    shallowEqual,
  );
  const motion = useMotionPreset("fade");
  if (status !== "error") return null;
  return (
    <VideoErrorLayer {...motion}>
      <Text size="sm" fontWeight="600" color="mediaOnScrim" textAlign="center">
        {error?.message ?? "This video could not be played."}
      </Text>
      <Button size="sm" variant="white" onPress={() => void controller.retry()}>
        Retry
      </Button>
    </VideoErrorLayer>
  );
});
