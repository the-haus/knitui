/**
 * Cross-platform presentation layer for `<AudioPlaylist>`: styled frames, the
 * runtime context the chrome consumes, public props, and size scales. Platform
 * differences live in `useAudioPlaylistController`. Mirrors `Audio.shared.ts`.
 */
import * as React from "react";

import { Box, type Text } from "@knitui/components";
import type { GetProps, SlotAccessor, SlotStyles } from "@knitui/core";
import { styled } from "@knitui/core";

import { type MediaStore, shallowEqual, useMediaSelector } from "../../core/react/useMediaSelector";
import type { AudioSize } from "../Audio.shared";
import type {
  AudioPlaylistCapabilities,
  AudioPlaylistController,
  AudioPlaylistLoopMode,
  AudioPlaylistState,
} from "../controller/playlist-controller-base";
import type { AudioError, AudioSource } from "../types";

export type { AudioSize };

/** Outer playlist card. */
export const AudioPlaylistFrame = styled(Box, {
  name: "AudioPlaylist",
  position: "relative",
  width: "100%",
  flexDirection: "column",
  backgroundColor: "$color2",
  borderRadius: "$lg",
  borderWidth: 1,
  borderColor: "$borderColor",
  paddingHorizontal: "$md",
  paddingVertical: "$sm",
  gap: "$sm",
});

/** The scrollable track list container. */
export const AudioTrackListFrame = styled(Box, {
  name: "AudioTrackList",
  width: "100%",
  flexDirection: "column",
  gap: "$xxs",
});

/** A single track row. */
export const AudioTrackRow = styled(Box, {
  name: "AudioTrackRow",
  flexDirection: "row",
  alignItems: "center",
  gap: "$sm",
  paddingHorizontal: "$sm",
  paddingVertical: "$xs",
  borderRadius: "$sm",
  cursor: "pointer",
  hoverStyle: { backgroundColor: "$color4" },
  variants: {
    active: {
      true: { backgroundColor: "$color5" },
    },
  } as const,
});

export type AudioPlaylistStyles = {
  root: GetProps<typeof AudioPlaylistFrame>;
  trackList: GetProps<typeof AudioTrackListFrame>;
  trackRow: GetProps<typeof AudioTrackRow>;
  trackLabel: GetProps<typeof Text>;
  time: GetProps<typeof Text>;
};

export const AUDIO_PLAYLIST_SLOT_KEYS = [
  "root",
  "trackList",
  "trackRow",
  "trackLabel",
  "time",
] as const;

export interface AudioPlaylistContextValue {
  controller: AudioPlaylistController;
  /**
   * The per-player snapshot store. Stable across renders — read slices with
   * {@link usePlaylistState} so a control only re-renders when ITS fields
   * change, not on every per-frame `currentTime` tick. (The live snapshot is
   * always at `store.getSnapshot()` for one-off imperative reads.)
   */
  store: MediaStore<AudioPlaylistState>;
  capabilities: AudioPlaylistCapabilities;
  size: AudioSize;
  styles?: SlotAccessor<AudioPlaylistStyles>;
}

export const AudioPlaylistContext = React.createContext<AudioPlaylistContextValue | null>(null);

/** Read the playlist runtime. Throws if used outside `<AudioPlaylist>`. */
export function useAudioPlaylistContext(component = "AudioPlaylist"): AudioPlaylistContextValue {
  const ctx = React.useContext(AudioPlaylistContext);
  if (!ctx) {
    throw new Error(`<AudioPlaylist.${component}> must be used inside <AudioPlaylist>.`);
  }
  return ctx;
}

/**
 * Subscribe to a SLICE of the live playlist state. The component re-renders only
 * when `selector`'s output changes by `isEqual` (default `Object.is`; pass
 * {@link shallowEqual} for a multi-field object selection). The granular
 * alternative to reading the whole snapshot off context — a `LoopButton` reading
 * `s => s.loop` stays put through every `currentTime` tick.
 */
export function usePlaylistState<T>(
  selector: (state: AudioPlaylistState) => T,
  isEqual?: (a: T, b: T) => boolean,
): T {
  const { store } = useAudioPlaylistContext();
  return useMediaSelector(store, selector, isEqual);
}

export { shallowEqual };

export interface AudioPlaylistProps {
  /** Initial playlist sources. */
  sources?: AudioSource[];
  /** Initial loop mode. Default `'none'`. */
  loop?: AudioPlaylistLoopMode;
  /** Initial volume, 0..1. */
  volume?: number;
  /** Start muted. */
  muted?: boolean;
  /** Initial playback rate. */
  playbackRate?: number;
  /** Control sizing scale. Default `'md'`. */
  size?: AudioSize;
  /** Control chrome: `true` (default bar + track list), `false`, or custom node. */
  controls?: boolean | React.ReactNode;
  /** Show the track list. Default `true`. */
  showTrackList?: boolean;
  /** Enable keyboard shortcuts. Default `true`. */
  keyboard?: boolean;
  /** Accessible label. Default `"Audio playlist"`. */
  label?: string;
  getController?: (controller: AudioPlaylistController) => void;
  onTrackChange?: (currentIndex: number, previousIndex: number) => void;
  onEnded?: () => void;
  onError?: (error: AudioError) => void;
  styles?: SlotStyles<AudioPlaylistStyles>;
  testID?: string;
  width?: GetProps<typeof AudioPlaylistFrame>["width"];
  maxWidth?: GetProps<typeof AudioPlaylistFrame>["maxWidth"];
}
