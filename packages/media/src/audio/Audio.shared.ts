/**
 * Cross-platform presentation layer for `<Audio>`: the styled frames, the
 * runtime context the chrome consumes, the public prop/style types, and the
 * control-size scales. Everything here is platform-free so the single `Audio`
 * root and the chrome stay thin — the platform difference lives entirely in the
 * hook (`useAudioController`) and the (mostly invisible) surface.
 *
 * Unlike `<Video>`, an audio player has no visual playback surface and no
 * auto-hiding overlay chrome: the control bar is a persistent card.
 */
import * as React from "react";

import { Box, type Text } from "@knitui/components";
import type { GetProps, SlotAccessor, SlotStyles } from "@knitui/core";
import { styled } from "@knitui/core";

import { clampMediaSize, type MediaSize, type SupportedMediaSize } from "../control-size";
import { type MediaStore, shallowEqual, useMediaSelector } from "../core/react/useMediaSelector";
import type { AudioController } from "./controller/audio-controller-base";
import type {
  AudioCapabilities,
  AudioControllerState,
  AudioError,
  AudioMetadata,
  AudioPlayerConfig,
  AudioSource,
  AudioStatus,
} from "./types";

/** Audio control size — the kit's full size scale (see `../control-size`). */
export type AudioSize = MediaSize;

/**
 * Build a precisely-typed `{ onHoverIn?, onHoverOut? }` object to spread onto a
 * styled `Box`. Tamagui resolves these web hover events at runtime (no-ops on
 * native), but the generated style-prop types don't surface them, so a direct
 * attribute fails to typecheck. Mirrors the helper in `@knitui/media/video`.
 */
export const hoverProps = (handlers: {
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}): { onHoverIn?: () => void; onHoverOut?: () => void } => handlers;

/* -------------------------------------------------------------------------- */
/* Styled frames                                                              */
/* -------------------------------------------------------------------------- */

/** Outer player card. A surface-toned container, NOT the black video frame. */
export const AudioFrame = styled(Box, {
  name: "Audio",
  position: "relative",
  width: "100%",
  flexDirection: "column",
  backgroundColor: "$color2",
  borderRadius: "$lg",
  borderWidth: 1,
  borderColor: "$borderColor",
  paddingHorizontal: "$md",
  paddingVertical: "$sm",
  gap: "$xs",
});

/** The metadata header (artwork + title/artist). */
export const AudioHeaderFrame = styled(Box, {
  name: "AudioHeader",
  flexDirection: "row",
  alignItems: "center",
  gap: "$sm",
});

/** Artwork thumbnail. */
export const AudioArtwork = styled(Box, {
  name: "AudioArtwork",
  width: 48,
  height: 48,
  borderRadius: "$sm",
  overflow: "hidden",
  backgroundColor: "$color5",
});

/** The control-bar container that holds the transport + scrubber rows. */
export const AudioControlBarFrame = styled(Box, {
  name: "AudioControlBar",
  width: "100%",
  flexDirection: "column",
  gap: "$xs",
});

/* -------------------------------------------------------------------------- */
/* Size scales                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The slider size that pairs with each control scale — a genuine step-DOWN (the
 * scrubber reads as a slimmer companion to the transport buttons), so it is kept
 * as an explicit map rather than passing `size` straight through. Keyed by the
 * clamped `xs…xl` band; resolve via {@link scrubberSizeFor}.
 */
const SCRUBBER_SIZE: Record<SupportedMediaSize, "xxs" | "xs" | "sm" | "md"> = {
  xs: "xxs",
  sm: "xs",
  md: "xs",
  lg: "sm",
  xl: "sm",
};

/** The scrubber (seek-bar) slider size for a given audio control size. */
export const scrubberSizeFor = (size: AudioSize): "xxs" | "xs" | "sm" | "md" =>
  SCRUBBER_SIZE[clampMediaSize(size)];

/* -------------------------------------------------------------------------- */
/* Per-slot styles                                                            */
/* -------------------------------------------------------------------------- */

export type AudioStyles = {
  root: GetProps<typeof AudioFrame>;
  header: GetProps<typeof AudioHeaderFrame>;
  artwork: GetProps<typeof AudioArtwork>;
  controlBar: GetProps<typeof AudioControlBarFrame>;
  title: GetProps<typeof Text>;
  artist: GetProps<typeof Text>;
  time: GetProps<typeof Text>;
};

