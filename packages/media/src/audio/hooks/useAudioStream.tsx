/**
 * Web implementation of the live microphone PCM stream hook. Captures the mic
 * via `navigator.mediaDevices.getUserMedia({ audio: true })` and the shared
 * off-main-thread {@link createWebAudioSampler} (an `AudioWorklet`, falling back
 * to an `AnalyserNode`) tapped off a `MediaStreamAudioSourceNode`. Each emitted
 * frame is decoded to `[-1, 1]` floats, the level is computed, and
 * `onBuffer`/`onLevel` are forwarded. React state (`level`) is flushed at ~30 fps
 * — NEVER once per frame — so a meter re-renders smoothly without thrashing.
 *
 * This backend is MONO-ONLY: `options.channels` is ignored and the reported
 * `channels` is always `1` (see {@link WEB_DELIVERED_CHANNELS}).
 *
 * This file is the web target (`.tsx`); it NEVER imports `expo-audio`. It relies
 * on the jsdom Web Audio / getUserMedia stubs (see jest.setup.ts) so it
 * constructs under test.
 */
import * as React from "react";

import { createWebAudioSampler, type WebAudioSampler } from "../controller/web-audio-sampler";
import {
  type AudioStreamBufferData,
  type AudioStreamLevel,
  LEVEL_THROTTLE_MS,
  type UseAudioStreamOptions,
  type UseAudioStreamResult,
  ZERO_LEVEL,
} from "./useAudioStream.shared";

type AudioCtor = new (options?: { sampleRate?: number }) => AudioContext;

