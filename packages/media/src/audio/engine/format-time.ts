/**
 * Clock-string formatting for audio players. The seconds-based {@link formatTime}
 * lives in `@knitui/media`'s shared internals (shared with `@knitui/media/video`); it is
 * re-exported here so existing `../engine` imports keep working, alongside the
 * audio-only {@link formatMillis} wrapper (recorder durations are reported in ms).
 */
import { formatTime } from "../../shared";

export { formatTime };

/**
 * Formats a millisecond duration as a clock string. Thin wrapper over
 * {@link formatTime}.
 */
export function formatMillis(millis: number): string {
  if (!Number.isFinite(millis) || millis < 0) return "0:00";
  return formatTime(millis / 1000);
}
