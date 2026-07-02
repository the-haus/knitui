/**
 * Cross-platform control chrome for `<AudioPlaylist>`. Built from
 * `@knitui/components` + `@knitui/icons`, driven by the {@link AudioPlaylistContext}.
 * Parts are exported individually and attached to `AudioPlaylist`.
 */
import * as React from "react";

import { ActionIcon, Box, Group, Slider, Stack, Text } from "@knitui/components";
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerTrackNextFilled,
  IconPlayerTrackPrevFilled,
  IconRepeat,
  IconRepeatOff,
  IconRepeatOnce,
} from "@knitui/icons";

import { clampMediaSize } from "../../control-size";
import { volumeIconFor } from "../Audio.chrome.internal";
import { scrubberSizeFor } from "../Audio.shared";
import type { AudioPlaylistLoopMode } from "../controller/playlist-controller-base";
import { bufferedFractionOf, formatTime } from "../engine";
import { shallowEqual, useAudioPlaylistContext, usePlaylistState } from "./AudioPlaylist.shared";

const LOOP_ORDER: AudioPlaylistLoopMode[] = ["none", "all", "single"];

export const PlayPauseButton = React.memo(function PlayPauseButton(): React.ReactElement {
  const { controller, size } = useAudioPlaylistContext("PlayPause");
  const playing = usePlaylistState((s) => s.playing);
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="filled"
      radius="xl"
      aria-label={playing ? "Pause" : "Play"}
      onPress={() => controller.togglePlay()}
    >
      {playing ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
    </ActionIcon>
  );
});

export const PreviousButton = React.memo(function PreviousButton(): React.ReactElement {
  const { controller, size } = useAudioPlaylistContext("Previous");
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="subtle"
      aria-label="Previous track"
      onPress={() => controller.previous()}
    >
      <IconPlayerTrackPrevFilled />
    </ActionIcon>
  );
});

export const NextButton = React.memo(function NextButton(): React.ReactElement {
  const { controller, size } = useAudioPlaylistContext("Next");
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="subtle"
      aria-label="Next track"
      onPress={() => controller.next()}
    >
      <IconPlayerTrackNextFilled />
    </ActionIcon>
  );
});

export const LoopButton = React.memo(function LoopButton(): React.ReactElement {
  const { controller, size } = useAudioPlaylistContext("Loop");
  const loop = usePlaylistState((s) => s.loop);
  const next = LOOP_ORDER[(LOOP_ORDER.indexOf(loop) + 1) % LOOP_ORDER.length];
  const Icon = loop === "single" ? IconRepeatOnce : loop === "all" ? IconRepeat : IconRepeatOff;
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant={loop === "none" ? "subtle" : "light"}
      aria-label={`Loop: ${loop}. Switch to ${next}`}
      onPress={() => controller.setLoop(next)}
    >
      <Icon />
    </ActionIcon>
  );
});

export const Scrubber = React.memo(function Scrubber(): React.ReactElement {
  const { controller, size } = useAudioPlaylistContext("Scrubber");
  // Reads the per-tick fields — one of the few controls that SHOULD re-render
  // every frame.
  const { currentTime, duration } = usePlaylistState(
    (s) => ({ currentTime: s.currentTime, duration: s.duration }),
    shallowEqual,
  );
  const hasDuration = Number.isFinite(duration) && duration > 0;
  const bufferedPct = Math.round(bufferedFractionOf({ bufferedPosition: -1, duration }) * 100);
  const [scrubValue, setScrubValue] = React.useState<number | null>(null);
  const displayValue = scrubValue ?? (hasDuration ? Math.min(currentTime, duration) : 0);
  return (
    <Box position="relative" width="100%" justifyContent="center">
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

export const TimeDisplay = React.memo(function TimeDisplay(): React.ReactElement {
  const { styles } = useAudioPlaylistContext("Time");
  const { currentTime, duration } = usePlaylistState(
    (s) => ({ currentTime: s.currentTime, duration: Number.isFinite(s.duration) ? s.duration : 0 }),
    shallowEqual,
  );
  return (
    <Text size="xs" fontVariant={["tabular-nums"]} {...styles?.get("time")}>
      {formatTime(currentTime)} / {formatTime(duration)}
    </Text>
  );
});

export const VolumeControl = React.memo(function VolumeControl(): React.ReactElement | null {
  const { controller, capabilities, size } = useAudioPlaylistContext("Volume");
  const { muted, volume } = usePlaylistState(
    (s) => ({ muted: s.muted, volume: s.volume }),
    shallowEqual,
  );
  if (!capabilities.canSetVolume) return null;
  const VolumeIcon = volumeIconFor(muted, volume);
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="subtle"
      aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
      onPress={() => controller.toggleMuted()}
    >
      <VolumeIcon />
    </ActionIcon>
  );
});

/** The scrollable, clickable list of tracks. */
export const TrackList = React.memo(function TrackList(): React.ReactElement | null {
  const { controller, styles } = useAudioPlaylistContext("TrackList");
  const { tracks, currentIndex, playing } = usePlaylistState(
    (s) => ({ tracks: s.tracks, currentIndex: s.currentIndex, playing: s.playing }),
    shallowEqual,
  );
  if (tracks.length === 0) return null;
  return (
    <Stack gap="$xxs" width="100%" {...styles?.get("trackList")}>
      {tracks.map((track, i) => {
        const active = i === currentIndex;
        return (
          <Group
            key={`${track.uri ?? "track"}-${i}`}
            gap="$sm"
            align="center"
            paddingHorizontal="$sm"
            paddingVertical="$xs"
            borderRadius="$sm"
            backgroundColor={active ? "$color5" : "transparent"}
            onPress={() => controller.skipTo(i)}
            aria-current={active ? "true" : undefined}
            role="button"
            cursor="pointer"
            hoverStyle={{ backgroundColor: active ? "$color5" : "$color4" }}
          >
            <Text
              size="xs"
              color={active ? "$color12" : "$color10"}
              fontWeight={active ? "700" : "500"}
              width={20}
            >
              {active && playing ? "▶" : i + 1}
            </Text>
            <Text
              size="sm"
              flex={1}
              numberOfLines={1}
              fontWeight={active ? "600" : "400"}
              {...styles?.get("trackLabel")}
            >
              {track.name ?? track.uri ?? `Track ${i + 1}`}
            </Text>
          </Group>
        );
      })}
    </Stack>
  );
});

export const ControlBar = React.memo(function ControlBar(): React.ReactElement {
  return (
    <Stack gap="$xs" width="100%">
      <Scrubber />
      <Group justify="space-between" align="center" gap="$xs" wrap="nowrap">
        <Group gap="$xxs" align="center" wrap="nowrap">
          <PreviousButton />
          <PlayPauseButton />
          <NextButton />
        </Group>
        <Group gap="$xxs" align="center" wrap="nowrap">
          <TimeDisplay />
          <VolumeControl />
          <LoopButton />
        </Group>
      </Group>
    </Stack>
  );
});