/** Resolve the (possibly prefixed) AudioContext constructor, or `null`. */
function getAudioContextCtor(): AudioCtor | null {
  const w = globalThis as unknown as {
    AudioContext?: AudioCtor;
    webkitAudioContext?: AudioCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

interface WebGraph {
  stream: MediaStream;
  ctx: AudioContext;
  source: MediaStreamAudioSourceNode;
  sampler: WebAudioSampler;
}

/**
 * How many channels this backend actually delivers — ALWAYS one.
 *
 * `getUserMedia({ audio: true })` is requested with no `channelCount`
 * constraint, and {@link createWebAudioSampler} down-mixes whatever the device
 * hands back to a single mono track before we ever see it. So `options.channels`
 * cannot be honored here: it is accepted for cross-platform call-site parity and
 * deliberately IGNORED. Reporting the requested count instead of this would be a
 * silent lie — a caller de-interleaving stereo per the documented contract would
 * split one mono buffer into two decimated copies of the same signal.
 */
const WEB_DELIVERED_CHANNELS = 1;

export function useAudioStream(options: UseAudioStreamOptions = {}): UseAudioStreamResult {
  // NOTE: `options.channels` is intentionally not read — see WEB_DELIVERED_CHANNELS.
  const { sampleRate, autoStart, onBuffer, onLevel } = options;

  // Keep the latest callbacks in a ref so the rAF loop doesn't need to restart
  // when a caller passes new inline functions.
  const onBufferRef = React.useRef(onBuffer);
  const onLevelRef = React.useRef(onLevel);
  onBufferRef.current = onBuffer;
  onLevelRef.current = onLevel;

  const graphRef = React.useRef<WebGraph | null>(null);
  const lastFlushRef = React.useRef(0);
  /**
   * Bumped by every `start()` and by `stop()`/unmount. `start()` builds the mic
   * graph across two awaits, and `graphRef` is only populated at the very end —
   * so a `stop()` or unmount landing inside that window has nothing to tear down
   * and would otherwise strand a live `MediaStream` (mic indicator stays lit) and
   * an `AudioContext` (browsers cap these at ~6 per tab). Each await re-checks
   * the token and discards what it built if it has been superseded.
   */
  const startTokenRef = React.useRef(0);

  const [isStreaming, setIsStreaming] = React.useState(false);
  const [actualRate, setActualRate] = React.useState(0);
  const [actualChannels, setActualChannels] = React.useState(0);
  const [level, setLevel] = React.useState<AudioStreamLevel>(ZERO_LEVEL);

  const stop = React.useCallback(() => {
    // Invalidate any `start()` still in flight so its continuation discards the
    // graph it is midway through building instead of stranding it.
    startTokenRef.current += 1;
    const graph = graphRef.current;
    graphRef.current = null;
    if (graph) {
      graph.sampler.dispose();
      try {
        graph.source.disconnect();
      } catch {
        /* node may already be detached */
      }
      for (const track of graph.stream.getTracks()) track.stop();
      void graph.ctx.close().catch(() => {});
    }
    setIsStreaming(false);
    setLevel(ZERO_LEVEL);
  }, []);

  const start = React.useCallback(async () => {
    if (graphRef.current) return;

    const Ctor = getAudioContextCtor();
    const media = (globalThis as unknown as { navigator?: Navigator }).navigator?.mediaDevices;
    if (!Ctor || !media?.getUserMedia) {
      throw new Error("Web Audio capture is not available in this environment.");
    }

    const token = ++startTokenRef.current;
    /** True once a `stop()`/unmount/newer `start()` has superseded this run. */
    const superseded = () => startTokenRef.current !== token;

    const stream = await media.getUserMedia({ audio: true });
    if (superseded()) {
      for (const track of stream.getTracks()) track.stop();
      return;
    }

    let ctx: AudioContext;
    let source: MediaStreamAudioSourceNode;
    try {
      ctx = sampleRate ? new Ctor({ sampleRate }) : new Ctor();
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});
      source = ctx.createMediaStreamSource(stream);
    } catch (err) {
      // The mic is already live at this point but no graph exists to own it, so
      // nothing else can ever release it — Chrome throws here once a tab is past
      // its concurrent-AudioContext cap. Drop the mic before propagating, or the
      // tab's recording indicator stays lit until a reload.
      for (const track of stream.getTracks()) track.stop();
      throw err;
    }

    if (superseded()) {
      for (const track of stream.getTracks()) track.stop();
      void ctx.close().catch(() => {});
      return;
    }

    const startTime = ctx.currentTime;

    // `audible: false` — never route the mic to the speakers (feedback). Each
    // frame's `mono` is a fresh buffer, safe to hand to `onBuffer`.
    const sampler = createWebAudioSampler(
      ctx,
      source,
      (frame) => {
        if (graphRef.current?.sampler !== sampler) return;
        const nextLevel: AudioStreamLevel = { peak: frame.peak, rms: frame.rms };

        onLevelRef.current?.(nextLevel);
        if (onBufferRef.current) {
          const data: AudioStreamBufferData = {
            data: frame.mono.buffer as ArrayBuffer,
            sampleRate: ctx.sampleRate || sampleRate || 0,
            // The sampler already mixed to mono — report what is in the buffer.
            channels: WEB_DELIVERED_CHANNELS,
            timestamp: Math.max(0, ctx.currentTime - startTime),
            frames: Array.from(frame.mono),
          };
          onBufferRef.current(data);
        }

        // Throttle React state updates to ~30 fps so the meter re-renders smoothly
        // without a setState on every frame.
        const now = ctx.currentTime * 1000;
        if (now - lastFlushRef.current >= LEVEL_THROTTLE_MS) {
          lastFlushRef.current = now;
          setLevel(nextLevel);
        }
      },
      { audible: false },
    );

    const graph: WebGraph = { stream, ctx, source, sampler };
    graphRef.current = graph;

    setActualRate(ctx.sampleRate || sampleRate || 0);
    setActualChannels(WEB_DELIVERED_CHANNELS);
    setIsStreaming(true);
    lastFlushRef.current = 0;
  }, [sampleRate]);

  // Auto-start once on mount when requested; always tear the graph down.
  React.useEffect(() => {
    if (autoStart) void start().catch(() => {});
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    start,
    stop,
    isStreaming,
    sampleRate: actualRate,
    channels: actualChannels,
    level,
  };
}
