/**
 * Surface overlays for `<Video>` — the absolutely-positioned layers painted over
 * the video frame (not part of the control bar): the centered big-play button,
 * the buffering spinner, the error message + retry, and the rendered caption
 * cue. Each is capability/state-gated and driven by the {@link VideoContext}.
 */
import * as React from "react";

import { ActionIcon, Box, Button, Loader, Text, useMotionPreset } from "@knitui/components";
import { IconPlayerPlayFilled } from "@knitui/icons";

import { CaptionBubble, CaptionText, shallowEqual, useVideo, useVideoState } from "./Video.shared";

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
    <Box
      position="absolute"
      left={0}
      right={0}
      bottom={controlsVisible ? 72 : 16}
      alignItems="center"
      paddingHorizontal="$md"
      pointerEvents="none"
      transition={motion.transition}
      enterStyle={motion.enterStyle}
      animateOnly={motion.animateOnly}
    >
      <CaptionBubble {...styles?.get("captions")}>
        <CaptionText {...styles?.get("captionText")}>{text}</CaptionText>
      </CaptionBubble>
    </Box>
  );
});

/* -------------------------------------------------------------------------- */
/* Big play button (centered overlay while paused)                            */
/* -------------------------------------------------------------------------- */

export const BigPlayButton = React.memo(function BigPlayButton(): React.ReactElement | null {
  const { controller } = useVideo("BigPlayButton");
  const { playing, status } = useVideoState(
    (s) => ({ playing: s.playing, status: s.status }),
    shallowEqual,
  );
  const motion = useMotionPreset("pop");
  if (playing) return null;
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      alignItems="center"
      justifyContent="center"
      pointerEvents="box-none"
      transition={motion.transition}
      enterStyle={motion.enterStyle}
      animateOnly={motion.animateOnly}
    >
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
    </Box>
  );
});

/* -------------------------------------------------------------------------- */
/* Buffering overlay                                                          */
/* -------------------------------------------------------------------------- */

export const BufferingOverlay = React.memo(function BufferingOverlay(): React.ReactElement | null {
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
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      alignItems="center"
      justifyContent="center"
      pointerEvents="none"
      transition={motion.transition}
      enterStyle={motion.enterStyle}
      animateOnly={motion.animateOnly}
    >
      <Loader size="md" aria-label="Buffering" />
    </Box>
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
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      alignItems="center"
      justifyContent="center"
      gap="$sm"
      padding="$lg"
      backgroundColor="$mediaOverlay"
      transition={motion.transition}
      enterStyle={motion.enterStyle}
      animateOnly={motion.animateOnly}
    >
      <Text size="sm" fontWeight="600" color="$mediaOnScrim" style={{ textAlign: "center" }}>
        {error?.message ?? "This video could not be played."}
      </Text>
      <Button size="sm" variant="white" onPress={() => void controller.retry()}>
        Retry
      </Button>
    </Box>
  );
});
