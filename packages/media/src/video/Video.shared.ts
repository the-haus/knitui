/**
 * Cross-platform presentation layer for `<Video>`: the styled frames, the
 * runtime context the chrome consumes, the public prop/style types, and the
 * control-size scales. Everything here is platform-free so the single `Video`
 * root and the chrome stay thin — the platform differences live entirely in the
 * hook (`useVideoController`) and the surface (`VideoSurface`).
 */
import * as React from "react";

import { Box, Text } from "@knitui/components";
import type { GetProps, SlotAccessor, SlotStyles, SpaceTokens } from "@knitui/core";
import { styled } from "@knitui/core";

import type { MediaSize } from "../control-size";
import { type MediaStore, shallowEqual, useMediaSelector } from "../core/react/useMediaSelector";
import type { VideoController } from "./controller/video-controller-base";
import type {
  VideoCapabilities,
  VideoContentFit,
  VideoControllerState,
  VideoError,
  VideoMetadata,
  VideoPlayerConfig,
  VideoSource,
  VideoStatus,
  VideoTextTrack,
} from "./types";

/** Video control size — the kit's full size scale (see `../control-size`). */
export type VideoSize = MediaSize;

/**
 * Build a precisely-typed `{ onHoverIn?, onHoverOut? }` object to spread onto a
 * styled `Box`. Tamagui resolves these web hover events at runtime (no-ops on
 * native), but the generated style-prop types don't surface them, so a direct
 * attribute fails to typecheck. Spreading a precise object dodges the
 * excess-property check without widening to `any`.
 */
export const hoverProps = (handlers: {
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}): { onHoverIn?: () => void; onHoverOut?: () => void } => handlers;

/** Re-exported from the contract; lives in `types.ts` so the platform-free
 * controllers can consume it. */
export type { VideoTextTrack };

/* -------------------------------------------------------------------------- */
/* Styled frames                                                              */
/* -------------------------------------------------------------------------- */

/** Outer wrapper — positioning context for the overlaid chrome; clips the video. */
export const VideoFrame = styled(Box, {
  name: "Video",
  position: "relative",
  overflow: "hidden",
  width: "100%",
  backgroundColor: "$color1",
  borderRadius: "$md",
});

/** Holds the platform surface (the `<video>` element or expo `VideoView`). */
export const VideoSurfaceFrame = styled(Box, {
  name: "VideoSurface",
  position: "relative",
  width: "100%",
  height: "100%",
  backgroundColor: "black",
});

/** The caption cue bubble — the translucent pill the active cue text sits in. */
export const CaptionBubble = styled(Box, {
  name: "VideoCaptionBubble",
  backgroundColor: "$mediaScrim",
  borderRadius: "$xs",
  paddingHorizontal: "$sm",
  paddingVertical: "$xxs",
  maxWidth: "100%",
});

/**
 * The caption cue text. A styled `Text` so consumers can swap the font, size,
 * color or weight via the `captionText` style slot — the styling expo-video's
 * built-in subtitle rendering does not let you control.
 */
export const CaptionText = styled(Text, {
  name: "VideoCaptionText",
  color: "$mediaOnScrim",
  fontSize: "$md",
  fontWeight: "500",
  textAlign: "center",
});

/** The bottom gradient/scrim + control bar container. Kept compact. */
export const VideoControlBarFrame = styled(Box, {
  name: "VideoControlBar",
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  paddingHorizontal: "$xs",
  paddingVertical: "$xxs",
  gap: "$xxs",
});

/** Default delay (ms) before the chrome auto-hides during playback. */
export const DEFAULT_AUTO_HIDE_MS = 3000;

/* -------------------------------------------------------------------------- */
/* Per-slot styles                                                            */
/* -------------------------------------------------------------------------- */

export type VideoStyles = {
  root: GetProps<typeof VideoFrame>;
  surface: GetProps<typeof VideoSurfaceFrame>;
  controlBar: GetProps<typeof VideoControlBarFrame>;
  scrim: GetProps<typeof Box>;
  bigPlay: GetProps<typeof Box>;
  buffering: GetProps<typeof Box>;
  /** The caption cue bubble (background, radius, padding, position offset). */
  captions: GetProps<typeof Box>;
  /** The caption cue text (fontFamily, fontSize, color, fontWeight, …). */
  captionText: GetProps<typeof CaptionText>;
};

export const VIDEO_SLOT_KEYS = [
  "root",
  "surface",
  "controlBar",
  "scrim",
  "bigPlay",
  "buffering",
  "captions",
  "captionText",
] as const;

/* -------------------------------------------------------------------------- */
/* Runtime context                                                            */
/* -------------------------------------------------------------------------- */

