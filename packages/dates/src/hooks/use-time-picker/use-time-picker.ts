import * as React from "react";

import { type TamaguiElement } from "@knitui/core";
import { useDidUpdate } from "@knitui/hooks";

import { focusElement } from "../../internal/focus-element";
import type {
  TimePickerAmPmLabels,
  TimePickerFormat,
  TimePickerPasteSplit,
  TimePickerType,
} from "../../types";
import { clampTime } from "../../utils/clamp-time/clamp-time";
import { getParsedTime } from "../../utils/get-parsed-time/get-parsed-time";
import { getTimeString } from "../../utils/get-time-string/get-time-string";

/** The four editable segments of a time value. */
export type TimeField = "hours" | "minutes" | "seconds" | "amPm";

/** Numeric/label segment values held by the controller. */
export interface TimePickerValues {
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
  amPm: string | null;
}

/** Host-node refs for each segment, used for cross-platform focus advance. */
export interface TimePickerRefs {
  hours: React.RefObject<TamaguiElement | null>;
  minutes: React.RefObject<TamaguiElement | null>;
  seconds: React.RefObject<TamaguiElement | null>;
  amPm: React.RefObject<TamaguiElement | null>;
}

/** Input for {@link useTimePicker}. */
export interface UseTimePickerInput {
  value: string | undefined;
  defaultValue: string | undefined;
  onChange: ((value: string) => void) | undefined;
  format: TimePickerFormat;
  amPmLabels: TimePickerAmPmLabels;
  withSeconds: boolean | undefined;
  min: string | undefined;
  max: string | undefined;
  readOnly: boolean | undefined;
  disabled: boolean | undefined;
  clearable: boolean | undefined;
  pasteSplit: TimePickerPasteSplit | undefined;
  type: TimePickerType;
}

/** Return value of {@link useTimePicker}. */
export interface UseTimePickerReturn {
  refs: TimePickerRefs;
  values: TimePickerValues;
  setHours: (value: number | null) => void;
  setMinutes: (value: number | null) => void;
  setSeconds: (value: number | null) => void;
  setAmPm: (value: string | null) => void;
  focus: (field: TimeField) => void;
  clear: () => void;
  onPaste: (event: unknown) => void;
  setTimeString: (timeString: string) => void;
  isClearable: boolean;
  hiddenInputValue: string;
}

/** A minimal, web-only clipboard-event shape — enough to read pasted text. */
interface ClipboardEventLike {
  preventDefault: () => void;
  clipboardData: { getData: (type: string) => string };
}

/** Runtime narrowing: is `event` a web clipboard event we can read text from? */
function isClipboardEventLike(event: unknown): event is ClipboardEventLike {
  if (typeof event !== "object" || event === null || !("clipboardData" in event)) {
    return false;
  }
  const { clipboardData } = event as { clipboardData: unknown };
  return (
    typeof clipboardData === "object" &&
    clipboardData !== null &&
    "getData" in clipboardData &&
    typeof (clipboardData as { getData: unknown }).getData === "function"
  );
}

/**
 * `useTimePicker` — the controller behind `TimePicker`. The `any`-free,
 * cross-platform port of Mantine's `use-time-picker`: it splits the time value
 * into `hours`/`minutes`/`seconds`/`amPm` segments (via `getParsedTime`),
 * exposes per-segment setters that re-assemble + emit the canonical string (via
 * `getTimeString`), advances focus hours→minutes→seconds→amPm through
 * `focusElement` (NOT a DOM `.focus()`), and re-syncs the segments when a
 * controlled `value` changes (`useDidUpdate`). The paste handler is typed
 * `(event: unknown)` and narrows a web clipboard event at runtime, clamping the
 * pasted value into `[min, max]` (`clampTime`); native fires no paste event so it
 * is a no-op. Refs surface as `TamaguiElement` host refs — never DOM input refs.
 */
