import * as React from "react";

import type { GetProps } from "@knitui/core";
import { withStaticProperties } from "@knitui/core";
import { useId, useUncontrolled } from "@knitui/hooks";

import {
  Combobox,
  type ComboboxChevronProps,
  type ComboboxClearButtonProps,
  type ComboboxData,
  type ComboboxDropdownProps,
  type ComboboxEmptyProps,
  type ComboboxGroupProps,
  type ComboboxItem,
  type ComboboxOptionProps,
  type ComboboxProps,
  type ComboboxRenderOption,
  type ComboboxSize,
  composeTriggerRightSection,
  defaultOptionsFilter,
  flattenComboboxOptions,
  getOptionsLockup,
  getParsedComboboxData,
  type OptionsDropdownProps,
  type OptionsFilter,
  useCombobox,
} from "../Combobox";
import { INPUT_WRAPPER_SLOTS, type InputWrapperSlots } from "../Input/shared";
import { InputBase } from "../InputBase";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";

// `filter` is Omit-ed so Mantine's options-`filter` prop (an `OptionsFilter` fn) can
// take that public name — the inherited CSS `filter` style prop would otherwise
// collide (same pattern as `Indicator`'s `position` Omit).
type SelectInputProps = Omit<
  GetProps<typeof InputBase>,
  "value" | "defaultValue" | "onChange" | "size" | "filter"
