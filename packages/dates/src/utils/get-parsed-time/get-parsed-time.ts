import type {
  TimePickerAmPmLabels,
  TimePickerFormat,
  TimePickerPasteSplitReturnType,
} from "../../types";
import { splitTimeString } from "../split-time-string/split-time-string";

/** Input for {@link getParsedTime}. */
export interface GetParsedTimeInput {
  time: string;
  format: TimePickerFormat;
  amPmLabels: TimePickerAmPmLabels;
}

/** Input for {@link convertTimeTo12HourFormat}. */
export interface ConvertTimeTo12HourFormatInput {
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
  amPmLabels: TimePickerAmPmLabels;
}

/**
 * Re-express 24h numeric components as a 12h `{ hours, minutes, seconds, amPm }`
 * tuple (e.g. `13` → `1` + `pm`, `0` → `12` + `am`). Returns all-`null` when
 * `hours` is `null`. Ported from Mantine `TimePicker/utils/get-parsed-time`.
 */
export function convertTimeTo12HourFormat({
  hours,
  minutes,
  seconds,
  amPmLabels,
}: ConvertTimeTo12HourFormatInput): TimePickerPasteSplitReturnType {
  if (hours === null) {
    return { hours: null, minutes: null, seconds: null, amPm: null };
  }

  const amPm = hours >= 12 ? amPmLabels.pm : amPmLabels.am;
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return {
    hours: hour12,
    minutes: typeof minutes === "number" ? minutes : null,
    seconds: typeof seconds === "number" ? seconds : null,
    amPm,
  };
}

/**
 * Parse a free `"HH:mm[:ss]"` string into `{ hours, minutes, seconds, amPm }`,
 * mapping into 12h segments when `format === "12h"`. This is also the default
 * `pasteSplit` parser for `TimePicker`. The pure, `any`-free port of Mantine
 * `TimePicker/utils/get-parsed-time` — typed against the shared
 * `TimePickerPasteSplitReturnType`.
 */
export function getParsedTime({
  time,
  format,
  amPmLabels,
}: GetParsedTimeInput): TimePickerPasteSplitReturnType {
  if (time === "") {
    return { hours: null, minutes: null, seconds: null, amPm: null };
  }

  const { hours, minutes, seconds } = splitTimeString(time);

  if (format === "12h") {
    return convertTimeTo12HourFormat({ hours, minutes, seconds, amPmLabels });
  }

  return { hours, minutes, seconds, amPm: null };
}
