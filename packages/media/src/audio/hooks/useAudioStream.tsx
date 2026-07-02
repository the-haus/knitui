/**
 * Web implementation of the live microphone PCM stream hook. Captures the mic
 * via `navigator.mediaDevices.getUserMedia({ audio: true })` and the shared
 * off-main-thread {@link createWebAudioSampler} (an `AudioWorklet`, falling back
 * to an `AnalyserNode`) tapped off a `MediaStreamAudioSourceNode`. Each emitted
 * frame is decoded to `[-1, 1]` floats, the level is computed, and
 * `onBuffer`/`onLevel` are forwarded. React state (`level`) is flushed at ~30 fps
 * — NEVER once per frame — so a meter re-renders smoothly without thrashing.
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

export function useAudioStream(options: UseAudioStreamOptions = {}): UseAudioStreamResult {
  const { sampleRate, channels = 1, autoStart, onBuffer, onLevel } = options;

  // Keep the latest callbacks in a ref so the rAF loop doesn't need to restart
  // when a caller passes new inline functions.
  const onBufferRef = React.useRef(onBuffer);
  const onLevelRef = React.useRef(onLevel);
  onBufferRef.current = onBuffer;
  onLevelRef.current = onLevel;

  const graphRef = React.useRef<WebGraph | null>(null);
  const lastFlushRef = React.useRef(0);

  const [isStreaming, setIsStreaming] = React.useState(false);
  const [actualRate, setActualRate] = React.useState(0);
  const [actualChannels, setActualChannels] = React.useState(0);
  const [level, setLevel] = React.useState<AudioStreamLevel>(ZERO_LEVEL);

  const stop = React.useCallback(() => {
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

    const stream = await media.getUserMedia({ audio: true });
    const ctx = sampleRate ? new Ctor({ sampleRate }) : new Ctor();
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});

    const source = ctx.createMediaStreamSource(stream);
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
            channels,
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
    setActualChannels(channels);
    setIsStreaming(true);
    lastFlushRef.current = 0;
  }, [sampleRate, channels]);

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