export function useTimePicker({
  value,
  defaultValue,
  onChange,
  format,
  amPmLabels,
  withSeconds = false,
  min,
  max,
  clearable,
  readOnly,
  disabled,
  pasteSplit,
  type,
}: UseTimePickerInput): UseTimePickerReturn {
  const parsedTime = getParsedTime({ time: value || defaultValue || "", amPmLabels, format });

  const initialTimeString = getTimeString({
    hours: parsedTime.hours,
    minutes: parsedTime.minutes,
    seconds: parsedTime.seconds,
    format,
    withSeconds,
    amPm: parsedTime.amPm,
    amPmLabels,
  });

  const acceptChange = React.useRef(true);
  const wasInvalidBefore = React.useRef(!initialTimeString.valid);

  const [hours, setHoursState] = React.useState<number | null>(parsedTime.hours);
  const [minutes, setMinutesState] = React.useState<number | null>(parsedTime.minutes);
  const [seconds, setSecondsState] = React.useState<number | null>(parsedTime.seconds);
  const [amPm, setAmPmState] = React.useState<string | null>(parsedTime.amPm);

  const isClearable = Boolean(
    clearable &&
    !readOnly &&
    !disabled &&
    (hours !== null || minutes !== null || seconds !== null || amPm !== null),
  );

  const hoursRef = React.useRef<TamaguiElement | null>(null);
  const minutesRef = React.useRef<TamaguiElement | null>(null);
  const secondsRef = React.useRef<TamaguiElement | null>(null);
  const amPmRef = React.useRef<TamaguiElement | null>(null);

  const focus = (field: TimeField) => {
    const node =
      field === "hours"
        ? hoursRef.current
        : field === "minutes"
          ? minutesRef.current
          : field === "seconds"
            ? secondsRef.current
            : amPmRef.current;
    if (node) {
      focusElement(node);
    }
  };

  // Re-assemble the full value from the (already-updated) segments and emit it,
  // mirroring Mantine: a valid string is sent verbatim; the first transition
  // into an invalid state emits `''` once (so a consumer clearing it doesn't get
  // a stream of empties while the user keeps typing an incomplete value).
  const commit = (next: TimePickerValues) => {
    const timeString = getTimeString({ ...next, format, withSeconds, amPmLabels });
    acceptChange.current = false;

    if (timeString.valid) {
      wasInvalidBefore.current = false;
      onChange?.(timeString.value);
    } else if (!wasInvalidBefore.current) {
      onChange?.("");
      wasInvalidBefore.current = true;
    }
  };

  const setHours = (value: number | null) => {
    let adjustedValue = value;
    if (format === "12h" && typeof value === "number" && value > 12) {
      adjustedValue = ((value - 1) % 12) + 1;
    }
    setHoursState(adjustedValue);
    commit({ hours: adjustedValue, minutes, seconds, amPm });
    focus("hours");
  };

  const setMinutes = (value: number | null) => {
    setMinutesState(value);
    commit({ hours, minutes: value, seconds, amPm });
    focus("minutes");
  };

  const setSeconds = (value: number | null) => {
    setSecondsState(value);
    commit({ hours, minutes, seconds: value, amPm });
    focus("seconds");
  };

  const setAmPm = (value: string | null) => {
    setAmPmState(value);
    commit({ hours, minutes, seconds, amPm: value });
    focus("amPm");
  };

  const setTimeString = (timeString: string) => {
    acceptChange.current = false;

    const parsed = getParsedTime({ time: timeString, amPmLabels, format });
    setHoursState(parsed.hours);
    setMinutesState(parsed.minutes);
    setSecondsState(parsed.seconds);
    setAmPmState(parsed.amPm);

    const next = getTimeString({ ...parsed, format, withSeconds, amPmLabels });
    wasInvalidBefore.current = !next.valid;
    onChange?.(timeString);
  };

  const clear = () => {
    acceptChange.current = false;
    setHoursState(null);
    setMinutesState(null);
    setSecondsState(null);
    setAmPmState(null);
    onChange?.("");
    wasInvalidBefore.current = true;
    focus("hours");
  };

  const onPaste = (event: unknown) => {
    if (!isClipboardEventLike(event)) {
      return;
    }
    event.preventDefault();
    const pastedValue = event.clipboardData.getData("text");
    const parsed = (pasteSplit ?? getParsedTime)({ time: pastedValue, format, amPmLabels });
    const timeString = getTimeString({ ...parsed, format, withSeconds, amPmLabels });

    if (timeString.valid) {
      acceptChange.current = false;
      const defaultMax = type === "duration" ? "9999:59:59" : "23:59:59";
      const clamped = clampTime(timeString.value, min ?? "00:00:00", max ?? defaultMax);
      onChange?.(clamped.timeString);
      setHoursState(parsed.hours);
      setMinutesState(parsed.minutes);
      setSecondsState(parsed.seconds);
      setAmPmState(parsed.amPm);
    }
  };

  const hiddenInputValue = getTimeString({
    hours,
    minutes,
    seconds,
    format,
    withSeconds,
    amPm,
    amPmLabels,
  });

  useDidUpdate(() => {
    if (value === "") {
      acceptChange.current = false;
      setHoursState(null);
      setMinutesState(null);
      setSecondsState(null);
      setAmPmState(null);
      acceptChange.current = true;
      return;
    }

    if (acceptChange.current && typeof value === "string") {
      const parsed = getParsedTime({ time: value || "", amPmLabels, format });
      setHoursState(parsed.hours);
      setMinutesState(parsed.minutes);
      setSecondsState(parsed.seconds);
      setAmPmState(parsed.amPm);
    }
    acceptChange.current = true;
  }, [value]);

  return {
    refs: { hours: hoursRef, minutes: minutesRef, seconds: secondsRef, amPm: amPmRef },
    values: { hours, minutes, seconds, amPm },
    setHours,
    setMinutes,
    setSeconds,
    setAmPm,
    focus,
    clear,
    onPaste,
    setTimeString,
    isClearable,
    hiddenInputValue: hiddenInputValue.value,
  };
}
