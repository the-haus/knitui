import { requestRecordingPermissionsAsync, useAudioStream as useExpoAudioStream } from "expo-audio";
import type { AudioStreamBuffer } from "expo-audio";
/**
 * Native implementation of the live microphone PCM stream hook. Wraps
 * `expo-audio`'s `useAudioStream`, decodes each captured PCM buffer with the
 * shared {@link decodePcm}, computes the level via the engine, and forwards
 * `onBuffer`/`onLevel`.
 *
 * PERFORMANCE: the per-buffer level is written into a reanimated
 * `SharedValue<number>` (`levelShared`, carrying the rms) so consumers can
 * animate a meter on the UI thread via worklets WITHOUT a React re-render per
 * buffer. A throttled React `level` state is also published (~30 fps) for parity
 * with the web hook and for non-worklet consumers.
 *
 * This file imports `expo-audio` AND `react-native-reanimated`; because it is a
 * `.native.tsx`, the web jest target / bundler never resolves it.
 */
import * as React from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

import { mixChannels } from "../engine";
import { decodePcm } from "../stream/decode";
import {
  type AudioStreamBufferData,
  type AudioStreamLevel,
  LEVEL_THROTTLE_MS,
  type UseAudioStreamOptions,
  type UseAudioStreamResult,
  ZERO_LEVEL,
} from "./useAudioStream.shared";

/** Native result: the shared contract plus the UI-thread level `SharedValue`. */
export interface UseAudioStreamNativeResult extends UseAudioStreamResult {
  /**
   * Native-only: the rms level (`0..1`) as a reanimated `SharedValue`, updated on
   * every captured buffer off the JS render path. Drive a worklet
   * `useAnimatedStyle` from it for a jank-free meter. Absent on web.
   */
  levelShared: SharedValue<number>;
}

export function useAudioStream(options: UseAudioStreamOptions = {}): UseAudioStreamNativeResult {
  const { sampleRate, channels = 1, encoding = "float32", autoStart, onBuffer, onLevel } = options;

  const onBufferRef = React.useRef(onBuffer);
  const onLevelRef = React.useRef(onLevel);
  onBufferRef.current = onBuffer;
  onLevelRef.current = onLevel;

  const levelShared = useSharedValue(0);
  const lastFlushRef = React.useRef(0);

  const [level, setLevel] = React.useState<AudioStreamLevel>(ZERO_LEVEL);

  const handleBuffer = React.useCallback(
    (buffer: AudioStreamBuffer) => {
      const frames = decodePcm(buffer.data, encoding);
      const { peak, rms } = mixChannels([frames]);
      const nextLevel: AudioStreamLevel = { peak, rms };

      // UI-thread value first — cheapest, no re-render.
      levelShared.value = rms;

      onLevelRef.current?.(nextLevel);
      if (onBufferRef.current) {
        const data: AudioStreamBufferData = {
          data: buffer.data,
          sampleRate: buffer.sampleRate,
          channels: buffer.channels,
          timestamp: buffer.timestamp,
          frames,
        };
        onBufferRef.current(data);
      }

      // Throttle the React state flush to ~30 fps (parity with web).
      const now = buffer.timestamp * 1000;
      if (now - lastFlushRef.current >= LEVEL_THROTTLE_MS) {
        lastFlushRef.current = now;
        setLevel(nextLevel);
      }
    },
    [encoding, levelShared],
  );

  const { stream, isStreaming } = useExpoAudioStream({
    sampleRate,
    channels,
    encoding,
    onBuffer: handleBuffer,
  });

  const start = React.useCallback(async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) throw new Error("Microphone permission was not granted.");
    await stream.start();
  }, [stream]);

  const stop = React.useCallback(() => {
    stream.stop();
    levelShared.value = 0;
    setLevel(ZERO_LEVEL);
    lastFlushRef.current = 0;
  }, [stream, levelShared]);

  // Auto-start once on mount when requested; always stop on unmount.
  React.useEffect(() => {
    if (autoStart) void start().catch(() => {});
    return () => {
      try {
        stream.stop();
      } catch {
        /* stream may already be stopped/disposed */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    start,
    stop,
    isStreaming,
    sampleRate: stream.sampleRate ?? sampleRate ?? 0,
    channels: stream.channels ?? channels,
    level,
    levelShared,
  };
}
