/**
 * The individual `<Audio>` controls and the default control bar. Pure
 * presentation built from `@knitui/components` + `@knitui/icons` — no
 * platform-specific imports — driven entirely by the {@link AudioContext}. Each
 * control is capability-gated, so a control the active backend can't support
 * (e.g. a volume slider on mobile Safari) simply doesn't render.
 *
 * Split out of {@link ./Audio.chrome} for file size; the parts are re-exported
 * from there (and attached to `Audio`, see Audio.tsx) so the public surface is
 * unchanged.
 */
import * as React from "react";

import {
  ActionIcon,
  Box,
  Button,
  Group,
  Loader,
  Menu,
  Slider,
  Stack,
  Text,
} from "@knitui/components";
import { isWeb } from "@knitui/core";
import {
  IconCheck,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconRepeat,
  IconRepeatOff,
  IconRewindBackward10,
  IconRewindForward10,
} from "@knitui/icons";

import { clampMediaSize } from "../control-size";
import { volumeIconFor } from "./Audio.chrome.internal";
import { hoverProps, scrubberSizeFor, shallowEqual, useAudio, useAudioState } from "./Audio.shared";
import { bufferedFractionOf, formatTime } from "./engine";

/* -------------------------------------------------------------------------- */
/* Play / pause                                                               */
/* -------------------------------------------------------------------------- */

export const PlayPauseButton = React.memo(function PlayPauseButton(): React.ReactElement {
  const { controller, size } = useAudio("PlayPause");
  const { playing, status, isBuffering } = useAudioState(
    (s) => ({ playing: s.playing, status: s.status, isBuffering: s.isBuffering }),
    shallowEqual,
  );
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="filled"
      radius="xl"
      // Only spin (and disable) while buffering DURING playback — a paused or
      // not-yet-loaded player must stay pressable so the user can start it.
      loading={playing && (status === "loading" || isBuffering)}
      aria-label={playing ? "Pause" : "Play"}
      onPress={() => controller.togglePlay()}
    >
      {playing ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
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
  const { controller, size } = useAudio("Seek");
  const backward = seconds < 0;
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="subtle"
      aria-label={backward ? `Rewind ${Math.abs(seconds)} seconds` : `Forward ${seconds} seconds`}
      onPress={() => void controller.seekBy(seconds)}
    >
      {backward ? <IconRewindBackward10 /> : <IconRewindForward10 />}
    </ActionIcon>
  );
});

/* -------------------------------------------------------------------------- */
/* Scrubber (seek bar with buffered underlay)                                 */
/* -------------------------------------------------------------------------- */

