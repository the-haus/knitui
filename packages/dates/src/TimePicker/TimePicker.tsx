// ───────────────────────────────────────────────────────────────────────────
// TimePicker — the segmented time input (hours/minutes/seconds + optional am/pm)
// with an optional time-controls / presets dropdown. It is the CONTROLLER for the
// time layer: it composes the kit `SpinInput` (hour/minute/second) and `AmPmInput`
// (am/pm) leaves, drives them through the `use-time-picker` controller, draws the
// bordered field frame (the kit input recipe), and opens a kit `Popover` holding
// the `TimeControlsList` columns or `TimePresets`.
//
// Mirrors `@mantine/dates`' `TimePicker` API (props/defaults/parity) but is built
// on `@knitui/components` + `@knitui/core` + the folder-local time leaves — NEVER
// `@mantine/core` — so it renders on web AND native from one source. Accent + error
// colours come from the active Tamagui theme (`theme="red"`), never a Mantine-style
// `color` prop. The ref forwards to the field-frame host node.
//
// Cross-platform notes (preserve — see prior native time-entry work): each segment
// is a separate input, so native uses select-on-focus replace + a native Backspace
// keydown bridge (in the leaves) + an am/pm tap-toggle; the focus-leave clamp into
// `[min, max]` rides web group-blur, a native blur-timer group-leave heuristic, and
// dropdown close. Paste is web-guarded. The hidden form input is web-only.
//
// Sizing is DERIVED from the shared `cell-metrics` ladder (no magic pixels, #3).
// Per-cell colour/interaction lives in the leaves (`SpinInput`/`TimeControl`/…) —
// delegated, not duplicated here. Show/hide of segments is by mounting/unmounting
// (a React swap), never a dynamic `opacity`/`display` prop the web compiler could
// fold onto the field (#15).
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import {
  Box,
  Input,
  type InputClearButtonProps,
  type InputVariant,
  type InputWrapperSlots,
  Popover,
  type PopoverProps,
  type ScrollAreaProps,
  Text,
} from "@knitui/components";
import {
  type GetProps,
  isWeb,
  pick,
  slotStyles,
  type SlotStyles,
  styled,
  type TamaguiElement,
  withStaticProperties,
} from "@knitui/core";
import { useDisclosure, useId, useMergedRef } from "@knitui/hooks";

import { AmPmInput, type AmPmInputProps } from "../AmPmInput";
import { CELL_WIDTH } from "../cell-metrics";
import { useTimePicker } from "../hooks";
import { hasPreventDefault } from "../internal/has-prevent-default";
import { SpinInput, type SpinInputProps } from "../SpinInput";
import { AmPmControlsList, TimeControlsList } from "../TimeControlsList";
import { TimePresets } from "../TimePresets";
import type {
  TimePickerAmPmLabels,
  TimePickerFormat,
  TimePickerPasteSplit,
  TimePickerPresets,
  TimePickerType,
} from "../types";
import { clampTime, getParsedTime, getTimeString } from "../utils";

/** Sizes accepted by `TimePicker` — the kit input size scale. */
export type TimePickerSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Per-size height + horizontal inset for the field frame (the kit input recipe). */
const fieldFrameSizeVariant = {
  xs: { height: "$xs", paddingHorizontal: "$xs" },
  sm: { height: "$sm", paddingHorizontal: "$sm" },
  md: { height: "$md", paddingHorizontal: "$sm" },
  lg: { height: "$lg", paddingHorizontal: "$md" },
  xl: { height: "$xl", paddingHorizontal: "$md" },
} as const;

/**
 * The bordered field row that holds the editable time segments. Mirrors the kit
 * `Input` root recipe (border/background/radius + `focused`/`error`/`disabled`/
 * `variant`), themed from the active Tamagui theme — `$red9` keeps the error
 * border red under every accent. The inner `SpinInput`/`AmPmInput` segments are
 * rendered `variant="unstyled"` so only this frame draws a border.
 */
