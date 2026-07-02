import * as React from "react";

import { Box } from "../Box";
import {
  type ComboboxItem,
  type ComboboxParsedItem,
  isComboboxGroup,
} from "../internal/combobox-data";
import { ScrollArea } from "../ScrollArea";
import { Text } from "../Text";
import {
  Combobox,
  type ComboboxEmptyProps,
  type ComboboxGroupProps,
  type ComboboxOptionProps,
} from "./Combobox";

/** Props spread onto every rendered `Combobox.Option` (minus the per-row controlled ones). */
type OptionPassthroughProps = Partial<
  Omit<ComboboxOptionProps, "value" | "selected" | "active" | "disabled" | "children" | "onClick">
>;
/** Props spread onto every rendered `Combobox.Group` (minus its controlled `label`/`children`). */
type GroupPassthroughProps = Partial<Omit<ComboboxGroupProps, "label" | "children">>;
/** Props spread onto the `Combobox.Empty` row (minus its `children`). */
type EmptyPassthroughProps = Partial<Omit<ComboboxEmptyProps, "children">>;

/** Input passed to a custom {@link ComboboxRenderOption}. Mirrors Mantine's `ComboboxLikeRenderOptionInput`. */
export interface ComboboxRenderOptionInput {
  /** The option being rendered. */
  option: ComboboxItem;
  /** Whether the option is currently selected. */
  checked?: boolean;
}

/**
 * Render-prop for custom option content — mirrors Mantine's `renderOption`. When
 * supplied, the returned node REPLACES the built-in check icon + label inside the
 * (still selectable) `Combobox.Option` row.
 */
export type ComboboxRenderOption = (input: ComboboxRenderOptionInput) => React.ReactNode;

/** Input passed to a custom {@link ComboboxRenderPill}. Mirrors Mantine's `ComboboxRenderPillInput`. */
export interface ComboboxRenderPillInput {
  /**
   * The option backing this pill. For free-text `TagsInput` tags with no matching
   * suggestion this is a synthesized `{ value, label }`.
   */
  option: ComboboxItem;
  /** The pill's value. */
  value: string;
  /** Remove this pill. */
  onRemove: () => void;
  /** Whether the pill is disabled. */
  disabled?: boolean;
}

/**
 * Render-prop for custom pill content in the multi-value members
 * (`MultiSelect`/`TagsInput`) — mirrors Mantine's `renderPill`. When supplied, the
 * returned node REPLACES the built-in removable `Pill`. (Mantine's `reorderProps`
 * drag-and-drop handle is omitted — no cross-platform reorder primitive in the kit.)
 */
export type ComboboxRenderPill = (input: ComboboxRenderPillInput) => React.ReactNode;

export interface OptionsDropdownProps {
  /** Already-filtered parsed data. */
  data: ComboboxParsedItem[];
  /**
   * Currently selected value(s) (drives the check icon + selected styling). A
   * single string for `Select`/`Autocomplete`; an array for `MultiSelect`, where
   * EVERY picked option shows a check.
   */
  value?: string | string[] | null;
  /** Keyboard-highlighted value. */
  activeValue?: string | null;
  /** Render a check icon next to the selected option. @default true */
  withCheckIcon?: boolean;
  /** Side the check icon is rendered on. @default 'left' */
  checkIconPosition?: "left" | "right";
  /** Message shown when `data` is empty. When omitted, nothing renders. */
  nothingFoundMessage?: React.ReactNode;
  /** Wrap the options in a `ScrollArea.Autosize`. @default true */
  withScrollArea?: boolean;
  /** Max dropdown height before scrolling. @default 250 */
  maxDropdownHeight?: number;
  /** Custom option content. Replaces the built-in check + label row. */
  renderOption?: ComboboxRenderOption;
  /** Props spread onto every rendered `Combobox.Option` (Pillar-B `option` slot). */
  optionProps?: OptionPassthroughProps;
  /** Props spread onto every rendered `Combobox.Group` (Pillar-B `group` slot). */
  groupProps?: GroupPassthroughProps;
  /** Props spread onto the `Combobox.Empty` row (Pillar-B `empty` slot). */
  emptyProps?: EmptyPassthroughProps;
  /** Accessible label for the listbox. */
  "aria-label"?: string;
}

interface OptionRowProps {
  item: ComboboxItem;
  checked: boolean;
  active: boolean;
  withCheckIcon: boolean;
  checkIconPosition: "left" | "right";
  optionProps?: OptionPassthroughProps;
  renderOption?: ComboboxRenderOption;
}

