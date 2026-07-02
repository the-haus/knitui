/**
 * Convert a `"HH:mm[:ss]"` string to a seconds-of-day count for ordering. Any
 * absent component defaults to `0`. Folder-local to `TimeGrid` (the only place
 * these comparators are needed); pure, no `any`.
 */
function timeToSeconds(timeStr: string): number {
  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

/** Whether `value` is strictly earlier than `compareTo`. */
export function isTimeBefore(value: string, compareTo: string): boolean {
  return timeToSeconds(value) < timeToSeconds(compareTo);
}

/** Whether `value` is strictly later than `compareTo`. */
export function isTimeAfter(value: string, compareTo: string): boolean {
  return timeToSeconds(value) > timeToSeconds(compareTo);
}
