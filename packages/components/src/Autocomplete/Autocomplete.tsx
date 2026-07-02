import * as React from "react";

import { withStaticProperties } from "@knitui/core";
import { useId, useUncontrolled } from "@knitui/hooks";

import {
  Combobox,
  type ComboboxClearButtonProps,
  type ComboboxData,
  type ComboboxDropdownProps,
  type ComboboxEmptyProps,
  type ComboboxGroupProps,
  type ComboboxOptionProps,
  type ComboboxProps,
  type ComboboxRenderOption,
  type ComboboxSize,
  composeTriggerRightSection,
  defaultOptionsFilter,
  flattenComboboxOptions,
  getParsedComboboxData,
  type OptionsDropdownProps,
  type OptionsFilter,
  useCombobox,
} from "../Combobox";
import { INPUT_WRAPPER_SLOTS, type InputWrapperSlots } from "../Input/shared";
import { InputBase, type InputBaseProps } from "../InputBase";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";

// `filter` is Omit-ed so Mantine's options-`filter` prop (an `OptionsFilter` fn) can
// take that public name — the inherited CSS `filter` style prop would otherwise collide.
type AutocompleteInputProps = Omit<
  InputBaseProps,
  "value" | "defaultValue" | "onChange" | "size" | "filter"
>;

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`), keyed 1:1 with the
 * Autocomplete part surface. Each key maps to the props of the part it targets, so
 * `styles={{ option: { bg: "$color3" } }}` is sugar for
 * `<Autocomplete.Option bg="$color3" />`.
 *
 * Autocomplete has no chevron part (free-text field, not a select trigger), so the
 * map intentionally omits a `chevron` slot.
 */
export interface AutocompleteStyles {
  /** Props for the state-machine root (`Autocomplete.Root` → `<Combobox>`). */
  root?: Partial<ComboboxProps>;
  /** Props for the field trigger (`Autocomplete.Trigger` → `InputBase`). */
  trigger?: Partial<AutocompleteInputProps>;
  /** Props for the floating surface (`Autocomplete.Dropdown`). */
  dropdown?: Partial<ComboboxDropdownProps>;
  /** Props for the listbox body (`Autocomplete.Options`). */
  options?: Partial<OptionsDropdownProps>;
  /** Props for each suggestion row (`Autocomplete.Option`). */
  option?: Partial<ComboboxOptionProps>;
  /** Props for a suggestion group (`Autocomplete.Group`). */
  group?: Partial<ComboboxGroupProps>;
  /** Props for the empty state (`Autocomplete.Empty`). */
  empty?: Partial<ComboboxEmptyProps>;
  /** Props for the clear button (`Autocomplete.ClearButton`). */
  clearButton?: Partial<ComboboxClearButtonProps>;
}

const AUTOCOMPLETE_SLOT_KEYS = [
  "root",
  "trigger",
  "dropdown",
  "options",
  "option",
  "group",
  "empty",
  "clearButton",
] as const satisfies readonly (keyof AutocompleteStyles)[];

/* -------------------------------------------------------------------------- */
/* Root context                                                               */
/* -------------------------------------------------------------------------- */

interface AutocompleteContextValue {
  /** The shared combobox store (open state + keyboard target). */
  combobox: ReturnType<typeof useCombobox>;
  size: ComboboxSize;
  disabled?: boolean;
  readOnly?: boolean;
  /** The current free-text value (the input value IS the value). */
  value: string;
  /** Already-filtered parsed data for the dropdown. */
  filtered: ReturnType<typeof getParsedComboboxData>;
  /** The keyboard-highlighted value. */
  activeValue: string | null;
  /** id wiring `aria-controls` (trigger) ↔ the dropdown surface. */
  dropdownId: string;
  /** Whether the clear button may be shown. */
  canClear: boolean;
  nothingFoundMessage?: React.ReactNode;
  withScrollArea: boolean;
  maxDropdownHeight: number;
  renderOption?: ComboboxRenderOption;
  /** Per-slot style sugar shared down to the parts. */
  styles?: SlotStyles<AutocompleteStyles>;
  /** Deprecated alias merged over the `clearButton` slot. */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** Trigger props the sugar wrapper assembled (chrome, aria, handlers). */
  triggerProps?: Partial<AutocompleteInputProps> & {
    placeholder?: React.ReactNode;
    id?: string;
    ref?: React.Ref<AutocompleteRef>;
    clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  };
  // Event/behaviour handlers consumed by Autocomplete.Trigger.
  onClear: () => void;
  onChangeText: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onClick: React.MouseEventHandler<HTMLInputElement>;
}

const AutocompleteContext = React.createContext<AutocompleteContextValue | null>(null);

const useAutocompleteContext = (): AutocompleteContextValue => {
  const ctx = React.useContext(AutocompleteContext);
  if (!ctx) {
    throw new Error("Autocomplete compound components must be rendered inside <Autocomplete.Root>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* Autocomplete.Root — the free-text + suggestion state machine               */
/* -------------------------------------------------------------------------- */

export interface AutocompleteRootProps {
  /** `Autocomplete.Trigger` + `Autocomplete.Dropdown`. */
  children?: React.ReactNode;
  /** Suggestions to render. Strings, `{ value, label, disabled }`, or groups. */
  data?: ComboboxData;
  /** Controlled input value (the free text). */
  value?: string;
  /** Uncontrolled initial input value. */
  defaultValue?: string;
  /** Called when the input value changes. */
  onChange?: (value: string) => void;
  /** Called when a suggestion is submitted. */
  onOptionSubmit?: (value: string) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Open the dropdown when the input receives focus. @default true */
  openOnFocus?: boolean;
  /** Highlight the first matching suggestion after each input change. @default false */
  selectFirstOptionOnChange?: boolean;
  /** Commit the highlighted suggestion when the input loses focus. @default false */
  autoSelectOnBlur?: boolean;
  /** Show a clear button when the input has a value. @default false */
  clearable?: boolean;
  /** Message shown when no suggestion matches. */
  nothingFoundMessage?: React.ReactNode;
  /** Control size. @default 'md' */
  size?: ComboboxSize;
  /** Maximum number of suggestions displayed. @default Infinity */
  limit?: number;
  /** Custom options filter. @default a case-insensitive label substring match. */
  filter?: OptionsFilter;
  /** Custom suggestion content. Receives `{ option, checked }`. */
  renderOption?: ComboboxRenderOption;
  /** Max dropdown height in px before scrolling. @default 250 */
  maxDropdownHeight?: number;
  /** Wrap suggestions in a `ScrollArea.Autosize`. @default true */
  withScrollArea?: boolean;
  /** Controlled dropdown opened state. */
  dropdownOpened?: boolean;
  /** Uncontrolled initial dropdown opened state. */
  defaultDropdownOpened?: boolean;
  /** Called when the dropdown opens. */
  onDropdownOpen?: () => void;
  /** Called when the dropdown closes. */
  onDropdownClose?: () => void;
  /** Disable the control. */
  disabled?: boolean;
  /** Render the control read-only. */
  readOnly?: boolean;
  /** Forwarded to `aria-controls`/the dropdown id when set. */
  id?: string;
  /** Per-slot style sugar — shared to the parts. */
  styles?: SlotStyles<AutocompleteStyles>;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /**
   * @deprecated Use `styles={{ clearButton: … }}` (or render `<Autocomplete.ClearButton>`
   * directly). Merged OVER the `clearButton` slot.
   */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /**
   * Trigger props assembled by the sugar `<Autocomplete>` wrapper (field chrome,
   * aria, event handlers, ref). Not part of the public composable API — when
   * composing by hand you render `<Autocomplete.Trigger>` with your own props.
   * @internal
   */
  __triggerProps?: AutocompleteContextValue["triggerProps"];
}

function AutocompleteRoot(props: AutocompleteRootProps) {
  const {
    children,
    data,
    value,
    defaultValue,
    onChange,
    onOptionSubmit,
    onClear,
    openOnFocus = true,
    selectFirstOptionOnChange = false,
    autoSelectOnBlur = false,
    clearable = false,
    nothingFoundMessage,
    size = "md",
    limit,
    filter,
    renderOption,
    maxDropdownHeight = 250,
    withScrollArea = true,
    dropdownOpened,
    defaultDropdownOpened,
    onDropdownOpen,
    onDropdownClose,
    disabled,
    readOnly,
    id,
    styles,
    comboboxProps,
    clearButtonProps,
    __triggerProps,
  } = props;

  const dropdownId = useId(id ? `${id}-dropdown` : undefined);

  const [_value, setValueState] = useUncontrolled<string>({
    value,
    defaultValue,
    finalValue: "",
  });
  const setValue = React.useCallback(
    (next: string) => {
      setValueState(next);
      onChange?.(next);
    },
    [setValueState, onChange],
  );

  const parsed = React.useMemo(() => getParsedComboboxData(data), [data]);
  const filterFn = filter ?? defaultOptionsFilter;
  const filtered = React.useMemo(
    () => filterFn({ options: parsed, search: _value, limit: limit ?? Number.POSITIVE_INFINITY }),
    [filterFn, parsed, _value, limit],
  );
  const flatOptions = React.useMemo(
    () => flattenComboboxOptions(filtered).filter((option) => !option.disabled),
    [filtered],
  );

  const combobox = useCombobox({
    opened: dropdownOpened,
    defaultOpened: defaultDropdownOpened,
    onDropdownOpen,
    onDropdownClose,
  });

  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  // Set on a user-typed change so the next `flatOptions` recompute highlights the
  // first match (Mantine's `selectFirstOptionOnChange`); a ref avoids racing the
  // filter memo and scopes the behaviour to actual input changes.
  const selectFirstPending = React.useRef(false);

  React.useEffect(() => {
    if (combobox.opened) {
      setActiveValue(flatOptions[0]?.value ?? null);
    }
  }, [combobox.opened]); // eslint-disable-line react-hooks/exhaustive-deps

  // After a user-typed change, highlight the first match.
  React.useEffect(() => {
    if (selectFirstPending.current) {
      selectFirstPending.current = false;
      setActiveValue(flatOptions[0]?.value ?? null);
    }
  }, [flatOptions]);

  const handleSubmit = React.useCallback(
    (optionValue: string) => {
      setValue(optionValue);
      onOptionSubmit?.(optionValue);
      combobox.closeDropdown();
    },
    [setValue, onOptionSubmit, combobox],
  );

  const moveActive = (direction: 1 | -1) => {
    if (flatOptions.length === 0) return;
    const index = flatOptions.findIndex((option) => option.value === activeValue);
    const nextIndex =
      index === -1
        ? direction === 1
          ? 0
          : flatOptions.length - 1
        : (index + direction + flatOptions.length) % flatOptions.length;
    setActiveValue(flatOptions[nextIndex].value);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled || readOnly) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (combobox.opened) {
          moveActive(1);
        } else {
          combobox.openDropdown();
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (combobox.opened) {
          moveActive(-1);
        } else {
          combobox.openDropdown();
        }
        break;
      case "Enter":
        if (combobox.opened && activeValue != null) {
          event.preventDefault();
          handleSubmit(activeValue);
        }
        break;
      case "Escape":
        combobox.closeDropdown();
        break;
      default:
        break;
    }
    __triggerProps?.onKeyDown?.(event);
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setValue(event.currentTarget.value);
    combobox.openDropdown();
    if (selectFirstOptionOnChange) selectFirstPending.current = true;
  };

  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (event) => {
    if (openOnFocus) combobox.openDropdown();
    __triggerProps?.onFocus?.(event);
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
    if (autoSelectOnBlur && combobox.opened && activeValue != null) {
      // Commit the highlighted suggestion; handleSubmit fills the input + closes.
      handleSubmit(activeValue);
    } else {
      combobox.closeDropdown();
    }
    __triggerProps?.onBlur?.(event);
  };

  const handleClick: React.MouseEventHandler<HTMLInputElement> = (event) => {
    // Clicking the input is the usual way to focus it, so gate it on the same
    // flag as focus — otherwise `openOnFocus={false}` (open-on-type only) is
    // defeated by the click that focuses the field.
    if (openOnFocus) combobox.openDropdown();
    __triggerProps?.onClick?.(event);
  };

  const handleClear = React.useCallback(() => {
    setValue("");
    onClear?.();
  }, [setValue, onClear]);

  const canClear = clearable && _value !== "" && !disabled && !readOnly;

  const ctx = React.useMemo<AutocompleteContextValue>(
    () => ({
      combobox,
      size,
      disabled,
      readOnly,
      value: _value,
      filtered,
      activeValue,
      dropdownId,
      canClear,
      nothingFoundMessage,
      withScrollArea,
      maxDropdownHeight,
      renderOption,
      styles,
      clearButtonProps,
      triggerProps: __triggerProps,
      onClear: handleClear,
      onChangeText: handleChange,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onClick: handleClick,
    }),
    // handlers are recreated each render (they close over render-scoped state); the
    // context value is intentionally not stable, mirroring the original component.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      combobox,
      size,
      disabled,
      readOnly,
      _value,
      filtered,
      activeValue,
      dropdownId,
      canClear,
      nothingFoundMessage,
      withScrollArea,
      maxDropdownHeight,
      renderOption,
      styles,
      clearButtonProps,
      __triggerProps,
    ],
  );

  const s = slotStyles<AutocompleteStyles>(styles, AUTOCOMPLETE_SLOT_KEYS, "Autocomplete");

  return (
    <AutocompleteContext.Provider value={ctx}>
      <Combobox
        position="bottom"
        width="target"
        // Deprecated `comboboxProps` alias merged OVER the `root` slot sugar
        // ("explicit beats sugar").
        {...s.merge("root", comboboxProps)}
        store={combobox}
        onOptionSubmit={handleSubmit}
        size={size}
      >
        {children}
      </Combobox>
    </AutocompleteContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Autocomplete.Trigger — the InputBase-as-combobox target                    */
/* -------------------------------------------------------------------------- */

export interface AutocompleteTriggerProps extends Partial<AutocompleteInputProps> {
  /** Single-element ref to the inner input. */
  ref?: React.Ref<AutocompleteRef>;
}

const AutocompleteTrigger = React.forwardRef<AutocompleteRef, AutocompleteTriggerProps>(
  function AutocompleteTrigger(props, ref) {
    const ctx = useAutocompleteContext();
    const s = slotStyles<AutocompleteStyles>(ctx.styles, AUTOCOMPLETE_SLOT_KEYS, "Autocomplete");

    // The sugar `<Autocomplete>` wrapper funnels its chrome props + ref through
    // context so a composable caller (`<Autocomplete.Trigger placeholder=… />`) and
    // the sugar caller resolve to the same trigger. Explicit props on
    // `<Autocomplete.Trigger>` win over the funneled ones, which in turn win over
    // the `trigger` slot sugar.
    const funneled = ctx.triggerProps ?? {};
    const {
      placeholder: funneledPlaceholder,
      id: funneledId,
      ref: funneledRef,
      clearSectionMode,
      rightSection: funneledRightSection,
      rightSectionPointerEvents: funneledRightSectionPointerEvents,
      ...funneledRest
    } = funneled;

    const {
      id = funneledId,
      placeholder = funneledPlaceholder,
      rightSection = funneledRightSection,
      rightSectionPointerEvents = funneledRightSectionPointerEvents,
      ...rest
    } = props;

    const mergedRef = ref ?? funneledRef;

    // Pure composition of the clear button into the trigger's right section — no
    // longer riding InputBase's private `__clearSection` channel.
    // `composeTriggerRightSection` owns the `clearSectionMode` coexistence math
    // (Autocomplete has no chevron, so the clear button is the only adornment).
    const clearButton = (
      <Combobox.ClearButton
        // Deprecated `clearButtonProps` merged OVER the `clearButton` slot sugar.
        {...s.merge("clearButton", ctx.clearButtonProps)}
        size={ctx.size}
        onClear={ctx.onClear}
      />
    );

    const composedRightSection = composeTriggerRightSection({
      rightSection,
      clearSection: clearButton,
      clearable: ctx.canClear,
      mode: clearSectionMode,
    });

    return (
      <Combobox.Target>
        <InputBase
          // `trigger` slot sugar is the LOWEST precedence.
          {...s.get("trigger")}
          {...funneledRest}
          {...rest}
          ref={mergedRef}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={ctx.dropdownId}
          aria-expanded={ctx.combobox.opened}
          size={ctx.size}
          disabled={ctx.disabled}
          readOnly={ctx.readOnly}
          placeholder={placeholder}
          value={ctx.value}
          onChange={ctx.onChangeText}
          onFocus={ctx.onFocus}
          onBlur={ctx.onBlur}
          onClick={ctx.onClick}
          onKeyDown={ctx.onKeyDown}
          rightSection={composedRightSection.node}
          rightSectionPointerEvents={
            composedRightSection.pointerEvents ?? rightSectionPointerEvents
          }
        />
      </Combobox.Target>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Autocomplete.Dropdown — the floating surface                               */
/* -------------------------------------------------------------------------- */

export interface AutocompleteDropdownProps extends ComboboxDropdownProps {}

const AutocompleteDropdown = React.forwardRef<
  React.ComponentRef<typeof Combobox.Dropdown>,
  AutocompleteDropdownProps
>(function AutocompleteDropdown(props, ref) {
  const ctx = useAutocompleteContext();
  const s = slotStyles<AutocompleteStyles>(ctx.styles, AUTOCOMPLETE_SLOT_KEYS, "Autocomplete");
  const { id = ctx.dropdownId, children, ...rest } = props;
  return (
    <Combobox.Dropdown ref={ref} id={id} {...s.get("dropdown")} {...rest}>
      {children ?? <AutocompleteOptions />}
    </Combobox.Dropdown>
  );
});

/* -------------------------------------------------------------------------- */
/* Autocomplete.Options — the listbox body (data OR children)                 */
/* -------------------------------------------------------------------------- */

export interface AutocompleteOptionsProps extends Partial<
  Omit<OptionsDropdownProps, "value" | "activeValue">
> {
  /** Render explicit suggestion children instead of the context `data`. */
  children?: React.ReactNode;
}

function AutocompleteOptions(props: AutocompleteOptionsProps) {
  const ctx = useAutocompleteContext();
  const s = slotStyles<AutocompleteStyles>(ctx.styles, AUTOCOMPLETE_SLOT_KEYS, "Autocomplete");
  const { children, data, ...rest } = props;

  // Explicit children replace the data-driven body (the composable path where the
  // caller maps `Autocomplete.Option`s themselves).
  if (children != null) {
    return <Combobox.Options>{children}</Combobox.Options>;
  }

  return (
    <Combobox.OptionsDropdown
      // `options` slot sugar UNDER explicit props.
      {...s.get("options")}
      data={data ?? ctx.filtered}
      value={ctx.value}
      activeValue={ctx.activeValue}
      // Free-text field: a suggestion isn't a strict selection, so no check icon.
      withCheckIcon={false}
      nothingFoundMessage={ctx.nothingFoundMessage}
      withScrollArea={ctx.withScrollArea}
      maxDropdownHeight={ctx.maxDropdownHeight}
      renderOption={ctx.renderOption}
      // The `option`/`group`/`empty` slots reach each rendered row through OptionsDropdown.
      optionProps={s.get("option")}
      groupProps={s.get("group")}
      emptyProps={s.get("empty")}
      {...rest}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Sugar wrapper — the backward-compatible <Autocomplete … /> prop API        */
/* -------------------------------------------------------------------------- */

export interface AutocompleteProps extends Omit<AutocompleteInputProps, "styles"> {
  /** Suggestions to render. Strings, `{ value, label, disabled }`, or groups. */
  data?: ComboboxData;
  /** Controlled input value (the free text). */
  value?: string;
  /** Uncontrolled initial input value. */
  defaultValue?: string;
  /** Called when the input value changes. */
  onChange?: (value: string) => void;
  /** Called when a suggestion is submitted. */
  onOptionSubmit?: (value: string) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Open the dropdown when the input receives focus. @default true */
  openOnFocus?: boolean;
  /** Highlight the first matching suggestion after each input change. @default false */
  selectFirstOptionOnChange?: boolean;
  /** Commit the highlighted suggestion when the input loses focus. @default false */
  autoSelectOnBlur?: boolean;
  /** Show a clear button when the input has a value. @default false */
  clearable?: boolean;
  /** Props forwarded to the internal clear `Combobox.ClearButton`. */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** How the clear button and right section coexist. @default 'both' */
  clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  /** Message shown when no suggestion matches. */
  nothingFoundMessage?: React.ReactNode;
  /** Control size. @default 'md' */
  size?: ComboboxSize;
  /** Maximum number of suggestions displayed. @default Infinity */
  limit?: number;
  /** Custom options filter. @default a case-insensitive label substring match. */
  filter?: OptionsFilter;
  /** Custom suggestion content. Receives `{ option, checked }`. */
  renderOption?: ComboboxRenderOption;
  /** Max dropdown height in px before scrolling. @default 250 */
  maxDropdownHeight?: number;
  /** Wrap suggestions in a `ScrollArea.Autosize`. @default true */
  withScrollArea?: boolean;
  /** Controlled dropdown opened state. */
  dropdownOpened?: boolean;
  /** Uncontrolled initial dropdown opened state. */
  defaultDropdownOpened?: boolean;
  /** Called when the dropdown opens. */
  onDropdownOpen?: () => void;
  /** Called when the dropdown closes. */
  onDropdownClose?: () => void;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /** Per-slot style sugar — props spread onto the matching part. */
  styles?: SlotStyles<AutocompleteStyles>;
}

export type AutocompleteRef = React.ComponentRef<typeof InputBase>;

/**
 * Free-text input with a suggestion dropdown — mirrors Mantine's `Autocomplete`,
 * built on `Combobox` + `InputBase`. The input value IS the typed text;
 * suggestions filter by it and selecting one fills the input. This prop API is
 * sugar that renders the composable parts (`Autocomplete.Root` /
 * `Autocomplete.Trigger` / `Autocomplete.Dropdown` / `Autocomplete.Options`); it
 * contains no behavior the parts lack. Accent comes from the Tamagui `theme` prop +
 * palette ramp, never a Mantine `color` prop. Keyboard navigation is web-only (same
 * documented gap as `Menu`/`Select`).
 */
const AutocompleteComponent = React.forwardRef<AutocompleteRef, AutocompleteProps>(
  function Autocomplete(props, ref) {
    const {
      // Field-chrome / trigger props (everything that is NOT a Root behavior prop).
      clearSectionMode,
      placeholder,
      id,
      disabled,
      readOnly,
      styles,

      // Root behavior props.
      data,
      value,
      defaultValue,
      onChange,
      onOptionSubmit,
      onClear,
      openOnFocus = true,
      selectFirstOptionOnChange = false,
      autoSelectOnBlur = false,
      clearable = false,
      clearButtonProps,
      nothingFoundMessage,
      size = "md",
      limit,
      filter,
      renderOption,
      maxDropdownHeight = 250,
      withScrollArea = true,
      dropdownOpened,
      defaultDropdownOpened,
      onDropdownOpen,
      onDropdownClose,
      comboboxProps,

      ...inputProps
    } = props;

    // The remaining chrome props are funneled to `Autocomplete.Trigger` via Root
    // context so the sugar path and the composable path converge on the same trigger.
    const triggerProps: AutocompleteContextValue["triggerProps"] = {
      ...inputProps,
      placeholder,
      id,
      // Forward ONLY the field-chrome slots to the trigger's `Input.Wrapper`; the
      // dropdown/option/etc. slots stay with the parts that consume them, so
      // `Input.Wrapper` never dev-warns about slots it doesn't own.
      styles: pick<AutocompleteStyles, InputWrapperSlots>(styles, INPUT_WRAPPER_SLOTS),
      ref,
      // Controls how the clear button coexists with the trigger's right section.
      clearSectionMode,
    };

    return (
      <AutocompleteRoot
        data={data}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onOptionSubmit={onOptionSubmit}
        onClear={onClear}
        openOnFocus={openOnFocus}
        selectFirstOptionOnChange={selectFirstOptionOnChange}
        autoSelectOnBlur={autoSelectOnBlur}
        clearable={clearable}
        clearButtonProps={clearButtonProps}
        nothingFoundMessage={nothingFoundMessage}
        size={size}
        limit={limit}
        filter={filter}
        renderOption={renderOption}
        maxDropdownHeight={maxDropdownHeight}
        withScrollArea={withScrollArea}
        dropdownOpened={dropdownOpened}
        defaultDropdownOpened={defaultDropdownOpened}
        onDropdownOpen={onDropdownOpen}
        onDropdownClose={onDropdownClose}
        disabled={disabled}
        readOnly={readOnly}
        id={id}
        styles={styles}
        comboboxProps={comboboxProps}
        __triggerProps={triggerProps}
      >
        <AutocompleteTrigger />
        <AutocompleteDropdown />
      </AutocompleteRoot>
    );
  },
);

export const Autocomplete = withStaticProperties(AutocompleteComponent, {
  /** State machine: free-text value / suggestion filtering / active option + a11y. Renders `<Combobox>`. */
  Root: AutocompleteRoot,
  /** The field: `<Combobox.Target><InputBase/>`; owns `role="combobox"` + aria. */
  Trigger: AutocompleteTrigger,
  /** The floating surface (wraps `Combobox.Dropdown`). */
  Dropdown: AutocompleteDropdown,
  /** The listbox body — accepts `data` OR `Autocomplete.Option` children. */
  Options: AutocompleteOptions,
  /** Re-export of `Combobox.Option`. */
  Option: Combobox.Option,
  /** Re-export of `Combobox.Group`. */
  Group: Combobox.Group,
  /** Re-export of `Combobox.Empty`. */
  Empty: Combobox.Empty,
  /** Re-export of `Combobox.ClearButton`. */
  ClearButton: Combobox.ClearButton,
});
