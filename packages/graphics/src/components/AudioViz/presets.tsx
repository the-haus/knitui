/**
 * Thin named presets over `<AudioVisualizer variant=…>` — ergonomic shortcuts that
 * forward every prop (and the imperative ref handle) to the generic component with
 * the `variant` fixed. Use them when you know the look up front:
 *
 *   const ref = useRef<AudioVisualizerHandle>(null);
 *   <AudioBars ref={ref} gradient={["#22d3ee", "#6366f1"]} />
 *   ref.current?.push(levels);
 */
import * as React from "react";

import {
  AudioVisualizer,
  type AudioVisualizerHandle,
  type AudioVisualizerProps,
} from "./AudioVisualizer";

/** Props for a preset: the generic props minus `variant` (the preset fixes it). */
export type AudioVisualizerPresetProps = Omit<AudioVisualizerProps, "variant">;

function makePreset(
  variant: NonNullable<AudioVisualizerProps["variant"]>,
  displayName: string,
): React.ForwardRefExoticComponent<
  AudioVisualizerPresetProps & React.RefAttributes<AudioVisualizerHandle>
> {
  const Preset = React.forwardRef<AudioVisualizerHandle, AudioVisualizerPresetProps>(
    (props, ref) => <AudioVisualizer ref={ref} variant={variant} {...props} />,
  );
  Preset.displayName = displayName;
  return Preset;
}

/** Vertical bars growing from the bottom. */
export const AudioBars = makePreset("bars", "AudioBars");
/** Bars mirrored about the vertical center (classic waveform). */
export const AudioWaveform = makePreset("mirror", "AudioWaveform");
/** A single stroked polyline tracing the level at each bar. */
export const AudioLine = makePreset("line", "AudioLine");
/** A dot per bar at its level, centered vertically. */
export const AudioDots = makePreset("dots", "AudioDots");
/** Bars radiating from the center as spokes around a circle. */
export const AudioRadial = makePreset("radial", "AudioRadial");
