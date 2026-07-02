import * as React from "react";

import dayjs from "dayjs";

import { Text, UnstyledButton } from "@knitui/components";
import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";

import { type CalendarSize, CELL_FONT, CELL_WIDTH } from "../cell-metrics";
import { useDatesContext } from "../DatesProvider";
import { controlA11yProps } from "../internal/a11y";
import { webCursor } from "../internal/web-cursor";
import type { DateStringValue } from "../types";

/** Day cell size — the kit's shared control size scale. */
type DaySize = CalendarSize;

/** Render the day's content (defaults to the day-of-month number). */
export type RenderDay = (date: DateStringValue) => React.ReactNode;

/**
 * Square day-cell metrics shared down to the label via context: each `size` key
 * maps to a square `width`/`height` (from the shared `CELL_WIDTH` ladder), and
 * the label to a proportional `fontSize` (`CELL_FONT`, ≈ size / 2.8, matching
 * @mantine/dates). The numeric ladders live in one place — `../cell-metrics` —
 * so every grid component (Day, WeekdaysRow, Month, PickerControl) stays aligned.
 */
// `minHeight` mirrors `height` at every size so it acts as a FLOOR: when
// `fullWidth` swaps `height` to `"100%"` to fill a constrained calendar height,
// an UNCONSTRAINED parent (no calendar height set) resolves that percentage to
// "auto" and the cell would otherwise collapse to its label's line-height — the
// `minHeight` keeps it at the square size in that case.
const daySizeVariant = {
  xxs: { width: CELL_WIDTH.xxs, height: CELL_WIDTH.xxs, minHeight: CELL_WIDTH.xxs },
  xs: { width: CELL_WIDTH.xs, height: CELL_WIDTH.xs, minHeight: CELL_WIDTH.xs },
  sm: { width: CELL_WIDTH.sm, height: CELL_WIDTH.sm, minHeight: CELL_WIDTH.sm },
  md: { width: CELL_WIDTH.md, height: CELL_WIDTH.md, minHeight: CELL_WIDTH.md },
  lg: { width: CELL_WIDTH.lg, height: CELL_WIDTH.lg, minHeight: CELL_WIDTH.lg },
  xl: { width: CELL_WIDTH.xl, height: CELL_WIDTH.xl, minHeight: CELL_WIDTH.xl },
  xxl: { width: CELL_WIDTH.xxl, height: CELL_WIDTH.xxl, minHeight: CELL_WIDTH.xxl },
} as const;

const dayFontVariant = {
  xxs: { fontSize: CELL_FONT.xxs },
  xs: { fontSize: CELL_FONT.xs },
  sm: { fontSize: CELL_FONT.sm },
  md: { fontSize: CELL_FONT.md },
  lg: { fontSize: CELL_FONT.lg },
  xl: { fontSize: CELL_FONT.xl },
  xxl: { fontSize: CELL_FONT.xxl },
} as const;

const DayContext = createStyledContext<{ size: DaySize }>({ size: "md" });

/**
 * The atomic calendar cell — an `UnstyledButton`-based control composed via
 * `styled`. Accent comes from the active theme's palette ramp via the `theme`
 * prop (no Mantine `color` prop): a selected day fills with `$color9`/`$color1`
 * text; in-range days take a `$color4` tint with the range edges rounded by the
 * `firstInRange`/`lastInRange` corner variants (the `inRange` base squares all
 * four corners, the edge variants round their own two — so a single-day range
 * gets all four back). States use `hoverStyle`/`pressStyle` + a `disabled`
 * variant, never a runtime hover flag or a `Pressable`.
 *
 * Variant precedence relies on Tamagui applying active variants in declaration
 * order (later wins): `inRange` is declared before `firstInRange`/`lastInRange`
 * so the edges win on radius, and before `selected` so a selected endpoint wins
 * on background.
 */
