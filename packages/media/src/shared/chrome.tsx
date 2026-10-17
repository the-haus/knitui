/**
 * Chrome primitives shared by the audio + video players: the scrubber frame and
 * its buffered underlay, the LIVE badge dot, the scrub-preview state hook and the
 * stable label formatters. Package-internal (not in the `shared` barrel, which
 * stays React-free for the engines).
 *
 * Every frame here is a static `styled()` (no runtime style objects), so the
 * compiler can flatten each use and the per-tick scrubber re-render only diffs the
 * one dynamic prop (`width` of the buffered underlay).
 */
import * as React from "react";

import { Box } from "@knitui/components";
import { isWeb, styled } from "@knitui/core";

import { formatTime } from "./format-time";

/** The scrubber's positioning frame (the slider centres inside it). */
export const ScrubberFrame = styled(Box, {
  displayName: "MediaScrubber",
  position: "relative",
  width: "100%",
  justifyContent: "center",
});

/** The buffered-range underlay, centred on the (vertically centred) slider track. */
export const ScrubberBuffered = styled(Box, {
  displayName: "MediaScrubberBuffered",
  position: "absolute",
  top: "50%",
  marginTop: -2,
  left: 0,
  height: 4,
  borderRadius: 4,
  backgroundColor: "color6",
  pointerEvents: "none",
  variants: {
    /** Over video pixels: the theme-independent light wash. */
    onMedia: { true: { backgroundColor: "mediaHighlight" } },
  } as const,
});

/** The red dot of the LIVE badge. */
export const LiveDot = styled(Box, {
  displayName: "MediaLiveDot",
  width: 8,
  height: 8,
  borderRadius: 8,
  backgroundColor: "red9",
});

/** The web pointer-hover handlers {@link hoverProps} produces. */
export interface HoverHandlerProps {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const NO_HOVER: HoverHandlerProps = Object.freeze({});

/**
 * Pointer-hover handlers to spread onto a frame (web only; `{}` on native, where
 * there is no hover). v3 web does NOT attach listeners for `onHoverIn` /
 * `onHoverOut` on their own (only alongside a `hover:` style or group), so the
 * player chrome uses the DOM mouse events, which v3 always wires. Typed as a
 * precise object so the spread passes the frame's prop check.
 */
export const hoverProps = (enter: () => void, leave: () => void): HoverHandlerProps =>
  isWeb ? { onMouseEnter: enter, onMouseLeave: leave } : NO_HOVER;

/** Tabular figures for timecodes (hoisted: one array, not one per render). */
export const TABULAR_NUMS: ["tabular-nums"] = ["tabular-nums"];

/** Slider thumb label for a seek position. */
export const formatScrubLabel = (seconds: number): string => formatTime(seconds);

/** Slider thumb label for a 0..1 volume. */
export const formatVolumeLabel = (volume: number): string => `${Math.round(volume * 100)}%`;

/** Main-axis length (px) of the compact volume slider. */
export const VOLUME_LENGTH = 84;

/** Slot styles for the vertical volume flyout's slider (hoisted constant). */
export const VERTICAL_VOLUME_STYLES = { trackContainer: { height: VOLUME_LENGTH } } as const;

/**
 * Scrub-preview state: while the thumb is dragged the slider shows the local
 * preview and the seek commits on release, so incoming time updates never fight
 * the thumb. Handlers are stable (the scrubber re-renders per tick).
 */
export function useScrubPreview(
  seekTo: (seconds: number) => void,
  onScrub?: () => void,
): {
  preview: number | null;
  onChange: (value: number) => void;
  onChangeEnd: (value: number) => void;
} {
  const [preview, setPreview] = React.useState<number | null>(null);
  const seekRef = React.useRef(seekTo);
  seekRef.current = seekTo;
  const scrubRef = React.useRef(onScrub);
  scrubRef.current = onScrub;
  const onChange = React.useCallback((value: number) => {
    scrubRef.current?.();
    setPreview(value);
  }, []);
  const onChangeEnd = React.useCallback((value: number) => {
    seekRef.current(value);
    setPreview(null);
  }, []);
  return { preview, onChange, onChangeEnd };
}

const PERCENT_WIDTHS: { width: `${number}%` }[] = Array.from({ length: 101 }, (_, i) => ({
  width: `${i}%` as const,
}));

/**
 * A value-tracking width (buffered range, input level) as an INLINE style. As a
 * Tamagui style prop every distinct value would inject its own atomic CSS rule
 * on web; inline it is one attribute write. The 101 objects are prebuilt, so a
 * per-tick render allocates nothing. `fraction` is clamped to 0..1.
 */
export const percentWidth = (fraction: number): { width: `${number}%` } =>
  PERCENT_WIDTHS[Math.round(Math.max(0, Math.min(1, fraction)) * 100)];
