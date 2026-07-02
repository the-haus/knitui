import {
  createWebAudioSampler,
  frameFromTimeDomain,
  SAMPLER_PROCESSOR_SRC,
  type SamplerFrame,
} from "./web-audio-sampler";

/** Let the `addModule().then(...)` microtask chain settle. */
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("frameFromTimeDomain", () => {
  it("computes peak/rms over the mono window and passes it through", () => {
    const mono = new Float32Array([0.5, -0.5, 0.5, -0.5]);
    const frame = frameFromTimeDomain(mono);
    expect(frame.mono).toBe(mono);
    expect(frame.peak).toBeCloseTo(0.5);
    expect(frame.rms).toBeCloseTo(0.5);
  });
});

describe("createWebAudioSampler — worklet path", () => {
  const instances: FakeWorkletNode[] = [];
  let savedCtor: unknown;

  class FakeWorkletNode {
    port = { onmessage: null as unknown, postMessage: jest.fn(), close: jest.fn() };
    connect = jest.fn();
    disconnect = jest.fn();
    constructor(
      public context: unknown,
      public name: string,
      public options: unknown,
    ) {
      instances.push(this);
    }
  }

  beforeEach(() => {
    instances.length = 0;
    savedCtor = (globalThis as { AudioWorkletNode?: unknown }).AudioWorkletNode;
    (globalThis as { AudioWorkletNode?: unknown }).AudioWorkletNode = FakeWorkletNode;
  });
  afterEach(() => {
    (globalThis as { AudioWorkletNode?: unknown }).AudioWorkletNode = savedCtor;
  });

  function fakeContext(): { context: AudioContext; addModule: jest.Mock; destination: object } {
    const destination = {};
    const addModule = jest.fn().mockResolvedValue(undefined);
    const context = {
      audioWorklet: { addModule },
      destination,
      resume: jest.fn(),
      createAnalyser: jest.fn(),
    } as unknown as AudioContext;
    return { context, addModule, destination };
  }

  it("loads the processor, wires the node, and emits frames from port messages", async () => {
    const { context, addModule, destination } = fakeContext();
    const source = { connect: jest.fn(), disconnect: jest.fn() } as unknown as AudioNode;
    const frames: SamplerFrame[] = [];

    const sampler = createWebAudioSampler(context, source, (f) => frames.push(f), {
      audible: true,
    });

    // `audible` wires the direct audio path synchronously.
    expect(source.connect).toHaveBeenCalledWith(destination);

    await flushMicrotasks();
    expect(addModule).toHaveBeenCalledTimes(1);
    const node = instances[0];
    expect(node).toBeDefined();
    expect(source.connect).toHaveBeenCalledWith(node);
    expect(node.connect).toHaveBeenCalledWith(destination);

    // A posted PCM window becomes a frame.
    (node.port.onmessage as (e: { data: unknown }) => void)({
      data: { time: new Float32Array([1, -1, 1, -1]) },
    });
    expect(frames).toHaveLength(1);
    expect(frames[0].peak).toBeCloseTo(1);

    sampler.dispose();
    expect(node.disconnect).toHaveBeenCalled();
    expect(node.port.onmessage).toBeNull();
  });

  it("does not wire the node if disposed before the module resolves", async () => {
    const { context } = fakeContext();
    const source = { connect: jest.fn(), disconnect: jest.fn() } as unknown as AudioNode;
    const sampler = createWebAudioSampler(context, source, () => {});
    sampler.dispose();
    await flushMicrotasks();
    expect(instances).toHaveLength(0);
  });
});

