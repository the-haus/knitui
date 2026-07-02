import * as React from "react";

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
  type ComboboxOptionProps,
  type ComboboxParsedItem,
  type ComboboxProps,
  type ComboboxRenderOption,
  type ComboboxRenderPill,
  type ComboboxSize,
  composeTriggerRightSection,
  defaultOptionsFilter,
  flattenComboboxOptions,
  getOptionsLockup,
  getParsedComboboxData,
  isComboboxGroup,
  type OptionsDropdownProps,
  type OptionsFilter,
  useCombobox,
} from "../Combobox";
import { type __BaseInputProps } from "../Input";
import { INPUT_WRAPPER_SLOTS, type InputWrapperSlots } from "../Input/shared";
import { toEmbeddedControlSize } from "../internal/embedded-control-size";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";
import { Pill, type PillGroupProps, type PillProps } from "../Pill";
import { PillsInput, type PillsInputProps } from "../PillsInput";

// `filter` is Omit-ed so Mantine's options-`filter` prop (an `OptionsFilter` fn) can
// take that public name — the inherited CSS `filter` style prop would otherwise collide.
type MultiSelectInputProps = Omit<
  __BaseInputProps,
  "size" | "onChange" | "onFocus" | "onBlur" | "onKeyDown" | "filter"
>;

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`), keyed 1:1 with the
 * MultiSelect part surface. Each key maps to the props of the part it targets, so
 * `styles={{ option: { bg: "$color3" } }}` is sugar for `<MultiSelect.Option bg="$color3" />`.
 */
export interface MultiSelectStyles {
  /** Props for the state-machine root (`MultiSelect.Root` → `<Combobox>`). */
  root?: Partial<ComboboxProps>;
  /** Props for the field trigger (`MultiSelect.Trigger` → `PillsInput`). */
  trigger?: Partial<PillsInputProps>;
  /** Props for the pill row wrapper (`MultiSelect.Pills` → `Pill.Group`). */
  pills?: Partial<PillGroupProps>;
  /** Props for each selected-value chip (`MultiSelect.Pill` → `Pill`). */
  pill?: Partial<PillProps>;
  /** Props for the floating surface (`MultiSelect.Dropdown`). */
  dropdown?: Partial<ComboboxDropdownProps>;
  /** Props for the listbox body (`MultiSelect.Options`). */
  options?: Partial<OptionsDropdownProps>;
  /** Props for each option row (`MultiSelect.Option`). */
  option?: Partial<ComboboxOptionProps>;
  /** Props for an option group (`MultiSelect.Group`). */
  group?: Partial<ComboboxGroupProps>;
  /** Props for the empty state (`MultiSelect.Empty`). */
  empty?: Partial<ComboboxEmptyProps>;
  /** Props for the chevron (`MultiSelect.Chevron`). */
  chevron?: Partial<ComboboxChevronProps>;
  /** Props for the clear button (`MultiSelect.ClearButton`). */
  clearButton?: Partial<ComboboxClearButtonProps>;
}

const MULTISELECT_SLOT_KEYS = [
  "root",
  "trigger",
  "pills",
  "pill",
  "dropdown",
  "options",
  "option",
  "group",
  "empty",
  "chevron",
  "clearButton",
] as const satisfies readonly (keyof MultiSelectStyles)[];

/** Removes already-picked option VALUES from parsed data (group-aware). */
function filterPickedValues(data: ComboboxParsedItem[], picked: string[]): ComboboxParsedItem[] {
  const set = new Set(picked);
  return data.reduce<ComboboxParsedItem[]>((acc, item) => {
    if (isComboboxGroup(item)) {
      const items = item.items.filter((option) => !set.has(option.value));
      if (items.length > 0) acc.push({ group: item.group, items });
    } else if (!set.has(item.value)) {
      acc.push(item);
    }
    return acc;
  }, []);
}

/* -------------------------------------------------------------------------- */
/* Root context                                                               */
/* -------------------------------------------------------------------------- */

interface MultiSelectContextValue {
  /** The shared combobox store (open state + keyboard target). */
  combobox: ReturnType<typeof useCombobox>;
  /** id wiring `aria-controls` (field) ↔ the dropdown surface. */
  dropdownId: string;
  size: ComboboxSize;
  /** A field-relative step-down size for the embedded pills. */
  pillSize: ReturnType<typeof toEmbeddedControlSize>;
  disabled?: boolean;
  readOnly?: boolean;
  searchable: boolean;
  placeholder?: string;
  /** The current committed values (multi-select). */
  value: string[];
  /** The current search text shown in the field. */
  search: string;
  /** Already-filtered parsed data for the dropdown. */
  filtered: ComboboxParsedItem[];
  /** Option lookup by value (drives pill labels). */
  lockup: ReturnType<typeof getOptionsLockup>;
  /** The keyboard-highlighted value. */
  activeValue: string | null;
  /** Whether the clear button may be shown. */
  canClear: boolean;
  /** Field-chrome options-dropdown rendering knobs. */
  withCheckIcon: boolean;
  checkIconPosition: "left" | "right";
  nothingFoundMessage?: React.ReactNode;
  withScrollArea: boolean;
  maxDropdownHeight: number;
  renderOption?: ComboboxRenderOption;
  /** Custom pill content; replaces the built-in `MultiSelect.Pill`. */
  renderPill?: ComboboxRenderPill;
  /** Per-slot style sugar shared down to the parts. */
  styles?: SlotStyles<MultiSelectStyles>;
  /** Deprecated alias merged over the `clearButton` slot. */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** Coexistence mode for the clear button + right section. */
  clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  /** Trigger props the sugar wrapper assembled (chrome, aria, ref). */
  triggerProps?: Partial<MultiSelectInputProps> & {
    placeholder?: string;
    id?: string;
    ref?: React.Ref<MultiSelectRef>;
  };
  /** Remove a single value (pill remove / Backspace). */
  removeValue: (value: string) => void;
  // Event/behaviour handlers consumed by MultiSelect.Trigger.
  onClear: () => void;
  onChangeText: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onFieldClick: () => void;
}

const MultiSelectContext = React.createContext<MultiSelectContextValue | null>(null);

const useMultiSelectContext = (): MultiSelectContextValue => {
  const ctx = React.useContext(MultiSelectContext);
  if (!ctx) {
    throw new Error("MultiSelect compound components must be rendered inside <MultiSelect.Root>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* MultiSelect.Root — the values / search / active-option state machine       */
/* -------------------------------------------------------------------------- */

export interface MultiSelectRootProps {
  /** `MultiSelect.Trigger` + `MultiSelect.Dropdown`. */
  children?: React.ReactNode;
  /** Options to render. Strings, `{ value, label, disabled }`, or groups. */
  data?: ComboboxData;
  /** Controlled selected values. */
  value?: string[];
  /** Uncontrolled initial values. */
  defaultValue?: string[];
  /** Called when the selected values change. */
  onChange?: (value: string[]) => void;
  /** Called with the value of a removed item. */
  onRemove?: (value: string) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Called when the user tries to select more than `maxValues`. */
  onMaxValues?: () => void;
  /** Controlled search value. */
  searchValue?: string;
  /** Uncontrolled initial search value. */
  defaultSearchValue?: string;
  /** Called when the search value changes. */
  onSearchChange?: (value: string) => void;
  /** Maximum number of selected values. @default Infinity */
  maxValues?: number;
  /** Allow filtering options by typing. @default false */
  searchable?: boolean;
  /** Highlight the first matching option after each search change. @default false */
  selectFirstOptionOnChange?: boolean;
  /** Clear the search field after a value is selected. @default true */
  clearSearchOnChange?: boolean;
  /** Custom options filter. @default a case-insensitive label substring match. */
  filter?: OptionsFilter;
  /** Custom option content. Receives `{ option, checked }`. */
  renderOption?: ComboboxRenderOption;
  /** Custom pill content; replaces the built-in `MultiSelect.Pill`. */
  renderPill?: ComboboxRenderPill;
  /** Message shown when no option matches / data is empty. */
  nothingFoundMessage?: React.ReactNode;
  /** Show a check icon next to selected options. @default true */
  withCheckIcon?: boolean;
  /** Side the check icon renders on. @default 'left' */
  checkIconPosition?: "left" | "right";
  /** Hide already-selected options from the dropdown. @default false */
  hidePickedOptions?: boolean;
  /** Show a clear button when there is a value. @default false */
  clearable?: boolean;
  /** Control size. @default 'md' */
  size?: ComboboxSize;
  /** Placeholder for the inner field. */
  placeholder?: string;
  /** Maximum number of options displayed. @default Infinity */
  limit?: number;
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
  /** Hidden web-form input name (renders a comma-joined hidden field). */
  hiddenInputName?: string;
  /** Associated `<form>` id for the hidden input. */
  form?: string;
  /** Divider for the hidden input value. @default ',' */
  hiddenInputValuesDivider?: string;
  /** Disable the control. */
  disabled?: boolean;
  /** Render the control read-only. */
  readOnly?: boolean;
  /** Field focus handler (forwarded to the inner field). */
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  /** Field blur handler (forwarded to the inner field). */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Field keydown handler (fires after the built-in navigation). */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  /** Per-slot style sugar — shared to the parts. */
  styles?: SlotStyles<MultiSelectStyles>;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /** How the clear button and right section coexist. @default 'both' */
  clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  /**
   * @deprecated Use `styles={{ clearButton: … }}` (or render `<MultiSelect.ClearButton>`
   * directly). Merged OVER the `clearButton` slot.
   */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /**
   * Trigger props assembled by the sugar `<MultiSelect>` wrapper (field chrome,
   * aria, ref). Not part of the public composable API — when composing by hand you
   * render `<MultiSelect.Trigger>` with your own props instead.
   * @internal
   */
  __triggerProps?: MultiSelectContextValue["triggerProps"];
}

function MultiSelectRoot(props: MultiSelectRootProps) {
  const {
    children,
    data,
    value,
    defaultValue,
    onChange,
    onRemove,
    onClear,
    onMaxValues,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    maxValues = Number.POSITIVE_INFINITY,
    searchable = false,
    selectFirstOptionOnChange = false,
    clearSearchOnChange = true,
    filter,
    renderOption,
    renderPill,
    nothingFoundMessage,
    withCheckIcon = true,
    checkIconPosition = "left",
    hidePickedOptions = false,
    clearable = false,
    size = "md",
    placeholder,
    limit,
    maxDropdownHeight = 250,
    withScrollArea = true,
    dropdownOpened,
    defaultDropdownOpened,
    onDropdownOpen,
    onDropdownClose,
    onOptionSubmit,
    hiddenInputName,
    form,
    hiddenInputValuesDivider = ",",
    disabled,
    readOnly,
    onFocus,
    onBlur,
    onKeyDown,
    styles,
    comboboxProps,
    clearSectionMode,
    clearButtonProps,
    __triggerProps,
  } = props;

  // Pills are embedded in the field, so derive a SMALLER pill size from the field
  // size (field md → pills sm) — same-key pills would equal the field height and
  // overflow it.
  const pillSize = toEmbeddedControlSize(size);

  const parsed = React.useMemo(() => getParsedComboboxData(data), [data]);
  const lockup = React.useMemo(() => getOptionsLockup(parsed), [parsed]);

  const [_value, setValue] = useUncontrolled<string[]>({
    value,
    defaultValue,
    finalValue: [],
    onChange,
  });

  const [search, setSearch] = useUncontrolled<string>({
    value: searchValue,
    defaultValue: defaultSearchValue,
    finalValue: "",
    onChange: onSearchChange,
  });

  const combobox = useCombobox({
    opened: dropdownOpened,
    defaultOpened: defaultDropdownOpened,
    onDropdownOpen,
    onDropdownClose,
  });

  // SSR-safe id linking the field's `aria-controls`/`aria-expanded` to the
  // dropdown surface's `id`, mirroring `Select` (derived from the trigger id
  // when the consumer supplied one).
  const dropdownId = useId(__triggerProps?.id ? `${__triggerProps.id}-dropdown` : undefined);

  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  // Set on a user-typed search change so the next `flatOptions` recompute highlights
  // the first match (Mantine's `selectFirstOptionOnChange`); a ref avoids racing the
  // filter memo and scopes the behaviour to actual input changes.
  const selectFirstPending = React.useRef(false);

  const optionsData = React.useMemo(
    () => (hidePickedOptions ? filterPickedValues(parsed, _value) : parsed),
    [hidePickedOptions, parsed, _value],
  );
  const shouldFilter = searchable && search.trim() !== "";
  const filterFn = filter ?? defaultOptionsFilter;
  const filtered = React.useMemo(
    () =>
      filterFn({
        options: optionsData,
        search: shouldFilter ? search : "",
        limit: limit ?? Number.POSITIVE_INFINITY,
      }),
    [filterFn, optionsData, shouldFilter, search, limit],
  );
  const flatOptions = React.useMemo(
    () => flattenComboboxOptions(filtered).filter((option) => !option.disabled),
    [filtered],
  );

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
      if (_value.includes(optionValue)) {
        setValue(_value.filter((v) => v !== optionValue));
        onRemove?.(optionValue);
      } else if (_value.length < maxValues) {
        setValue([..._value, optionValue]);
      } else {
        onMaxValues?.();
      }
      if (clearSearchOnChange) setSearch("");
    },
    [
      lockup,
      onOptionSubmit,
      _value,
      maxValues,
      setValue,
      onRemove,
      onMaxValues,
      setSearch,
      clearSearchOnChange,
    ],
  );

  const removeValue = React.useCallback(
    (optionValue: string) => {
      setValue(_value.filter((v) => v !== optionValue));
      onRemove?.(optionValue);
    },
    [setValue, _value, onRemove],
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
      case " ":
        if (!searchable) {
          event.preventDefault();
          combobox.toggleDropdown();
        }
        break;
      case "Enter":
        if (combobox.opened && activeValue != null) {
          event.preventDefault();
          handleSubmit(activeValue);
        }
        break;
      case "Backspace":
        if (search.length === 0 && _value.length > 0) {
          removeValue(_value[_value.length - 1]);
        }
        break;
      case "Escape":
        combobox.closeDropdown();
        break;
      default:
        break;
    }
    onKeyDown?.(event);
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearch(event.currentTarget.value);
    combobox.openDropdown();
    if (selectFirstOptionOnChange) selectFirstPending.current = true;
  };

  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (event) => {
    if (searchable) combobox.openDropdown();
    onFocus?.(event);
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
    combobox.closeDropdown();
    setSearch("");
    onBlur?.(event);
  };

  const handleFieldClick = React.useCallback(() => {
    if (searchable) {
      combobox.openDropdown();
    } else {
      combobox.toggleDropdown();
    }
  }, [searchable, combobox]);

  const handleClear = React.useCallback(() => {
    onClear?.();
    setValue([]);
    setSearch("");
  }, [onClear, setValue, setSearch]);

  const canClear = clearable && _value.length > 0 && !disabled && !readOnly;

  const ctx = React.useMemo<MultiSelectContextValue>(
    () => ({
      combobox,
      dropdownId,
      size,
      pillSize,
      disabled,
      readOnly,
      searchable,
      placeholder,
      value: _value,
      search,
      filtered,
      lockup,
      activeValue,
      canClear,
      withCheckIcon,
      checkIconPosition,
      nothingFoundMessage,
      withScrollArea,
      maxDropdownHeight,
      renderOption,
      renderPill,
      styles,
      clearButtonProps,
      clearSectionMode,
      triggerProps: __triggerProps,
      removeValue,
      onClear: handleClear,
      onChangeText: handleChange,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onFieldClick: handleFieldClick,
    }),
    // handlers are recreated each render (they close over render-scoped state); the
    // context value is intentionally not stable, mirroring the original component.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      combobox,
      dropdownId,
      size,
      pillSize,
      disabled,
      readOnly,
      searchable,
      placeholder,
      _value,
      search,
      filtered,
      lockup,
      activeValue,
      canClear,
      withCheckIcon,
      checkIconPosition,
      nothingFoundMessage,
      withScrollArea,
      maxDropdownHeight,
      renderOption,
      renderPill,
      styles,
      clearButtonProps,
      clearSectionMode,
      __triggerProps,
    ],
  );

  const s = slotStyles<MultiSelectStyles>(styles, MULTISELECT_SLOT_KEYS, "MultiSelect");

  return (
    <MultiSelectContext.Provider value={ctx}>
      <Combobox
        position="bottom"
        width="target"
        // Deprecated `comboboxProps` alias merged OVER the `root` slot sugar
        // ("explicit beats sugar").
        {...s.merge("root", comboboxProps)}
        store={combobox}
        onOptionSubmit={handleSubmit}
        size={size}
        readOnly={readOnly}
      >
        {children}
      </Combobox>
      <Combobox.HiddenInput
        name={hiddenInputName}
        form={form}
        value={_value}
        valuesDivider={hiddenInputValuesDivider}
        disabled={disabled}
      />
    </MultiSelectContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* MultiSelect.Pill — a single removable selected-value chip                  */
/* -------------------------------------------------------------------------- */

export interface MultiSelectPillProps extends Partial<PillProps> {
  /** The option value this pill represents. Drives the label + remove wiring. */
  value: string;
}

function MultiSelectPill(props: MultiSelectPillProps) {
  const ctx = useMultiSelectContext();
  const s = slotStyles<MultiSelectStyles>(ctx.styles, MULTISELECT_SLOT_KEYS, "MultiSelect");
  const { value: itemValue, children, ...rest } = props;
  const option = ctx.lockup[itemValue];

  // A custom `renderPill` REPLACES the built-in chip (Mantine parity).
  if (ctx.renderPill) {
    return (
      <>
        {ctx.renderPill({
          option: option ?? { value: itemValue, label: itemValue },
          value: itemValue,
          onRemove: () => ctx.removeValue(itemValue),
          disabled: ctx.disabled,
        })}
      </>
    );
  }

  return (
    <Pill
      // `pill` slot sugar is the LOWEST precedence.
      {...s.get("pill")}
      size={ctx.pillSize}
      withRemoveButton={!ctx.readOnly && !option?.disabled}
      disabled={ctx.disabled}
      onRemove={() => ctx.removeValue(itemValue)}
      {...rest}
    >
      {children ?? option?.label ?? itemValue}
    </Pill>
  );
}

/* -------------------------------------------------------------------------- */
/* MultiSelect.Pills — the pill row wrapper (`Pill.Group`)                     */
/* -------------------------------------------------------------------------- */

export interface MultiSelectPillsProps extends Partial<PillGroupProps> {}

/**
 * Thin wrapper over `Pill.Group` that hosts the selected-value chips inside the
 * trigger. Pulls field-relative `size`/`disabled` from context so consumers can
 * restyle / recompose the pill row without re-deriving them. Defaults to
 * `flex={1} minWidth={0}` so the field's search input keeps the trailing space.
 */
function MultiSelectPills(props: MultiSelectPillsProps) {
  const ctx = useMultiSelectContext();
  const s = slotStyles<MultiSelectStyles>(ctx.styles, MULTISELECT_SLOT_KEYS, "MultiSelect");
  return (
    <Pill.Group
      // `pills` slot sugar is the LOWEST precedence.
      {...s.get("pills")}
      size={ctx.pillSize}
      disabled={ctx.disabled}
      flex={1}
      minWidth={0}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* MultiSelect.Trigger — the PillsInput-as-combobox target                    */
/* -------------------------------------------------------------------------- */

export interface MultiSelectTriggerProps extends Partial<MultiSelectInputProps> {
  /** Override the rendered pills + field body (composable path). */
  children?: React.ReactNode;
  /** Placeholder for the inner field (funnels to the underlying input). */
  placeholder?: string;
  /** Single-element ref to the inner input frame. */
  ref?: React.Ref<MultiSelectRef>;
}

const MultiSelectTrigger = React.forwardRef<MultiSelectRef, MultiSelectTriggerProps>(
  function MultiSelectTrigger(props, ref) {
    const ctx = useMultiSelectContext();
    const s = slotStyles<MultiSelectStyles>(ctx.styles, MULTISELECT_SLOT_KEYS, "MultiSelect");

    // The sugar `<MultiSelect>` wrapper funnels its chrome props + ref through
    // context so the composable and sugar callers resolve to the same trigger.
    const funneled = ctx.triggerProps ?? {};
    const {
      placeholder: funneledPlaceholder,
      id: funneledId,
      ref: funneledRef,
      ...funneledRest
    } = funneled;

    const {
      children,
      id = funneledId,
      placeholder = funneledPlaceholder ?? ctx.placeholder,
      rightSection: funneledRightSection,
      rightSectionPointerEvents: funneledRightSectionPointerEvents,
      ...funneledChrome
    } = { ...funneledRest, ...props };

    const mergedRef = ref ?? funneledRef;

    // Pure composition of the clear button + chevron into the trigger's right
    // section — no longer riding PillsInput's private `__clearSection`/
    // `__defaultRightSection` channel. `composeTriggerRightSection` owns the
    // `clearSectionMode` coexistence math.
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
      mode: ctx.clearSectionMode,
    });

    const body = children ?? (
      <MultiSelectPills>
        {ctx.value.map((item) => (
          <MultiSelectPill key={item} value={item} />
        ))}
        <PillsInput.Field
          role="combobox"
          aria-autocomplete={ctx.searchable ? "list" : "none"}
          aria-controls={ctx.dropdownId}
          aria-expanded={ctx.combobox.opened}
          placeholder={placeholder}
          value={ctx.search}
          disabled={ctx.disabled}
          readOnly={ctx.readOnly || !ctx.searchable}
          pointer={!ctx.searchable}
          type={!ctx.searchable && ctx.value.length > 0 && !placeholder ? "hidden" : "visible"}
          onChange={ctx.searchable ? ctx.onChangeText : undefined}
          onFocus={ctx.onFocus}
          onBlur={ctx.onBlur}
          onKeyDown={ctx.onKeyDown}
          onClick={ctx.onFieldClick}
        />
      </MultiSelectPills>
    );

    return (
      <Combobox.Target>
        <PillsInput
          // `trigger` slot sugar is the LOWEST precedence.
          {...s.get("trigger")}
          {...funneledChrome}
          ref={mergedRef}
          id={id}
          size={ctx.size}
          disabled={ctx.disabled}
          pointer={!ctx.searchable}
          rightSection={rightSection.node}
          rightSectionPointerEvents={
            rightSection.pointerEvents ?? funneledRightSectionPointerEvents
          }
        >
          {body}
        </PillsInput>
      </Combobox.Target>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* MultiSelect.Dropdown — the floating surface                                */
/* -------------------------------------------------------------------------- */

export interface MultiSelectDropdownProps extends ComboboxDropdownProps {}

const MultiSelectDropdown = React.forwardRef<
  React.ComponentRef<typeof Combobox.Dropdown>,
  MultiSelectDropdownProps
>(function MultiSelectDropdown(props, ref) {
  const ctx = useMultiSelectContext();
  const s = slotStyles<MultiSelectStyles>(ctx.styles, MULTISELECT_SLOT_KEYS, "MultiSelect");
  const { id = ctx.dropdownId, children, ...rest } = props;
  return (
    <Combobox.Dropdown ref={ref} id={id} {...s.get("dropdown")} {...rest}>
      {children ?? <MultiSelectOptions />}
    </Combobox.Dropdown>
  );
});

/* -------------------------------------------------------------------------- */
/* MultiSelect.Options — the listbox body (data OR children)                  */
/* -------------------------------------------------------------------------- */

export interface MultiSelectOptionsProps extends Partial<
  Omit<OptionsDropdownProps, "value" | "activeValue">
> {
  /** Render explicit option children instead of the context `data`. */
  children?: React.ReactNode;
}

function MultiSelectOptions(props: MultiSelectOptionsProps) {
  const ctx = useMultiSelectContext();
  const s = slotStyles<MultiSelectStyles>(ctx.styles, MULTISELECT_SLOT_KEYS, "MultiSelect");
  const { children, data, ...rest } = props;

  // Explicit children replace the data-driven body (the composable path where the
  // caller maps `MultiSelect.Option`s themselves).
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
/* Sugar wrapper — the backward-compatible <MultiSelect … /> prop API         */
/* -------------------------------------------------------------------------- */

// `filter` is Omit-ed so Mantine's options-`filter` prop (an `OptionsFilter` fn) can
// take that public name — the inherited CSS `filter` style prop would otherwise collide.
export interface MultiSelectProps extends Omit<MultiSelectInputProps, "styles"> {
  /** Read-only mode (dropdown opens but values can't change). */
  readOnly?: boolean;
  /** Field focus handler (forwarded to the inner field). */
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  /** Field blur handler (forwarded to the inner field). */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Field keydown handler (fires after the built-in navigation). */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  /** Placeholder for the inner field. */
  placeholder?: string;
  /** Options to render. Strings, `{ value, label, disabled }`, or groups. */
  data?: ComboboxData;
  /** Controlled selected values. */
  value?: string[];
  /** Uncontrolled initial values. */
  defaultValue?: string[];
  /** Called when the selected values change. */
  onChange?: (value: string[]) => void;
  /** Called with the value of a removed item. */
  onRemove?: (value: string) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Called when the user tries to select more than `maxValues`. */
  onMaxValues?: () => void;
  /** Controlled search value. */
  searchValue?: string;
  /** Uncontrolled initial search value. */
  defaultSearchValue?: string;
  /** Called when the search value changes. */
  onSearchChange?: (value: string) => void;
  /** Maximum number of selected values. @default Infinity */
  maxValues?: number;
  /** Allow filtering options by typing. @default false */
  searchable?: boolean;
  /** Highlight the first matching option after each search change. @default false */
  selectFirstOptionOnChange?: boolean;
  /** Clear the search field after a value is selected. @default true */
  clearSearchOnChange?: boolean;
  /** Custom options filter. @default a case-insensitive label substring match. */
  filter?: OptionsFilter;
  /** Custom option content. Receives `{ option, checked }`. */
  renderOption?: ComboboxRenderOption;
  /** Custom pill content. Receives `{ option, value, onRemove, disabled }`; replaces the built-in `Pill`. */
  renderPill?: ComboboxRenderPill;
  /** Message shown when no option matches / data is empty. */
  nothingFoundMessage?: React.ReactNode;
  /** Show a check icon next to selected options. @default true */
  withCheckIcon?: boolean;
  /** Side the check icon renders on. @default 'left' */
  checkIconPosition?: "left" | "right";
  /** Hide already-selected options from the dropdown. @default false */
  hidePickedOptions?: boolean;
  /** Show a clear button when there is a value. @default false */
  clearable?: boolean;
  /** Props forwarded to the internal clear `Combobox.ClearButton`. */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** How the clear button and right section coexist. @default 'both' */
  clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  /** Control size. @default 'md' */
  size?: ComboboxSize;
  /** Maximum number of options displayed. @default Infinity */
  limit?: number;
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
  /** Hidden web-form input name (renders a comma-joined hidden field). */
  hiddenInputName?: string;
  /** Associated `<form>` id for the hidden input. */
  form?: string;
  /** Divider for the hidden input value. @default ',' */
  hiddenInputValuesDivider?: string;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /** Per-slot style sugar — props spread onto the matching part. */
  styles?: SlotStyles<MultiSelectStyles>;
}

export type MultiSelectRef = React.ComponentRef<typeof PillsInput>;

/**
 * Multi-value select — mirrors Mantine's `MultiSelect` (fixed `Value = string`),
 * built on `Combobox` + `PillsInput`. Selected values render as removable `Pill`s
 * inside the input; the dropdown marks every picked option with a check. This prop
 * API is sugar that renders the composable parts (`MultiSelect.Root` /
 * `MultiSelect.Trigger` / `MultiSelect.Dropdown` / `MultiSelect.Options` /
 * `MultiSelect.Pill`); it contains no behavior the parts lack. Accent comes from
 * the Tamagui `theme` prop + palette ramp, never a Mantine `color` prop. Keyboard
 * navigation (Arrow/Enter/Backspace/Escape) is web-only — the same documented
 * roving-focus gap as `Menu`/`Select`; on native, options select by press and
 * pills remove via their button.
 */
const MultiSelectComponent = React.forwardRef<MultiSelectRef, MultiSelectProps>(
  function MultiSelect(props, ref) {
    const {
      // Root behavior props.
      data,
      value,
      defaultValue,
      onChange,
      onRemove,
      onClear,
      onMaxValues,
      searchValue,
      defaultSearchValue,
      onSearchChange,
      maxValues = Number.POSITIVE_INFINITY,
      searchable = false,
      selectFirstOptionOnChange = false,
      clearSearchOnChange = true,
      filter,
      renderOption,
      renderPill,
      nothingFoundMessage,
      withCheckIcon = true,
      checkIconPosition = "left",
      hidePickedOptions = false,
      clearable = false,
      clearButtonProps,
      clearSectionMode,
      size = "md",
      limit,
      maxDropdownHeight = 250,
      withScrollArea = true,
      dropdownOpened,
      defaultDropdownOpened,
      onDropdownOpen,
      onDropdownClose,
      onOptionSubmit,
      hiddenInputName,
      form,
      hiddenInputValuesDivider = ",",
      comboboxProps,
      disabled,
      readOnly,
      placeholder,
      onFocus,
      onBlur,
      onKeyDown,
      styles,

      // Field-chrome / trigger props (everything else funneled to the trigger).
      ...inputProps
    } = props;

    // The remaining chrome props are funneled to `MultiSelect.Trigger` via Root
    // context so the sugar path and the composable path converge on the same
    // trigger element.
    const triggerProps: MultiSelectContextValue["triggerProps"] = {
      ...inputProps,
      placeholder,
      // Forward ONLY the field-chrome slots to the trigger's `PillsInput` →
      // `Input.Wrapper`; the dropdown/option/pill/etc. slots stay with the parts that
      // consume them, so `Input.Wrapper` never dev-warns about slots it doesn't own.
      styles: pick<MultiSelectStyles, InputWrapperSlots>(styles, INPUT_WRAPPER_SLOTS),
      ref,
    };

    return (
      <MultiSelectRoot
        data={data}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onRemove={onRemove}
        onClear={onClear}
        onMaxValues={onMaxValues}
        searchValue={searchValue}
        defaultSearchValue={defaultSearchValue}
        onSearchChange={onSearchChange}
        maxValues={maxValues}
        searchable={searchable}
        selectFirstOptionOnChange={selectFirstOptionOnChange}
        clearSearchOnChange={clearSearchOnChange}
        filter={filter}
        renderOption={renderOption}
        renderPill={renderPill}
        nothingFoundMessage={nothingFoundMessage}
        withCheckIcon={withCheckIcon}
        checkIconPosition={checkIconPosition}
        hidePickedOptions={hidePickedOptions}
        clearable={clearable}
        clearButtonProps={clearButtonProps}
        clearSectionMode={clearSectionMode}
        size={size}
        placeholder={placeholder}
        limit={limit}
        maxDropdownHeight={maxDropdownHeight}
        withScrollArea={withScrollArea}
        dropdownOpened={dropdownOpened}
        defaultDropdownOpened={defaultDropdownOpened}
        onDropdownOpen={onDropdownOpen}
        onDropdownClose={onDropdownClose}
        onOptionSubmit={onOptionSubmit}
        hiddenInputName={hiddenInputName}
        form={form}
        hiddenInputValuesDivider={hiddenInputValuesDivider}
        disabled={disabled}
        readOnly={readOnly}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        styles={styles}
        comboboxProps={comboboxProps}
        __triggerProps={triggerProps}
      >
        <MultiSelectTrigger />
        <MultiSelectDropdown />
      </MultiSelectRoot>
    );
  },
);

export const MultiSelect = withStaticProperties(MultiSelectComponent, {
  /** State machine: values / search / active-option + hidden input. Renders `<Combobox>`. */
  Root: MultiSelectRoot,
  /** The field: `<Combobox.Target><PillsInput/>`; hosts the pills + search field. */
  Trigger: MultiSelectTrigger,
  /** The pill row wrapper (`Pill.Group`); hosts the selected-value chips. */
  Pills: MultiSelectPills,
  /** A single removable selected-value chip (wraps `Pill`). */
  Pill: MultiSelectPill,
  /** The floating surface (wraps `Combobox.Dropdown`). */
  Dropdown: MultiSelectDropdown,
  /** The listbox body — accepts `data` OR `MultiSelect.Option` children. */
  Options: MultiSelectOptions,
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
