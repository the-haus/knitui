// ───────────────────────────────────────────────────────────────────────────
// TimePresets — the preset list shown in the `TimePicker` dropdown instead of the
// scroll columns.
//
// Mirrors `@mantine/dates`' `TimePresets` API (props/defaults) but is built on
// `@knitui/components` (`ScrollArea`/`SimpleGrid`/`Stack`) + `@knitui/core`
// (`styled`/`createStyledContext`/slot sugar) + the folder-local
// `TimePresetControl`/`TimePresetGroup` parts — NEVER `@mantine/core` — so it
// renders on web AND native from one source. Accent comes from the active Tamagui
// theme (`theme="red"`), never a Mantine-style `color` prop. Folder-local to the
// `TimePicker` dropdown — NOT re-exported from the public `src/index.ts` barrel
// (Mantine keeps it private too).
//
// This is a LIST component: per-cell sizing/colour/interaction (checklist #3/#4/
// #12/#15) live in the `TimePresetControl` leaf — TimePresets just lays out the
// list, shares `size` down via context, decides the flat/grouped split with typed
// predicates (no casts), and offers `styles` sugar over its parts plus a per-value
// `getControlProps` passthrough (explicit beats sugar).
//
// The scroll viewport is the kit's own `ScrollArea` (exposed as `.Frame`), NOT a
// `styled(ScrollArea)` wrapper: wrapping it re-types `ScrollArea`'s
// `shadowColor?: string` own-prop as a theme-token value, which collides with the
// inherited `string` (the documented ScrollArea shadowColor trap). For the same
// reason this root is a plain function rather than `.styleable`.
// ───────────────────────────────────────────────────────────────────────────
import { ScrollArea, type ScrollAreaProps, SimpleGrid, Stack } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  slotStyles,
  type SlotStyles,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { type CalendarSize, CELL_SPACING } from "../cell-metrics";
import type {
  TimePickerAmPmLabels,
  TimePickerFormat,
  TimePickerPresetGroup,
  TimePickerPresets,
} from "../types";
import { isSameTime } from "../utils";
import { TimePresetControl, type TimePresetControlProps } from "./TimePresetControl";
import { TimePresetGroup } from "./TimePresetGroup";

/** Default maximum dropdown content height in px before it scrolls (Mantine parity). */
const DEFAULT_MAX_HEIGHT = 200;

// ── 2. Shared context ───────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to the styled parts so they share the
// SAME size the consumer set on the root without prop-drilling. The leaf cells
// still take an explicit `size` prop (they own the `size` variant).
const TimePresetsContext = createStyledContext<{ size: CalendarSize }>({ size: "sm" });

// ── 5. Styled parts ───────────────────────────────────────────────────────────
// The scroll viewport is the kit `ScrollArea` (exposed as `.Frame`, not a styled
// wrapper — see the header note on the ScrollArea shadowColor trap). The styled
// part that carries the shared context is the flat grid / grouped stack.

/** The grid wrapping a flat `string[]` of preset cells (web `role="list"`). */
const TimePresetsGrid = styled(SimpleGrid, {
  name: "TimePresetsGrid",
  context: TimePresetsContext,
});

/** The stack wrapping the labelled groups (web `role="list"`). */
const TimePresetsGroups = styled(Stack, {
  name: "TimePresetsGroups",
  context: TimePresetsContext,
  gap: "$sm",
});

// ── 7. Per-slot `styles` sugar + per-item passthrough ───────────────────────────
// The kit's ONE styling model is props on the parts. `styles` is thin sugar over
// that: a map from named slot → that part's props, resolved through
// `slotStyles().merge` so precedence is fixed in one place —
//   defaults < styles[slot] < explicit xxxProps < inline props.
// Per-cell dynamics that a static map can't express stay on the
// `getControlProps(value)` callback; it wins over the `control` slot — explicit
// beats sugar.

/** The named style slots and the styled part each targets. */
export interface TimePresetsStyles {
  /** Props for the scroll viewport (`.Frame`). */
  root?: ScrollAreaProps;
  /** Props for the flat grid (`.Grid`). */
  grid?: GetProps<typeof TimePresetsGrid>;
  /** Props for the grouped stack (`.Groups`). */
  groups?: GetProps<typeof TimePresetsGroups>;
  /** Props for each preset cell (`.Control` — the `TimePresetControl` leaf). */
  control?: Partial<TimePresetControlProps>;
}

const TIME_PRESETS_SLOT_KEYS = [
  "root",
  "grid",
  "groups",
  "control",
] as const satisfies readonly (keyof TimePresetsStyles)[];

/** Props for {@link TimePresets}. */
export interface TimePresetsProps {
  /** Flat `string[]` of times or labelled {@link TimePickerPresetGroup}s. */
  presets: TimePickerPresets;

