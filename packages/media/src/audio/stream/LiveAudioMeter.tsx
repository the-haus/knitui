/**
 * `<LiveAudioMeter>` — a small, self-contained example that captures the live
 * microphone via {@link useAudioStream} and renders a level meter with a
 * Start/Stop control. It is a DEMO/example: kept simple and robust, built only
 * from `@knitui/components` + `@knitui/icons`, and driven by the throttled `level`
 * state (so it works identically on web and native without worklets).
 *
 * Permission is requested on `start()` by the hook (native) / by `getUserMedia`
 * (web); failures are caught and surfaced as an inline message.
 */
import * as React from "react";

import { Box, Button, Group, Progress, Stack, Text } from "@knitui/components";
import { IconMicrophone, IconMicrophoneOff } from "@knitui/icons";

import { useAudioStream } from "../hooks/useAudioStream";
import type { UseAudioStreamOptions } from "../hooks/useAudioStream.shared";

export interface LiveAudioMeterProps {
  /** Stream options forwarded to {@link useAudioStream}. */
  sampleRate?: UseAudioStreamOptions["sampleRate"];
  channels?: UseAudioStreamOptions["channels"];
  encoding?: UseAudioStreamOptions["encoding"];
  /** Whether to display the rms (loudness) or peak amplitude. Default `'rms'`. */
  metric?: "rms" | "peak";
  /** Accessible label for the meter region. */
  label?: string;
  testID?: string;
}

export function LiveAudioMeter({
  sampleRate,
  channels,
  encoding,
  metric = "rms",
  label = "Live microphone meter",
  testID,
}: LiveAudioMeterProps): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null);
  const {
    start,
    stop,
    isStreaming,
    level,
    sampleRate: actualRate,
  } = useAudioStream({
    sampleRate,
    channels,
    encoding,
  });

  const value = Math.round((metric === "peak" ? level.peak : level.rms) * 100);

  const onToggle = React.useCallback(() => {
    if (isStreaming) {
      stop();
      return;
    }
    setError(null);
    void start().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not access the microphone.");
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
      aria-label={label}
      testID={testID}
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

      <Progress value={value} size="lg" aria-label={`${metric} level`} />

      <Group justify="space-between" align="center">
        <Text size="xs" color="$color11" fontVariant={["tabular-nums"]}>
          {metric.toUpperCase()} {value}%
        </Text>
        {actualRate > 0 ? (
          <Text size="xs" color="$color11" fontVariant={["tabular-nums"]}>
            {Math.round(actualRate / 1000)} kHz
          </Text>
        ) : null}
      </Group>

      {error ? (
        <Box>
          <Text size="xs" color="$red11">
            {error}
          </Text>
        </Box>
      ) : null}
    </Stack>
  );
}
