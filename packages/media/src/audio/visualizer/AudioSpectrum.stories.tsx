/**
 * Audio-visualizer stories — the payoff of the `@knitui/media/dsp` FFT, wired to the
 * REAL music player. The headline stories play an actual track through `<Audio>`,
 * tap its off-thread sampler with {@link useAudioSpectrum}, and push the resulting
 * frequency bands into the Skia-rendered `<AudioVisualizer>` from `@knitui/graphics`.
 *
 * The performant path (see `useAudioSpectrum`): the player already captures PCM off
 * the audio thread (`sampleUpdate`); the hook copies it into a ring buffer, runs
 * the FFT once per painted frame in a single self-suspending rAF loop, and pushes
 * bars to the visualizer ref — zero React re-renders on the hot path, and a paused
 * player costs nothing.
 *
 * IMPORTANT: `@knitui/graphics` (and Skia/CanvasKit) is a DEV-ONLY dependency here —
 * the shipped `@knitui/media` stays Skia-free. The `useAudioSpectrum` hook ships and
 * has NO graphics dependency; only this story file imports the renderer, behind a
 * lazy loader that awaits `loadGraphicsRuntime()` (CanvasKit on web) before
 * evaluating the Skia barrel. No other media story pays for Skia.
 *
 * Three sources, all routed through the SAME `SpectrumAnalyzer` in the hook/helpers:
 *   - a real `<Audio>` player (the default stories — press play),
 *   - the live microphone via `useAudioStream` ("Live microphone"), and
 *   - a permission-free synthetic generator (the "Variants" style preview only).
 */
import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Button, Group, Stack, Text } from "@knitui/components";
// Type-only — erased at build, so this does NOT pull the Skia barrel into module
// eval. The runtime component is loaded lazily in `useLazyAudioVisualizer`.
import type { AudioVisualizerHandle, AudioVisualizerProps } from "@knitui/graphics";
import { IconMicrophone, IconMicrophoneOff } from "@knitui/icons";

import { SpectrumAnalyzer } from "../../dsp";
import { Audio } from "../Audio";
import type { AudioController } from "../controller/audio-controller-base";
import { useAudioSpectrum } from "../hooks/useAudioSpectrum";
import { useAudioStream } from "../hooks/useAudioStream";

// A real, CORS-enabled remote track (MDN sends `Access-Control-Allow-Origin: *`).
// The player is given `crossOrigin="anonymous"` so Web Audio is allowed to read it
// and the visualizer can sample it — the real-app pattern for visualizing remote
// audio (no dev proxy needed).
const SONG_1 = "https://mdn.github.io/webaudio-examples/audio-basics/outfoxing.mp3";

type AudioVisualizerComponent = React.ForwardRefExoticComponent<
  AudioVisualizerProps & React.RefAttributes<AudioVisualizerHandle>
>;

/**
 * Lazy-load `<AudioVisualizer>` from `@knitui/graphics`. On web we must load
 * CanvasKit (`loadGraphicsRuntime`) BEFORE the Skia barrel is evaluated — so both
 * imports are dynamic and sequenced inside the effect.
 */