  /** Clock display mode. */
  format: TimePickerFormat;

  /** AM/PM labels for the `12h` mode. */
  amPmLabels: TimePickerAmPmLabels;

  /** Currently selected value in 24h format. */
  value: string;

  /** Whether seconds are displayed. */
  withSeconds: boolean;

  /** Called with the pressed preset value. */
  onChange: (value: string) => void;

  /** Maximum dropdown content height in px before it scrolls. @default 200 */
  maxHeight?: number;

  /** Label font size. @default 'sm' */
  size?: CalendarSize;

  /** Props forwarded to the underlying `ScrollArea` (wins over `styles.root`). */
  scrollAreaProps?: ScrollAreaProps;

  /** Passes props down to each preset cell, keyed by value (wins over `styles.control`). */
  getControlProps?: (value: string) => Partial<TimePresetControlProps>;

  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<TimePresetsStyles>;
}

/**
 * `TimePresets` — the preset list shown in the `TimePicker` dropdown instead of
 * the scroll columns. The `any`-free, cross-platform port of Mantine's
 * `TimePresets`: a flat `string[]` renders as one `SimpleGrid` of
 * `TimePresetControl`s; a `TimePickerPresetGroup[]` renders one labelled
 * `TimePresetGroup` per entry. Scrolls within `maxHeight` via the kit
 * `ScrollArea.Autosize`. The flat/grouped split is decided with typed predicates
 * (no casts).
 *
 * Per-cell sizing/colour/interaction live in the `TimePresetControl` leaf
 * (delegated); this lays out the list, shares `size` via context, and offers
 * `styles` sugar over its parts plus a per-value `getControlProps` passthrough
 * (explicit beats sugar).
 *
 * a11y: the flat grid / grouped stack is `role="list"` (the ARIA `listbox` role is
 * absent from the cross-platform `Role` union, the same gap as `TimeControlsList`),
 * each cell `role="option"`; native counterparts ride on each cell's own
 * `accessibility*` props. Folder-local to the `TimePicker` dropdown.
 */
function TimePresetsComponent({
  presets,
  format,
  amPmLabels,
  withSeconds,
  value,
  onChange,
  maxHeight = DEFAULT_MAX_HEIGHT,
  size = "sm",
  scrollAreaProps,
  getControlProps,
  styles,
}: TimePresetsProps) {
  // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
  const s = slotStyles<TimePresetsStyles>(styles, TIME_PRESETS_SLOT_KEYS, "TimePresets");

  if (presets.length === 0) {
    return null;
  }

  const flat = presets.filter((preset): preset is string => typeof preset === "string");
  const groups = presets.filter(
    (preset): preset is TimePickerPresetGroup => typeof preset !== "string",
  );

  return (
    <ScrollArea.Autosize
      maxHeight={maxHeight}
      scrollbars="y"
      type="never"
      {...s.get("root")}
      {...scrollAreaProps}
    >
      {flat.length > 0 ? (
        <TimePresetsGrid
          role="list"
          cols={withSeconds ? 2 : 3}
          spacing={CELL_SPACING * 2}
          {...s.get("grid")}
        >
          {flat.map((item) => {
            const controlProps = getControlProps?.(item);
            return (
              <TimePresetControl
                key={item}
                value={item}
                format={format}
                amPmLabels={amPmLabels}
                withSeconds={withSeconds}
                active={isSameTime({ time: item, compare: value, withSeconds })}
                onChange={onChange}
                size={size}
                {...s.merge("control", controlProps)}
              />
            );
          })}
        </TimePresetsGrid>
      ) : (
        <TimePresetsGroups role="list" {...s.get("groups")}>
          {groups.map((group, index) => (
            <TimePresetGroup
              key={index}
              data={group}
              value={value}
              format={format}
              amPmLabels={amPmLabels}
              withSeconds={withSeconds}
              onChange={onChange}
              size={size}
              getControlProps={getControlProps}
              styles={{ control: s.get("control") }}
            />
          ))}
        </TimePresetsGroups>
      )}
    </ScrollArea.Autosize>
  );
}

TimePresetsComponent.displayName = "@knitui/dates/TimePresets";

// ── 14. Public surface ─────────────────────────────────────────────────────────
// `withStaticProperties` exposes the parts so consumers can target/extend them.
// `.Frame` is the kit `ScrollArea` (not a styled wrapper — see the header note).
export const TimePresets = withStaticProperties(TimePresetsComponent, {
  Frame: ScrollArea,
  Grid: TimePresetsGrid,
  Groups: TimePresetsGroups,
  Group: TimePresetGroup,
  Control: TimePresetControl,
});
