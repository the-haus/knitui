import { splitTimeString } from "../split-time-string/split-time-string";

/** Input for {@link isSameTime}. */
export interface IsSameTimeInput {
  time: string;
  compare: string;
  withSeconds: boolean;
}

/**
 * Whether two `"HH:mm[:ss]"` strings denote the same clock time. Compares the
 * hour/minute parts (and seconds when `withSeconds`) via `splitTimeString`. The
 * pure, `any`-free port of Mantine `TimePicker/utils/is-same-time`, promoted to
 * shared `utils/` so `TimeGrid` (and later `TimePicker`) share one comparator.
 */
export function isSameTime({ time, compare, withSeconds }: IsSameTimeInput): boolean {
  const timeParts = splitTimeString(time);
  const compareParts = splitTimeString(compare);

  if (withSeconds) {
    return (
      timeParts.hours === compareParts.hours &&
      timeParts.minutes === compareParts.minutes &&
      timeParts.seconds === compareParts.seconds
    );
  }

  return timeParts.hours === compareParts.hours && timeParts.minutes === compareParts.minutes;
}
