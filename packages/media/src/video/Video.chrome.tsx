/**
 * Cross-platform control chrome for `<Video>`. Pure presentation built from
 * `@knitui/components` + `@knitui/icons` — no platform-specific imports — driven
 * entirely by the {@link VideoContext}. Each control is capability-gated, so a
 * control the active backend can't support (e.g. a volume slider on mobile
 * Safari, audio-track selection on web) simply doesn't render.
 *
 * The parts are exported individually AND attached to `Video` (see Video.tsx)
 * so consumers can compose a custom bar: `<Video controls={<Video.ControlBar/>}>`
 * or assemble their own from `Video.PlayPause`, `Video.Scrubber`, etc.
 *
 * This module hosts the inline control-bar pieces (play/pause, seek, scrubber,
 * timecode, mute, the default bar). The surface overlays and the menu/flyout
 * controls live in sibling modules and are re-exported below so every name
 * historically exported from here stays importable from this path.
 */
import * as React from "react";

import { ActionIcon, Box, Group, Slider, Stack, Text } from "@knitui/components";
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconRewindBackward10,
  IconRewindForward10,
} from "@knitui/icons";

import { clampMediaSize } from "../control-size";
import { bufferedFractionOf, formatTime } from "./engine";
import { OnScrimIcons, volumeIconFor } from "./Video.chrome.internal";
import {
  FullscreenButton,
  PiPButton,
  PlaybackRateMenu,
  SettingsMenu,
  VolumeControl,
} from "./Video.chrome.menus";
import { shallowEqual, useVideo, useVideoState } from "./Video.shared";

export {
  FullscreenButton,
  PiPButton,
  PlaybackRateMenu,
  SettingsMenu,
  VolumeControl,
  VolumeSlider,
  type VolumeSliderProps,
} from "./Video.chrome.menus";
export {
  BigPlayButton,
  BufferingOverlay,
  CaptionOverlay,
  ErrorOverlay,
} from "./Video.chrome.overlays";

/* -------------------------------------------------------------------------- */
/* Play / pause                                                               */
/* -------------------------------------------------------------------------- */

export const PlayPauseButton = React.memo(function PlayPauseButton(): React.ReactElement {
  const { controller, size, keepAlive } = useVideo("PlayPause");
  const { playing, status } = useVideoState(
    (s) => ({ playing: s.playing, status: s.status }),
    shallowEqual,
  );
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="transparent"
      // Only spin (and disable) while buffering DURING playback — a paused or
      // not-yet-loaded player must stay pressable so the user can start it.
      loading={playing && status === "loading"}
      loaderProps={{ borderTopColor: "$mediaOnScrim", borderRightColor: "$mediaOnScrim" }}
      aria-label={playing ? "Pause" : "Play"}
      onPress={() => {
        keepAlive();
        controller.togglePlay();
      }}
    >
      <OnScrimIcons size={size}>
        {playing ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
      </OnScrimIcons>
    </ActionIcon>
  );
});

/* -------------------------------------------------------------------------- */
/* Seek                                                                       */
/* -------------------------------------------------------------------------- */

export interface SeekButtonProps {
  seconds: number;
}

export const SeekButton = React.memo(function SeekButton({
  seconds,
}: SeekButtonProps): React.ReactElement {
  const { controller, size, keepAlive } = useVideo("Seek");
  const backward = seconds < 0;
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="transparent"
      aria-label={backward ? `Rewind ${Math.abs(seconds)} seconds` : `Forward ${seconds} seconds`}
      onPress={() => {
        keepAlive();
        controller.seekBy(seconds);
      }}
    >
      <OnScrimIcons size={size}>
        {backward ? <IconRewindBackward10 /> : <IconRewindForward10 />}
      </OnScrimIcons>
    </ActionIcon>
  );
});

/* -------------------------------------------------------------------------- */
/* Scrubber (seek bar with buffered underlay)                                 */
/* -------------------------------------------------------------------------- */

