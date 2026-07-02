import type { TimePickerAmPmLabels, TimePickerFormat } from "../../types";
import { padTime } from "../pad-time/pad-time";
import { splitTimeString } from "../split-time-string/split-time-string";

/**
 * Read a JS `Date`'s wall-clock time into a `"H:m[:s]"` string. Uses the
 * platform-agnostic `Date` getters (no DOM), so it runs on web and native.
 */
function getTimeFromDate(date: Date, withSeconds: boolean): string {
  return `${date.getHours()}:${date.getMinutes()}${withSeconds ? `:${date.getSeconds()}` : ""}`;
}

/** Input for {@link getFormattedTime}. */
export interface GetFormattedTimeInput {
  value: string | Date;
  format: TimePickerFormat;
  amPmLabels: TimePickerAmPmLabels;
  withSeconds: boolean;
}

/**
 * Format a time value (a `"HH:mm:ss"` string or a `Date`) for display, honouring
 * the `12h`/`24h` mode and optional seconds. Returns `null` when hours/minutes
 * cannot be resolved. The `any`-free port of Mantine `TimeValue/get-formatted-time`,
 * promoted to shared `utils/` so the whole time layer shares one formatter.
 */
export function getFormattedTime({
  value,
  format,
  amPmLabels,
  withSeconds,
}: GetFormattedTimeInput): string | null {
  const splitted = splitTimeString(
    typeof value === "string" ? value : getTimeFromDate(value, withSeconds),
  );

  if (splitted.hours === null || splitted.minutes === null) {
    return null;
  }

  const secondsSuffix = withSeconds ? `:${padTime(splitted.seconds ?? 0)}` : "";

  if (format === "24h") {
    return `${padTime(splitted.hours)}:${padTime(splitted.minutes)}${secondsSuffix}`;
  }

  const isPm = splitted.hours >= 12;
  const hours = splitted.hours % 12 === 0 ? 12 : splitted.hours % 12;

  return `${hours}:${padTime(splitted.minutes)}${secondsSuffix} ${isPm ? amPmLabels.pm : amPmLabels.am}`;
}
