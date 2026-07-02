import * as React from "react";

import { withStaticProperties } from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import {
  Combobox,
  type ComboboxClearButtonProps,
  type ComboboxData,
  type ComboboxDropdownProps,
  type ComboboxEmptyProps,
  type ComboboxGroupProps,
  type ComboboxHiddenInputProps,
  type ComboboxOptionProps,
  type ComboboxParsedItem,
  type ComboboxProps,
  type ComboboxRenderOption,
  type ComboboxRenderPill,
  type ComboboxSize,
  composeTriggerRightSection,
  defaultOptionsFilter,
  flattenComboboxOptions,
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
import { PillsInput } from "../PillsInput";

// `filter` is Omit-ed so Mantine's options-`filter` prop (an `OptionsFilter` fn) can
// take that public name — the inherited CSS `filter` style prop would otherwise collide.
type TagsInputFieldProps = Omit<
  __BaseInputProps,
  "size" | "onChange" | "onFocus" | "onBlur" | "onKeyDown" | "filter"
>;

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`), keyed 1:1 with the
 * TagsInput part surface. Each key maps to the props of the part it targets, so
 * `styles={{ pill: { bg: "$color3" } }}` is sugar for `<TagsInput.Pill bg="$color3" />`.
 */
export interface TagsInputStyles {
  /** Props for the state-machine root (`TagsInput.Root` → `<Combobox>`). */
  root?: Partial<ComboboxProps>;
  /** Props for the field trigger (`TagsInput.Trigger` → `PillsInput`). */
  trigger?: Partial<TagsInputFieldProps>;
  /** Props for the pill row wrapper (`TagsInput.Pills` → `Pill.Group`). */
  pills?: Partial<PillGroupProps>;
  /** Props for each tag chip (`TagsInput.Pill` → `Pill`). */
  pill?: Partial<PillProps>;
  /** Props for the floating surface (`TagsInput.Dropdown`). */
  dropdown?: Partial<ComboboxDropdownProps>;
  /** Props for the listbox body (`TagsInput.Options`). */
  options?: Partial<OptionsDropdownProps>;
  /** Props for each option row (`TagsInput.Option`). */
  option?: Partial<ComboboxOptionProps>;
  /** Props for an option group (`TagsInput.Group`). */
  group?: Partial<ComboboxGroupProps>;
  /** Props for the empty state (`TagsInput.Empty`). */
  empty?: Partial<ComboboxEmptyProps>;
  /** Props for the clear button (`TagsInput.ClearButton`). */
  clearButton?: Partial<ComboboxClearButtonProps>;
}

const TAGS_INPUT_SLOT_KEYS = [
  "root",
  "trigger",
  "pills",
  "pill",
  "dropdown",
  "options",
  "option",
  "group",
  "empty",
  "clearButton",
] as const satisfies readonly (keyof TagsInputStyles)[];

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Removes already-picked LABELS from parsed suggestion data (group-aware). */
function filterPickedTags(data: ComboboxParsedItem[], picked: string[]): ComboboxParsedItem[] {
  const set = new Set(picked.map((v) => v.trim().toLowerCase()));
  const taken = (label: string) => set.has(label.trim().toLowerCase());
  return data.reduce<ComboboxParsedItem[]>((acc, item) => {
    if (isComboboxGroup(item)) {
      const items = item.items.filter((option) => !taken(option.label));
      if (items.length > 0) acc.push({ group: item.group, items });
    } else if (!taken(item.label)) {
      acc.push(item);
    }
    return acc;
  }, []);
}

/** Splits a string on `splitChars`, trims, drops empties. */
function splitTags(value: string, splitChars: string[]): string[] {
  if (splitChars.length === 0) return [value];
  const escaped = splitChars.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
  return value
    .split(new RegExp(`[${escaped}]`))
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");
}

/* -------------------------------------------------------------------------- */
/* Root context                                                                */
/* -------------------------------------------------------------------------- */

interface TagsInputContextValue {
  /** The shared combobox store (open state + keyboard target). */
  combobox: ReturnType<typeof useCombobox>;
  size: ComboboxSize;
  /** Step-down pill size derived from the field size. */
  pillSize: PillProps["size"];
  disabled?: boolean;
  readOnly?: boolean;
  /** The current committed tags. */
  value: string[];
  /** Text shown in the trigger field. */
  search: string;
  /** Already-filtered suggestion data for the dropdown. */
  filtered: ComboboxParsedItem[];
  /** The keyboard-highlighted value. */
  activeValue: string | null;
  /** Whether the clear button may be shown. */
  canClear: boolean;
  nothingFoundMessage?: React.ReactNode;
  withScrollArea: boolean;
  maxDropdownHeight: number;
  renderOption?: ComboboxRenderOption;
  /** Custom pill renderer hatch. */
  renderPill?: ComboboxRenderPill;
  placeholder?: string;
  /** Per-slot style sugar shared down to the parts. */
  styles?: SlotStyles<TagsInputStyles>;
  /** Deprecated alias merged over the `clearButton` slot. */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** Controls how the clear button coexists with the trigger's right section. */
  clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  /** Trigger props the sugar wrapper assembled (chrome, ref). */
  triggerProps?: Partial<TagsInputFieldProps> & {
    placeholder?: string;
    ref?: React.Ref<TagsInputRef>;
  };
  // Event/behaviour handlers consumed by TagsInput.Trigger.
  onClear: () => void;
  removeTag: (index: number) => void;
  onChangeText: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onPaste: React.ClipboardEventHandler<HTMLInputElement>;
}

const TagsInputContext = React.createContext<TagsInputContextValue | null>(null);

const useTagsInputContext = (): TagsInputContextValue => {
  const ctx = React.useContext(TagsInputContext);
  if (!ctx) {
    throw new Error("TagsInput compound components must be rendered inside <TagsInput.Root>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* TagsInput.Root — the free-text tag-list state machine                       */
/* -------------------------------------------------------------------------- */

export interface TagsInputRootProps {
  /** `TagsInput.Trigger` + `TagsInput.Dropdown`. */
  children?: React.ReactNode;
  /** Suggestion options shown in the dropdown. */
  data?: ComboboxData;
  /** Controlled tags. */
  value?: string[];
  /** Uncontrolled initial tags. */
  defaultValue?: string[];
  /** Called when the tags change. */
  onChange?: (value: string[]) => void;
  /** Called with the value of a removed tag. */
  onRemove?: (value: string) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Controlled search value. */
  searchValue?: string;
  /** Uncontrolled initial search value. */
  defaultSearchValue?: string;
  /** Called when the search value changes. */
  onSearchChange?: (value: string) => void;
  /** Maximum number of tags. @default Infinity */
  maxTags?: number;
  /** Called when the user tries to add more than `maxTags`. */
  onMaxTags?: (value: string) => void;
  /** Allow duplicate tags. @default false */
  allowDuplicates?: boolean;
  /** Called when the user tries to add a duplicate tag. */
  onDuplicate?: (value: string) => void;
  /** Custom duplicate check. Defaults to a case-insensitive match. */
  isDuplicate?: (value: string, current: string[]) => boolean;
  /** Characters that trigger a tag split. @default [','] */
  splitChars?: string[];
  /** Commit the pending typed value on blur. @default true */
  acceptValueOnBlur?: boolean;
  /** Highlight the first matching suggestion after each search change. @default false */
  selectFirstOptionOnChange?: boolean;
  /** Clear the search field after a tag is added. @default true */
  clearSearchOnChange?: boolean;
  /** Custom options filter for the suggestions. @default a case-insensitive label substring match. */
  filter?: OptionsFilter;
  /** Custom suggestion content. Receives `{ option, checked }`. */
  renderOption?: ComboboxRenderOption;
  /** Custom pill content. Receives `{ option, value, onRemove, disabled }`; replaces the built-in `Pill`. */
  renderPill?: ComboboxRenderPill;
  /** Show a clear button when there is a value. @default false */
  clearable?: boolean;
  /** Message shown when no suggestion matches. */
  nothingFoundMessage?: React.ReactNode;
  /** Control size. @default 'md' */
  size?: ComboboxSize;
  /** Maximum number of suggestions displayed. @default Infinity */
  limit?: number;
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
  /** Called when a suggestion option is submitted. */
  onOptionSubmit?: (value: string) => void;
  /** Disable the control. */
  disabled?: boolean;
  /** Read-only mode (dropdown opens but tags can't change). */
  readOnly?: boolean;
  /** Placeholder for the inner field. */
  placeholder?: string;
  /** Field paste handler (fires before the built-in split-on-paste behaviour). */
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
  /** Field focus handler. */
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  /** Field blur handler. */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Field keydown handler (fires after the built-in behaviour). */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  /** Per-slot style sugar — shared to the parts. */
  styles?: SlotStyles<TagsInputStyles>;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /**
   * @deprecated Use `styles={{ clearButton: … }}` (or render `<TagsInput.ClearButton>`
   * directly). Merged OVER the `clearButton` slot.
   */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** How the clear button and right section coexist. @default 'both' */
  clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  /**
   * Trigger props assembled by the sugar `<TagsInput>` wrapper (field chrome, ref).
   * Not part of the public composable API — when composing by hand you render
   * `<TagsInput.Trigger>` with your own props instead.
   * @internal
   */
  __triggerProps?: TagsInputContextValue["triggerProps"];
}

function TagsInputRoot(props: TagsInputRootProps) {
  const {
    children,
    data,
    value,
    defaultValue,
    onChange,
    onRemove,
    onClear,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    maxTags = Number.POSITIVE_INFINITY,
    onMaxTags,
    allowDuplicates = false,
    onDuplicate,
    isDuplicate,
    splitChars = [","],
    acceptValueOnBlur = true,
    selectFirstOptionOnChange = false,
    clearSearchOnChange = true,
    filter,
    renderOption,
    renderPill,
    clearable = false,
    nothingFoundMessage,
    size = "md",
    limit,
    maxDropdownHeight = 250,
    withScrollArea = true,
    dropdownOpened,
    defaultDropdownOpened,
    onDropdownOpen,
    onDropdownClose,
    onOptionSubmit,
    disabled,
    readOnly,
    placeholder,
    onPaste,
    onFocus,
    onBlur,
    onKeyDown,
    styles,
    comboboxProps,
    clearButtonProps,
    clearSectionMode,
    __triggerProps,
  } = props;

  // Tags are embedded in the field, so derive a SMALLER pill size from the field
  // size (field md → pills sm) so they never overflow the field height.
  const pillSize = toEmbeddedControlSize(size);

  const parsed = React.useMemo(() => getParsedComboboxData(data), [data]);

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

  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  // Set on a user-typed search change so the next `flatOptions` recompute highlights
  // the first match (Mantine's `selectFirstOptionOnChange`); a ref avoids racing the
  // filter memo and scopes the behaviour to actual input changes.
  const selectFirstPending = React.useRef(false);

  const isDup = React.useCallback(
    (tag: string, current: string[]) =>
      isDuplicate
        ? isDuplicate(tag, current)
        : current.some((t) => t.toLowerCase() === tag.toLowerCase()),
    [isDuplicate],
  );

  const addTag = React.useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (tag.length === 0) return;
      if (!allowDuplicates && isDup(tag, _value)) {
        onDuplicate?.(tag);
        setSearch("");
        return;
      }
      if (_value.length >= maxTags) {
        onMaxTags?.(tag);
        return;
      }
      setValue([..._value, tag]);
      if (clearSearchOnChange) setSearch("");
    },
    [
      allowDuplicates,
      isDup,
      _value,
      onDuplicate,
      maxTags,
      onMaxTags,
      setValue,
      setSearch,
      clearSearchOnChange,
    ],
  );

  // Commit a batch of tags in ONE pass — merges into the current value honouring
  // `maxTags` + duplicates, then `setValue` once. Used by the split-on-key and
  // split-on-paste paths (a per-tag `addTag` loop would read the render-time `_value`
  // for every call, so only the last tag would survive).
  const commitTags = React.useCallback(
    (tags: string[]) => {
      const merged = _value.slice();
      for (const raw of tags) {
        const tag = raw.trim();
        if (tag.length === 0) continue;
        if (merged.length >= maxTags) {
          onMaxTags?.(tag);
          break;
        }
        if (!allowDuplicates && isDup(tag, merged)) {
          onDuplicate?.(tag);
          continue;
        }
        merged.push(tag);
      }
      if (merged.length !== _value.length) setValue(merged);
      if (clearSearchOnChange) setSearch("");
    },
    [
      _value,
      maxTags,
      onMaxTags,
      allowDuplicates,
      isDup,
      onDuplicate,
      setValue,
      clearSearchOnChange,
      setSearch,
    ],
  );

  const removeTag = React.useCallback(
    (index: number) => {
      const next = _value.slice();
      const [removed] = next.splice(index, 1);
      setValue(next);
      if (removed != null) onRemove?.(removed);
    },
    [_value, setValue, onRemove],
  );

  const suggestions = React.useMemo(() => filterPickedTags(parsed, _value), [parsed, _value]);
  const filterFn = filter ?? defaultOptionsFilter;
  const filtered = React.useMemo(
    () => filterFn({ options: suggestions, search, limit: limit ?? Number.POSITIVE_INFINITY }),
    [filterFn, suggestions, search, limit],
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

  const handleSubmit = React.useCallback(
    (optionValue: string) => {
      onOptionSubmit?.(optionValue);
      addTag(optionValue);
    },
    [onOptionSubmit, addTag],
  );

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled || readOnly) return;
    const trimmed = search.trim();

    if (splitChars.includes(event.key) && trimmed.length > 0) {
      event.preventDefault();
      commitTags(splitTags(search, splitChars));
      onKeyDown?.(event);
      return;
    }

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
        event.preventDefault();
        if (combobox.opened && activeValue != null) {
          handleSubmit(activeValue);
        } else if (trimmed.length > 0) {
          addTag(trimmed);
        }
        break;
      case "Backspace":
        if (search.length === 0 && _value.length > 0) {
          removeTag(_value.length - 1);
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
    const newSearch = event.currentTarget.value;
    setSearch(newSearch);
    if (newSearch.length > 0) {
      combobox.openDropdown();
    } else {
      combobox.closeDropdown();
    }
    if (selectFirstOptionOnChange) selectFirstPending.current = true;
  };

  // Split a pasted string into tags on `splitChars` (combined with any pending search),
  // mirroring Mantine's paste behaviour. Web-only: native `TextInput` has no paste event
  // in this path, so a multi-value paste lands as one tag (the documented web-functional model).
  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    onPaste?.(event);
    if (disabled || readOnly) return;
    const pasted = event.clipboardData?.getData("text/plain") ?? "";
    const tags = splitTags(`${search}${pasted}`, splitChars);
    if (tags.length === 0) return;
    event.preventDefault();
    commitTags(tags);
  };

  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (event) => {
    onFocus?.(event);
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
    combobox.closeDropdown();
    if (acceptValueOnBlur) addTag(search);
    else setSearch("");
    onBlur?.(event);
  };

  const handleClear = React.useCallback(() => {
    setValue([]);
    setSearch("");
    onClear?.();
  }, [setValue, setSearch, onClear]);

  const canClear = clearable && _value.length > 0 && !disabled && !readOnly;

  const ctx = React.useMemo<TagsInputContextValue>(
    () => ({
      combobox,
      size,
      pillSize,
      disabled,
      readOnly,
      value: _value,
      search,
      filtered,
      activeValue,
      canClear,
      nothingFoundMessage,
      withScrollArea,
      maxDropdownHeight,
      renderOption,
      renderPill,
      placeholder,
      styles,
      clearButtonProps,
      clearSectionMode,
      triggerProps: __triggerProps,
      onClear: handleClear,
      removeTag,
      onChangeText: handleChange,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onPaste: handlePaste,
    }),
    // handlers are recreated each render (they close over render-scoped state); the
    // context value is intentionally not stable, mirroring the original component.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      combobox,
      size,
      pillSize,
      disabled,
      readOnly,
      _value,
      search,
      filtered,
      activeValue,
      canClear,
      nothingFoundMessage,
      withScrollArea,
      maxDropdownHeight,
      renderOption,
      renderPill,
      placeholder,
      styles,
      clearButtonProps,
      clearSectionMode,
      __triggerProps,
      removeTag,
    ],
  );

  const s = slotStyles<TagsInputStyles>(styles, TAGS_INPUT_SLOT_KEYS, "TagsInput");

  return (
    <TagsInputContext.Provider value={ctx}>
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
    </TagsInputContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* TagsInput.Pill — a removable tag chip                                       */
/* -------------------------------------------------------------------------- */

export interface TagsInputPillProps extends PillProps {}

/**
 * A single removable tag chip. When rendered by the data-driven `TagsInput.Trigger`
 * each chip is wired to remove its tag; rendered by hand it is a plain `Pill` that
 * inherits the field-relative size from the enclosing `Pill.Group`.
 */
const TagsInputPill = React.forwardRef<React.ComponentRef<typeof Pill>, TagsInputPillProps>(
  function TagsInputPill(props, ref) {
    const ctx = useTagsInputContext();
    const s = slotStyles<TagsInputStyles>(ctx.styles, TAGS_INPUT_SLOT_KEYS, "TagsInput");
    return <Pill ref={ref} {...s.get("pill")} {...props} />;
  },
);

/* -------------------------------------------------------------------------- */
/* TagsInput.Pills — the pill row wrapper (`Pill.Group`)                       */
/* -------------------------------------------------------------------------- */

export interface TagsInputPillsProps extends Partial<PillGroupProps> {}

/**
 * Thin wrapper over `Pill.Group` that hosts the tag chips inside the trigger.
 * Pulls field-relative `size`/`disabled` from context so consumers can restyle /
 * recompose the pill row without re-deriving them.
 */
function TagsInputPills(props: TagsInputPillsProps) {
  const ctx = useTagsInputContext();
  const s = slotStyles<TagsInputStyles>(ctx.styles, TAGS_INPUT_SLOT_KEYS, "TagsInput");
  return (
    <Pill.Group
      // `pills` slot sugar is the LOWEST precedence.
      {...s.get("pills")}
      size={ctx.pillSize}
      disabled={ctx.disabled}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* TagsInput.Trigger — the PillsInput-as-combobox target                       */
/* -------------------------------------------------------------------------- */

export interface TagsInputTriggerProps extends Partial<TagsInputFieldProps> {
  /** Explicit children replace the data-driven pills + field body. */
  children?: React.ReactNode;
  /** Placeholder for the inner field (funnels to the underlying input). */
  placeholder?: string;
  /** Single-element ref to the bordered frame. */
  ref?: React.Ref<TagsInputRef>;
}

const TagsInputTrigger = React.forwardRef<TagsInputRef, TagsInputTriggerProps>(
  function TagsInputTrigger(props, ref) {
    const ctx = useTagsInputContext();
    const s = slotStyles<TagsInputStyles>(ctx.styles, TAGS_INPUT_SLOT_KEYS, "TagsInput");

    // The sugar `<TagsInput>` wrapper funnels its chrome props + ref through context
    // so a composable caller and the sugar caller resolve to the same trigger.
    // Explicit props on `<TagsInput.Trigger>` win over the funneled ones, which in
    // turn win over the `trigger` slot sugar.
    const funneled = ctx.triggerProps ?? {};
    const { placeholder: funneledPlaceholder, ref: funneledRef, ...funneledRest } = funneled;

    const {
      children,
      placeholder = funneledPlaceholder ?? ctx.placeholder,
      rightSection: funneledRightSection,
      rightSectionPointerEvents: funneledRightSectionPointerEvents,
      ...funneledChrome
    } = { ...funneledRest, ...props };

    const mergedRef = ref ?? funneledRef;

    // Pure composition of the clear button into the trigger's right section — no
    // longer riding PillsInput's private `__clearSection` channel.
    // `composeTriggerRightSection` owns the `clearSectionMode` coexistence math
    // (TagsInput has no chevron, so the clear button is the only adornment).
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
      clearSection: clearButton,
      clearable: ctx.canClear,
      mode: ctx.clearSectionMode,
    });

    const pills = ctx.value.map((item, index) =>
      ctx.renderPill ? (
        <React.Fragment key={`${item}-${index}`}>
          {ctx.renderPill({
            option: { value: item, label: item },
            value: item,
            onRemove: () => ctx.removeTag(index),
            disabled: ctx.disabled || ctx.readOnly,
          })}
        </React.Fragment>
      ) : (
        <TagsInputPill
          key={`${item}-${index}`}
          size={ctx.pillSize}
          withRemoveButton={!ctx.readOnly}
          disabled={ctx.disabled}
          onRemove={() => ctx.removeTag(index)}
        >
          {item}
        </TagsInputPill>
      ),
    );

    return (
      <Combobox.Target>
        <PillsInput
          // `trigger` slot sugar is the LOWEST precedence.
          {...s.get("trigger")}
          {...funneledChrome}
          ref={mergedRef}
          size={ctx.size}
          disabled={ctx.disabled}
          rightSection={rightSection.node}
          rightSectionPointerEvents={
            rightSection.pointerEvents ?? funneledRightSectionPointerEvents
          }
        >
          {children ?? (
            <TagsInputPills>
              {pills}
              <PillsInput.Field
                placeholder={placeholder}
                value={ctx.search}
                disabled={ctx.disabled}
                readOnly={ctx.readOnly}
                onChange={ctx.onChangeText}
                onFocus={ctx.onFocus}
                onBlur={ctx.onBlur}
                onKeyDown={ctx.onKeyDown}
                onPaste={ctx.onPaste}
              />
            </TagsInputPills>
          )}
        </PillsInput>
      </Combobox.Target>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* TagsInput.Dropdown — the floating surface                                   */
/* -------------------------------------------------------------------------- */

export interface TagsInputDropdownProps extends ComboboxDropdownProps {}

const TagsInputDropdown = React.forwardRef<
  React.ComponentRef<typeof Combobox.Dropdown>,
  TagsInputDropdownProps
>(function TagsInputDropdown(props, ref) {
  const ctx = useTagsInputContext();
  const s = slotStyles<TagsInputStyles>(ctx.styles, TAGS_INPUT_SLOT_KEYS, "TagsInput");
  const { children, ...rest } = props;
  return (
    <Combobox.Dropdown ref={ref} {...s.get("dropdown")} {...rest}>
      {children ?? <TagsInputOptions />}
    </Combobox.Dropdown>
  );
});

/* -------------------------------------------------------------------------- */
/* TagsInput.Options — the suggestion listbox body (data OR children)          */
/* -------------------------------------------------------------------------- */

export interface TagsInputOptionsProps extends Partial<
  Omit<OptionsDropdownProps, "value" | "activeValue">
> {
  /** Render explicit option children instead of the context suggestions. */
  children?: React.ReactNode;
}

function TagsInputOptions(props: TagsInputOptionsProps) {
  const ctx = useTagsInputContext();
  const s = slotStyles<TagsInputStyles>(ctx.styles, TAGS_INPUT_SLOT_KEYS, "TagsInput");
  const { children, data, ...rest } = props;

  // Explicit children replace the data-driven body (the composable path where the
  // caller maps `TagsInput.Option`s themselves).
  if (children != null) {
    return <Combobox.Options>{children}</Combobox.Options>;
  }

  return (
    <Combobox.OptionsDropdown
      // `options` slot sugar UNDER explicit props.
      {...s.get("options")}
      data={data ?? ctx.filtered}
      value={null}
      activeValue={ctx.activeValue}
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
/* TagsInput.HiddenInput — re-export with TagsInput context defaults           */
/* -------------------------------------------------------------------------- */

export interface TagsInputHiddenInputProps extends Omit<ComboboxHiddenInputProps, "value"> {
  /** Override the committed tags (defaults to the context value). */
  value?: string[];
}

function TagsInputHiddenInput(props: TagsInputHiddenInputProps) {
  const ctx = useTagsInputContext();
  const { value = ctx.value, disabled = ctx.disabled, ...rest } = props;
  return <Combobox.HiddenInput value={value} disabled={disabled} {...rest} />;
}

/* -------------------------------------------------------------------------- */
/* Sugar wrapper — the backward-compatible <TagsInput … /> prop API            */
/* -------------------------------------------------------------------------- */

// `filter` is Omit-ed so Mantine's options-`filter` prop (an `OptionsFilter` fn) can
// take that public name — the inherited CSS `filter` style prop would otherwise collide.
export interface TagsInputProps extends Omit<TagsInputFieldProps, "styles"> {
  /** Read-only mode (dropdown opens but tags can't change). */
  readOnly?: boolean;
  /** Suggestion options shown in the dropdown. */
  data?: ComboboxData;
  /** Controlled tags. */
  value?: string[];
  /** Uncontrolled initial tags. */
  defaultValue?: string[];
  /** Called when the tags change. */
  onChange?: (value: string[]) => void;
  /** Called with the value of a removed tag. */
  onRemove?: (value: string) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Controlled search value. */
  searchValue?: string;
  /** Uncontrolled initial search value. */
  defaultSearchValue?: string;
  /** Called when the search value changes. */
  onSearchChange?: (value: string) => void;
  /** Maximum number of tags. @default Infinity */
  maxTags?: number;
  /** Called when the user tries to add more than `maxTags`. */
  onMaxTags?: (value: string) => void;
  /** Allow duplicate tags. @default false */
  allowDuplicates?: boolean;
  /** Called when the user tries to add a duplicate tag. */
  onDuplicate?: (value: string) => void;
  /** Custom duplicate check. Defaults to a case-insensitive match. */
  isDuplicate?: (value: string, current: string[]) => boolean;
  /** Characters that trigger a tag split. @default [','] */
  splitChars?: string[];
  /** Commit the pending typed value on blur. @default true */
  acceptValueOnBlur?: boolean;
  /** Highlight the first matching suggestion after each search change. @default false */
  selectFirstOptionOnChange?: boolean;
  /** Clear the search field after a tag is added. @default true */
  clearSearchOnChange?: boolean;
  /** Custom options filter for the suggestions. @default a case-insensitive label substring match. */
  filter?: OptionsFilter;
  /** Custom suggestion content. Receives `{ option, checked }`. */
  renderOption?: ComboboxRenderOption;
  /** Custom pill content. Receives `{ option, value, onRemove, disabled }`; replaces the built-in `Pill`. */
  renderPill?: ComboboxRenderPill;
  /** Field paste handler (fires before the built-in split-on-paste behaviour). */
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
  /** Show a clear button when there is a value. @default false */
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
  /** Called when a suggestion option is submitted. */
  onOptionSubmit?: (value: string) => void;
  /** Hidden web-form input name (renders a comma-joined hidden field). */
  hiddenInputName?: string;
  /** Associated `<form>` id for the hidden input. */
  form?: string;
  /** Divider for the hidden input value. @default ',' */
  hiddenInputValuesDivider?: string;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /** Placeholder for the inner field. */
  placeholder?: string;
  /** Field focus handler. */
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  /** Field blur handler. */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Field keydown handler (fires after the built-in behaviour). */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  /** Per-slot style sugar — props spread onto the matching part. */
  styles?: SlotStyles<TagsInputStyles>;
}

export type TagsInputRef = React.ComponentRef<typeof PillsInput>;

/**
 * Free-text tags input — mirrors Mantine's `TagsInput`, built on `Combobox` +
 * `PillsInput`. Tags are typed (committed on `Enter`, a split character, or blur)
 * or picked from optional `data` suggestions, and render as removable `Pill`s.
 * This prop API is sugar that renders the composable parts (`TagsInput.Root` /
 * `TagsInput.Trigger` / `TagsInput.Dropdown` / `TagsInput.Options`); it contains no
 * behavior the parts lack. Accent comes from the Tamagui `theme` prop + palette
 * ramp, never a Mantine `color` prop. Keyboard navigation is web-only (the
 * documented roving-focus gap shared with `Menu`/`Select`); on native, tags add via
 * the on-screen keyboard's return key and remove via the pill button.
 */
const TagsInputComponent = React.forwardRef<TagsInputRef, TagsInputProps>(
  function TagsInput(props, ref) {
    const {
      // Root behavior props.
      data,
      value,
      defaultValue,
      onChange,
      onRemove,
      onClear,
      searchValue,
      defaultSearchValue,
      onSearchChange,
      maxTags = Number.POSITIVE_INFINITY,
      onMaxTags,
      allowDuplicates = false,
      onDuplicate,
      isDuplicate,
      splitChars = [","],
      acceptValueOnBlur = true,
      selectFirstOptionOnChange = false,
      clearSearchOnChange = true,
      filter,
      renderOption,
      renderPill,
      onPaste,
      clearable = false,
      clearButtonProps,
      clearSectionMode,
      nothingFoundMessage,
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

      ...inputProps
    } = props;

    // The remaining chrome props are funneled to `TagsInput.Trigger` via Root context
    // so the sugar path and the composable path converge on the same trigger element.
    const triggerProps: TagsInputContextValue["triggerProps"] = {
      ...inputProps,
      placeholder,
      // Forward ONLY the field-chrome slots to the trigger's `PillsInput` →
      // `Input.Wrapper`; the dropdown/option/pill/etc. slots stay with the parts that
      // consume them, so `Input.Wrapper` never dev-warns about slots it doesn't own.
      styles: pick<TagsInputStyles, InputWrapperSlots>(styles, INPUT_WRAPPER_SLOTS),
      ref,
    };

    return (
      <>
        <TagsInputRoot
          data={data}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onRemove={onRemove}
          onClear={onClear}
          searchValue={searchValue}
          defaultSearchValue={defaultSearchValue}
          onSearchChange={onSearchChange}
          maxTags={maxTags}
          onMaxTags={onMaxTags}
          allowDuplicates={allowDuplicates}
          onDuplicate={onDuplicate}
          isDuplicate={isDuplicate}
          splitChars={splitChars}
          acceptValueOnBlur={acceptValueOnBlur}
          selectFirstOptionOnChange={selectFirstOptionOnChange}
          clearSearchOnChange={clearSearchOnChange}
          filter={filter}
          renderOption={renderOption}
          renderPill={renderPill}
          onPaste={onPaste}
          clearable={clearable}
          clearButtonProps={clearButtonProps}
          clearSectionMode={clearSectionMode}
          nothingFoundMessage={nothingFoundMessage}
          size={size}
          limit={limit}
          maxDropdownHeight={maxDropdownHeight}
          withScrollArea={withScrollArea}
          dropdownOpened={dropdownOpened}
          defaultDropdownOpened={defaultDropdownOpened}
          onDropdownOpen={onDropdownOpen}
          onDropdownClose={onDropdownClose}
          onOptionSubmit={onOptionSubmit}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          styles={styles}
          comboboxProps={comboboxProps}
          __triggerProps={triggerProps}
        >
          <TagsInputTrigger />
          <TagsInputDropdown />
          {/* Inside Root so the hidden field reads the LIVE committed tags from
              context (single source of truth) — tracking edits in both controlled
              and uncontrolled modes, not the stale initial `value ?? defaultValue`. */}
          <TagsInputHiddenInput
            name={hiddenInputName}
            form={form}
            valuesDivider={hiddenInputValuesDivider}
          />
        </TagsInputRoot>
      </>
    );
  },
);

export const TagsInput = withStaticProperties(TagsInputComponent, {
  /** State machine: tags / search / active-option + free-text create. Renders `<Combobox>`. */
  Root: TagsInputRoot,
  /** The field: `<Combobox.Target><PillsInput/>`; hosts the pills + editable field. */
  Trigger: TagsInputTrigger,
  /** The pill row wrapper (`Pill.Group`); hosts the tag chips. */
  Pills: TagsInputPills,
  /** A removable tag chip (wraps `Pill`). */
  Pill: TagsInputPill,
  /** The floating surface (wraps `Combobox.Dropdown`). */
  Dropdown: TagsInputDropdown,
  /** The suggestion listbox body — accepts `data` OR `TagsInput.Option` children. */
  Options: TagsInputOptions,
  /** Re-export of `Combobox.Option`. */
  Option: Combobox.Option,
  /** Re-export of `Combobox.Group`. */
  Group: Combobox.Group,
  /** Re-export of `Combobox.Empty`. */
  Empty: Combobox.Empty,
  /** Re-export of `Combobox.ClearButton`. */
  ClearButton: Combobox.ClearButton,
  /** Hidden web-form input bound to the context tags. */
  HiddenInput: TagsInputHiddenInput,
});