/**
 * One `Combobox.Option` row, memoized so that navigating the list (which only
 * flips `active`/`checked` on a couple of rows) re-renders just those rows
 * instead of rebuilding every option on each keystroke. With stable/absent
 * `optionProps`+`renderOption`, untouched rows keep referentially-equal props
 * and `React.memo` skips them.
 */
const OptionRow = React.memo(function OptionRow({
  item,
  checked,
  active,
  withCheckIcon,
  checkIconPosition,
  optionProps,
  renderOption,
}: OptionRowProps) {
  const check = withCheckIcon ? (
    <Box width={16} alignItems="center" justifyContent="center">
      {checked ? (
        <Text fontSize="$sm" color="$color11">
          ✓
        </Text>
      ) : null}
    </Box>
  ) : null;

  return (
    <Combobox.Option
      {...optionProps}
      value={item.value}
      selected={checked}
      active={active}
      disabled={item.disabled}
    >
      {renderOption ? (
        renderOption({ option: item, checked })
      ) : (
        <>
          {withCheckIcon && checkIconPosition === "left" ? check : null}
          <Text flex={1} fontSize="$sm" color="$color12" userSelect="none">
            {item.label}
          </Text>
          {withCheckIcon && checkIconPosition === "right" ? check : null}
        </>
      )}
    </Combobox.Option>
  );
});

/**
 * Shared dropdown body for the combobox family — renders parsed (already
 * filtered) data into `Combobox.Option`/`Combobox.Group`, with optional check
 * icons and an empty state, inside a `ScrollArea.Autosize`.
 *
 * Exposed publicly as the `Combobox.OptionsDropdown` static part; the four
 * selection sugars (Select/MultiSelect/Autocomplete/TagsInput) compose through it.
 */
export function OptionsDropdown(props: OptionsDropdownProps) {
  const {
    data,
    value,
    activeValue,
    withCheckIcon = true,
    checkIconPosition = "left",
    nothingFoundMessage,
    withScrollArea = true,
    maxDropdownHeight = 250,
    renderOption,
    optionProps,
    groupProps,
    emptyProps,
    "aria-label": ariaLabel,
  } = props;

  const options = React.useMemo(() => {
    const isChecked = (optionValue: string) =>
      Array.isArray(value) ? value.includes(optionValue) : value != null && value === optionValue;

    const renderItem = (item: ComboboxItem) => (
      <OptionRow
        key={item.value}
        item={item}
        checked={isChecked(item.value)}
        active={activeValue != null && activeValue === item.value}
        withCheckIcon={withCheckIcon}
        checkIconPosition={checkIconPosition}
        optionProps={optionProps}
        renderOption={renderOption}
      />
    );

    return data.map((item, index) =>
      isComboboxGroup(item) ? (
        <Combobox.Group key={`group-${index}`} {...groupProps} label={item.group}>
          {item.items.map(renderItem)}
        </Combobox.Group>
      ) : (
        renderItem(item)
      ),
    );
  }, [
    data,
    value,
    activeValue,
    withCheckIcon,
    checkIconPosition,
    optionProps,
    groupProps,
    renderOption,
  ]);

  if (data.length === 0) {
    return nothingFoundMessage != null ? (
      <Combobox.Empty {...emptyProps}>{nothingFoundMessage}</Combobox.Empty>
    ) : null;
  }

  const list = <Combobox.Options aria-label={ariaLabel}>{options}</Combobox.Options>;

  return withScrollArea ? (
    // Vertical-only: the option list never scrolls sideways. On native a default
    // `"xy"` ScrollArea nests a horizontal `ScrollView`, which sizes option rows to
    // their text width instead of stretching them to the dropdown — `"y"` keeps the
    // rows full width (and never shows a stray horizontal scrollbar on web).
    //
    // `keyboardShouldPersistTaps="handled"` (native): a focus-driven combobox
    // (searchable Select, Autocomplete, …) opens this dropdown while the soft
    // keyboard is up. With RN's default the ScrollView would swallow the first tap
    // to dismiss the keyboard, which blurs the field and closes the dropdown before
    // the option's press lands — so the option could never be picked. `"handled"`
    // delivers the tap to the option (keyboard stays up); empty-space taps still
    // dismiss. No-op on web (the web build closes on outside-press via the document).
    <ScrollArea.Autosize
      maxHeight={maxDropdownHeight}
      scrollbars="y"
      keyboardShouldPersistTaps="handled"
    >
      {list}
    </ScrollArea.Autosize>
  ) : (
    list
  );
}
