import { withStaticProperties } from "@knitui/core";

import { Combobox as ComboboxBase } from "./Combobox";
import { OptionsDropdown } from "./OptionsDropdown";

export {
  type ComboboxData,
  type ComboboxItem,
  type ComboboxItemGroup,
  type ComboboxParsedItem,
  type ComboboxParsedItemGroup,
  defaultOptionsFilter,
  filterComboboxData,
  type FilterOptionsInput,
  flattenComboboxOptions,
  getOptionsLockup,
  getParsedComboboxData,
  isComboboxGroup,
  type OptionsFilter,
} from "../internal/combobox-data";

export {
  type ComboboxChevronProps,
  type ComboboxClearButtonProps,
  type ComboboxClearSectionMode,
  type ComboboxDropdownProps,
  type ComboboxEmptyProps,
  type ComboboxFooterProps,
  type ComboboxGroupProps,
  type ComboboxHeaderProps,
  type ComboboxHiddenInputProps,
  type ComboboxOptionProps,
  type ComboboxOptionsProps,
  type ComboboxProps,
  type ComboboxSize,
  type ComboboxTargetProps,
  type ComposedTriggerRightSection,
  composeTriggerRightSection,
  type ComposeTriggerRightSectionInput,
} from "./Combobox";
export {
  type ComboboxRenderOption,
  type ComboboxRenderOptionInput,
  type ComboboxRenderPill,
  type ComboboxRenderPillInput,
  type OptionsDropdownProps,
} from "./OptionsDropdown";

/**
 * The public `Combobox` compound. The primitive parts are assembled in
 * `./Combobox`; the data-driven `OptionsDropdown` body is attached here so the
 * `Combobox <-> OptionsDropdown` modules never form a require cycle (OptionsDropdown
 * imports the parts one-way; this entry depends on both). Consumers import
 * `Combobox` from this entry (the package barrel and selection sugars already do).
 */
export const Combobox = withStaticProperties(ComboboxBase, { OptionsDropdown });
export { type ComboboxStore, useCombobox, type UseComboboxOptions } from "./use-combobox";