export const Scrubber = React.memo(function Scrubber(): React.ReactElement {
  const { controller, keepAlive } = useVideo("Scrubber");
  // Reads the per-tick fields — this is one of the few controls that SHOULD
  // re-render every frame.
  const { currentTime, duration, isLive, bufferedPosition } = useVideoState(
    (s) => ({
      currentTime: s.currentTime,
      duration: s.duration,
      isLive: s.isLive,
      bufferedPosition: s.bufferedPosition,
    }),
    shallowEqual,
  );
  const hasDuration = Number.isFinite(duration) && duration > 0;
  const bufferedPct = Math.round(bufferedFractionOf({ bufferedPosition, duration }) * 100);

  // While dragging we show a local preview value and only commit the seek on
  // release, so incoming timeUpdate events don't fight the thumb.
  const [scrubValue, setScrubValue] = React.useState<number | null>(null);

  // True live stream: no meaningful timeline to scrub.
  if (isLive) {
    return (
      <Group gap="$xs" align="center" height={20}>
        <Box width={8} height={8} borderRadius={8} backgroundColor="$red9" />
        <Text size="xs" fontWeight="600" color="$mediaOnScrim">
          LIVE
        </Text>
      </Group>
    );
  }

  const displayValue = scrubValue ?? (hasDuration ? Math.min(currentTime, duration) : 0);

  return (
    <Box position="relative" width="100%" justifyContent="center">
      {/* Buffered underlay, centered on the (vertically-centered) slider track. */}
      <Box
        position="absolute"
        top="50%"
        marginTop={-2}
        left={0}
        height={4}
        borderRadius={4}
        backgroundColor="$mediaHighlight"
        width={`${bufferedPct}%`}
        pointerEvents="none"
      />
      <Slider
        value={displayValue}
        min={0}
        max={hasDuration ? duration : 1}
        step={0.1}
        size="xs"
        disabled={!hasDuration}
        label={(v: number) => formatTime(v)}
        aria-label="Seek"
        onChange={(v: number) => {
          keepAlive();
          setScrubValue(v);
        }}
        onChangeEnd={(v: number) => {
          controller.seekTo(v);
          setScrubValue(null);
        }}
      />
    </Box>
  );
});

/* -------------------------------------------------------------------------- */
/* Time display                                                               */
/* -------------------------------------------------------------------------- */

/** Current time. */
export const TimeCurrent = React.memo(function TimeCurrent(): React.ReactElement {
  const currentTime = useVideoState((s) => s.currentTime);
  return (
    <Text size="xs" color="$mediaOnScrim" fontWeight="500">
      {formatTime(currentTime)}
    </Text>
  );
});

/** Total duration. */
export const TimeDuration = React.memo(function TimeDuration(): React.ReactElement {
  const duration = useVideoState((s) => (Number.isFinite(s.duration) ? s.duration : 0));
  return (
    <Text size="xs" color="$mediaOnScrim" fontWeight="500">
      {formatTime(duration)}
    </Text>
  );
});

/** Combined "1:23 / 4:56" timecode. */
export const TimeDisplay = React.memo(function TimeDisplay(): React.ReactElement {
  const { currentTime, duration } = useVideoState(
    (s) => ({ currentTime: s.currentTime, duration: Number.isFinite(s.duration) ? s.duration : 0 }),
    shallowEqual,
  );
  return (
    <Text size="xs" color="$mediaOnScrim" fontWeight="500">
      {formatTime(currentTime)} / {formatTime(duration)}
    </Text>
  );
});

/* -------------------------------------------------------------------------- */
/* Volume                                                                     */
/* -------------------------------------------------------------------------- */

export const MuteButton = React.memo(function MuteButton(): React.ReactElement {
  const { controller, size, keepAlive } = useVideo("Mute");
  const { muted, volume } = useVideoState(
    (s) => ({ muted: s.muted, volume: s.volume }),
    shallowEqual,
  );
  const off = muted || volume === 0;
  const VolumeIcon = volumeIconFor(muted, volume);
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="transparent"
      aria-label={off ? "Unmute" : "Mute"}
      onPress={() => {
        keepAlive();
        controller.toggleMuted();
      }}
    >
      <OnScrimIcons size={size}>
        <VolumeIcon />
      </OnScrimIcons>
    </ActionIcon>
  );
});

/* -------------------------------------------------------------------------- */
/* Default control bar                                                        */
/* -------------------------------------------------------------------------- */

export function ControlBar(): React.ReactElement {
  return (
    <Stack gap="$xxs" width="100%">
      <Scrubber />
      <Group justify="space-between" align="center" gap="$xs" wrap="nowrap">
        <Group gap="$xxs" align="center" wrap="nowrap">
          <PlayPauseButton />
          <SeekButton seconds={-10} />
          <SeekButton seconds={10} />
          <VolumeControl />
          <TimeDisplay />
        </Group>
        <Group gap="$xxs" align="center" wrap="nowrap">
          <PlaybackRateMenu />
          <SettingsMenu />
          <PiPButton />
          <FullscreenButton />
        </Group>
      </Group>
    </Stack>
  );
}
