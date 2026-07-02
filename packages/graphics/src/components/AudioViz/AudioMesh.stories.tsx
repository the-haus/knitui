import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

// AudioMesh is a single cross-platform component (pure Skia RuntimeEffect +
// reanimated), so — like AudioVisualizer — there's no `.web` split; the same file
// renders in Storybook (web) and on native. Each mesh story is ONE live CanvasKit
// context, so the story count is kept modest (Chrome caps live WebGL contexts).
import { AudioMesh, type AudioMeshProps, type AudioVisualizerHandle } from ".";

/** Monotonic clock for the synthetic drivers. */
function now(): number {
  const perf = (globalThis as { performance?: { now(): number } }).performance;
  return perf && typeof perf.now === "function" ? perf.now() : Date.now();
}

type Pattern = "sine" | "beat" | "noise";

/** Synthetic level source: a row of `count` levels (0..1) at time `t` seconds. */
function sample(pattern: Pattern, count: number, t: number): number[] {
  const out = new Array<number>(count);
  for (let i = 0; i < count; i++) {
    const u = i / Math.max(1, count - 1);
    if (pattern === "sine") {
      const env = Math.sin(u * Math.PI);
      out[i] = Math.max(0, (Math.sin(t * 3 + u * Math.PI * 4) * 0.5 + 0.5) * env);
    } else if (pattern === "beat") {
      const phase = (t % 0.5) / 0.5;
      const kick = Math.pow(1 - phase, 2.2);
      out[i] = Math.max(0.04, kick * (1 - u * 0.7));
    } else {
      out[i] = Math.random() * Math.sin(u * Math.PI);
    }
  }
  return out;
}

/** Pushes synthetic states into the visualizer through the imperative ref handle. */
function useDriver(
  ref: React.RefObject<AudioVisualizerHandle | null>,
  count: number,
  pattern: Pattern,
): void {
  React.useEffect(() => {
    let raf = 0;
    let mounted = true;
    const start = now();
    const tick = (): void => {
      if (!mounted) return;
      ref.current?.push(sample(pattern, count, (now() - start) / 1000));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, count, pattern]);
}

type HarnessProps = AudioMeshProps & {
  /** Synthetic data pattern fed through the ref handle. */
  pattern?: Pattern;
  /** Demo box width in px. */
  boxWidth?: number;
};

/** Ref-driven harness: owns the handle, runs a driver, renders the mesh. */
function Harness({
  pattern = "sine",
  boxWidth = 420,
  count = 48,
  height = 220,
  ...props
}: HarnessProps): React.ReactElement {
  const ref = React.useRef<AudioVisualizerHandle>(null);
  useDriver(ref, count, pattern);
  return (
    <Box width={boxWidth} maxWidth="100%">
      <AudioMesh ref={ref} count={count} height={height} {...props} />
    </Box>
  );
}

const meta = {
  title: "Graphics/AudioMesh",
  component: AudioMesh,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flowing gradient-MESH audio visualizer: a full-bleed Skia `RuntimeEffect` (SkSL) whose soft colour blobs swell with the spectrum and drift on a slow orbit (so the field stays alive even at silence). It shares the data head with `AudioVisualizer` — push TARGET states via the ref handle (`ref.push(levels)`) or a `target` SharedValue and the easing transition lives inside, paced on the display clock. Each control point tracks one band of the spectrum (low bands → one blob, highs → another) and its colour is spread across the `colors` palette. Identical on native and web (web needs `<GraphicsProvider>` + CanvasKit). Reduced motion freezes the idle drift but keeps the audio pulse. The stories below drive it with a synthetic ticker.",
      },
    },
  },
  argTypes: {
    pattern: { control: "select", options: ["sine", "beat", "noise"] },
    points: { control: { type: "range", min: 1, max: 6, step: 1 } },
    softness: { control: { type: "range", min: 0.1, max: 0.9, step: 0.05 } },
    speed: { control: { type: "range", min: 0, max: 3, step: 0.1 } },
  },
} satisfies Meta<typeof Harness>;

export default meta;

type Story = StoryObj<typeof Harness>;

/** The default mesh: a cyan→indigo→pink field flowing to a travelling sine. */
export const Default: Story = {
  render: (args) => <Harness {...args} />,
  args: { pattern: "sine" },
};

/** A kick beat — watch the low-band blob bloom on every hit. */
export const Beat: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    pattern: "beat",
    colors: ["#f59e0b", "#ef4444", "#a855f7"],
    softness: 0.5,
    attack: 0.05,
    release: 0.85,
  },
};

/** A warmer palette with more, softer points — a slow lava-lamp drift. */
export const Calm: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    pattern: "sine",
    colors: ["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b"],
    points: 6,
    softness: 0.7,
    speed: 0.4,
    smoothing: 0.6,
  },
};

/** A custom two-stop palette over a dark background. */
export const CustomPalette: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    pattern: "sine",
    colors: ["#22d3ee", "#a3e635"],
    backgroundColor: "#0b1020",
    points: 4,
  },
};

/** Synthetic linear FFT magnitudes (`bins` long): two drifting formant peaks + noise. */
function fakeFft(t: number, bins: number, out: Float32Array): Float32Array {
  const c1 = 0.08 + 0.05 * Math.sin(t * 0.9);
  const c2 = 0.32 + 0.12 * Math.sin(t * 0.6 + 1);
  for (let i = 0; i < bins; i++) {
    const f = i / bins;
    const p1 = Math.exp(-(((f - c1) / 0.035) ** 2));
    const p2 = 0.7 * Math.exp(-(((f - c2) / 0.06) ** 2));
    out[i] = (p1 + p2) * (0.55 + 0.45 * Math.random());
  }
  return out;
}

/**
 * Raw FFT input: the producer pushes the WHOLE raw FFT (512 linear magnitudes)
 * every 100ms with `input="fft"`; the component reduces it to `count` bands and
 * the time-based easing (`responseTime`) fills in buttery motion between frames.
 */
function FftDrivenDemo(args: HarnessProps): React.ReactElement {
  const ref = React.useRef<AudioVisualizerHandle>(null);
  const bins = 512;
  React.useEffect(() => {
    const mags = new Float32Array(bins);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let mounted = true;
    const start = now();
    const tick = (): void => {
      if (!mounted) return;
      fakeFft((now() - start) / 1000, bins, mags);
      ref.current?.push(mags); // raw 512 magnitudes — the component keeps only `count`
      timer = setTimeout(tick, 100); // 10 Hz
    };
    tick();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);
  return (
    <Box width={420} maxWidth="100%">
      <AudioMesh ref={ref} {...args} />
    </Box>
  );
}

export const FftDriven: Story = {
  render: (args) => <FftDrivenDemo {...args} />,
  args: {
    count: 56,
    height: 240,
    input: "fft",
    fftScale: "linear",
    responseTime: 90,
    colors: ["#f59e0b", "#ef4444", "#a855f7"],
  },
};
