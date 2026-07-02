// ───────────────────────────────────────────────────────────────────────────
// TimeValue — the time layer's simplest leaf: a pure time formatter.
//
// Mirrors the `@mantine/dates` `TimeValue` API and is built on `@knitui/components`
// (`Text`) + `@knitui/core`. Mantine returns a bare fragment around a formatted
// string; the kit renders that string through a cross-platform `Text` so it is a
// real node on web AND native (and inherits the usual `Text` token / `theme` /
// styling props). The numeric formatting itself (12h/24h, optional seconds, AM/PM
// labels) is the `any`-free port of Mantine `TimeValue/get-formatted-time`,
// promoted to the shared `utils/` so the whole time layer shares one formatter.
//
// What this leaf owns from the `_reference` checklist:
//   1  — this header (provenance + cross-platform stance).
//   9  — time formatting: the `12h`/`24h` mode, `withSeconds`, and the `amPmLabels`
//        all flow into `getFormattedTime`. NOTE there is deliberately NO `locale`
//        prop / `useDatesContext().getLocale` here: like Mantine's `TimeValue`,
//        the output is built from plain numeric components (`padTime`/`%12`), so
//        it is locale-INDEPENDENT — the only localizable surface is the caller-
//        supplied `amPmLabels`. The calendar-style dayjs `locale` of point 9 does
//        not apply to a numeric clock string.
//   13 — typed `forwardRef`: the ref forwards to the underlying `Text` host
//        (`TamaguiElement`), and every `TextProps` style prop passes through, so
//        `styled(TimeValue, …)` (see `TimePresetControlLabel`) and a consumer ref
//        both work. The dates-norm `.styleable` wrapper is for components that own
//        a styled Frame; this leaf renders the shared `Text` directly, so a typed
//        `forwardRef` is the leaf-appropriate form (same call as `TimeInput`).
//
// The checklist items that do NOT apply, and why:
//   2/3/5  — shared `size` context, the `cell-metrics` sizing ladder and a styled
//            multi-part Frame: this leaf renders a single `Text`; `Text` already
//            derives its own sizing from the kit ladder and `size` flows straight
//            through as a `TextProps` passthrough. There are no sibling parts to
//            share an axis with.
//   4      — theme-ramp colors: color is whatever `Text` / the active `theme`
//            resolves; this formatter sets none of its own.
//   6      — marker slots: a single formatted string is a leaf, not a composable
//            multi-section surface.
//   7      — per-slot `styles` sugar: there is exactly one part (the `Text`), so a
//            `SlotStyles` map would only duplicate the `TextProps` passthrough.
//   8      — controlled/uncontrolled value: `TimeValue` is a stateless display of
//            its `value` prop; it has no selection of its own.
//   10     — min/max bounds: a formatter clamps nothing (bounds live in the
//            interactive `TimeInput`/`TimePicker`).
//   11     — a11y axes: a plain text node carries its own accessible text content;
//            there is no interactive role to wire on either platform.
//   12     — interaction styling (`hoverStyle`/`pressStyle`/`disabled`): a static
//            label has no interactive state.
//   14     — `withStaticProperties` parts/slot markers: nothing to expose; there
//            are no sub-parts or slots.
//   15     — the compiler-safe show/hide trap: this leaf never toggles a dynamic
//            `opacity`/`display`; it shows/hides by swapping its text content.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import { Text, type TextProps } from "@knitui/components";
import { type TamaguiElement } from "@knitui/core";

import type { TimePickerAmPmLabels, TimePickerFormat } from "../types";
import { getFormattedTime } from "../utils/get-formatted-time/get-formatted-time";

export interface TimeValueProps extends TextProps {
  /** Time to format — a `"HH:mm:ss"` string or a `Date`. */
  value: string | Date;

  /** Clock display mode. @default '24h' */
  format?: TimePickerFormat;

  /** AM/PM labels for the `12h` mode. @default { am: 'AM', pm: 'PM' } */
  amPmLabels?: TimePickerAmPmLabels;

  /** Whether seconds should be displayed. @default false */
  withSeconds?: boolean;
}

/**
 * `TimeValue` — the time layer's simplest leaf: a pure formatter that renders a
 * time value (`"13:30"` or a `Date`) as `13:30` (`24h`) or `1:30 PM` (`12h`).
 * The `any`-free port of Mantine's `TimeValue`; where Mantine returns a bare
 * fragment, we render through a kit `Text` so it is a real cross-platform node
 * (and accepts the usual `Text` styling / `theme` props). The output is built
 * from numeric clock components, so it is locale-independent — the only
 * localizable surface is the caller-supplied `amPmLabels`. Forwards its ref to
 * the underlying `Text` host.
 *
 * @example
 * <TimeValue value="13:30:00" />              // → "13:30"
 * <TimeValue value="13:30:00" format="12h" /> // → "1:30 PM"
 */
export const TimeValue = React.forwardRef<TamaguiElement, TimeValueProps>(function TimeValue(
  { value, format = "24h", amPmLabels = { am: "AM", pm: "PM" }, withSeconds = false, ...others },
  ref,
) {
  return (
    <Text ref={ref} {...others}>
      {getFormattedTime({ value, format, amPmLabels, withSeconds })}
    </Text>
  );
});

TimeValue.displayName = "@knitui/dates/TimeValue";
