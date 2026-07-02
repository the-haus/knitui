/**
 * Zero-pad a clock component to two digits (`9` → `"09"`, `13` → `"13"`). The
 * shared time-layer primitive ported from Mantine `TimePicker/utils/pad-time`.
 */
export function padTime(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}
