import * as React from "react";
import { useSharedValue } from "react-native-reanimated";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

// AudioVisualizer is a single cross-platform component (pure Skia + reanimated),
// so — unlike the `<div>`/`<View>` wrappers in this package — there's no `.web`
// split to import; the same file renders in Storybook (web) and on native.
import {
  AudioVisualizer,
  type AudioVisualizerHandle,
  type AudioVisualizerProps,
  createSpectrumMapper,
} from ".";

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
      // A travelling wave with a gentle bell envelope across the bars.
      const env = Math.sin(u * Math.PI);
      out[i] = Math.max(0, (Math.sin(t * 3 + u * Math.PI * 4) * 0.5 + 0.5) * env);
    } else if (pattern === "beat") {
      // A kick every ~0.5s that decays, lower bars hit hardest.
      const phase = (t % 0.5) / 0.5;
      const kick = Math.pow(1 - phase, 2.2);
      out[i] = Math.max(0.04, kick * (1 - u * 0.7));
    } else {
      // Jumpy per-bar noise — the smoother's job is to make this watchable.
      out[i] = Math.random() * Math.sin(u * Math.PI);
    }
  }
  return out;
}

/**
 * Pushes synthetic states into the visualizer through the imperative ref handle.
 * `jitter` simulates a bursty data source (irregular delivery + occasional
 * stalls), the case the internal display-clock easing is meant to smooth out —
 * compare a jittery source here against the buttery on-screen motion.
 */
function useDriver(
  ref: React.RefObject<AudioVisualizerHandle | null>,
  count: number,
  pattern: Pattern,
  jitter: boolean,
): void {
  React.useEffect(() => {
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let mounted = true;
    const start = now();
    const tick = (): void => {
      if (!mounted) return;
      ref.current?.push(sample(pattern, count, (now() - start) / 1000));
      if (jitter) {
        // Bursty cadence: mostly 16–130ms, with a ~1-in-12 longer stall.
        const d = Math.random() < 0.08 ? 200 + Math.random() * 220 : 16 + Math.random() * 114;
        timer = setTimeout(tick, d);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    tick();
    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [ref, count, pattern, jitter]);
}

type HarnessProps = AudioVisualizerProps & {
  /** Synthetic data pattern fed through the ref handle. */
  pattern?: Pattern;
  /** Simulate bursty/irregular tick delivery. */
  jitter?: boolean;
  /** Demo box width in px. */
  boxWidth?: number;
};

/** Ref-driven harness: owns the handle, runs a driver, renders the visualizer. */
function Harness({
  pattern = "sine",
  jitter = false,
  boxWidth = 360,
  count = 48,
  height = 64,
  ...props
}: HarnessProps): React.ReactElement {
  const ref = React.useRef<AudioVisualizerHandle>(null);
  useDriver(ref, count, pattern, jitter);
  return (
    <Box width={boxWidth} maxWidth="100%">
      <AudioVisualizer ref={ref} count={count} height={height} {...props} />
    </Box>
  );
}

const meta = {
  title: "Graphics/AudioVisualizer",
  component: AudioVisualizer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A data-driven Skia audio visualizer. An external driver only ever pushes new TARGET states (a row of 0..1 levels) via the imperative ref handle (`ref.push(levels)`) or a `target` SharedValue — the easing TRANSITION between states lives inside the component, paced on the display clock (`requestAnimationFrame`), double-buffered, off the React render path, and self-suspending when idle. `useDerivedValue` worklets build the `SkPath`s so the per-frame paint never re-renders React. Filled with a Skia gradient and optional glow. Identical on native and web (web needs `<GraphicsProvider>` + CanvasKit). Reduced-motion snaps to each target. The stories below drive it with a synthetic ticker.",
      },
    },
  },
  argTypes: {
    pattern: { control: "select", options: ["sine", "beat", "noise"] },
    variant: { control: "select", options: ["bars", "mirror", "wave", "line", "dots", "radial"] },
  },
} satisfies Meta<typeof Harness>;

