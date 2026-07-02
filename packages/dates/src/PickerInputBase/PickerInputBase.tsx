// ───────────────────────────────────────────────────────────────────────────
// PickerInputBase — the shared TRIGGER CHROME every `*PickerInput`
// (`DatePickerInput` / `MonthPickerInput` / `YearPickerInput`) wraps. The
// `any`-free, cross-platform port of `@mantine/dates`' `PickerInputBase` (its
// styles-api, `.module.css` and `data-*` attributes dropped). Built on
// `@knitui/components` (`InputBase` trigger + `Popover`/`Modal` dropdown) +
// `@knitui/core` + the kit's `HiddenDatesInput`.
//
// Cross-platform: web + native from this single source. The trigger press is
// wired through `Popover.Target`'s cross-platform `onPress` (never a DOM
// `onClick`); the dropdown is a floating `Popover.Dropdown` or a centered
// `Modal`. No web-only API is reached.
//
// On the kit checklist (see `_reference/README.md`) this base owns the chrome it
// genuinely renders and DELEGATES the rest:
//   1  this provenance header.
//   7  per-slot `styles` sugar — `wrapper`/`input` forward into the `InputBase`
//      trigger, `dropdown` lands on the `Popover.Dropdown`; resolved through
//      `slotStyles().merge` so explicit `popoverProps`/`clearButtonProps`/inline
//      props beat the sugar. The calendar/cell slots live DOWNSTREAM in the
//      inline picker passed as `children`.
//  11  a11y is delegated to `InputBase` (label/description/error/required wiring,
//      web `aria-*` + native `accessibility*`); the trigger advertises its
//      popup role here.
//  12  interaction styling (`pointer` cursor, disabled state) is the `InputBase`
//      trigger's; `readOnly`/`disabled` keep the dropdown from opening.
//  13  a typed `forwardRef` forwards the ref to the trigger element (the
//      sibling-picker norm; `.styleable` is reserved for components that own a
//      styled Frame, which this shell does not).
//  15  COMPILER-SAFE show/hide: the dropdown body is mounted via a CONDITIONAL
//      SUBTREE (`!isModal ? <Popover.Dropdown>…`) and the picker children are
//      only rendered when the dropdown is open — never a dynamic
//      `opacity`/`display` style prop the Tamagui compiler could flatten.
// Sizing (3)/colors (4)/shared context (2)/marker slots (6) live downstream in
// the calendar parts and `InputBase`; re-declaring them here would reach no
// consumer.
//
// PRESERVED CORRECTNESS: the focus/press-driven `Popover.Target` wiring — the
// kit `Input` routes a readOnly trigger's press to the visible root frame
// (`referenceRefProp="rootRef"`) because a non-editable `TextInput` host can
// never be a touch target on Android (see the DateInput fix). Do not change it.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import {
  type Box,
  Input,
  InputBase,
  type InputClearButtonProps,
  type InputSize,
  type InputVariant,
  type InputWrapperSlots,
  Modal,
  type ModalProps,
  Popover,
  type PopoverDropdownProps,
  type PopoverProps,
} from "@knitui/components";
import { type GetProps, slotStyles, type SlotStyles, type TamaguiElement } from "@knitui/core";
import type { UseDisclosureHandlers } from "@knitui/hooks";

import { HiddenDatesInput, type HiddenDatesInputValue } from "../HiddenDatesInput";
import { hasPreventDefault } from "../internal/has-prevent-default";
import type { DatePickerType } from "../types";
import type { DateFormatter } from "../utils";

/** Dropdown rendering strategy: a floating `Popover` (default) or a centered `Modal`. */
export type PickerInputDropdownType = "popover" | "modal";

type PickerInputFrameProps = Omit<
  GetProps<typeof Box>,
  "value" | "defaultValue" | "onChange" | "children"
>;

/**
 * Per-slot `styles` sugar — a map from named slot to that part's props. Resolved
 * through `slotStyles().merge`, so the precedence is fixed in one place:
 * `defaults < styles[slot] < explicit per-part props the component sets`. The
 * trigger's field-chrome (label/description/error) is owned by `InputBase`, so
 * its own `InputWrapperSlots` map is forwarded straight through under the
 * `wrapper`/`input` keys; the `dropdown` slot lands on the `Popover.Dropdown`.
 * Cell/calendar styling lives DOWNSTREAM in the inline picker `children`.
 */
