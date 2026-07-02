import * as React from "react";

import { Input } from "@knitui/components";
import { type GetProps, isWeb, type TamaguiElement } from "@knitui/core";

import { CELL_WIDTH } from "../cell-metrics";
import { hasPreventDefault } from "../internal/has-prevent-default";
import { selectAllOnFocus } from "../internal/select-on-focus";
import { type TimePickerAmPmLabels } from "../types";

/**
 * Fixed segment width, taken from the shared `cell-metrics` ladder (the calendar
 * twin of components' `controlMetrics`) instead of a magic pixel — `xl` (54px)
 * is the comfortable two-letter width the time segments share with `SpinInput`.
 */
const SEGMENT_WIDTH = CELL_WIDTH.xl;

/**
 * The native-only host props (`accessibilityRole`/`showSoftInputOnFocus`/
 * `caretHidden`/`onPress`). `showSoftInputOnFocus`/`caretHidden` live on the kit
 * `Input`'s native host but not on the cross-platform `GetProps<typeof Input>`,
 * so they're declared here and merged in — a precise local intersection, NOT an
 * `as`-cast that would erase the whole prop bag (the kit pattern for native-only
 * affordances).
 */
type AmPmNativeHostProps = GetProps<typeof Input> & {
  showSoftInputOnFocus?: boolean;
  caretHidden?: boolean;
};

/**
 * The am/pm segment leaf the composed `TimePicker` pairs with `SpinInput` in
 * `12h` mode. Mantine types this off `React.ComponentProps<'select'>` and renders
 * a real `<select>`/`<input>`; ours re-types onto a precise spread of the kit
 * `Input` props via `GetProps<typeof Input>` and renders a single kit `Input`
 * (no DOM `<select>`/`<input>` type leaks).
 */
export interface AmPmInputProps extends Omit<GetProps<typeof Input>, "value" | "onChange"> {
  /** Current am/pm label, or `''` when empty. */
  value: string;

  /** Called when the segment changes (cleared → `''`). */
  onChange: (value: string) => void;

  /** Localized am/pm labels matched against typed first letters. */
  labels: TimePickerAmPmLabels;

  /** Whether the field participates in the tab order / can receive focus. */
  focusable: boolean;

  /** Advance focus to the next segment (after a letter sets am/pm, ArrowRight). */
  onNextInput?: () => void;

  /** Return focus to the previous segment (Backspace when empty / ArrowLeft). */
  onPreviousInput?: () => void;

  /** Whether the field rejects edits. */
  readOnly?: boolean;
}

/**
 * `AmPmInput` — the controlled am/pm leaf used by the time layer (`TimePicker`
 * composes one alongside its hour/minute `SpinInput`s in `12h` mode). The
 * `any`-free, cross-platform port of Mantine's internal `AmPmInput`, but with a
 * platform-split interaction model:
 *
 * • Web keeps Mantine's text field: letter entry rides `onChangeText` (last
 *   typed char matched case-insensitively against `labels.am`/`labels.pm`'s
 *   first letter → set + auto-advance) and the Arrow/Home/End/Backspace keyboard
 *   machine reads `event.key`. Focusing selects the text so a letter replaces it.
 *
 * • Native renders a non-editable, tap-to-toggle segment: there is no usable
 *   "type a/p on a soft keyboard" affordance, so a press cycles `''→am→pm→am…`
 *   (matching the web ArrowUp toggle) with NO keyboard summoned
 *   (`showSoftInputOnFocus={false}`, `caretHidden`). The press routes through the
 *   kit `Input`'s readOnly press-trigger path (root-frame press on Android).
 *
 * `preventDefault` is called only behind the `has-prevent-default` guard. Renders
 * through a kit `Input` (never a raw `<select>`/`<input>`); ref forwards to the
 * host node.
 */
export const AmPmInput = React.forwardRef<TamaguiElement, AmPmInputProps>(
  function AmPmInput(props, ref) {
    const {
      value,
      onChange,
      labels,
      focusable,
      onNextInput,
      onPreviousInput,
      readOnly,
      disabled,
      onFocus,
      ...others
    } = props;

    const amFirst = labels.am.charAt(0).toLowerCase();
    const pmFirst = labels.pm.charAt(0).toLowerCase();

    // Native press cycle: empty → am → pm → am … (mirrors the web ArrowUp toggle).
    const toggle = () => {
      if (readOnly || disabled) {
        return;
      }
      onChange(value === labels.am ? labels.pm : labels.am);
    };

    const handleFocus: AmPmInputProps["onFocus"] = (event) => {
      selectAllOnFocus(event);
      onFocus?.(event);
    };

    // Native: a tap-to-toggle segment. The host is non-editable and never raises
    // a soft keyboard; pressing it cycles am/pm. `readOnly`/`disabled` both
    // short-circuit the toggle above. The native-only host props are spread from
    // a precisely-typed object (see `AmPmNativeHostProps`) so they neither
    // excess-property-check against the cross-platform `Input` type nor get
    // erased by an `as`-cast. Web a11y rides the implicit `textbox` role; the
    // `adjustable` accessibility role is its native (VoiceOver/TalkBack) twin.
    if (!isWeb) {
      const nativeToggleProps: AmPmNativeHostProps = {
        accessibilityRole: "adjustable",
        showSoftInputOnFocus: false,
        caretHidden: true,
        onPress: toggle,
      };
      return (
        <Input
          ref={ref}
          placeholder="--"
          value={value}
          readOnly
          disabled={disabled}
          textAlign="center"
          width={SEGMENT_WIDTH}
          onFocus={handleFocus}
          {...nativeToggleProps}
          {...others}
        />
      );
    }

    const handleChange = (text: string) => {
      if (readOnly) {
        return;
      }

      if (text === "") {
        onChange("");
        return;
      }

      const lastChar = text.charAt(text.length - 1).toLowerCase();
      if (lastChar === amFirst) {
        onChange(labels.am);
        onNextInput?.();
      } else if (lastChar === pmFirst) {
        onChange(labels.pm);
        onNextInput?.();
      }
    };

    const handleKeyDown = (event: { key: string }) => {
      if (readOnly) {
        return;
      }

      const prevent = () => {
        if (hasPreventDefault(event)) {
          event.preventDefault();
        }
      };

      const key = event.key.toLowerCase();

      if (event.key === "Home") {
        prevent();
        onChange(labels.am);
        return;
      }

      if (event.key === "End") {
        prevent();
        onChange(labels.pm);
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        prevent();
        if (value === "") {
          onPreviousInput?.();
        } else {
          onChange("");
        }
        return;
      }

      if (event.key === "ArrowRight") {
        prevent();
        onNextInput?.();
        return;
      }

      if (event.key === "ArrowLeft") {
        prevent();
        onPreviousInput?.();
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        prevent();
        onChange(value === labels.am ? labels.pm : labels.am);
        return;
      }

      if (key === amFirst) {
        prevent();
        onChange(labels.am);
        onNextInput?.();
        return;
      }

      if (key === pmFirst) {
        prevent();
        onChange(labels.pm);
        onNextInput?.();
      }
    };

    return (
      <Input
        ref={ref}
        inputMode="text"
        placeholder="--"
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        textAlign="center"
        width={SEGMENT_WIDTH}
        tabIndex={focusable ? undefined : -1}
        onChangeText={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        {...others}
      />
    );
  },
);

AmPmInput.displayName = "@knitui/dates/AmPmInput";
