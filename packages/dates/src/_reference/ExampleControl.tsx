// ───────────────────────────────────────────────────────────────────────────
// REFERENCE COMPONENT — the "what good looks like" target for @knitui/dates.
//
// This file is NOT a real Mantine port and is deliberately NOT re-exported from
// `src/index.ts`. It exists so a component can be held against a single, working
// example that exercises every convention the kit expects. The numbered rules in
// `_reference/README.md` map 1:1 onto the patterns below — read them together.
//
// It compiles against today's reachable APIs (no aspirational imports), so it is
// a safe target for an automated per-component improvement loop.
//
// What it demonstrates, in one small control:
//   1. File header documenting provenance + cross-platform stance.
//   2. `createStyledContext` to share `size` across every styled part.
//   3. Sizing DERIVED from the shared `cell-metrics` ladders (no magic numbers).
//   4. Theme-ramp colors only ($colorN) — `theme="red"` recolors, zero per-comp logic.
//   5. A styled Frame + leaf parts, each carrying the context.
//   6. Marker-slot composition (`createSlot`/`defineSlots` from `@knitui/core`).
//   7. Per-slot `styles={{…}}` sugar (`SlotStyles` + `slotStyles().merge`) PLUS the
//      per-item `getOptionProps` callback — "explicit beats sugar" precedence.
//   8. Controlled/uncontrolled value via `useUncontrolled`.
//   9. Locale + date formatting via `useDatesContext` + dayjs.
//  10. min/max bounds via the shared date utils.
//  11. Native + web a11y set side-by-side (`controlA11yProps` + `aria-*`).
//  12. `webCursor`, real `hoverStyle`/`pressStyle`, a `disabled` variant.
//  13. `.styleable` wrapper forwarding a ref + style props (the dates norm).
//  14. `withStaticProperties` exposing parts + slot markers.
//  15. A documented "compiler-safe styling" pitfall (the `_o-0` trap).
//
// To adapt: copy the folder, rename `ExampleControl` → your component, swap the
// data/behavior, keep the structure.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import dayjs from "dayjs";

import { Box, Text, UnstyledButton } from "@knitui/components";
import {
  createSlot,
  createStyledContext,
  defineSlots,
  type GetProps,
  slotStyles,
  type SlotStyles,
  styled,
  withStaticProperties,
} from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import { type CalendarSize, CELL_FONT, CELL_WIDTH } from "../cell-metrics";
import { useDatesContext } from "../DatesProvider";
import { controlA11yProps } from "../internal/a11y";
import { webCursor } from "../internal/web-cursor";
import type { DateStringValue } from "../types";
import { isAfterMinDate, isBeforeMaxDate, toDateString } from "../utils";

// ── 2. Shared context ───────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to every styled part, so the leaf
// parts read the SAME size the consumer set on the root WITHOUT prop-drilling
// and without each part needing its own `size` prop on the public API. Parts
// that opt into the context (`context: ExampleControlContext`) inherit it.
const ExampleControlContext = createStyledContext<{ size: CalendarSize }>({ size: "md" });

// ── 3. Sizing derived from the shared ladders ─────────────────────────────────
// Never hard-code pixels. Dates components scale on the `cell-metrics` ladders
// (`CELL_WIDTH`/`CELL_FONT`), the calendar twin of components' `controlMetrics`.
// Each variant maps the `xxs…xxl` keys onto a metric so retuning the ladder moves
// every component together. Express these with raw values from the ladder (they
// resolve at module-load) — NOT `getTokenValue`, which needs the live config.
const optionMinWidthVariant = {
  xxs: { minWidth: CELL_WIDTH.xxs },
  xs: { minWidth: CELL_WIDTH.xs },
  sm: { minWidth: CELL_WIDTH.sm },
  md: { minWidth: CELL_WIDTH.md },
  lg: { minWidth: CELL_WIDTH.lg },
  xl: { minWidth: CELL_WIDTH.xl },
  xxl: { minWidth: CELL_WIDTH.xxl },
} as const;

const optionFontVariant = {
  xxs: { fontSize: CELL_FONT.xxs },
  xs: { fontSize: CELL_FONT.xs },
  sm: { fontSize: CELL_FONT.sm },
  md: { fontSize: CELL_FONT.md },
  lg: { fontSize: CELL_FONT.lg },
  xl: { fontSize: CELL_FONT.xl },
  xxl: { fontSize: CELL_FONT.xxl },
} as const;