const TimePickerFieldFrame = styled(Box, {
  name: "TimePickerField",
  flexDirection: "row",
  alignItems: "center",
  minWidth: 0,
  borderWidth: 1,
  borderColor: "$borderColor",
  backgroundColor: "$background",
  borderRadius: "$sm",
  overflow: "hidden",

  variants: {
    size: fieldFrameSizeVariant,
    variant: {
      default: {},
      filled: { backgroundColor: "$color2" },
      unstyled: { borderWidth: 0, backgroundColor: "transparent" },
    },
    focused: {
      true: { borderColor: "$borderColorFocus" },
    },
    error: {
      true: { borderColor: "$red9" },
    },
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { size: "sm", variant: "default" },
});

type TimePickerFieldFrameProps = GetProps<typeof TimePickerFieldFrame>;

/**
 * Per-size width of a single two-digit segment input, DERIVED from the shared
 * `cell-metrics` ladder (`CELL_WIDTH`, the calendar twin of components'
 * `controlMetrics`) instead of a freestanding magic-pixel table. A time segment
 * is a touch narrower than a square day cell, so each `TimePicker` input size maps
 * onto the ladder key one step DOWN (`xs→xxs … xl→lg`); moving the ladder moves the
 * segments with it. Mirrors `SpinInput`/`AmPmInput`, which anchor on the same ladder.
 */
const SEGMENT_WIDTH: Record<TimePickerSize, number> = {
  xs: CELL_WIDTH.xxs,
  sm: CELL_WIDTH.xs,
  md: CELL_WIDTH.sm,
  lg: CELL_WIDTH.md,
  xl: CELL_WIDTH.lg,
};

/** Cross-platform focus handler of a segment input (derived, never a DOM type). */
type SegmentFocusHandler = NonNullable<SpinInputProps["onFocus"]>;

/** Cross-platform blur handler of the field frame (derived, never a DOM type). */
type FieldBlurHandler = NonNullable<TimePickerFieldFrameProps["onBlur"]>;

/**
 * The minimal keydown shape a `TimePicker` consumer receives. On web the field
 * frame forwards the bubbled DOM `KeyboardEvent` (structurally a superset); on
 * native this path is inert. Kept structural so no DOM type leaks into the
 * public surface — consumers read `key` and may `preventDefault()`.
 */
export interface TimePickerKeyDownEvent {
  key: string;
  preventDefault: () => void;
}

/**
 * Narrow, serializable prop record forwarded to the web-only hidden form input.
 * Deliberately NOT `React.ComponentProps<'input'>` (web/DOM-only, drags in `any`):
 * only the form-relevant passthrough attributes are allowed — `id`, an
 * `aria-label`, and `data-*` attributes. The picker's own `name`/`form`/`value`/
 * `type` always win over these.
 */
export interface TimePickerHiddenInputProps {
  /** `id` of the hidden input. */
  id?: string;

  /** Accessible label (the field is `aria-hidden`, but kept for parity). */
  "aria-label"?: string;

  /** Arbitrary `data-*` attributes serialized onto the hidden input. */
  [dataAttr: `data-${string}`]: string | undefined;
}

/**
 * Per-slot `styles` sugar for `TimePicker` (checklist #7). The kit's ONE styling
 * model is props on the parts; `styles` is a thin map from a named slot to that
 * part's props, resolved through `slotStyles().merge` so precedence is fixed in one
 * place — `defaults < styles[slot] < explicit xxxProps < inline props`. The
 * existing per-segment `hoursInputProps`/`minutesInputProps`/… and the
 * `popoverProps`/`clearButtonProps` passthroughs are the EXPLICIT tier and always
 * win over the matching slot. The field-chrome slots (`label`/`description`/
 * `error`/`required`/`wrapper`) are forwarded straight to the underlying
 * `Input.Wrapper` via `pick`, so they share the kit's wrapper vocabulary.
 */
export interface TimePickerStyles extends Pick<
  InputWrapperSlots,
  "wrapper" | "label" | "description" | "error" | "required"
> {
  /** Props for the bordered field row that holds the segments (`.Field`). */
  field?: TimePickerFieldFrameProps;

  /** Props spread onto EVERY editable time segment (`SpinInput`); `xxxInputProps` win. */
  segment?: Partial<SpinInputProps>;

  /** Props for the `:` separators between segments. */
  colon?: GetProps<typeof Text>;

  /** Props for the dropdown content container (the controls/presets `Box`). */
  dropdown?: GetProps<typeof Box>;
}

/** The wrapper-chrome slots forwarded to `Input.Wrapper` (its native vocabulary). */
const TIME_PICKER_WRAPPER_SLOT_KEYS = [
  "wrapper",
  "label",
  "description",
  "error",
  "required",
] as const satisfies readonly (keyof InputWrapperSlots)[];

/** The full slot vocabulary `TimePicker` recognises (dev-warns unknown keys). */
const TIME_PICKER_SLOT_KEYS = [
  "field",
  "segment",
  "colon",
  "dropdown",
  ...TIME_PICKER_WRAPPER_SLOT_KEYS,
] as const satisfies readonly (keyof TimePickerStyles)[];

export interface TimePickerProps extends Omit<
  TimePickerFieldFrameProps,
  | "value"
  | "defaultValue"
  | "onChange"
  | "children"
  | "size"
  | "focused"
  | "disabled"
  | "error"
  | "onFocus"
  | "onBlur"
> {
  /** TimePicker type: `'time'` for a clock input, `'duration'` for >24h durations. @default 'time' */
  type?: TimePickerType;

  /** Controlled value — an `HH:mm[:ss]` string. */
  value?: string;

  /** Uncontrolled default value. */
  defaultValue?: string;

  /** Called when the value changes. */
  onChange?: (value: string) => void;

  /** Show a clear button when the field has a value. @default false */
  clearable?: boolean;

  /** Min possible time value in `hh:mm:ss` format. */
  min?: string;

  /** Max possible time value in `hh:mm:ss` format. */
  max?: string;

  /** Time format. @default '24h' */
  format?: TimePickerFormat;

  /** Number by which hours are incremented/decremented. @default 1 */
  hoursStep?: number;

  /** Number by which minutes are incremented/decremented. @default 1 */
  minutesStep?: number;

  /** Number by which seconds are incremented/decremented. @default 1 */
  secondsStep?: number;

  /** Whether the seconds input is displayed. @default false */
  withSeconds?: boolean;

  /** `aria-label` of the hours input. */
  hoursInputLabel?: string;

  /** `aria-label` of the minutes input. */
  minutesInputLabel?: string;

  /** `aria-label` of the seconds input. */
  secondsInputLabel?: string;

  /** `aria-label` of the am/pm input. */
  amPmInputLabel?: string;

  /** Labels used for am/pm values. @default { am: 'AM', pm: 'PM' } */
  amPmLabels?: TimePickerAmPmLabels;

  /** Show a dropdown with time-controls lists when the input is focused. @default false */
  withDropdown?: boolean;

  /** Props passed down to the `Popover`. */
  popoverProps?: Partial<Omit<PopoverProps, "children">>;

  /** Called once when the field gains focus (not between segments). */
  onFocus?: SegmentFocusHandler;

  /** Called once when focus leaves the field. */
  onBlur?: FieldBlurHandler;

  /**
   * Called on keydown anywhere in the field (web: the bubbled segment keydown).
   * Used by `InlineDateTimePicker` to commit on Enter; inert on native.
   */
  onKeyDown?: (event: TimePickerKeyDownEvent) => void;

  /** Props passed down to the clear button. */
  clearButtonProps?: InputClearButtonProps;

  /** If set, the value cannot be updated. */
  readOnly?: boolean;

  /** If set, the component becomes disabled. */
  disabled?: boolean;

  /** Field size — the kit input size scale. @default 'sm' */
  size?: TimePickerSize;

  /** Field variant forwarded to the field frame. @default 'default' */
  variant?: InputVariant;

  /** Transform a pasted value into time segments. @default getParsedTime */
  pasteSplit?: TimePickerPasteSplit;

  /** Ref to the hours input host node. */
  hoursRef?: React.Ref<TamaguiElement>;

  /** Ref to the minutes input host node. */
  minutesRef?: React.Ref<TamaguiElement>;

  /** Ref to the seconds input host node. */
  secondsRef?: React.Ref<TamaguiElement>;

  /** Ref to the am/pm input host node. */
  amPmRef?: React.Ref<TamaguiElement>;

  /**
   * Props spread onto the hours segment (`SpinInput`) — e.g. a per-segment test
   * id or `aria-label`. Typed to OUR `SpinInput` props (NOT a web-only
   * `React.ComponentProps<'input'>`); the picker's own wiring always wins.
   */
  hoursInputProps?: Partial<SpinInputProps>;

  /** Props spread onto the minutes segment (`SpinInput`); picker wiring wins. */
  minutesInputProps?: Partial<SpinInputProps>;

  /** Props spread onto the seconds segment (`SpinInput`); picker wiring wins. */
  secondsInputProps?: Partial<SpinInputProps>;

  /** Props spread onto the am/pm segment (`AmPmInput`); picker wiring wins. */
  amPmSelectProps?: Partial<AmPmInputProps>;

  /** Time presets to display in the dropdown. */
  presets?: TimePickerPresets;

  /** Maximum dropdown content height in px. @default 200 */
  maxDropdownContentHeight?: number;

  /** Props passed down to all underlying `ScrollArea` components. */
  scrollAreaProps?: ScrollAreaProps;

  /** Reverse the order of the time-controls lists. @default false */
  reverseTimeControlsList?: boolean;

  /** Hours input placeholder. @default '--' */
  hoursPlaceholder?: string;

  /** Minutes input placeholder. @default '--' */
  minutesPlaceholder?: string;

  /** Seconds input placeholder. @default '--' */
  secondsPlaceholder?: string;

  /** Minimum number of hour digits, `type="duration"` only. @default 2 */
  minHoursDigits?: number;

  /** Content rendered in the right section of the field. */
  rightSection?: React.ReactNode;

  /** Field label rendered above the input. */
  label?: React.ReactNode;

  /** Description rendered below the label. */
  description?: React.ReactNode;

  /** Error message / state. */
  error?: React.ReactNode;

  /** Mark the field as required (adds the asterisk to the label). */
  required?: boolean;

  /** `name` forwarded to the hidden form input so a surrounding `<form>` submits the time (web only). */
  name?: string;

  /** `form` id forwarded to the hidden form input (web only). */
  form?: string;

  /** Props forwarded to the hidden form input (web only). */
  hiddenInputProps?: TimePickerHiddenInputProps;

  /**
   * Per-slot style sugar — props spread onto the matching styled part. Slots:
   * `field` / `segment` / `colon` / `dropdown` plus the `Input.Wrapper` chrome
   * (`wrapper` / `label` / `description` / `error` / `required`). The explicit
   * `xxxInputProps` / `popoverProps` / `clearButtonProps` passthroughs win over it.
   */
  styles?: SlotStyles<TimePickerStyles>;
}

const DEFAULT_AM_PM_LABELS: TimePickerAmPmLabels = { am: "AM", pm: "PM" };

/** A web blur event we can inspect for focus leaving the field group. */
interface DomBlurLike {
  relatedTarget: Node | null;
  currentTarget: { contains: (node: Node | null) => boolean };
}

/** Runtime narrowing: is `event` a web focus/blur event with a `currentTarget.contains`? */
function isDomBlurLike(event: unknown): event is DomBlurLike {
  if (typeof event !== "object" || event === null || !("currentTarget" in event)) {
    return false;
  }
  const { currentTarget } = event as { currentTarget: unknown };
  return (
    typeof currentTarget === "object" &&
    currentTarget !== null &&
    "contains" in currentTarget &&
    typeof (currentTarget as { contains: unknown }).contains === "function"
  );
}

/**
 * Whether a blur event moved focus OUTSIDE the field group (web). Narrows the
 * opaque event internally so the caller's `event` keeps its original handler
 * type — false on native (no DOM `relatedTarget`/`contains`).
 */
function focusLeftGroup(event: unknown): boolean {
  if (!isWeb || !isDomBlurLike(event)) {
    return false;
  }
  return !event.currentTarget.contains(event.relatedTarget);
}

/**
 * `TimePicker` — the segmented time input with an optional time-controls /
 * presets dropdown. The `any`-free, cross-platform port of Mantine's
 * `TimePicker`: hours/minutes/seconds are the kit `SpinInput`, am/pm is the kit
 * `AmPmInput`, all driven by the `use-time-picker` controller; the bordered field
 * frame mirrors the kit input recipe and the segments render `variant="unstyled"`.
 * `withDropdown` opens a kit `Popover` whose dropdown holds the
 * `TimeControlsList` columns (or `TimePresets`). Paste is web-guarded (native has
 * no paste event); the focus-leave clamp into `[min, max]` runs on web group-blur
 * and on dropdown close. Accent + error colours come from the active Tamagui
 * theme. The ref forwards to the field frame host node.
 */
const TimePickerComponent = React.forwardRef<TamaguiElement, TimePickerProps>(
  function TimePicker(props, ref) {
    const {
      type = "time",
      format: _format = "24h",
      value,
      defaultValue,
      onChange,
      clearable = false,
      min,
      max,
      hoursStep = 1,
      minutesStep = 1,
      secondsStep = 1,
      withSeconds = false,
      hoursInputLabel,
      minutesInputLabel,
      secondsInputLabel,
      amPmInputLabel,
      amPmLabels = DEFAULT_AM_PM_LABELS,
      withDropdown = false,
      popoverProps,
      onFocus,
      onBlur,
      onKeyDown,
      clearButtonProps,
      readOnly,
      disabled,
      size = "sm",
      variant = "default",
      pasteSplit = getParsedTime,
      hoursRef,
      minutesRef,
      secondsRef,
      amPmRef,
      hoursInputProps,
      minutesInputProps,
      secondsInputProps,
      amPmSelectProps,
      presets,
      maxDropdownContentHeight = 200,
      scrollAreaProps,
      reverseTimeControlsList = false,
      hoursPlaceholder = "--",
      minutesPlaceholder = "--",
      secondsPlaceholder = "--",
      minHoursDigits = 2,
      rightSection,
      label,
      description,
      error,
      required,
      name,
      form,
      hiddenInputProps,
      styles,
      ...others
    } = props;

    // 7. Typed per-slot accessor (dev-warns unknown keys against the known set);
    //    `merge` spreads slot sugar UNDER the explicit `xxxProps` (explicit wins).
    const s = slotStyles<TimePickerStyles>(styles, TIME_PICKER_SLOT_KEYS, "TimePicker");

    const isDuration = type === "duration";
    const format: TimePickerFormat = isDuration ? "24h" : _format;
    const resolvedHoursPlaceholder =
      isDuration && hoursPlaceholder === "--" ? "-".repeat(minHoursDigits) : hoursPlaceholder;

    const controller = useTimePicker({
      value,
      defaultValue,
      onChange,
      format,
      amPmLabels,
      withSeconds,
      min,
      max,
      clearable,
      disabled,
      readOnly,
      pasteSplit,
      type,
    });

    const hoursInputId = useId();
    const hasFocusRef = React.useRef(false);
    const [focused, setFocused] = React.useState(false);
    const [dropdownOpened, dropdownHandlers] = useDisclosure(false);

    const mergedHoursRef = useMergedRef<TamaguiElement>(controller.refs.hours, hoursRef);
    const mergedMinutesRef = useMergedRef<TamaguiElement>(controller.refs.minutes, minutesRef);
    const mergedSecondsRef = useMergedRef<TamaguiElement>(controller.refs.seconds, secondsRef);
    const mergedAmPmRef = useMergedRef<TamaguiElement>(controller.refs.amPm, amPmRef);

    const dropdownDisabled = disabled || readOnly || !withDropdown || isDuration;
    const segmentWidth = SEGMENT_WIDTH[size];

    const clampCurrentValue = React.useCallback(() => {
      if (!min && !max) {
        return;
      }
      const timeString = getTimeString({
        ...controller.values,
        format,
        withSeconds,
        amPmLabels,
      });
      if (timeString.valid) {
        const clamped = clampTime(timeString.value, min, max);
        if (clamped.timeString !== timeString.value) {
          controller.setTimeString(clamped.timeString);
        }
      }
    }, [controller, min, max, format, withSeconds, amPmLabels]);

    // Native group-blur tracking: each segment is a separate RN `TextInput`, so
    // there is no single DOM blur with a `relatedTarget` to tell us focus left the
    // WHOLE field (web's `focusLeftGroup`). Instead, a segment blur arms a short
    // timer; a focus landing on another segment cancels it. If it fires, focus
    // truly left the group → drop the focus ring and clamp into [min, max].
    const blurTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelGroupBlur = () => {
      if (blurTimeoutRef.current != null) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };
    React.useEffect(() => cancelGroupBlur, []);

    const handleSegmentFocus: SegmentFocusHandler = (event) => {
      cancelGroupBlur();
      if (!hasFocusRef.current) {
        hasFocusRef.current = true;
        setFocused(true);
        onFocus?.(event);
      }
      if (!dropdownDisabled) {
        dropdownHandlers.open();
      }
    };

    // Native: a segment lost focus. Defer the group-leave decision a tick so an
    // immediate re-focus on a sibling segment (auto-advance / manual tap) cancels
    // it; only a real exit reaches the timeout body.
    const handleSegmentBlur: SegmentFocusHandler = () => {
      if (isWeb) {
        return;
      }
      cancelGroupBlur();
      blurTimeoutRef.current = setTimeout(() => {
        blurTimeoutRef.current = null;
        hasFocusRef.current = false;
        setFocused(false);
        clampCurrentValue();
      }, 50);
    };

    // Web: clamp + emit the public blur only when focus actually leaves the field
    // group (not when moving between segments). Native fires no DOM blur with a
    // `relatedTarget`, so the clamp there rides `handleSegmentBlur` above (and the
    // dropdown-close path below).
    const handleGroupBlur: FieldBlurHandler = (event) => {
      if (!focusLeftGroup(event)) {
        return;
      }
      hasFocusRef.current = false;
      setFocused(false);
      clampCurrentValue();
      onBlur?.(event);
    };

    const showClear = clearable && controller.isClearable && !readOnly && !disabled;

    // `onKeyDown` is not part of the field-frame (`Box`) prop type, so attach it
    // through a precisely-typed spread object — the kit pattern for web-only
    // affordances (see `Month`'s `hoverHandlers`). On web the bubbled segment
    // keydown reaches the frame; native ignores it.
    const keyDownHandlers: { onKeyDown?: (event: TimePickerKeyDownEvent) => void } = onKeyDown
      ? { onKeyDown }
      : {};

    const colon = (
      <Text key="colon" color="$color" userSelect="none" paddingHorizontal={1} {...s.get("colon")}>
        :
      </Text>
    );

    const fieldFrame = (
      <TimePickerFieldFrame
        ref={ref}
        size={size}
        variant={variant}
        focused={focused && !error}
        error={Boolean(error)}
        disabled={disabled}
        gap={1}
        onPress={() => {
          if (!disabled && !readOnly) {
            controller.focus("hours");
          }
        }}
        onBlur={handleGroupBlur}
        {...keyDownHandlers}
        {...s.get("field")}
        {...others}
      >
        <SpinInput
          {...s.get("segment")}
          {...hoursInputProps}
          id={hoursInputId}
          ref={mergedHoursRef}
          value={controller.values.hours}
          onChange={controller.setHours}
          onNextInput={() => controller.focus("minutes")}
          min={format === "12h" ? 1 : 0}
          max={isDuration ? 9999 : format === "12h" ? 12 : 23}
          allowTemporaryZero={format === "12h"}
          disableAutoAdvance={isDuration}
          focusable
          step={hoursStep}
          size={size}
          variant="unstyled"
          width={isDuration ? segmentWidth * 2 : segmentWidth}
          paddingHorizontal={0}
          aria-label={hoursInputLabel}
          readOnly={readOnly}
          disabled={disabled}
          onPaste={controller.onPaste}
          onFocus={handleSegmentFocus}
          onBlur={handleSegmentBlur}
          placeholder={resolvedHoursPlaceholder}
        />
        {colon}
        <SpinInput
          {...s.get("segment")}
          {...minutesInputProps}
          ref={mergedMinutesRef}
          value={controller.values.minutes}
          onChange={controller.setMinutes}
          min={0}
          max={59}
          focusable={false}
          step={minutesStep}
          size={size}
          variant="unstyled"
          width={segmentWidth}
          paddingHorizontal={0}
          onPreviousInput={() => controller.focus("hours")}
          onNextInput={() => (withSeconds ? controller.focus("seconds") : controller.focus("amPm"))}
          aria-label={minutesInputLabel}
          readOnly={readOnly}
          disabled={disabled}
          onPaste={controller.onPaste}
          onFocus={handleSegmentFocus}
          onBlur={handleSegmentBlur}
          placeholder={minutesPlaceholder}
        />
        {withSeconds ? (
          <>
            {colon}
            <SpinInput
              {...s.get("segment")}
              {...secondsInputProps}
              ref={mergedSecondsRef}
              value={controller.values.seconds}
              onChange={controller.setSeconds}
              min={0}
              max={59}
              focusable={false}
              step={secondsStep}
              size={size}
              variant="unstyled"
              width={segmentWidth}
              paddingHorizontal={0}
              onPreviousInput={() => controller.focus("minutes")}
              onNextInput={() => controller.focus("amPm")}
              aria-label={secondsInputLabel}
              readOnly={readOnly}
              disabled={disabled}
              onPaste={controller.onPaste}
              onFocus={handleSegmentFocus}
              onBlur={handleSegmentBlur}
              placeholder={secondsPlaceholder}
            />
          </>
        ) : null}
        {format === "12h" && !isDuration ? (
          <AmPmInput
            {...amPmSelectProps}
            ref={mergedAmPmRef}
            labels={amPmLabels}
            value={controller.values.amPm ?? ""}
            onChange={(next) => controller.setAmPm(next === "" ? null : next)}
            focusable={false}
            size={size}
            variant="unstyled"
            width={segmentWidth + 6}
            paddingHorizontal={0}
            aria-label={amPmInputLabel}
            onPreviousInput={() =>
              withSeconds ? controller.focus("seconds") : controller.focus("minutes")
            }
            readOnly={readOnly}
            disabled={disabled}
            onPaste={controller.onPaste}
            onFocus={handleSegmentFocus}
            onBlur={handleSegmentBlur}
          />
        ) : null}

        <Box flexGrow={1} flexShrink={1} minWidth={0} />

        {rightSection}
        {showClear ? (
          <Input.ClearButton
            size={size}
            {...clearButtonProps}
            onPress={() => controller.clear()}
            onPressIn={(event) => {
              // Web: keep focus on the segments instead of the clear button.
              if (hasPreventDefault(event)) {
                event.preventDefault();
              }
              clearButtonProps?.onPressIn?.(event);
            }}
          />
        ) : null}
      </TimePickerFieldFrame>
    );

    // Web-form parity: a single `<input type="hidden">` carrying the current time
    // string so a surrounding `<form>` submits it (empty string when cleared).
    // Web-guarded exactly like `HiddenDatesInput` — never a React-Native-illegal
    // host element on native. `hiddenInputProps` merges FIRST so the picker's own
    // `name`/`form`/`value`/`type` always win; passed through a precisely-typed
    // host-prop object cast to `Box`'s prop type (no `any`).
    let hiddenInput: React.ReactNode = null;
    if (isWeb && name) {
      const hostProps: object = {
        ...hiddenInputProps,
        render: "input",
        type: "hidden",
        name,
        form,
        value: controller.hiddenInputValue,
        readOnly: true,
        tabIndex: -1,
        "aria-hidden": true,
      };
      hiddenInput = <Box {...(hostProps as GetProps<typeof Box>)} />;
    }

    const dropdown = presets ? (
      <TimePresets
        value={controller.hiddenInputValue}
        onChange={controller.setTimeString}
        format={format}
        presets={presets}
        amPmLabels={amPmLabels}
        withSeconds={withSeconds}
        maxHeight={maxDropdownContentHeight}
        size={size}
        scrollAreaProps={scrollAreaProps}
      />
    ) : (
      <Box flexDirection="row" gap="$xs" {...s.get("dropdown")}>
        <TimeControlsList
          min={format === "12h" ? 1 : 0}
          max={format === "12h" ? 12 : 23}
          step={hoursStep}
          value={controller.values.hours}
          onSelect={controller.setHours}
          reversed={reverseTimeControlsList}
          maxHeight={maxDropdownContentHeight}
          size={size}
          scrollAreaProps={scrollAreaProps}
        />
        <TimeControlsList
          min={0}
          max={59}
          step={minutesStep}
          value={controller.values.minutes}
          onSelect={controller.setMinutes}
          reversed={reverseTimeControlsList}
          maxHeight={maxDropdownContentHeight}
          size={size}
          scrollAreaProps={scrollAreaProps}
        />
        {withSeconds ? (
          <TimeControlsList
            min={0}
            max={59}
            step={secondsStep}
            value={controller.values.seconds}
            onSelect={controller.setSeconds}
            reversed={reverseTimeControlsList}
            maxHeight={maxDropdownContentHeight}
            size={size}
            scrollAreaProps={scrollAreaProps}
          />
        ) : null}
        {format === "12h" ? (
          <AmPmControlsList
            labels={amPmLabels}
            value={controller.values.amPm}
            onSelect={controller.setAmPm}
            size={size}
          />
        ) : null}
      </Box>
    );

    return (
      <Input.Wrapper
        id={hoursInputId}
        label={label}
        description={description}
        error={error}
        required={required}
        size={size}
        styles={pick<TimePickerStyles, InputWrapperSlots>(styles, TIME_PICKER_WRAPPER_SLOT_KEYS)}
      >
        <Popover
          position="bottom-start"
          trapFocus={false}
          {...popoverProps}
          opened={dropdownOpened}
          disabled={dropdownDisabled || popoverProps?.disabled}
          onChange={(opened) => {
            popoverProps?.onChange?.(opened);
            if (opened) {
              dropdownHandlers.open();
            } else {
              clampCurrentValue();
              dropdownHandlers.close();
            }
          }}
        >
          <Popover.Target withPressToggle={false}>{fieldFrame}</Popover.Target>
          <Popover.Dropdown
            onPressIn={(event) => {
              if (hasPreventDefault(event)) {
                event.preventDefault();
              }
            }}
          >
            {dropdown}
          </Popover.Dropdown>
        </Popover>
        {hiddenInput}
      </Input.Wrapper>
    );
  },
);

TimePickerComponent.displayName = "@knitui/dates/TimePicker";

// ── 14. Public surface ─────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled `Field` frame so consumers can target/
// extend it (`styled(TimePicker.Field, …)`) — the single source of truth for the
// bordered field row. The segment/list/preset leaves are their own exported
// components (`SpinInput`/`AmPmInput`/`TimeControlsList`/`TimePresets`) targeted via
// the `xxxInputProps` passthroughs and the `styles` sugar, so they aren't re-hung
// here.
export const TimePicker = withStaticProperties(TimePickerComponent, {
  Field: TimePickerFieldFrame,
});
