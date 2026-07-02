import { padTime } from "../pad-time/pad-time";

/** Parsed clock components produced by {@link secondsToTime}. */
export interface SecondsToTimeResult {
  /** Canonical `"HH:mm:ss"` string for the elapsed seconds. */
  timeString: string;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Total seconds represented by a `"HH:mm[:ss]"` string (`"01:30"` → `5400`).
 * Any absent component counts as `0`. The shared time-layer primitive ported
 * from Mantine `TimePicker/utils/time-to-seconds` — the basis for `clamp-time`
 * and `get-time-range` numeric ordering.
 */
export function timeToSeconds(timeStr: string): number {
  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Inverse of {@link timeToSeconds}: a seconds total back into a zero-padded
 * `"HH:mm:ss"` string plus its numeric `hours`/`minutes`/`seconds`. Used by
 * `clamp-time`/`get-time-range` to re-assemble a canonical string after numeric
 * math.
 */
export function secondsToTime(seconds: number): SecondsToTimeResult {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return {
    timeString: `${padTime(hours)}:${padTime(minutes)}:${padTime(secs)}`,
    hours,
    minutes,
    seconds: secs,
  };
}