function useLazyAudioVisualizer(): {
  Visualizer: AudioVisualizerComponent | null;
  error: string | null;
} {
  const [state, setState] = React.useState<{
    Visualizer: AudioVisualizerComponent | null;
    error: string | null;
  }>({ Visualizer: null, error: null });

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { loadGraphicsRuntime } = await import("@knitui/graphics/runtime");
        await loadGraphicsRuntime();
        const mod = await import("@knitui/graphics");
        if (!cancelled) {
          setState({ Visualizer: mod.AudioVisualizer as AudioVisualizerComponent, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ Visualizer: null, error: err instanceof Error ? err.message : String(err) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Visual props forwarded to `<AudioVisualizer>`. */
interface SpectrumStoryProps {
  variant?: AudioVisualizerProps["variant"];
  /** Bar count — also the number of bands the spectrum is reduced to. */
  count?: number;
  height?: number;
  gradient?: AudioVisualizerProps["gradient"];
  color?: string;
  glow?: AudioVisualizerProps["glow"];
  glowColor?: string;
  /** Rise time constant in ms — rate-independent visual easing (graphics side). */
  responseTime?: number;
  /** FFT window size for the analyzer. */
  fftSize?: number;
}

const BAND_OPTS = { scale: "log", minHz: 30, maxHz: 16000, reduce: "max" } as const;

/** Renders the lazily-loaded visualizer, with placeholder/error fallbacks. */
function VisualizerStage({
  Visualizer,
  error,
  vizRef,
  height = 120,
  count = 64,
  ...visual
}: SpectrumStoryProps & {
  Visualizer: AudioVisualizerComponent | null;
  error: string | null;
  vizRef: React.RefObject<AudioVisualizerHandle | null>;
}): React.ReactElement {
  if (error) {
    return (
      <Box
        height={height}
        justifyContent="center"
        alignItems="center"
        borderRadius="$md"
        backgroundColor="$red3"
      >
        <Text size="xs" color="$red11">
          Failed to load the Skia visualizer: {error}
        </Text>
      </Box>
    );
  }
  if (!Visualizer) {
    return (
      <Box
        height={height}
        justifyContent="center"
        alignItems="center"
        borderRadius="$md"
        backgroundColor="$color2"
      >
        <Text size="sm" color="$color11">
          Loading visualizer…
        </Text>
      </Box>
    );
  }
  return <Visualizer ref={vizRef} height={height} count={count} {...visual} />;
}

interface PlayerStoryProps extends SpectrumStoryProps {
  source: string;
  title?: string;
  artist?: string;
  artwork?: string;
}

/**
 * The headline harness: a real `<Audio>` player + visualizer, driven by the
 * player's live PCM via `useAudioSpectrum`. Press play and the bars track the song.
 */
function PlayerSpectrum({
  source,
  title,
  artist,
  artwork,
  fftSize = 2048,
  count = 64,
  ...visual
}: PlayerStoryProps): React.ReactElement {
  const { Visualizer, error } = useLazyAudioVisualizer();
  const vizRef = React.useRef<AudioVisualizerHandle>(null);
  const [controller, setController] = React.useState<AudioController | null>(null);

  // The performant mechanism: off-thread sampler → ring buffer → one FFT/frame →
  // push to the visualizer. No React re-renders per frame.
  useAudioSpectrum(controller, {
    fftSize,
    bands: count,
    onFrame: (bars) => vizRef.current?.push(bars),
    onRest: () => vizRef.current?.rest(),
  });

  return (
    <Stack gap="$sm" width="100%" maxWidth={560}>
      <VisualizerStage
        Visualizer={Visualizer}
        error={error}
        vizRef={vizRef}
        count={count}
        {...visual}
      />
      <Audio
        // `crossOrigin: "anonymous"` is REQUIRED to visualize a remote track: without
        // it the browser taints the cross-origin audio and Web Audio sampling reports
        // unsupported (no analyser, flat bars). The source server must send CORS.
        source={{ uri: source, crossOrigin: "anonymous" }}
        title={title}
        artist={artist}
        artwork={artwork}
        getController={setController}
      />
    </Stack>
  );
}

/** Live-microphone harness: real PCM from `useAudioStream` → the same analyzer. */
function MicrophoneSpectrum({
  fftSize = 1024,
  count = 64,
  height = 140,
  ...rest
}: SpectrumStoryProps): React.ReactElement {
  const { Visualizer, error } = useLazyAudioVisualizer();
  const vizRef = React.useRef<AudioVisualizerHandle>(null);
  const analyzerRef = React.useRef<SpectrumAnalyzer | null>(null);
  const [micError, setMicError] = React.useState<string | null>(null);

  const { start, stop, isStreaming } = useAudioStream({
    channels: 1,
    autoStart: false,
    onBuffer: (buf) => {
      const rate = buf.sampleRate || 48000;
      let a = analyzerRef.current;
      if (!a || a.fftSize !== fftSize || a.sampleRate !== rate) {
        a = new SpectrumAnalyzer({
          fftSize,
          sampleRate: rate,
          smoothingTimeConstant: 0,
          minDecibels: -90,
          maxDecibels: -20,
        });
        analyzerRef.current = a;
      }
      a.write(buf.frames);
    },
  });

  React.useEffect(() => {
    if (!isStreaming) {
      vizRef.current?.rest();
      return;
    }
    let raf = 0;
    let mounted = true;
    const bars = new Float32Array(count);
    const tick = (): void => {
      if (!mounted) return;
      const a = analyzerRef.current;
      if (a) {
        a.getBands(bars, BAND_OPTS);
        vizRef.current?.push(bars);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [isStreaming, count]);

  const onToggle = React.useCallback(() => {
    if (isStreaming) {
      stop();
      return;
    }
    setMicError(null);
    void start().catch((err: unknown) => {
      setMicError(err instanceof Error ? err.message : "Could not access the microphone.");
    });
  }, [isStreaming, start, stop]);

  return (
    <Stack
      gap="$sm"
      padding="$md"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$lg"
      backgroundColor="$color2"
      maxWidth={560}
      width="100%"
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="$xs" align="center" wrap="nowrap">
          {isStreaming ? <IconMicrophone size={18} /> : <IconMicrophoneOff size={18} />}
          <Text size="sm" fontWeight="600">
            {isStreaming ? "Listening" : "Microphone"}
          </Text>
        </Group>
        <Button size="xs" variant={isStreaming ? "light" : "filled"} onPress={onToggle}>
          {isStreaming ? "Stop" : "Start"}
        </Button>
      </Group>

      <VisualizerStage
        Visualizer={Visualizer}
        error={error}
        vizRef={vizRef}
        count={count}
        height={height}
        {...rest}
      />

      {micError ? (
        <Text size="xs" color="$red11">
          {micError}
        </Text>
      ) : null}
    </Stack>
  );
}

/** A drifting, "musical" PCM window — used ONLY for the permission-free preview. */
function fillSynthetic(out: Float32Array, t: number, sampleRate: number): void {
  const n = out.length;
  const kick = Math.exp(-(t % 0.5) * 6); // a pulse every 500 ms
  const bassHz = 90 + 30 * Math.sin(t * 0.5);
  const midHz = 500 + 280 * Math.sin(t * 0.8);
  const airHz = 3000 + 1800 * Math.sin(t * 0.37);
  const midAmp = 0.4 * (0.6 + 0.4 * Math.sin(t * 1.3));
  const airAmp = 0.25 * (0.5 + 0.5 * Math.sin(t * 0.9 + 1));
  for (let i = 0; i < n; i++) {
    const time = i / sampleRate;
    let s = (0.5 + 0.3 * kick) * Math.sin(2 * Math.PI * bassHz * time);
    s += midAmp * Math.sin(2 * Math.PI * midHz * time);
    s += airAmp * Math.sin(2 * Math.PI * airHz * time);
    s += 0.04 * (Math.random() * 2 - 1);
    out[i] = s * 0.45;
  }
}

/** Permission-free preview: a synthetic signal, for showing the visual variants. */
function SyntheticSpectrum({
  fftSize = 1024,
  count = 64,
  ...rest
}: SpectrumStoryProps): React.ReactElement {
  const sampleRate = 44100;
  const { Visualizer, error } = useLazyAudioVisualizer();
  const vizRef = React.useRef<AudioVisualizerHandle>(null);
  const analyzer = React.useMemo(
    () =>
      new SpectrumAnalyzer({
        fftSize,
        sampleRate,
        smoothingTimeConstant: 0,
        minDecibels: -90,
        maxDecibels: -25,
      }),
    [fftSize],
  );

  React.useEffect(() => {
    let raf = 0;
    let mounted = true;
    const chunk = new Float32Array(fftSize);
    const bars = new Float32Array(count);
    const start = performance.now();
    const tick = (): void => {
      if (!mounted) return;
      const t = (performance.now() - start) / 1000;
      fillSynthetic(chunk, t, sampleRate);
      analyzer.write(chunk);
      analyzer.getBands(bars, BAND_OPTS);
      vizRef.current?.push(bars);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [analyzer, fftSize, count]);

  return (
    <Box width="100%" maxWidth={560}>
      <VisualizerStage
        Visualizer={Visualizer}
        error={error}
        vizRef={vizRef}
        count={count}
        {...rest}
      />
    </Box>
  );
}

const meta = {
  title: "Media/Audio Visualizer",
  component: PlayerSpectrum,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A Skia-rendered audio visualizer driven by the `@knitui/media/dsp` FFT, attached " +
          "to a real `<Audio>` player. `useAudioSpectrum` taps the player's off-thread " +
          "sampler (`sampleUpdate`), runs the FFT once per frame, and pushes frequency " +
          "bands to `<AudioVisualizer>` — no per-frame React renders. Press play. " +
          "(`@knitui/graphics`/Skia is a dev-only dependency; the shipped kit is Skia-free.)",
      },
    },
  },
  args: {
    source: SONG_1,
    title: "Outfoxing",
    artist: "Live spectrum",
    variant: "bars",
    count: 64,
    height: 120,
    responseTime: 90,
    gradient: ["#22d3ee", "#6366f1", "#ec4899"],
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["bars", "mirror", "wave", "line", "dots", "radial"],
    },
    count: { control: { type: "range", min: 8, max: 128, step: 4 } },
    height: { control: { type: "range", min: 48, max: 280, step: 8 } },
    responseTime: { control: { type: "range", min: 0, max: 300, step: 10 } },
    fftSize: { control: "select", options: [512, 1024, 2048, 4096] },
  },
} satisfies Meta<typeof PlayerSpectrum>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Real player → live frequency bars off the actual track. Press play.
 *
 * The track is a remote, CORS-enabled source and the player sets
 * `crossOrigin="anonymous"`, so Web Audio is allowed to read it and the bars react
 * to the music — the real-app pattern for visualizing remote audio. (A cross-origin
 * source WITHOUT CORS can't be sampled: the browser taints the buffer, sampling
 * reports unsupported, and the player just plays silently to the visualizer.)
 */
export const Player: Story = {};

/** A neon glow behind a crisp shape (a Skia blur), still player-driven. */
export const Glow: Story = {
  args: {
    glow: true,
    glowColor: "#22d3ee",
    gradient: ["#67e8f9", "#22d3ee"],
    height: 140,
  },
};

/** Bars radiating from the center as spokes — pair with a sweep gradient. */
export const Radial: Story = {
  args: {
    variant: "radial",
    height: 240,
    count: 80,
    gradient: { colors: ["#f59e0b", "#ef4444", "#a855f7"], type: "sweep" },
  },
};

/**
 * Live microphone → `useAudioStream` PCM → `SpectrumAnalyzer` → visualizer.
 * Press **Start** and grant mic permission. Works on web (getUserMedia) and
 * native (expo-audio).
 */
export const LiveMicrophone: Story = {
  render: (args) => <MicrophoneSpectrum {...args} />,
  args: { variant: "bars", height: 140, gradient: ["#34d399", "#22d3ee", "#6366f1"] },
};

/**
 * Style preview only: every built-in variant fed by a permission-free SYNTHETIC
 * signal (no playback). Use it to compare the visual styles; the real data path is
 * the player/microphone stories above.
 */
export const VariantsPreview: Story = {
  render: (args) => (
    <Stack gap="$lg" width="100%" maxWidth={560}>
      {(["bars", "mirror", "wave", "line", "dots", "radial"] as const).map((variant) => (
        <Stack key={variant} gap="$xs">
          <Text size="xs" color="$color11" textTransform="uppercase">
            {variant}
          </Text>
          <SyntheticSpectrum {...args} variant={variant} height={variant === "radial" ? 200 : 96} />
        </Stack>
      ))}
    </Stack>
  ),
};