export interface PickerInputBaseStyles {
  /** Props for the trigger's outer field column (`Input.Wrapper` frame). */
  wrapper?: InputWrapperSlots["wrapper"];
  /** Props for the trigger `Input` chrome (the `InputBase` frame + adornment props). */
  input?: GetProps<typeof InputBase>;
  /** Props for the `Popover.Dropdown` that holds the inline picker (ignored for `dropdownType='modal'`). */
  dropdown?: PopoverDropdownProps;
}

const PICKER_INPUT_BASE_SLOT_KEYS = [
  "wrapper",
  "input",
  "dropdown",
] as const satisfies readonly (keyof PickerInputBaseStyles)[];

export interface PickerInputBaseProps extends PickerInputFrameProps {
  /** The inline picker rendered inside the dropdown. */
  children: React.ReactNode;

  /** Value displayed in the trigger (placeholder shows when empty). */
  formattedValue: string | null | undefined;

  /** Whether the dropdown is open (owned by `useDatesInput`). */
  dropdownOpened: boolean;

  /** Open/close/toggle handlers for the dropdown (from `useDatesInput`/`useDisclosure`). */
  dropdownHandlers: UseDisclosureHandlers;

  /** Value forwarded to the hidden form field. */
  value: HiddenDatesInputValue;

  /** Picker selection mode. */
  type: DatePickerType;

  /** Reset the value to empty (drives the clear button). */
  onClear: () => void;

  /**
   * Called when the dropdown closes, after the incomplete-range reset. Lets a
   * wrapper run extra close-time logic (e.g. `DateTimePicker`'s min/max clamp).
   */
  onDropdownClose?: () => void;

  /** Whether the clear button should be shown (a value is present and `clearable`). */
  shouldClear: boolean;

  /** Serialize the hidden field value with time. @default false */
  withTime?: boolean;

  /**
   * Stop the dropdown's Escape/dismiss key from bubbling to an outer picker.
   * Reserved for the nested `DateTimePicker` case; a web-only refinement, no-op
   * in v1.
   */
  __stopPropagation?: boolean;

  /** Whether the picker opens in a floating `Popover` or a centered `Modal`. @default 'popover' */
  dropdownType?: PickerInputDropdownType;

  /** Input placeholder shown when there is no value. */
  placeholder?: string;

  /** Prevent the value from being changed by the user (the dropdown stays closed). */
  readOnly?: boolean;

  /** Disable the trigger. */
  disabled?: boolean;

  /** Show a clear button in the right section when the field has a value. @default false */
  clearable?: boolean;

  /** Props passed to the clear button. */
  clearButtonProps?: InputClearButtonProps;

  /** Props passed to the `Popover`. */
  popoverProps?: Partial<Omit<PopoverProps, "children">>;

  /**
   * Props passed to the `Modal` when `dropdownType="modal"` (ignored for the
   * `popover` dropdown). Spread before the component's own `opened`/`onClose`/
   * `title`, so those always win; the `withCloseButton={false}` default is
   * overridable via `modalProps.withCloseButton`.
   */
  modalProps?: Partial<Omit<ModalProps, "children">>;

  /** Visual variant of the input chrome (`default`/`filled`/`unstyled`). @default 'default' */
  variant?: InputVariant;

  /** Form field name forwarded to the hidden input. */
  name?: string;

  /** Associated `<form>` id forwarded to the hidden input. */
  form?: string;

  /** Trigger size (Input scale). @default 'sm' */
  size?: InputSize;

  /** Field label rendered above the trigger. */
  label?: React.ReactNode;

  /** Description rendered below the label. */
  description?: React.ReactNode;

  /** Error message / state. */
  error?: React.ReactNode;

  /** Mark the field as required (adds the asterisk to the label). */
  required?: boolean;

  /**
   * Per-slot style sugar — props spread onto the matching composed part
   * (`wrapper`/`input`/`dropdown`). Sits UNDER the explicit per-part props
   * (`popoverProps`/`clearButtonProps`/inline trigger props), which always win.
   */
  styles?: SlotStyles<PickerInputBaseStyles>;
}