describe("createWebAudioSampler — analyser fallback", () => {
  let rafCbs: Array<() => void>;
  let savedRaf: unknown;
  let savedCaf: unknown;

  beforeEach(() => {
    rafCbs = [];
    savedRaf = globalThis.requestAnimationFrame;
    savedCaf = globalThis.cancelAnimationFrame;
    (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame = (
      cb: () => void,
    ) => {
      rafCbs.push(cb);
      return rafCbs.length;
    };
    (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame = () => {};
  });
  afterEach(() => {
    (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame = savedRaf;
    (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame = savedCaf;
  });

  it("falls back to an AnalyserNode + rAF loop when no audioWorklet is present", () => {
    const analyser = {
      fftSize: 0,
      smoothingTimeConstant: 1,
      minDecibels: 0,
      maxDecibels: 0,
      connect: jest.fn(),
      disconnect: jest.fn(),
      getFloatTimeDomainData: (a: Float32Array) => a.fill(0.5),
    };
    const context = {
      // No `audioWorklet` → fallback.
      destination: {},
      resume: jest.fn(),
      createAnalyser: () => analyser,
    } as unknown as AudioContext;
    const source = { connect: jest.fn(), disconnect: jest.fn() } as unknown as AudioNode;
    const frames: SamplerFrame[] = [];

    const sampler = createWebAudioSampler(context, source, (f) => frames.push(f), {
      fftSize: 1024,
    });

    expect(source.connect).toHaveBeenCalledWith(analyser);
    expect(analyser.fftSize).toBe(1024);
    expect(analyser.smoothingTimeConstant).toBe(0);
    expect(rafCbs).toHaveLength(1);

    // Pump one frame.
    rafCbs[rafCbs.length - 1]();
    expect(frames).toHaveLength(1);
    expect(frames[0].peak).toBeCloseTo(0.5);

    // After dispose the loop stops producing frames.
    sampler.dispose();
    const before = frames.length;
    rafCbs[rafCbs.length - 1]();
    expect(frames).toHaveLength(before);
  });
});

/**
 * Run the real worklet processor source in a simulated `AudioWorkletGlobalScope`
 * (no browser). This validates the on-thread capture math — channel mixing,
 * ring-buffer windowing (oldest → newest), and the throttle — which is the part
 * that only runs on web. The FFT/bin reduction it feeds is covered by fft.test.
 */
describe("SAMPLER_PROCESSOR_SRC (worklet capture math)", () => {
  interface Posted {
    time: Float32Array;
  }
  interface LoadedProcessor {
    process: (inputs: Float32Array[][]) => boolean;
  }

  function loadProcessor(opts: { sampleRate: number; fftSize: number; fps: number }): {
    proc: LoadedProcessor;
    posts: Posted[];
    restore: () => void;
  } {
    const g = globalThis as Record<string, unknown>;
    const saved = {
      AudioWorkletProcessor: g.AudioWorkletProcessor,
      registerProcessor: g.registerProcessor,
      sampleRate: g.sampleRate,
    };
    const posts: Posted[] = [];
    g.AudioWorkletProcessor = class {
      port = { postMessage: (msg: Posted): void => void posts.push(msg) };
    };
    let Registered: new (o: unknown) => LoadedProcessor = null as never;
    g.registerProcessor = (_name: string, cls: new (o: unknown) => LoadedProcessor): void => {
      Registered = cls;
    };
    g.sampleRate = opts.sampleRate;
    // Indirect eval runs the self-contained source in global scope (the realm a
    // real AudioWorklet provides). Not user input — it's our own module constant.

    (0, eval)(SAMPLER_PROCESSOR_SRC);
    const proc = new Registered({ processorOptions: { fftSize: opts.fftSize, fps: opts.fps } });
    return {
      proc,
      posts,
      restore: () => {
        g.AudioWorkletProcessor = saved.AudioWorkletProcessor;
        g.registerProcessor = saved.registerProcessor;
        g.sampleRate = saved.sampleRate;
      },
    };
  }

  it("posts the latest mono window once a full frame has accumulated", () => {
    // postInterval = floor(48000 / 6000) = 8 === fftSize, so one full block posts.
    const { proc, posts, restore } = loadProcessor({ sampleRate: 48000, fftSize: 8, fps: 6000 });
    try {
      proc.process([[new Float32Array([1, 2, 3, 4, 5, 6, 7, 8])]]);
      expect(posts).toHaveLength(1);
      expect(Array.from(posts[0].time)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    } finally {
      restore();
    }
  });

  it("mixes multiple channels down to mono (average)", () => {
    const { proc, posts, restore } = loadProcessor({ sampleRate: 48000, fftSize: 4, fps: 12000 });
    try {
      proc.process([[new Float32Array([1, 1, 1, 1]), new Float32Array([3, 3, 3, 3])]]);
      expect(Array.from(posts[0].time)).toEqual([2, 2, 2, 2]);
    } finally {
      restore();
    }
  });

  it("emits the newest fftSize samples in time order across the ring wrap", () => {
    // postInterval = floor(48000 / 12000) = 4 === fftSize.
    const { proc, posts, restore } = loadProcessor({ sampleRate: 48000, fftSize: 4, fps: 12000 });
    try {
      proc.process([[new Float32Array([1, 2, 3, 4])]]);
      proc.process([[new Float32Array([5, 6, 7, 8])]]);
      expect(Array.from(posts[0].time)).toEqual([1, 2, 3, 4]);
      // The ring wrapped; the window is still oldest → newest.
      expect(Array.from(posts[1].time)).toEqual([5, 6, 7, 8]);
    } finally {
      restore();
    }
  });

  it("throttles: no post until postInterval samples have elapsed", () => {
    // postInterval = floor(48000 / 8000) = 6 > fftSize 4.
    const { proc, posts, restore } = loadProcessor({ sampleRate: 48000, fftSize: 4, fps: 8000 });
    try {
      proc.process([[new Float32Array([1, 2, 3, 4])]]); // filled=4, since=4 < 6 → no post
      expect(posts).toHaveLength(0);
      proc.process([[new Float32Array([5, 6])]]); // since=6 ≥ 6 → post latest 4
      expect(posts).toHaveLength(1);
      expect(Array.from(posts[0].time)).toEqual([3, 4, 5, 6]);
    } finally {
      restore();
    }
  });
});

/**
 * End-to-end web capture: drive the REAL worklet source with a known 440 Hz sine
 * and assert the captured time-domain window matches the tone's envelope, proving
 * the worklet ring buffer captures the newest samples correctly on web.
 */
describe("worklet capture (end-to-end time domain)", () => {
  it("captures a full-scale 440 Hz tone window", () => {
    const sampleRate = 48000;
    const fftSize = 2048;
    const g = globalThis as Record<string, unknown>;
    const saved = {
      AudioWorkletProcessor: g.AudioWorkletProcessor,
      registerProcessor: g.registerProcessor,
      sampleRate: g.sampleRate,
    };
    const posts: Array<{ time: Float32Array }> = [];
    g.AudioWorkletProcessor = class {
      port = { postMessage: (m: { time: Float32Array }): number => posts.push(m) };
    };
    let Registered: new (o: unknown) => { process: (i: Float32Array[][]) => boolean } =
      null as never;
    g.registerProcessor = (_n: string, c: typeof Registered): void => {
      Registered = c;
    };
    g.sampleRate = sampleRate;

    (0, eval)(SAMPLER_PROCESSOR_SRC);
    const proc = new Registered({ processorOptions: { fftSize, fps: 60 } });

    try {
      // Feed exactly fftSize samples of a 440 Hz sine, in 128-sample render quanta.
      const freq = 440;
      let n = 0;
      for (let block = 0; block < fftSize / 128; block++) {
        const buf = new Float32Array(128);
        for (let i = 0; i < 128; i++, n++) buf[i] = Math.sin((2 * Math.PI * freq * n) / sampleRate);
        proc.process([[buf]]);
      }
      expect(posts.length).toBeGreaterThan(0);

      // The captured window → the same frame the controller emits.
      const frame = frameFromTimeDomain(posts[posts.length - 1].time);
      expect(frame.peak).toBeCloseTo(1, 1);
    } finally {
      g.AudioWorkletProcessor = saved.AudioWorkletProcessor;
      g.registerProcessor = saved.registerProcessor;
      g.sampleRate = saved.sampleRate;
    }
  });
});
