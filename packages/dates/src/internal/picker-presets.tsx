// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel. Shared by the three inline pickers (`YearPicker`/`MonthPicker`/
// `DatePicker`), each of which rendered an identical `<Box role="list">` of
// preset `UnstyledButton`s plus a `handlePresetSelect` that imperatively jumps
// the Calendar's displayed date + level before applying the value. The ONLY
// per-picker delta is the `level` the list resets to (`month`/`year`/`decade`),
// so it is a parameter — the rest lives here in one place.
import * as React from "react";

import { Box, UnstyledButton } from "@knitui/components";

import type { CalendarLevel, DatePickerType, DatePickerValue, DateStringValue } from "../types";
import { hasPreventDefault } from "./has-prevent-default";

/** A predefined value the user can jump to from a picker's preset list. */
export interface PickerPreset<Type extends DatePickerType> {
  /** Value applied when the preset is selected (shaped by the picker `type`). */
  value: DatePickerValue<Type, DateStringValue>;

  /** Preset label. */
  label: React.ReactNode;
}

interface RenderPresetListInput<Type extends DatePickerType> {
  /** Predefined values to render. */
  presets: PickerPreset<Type>[];

  /** Imperative setter for the Calendar's displayed date (from `__setDateRef`). */
  setDateRef: React.MutableRefObject<((date: DateStringValue) => void) | null>;

  /** Imperative setter for the Calendar's displayed level (from `__setLevelRef`). */
  setLevelRef: React.MutableRefObject<((level: CalendarLevel) => void) | null>;

  /** Level the list resets the Calendar to on select (`month`/`year`/`decade`). */
  level: CalendarLevel;

  /** Applies the selected value (the picker's `setValue`). */
  setValue: (value: DatePickerValue<Type, DateStringValue>) => void;

  /** If defined, called with the preset value INSTEAD of `setValue`. */
  __onPresetSelect?: (preset: DatePickerValue<Type, DateStringValue>) => void;
}

/**
 * Renders the shared inline-picker preset list — a `role="list"` of pressable
 * presets that jump the Calendar's date + level, then apply the value (or defer
 * to `__onPresetSelect`). Returns just the list element; the caller keeps its own
 * wrapper + Calendar.
 */
export function renderPresetList<Type extends DatePickerType>({
  presets,
  setDateRef,
  setLevelRef,
  level,
  setValue,
  __onPresetSelect,
}: RenderPresetListInput<Type>): React.JSX.Element {
  const handlePresetSelect = (presetValue: DatePickerValue<Type, DateStringValue>) => {
    const view: DatePickerValue<DatePickerType, DateStringValue> = presetValue;
    const firstDate = Array.isArray(view) ? view[0] : view;
    if (firstDate === undefined) {
      return;
    }
    if (firstDate !== null) {
      setDateRef.current?.(firstDate);
    }
    setLevelRef.current?.(level);
    if (__onPresetSelect) {
      __onPresetSelect(presetValue);
    } else {
      setValue(presetValue);
    }
  };

  return (
    <Box role="list">
      {presets.map((preset, index) => (
        <UnstyledButton
          key={index}
          onPress={() => handlePresetSelect(preset.value)}
          onPressIn={(event) => {
            if (hasPreventDefault(event)) {
              event.preventDefault();
            }
          }}
        >
          {preset.label}
        </UnstyledButton>
      ))}
    </Box>
  );
}
