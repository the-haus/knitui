// ───────────────────────────────────────────────────────────────────────────
// HiddenDatesInput — mirrors @mantine/dates' `HiddenDatesInput`, built on
// @knitui/components (`Box`) + @knitui/core + the package's date utils + dayjs.
//
// This is a HIDDEN FORM-VALUE input, not a visual control: it serializes the
// picker's selection into the string a surrounding `<form>` submits. Because it
// renders nothing the user sees, the kit's VISUAL gold-standard checklist items
// are deliberately N/A here — there is no sizing, no `cell-metrics` ladder, no
// theme-ramp color, no styled leaf parts, no marker slots, no `styles` sugar, no
// interaction styling, and no compiler-safe-styling concern. What DOES apply is
// faithful value serialization (single / range / multiple, with or without
// time) at exact @mantine parity, and a sound cross-platform stance.
//
// Cross-platform stance: a real `<input type="hidden">` only has meaning inside
// a DOM `<form>`, which native (React Native) has no concept of. So this renders
// the hidden host `<input>` on web and returns `null` on native — it never emits
// a React-Native-illegal DOM host element. The web path mirrors the kit's other
// hidden-field helpers (e.g. `Rating`'s `RatingHiddenInput`): the
// `<input>`-specific host attributes are assembled as a typed object and handed
// to `Box`'s `render="input"` escape, with no `any` and no per-component logic.
// ───────────────────────────────────────────────────────────────────────────
import { Box } from "@knitui/components";
import { type GetProps, isWeb } from "@knitui/core";

import type { DatePickerType, DatesRangeValue, DateValue } from "../types";
import { toDateString, toDateTimeString } from "../utils";

/** Value carried by the hidden field — a range pair, a multi-value array, or a scalar. */
export type HiddenDatesInputValue = DatesRangeValue | DateValue | DateValue[];

/** Props for {@link HiddenDatesInput}. */
export interface HiddenDatesInputProps {
  /** Picker selection serialized into the hidden field value. */
  value: HiddenDatesInputValue;

  /** Picker selection mode driving the serialization (`default` / `range` / `multiple`). */
  type: DatePickerType;

  /** Form field name; when omitted nothing is rendered (a nameless field submits nothing). */
  name: string | undefined;

  /** `id` of the `<form>` this field is associated with, for fields outside the form element. */
  form: string | undefined;

  /** Serialize with time (`YYYY-MM-DD HH:mm:ss`) instead of date-only. @default false */
  withTime?: boolean;
}

/** Internal argument bag for {@link formatValue}. */
interface FormatValueInput {
  value: HiddenDatesInputValue;
  type: DatePickerType;
  withTime: boolean;
}

/**
 * Serialize the picker value to the string a surrounding `<form>` submits, at
 * exact `@mantine/dates` parity:
 * - `range` → `"start – end"`, or `"start –"` when the end is missing, or `""`
 *   when there is no start (en-dash `–` separator).
 * - `multiple` → falsy entries dropped, the rest joined with `", "`.
 * - `default` (scalar) → the single formatted date, or `""` when nullish.
 */
function formatValue({ value, type, withTime }: FormatValueInput): string {
  const formatter = withTime ? toDateTimeString : toDateString;

  if (type === "range" && Array.isArray(value)) {
    const startDate = formatter(value[0]);
    const endDate = formatter(value[1]);

    if (!startDate) {
      return "";
    }

    if (!endDate) {
      return `${startDate} –`;
    }

    return `${startDate} – ${endDate}`;
  }

  if (type === "multiple" && Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  if (!Array.isArray(value) && value) {
    return formatter(value) ?? "";
  }

  return "";
}

/**
 * Web-form parity helper for the input-trigger pickers: renders a single
 * `<input type="hidden">` whose value is the serialized selection so a
 * surrounding `<form>` submits it. The `any`-free port of Mantine's
 * `HiddenDatesInput`.
 *
 * Web-only by design and returns `null` on native (see the file header for the
 * cross-platform rationale and the hidden-input serialization contract).
 *
 * @example
 * <HiddenDatesInput name="dates" form="profile" value={["2026-01-01", "2026-01-31"]} type="range" />
 */
export function HiddenDatesInput({
  value,
  type,
  name,
  form,
  withTime = false,
}: HiddenDatesInputProps) {
  if (!isWeb || !name) {
    return null;
  }

  const hostProps: object = {
    render: "input",
    type: "hidden",
    name,
    form,
    value: formatValue({ value, type, withTime }),
    readOnly: true,
    tabIndex: -1,
    "aria-hidden": true,
  };

  return <Box {...(hostProps as GetProps<typeof Box>)} />;
}

HiddenDatesInput.displayName = "@knitui/dates/HiddenDatesInput";