const DayFrame = styled(UnstyledButton.Frame, {
  name: "Day",
  context: DayContext,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 0,
  borderColor: "transparent",
  borderRadius: "$sm",
  backgroundColor: "transparent",
  ...webCursor("pointer"),
  hoverStyle: { backgroundColor: "$color2" },
  pressStyle: { backgroundColor: "$color3" },

  variants: {
    size: daySizeVariant,

    /**
     * Day fills its grid cell in BOTH axes. `width: "100%"` stretches it across
     * the equal-share cell; `height: "100%"` lets it grow to fill a constrained
     * calendar height (the row distributes the extra vertical space). The square
     * `size` `minHeight` is the floor when no height is set, so an unconstrained
     * calendar still renders the normal square cells.
     */
    fullWidth: {
      true: { width: "100%", height: "100%" },
    },

    /** Day outside the displayed month — dimmed. */
    outside: {
      true: { opacity: 0.5 },
    },

    /** Weekend day — coloured via the label (no frame style needed). */
    weekend: {
      true: {},
    },

    /** Day within a selected range — tinted background, squared corners. */
    inRange: {
      true: {
        backgroundColor: "$color4",
        borderRadius: 0,
        hoverStyle: { backgroundColor: "$color5" },
        pressStyle: { backgroundColor: "$color5" },
      },
    },

    /** First day of a range — round the inline-start corners. */
    firstInRange: {
      true: { borderTopLeftRadius: "$sm", borderBottomLeftRadius: "$sm" },
    },

    /** Last day of a range — round the inline-end corners. */
    lastInRange: {
      true: { borderTopRightRadius: "$sm", borderBottomRightRadius: "$sm" },
    },

    /** Today's border highlight (only when not selected / in range). */
    today: {
      true: { borderWidth: 1, borderColor: "$color7" },
    },

    /** Selected day — solid accent fill. */
    selected: {
      true: {
        backgroundColor: "$color9",
        hoverStyle: { backgroundColor: "$color10" },
        pressStyle: { backgroundColor: "$color8" },
      },
    },

    /** Removed from layout + the a11y tree. */
    hidden: {
      true: { display: "none" },
    },

    /** Non-interactive cursor/selection + dimmed, no hover affordance. */
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
        ...webCursor("not-allowed"),
      },
    },

    /** Static (non-interactive) display cell — renders as a `div`, no pointer. */
    static: {
      true: {
        userSelect: "auto",
        ...webCursor("default"),
        hoverStyle: { backgroundColor: "transparent" },
        pressStyle: { backgroundColor: "transparent" },
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

/**
 * The day-of-month label — shares `size` via context.
 *
 * Colour is expressed as boolean VARIANTS, never a per-render dynamic `color`
 * style prop: the idle label is the neutral `$color`, a `weekend` label flips to
 * `$red9`, and on the solid accent fill a `selected` label flips to the contrast
 * `$color1`. `selected` is declared after `weekend` so a selected weekend takes
 * the contrast colour (the variants apply in declaration order — later wins,
 * mirroring `DayFrame`). Keeping colour in variants — not a runtime ternary —
 * keeps the cell compiler-safe (no dynamic style prop for the optimiser to fold).
 */
const DayLabel = styled(Text, {
  name: "DayLabel",
  context: DayContext,
  userSelect: "none",
  color: "$color",
  variants: {
    size: {
      ...dayFontVariant,
    },

    /** Weekend day — accent-error text colour. */
    weekend: {
      true: { color: "$red9" },
    },

    /** Selected day — contrast text on the solid accent fill. */
    selected: {
      true: { color: "$color1" },
    },
  } as const,
});

type DayFrameProps = GetProps<typeof DayFrame>;

export interface DayProps extends Omit<
  DayFrameProps,
  | "size"
  | "outside"
  | "weekend"
  | "inRange"
  | "firstInRange"
  | "lastInRange"
  | "today"
  | "selected"
  | "hidden"
  | "disabled"
  | "static"
  | "children"
> {
  /** Date displayed in this cell, in `YYYY-MM-DD` format. */
  date: DateStringValue;

  /** Width/height of the day. @default 'md' */
  size?: DaySize;

  /** Render as a non-interactive `div` instead of a button. @default false */
  static?: boolean;

  /** Whether the day is a weekend. @default false */
  weekend?: boolean;

  /** Whether the day is outside of the current month. @default false */
  outside?: boolean;

  /** Whether the day is selected. @default false */
  selected?: boolean;

  /** Whether the day should not be displayed. @default false */
  hidden?: boolean;

  /** Whether the day is within a selected range. @default false */
  inRange?: boolean;

  /** Whether the day is the first in a range selection. @default false */
  firstInRange?: boolean;

  /** Whether the day is the last in a range selection. @default false */
  lastInRange?: boolean;

  /** Custom renderer for the day's content. */
  renderDay?: RenderDay;

  /** Highlight today with a border. @default false */
  highlightToday?: boolean;

  /** Day takes the full width of its cell. @default false */
  fullWidth?: boolean;

  /** Disable the day. @default false */
  disabled?: boolean;

  /** dayjs locale for the fallback `aria-label`; falls back to `DatesProvider`. */
  locale?: string;
}

const DayComponent = DayFrame.styleable<DayProps>(function Day(props, ref) {
  const {
    date,
    size = "md",
    static: isStatic = false,
    weekend = false,
    outside = false,
    selected = false,
    hidden = false,
    inRange = false,
    firstInRange = false,
    lastInRange = false,
    renderDay,
    highlightToday = false,
    fullWidth = false,
    disabled = false,
    locale,
    ...rest
  } = props;

  const ctx = useDatesContext();
  const day = dayjs(date);
  const isToday = day.isSame(new Date(), "day");

  // Locale-aware default label, read from `DatesProvider`. A static (display-only)
  // day announces nothing — it is not an interactive date. An explicit
  // `aria-label` in `...rest` still wins (it is spread last).
  const defaultAriaLabel = isStatic
    ? undefined
    : day.locale(ctx.getLocale(locale)).format("D MMMM YYYY");

  // Mirror Mantine's data-attribute gating: a disabled day shows none of the
  // selection/range/weekend/outside styling, and today's border is suppressed
  // once the day is selected or in range.
  const isWeekend = !disabled && !outside && weekend;
  const isOutside = !disabled && outside;
  const isSelected = !disabled && selected;
  const isInRange = !disabled && inRange;
  const isFirstInRange = !disabled && firstInRange;
  const isLastInRange = !disabled && lastInRange;
  const showToday = isToday && highlightToday && !isSelected && !isInRange && !disabled;

  const content = renderDay ? renderDay(date) : day.date();
  const isTextContent = typeof content === "string" || typeof content === "number";

  // `type` is a runtime-only `<button>` attribute outside Tamagui's style types;
  // narrow via a precise local object (spread → no excess-prop check). Only on
  // the interactive (button) host, not the static `div`.
  const elementProps: { type: string } = { type: "button" };

  return (
    <DayFrame
      ref={ref}
      size={size}
      static={isStatic}
      weekend={isWeekend}
      outside={isOutside}
      selected={isSelected}
      inRange={isInRange}
      firstInRange={isFirstInRange}
      lastInRange={isLastInRange}
      today={showToday}
      hidden={hidden}
      fullWidth={fullWidth}
      disabled={disabled}
      role={isStatic ? "presentation" : "button"}
      aria-label={defaultAriaLabel}
      aria-selected={isSelected || undefined}
      aria-disabled={disabled || undefined}
      aria-hidden={hidden || undefined}
      // Native (VoiceOver/TalkBack) counterparts of the web `role`/`aria-*` above;
      // a static display cell announces nothing interactive (`role="none"`).
      {...controlA11yProps({
        role: isStatic ? "none" : "button",
        label: defaultAriaLabel,
        selected: isSelected,
        disabled,
      })}
      render={isStatic ? "div" : "button"}
      {...(isStatic ? {} : elementProps)}
      {...rest}
    >
      {isTextContent ? (
        <DayLabel weekend={isWeekend} selected={isSelected}>
          {content}
        </DayLabel>
      ) : (
        content
      )}
    </DayFrame>
  );
});

DayComponent.displayName = "@knitui/dates/Day";

// Public surface: the component plus its styled parts, so consumers can target /
// extend them (`styled(Day.Frame, …)` / `styled(Day.Label, …)`).
export const Day = withStaticProperties(DayComponent, {
  Frame: DayFrame,
  Label: DayLabel,
});

export type { DaySize };
