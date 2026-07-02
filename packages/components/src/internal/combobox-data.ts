/**
 * Shared option-data layer for the combobox family (`Combobox`/`Select`/
 * `Autocomplete`). Ported from Mantine's `get-parsed-combobox-data` +
 * `get-options-lockup`, fixed to `value: string` (the kit's pragmatic divergence
 * from Mantine's `Value extends Primitive` generic — keeps typing strict and
 * tractable while matching the common public API). No `any`.
 */

/** A single, fully-parsed option. */
export interface ComboboxItem {
  /** Option value (also used as the React key + lockup key). */
  value: string;
  /** Visible label; defaults to `value` when omitted in the source data. */
  label: string;
  /** Disable selection of this option. */
  disabled?: boolean;
}

/** A group of options sharing a heading. */
export interface ComboboxItemGroup {
  group: string;
  items: (string | ComboboxItem)[];
}

/** Accepted shape of the `data` prop: bare strings, items, or groups. */
export type ComboboxData = ReadonlyArray<string | ComboboxItem | ComboboxItemGroup>;

/** A parsed group (all string shorthands resolved to `ComboboxItem`). */
export interface ComboboxParsedItemGroup {
  group: string;
  items: ComboboxItem[];
}

/** A parsed option or parsed group. */
export type ComboboxParsedItem = ComboboxItem | ComboboxParsedItemGroup;

/** Narrows a parsed item to a group. */
export function isComboboxGroup(item: ComboboxParsedItem): item is ComboboxParsedItemGroup {
  return "group" in item;
}

function parseOption(item: string | ComboboxItem): ComboboxItem {
  return typeof item === "string" ? { value: item, label: item } : item;
}

/** Normalizes raw `data` into a flat list of parsed items + groups. */
export function getParsedComboboxData(data: ComboboxData | undefined): ComboboxParsedItem[] {
  if (!data) return [];
  return data.map((item) => {
    if (typeof item === "string") return { value: item, label: item };
    if ("group" in item) return { group: item.group, items: item.items.map(parseOption) };
    return item;
  });
}

/** Maps every option value (incl. inside groups) to its `ComboboxItem`. */
export function getOptionsLockup(parsed: ComboboxParsedItem[]): Record<string, ComboboxItem> {
  return parsed.reduce<Record<string, ComboboxItem>>((acc, item) => {
    if (isComboboxGroup(item)) {
      for (const sub of item.items) acc[sub.value] = sub;
    } else {
      acc[item.value] = item;
    }
    return acc;
  }, {});
}

/** Flattens parsed data (groups expanded) into an ordered option list. */
export function flattenComboboxOptions(parsed: ComboboxParsedItem[]): ComboboxItem[] {
  const out: ComboboxItem[] = [];
  for (const item of parsed) {
    if (isComboboxGroup(item)) out.push(...item.items);
    else out.push(item);
  }
  return out;
}

/**
 * Default filter: case-insensitive label substring match, group-aware, capped at
 * `limit`. An empty query returns everything (capped). Mirrors Mantine's default
 * `OptionsFilter` behaviour for the common case.
 */
export function filterComboboxData(
  parsed: ComboboxParsedItem[],
  search: string,
  limit: number = Number.POSITIVE_INFINITY,
): ComboboxParsedItem[] {
  const query = search.trim().toLowerCase();
  const matches = (item: ComboboxItem) => query === "" || item.label.toLowerCase().includes(query);

  let remaining = limit;
  const result: ComboboxParsedItem[] = [];
  for (const item of parsed) {
    if (remaining <= 0) break;
    if (isComboboxGroup(item)) {
      const items: ComboboxItem[] = [];
      for (const sub of item.items) {
        if (remaining <= 0) break;
        if (matches(sub)) {
          items.push(sub);
          remaining -= 1;
        }
      }
      if (items.length > 0) result.push({ group: item.group, items });
    } else if (matches(item)) {
      result.push(item);
      remaining -= 1;
    }
  }
  return result;
}

/**
 * Input passed to a custom {@link OptionsFilter}. Mirrors Mantine's
 * `FilterOptionsInput`, fixed to the kit's `value: string`.
 */
export interface FilterOptionsInput {
  /** Already-parsed (but un-filtered) option/group list. */
  options: ComboboxParsedItem[];
  /** Current search query. */
  search: string;
  /** Maximum number of options to return (use `Infinity` for no cap). */
  limit: number;
}

/**
 * Custom options-filtering hook for the combobox family — mirrors Mantine's
 * `OptionsFilter`. Receives the parsed options, the search query and a limit, and
 * returns the (possibly re-ordered / re-grouped) options to display. Fully pure
 * and cross-platform; the select family hardwires {@link defaultOptionsFilter}
 * unless a consumer supplies their own.
 */
export type OptionsFilter = (input: FilterOptionsInput) => ComboboxParsedItem[];

/**
 * The default {@link OptionsFilter} — a thin wrapper over
 * {@link filterComboboxData} (case-insensitive label substring match, group-aware,
 * capped at `limit`). A select-family member that does NOT pass a `filter` prop
 * resolves to this and is byte-for-byte unchanged.
 */
export const defaultOptionsFilter: OptionsFilter = ({ options, search, limit }) =>
  filterComboboxData(options, search, limit);
