import type { TimePickerAmPmLabels, TimePickerFormat } from "../../types";
import { padTime } from "../pad-time/pad-time";

/** Input for the internal 12h→24h converter. */
interface Time12HourFormat {
  hours: number;
  minutes: number;
  seconds: number | null;
  withSeconds: boolean;
  amPm: string;
  amPmLabels: TimePickerAmPmLabels;
}

/** The result of {@link getTimeString}: whether the segments form a valid time, and the canonical 24h string. */
export interface GetTimeStringResult {
  valid: boolean;
  value: string;
}

function convertTo24HourFormat({
  hours,
  minutes,
  seconds,
  amPm,
  amPmLabels,
  withSeconds,
}: Time12HourFormat): string {
  let _hours = hours;

  if (amPm === amPmLabels.pm && hours !== 12) {
    _hours += 12;
  } else if (amPm === amPmLabels.am && hours === 12) {
    _hours = 0;
  }

  return `${padTime(_hours)}:${padTime(minutes)}${withSeconds ? `:${padTime(seconds ?? 0)}` : ""}`;
}

/** Input for {@link getTimeString}. */
export interface GetTimeStringInput {
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
  format: TimePickerFormat;
  withSeconds: boolean;
  amPm: string | null;
  amPmLabels: TimePickerAmPmLabels;
}

/**
 * Assemble `{ hours, minutes, seconds, amPm }` segments + `format`/`amPmLabels`
 * into a canonical 24h `"HH:mm[:ss]"` string, reporting validity. Invalid (→
 * `{ valid: false, value: "" }`) when hours/minutes are missing, when
 * `withSeconds` but seconds are missing, or when `12h` but `amPm` is unset. The
 * pure, `any`-free port of Mantine `TimePicker/utils/get-time-string`. Reuses
 * `padTime`.
 */
export function getTimeString({
  hours,
  minutes,
  seconds,
  format,
  withSeconds,
  amPm,
  amPmLabels,
}: GetTimeStringInput): GetTimeStringResult {
  if (hours === null || minutes === null) {
    return { valid: false, value: "" };
  }

  if (withSeconds && seconds === null) {
    return { valid: false, value: "" };
  }

  if (format === "24h") {
    const value = `${padTime(hours)}:${padTime(minutes)}${withSeconds ? `:${padTime(seconds ?? 0)}` : ""}`;
    return { valid: true, value };
  }

  if (amPm === null) {
    return { valid: false, value: "" };
  }

  return {
    valid: true,
    value: convertTo24HourFormat({ hours, minutes, seconds, amPm, amPmLabels, withSeconds }),
  };
}
