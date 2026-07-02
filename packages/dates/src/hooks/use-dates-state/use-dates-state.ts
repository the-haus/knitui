import { useEffect, useState } from "react";

import dayjs from "dayjs";

import type {
  DatePickerType,
  DatePickerValue,
  DatesRangeValue,
  DateStringValue,
  PickerBaseProps,
} from "../../types";
import { useUncontrolledDates } from "../use-uncontrolled-dates";
import { isInRange } from "./is-in-range";

/**
 * The STORED (string-shaped) value for a picker `type`, mirroring
 * `useUncontrolledDates`: `range` → `[start, end]`, `multiple` → `string[]`,
 * `default` → `string | null`.
 */
type DatesValue<Type extends DatePickerType> = DatePickerValue<Type, DateStringValue>;

/**
 * The resolved union of every stored value shape — a concrete super-type of the
 * opaque generic `DatesValue<Type>`. Used to READ the value cross-`type` (index,
 * `.some`, `Array.isArray`) without `any`: the generic conditional is assignable
 * to this union, so a plain `=` widens it for inspection.
 */
type StoredDatesValue =
  | DatesRangeValue<DateStringValue>
  | DateStringValue[]
  | DateStringValue
  | null;

/** Range branch of `getControlProps` — maps onto Day/PickerControl boolean variants. */
interface RangeControlProps {
  selected: boolean;
  inRange: boolean;
  firstInRange: boolean;
  lastInRange: boolean;
}

/** Default/multiple branch of `getControlProps`. */
interface SelectedControlProps {
  selected: boolean;
}

/** Input options for `useDatesState`, re-typed cross-platform (no DOM event). */
interface UseDatesStateInput<
  Type extends DatePickerType = "default",
> extends PickerBaseProps<Type> {
  /** Granularity at which dates are compared (`isSame(date, level)`). */
  level: "year" | "month" | "day";

  /** Picker selection mode. */
  type: Type;

  /**
   * Called when the pointer leaves the calendar root (web hover; used to clear the
   * range preview). Cross-platform — the event is opaque, never a DOM event.
   */
  onMouseLeave?: (event: unknown) => void;
}

/**
 * `useDatesState` — the selection state machine shared by every inline picker, an
 * `any`-free port of Mantine's hook of the same name. Wraps the already-built
 * `useUncontrolledDates` for controlled/uncontrolled value handling, then layers
 * the `pickedDate`/`hoveredDate` interaction state on top so `range` pickers get a
 * two-click select with a live hover preview, `multiple` pickers toggle, and
 * `default` pickers optionally deselect.
 *
 * Cross-platform: `onRootMouseLeave` takes an opaque event (Tamagui no-ops it on
 * native), and the web-only `data-autofocus` attribute Mantine returns from
 * `getControlProps` is intentionally dropped — our roving focus is driven by
 * `getDateInTabOrder`, not a DOM attribute.
 */