export default meta;

type Story = StoryObj<typeof Harness>;

/** The default mirrored waveform, driven by a smooth travelling sine. */
export const Default: Story = {
  render: (args) => <Harness {...args} />,
  args: { variant: "mirror", pattern: "sine" },
};

/** Vertical bars filled with a linear gradient. */
export const Bars: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    variant: "bars",
    pattern: "sine",
    gradient: ["#22d3ee", "#6366f1", "#ec4899"],
    input: "fft",
  },
};

/** A stroked line tracing the level at each point. */
export const Line: Story = {
  render: (args) => <Harness {...args} />,
  args: { variant: "line", pattern: "sine", color: "#22d3ee", radius: 2.5 },
};

/** A dot per bar, sized by level. */
export const Dots: Story = {
  render: (args) => <Harness {...args} />,
  args: { variant: "dots", pattern: "sine", color: "#a855f7" },
};

/** A filled, mirrored envelope (smooth waveform area) with a glow. */
export const Wave: Story = {
  render: (args) => <Harness {...args} />,
  args: { variant: "wave", pattern: "sine", gradient: ["#34d399", "#06b6d4"], glow: true },
};

/** Spokes radiating from the centre, with a sweep gradient pivoting on the centre. */
export const Radial: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    variant: "radial",
    pattern: "beat",
    boxWidth: 220,
    height: 220,
    count: 64,
    gradient: { colors: ["#f59e0b", "#ef4444", "#a855f7", "#f59e0b"], type: "sweep" },
  },
};

/**
 * The headline story: a BURSTY, irregular data source (jittery delivery +
 * occasional stalls) — yet the on-screen motion stays smooth because the easing
 * transition is paced on the display clock, not the data clock.
 */
export const BurstyTicks: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    variant: "bars",
    pattern: "sine",
    jitter: true,
    smoothing: 0.5,
    gradient: ["#22d3ee", "#6366f1", "#ec4899"],
  },
};

/** Jumpy per-bar noise, tamed by heavy smoothing — the transition does the work. */
export const Smoothed: Story = {
  render: (args) => <Harness {...args} />,
  args: { variant: "bars", pattern: "noise", smoothing: 0.7, color: "#38bdf8" },
};

/** A soft glow behind a sweep-gradient mirror waveform. */
export const Glow: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    variant: "mirror",
    pattern: "beat",
    glow: 12,
    gradient: { colors: ["#f472b6", "#8b5cf6", "#22d3ee"], type: "sweep" },
  },
};

/** A neon look: a crisp shape with a separate, brightly-tinted blurred halo (`glowColor`). */
export const Neon: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    variant: "bars",
    pattern: "sine",
    color: "#0ea5e9",
    glow: 16,
    glowColor: "#22d3ee",
    backgroundColor: "#0b1020",
  },
};

/** VU-meter feel: a snappy attack (peaks pop) with a slow release (a gentle decay tail). */
export const VuMeter: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    variant: "bars",
    pattern: "beat",
    attack: 0.05,
    release: 0.9,
    gradient: ["#84cc16", "#facc15", "#ef4444"],
  },
};

/** A horizontal gradient running left→right across the bars instead of top→bottom. */
export const HorizontalGradient: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    variant: "bars",
    pattern: "sine",
    gradientDirection: "horizontal",
    gradient: ["#f43f5e", "#a855f7", "#22d3ee"],
  },
};

/** A resting baseline (`floor`) so the visualizer always shows a lively bed of bars. */
export const RestingFloor: Story = {
  render: (args) => <Harness {...args} />,
  args: { variant: "mirror", pattern: "sine", floor: 0.18, gradient: ["#22d3ee", "#6366f1"] },
};

/** Boosted sensitivity (`gain`) — quiet input pushed up toward the ceiling and clamped. */
export const Gain: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    variant: "bars",
    pattern: "sine",
    gain: 2.2,
    color: "#f59e0b",
    gradientDirection: "vertical",
  },
};