// ── 5. Styled parts ───────────────────────────────────────────────────────────

/** The root row: optional lead · option strip · optional trail. */
const ExampleControlFrame = styled(Box, {
  name: "ExampleControl",
  context: ExampleControlContext,
  flexDirection: "row",
  alignItems: "center",
  gap: "$xs",
});

/** The strip wrapping the option buttons. */
const ExampleControlOptions = styled(Box, {
  name: "ExampleControlOptions",
  flexDirection: "row",
  alignItems: "stretch",
  gap: "$xxs",
});

/**
 * A single selectable option button.
 *
 * 4. Colors are theme-ramp tokens ONLY: idle text is the neutral `$color`, the
 *    selected fill is the accent `$color9` with `$color1` contrast text. No hex,
 *    no `color` prop — `theme="red"` on (or above) the control recolors it.
 * 12. Interaction lives in real Tamagui pseudo-state (`hoverStyle`/`pressStyle`)
 *     and a `disabled` variant (Mantine parity: 0.3 + non-interactive), never a
 *     runtime `onHoverIn` state machine.
 */
const ExampleControlOption = styled(UnstyledButton.Frame, {
  name: "ExampleControlOption",
  context: ExampleControlContext,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: "$xs",
  paddingHorizontal: "$xs",
  borderRadius: "$sm",
  backgroundColor: "transparent",
  ...webCursor("pointer"),
  hoverStyle: { backgroundColor: "$color2" },
  pressStyle: { backgroundColor: "$color3" },

  variants: {
    size: optionMinWidthVariant,

    /** Selected option — solid accent fill. */
    selected: {
      true: {
        backgroundColor: "$color9",
        hoverStyle: { backgroundColor: "$color10" },
        pressStyle: { backgroundColor: "$color8" },
      },
    },

    /** Disabled option — dimmed, non-interactive. */
    disabled: {
      true: {
        opacity: 0.3,
        pointerEvents: "none",
        ...webCursor("not-allowed"),
        hoverStyle: { backgroundColor: "transparent" },
        pressStyle: { backgroundColor: "transparent" },
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

/**
 * The option's text label.
 *
 * 15. COMPILER-SAFE STYLING. The `apps/web` build runs the Tamagui optimizing
 *     compiler, which flattens `styled()` parts into atomic CSS classes. A
 *     DYNAMIC style prop that can evaluate to a hide value — e.g.
 *     `opacity={cond ? 1 : 0}` — gets its `0` branch extracted into an
 *     `._o-0 { opacity: 0 }` class and can be flattened onto the WHOLE cell,
 *     blanking visible content (this is a bug that actually shipped). Show/hide
 *     by toggling the *text content* (a pure-React swap the compiler can't fold)
 *     or a boolean *variant*, and keep constant dims as a baked-in style — never
 *     a per-render dynamic `opacity`/`display` style prop.
 */
const ExampleControlLabel = styled(Text, {
  name: "ExampleControlLabel",
  context: ExampleControlContext,
  userSelect: "none",
  color: "$color",
  variants: {
    size: optionFontVariant,

    /** On the selected accent fill, the label flips to the contrast color. */
    selected: { true: { color: "$color1" } },
  } as const,
  defaultVariants: { size: "md" },
});

/** Lead/trail section wrapper — a real styled part for the section props to land on. */
const ExampleControlSection = styled(Box, {
  name: "ExampleControlSection",
  context: ExampleControlContext,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
});

// ── 6. Marker slots ────────────────────────────────────────────────────────────
// Optional composition: `<ExampleControl.Lead>` / `<ExampleControl.Trail>` let a
// consumer drop content beside the options while the Frame keeps owning layout.
// `createSlot`/`defineSlots` live in `@knitui/core` and are shared by every kit, so
// this is the SAME mechanism `@knitui/components` Button uses. Markers render
// nothing; `collect` extracts their props/children at render. The data-driven
// options are NOT slots — slots are for the bits the consumer composes.
const ExampleControlSlots = defineSlots({
  Lead: createSlot<"Lead">("Lead"),
  Trail: createSlot<"Trail">("Trail"),
});

// ── 7. Per-slot `styles` sugar + per-item passthrough ───────────────────────────
// The kit's ONE styling model is props on the parts. `styles` is thin sugar over
// that: a map from named slot → that part's props, resolved through
// `slotStyles().merge` so the precedence is fixed in one place —
//   defaults < styles[slot] < explicit xxxProps < inline props on a composed part.
// Per-item dynamics that a static map can't express (a different prop per date)
// stay on the `getOptionProps(date)` callback (mirrors `MiniCalendar.getDayProps`);
// it competes with the `option` slot and wins (explicit beats sugar).

/** The named style slots and the styled part each targets. */
export interface ExampleControlStyles {
  /** Props for the root row (`.Frame`). */
  root?: GetProps<typeof ExampleControlFrame>;
  /** Props for the option strip (`.Options`). */
  options?: GetProps<typeof ExampleControlOptions>;
  /** Props for each option button (`.Option`). */
  option?: GetProps<typeof ExampleControlOption>;
  /** Props for each option's text label (`.Label`). */
  label?: GetProps<typeof ExampleControlLabel>;
  /** Props for the leading section wrapper (`.Lead`). */
  lead?: GetProps<typeof ExampleControlSection>;
  /** Props for the trailing section wrapper (`.Trail`). */
  trail?: GetProps<typeof ExampleControlSection>;
}

const EXAMPLE_CONTROL_SLOT_KEYS = [
  "root",
  "options",
  "option",
  "label",
  "lead",
  "trail",
] as const satisfies readonly (keyof ExampleControlStyles)[];

/** Props passed to a single option button via `getOptionProps`. */
type ExampleControlOptionProps = Partial<GetProps<typeof UnstyledButton>>;

/** Cross-platform press event (derived from the button — never a raw DOM event). */
type ExampleControlPressEvent = Parameters<
  NonNullable<GetProps<typeof UnstyledButton>["onPress"]>
>[0];

// The Frame's own style props flow through, minus the ones we own or rename.
type ExampleControlFrameProps = Omit<
  GetProps<typeof ExampleControlFrame>,
  "onChange" | "value" | "defaultValue" | "size" | "children"
>;

export interface ExampleControlProps extends ExampleControlFrameProps {
  /** The selectable dates, as `YYYY-MM-DD` strings or `Date`s. */
  data: ReadonlyArray<DateStringValue | Date>;

  /** Selected date, controlled. */
  value?: DateStringValue | Date | null;

  /** Selected date, uncontrolled default. */
  defaultValue?: DateStringValue | Date | null;

  /** Called with the picked date in `YYYY-MM-DD` format when the selection changes. */
  onChange?: (value: DateStringValue) => void;

  /** dayjs format string for each option's label. @default 'D MMM' */
  labelFormat?: string;

  /** Maximum selectable date, `YYYY-MM-DD` string or `Date`. */
  maxDate?: DateStringValue | Date;

  /** Minimum selectable date, `YYYY-MM-DD` string or `Date`. */
  minDate?: DateStringValue | Date;

  /** Width/font of the options. @default 'md' */
  size?: CalendarSize;

  /** Props spread onto the option button matching `date` (wins over `styles.option`). */
  getOptionProps?: (date: DateStringValue) => ExampleControlOptionProps;

  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<ExampleControlStyles>;

  /** dayjs locale used for formatting; falls back to `DatesProvider`. */
  locale?: string;

  /** Optional `<ExampleControl.Lead>` / `<ExampleControl.Trail>` sections. */
  children?: React.ReactNode;
}

/**
 * `ExampleControl` — a compact single-select strip of date options. Reference
 * implementation: see the file header for the conventions it demonstrates. Built
 * from `Box` / `Text` / `UnstyledButton`; selection is controlled or uncontrolled
 * via `useUncontrolled`; out-of-`[minDate, maxDate]` options are disabled; accent
 * comes from the active Tamagui theme. Forwards its ref + style props to the root.
 *
 * @example
 * <ExampleControl
 *   data={["2026-06-15", "2026-06-16", "2026-06-17"]}
 *   defaultValue="2026-06-15"
 *   onChange={setValue}
 * />
 */
const ExampleControlComponent = ExampleControlFrame.styleable<ExampleControlProps>(
  function ExampleControl(props, ref) {
    const {
      data,
      value,
      defaultValue,
      onChange,
      labelFormat = "D MMM",
      minDate,
      maxDate,
      size = "md",
      getOptionProps,
      styles,
      locale,
      children,
      ...rest
    } = props;

    // 9. Locale comes from `DatesProvider` (consumer `locale` prop wins).
    const ctx = useDatesContext();
    const _locale = ctx.getLocale(locale);

    // 8. One source of truth for the selection across controlled + uncontrolled.
    //    A press only ever sets a concrete date (never clears), so the public
    //    `onChange` is narrowed back from `string | null` to `DateStringValue`.
    const [_value, setValue] = useUncontrolled<DateStringValue | null>({
      value: toDateString(value),
      defaultValue: toDateString(defaultValue) ?? null,
      onChange: onChange ? (next) => next !== null && onChange(next) : undefined,
    });

    // 10. Normalize bounds once; an option is disabled when it falls outside them.
    const minString = toDateString(minDate);
    const maxString = toDateString(maxDate);

    // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
    const s = slotStyles<ExampleControlStyles>(styles, EXAMPLE_CONTROL_SLOT_KEYS, "ExampleControl");

    // 6. Collect optional Lead/Trail markers from children.
    const slots = ExampleControlSlots.collect(children, { displayName: "ExampleControl" });
    const leadContent = slots.Lead?.children;
    const trailContent = slots.Trail?.children;

    const optionButtons = data.map((item) => {
      const dateString = toDateString(item);
      const disabled =
        !isAfterMinDate(dateString, minString) || !isBeforeMaxDate(dateString, maxString);
      const selected = _value !== null && dayjs(dateString).isSame(_value, "day");
      const optionProps = getOptionProps?.(dateString);

      return (
        <ExampleControlOption
          key={dateString}
          size={size}
          selected={selected}
          disabled={disabled}
          // 11. Web a11y (role/aria) and native a11y (`accessibility*`) are set
          //     side-by-side — neither replaces the other.
          role="button"
          aria-label={dateString}
          aria-selected={selected || undefined}
          aria-disabled={disabled || undefined}
          {...controlA11yProps({ role: "button", label: dateString, selected, disabled })}
          // explicit beats sugar: the `option` slot sits UNDER per-item `getOptionProps`,
          // and the consumer's own `onPress` is preserved (called before ours).
          {...s.merge("option", optionProps)}
          onPress={(event: ExampleControlPressEvent) => {
            optionProps?.onPress?.(event);
            setValue(dateString);
          }}
        >
          <ExampleControlLabel size={size} selected={selected} {...s.get("label")}>
            {dayjs(dateString).locale(_locale).format(labelFormat)}
          </ExampleControlLabel>
        </ExampleControlOption>
      );
    });

    // `size` is passed to each leaf (Option/Label own the `size` variant); the
    // Frame just establishes the shared context — mirrors `MiniCalendar`.
    return (
      <ExampleControlFrame ref={ref} role="group" {...s.get("root")} {...rest}>
        {leadContent != null ? (
          <ExampleControlSection {...s.merge("lead", slots.Lead?.props)}>
            {leadContent}
          </ExampleControlSection>
        ) : null}

        <ExampleControlOptions {...s.get("options")}>{optionButtons}</ExampleControlOptions>

        {trailContent != null ? (
          <ExampleControlSection {...s.merge("trail", slots.Trail?.props)}>
            {trailContent}
          </ExampleControlSection>
        ) : null}
      </ExampleControlFrame>
    );
  },
);

// ── 14. Public surface ─────────────────────────────────────────────────────────
// `withStaticProperties` attaches the slot markers (single source of truth) and
// the styled parts, so consumers can both compose (`<ExampleControl.Lead/>`) and
// target/extend parts (`styled(ExampleControl.Option, …)`).
export const ExampleControl = withStaticProperties(ExampleControlComponent, {
  ...ExampleControlSlots.markers, // Lead, Trail
  Frame: ExampleControlFrame,
  Options: ExampleControlOptions,
  Option: ExampleControlOption,
  Label: ExampleControlLabel,
  Section: ExampleControlSection,
});
