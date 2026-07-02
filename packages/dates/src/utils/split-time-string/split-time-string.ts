/** Parsed `HH:mm:ss` components; any missing field is `null`. */
export interface SplitTimeStringResult {
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
}

/**
 * Split a `"HH:mm:ss"`-style string into numeric `hours`/`minutes`/`seconds`,
 * defaulting any absent component to `null`. The shared time-layer primitive
 * ported from Mantine `TimePicker/utils/split-time-string`.
 */
export function splitTimeString(timeString: string): SplitTimeStringResult {
  const [hours = null, minutes = null, seconds = null] = timeString.split(":").map(Number);
  return { hours, minutes, seconds };
}
