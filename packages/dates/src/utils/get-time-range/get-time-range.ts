import { secondsToTime, timeToSeconds } from "../time-to-seconds/time-to-seconds";

/** Input for {@link getTimeRange}. */
export interface GetTimeRangeInput {
  /** Inclusive start time, `"HH:mm[:ss]"`. */
  startTime: string;
  /** Inclusive end time, `"HH:mm[:ss]"`. */
  endTime: string;
  /** Step between successive entries, `"HH:mm[:ss]"`. */
  interval: string;
}

/**
 * Build an inclusive list of `"HH:mm:ss"` times from `startTime` to `endTime`,
 * stepping by `interval` — e.g. `09:00`→`10:00` every `00:30` →
 * `["09:00:00", "09:30:00", "10:00:00"]`. All math is in total seconds via
 * {@link timeToSeconds}, re-assembled by {@link secondsToTime}. The pure,
 * `any`-free port of Mantine `TimePicker/utils/get-time-range` (the data builder
 * for `TimeGrid`/preset lists). Re-exported from `@knitui/dates` like Mantine.
 */
export function getTimeRange({ startTime, endTime, interval }: GetTimeRangeInput): string[] {
  const timeRange: string[] = [];
  const startInSeconds = timeToSeconds(startTime);
  const endInSeconds = timeToSeconds(endTime);
  const intervalInSeconds = timeToSeconds(interval);

  for (let current = startInSeconds; current <= endInSeconds; current += intervalInSeconds) {
    timeRange.push(secondsToTime(current).timeString);

    // Guard against a zero/negative interval producing an infinite loop.
    if (intervalInSeconds <= 0) {
      break;
    }
  }

  return timeRange;
}
