/**
 * Cross-platform control chrome for `<AudioPlaylist>`. Built from
 * `@knitui/components` + `@knitui/icons`, driven by the {@link AudioPlaylistContext}.
 * Parts are exported individually and attached to `AudioPlaylist`.
 */
import * as React from "react";

import { ActionIcon, Group, Slider, Stack, Text } from "@knitui/components";
import { styled } from "@knitui/core";
import { IconPlayerPauseFilled } from "@knitui/icons/IconPlayerPauseFilled";
import { IconPlayerPlayFilled } from "@knitui/icons/IconPlayerPlayFilled";
import { IconPlayerTrackNextFilled } from "@knitui/icons/IconPlayerTrackNextFilled";
import { IconPlayerTrackPrevFilled } from "@knitui/icons/IconPlayerTrackPrevFilled";
import { IconRepeat } from "@knitui/icons/IconRepeat";
import { IconRepeatOff } from "@knitui/icons/IconRepeatOff";
import { IconRepeatOnce } from "@knitui/icons/IconRepeatOnce";

import { clampMediaSize } from "../../control-size";
import {
  formatScrubLabel,
  percentWidth,
  ScrubberBuffered,
  ScrubberFrame,
  TABULAR_NUMS,
  useScrubPreview,
} from "../../shared/chrome";
import { volumeIconFor } from "../Audio.chrome.internal";
import { scrubberSizeFor } from "../Audio.shared";
import type { AudioPlaylistLoopMode } from "../controller/playlist-controller-base";
import { bufferedFractionOf, formatTime } from "../engine";
import {
  AudioTrackListFrame,
  AudioTrackRow,
  shallowEqual,
  useAudioPlaylistContext,
  usePlaylistState,
} from "./AudioPlaylist.shared";

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
  // every frame. Everything else it renders is static or stable.
  const { currentTime, duration } = usePlaylistState(
    (s) => ({ currentTime: s.currentTime, duration: s.duration }),
    shallowEqual,
  );
  const seekTo = React.useCallback((v: number) => void controller.seekTo(v), [controller]);
  const { preview, onChange, onChangeEnd } = useScrubPreview(seekTo);
  const hasDuration = Number.isFinite(duration) && duration > 0;
  const buffered = percentWidth(bufferedFractionOf({ bufferedPosition: -1, duration }));
  const displayValue = preview ?? (hasDuration ? Math.min(currentTime, duration) : 0);
  return (
    <ScrubberFrame>
      <ScrubberBuffered style={buffered} />
      <Slider
        value={displayValue}
        min={0}
        max={hasDuration ? duration : 1}
        step={0.1}
        size={scrubberSizeFor(size)}
        disabled={!hasDuration}
        label={formatScrubLabel}
        aria-label="Seek"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
      />
    </ScrubberFrame>
  );
});

export const TimeDisplay = React.memo(function TimeDisplay(): React.ReactElement {
  const { styles } = useAudioPlaylistContext("Time");
  const { currentTime, duration } = usePlaylistState(
    // Whole seconds — `formatTime` floors anyway, so a raw float only bought
    // byte-identical re-renders at tick rate (the `Scrubber` above keeps the float).
    (s) => ({
      currentTime: Math.floor(s.currentTime),
      duration: Number.isFinite(s.duration) ? s.duration : 0,
    }),
    shallowEqual,
  );
  return (
    <Text size="xs" fontVariant={TABULAR_NUMS} {...styles?.get("time")}>
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

/** The track-number / now-playing marker cell. */
const TrackIndex = styled(Text, {
  displayName: "AudioTrackIndex",
  width: 20,
  color: "color10",
  fontWeight: "500",
  fontSize: "xs",
  variants: {
    active: { true: { color: "color12", fontWeight: "700" } },
  } as const,
});

/** The track title cell. */
const TrackLabel = styled(Text, {
  displayName: "AudioTrackLabel",
  flex: 1,
  fontWeight: "400",
  fontSize: "sm",
  variants: {
    active: { true: { fontWeight: "600" } },
  } as const,
});

interface TrackRowProps {
  index: number;
  label: string;
  active: boolean;
  playing: boolean;
}

/**
 * One track row. Memoised on its own primitives, so a track change re-renders the
 * two rows whose `active` flipped, not the whole list.
 */
const TrackRow = React.memo(function TrackRow({
  index,
  label,
  active,
  playing,
}: TrackRowProps): React.ReactElement {
  const { controller, styles } = useAudioPlaylistContext("TrackList");
  const onPress = React.useCallback(() => controller.skipTo(index), [controller, index]);
  return (
    <AudioTrackRow
      active={active}
      onPress={onPress}
      {...(active ? { "aria-current": "true" as const } : null)}
      role="button"
      {...styles?.get("trackRow")}
    >
      <TrackIndex active={active}>{active && playing ? "▶" : index + 1}</TrackIndex>
      <TrackLabel active={active} numberOfLines={1} {...styles?.get("trackLabel")}>
        {label}
      </TrackLabel>
    </AudioTrackRow>
  );
});

/** The scrollable, clickable list of tracks. */
export const TrackList = React.memo(function TrackList(): React.ReactElement | null {
  const { styles } = useAudioPlaylistContext("TrackList");
  const { tracks, currentIndex, playing } = usePlaylistState(
    (s) => ({ tracks: s.tracks, currentIndex: s.currentIndex, playing: s.playing }),
    shallowEqual,
  );
  if (tracks.length === 0) return null;
  return (
    <AudioTrackListFrame {...styles?.get("trackList")}>
      {tracks.map((track, i) => (
        <TrackRow
          key={`${track.uri ?? "track"}-${i}`}
          index={i}
          label={track.name ?? track.uri ?? `Track ${i + 1}`}
          active={i === currentIndex}
          playing={i === currentIndex && playing}
        />
      ))}
    </AudioTrackListFrame>
  );
});

export const ControlBar = React.memo(function ControlBar(): React.ReactElement {
  return (
    <Stack gap="xs" width="100%">
      <Scrubber />
      <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
        <Group gap="xxs" align="center" wrap="nowrap">
          <PreviousButton />
          <PlayPauseButton />
          <NextButton />
        </Group>
        <Group gap="xxs" align="center" wrap="nowrap">
          <TimeDisplay />
          <VolumeControl />
          <LoopButton />
        </Group>
      </Group>
    </Stack>
  );
});