export function useDatesState<Type extends DatePickerType = "default">({
  type,
  level,
  value,
  defaultValue,
  onChange,
  allowSingleDateInRange,
  allowDeselect,
  onMouseLeave,
}: UseDatesStateInput<Type>) {
  const [_value, setValue] = useUncontrolledDates<Type>({
    type,
    value,
    defaultValue,
    onChange,
  });

  // Widen the opaque generic to its concrete union for inspection, and commit
  // through a single typed narrowing back to `DatesValue<Type>` (a downcast — the
  // values built below are always shaped for the active `type`).
  const stored: StoredDatesValue = _value;
  const commit = (next: StoredDatesValue) => setValue(next as DatesValue<Type>);

  // The `[start, end]` view of the stored value — valid only when `type` is
  // `range`; harmless `[null, null]` otherwise (callers gate on `type`).
  const rangeView: DatesRangeValue<DateStringValue> = Array.isArray(stored)
    ? [stored[0] ?? null, stored[1] ?? null]
    : [null, null];

  // A flat array view of the stored value — meaningful only when `type` is
  // `multiple`; `[]` otherwise (callers gate on `type`). Flattening to a single
  // array element type avoids a union-receiver `.filter` type-guard miss.
  const storedArray: Array<DateStringValue | null> = Array.isArray(stored) ? stored : [];

  const [pickedDate, setPickedDate] = useState<DateStringValue | null>(
    type === "range" ? (rangeView[0] && !rangeView[1] ? rangeView[0] : null) : null,
  );
  const [hoveredDate, setHoveredDate] = useState<DateStringValue | null>(null);

  const onDateChange = (date: DateStringValue) => {
    if (type === "range") {
      if (pickedDate && !rangeView[1]) {
        if (dayjs(date).isSame(pickedDate, level) && !allowSingleDateInRange) {
          setPickedDate(null);
          setHoveredDate(null);
          commit([null, null]);
          return;
        }

        const result: [DateStringValue, DateStringValue] = [date, pickedDate];
        result.sort((a, b) => (dayjs(a).isAfter(dayjs(b)) ? 1 : -1));
        commit(result);
        setHoveredDate(null);
        setPickedDate(null);
        return;
      }

      if (
        rangeView[0] &&
        !rangeView[1] &&
        dayjs(date).isSame(rangeView[0], level) &&
        !allowSingleDateInRange
      ) {
        setPickedDate(null);
        setHoveredDate(null);
        commit([null, null]);
        return;
      }

      commit([date, null]);
      setHoveredDate(null);
      setPickedDate(date);
      return;
    }

    if (type === "multiple") {
      const values = storedArray.filter((item): item is DateStringValue => item !== null);
      if (values.some((selected) => dayjs(selected).isSame(date, level))) {
        commit(values.filter((selected) => !dayjs(selected).isSame(date, level)));
      } else {
        commit([...values, date]);
      }
      return;
    }

    const single = Array.isArray(stored) ? null : stored;
    if (single && allowDeselect && dayjs(date).isSame(single, level)) {
      commit(null);
    } else {
      commit(date);
    }
  };

  const isDateInRange = (date: DateStringValue) => {
    if (pickedDate && hoveredDate) {
      return isInRange(date, [hoveredDate, pickedDate]);
    }

    if (rangeView[0] && rangeView[1]) {
      return isInRange(date, [rangeView[0], rangeView[1]]);
    }

    return false;
  };

  const onRootMouseLeave =
    type === "range"
      ? (event: unknown) => {
          onMouseLeave?.(event);
          setHoveredDate(null);
        }
      : onMouseLeave;

  const isFirstInRange = (date: DateStringValue) => {
    if (!rangeView[0]) {
      return false;
    }

    if (dayjs(date).isSame(rangeView[0], level)) {
      return !(hoveredDate && dayjs(hoveredDate).isBefore(rangeView[0]));
    }

    return false;
  };

  const isLastInRange = (date: DateStringValue) => {
    if (rangeView[1]) {
      return dayjs(date).isSame(rangeView[1], level);
    }

    if (!rangeView[0] || !hoveredDate) {
      return false;
    }

    return dayjs(hoveredDate).isBefore(rangeView[0]) && dayjs(date).isSame(rangeView[0], level);
  };

  // NOTE: Mantine also returns a `data-autofocus` web-DOM attribute here; it is
  // intentionally dropped — our roving focus uses `getDateInTabOrder` tabIndex.
  const getControlProps = (date: DateStringValue): RangeControlProps | SelectedControlProps => {
    if (type === "range") {
      return {
        selected: rangeView.some(
          (selection) => selection !== null && dayjs(selection).isSame(date, level),
        ),
        inRange: isDateInRange(date),
        firstInRange: isFirstInRange(date),
        lastInRange: isLastInRange(date),
      };
    }

    if (type === "multiple") {
      return {
        selected: storedArray.some(
          (selection) => selection !== null && dayjs(selection).isSame(date, level),
        ),
      };
    }

    const single = Array.isArray(stored) ? null : stored;
    return { selected: single !== null && dayjs(single).isSame(date, level) };
  };

  const onHoveredDateChange = (date: DateStringValue) => {
    if (type === "range" && pickedDate) {
      setHoveredDate(date);
    }
  };

  useEffect(() => {
    if (type !== "range") {
      return;
    }

    if (rangeView[0] && !rangeView[1]) {
      setPickedDate(rangeView[0]);
    } else {
      const isNeitherSelected = rangeView[0] == null && rangeView[1] == null;
      const isBothSelected = rangeView[0] != null && rangeView[1] != null;
      if (isNeitherSelected || isBothSelected) {
        setPickedDate(null);
        setHoveredDate(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_value]);

  return {
    onDateChange,
    onRootMouseLeave,
    onHoveredDateChange,
    getControlProps,
    _value,
    setValue,
  };
}