>;

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`), keyed 1:1 with the Select
 * part surface. Each key maps to the props of the part it targets, so
 * `styles={{ option: { bg: "$color3" } }}` is sugar for
 * `<Select.Option bg="$color3" />`.
 */
export interface SelectStyles {
  /** Props for the state-machine root (`Select.Root` → `<Combobox>`). */
  root?: Partial<ComboboxProps>;
  /** Props for the field trigger (`Select.Trigger` → `InputBase`). */
  trigger?: Partial<SelectInputProps>;
  /** Props for the floating surface (`Select.Dropdown`). */
  dropdown?: Partial<ComboboxDropdownProps>;
  /** Props for the listbox body (`Select.Options`). */
  options?: Partial<OptionsDropdownProps>;
  /** Props for each option row (`Select.Option`). */
  option?: Partial<ComboboxOptionProps>;
  /** Props for an option group (`Select.Group`). */
  group?: Partial<ComboboxGroupProps>;
  /** Props for the empty state (`Select.Empty`). */
  empty?: Partial<ComboboxEmptyProps>;
  /** Props for the chevron (`Select.Chevron`). */
  chevron?: Partial<ComboboxChevronProps>;
  /** Props for the clear button (`Select.ClearButton`). */
  clearButton?: Partial<ComboboxClearButtonProps>;
}

const SELECT_SLOT_KEYS = [
  "root",
  "trigger",
  "dropdown",
  "options",
  "option",
  "group",
  "empty",
  "chevron",
  "clearButton",
] as const satisfies readonly (keyof SelectStyles)[];

/* -------------------------------------------------------------------------- */
/* Root context                                                               */
/* -------------------------------------------------------------------------- */

interface SelectContextValue {
  /** The shared combobox store (open state + keyboard target). */
  combobox: ReturnType<typeof useCombobox>;
  size: ComboboxSize;
  disabled?: boolean;
  readOnly?: boolean;
  searchable: boolean;
  /** The current committed value (single-select). */
  value: string | null;
  /** Text shown in the trigger input. */
  inputValue: string;
  /** Already-filtered parsed data for the dropdown. */
  filtered: ReturnType<typeof getParsedComboboxData>;
  /** The keyboard-highlighted value. */
  activeValue: string | null;
  /** id wiring `aria-controls` (trigger) ↔ the dropdown surface. */
  dropdownId: string;
  /** Whether the clear button may be shown. */
  canClear: boolean;
  /** Field-chrome options-dropdown rendering knobs. */
  withCheckIcon: boolean;
  checkIconPosition: "left" | "right";
  nothingFoundMessage?: React.ReactNode;
  withScrollArea: boolean;
  maxDropdownHeight: number;
  renderOption?: ComboboxRenderOption;
  /** Per-slot style sugar shared down to the parts. */
  styles?: SlotStyles<SelectStyles>;
  /** Deprecated alias merged over the `clearButton` slot. */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** Trigger props the sugar wrapper assembled (chrome, aria, handlers). */
  triggerProps?: Partial<SelectInputProps> & {
    role?: string;
    placeholder?: React.ReactNode;
    id?: string;
    ref?: React.Ref<SelectRef>;
    clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  };
  // Event/behaviour handlers consumed by Select.Trigger.
  onClear: () => void;
  onChangeText: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onClick: React.MouseEventHandler<HTMLInputElement>;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

const useSelectContext = (): SelectContextValue => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) {
    throw new Error("Select compound components must be rendered inside <Select.Root>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* Select.Root — the value / search / active-option state machine            */
/* -------------------------------------------------------------------------- */

export interface SelectRootProps {
  /** `Select.Trigger` + `Select.Dropdown`. */
  children?: React.ReactNode;
  /** Options to render. Strings, `{ value, label, disabled }`, or groups. */
  data?: ComboboxData;
  /** Controlled selected value. */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Called when the value changes with the value and its option (or `null`). */
  onChange?: (value: string | null, option: ComboboxItem | null) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Allow filtering options by typing. @default false */
  searchable?: boolean;
  /** Open the dropdown when the input receives focus (requires `searchable`). @default true */
  openOnFocus?: boolean;
  /** Highlight the first matching option after each search change. @default false */
  selectFirstOptionOnChange?: boolean;
  /** Commit the highlighted option when the input loses focus. @default false */
  autoSelectOnBlur?: boolean;
  /** Controlled search value. */
  searchValue?: string;
  /** Uncontrolled initial search value. */
  defaultSearchValue?: string;
  /** Called when the search value changes. */
  onSearchChange?: (value: string) => void;
  /** Allow deselecting by picking the selected option again. @default true */
  allowDeselect?: boolean;
  /** Show a clear button when a value is selected. @default false */
  clearable?: boolean;
  /** Show a check icon next to the selected option. @default true */
  withCheckIcon?: boolean;
  /** Side the check icon renders on. @default 'left' */
  checkIconPosition?: "left" | "right";
  /** Message shown when no option matches / data is empty. */
  nothingFoundMessage?: React.ReactNode;
  /** Control size. @default 'md' */
  size?: ComboboxSize;
  /** Maximum number of options displayed. @default Infinity */
  limit?: number;
  /** Custom options filter. @default a case-insensitive label substring match. */
  filter?: OptionsFilter;
  /** Custom option content. Receives `{ option, checked }`. */
  renderOption?: ComboboxRenderOption;
  /** Max dropdown height in px before scrolling. @default 250 */
  maxDropdownHeight?: number;
  /** Wrap options in a `ScrollArea.Autosize`. @default true */
  withScrollArea?: boolean;
  /** Controlled dropdown opened state. */
  dropdownOpened?: boolean;
  /** Uncontrolled initial dropdown opened state. */
  defaultDropdownOpened?: boolean;
  /** Called when the dropdown opens. */
  onDropdownOpen?: () => void;
  /** Called when the dropdown closes. */
  onDropdownClose?: () => void;
  /** Called when an option is submitted (before value changes). */
  onOptionSubmit?: (value: string) => void;
  /** Disable the control. */
  disabled?: boolean;
  /** Render the control read-only. */
  readOnly?: boolean;
  /** Forwarded to `aria-controls`/the dropdown id when set. */
  id?: string;
  /** Per-slot style sugar — shared to the parts. */
  styles?: SlotStyles<SelectStyles>;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /**
   * @deprecated Use `styles={{ clearButton: … }}` (or render `<Select.ClearButton>`
   * directly). Merged OVER the `clearButton` slot.
   */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /**
   * Trigger props assembled by the sugar `<Select>` wrapper (field chrome, aria,
   * event handlers, ref). Not part of the public composable API — when composing
   * by hand you render `<Select.Trigger>` with your own props instead.
   * @internal
   */
  __triggerProps?: SelectContextValue["triggerProps"];
}

function SelectRoot(props: SelectRootProps) {
  const {
    children,
    data,
    value,
    defaultValue,
    onChange,
    onClear,
    searchable = false,
    openOnFocus = true,
    selectFirstOptionOnChange = false,
    autoSelectOnBlur = false,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    allowDeselect = true,
    clearable = false,
    withCheckIcon = true,
    checkIconPosition = "left",
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
    onOptionSubmit,
    disabled,
    readOnly,
    id,
    styles,
    comboboxProps,
    clearButtonProps,
    __triggerProps,
  } = props;

  const dropdownId = useId(id ? `${id}-dropdown` : undefined);

  const parsed = React.useMemo(() => getParsedComboboxData(data), [data]);
  const lockup = React.useMemo(() => getOptionsLockup(parsed), [parsed]);

  const [_value, setValueState, controlled] = useUncontrolled<string | null>({
    value,
    defaultValue,
    finalValue: null,
  });
  const selectedOption = _value != null ? lockup[_value] : undefined;

  const setValue = React.useCallback(
    (next: string | null, option: ComboboxItem | null) => {
      setValueState(next);
      onChange?.(next, option);
    },
    [setValueState, onChange],
  );

  const [search, setSearchState] = useUncontrolled<string>({
    value: searchValue,
    defaultValue: defaultSearchValue,
    finalValue: selectedOption ? selectedOption.label : "",
  });
  const setSearch = React.useCallback(
    (next: string) => {
      setSearchState(next);
      onSearchChange?.(next);
    },
    [setSearchState, onSearchChange],
  );

  const combobox = useCombobox({
    opened: dropdownOpened,
    defaultOpened: defaultDropdownOpened,
    onDropdownOpen,
    onDropdownClose,
  });

  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  // Set on a user-typed search change so the next `flatOptions` recompute highlights
  // the first match (Mantine's `selectFirstOptionOnChange`); a ref avoids racing the
  // filter memo and scopes the behaviour to actual input changes.
  const selectFirstPending = React.useRef(false);

  // Keep the displayed search in sync with the selection while the dropdown is
  // closed (covers controlled value changes + reset after blur). This MUST stay
  // an effect, not a render-time derivation: the controlled `value` can change
  // externally (outside any input event) and the field text has to follow it, and
  // closing the dropdown (blur) must reset the query back to the selected label.
  // It is intentional state-mirrored-via-effect, not a removable anti-pattern.
  React.useEffect(() => {
    if (!combobox.opened) {
      setSearchState(selectedOption ? selectedOption.label : "");
    }
  }, [_value, combobox.opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const shouldFilter = searchable && search.trim() !== "" && selectedOption?.label !== search;
  const filterFn = filter ?? defaultOptionsFilter;
  const filtered = React.useMemo(
    () =>
      filterFn({
        options: parsed,
        search: shouldFilter ? search : "",
        limit: limit ?? Number.POSITIVE_INFINITY,
      }),
    [filterFn, parsed, shouldFilter, search, limit],
  );
  const flatOptions = React.useMemo(
    () => flattenComboboxOptions(filtered).filter((option) => !option.disabled),
    [filtered],
  );

  // Highlight the current value (or first option) when the dropdown opens.
  React.useEffect(() => {
    if (combobox.opened) {
      setActiveValue(_value ?? flatOptions[0]?.value ?? null);
    }
  }, [combobox.opened]); // eslint-disable-line react-hooks/exhaustive-deps

  // After a user-typed search change, highlight the first match.
  React.useEffect(() => {
    if (selectFirstPending.current) {
      selectFirstPending.current = false;
      setActiveValue(flatOptions[0]?.value ?? null);
    }
  }, [flatOptions]);

  const handleSubmit = React.useCallback(
    (optionValue: string) => {
      const option = lockup[optionValue];
      if (!option || option.disabled) return;
      onOptionSubmit?.(optionValue);
      const next = allowDeselect && optionValue === _value ? null : optionValue;
      setValue(next, next != null ? option : null);
      if (!controlled) setSearch(next != null ? option.label : "");
      combobox.closeDropdown();
    },
    [lockup, onOptionSubmit, allowDeselect, _value, setValue, controlled, setSearch, combobox],
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
    setSearch(event.currentTarget.value);
    combobox.openDropdown();
    if (selectFirstOptionOnChange) selectFirstPending.current = true;
  };

  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (event) => {
    if (searchable && openOnFocus) combobox.openDropdown();
    __triggerProps?.onFocus?.(event);
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
    if (autoSelectOnBlur && combobox.opened && activeValue != null) {
      // Commit the highlighted option; handleSubmit closes the dropdown and resets
      // the displayed label, superseding the default blur reset below.
      handleSubmit(activeValue);
    } else if (searchable) {
      combobox.closeDropdown();
      setSearch(selectedOption ? selectedOption.label : "");
    }
    __triggerProps?.onBlur?.(event);
  };

  const handleClick: React.MouseEventHandler<HTMLInputElement> = (event) => {
    if (searchable) {
      combobox.openDropdown();
    } else {
      combobox.toggleDropdown();
    }
    __triggerProps?.onClick?.(event);
  };

  const handleClear = React.useCallback(() => {
    setValue(null, null);
    setSearch("");
    onClear?.();
  }, [setValue, setSearch, onClear]);

  const canClear = clearable && _value != null && !disabled && !readOnly;
  const inputValue = searchable ? search : (selectedOption?.label ?? "");

  const ctx = React.useMemo<SelectContextValue>(
    () => ({
      combobox,
      size,
      disabled,
      readOnly,
      searchable,
      value: _value,
      inputValue,
      filtered,
      activeValue,
      dropdownId,
      canClear,
      withCheckIcon,
      checkIconPosition,
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
      searchable,
      _value,
      inputValue,
      filtered,
      activeValue,
      dropdownId,
      canClear,
      withCheckIcon,
      checkIconPosition,
      nothingFoundMessage,
      withScrollArea,
      maxDropdownHeight,
      renderOption,
      styles,
      clearButtonProps,
      __triggerProps,
    ],
  );

  const s = slotStyles<SelectStyles>(styles, SELECT_SLOT_KEYS, "Select");

  return (
    <SelectContext.Provider value={ctx}>
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
    </SelectContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Select.Trigger — the InputBase-as-combobox target                          */
/* -------------------------------------------------------------------------- */

export interface SelectTriggerProps extends Partial<SelectInputProps> {
  /** Single-element ref to the inner input. */
  ref?: React.Ref<SelectRef>;
}

const SelectTrigger = React.forwardRef<SelectRef, SelectTriggerProps>(
  function SelectTrigger(props, ref) {
    const ctx = useSelectContext();
    const s = slotStyles<SelectStyles>(ctx.styles, SELECT_SLOT_KEYS, "Select");

    // The sugar `<Select>` wrapper funnels its chrome props + ref through context so a
    // composable caller (`<Select.Trigger placeholder=… />`) and the sugar caller
    // resolve to the same trigger. Explicit props on `<Select.Trigger>` win over the
    // funneled ones, which in turn win over the `trigger` slot sugar.
    const funneled = ctx.triggerProps ?? {};
    const {
      role: _funneledRole,
      placeholder: funneledPlaceholder,
      id: funneledId,
      ref: funneledRef,
      clearSectionMode: funneledClearSectionMode,
      ...funneledRest
    } = funneled;
    void _funneledRole;

    const {
      id = funneledId,
      placeholder = funneledPlaceholder,
      rightSection: funneledRightSection,
      rightSectionPointerEvents: funneledRightSectionPointerEvents,
      ...funneledChrome
    } = { ...funneledRest, ...props };

    const mergedRef = ref ?? funneledRef;

    // Pure composition of the clear button + chevron into the trigger's right
    // section — no longer riding InputBase's private `__clearSection`/
    // `__defaultRightSection` channel. `composeTriggerRightSection` owns the
    // `clearSectionMode` coexistence math (default `both`: clear button alongside
    // the section, or replacing the chevron when there is no consumer section).
    const clearButton = (
      <Combobox.ClearButton
        // Deprecated `clearButtonProps` merged OVER the `clearButton` slot sugar.
        {...s.merge("clearButton", ctx.clearButtonProps)}
        size={ctx.size}
        onClear={ctx.onClear}
      />
    );

    const rightSection = composeTriggerRightSection({
      rightSection: funneledRightSection,
      defaultSection: (
        <Combobox.Chevron opened={ctx.combobox.opened} size={ctx.size} {...s.get("chevron")} />
      ),
      clearSection: clearButton,
      clearable: ctx.canClear,
      mode: funneledClearSectionMode,
    });

    return (
      <Combobox.Target>
        <InputBase
          // `trigger` slot sugar is the LOWEST precedence.
          {...s.get("trigger")}
          {...funneledChrome}
          ref={mergedRef}
          id={id}
          role="combobox"
          aria-autocomplete={ctx.searchable ? "list" : "none"}
          aria-controls={ctx.dropdownId}
          aria-expanded={ctx.combobox.opened}
          size={ctx.size}
          disabled={ctx.disabled}
          placeholder={placeholder}
          value={ctx.inputValue}
          readOnly={ctx.readOnly || !ctx.searchable}
          pointer={!ctx.searchable}
          onChange={ctx.searchable ? ctx.onChangeText : undefined}
          onFocus={ctx.onFocus}
          onBlur={ctx.onBlur}
          onClick={ctx.onClick}
          onKeyDown={ctx.onKeyDown}
          rightSection={rightSection.node}
          rightSectionPointerEvents={
            rightSection.pointerEvents ?? funneledRightSectionPointerEvents
          }
        />
      </Combobox.Target>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Select.Dropdown — the floating surface                                     */
/* -------------------------------------------------------------------------- */

export interface SelectDropdownProps extends ComboboxDropdownProps {}

const SelectDropdown = React.forwardRef<
  React.ComponentRef<typeof Combobox.Dropdown>,
  SelectDropdownProps
>(function SelectDropdown(props, ref) {
  const ctx = useSelectContext();
  const s = slotStyles<SelectStyles>(ctx.styles, SELECT_SLOT_KEYS, "Select");
  const { id = ctx.dropdownId, children, ...rest } = props;
  return (
    <Combobox.Dropdown ref={ref} id={id} {...s.get("dropdown")} {...rest}>
      {children ?? <SelectOptions />}
    </Combobox.Dropdown>
  );
});

/* -------------------------------------------------------------------------- */
/* Select.Options — the listbox body (data OR children)                       */
/* -------------------------------------------------------------------------- */

export interface SelectOptionsProps extends Partial<
  Omit<OptionsDropdownProps, "value" | "activeValue">
> {
  /** Render explicit option children instead of the context `data`. */
  children?: React.ReactNode;
}

function SelectOptions(props: SelectOptionsProps) {
  const ctx = useSelectContext();
  const s = slotStyles<SelectStyles>(ctx.styles, SELECT_SLOT_KEYS, "Select");
  const { children, data, ...rest } = props;

  // Explicit children replace the data-driven body (the composable path where the
  // caller maps `Select.Option`s themselves).
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
      withCheckIcon={ctx.withCheckIcon}
      checkIconPosition={ctx.checkIconPosition}
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
/* Sugar wrapper — the backward-compatible <Select … /> prop API              */
/* -------------------------------------------------------------------------- */

export interface SelectProps extends Omit<SelectInputProps, "styles"> {
  /** Options to render. Strings, `{ value, label, disabled }`, or groups. */
  data?: ComboboxData;
  /** Controlled selected value. */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Called when the value changes with the value and its option (or `null`). */
  onChange?: (value: string | null, option: ComboboxItem | null) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Allow filtering options by typing. @default false */
  searchable?: boolean;
  /** Open the dropdown when the input receives focus (requires `searchable`). @default true */
  openOnFocus?: boolean;
  /** Highlight the first matching option after each search change. @default false */
  selectFirstOptionOnChange?: boolean;
  /** Commit the highlighted option when the input loses focus. @default false */
  autoSelectOnBlur?: boolean;
  /** Controlled search value. */
  searchValue?: string;
  /** Uncontrolled initial search value. */
  defaultSearchValue?: string;
  /** Called when the search value changes. */
  onSearchChange?: (value: string) => void;
  /** Allow deselecting by picking the selected option again. @default true */
  allowDeselect?: boolean;
  /** Show a clear button when a value is selected. @default false */
  clearable?: boolean;
  /** Props forwarded to the internal clear `Combobox.ClearButton`. */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** How the clear button and right section coexist. @default 'both' */
  clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  /** Show a check icon next to the selected option. @default true */
  withCheckIcon?: boolean;
  /** Side the check icon renders on. @default 'left' */
  checkIconPosition?: "left" | "right";
  /** Message shown when no option matches / data is empty. */
  nothingFoundMessage?: React.ReactNode;
  /** Control size. @default 'md' */
  size?: ComboboxSize;
  /** Maximum number of options displayed. @default Infinity */
  limit?: number;
  /** Custom options filter. @default a case-insensitive label substring match. */
  filter?: OptionsFilter;
  /** Custom option content. Receives `{ option, checked }`. */
  renderOption?: ComboboxRenderOption;
  /** Max dropdown height in px before scrolling. @default 250 */
  maxDropdownHeight?: number;
  /** Wrap options in a `ScrollArea.Autosize`. @default true */
  withScrollArea?: boolean;
  /** Controlled dropdown opened state. */
  dropdownOpened?: boolean;
  /** Uncontrolled initial dropdown opened state. */
  defaultDropdownOpened?: boolean;
  /** Called when the dropdown opens. */
  onDropdownOpen?: () => void;
  /** Called when the dropdown closes. */
  onDropdownClose?: () => void;
  /** Called when an option is submitted (before value changes). */
  onOptionSubmit?: (value: string) => void;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /** Per-slot style sugar — props spread onto the matching part. */
  styles?: SlotStyles<SelectStyles>;
}

export type SelectRef = React.ComponentRef<typeof InputBase>;

/**
 * Single-select dropdown — mirrors Mantine's `Select` (fixed `Value = string`),
 * built on `Combobox` + `InputBase`. This prop API is sugar that renders the
 * composable parts (`Select.Root` / `Select.Trigger` / `Select.Dropdown` /
 * `Select.Options`); it contains no behavior the parts lack. Accent comes from the
 * Tamagui `theme` prop + palette ramp, never a Mantine `color` prop. Keyboard
 * navigation (Arrow/Enter/Escape) is web-only — the same documented roving-focus
 * gap as `Menu` (no cross-platform focus primitive); on native, options are
 * selected by press.
 */
const SelectComponent = React.forwardRef<SelectRef, SelectProps>(function Select(props, ref) {
  const {
    // Field-chrome / trigger props (everything that is NOT a Root behavior prop).
    clearSectionMode,
    placeholder,
    id,
    disabled,
    readOnly,
    label,
    description,
    error,
    required,
    withAsterisk,
    labelProps,
    descriptionProps,
    errorProps,
    inputContainer,
    inputWrapperOrder,
    labelElement,
    wrapperProps,
    leftSection,
    leftSectionProps,
    leftSectionWidth,
    leftSectionPointerEvents,
    rightSection,
    rightSectionProps,
    rightSectionWidth,
    rightSectionPointerEvents,
    variant,
    radius,
    pointer,
    loading,
    loadingPosition,
    multiline,
    onFocus,
    onBlur,
    onClick,
    onKeyDown,
    styles,

    // Root behavior props.
    data,
    value,
    defaultValue,
    onChange,
    onClear,
    searchable = false,
    openOnFocus = true,
    selectFirstOptionOnChange = false,
    autoSelectOnBlur = false,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    allowDeselect = true,
    clearable = false,
    clearButtonProps,
    withCheckIcon = true,
    checkIconPosition = "left",
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
    onOptionSubmit,
    comboboxProps,

    ...inputProps
  } = props;

  // The remaining chrome props are funneled to `Select.Trigger` via Root context so
  // the sugar path and the composable path converge on the same trigger element.
  const triggerProps: SelectContextValue["triggerProps"] = {
    ...inputProps,
    placeholder,
    id,
    label,
    description,
    error,
    required,
    withAsterisk,
    labelProps,
    descriptionProps,
    errorProps,
    inputContainer,
    inputWrapperOrder,
    labelElement,
    wrapperProps,
    leftSection,
    leftSectionProps,
    leftSectionWidth,
    leftSectionPointerEvents,
    rightSection,
    rightSectionProps,
    rightSectionWidth,
    rightSectionPointerEvents,
    variant,
    radius,
    pointer,
    loading,
    loadingPosition,
    multiline,
    // Forward ONLY the field-chrome slots to the trigger's `Input.Wrapper`; the
    // dropdown/option/pill/etc. slots stay with the parts that consume them (Root /
    // Dropdown / Options), so `Input.Wrapper` never dev-warns about slots it doesn't own.
    styles: pick<SelectStyles, InputWrapperSlots>(styles, INPUT_WRAPPER_SLOTS),
    onFocus,
    onBlur,
    onClick,
    onKeyDown,
    ref,
    // Controls how the clear button coexists with the trigger's right section.
    clearSectionMode,
  };

  return (
    <SelectRoot
      data={data}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onClear={onClear}
      searchable={searchable}
      openOnFocus={openOnFocus}
      selectFirstOptionOnChange={selectFirstOptionOnChange}
      autoSelectOnBlur={autoSelectOnBlur}
      searchValue={searchValue}
      defaultSearchValue={defaultSearchValue}
      onSearchChange={onSearchChange}
      allowDeselect={allowDeselect}
      clearable={clearable}
      clearButtonProps={clearButtonProps}
      withCheckIcon={withCheckIcon}
      checkIconPosition={checkIconPosition}
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
      onOptionSubmit={onOptionSubmit}
      disabled={disabled}
      readOnly={readOnly}
      id={id}
      styles={styles}
      comboboxProps={comboboxProps}
      __triggerProps={triggerProps}
    >
      <SelectTrigger />
      <SelectDropdown />
    </SelectRoot>
  );
});

export const Select = withStaticProperties(SelectComponent, {
  /** State machine: value / search / active-option + a11y. Renders `<Combobox>`. */
  Root: SelectRoot,
  /** The field: `<Combobox.Target><InputBase/>`; owns `role="combobox"` + aria. */
  Trigger: SelectTrigger,
  /** The floating surface (wraps `Combobox.Dropdown`). */
  Dropdown: SelectDropdown,
  /** The listbox body — accepts `data` OR `Select.Option` children. */
  Options: SelectOptions,
  /** Re-export of `Combobox.Option`. */
  Option: Combobox.Option,
  /** Re-export of `Combobox.Group`. */
  Group: Combobox.Group,
  /** Re-export of `Combobox.Empty`. */
  Empty: Combobox.Empty,
  /** Re-export of `Combobox.Chevron`. */
  Chevron: Combobox.Chevron,
  /** Re-export of `Combobox.ClearButton`. */
  ClearButton: Combobox.ClearButton,
});