export interface VideoContextValue {
  controller: VideoController;
  /**
   * The per-player snapshot store. Stable across renders — read slices with
   * {@link useVideoState} so a control only re-renders when ITS fields change,
   * not on every per-frame `currentTime` tick. (The live snapshot is always at
   * `store.getSnapshot()` for one-off imperative reads.)
   */
  store: MediaStore<VideoControllerState>;
  capabilities: VideoCapabilities;
  size: VideoSize;
  contentFit: VideoContentFit;
  /** Whether the chrome is currently visible (auto-hide). */
  controlsVisible: boolean;
  /** Reveal the chrome and reset the auto-hide timer (call on interaction). */
  keepAlive: () => void;
  /**
   * Pin the chrome open while a sustained interaction is in progress (an open
   * menu, a dragging slider). `holdControls(true)` suspends auto-hide;
   * `holdControls(false)` releases the hold and re-arms the timer. Calls must be
   * balanced — pair each `true` with a `false` (e.g. in an effect cleanup).
   */
  holdControls: (active: boolean) => void;
  styles?: SlotAccessor<VideoStyles>;
}

export const VideoContext = React.createContext<VideoContextValue | null>(null);

/** Read the video runtime. Throws if used outside `<Video>`. */
export function useVideo(component = "Video"): VideoContextValue {
  const ctx = React.useContext(VideoContext);
  if (!ctx) {
    throw new Error(`<Video.${component}> must be used inside <Video>.`);
  }
  return ctx;
}

/**
 * Subscribe to a SLICE of the live player state. The component re-renders only
 * when `selector`'s output changes by `isEqual` (default `Object.is`; pass
 * {@link shallowEqual} for a multi-field object selection). This is the granular
 * alternative to reading the whole snapshot off context — a `MuteButton` reading
 * `s => s.muted` stays put through every `currentTime` tick.
 */
export function useVideoState<T>(
  selector: (state: VideoControllerState) => T,
  isEqual?: (a: T, b: T) => boolean,
): T {
  const { store } = useVideo();
  return useMediaSelector(store, selector, isEqual);
}

export { shallowEqual };

/* -------------------------------------------------------------------------- */
/* Public props                                                               */
/* -------------------------------------------------------------------------- */

export interface VideoProps extends VideoPlayerConfig {
  /** The media to play. */
  source: VideoSource;
  /**
   * Stable identity for the shared-engine registry. Defaults to a generated id
   * (each `<Video>` is its own player); pass an explicit `id` to make two mounts
   * address the SAME shared-engine slot.
   */
  id?: string;
  /** How the frame is scaled in the container. Default `'contain'`. */
  contentFit?: VideoContentFit;
  /** Fixed aspect ratio for the frame (e.g. `16 / 9`). */
  aspectRatio?: number;
  /** Control sizing scale. Default `'md'`. */
  size?: VideoSize;
  /**
   * The control chrome. `true` (default) renders the built-in control bar;
   * `false` renders no chrome; a node renders custom chrome inside the context
   * (compose `Video.*` parts). */
  controls?: boolean | React.ReactNode;
  /** Show the centered big play button while paused. Default `true`. */
  showBigPlayButton?: boolean;
  /**
   * Auto-hide the chrome during playback. `true` uses the default delay,
   * `false` keeps it always visible, a number sets the delay in ms.
   */
  autoHide?: boolean | number;
  /** Use the platform's own native controls instead of the kit chrome. */
  nativeControls?: boolean;
  /** Poster image shown before playback (placeholder while the player is idle). */
  poster?: string;
  /** Now-playing title (used for the OS lock-screen / now-playing notification). */
  title?: string;
  /** Now-playing artist / secondary text under the title. */
  artist?: string;
  /** Now-playing artwork (cover) image URL. */
  artwork?: string;
  /**
   * Enable the OS now-playing notification + lock-screen controls (native;
   * no-op on web). `true` derives the displayed metadata from
   * `title`/`artist`/`artwork`; an object supplies it explicitly. Surfacing it on
   * a device build also requires the `expo-video` config plugin's
   * `supportsBackgroundPlayback: true`.
   */
  nowPlaying?: boolean | VideoMetadata;
  /** Allow Picture-in-Picture. Default `true`. */
  allowsPictureInPicture?: boolean;
  /**
   * External (sidecar) caption files. The controller fetches, parses, and
   * renders them with the kit's own overlay on every platform.
   */
  textTracks?: VideoTextTrack[];
  /** Enable keyboard shortcuts (space, arrows, m, f, …). Default `true`. */
  keyboard?: boolean;
  /** Web: double-click/tap the video to toggle fullscreen. Default `true`. */
  doubleClickToFullscreen?: boolean;
  /** Accessible label for the player region. Default `"Video player"`. */
  label?: string;
  /** Receives the controller once ready. */
  getController?: (controller: VideoController) => void;
  /** Fired once the player first becomes ready to play. */
  onReady?: () => void;
  onStatusChange?: (status: VideoStatus, error: VideoError | null) => void;
  onPlayingChange?: (playing: boolean) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (error: VideoError) => void;
  /** Per-slot style overrides. */
  styles?: SlotStyles<VideoStyles>;
  testID?: string;
  /** Frame style props (width/height/borderRadius…). */
  width?: GetProps<typeof VideoFrame>["width"];
  height?: GetProps<typeof VideoFrame>["height"];
  /** Inset of the control bar from the frame edges. */
  controlsOffset?: SpaceTokens | number;
}

export { type VideoContentFit };
