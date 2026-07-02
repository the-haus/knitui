import {
  secondsToTime,
  type SecondsToTimeResult,
  timeToSeconds,
} from "../time-to-seconds/time-to-seconds";

/**
 * Clamp a `"HH:mm[:ss]"` string into `[min, max]` (each optional). Comparison is
 * done in total seconds via {@link timeToSeconds}; an absent bound is treated as
 * `-Infinity`/`+Infinity` so a one-sided range still clamps. Returns the clamped
 * value as a {@link SecondsToTimeResult} (canonical string + numeric parts). The
 * pure, `any`-free port of Mantine `TimePicker/utils/clamp-time`; the numeric
 * clamp is inlined (no `@mantine/hooks`).
 */
export function clampTime(
  time: string,
  min: string | undefined,
  max: string | undefined,
): SecondsToTimeResult {
  const timeInSeconds = timeToSeconds(time);
  const minInSeconds = min ? timeToSeconds(min) : -Infinity;
  const maxInSeconds = max ? timeToSeconds(max) : Infinity;

  const clampedSeconds = Math.max(minInSeconds, Math.min(timeInSeconds, maxInSeconds));
  return secondsToTime(clampedSeconds);
}