export const AUDIO_SLOT_KEYS = [
  "root",
  "header",
  "artwork",
  "controlBar",
  "title",
  "artist",
  "time",
] as const;

/* -------------------------------------------------------------------------- */
/* Runtime context                                                            */
/* -------------------------------------------------------------------------- */

export interface AudioContextValue {
  controller: AudioController;
  /**
   * The per-player snapshot store. Stable across renders — read slices with
   * {@link useAudioState} so a control only re-renders when ITS fields change,
   * not on every per-frame `currentTime` tick.
   */
  store: MediaStore<AudioControllerState>;
  /**
   * The display metadata derived from the `<Audio>` props (title/artist/album/
   * artwork), or `null` when no header props were given — in which case the
   * header falls back to the live `state.metadata` (lock-screen) it reads itself.
   * Stable across ticks (memoized on props), so it never churns the context.
   */
  headerMetadata: AudioMetadata | null;
  capabilities: AudioCapabilities;
  size: AudioSize;
  styles?: SlotAccessor<AudioStyles>;
}

export const AudioContext = React.createContext<AudioContextValue | null>(null);

/** Read the audio runtime. Throws if used outside `<Audio>`. */
export function useAudio(component = "Audio"): AudioContextValue {
  const ctx = React.useContext(AudioContext);
  if (!ctx) {
    throw new Error(`<Audio.${component}> must be used inside <Audio>.`);
  }
  return ctx;
}

/**
 * Subscribe to a SLICE of the live player state. The component re-renders only
 * when `selector`'s output changes by `isEqual` (default `Object.is`; pass
 * {@link shallowEqual} for a multi-field object selection).
 */
export function useAudioState<T>(
  selector: (state: AudioControllerState) => T,
  isEqual?: (a: T, b: T) => boolean,
): T {
  const { store } = useAudio();
  return useMediaSelector(store, selector, isEqual);
}

export { shallowEqual };

/* -------------------------------------------------------------------------- */
/* Public props                                                               */
/* -------------------------------------------------------------------------- */

export interface AudioProps extends AudioPlayerConfig {
  /** The audio to play. */
  source: AudioSource;
  /**
   * Stable identity for the shared-engine registry. Defaults to a generated id
   * (each `<Audio>` is its own player); pass an explicit `id` to make two mounts
   * address the SAME shared-engine slot.
   */
  id?: string;
  /** Control sizing scale. Default `'md'`. */
  size?: AudioSize;
  /**
   * The control chrome. `true` (default) renders the built-in control bar;
   * `false` renders no chrome; a node renders custom chrome inside the context
   * (compose `Audio.*` parts).
   */
  controls?: boolean | React.ReactNode;
  /** Now-playing title (shown in the header + used for lock-screen metadata). */
  title?: string;
  /** Now-playing artist. */
  artist?: string;
  /** Now-playing album. */
  album?: string;
  /** Artwork image URL. */
  artwork?: string;
  /** Show the metadata header. Defaults to `true` when any metadata is given. */
  showHeader?: boolean;
  /**
   * Enable lock-screen / now-playing controls with the given metadata. `true`
   * derives metadata from `title`/`artist`/`album`/`artwork`.
   */
  lockScreen?: boolean | AudioMetadata;
  /** Enable keyboard shortcuts (space, arrows, m, …). Default `true`. */
  keyboard?: boolean;
  /** Accessible label for the player region. Default `"Audio player"`. */
  label?: string;
  /** Receives the controller once ready. */
  getController?: (controller: AudioController) => void;
  /** Fired once the player first becomes ready to play. */
  onReady?: () => void;
  onStatusChange?: (status: AudioStatus, error: AudioError | null) => void;
  onPlayingChange?: (playing: boolean) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (error: AudioError) => void;
  /** Per-slot style overrides. */
  styles?: SlotStyles<AudioStyles>;
  testID?: string;
  /** Frame width. */
  width?: GetProps<typeof AudioFrame>["width"];
  /** Frame max width. */
  maxWidth?: GetProps<typeof AudioFrame>["maxWidth"];
}