/**
 * Box frame props the input-trigger wrappers expose, omitting the value/state
 * keys plus the `size`/`onMouseLeave` keys the inline pickers re-declare
 * cross-platform — so a wrapper can extend both this and a picker's
 * `*PickerBaseProps` without a property clash.
 */
type DateInputSharedFrameProps = Omit<
  GetProps<typeof Box>,
  "value" | "defaultValue" | "onChange" | "children" | "size" | "onMouseLeave"
>;

/**
 * The trigger/display surface every `*PickerInput` wrapper re-exposes — the
 * {@link PickerInputBaseProps} display props (minus the state-driven fields
 * `useDatesInput` owns: `children`/`formattedValue`/`dropdownOpened`/
 * `dropdownHandlers`/`value`/`type`/`onClear`/`shouldClear`) — plus the
 * `useDatesInput` knobs (`closeOnChange`/`sortDates`/`labelSeparator`/
 * `valueFormatter`). The `any`-free port of Mantine's `DateInputSharedProps`,
 * with its styles-api / DOM bits dropped. `size` is intentionally omitted here so
 * each wrapper can narrow it to the picker's `CalendarSize`.
 */
export interface DateInputSharedProps
  extends
    DateInputSharedFrameProps,
    Pick<
      PickerInputBaseProps,
      | "withTime"
      | "__stopPropagation"
      | "dropdownType"
      | "onDropdownClose"
      | "placeholder"
      | "readOnly"
      | "disabled"
      | "clearable"
      | "clearButtonProps"
      | "popoverProps"
      | "modalProps"
      | "variant"
      | "name"
      | "form"
      | "label"
      | "description"
      | "error"
      | "required"
    > {
  /** Close the dropdown when the value changes (not applicable to `multiple`). @default true */
  closeOnChange?: boolean;

  /** Sort the selected dates before `onChange` — `multiple` only. @default true */
  sortDates?: boolean;

  /** Separator rendered between the two dates of a range value. */
  labelSeparator?: string;

  /** Format the selected dates into the trigger string (defaults by picker type). */
  valueFormatter?: DateFormatter;
}

/**
 * `PickerInputBase` — the shared trigger shell every `*PickerInput` wraps. The
 * `any`-free, cross-platform port of Mantine's `PickerInputBase` (its styles-api,
 * `.module.css` and `data-*` attributes dropped).
 *
 * Renders an `InputBase` trigger (showing `formattedValue` or the placeholder)
 * inside a `Popover` whose dropdown holds the inline picker `children`. Pressing
 * the trigger toggles the dropdown via `Popover.Target` (cross-platform `onPress`,
 * never a DOM `onClick`); `readOnly`/`disabled` disable the popover so it can't
 * open. A clear button appears in the right section when `clearable && shouldClear`
 * and calls `onClear`. `HiddenDatesInput` carries the value for web `<form>`
 * submission (a no-op on native). Accent comes from the active Tamagui theme.
 *
 * `dropdownType: 'modal'` keeps the same `InputBase` trigger (its press still
 * toggles `dropdownOpened` through the `Popover.Target` wiring) but presents the
 * picker `children` inside a kit `Modal` instead of a `Popover.Dropdown`; the
 * incomplete-range reset (`handleClose`) runs on close in both branches.
 */