export const Scrubber = React.memo(function Scrubber(): React.ReactElement {
  const { controller, size } = useAudio("Scrubber");
  // Reads the per-tick fields — this control SHOULD re-render every frame.
  const { currentTime, duration, isLive, bufferedPosition } = useAudioState(
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

  if (isLive) {
    return (
      <Group gap="$xs" align="center" height={20}>
        <Box width={8} height={8} borderRadius={8} backgroundColor="$red9" />
        <Text size="xs" fontWeight="600">
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
        backgroundColor="$color6"
        width={`${bufferedPct}%`}
        pointerEvents="none"
      />
      <Slider
        value={displayValue}
        min={0}
        max={hasDuration ? duration : 1}
        step={0.1}
        size={scrubberSizeFor(size)}
        disabled={!hasDuration}
        label={(v: number) => formatTime(v)}
        aria-label="Seek"
        onChange={(v: number) => setScrubValue(v)}
        onChangeEnd={(v: number) => {
          void controller.seekTo(v);
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
  const { styles } = useAudio("Time");
  const currentTime = useAudioState((s) => s.currentTime);
  return (
    <Text size="xs" fontVariant={["tabular-nums"]} {...styles?.get("time")}>
      {formatTime(currentTime)}
    </Text>
  );
});

/** Total duration. */
export const TimeDuration = React.memo(function TimeDuration(): React.ReactElement {
  const { styles } = useAudio("Time");
  const duration = useAudioState((s) => (Number.isFinite(s.duration) ? s.duration : 0));
  return (
    <Text size="xs" fontVariant={["tabular-nums"]} color="$color11" {...styles?.get("time")}>
      {formatTime(duration)}
    </Text>
  );
});

/** Combined "1:23 / 4:56" timecode. */
export const TimeDisplay = React.memo(function TimeDisplay(): React.ReactElement {
  const { styles } = useAudio("Time");
  const { currentTime, duration } = useAudioState(
    (s) => ({ currentTime: s.currentTime, duration: Number.isFinite(s.duration) ? s.duration : 0 }),
    shallowEqual,
  );
  return (
    <Text size="xs" fontVariant={["tabular-nums"]} {...styles?.get("time")}>
      {formatTime(currentTime)} / {formatTime(duration)}
    </Text>
  );
});

/* -------------------------------------------------------------------------- */
/* Volume                                                                     */
/* -------------------------------------------------------------------------- */

export const MuteButton = React.memo(function MuteButton(): React.ReactElement {
  const { controller, size } = useAudio("Mute");
  const { muted, volume } = useAudioState(
    (s) => ({ muted: s.muted, volume: s.volume }),
    shallowEqual,
  );
  const off = muted || volume === 0;
  const VolumeIcon = volumeIconFor(muted, volume);
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="subtle"
      aria-label={off ? "Unmute" : "Mute"}
      onPress={() => controller.toggleMuted()}
    >
      <VolumeIcon />
    </ActionIcon>
  );
});

export interface VolumeSliderProps {
  /** Layout axis. Default `'horizontal'`. */
  orientation?: "horizontal" | "vertical";
}

const VOLUME_LENGTH = 84;

/**
 * The bare volume slider. Returns `null` when the backend can't take a
 * programmatic volume (e.g. mobile Safari).
 */
export const VolumeSlider = React.memo(function VolumeSlider({
  orientation = "horizontal",
}: VolumeSliderProps = {}): React.ReactElement | null {
  const { controller, capabilities, size } = useAudio("Volume");
  const { muted, volume } = useAudioState(
    (s) => ({ muted: s.muted, volume: s.volume }),
    shallowEqual,
  );
  if (!capabilities.canSetVolume) return null;
  const vertical = orientation === "vertical";
  const slider = (
    <Slider
      orientation={orientation}
      value={muted ? 0 : volume}
      min={0}
      max={1}
      step={0.05}
      size={scrubberSizeFor(size)}
      label={(v: number) => `${Math.round(v * 100)}%`}
      aria-label="Volume"
      styles={vertical ? { trackContainer: { height: VOLUME_LENGTH } } : undefined}
      onChange={(v: number) => {
        controller.setVolume(v);
        if (muted && v > 0) controller.setMuted(false);
      }}
    />
  );
  return vertical ? slider : <Box width={VOLUME_LENGTH}>{slider}</Box>;
});

/**
 * Mute toggle + inline volume slider. On web the slider reveals on hover; on
 * native it sits inline. Falls back to a plain mute toggle when the backend
 * can't set volume.
 */
export const VolumeControl = React.memo(function VolumeControl(): React.ReactElement {
  const { capabilities } = useAudio("Volume");
  const [open, setOpen] = React.useState(false);

  if (!capabilities.canSetVolume) return <MuteButton />;

  if (!isWeb) {
    return (
      <Group gap="$xxs" align="center" wrap="nowrap">
        <MuteButton />
        <VolumeSlider />
      </Group>
    );
  }

  return (
    <Group
      gap="$xxs"
      align="center"
      wrap="nowrap"
      {...hoverProps({ onHoverIn: () => setOpen(true), onHoverOut: () => setOpen(false) })}
    >
      <MuteButton />
      <Box width={open ? VOLUME_LENGTH : 0} overflow="hidden" opacity={open ? 1 : 0}>
        <VolumeSlider />
      </Box>
    </Group>
  );
});

/* -------------------------------------------------------------------------- */
/* Playback rate                                                              */
/* -------------------------------------------------------------------------- */

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const PlaybackRateMenu = React.memo(function PlaybackRateMenu(): React.ReactElement | null {
  const { controller, capabilities, size } = useAudio("PlaybackRate");
  const playbackRate = useAudioState((s) => s.playbackRate);
  const [opened, setOpened] = React.useState(false);
  if (!capabilities.canSetPlaybackRate) return null;
  return (
    <Menu position="top" trigger="click" opened={opened} onChange={setOpened}>
      <Menu.Target>
        <ActionIcon size={clampMediaSize(size)} variant="subtle" aria-label="Playback speed">
          <Text size="xs" fontWeight="700">
            {playbackRate}×
          </Text>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Speed</Menu.Label>
        {RATES.map((rate) => (
          <Menu.Item
            key={rate}
            rightSection={rate === playbackRate ? <IconCheck size={14} /> : undefined}
            onPress={() => controller.setPlaybackRate(rate)}
          >
            {rate === 1 ? "Normal" : `${rate}×`}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
});

/* -------------------------------------------------------------------------- */
/* Loop                                                                       */
/* -------------------------------------------------------------------------- */

export const LoopButton = React.memo(function LoopButton(): React.ReactElement {
  const { controller, size } = useAudio("Loop");
  const loop = useAudioState((s) => s.loop);
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant={loop ? "light" : "subtle"}
      aria-label={loop ? "Disable loop" : "Loop"}
      aria-pressed={loop}
      onPress={() => controller.setLoop(!loop)}
    >
      {loop ? <IconRepeat /> : <IconRepeatOff />}
    </ActionIcon>
  );
});

/* -------------------------------------------------------------------------- */
/* Buffering / error                                                          */
/* -------------------------------------------------------------------------- */

export const BufferingIndicator = React.memo(
  function BufferingIndicator(): React.ReactElement | null {
    const { size } = useAudio("Buffering");
    const { status, isBuffering } = useAudioState(
      (s) => ({ status: s.status, isBuffering: s.isBuffering }),
      shallowEqual,
    );
    if (status !== "loading" && !isBuffering) return null;
    return <Loader size={clampMediaSize(size)} aria-label="Buffering" />;
  },
);

export const ErrorOverlay = React.memo(function ErrorOverlay(): React.ReactElement | null {
  const { controller } = useAudio("Error");
  const { status, error } = useAudioState(
    (s) => ({ status: s.status, error: s.error }),
    shallowEqual,
  );
  if (status !== "error") return null;
  return (
    <Group justify="space-between" align="center" gap="$sm" width="100%">
      <Text size="sm" color="$red11" fontWeight="500">
        {error?.message ?? "This audio could not be played."}
      </Text>
      <Button size="xs" variant="light" onPress={() => void controller.retry()}>
        Retry
      </Button>
    </Group>
  );
});

/* -------------------------------------------------------------------------- */
/* Default control bar                                                        */
/* -------------------------------------------------------------------------- */

export function ControlBar(): React.ReactElement {
  const isError = useAudioState((s) => s.status === "error");
  if (isError) return <ErrorOverlay />;
  return (
    <Stack gap="$xs" width="100%">
      {/* Scrubber row: current time · scrubber · total time, with breathing room. */}
      <Group gap="$sm" align="center" wrap="nowrap">
        <TimeCurrent />
        <Box flex={1} marginHorizontal="$xs">
          <Scrubber />
        </Box>
        <TimeDuration />
      </Group>
      {/* Transport row. */}
      <Group justify="space-between" align="center" gap="$xs" wrap="nowrap">
        <Group gap="$xxs" align="center" wrap="nowrap">
          <PlayPauseButton />
          <SeekButton seconds={-10} />
          <SeekButton seconds={10} />
        </Group>
        <Group gap="$xxs" align="center" wrap="nowrap">
          <VolumeControl />
          <PlaybackRateMenu />
          <LoopButton />
        </Group>
      </Group>
    </Stack>
  );
}