/** A tinted background with a translucent shape (`backgroundColor` + `opacity`). */
export const Tinted: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    variant: "wave",
    pattern: "sine",
    backgroundColor: "#111827",
    opacity: 0.55,
    gradient: ["#34d399", "#22d3ee"],
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
 * The standard-FFT-input story: a fake FFT is mapped to a `SpectrumFrame` through a
 * PRECOMPUTED `createSpectrumMapper` (log-bands, reused buffers — zero per-frame
 * alloc) and pushed at just **10 Hz** (`setTimeout` every 100ms). The visualizer's
 * time-based easing (`responseTime`) fills in buttery 60 fps motion between frames —
 * so you never need a full per-frame FFT stream. Tweak `responseTime` to feel the
 * trade-off (too low → steppy at 10 Hz; ~90ms → smooth).
 */
function Spectrum10HzDemo(args: HarnessProps): React.ReactElement {
  const ref = React.useRef<AudioVisualizerHandle>(null);
  const bins = 256;
  const count = args.count ?? 56;
  React.useEffect(() => {
    const mapper = createSpectrumMapper({ bins, bands: count, input: "linear" });
    const mags = new Float32Array(bins);
    const frame: number[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let mounted = true;
    const start = now();
    const tick = (): void => {
      if (!mounted) return;
      fakeFft((now() - start) / 1000, bins, mags);
      ref.current?.push(mapper(mags, frame)); // reuse `frame` → no allocation
      timer = setTimeout(tick, 100); // 10 Hz
    };
    tick();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [count]);
  return (
    <Box width={420} maxWidth="100%">
      <AudioVisualizer ref={ref} count={count} {...args} />
    </Box>
  );
}

export const Spectrum10Hz: Story = {
  render: (args) => <Spectrum10HzDemo {...args} />,
  args: {
    variant: "bars",
    count: 56,
    height: 90,
    responseTime: 90,
    gradient: ["#22d3ee", "#6366f1", "#ec4899"],
  },
};

/**
 * "Push more data, keep the essentials." Here the producer pushes the WHOLE raw FFT
 * (512 linear magnitudes) every 100ms with `input="fft"` — no pre-reduction. The
 * visualizer reduces it to its `count` log-bands itself (a memoized mapper derived
 * from its settings), so only `count` values are ever stored or animated regardless
 * of how big the feed is. Change `count` and the same 512-bin feed adapts.
 */
function RawFftInputDemo(args: HarnessProps): React.ReactElement {
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
      <AudioVisualizer ref={ref} {...args} />
    </Box>
  );
}

export const RawFftInput: Story = {
  render: (args) => <RawFftInputDemo {...args} />,
  args: {
    variant: "bars",
    count: 56,
    height: 90,
    input: "fft",
    fftScale: "linear",
    responseTime: 90,
    gradient: ["#f59e0b", "#ef4444", "#a855f7"],
  },
};

/**
 * Driven by a `target` SharedValue instead of the ref handle: write
 * `target.value = levels` from any JS-thread loop and the visualizer eases toward
 * it. While a `target` is set the display loop runs continuously (it can't listen
 * to SV writes portably), so prefer the ref `push()` for the self-suspending path.
 */
export const TargetSharedValue: Story = {
  render: (args) => {
    const target = useSharedValue<number[]>(new Array<number>(48).fill(0));
    React.useEffect(() => {
      let raf = 0;
      let mounted = true;
      const start = now();
      const tick = (): void => {
        if (!mounted) return;
        target.value = sample("sine", 48, (now() - start) / 1000);
        raf = requestAnimationFrame(tick);
      };
      tick();
      return () => {
        mounted = false;
        if (raf) cancelAnimationFrame(raf);
      };
    }, [target]);
    return (
      <Box width={360} maxWidth="100%">
        <AudioVisualizer {...args} count={48} target={target} />
      </Box>
    );
  },
  args: { variant: "mirror", gradient: ["#22d3ee", "#6366f1", "#ec4899"] },
};