export const PickerInputBase = React.forwardRef<TamaguiElement, PickerInputBaseProps>(
  function PickerInputBase(props, ref) {
    const {
      children,
      formattedValue,
      dropdownOpened,
      dropdownHandlers,
      value,
      type,
      onClear,
      onDropdownClose,
      shouldClear,
      withTime,
      __stopPropagation,
      dropdownType = "popover",
      placeholder,
      readOnly,
      disabled,
      clearable = false,
      clearButtonProps,
      popoverProps,
      modalProps,
      variant,
      name,
      form,
      size = "sm",
      label,
      description,
      error,
      required,
      styles,
      ...others
    } = props;

    // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
    //    `merge` spreads the slot sugar UNDER the explicit per-part props, so
    //    explicit always beats sugar.
    const s = slotStyles<PickerInputBaseStyles>(
      styles,
      PICKER_INPUT_BASE_SLOT_KEYS,
      "PickerInputBase",
    );

    // `__stopPropagation`/`withTime` of the dropdown are handled elsewhere; keep
    // them referenced so the destructure stays exhaustive without leaking onto
    // the frame.
    void __stopPropagation;

    // On close, an incomplete range (start without end) is reset — mirrors
    // Mantine so a half-picked range doesn't persist.
    const handleClose = React.useCallback(() => {
      const arrayValue = Array.isArray(value) ? value : null;
      const isInvalidRange = type === "range" && !!arrayValue && !!arrayValue[0] && !arrayValue[1];

      if (isInvalidRange) {
        onClear();
      }

      onDropdownClose?.();
      dropdownHandlers.close();
    }, [value, type, onClear, onDropdownClose, dropdownHandlers]);

    const clearButton =
      clearable && shouldClear && !readOnly && !disabled ? (
        <Input.ClearButton
          size={size}
          {...clearButtonProps}
          onPress={onClear}
          onPressIn={(event) => {
            // Web: stop the press from stealing focus from / re-triggering the
            // trigger. No-op on native (no `preventDefault`).
            if (hasPreventDefault(event)) {
              event.preventDefault();
            }
            clearButtonProps?.onPressIn?.(event);
          }}
        />
      ) : null;

    const isModal = dropdownType === "modal";

    return (
      <>
        <Popover
          position="bottom-start"
          {...popoverProps}
          opened={dropdownOpened}
          disabled={popoverProps?.disabled || readOnly || disabled}
          onChange={(opened) => {
            popoverProps?.onChange?.(opened);
            if (opened) {
              dropdownHandlers.open();
            } else {
              handleClose();
            }
          }}
        >
          {/* `referenceRefProp="rootRef"`: anchor + measure the dropdown against
              the VISIBLE field frame, not the inner input the child's own `ref`
              points at (which is inset by sections/padding). The default press
              toggle stays on — on native the kit `Input` routes a readOnly
              trigger's press to that same root frame, since the non-editable
              TextInput host itself can never be a touch target on Android. */}
          <Popover.Target referenceRefProp="rootRef">
            <InputBase
              // 7. `input`/`wrapper` slot sugar sits UNDER the explicit props the
              //    component sets and the inline frame props in `others` (both
              //    spread after), so explicit always beats sugar.
              {...s.get("input")}
              {...others}
              ref={ref}
              size={size}
              variant={variant}
              label={label}
              description={description}
              error={error}
              required={required}
              disabled={disabled}
              readOnly
              pointer
              placeholder={placeholder}
              value={formattedValue ?? ""}
              // 11. The trigger advertises its popup + open state (web aria; inert
              //     strings on native). label/description/error/required a11y is
              //     wired by `InputBase` itself.
              aria-haspopup="dialog"
              aria-expanded={dropdownOpened}
              styles={s.get("wrapper") ? { wrapper: s.get("wrapper") } : undefined}
              __clearSection={clearButton}
              __clearable={Boolean(clearButton)}
            />
          </Popover.Target>

          {/* 15. COMPILER-SAFE show/hide: the dropdown body is a CONDITIONAL
              SUBTREE — never a dynamic `opacity`/`display` style prop. In `modal`
              mode the picker lives in the `Modal` below; the (empty) Popover
              stays mounted only so its `Popover.Target` keeps wiring the trigger
              press to `dropdownOpened`. */}
          {!isModal ? <Popover.Dropdown {...s.get("dropdown")}>{children}</Popover.Dropdown> : null}
        </Popover>

        {/* `!readOnly`: a read-only picker can't open the modal (mirrors the
            Popover-path `disabled` guard above, and Mantine `:147`).
            `withCloseButton={false}` is the Mantine default (`:151`); placed
            BEFORE the `{...modalProps}` spread so a caller can override it,
            while `opened`/`onClose`/`title` come AFTER so the component's own
            control always wins. */}
        {isModal && !readOnly ? (
          <Modal
            withCloseButton={false}
            {...modalProps}
            opened={dropdownOpened}
            onClose={handleClose}
            title={label}
          >
            {children}
          </Modal>
        ) : null}

        <HiddenDatesInput value={value} type={type} name={name} form={form} withTime={withTime} />
      </>
    );
  },
);

PickerInputBase.displayName = "@knitui/dates/PickerInputBase";
