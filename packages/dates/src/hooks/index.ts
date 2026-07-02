// Shared hooks for @knitui/dates, mirroring the @mantine/dates `src/hooks` layout
// (one folder per hook): the picker value-state machine (`use-uncontrolled-dates`)
// and the selection state machine (`use-dates-state`) the inline pickers build on.
// The `is-in-range` util stays private to `use-dates-state`.
export { useDatesInput } from "./use-dates-input";
export type { UseDatesInput, UseDatesInputReturn } from "./use-dates-input";
export { useDatesState } from "./use-dates-state";
export { useTimePicker } from "./use-time-picker";
export type {
  TimeField,
  TimePickerRefs,
  TimePickerValues,
  UseTimePickerInput,
  UseTimePickerReturn,
} from "./use-time-picker";
export { convertDatesValue, useUncontrolledDates } from "./use-uncontrolled-dates";
export type { UseUncontrolledDatesInput } from "./use-uncontrolled-dates";
