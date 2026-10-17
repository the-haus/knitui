import * as React from "react";

import dayjs, { type Dayjs } from "dayjs";

import { Text, UnstyledButton } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  styleable,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { type CalendarSize, cellFontVariant, cellSquareVariant } from "../cell-metrics";
import { DatesProviderContext } from "../DatesProvider";
import { controlA11yProps } from "../internal/a11y";
import { isCanonicalDateString } from "../internal/date-string-fast-path";
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
const DayContext = createStyledContext<{ size: DaySize }>({ size: "md" });

/**
 * Whether `date` falls on today's LOCAL calendar date, compared without
 * allocating a single dayjs instance: a canonical `YYYY-MM-DD` string is
 * compared field-by-field against `new Date()`; anything else falls back to
 * the parsed instance's plain field reads (`year`/`month`/`date`, no clone).
 */
function isSameDayAsToday(date: DateStringValue, parse: () => Dayjs): boolean {
  const now = new Date();
  if (isCanonicalDateString(date)) {
    return (
      Number(date.slice(8, 10)) === now.getDate() &&
      Number(date.slice(5, 7)) === now.getMonth() + 1 &&
      Number(date.slice(0, 4)) === now.getFullYear()
    );
  }
  const day = parse();
  return (
    day.date() === now.getDate() &&
    day.month() === now.getMonth() &&
    day.year() === now.getFullYear()
  );
}

/** `type="button"` for the interactive host — one frozen object, not one per cell render. */
const BUTTON_TYPE: { type: string } = Object.freeze({ type: "button" });

/**
 * The atomic calendar cell — an `UnstyledButton`-based control composed via
 * `styled`. Accent comes from the active theme's palette ramp via the `theme`
 * prop (no Mantine `color` prop): a selected day fills with `color9`/`color1`
 * text; in-range days take a `color4` tint with the range edges rounded by the
 * `firstInRange`/`lastInRange` corner variants (the `inRange` base squares all
 * four corners, the edge variants round their own two — so a single-day range
 * gets all four back). States use `hover:`/`press:` clauses + a `disabled`
 * variant, never a runtime hover flag or a `Pressable`.
 *
 * Variant precedence: Tamagui v3 applies active variants in the order the
 * props are PASSED (later wins), not in declaration order — so the `Day`
 * wrapper passes `inRange` before `firstInRange`/`lastInRange` (the edges win
 * on radius) and `selected` last (a selected endpoint wins on background). A
 * consumer composing `Day.Frame` directly must keep the same prop order.
 */
const DayFrame = styled(UnstyledButton.Frame, {
  displayName: "Day",
  context: DayContext,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 0,
  borderColor: "transparent",
  borderRadius: "sm",
  backgroundColor: "transparent hover:color2 press:color3",
  cursor: "web:pointer",

  variants: {
    size: cellSquareVariant,

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
        backgroundColor: "color4 hover:color5 press:color5",
        borderRadius: 0,
      },
    },

    /** First day of a range — round the inline-start corners. */
    firstInRange: {
      true: { borderTopLeftRadius: "sm", borderBottomLeftRadius: "sm" },
    },

    /** Last day of a range — round the inline-end corners. */
    lastInRange: {
      true: { borderTopRightRadius: "sm", borderBottomRightRadius: "sm" },
    },

    /** Today's border highlight (only when not selected / in range). */
    today: {
      true: { borderWidth: 1, borderColor: "color7" },
    },

    /** Selected day — solid accent fill. */
    selected: {
      true: {
        backgroundColor: "color9 hover:color10 press:color8",
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
        cursor: "web:not-allowed",
      },
    },

    /** Static (non-interactive) display cell — renders as a `div`, no pointer. */
    static: {
      true: {
        userSelect: "auto",
        cursor: "web:default",
        backgroundColor: "hover:transparent press:transparent",
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

/**
 * The day-of-month label — shares `size` via context.
 *
 * Colour is expressed as boolean VARIANTS, never a per-render dynamic `color`
 * style prop: the idle label is the neutral `color`, a `weekend` label flips to
 * `red9`, and on the solid accent fill a `selected` label flips to the contrast
 * `color1`. `selected` is declared after `weekend` so a selected weekend takes
 * the contrast colour (v3 applies variants in prop order — later wins — and the
 * wrapper passes `selected` after `weekend`,
 * mirroring `DayFrame`). Keeping colour in variants — not a runtime ternary —
 * keeps the cell compiler-safe (no dynamic style prop for the optimiser to fold).
 */
const DayLabel = styled(Text, {
  displayName: "DayLabel",
  context: DayContext,
  userSelect: "none",
  color: "color",
  variants: {
    size: {
      ...cellFontVariant,
    },

    /** Weekend day — accent-error text colour. */
    weekend: {
      true: { color: "red9" },
    },

    /** Selected day — contrast text on the solid accent fill. */
    selected: {
      true: { color: "color1" },
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

const DayComponent = styleable<DayProps>(DayFrame, function Day(props, ref) {
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

  // The RAW context, not `useDatesContext()`. The hook's four `useCallback` getter
  // helpers are convenience for components that resolve several settings; `Day`
  // needs exactly one value — the locale for its fallback label — and it is the
  // grid's hottest leaf (42 instances per month × `numberOfColumns`, all
  // re-rendering on a hover frame). Going through the hook there cost 42 extra
  // hook subscriptions and ~168 freshly allocated closures per grid render for a
  // single string read. `locale || ctx.locale` below is the getter's body verbatim
  // (`getLocale = (input) => input || ctx.locale`), so a standalone `<Day>`
  // resolves its locale exactly as before.
  const ctx = React.useContext(DatesProviderContext);

  // dayjs is parsed LAZILY and at most once: the grid path (`Month` passes an
  // explicit `aria-label`, a canonical `YYYY-MM-DD` date and no `renderDay`)
  // never needs an instance at all — the day-of-month is the string's last two
  // digits — so 42 cells × every render allocate no dayjs/Date for content.
  let parsed: Dayjs | undefined;
  const parse = (): Dayjs => (parsed ??= dayjs(date));

  // Only the `highlightToday` border consults "is this today", so the comparison
  // is skipped entirely when the border is off (the default).
  const isToday = highlightToday && isSameDayAsToday(date, parse);

  // Locale-aware default label, read from `DatesProvider`. A static (display-only)
  // day announces nothing — it is not an interactive date.
  //
  // An explicit `aria-label` WINS, so it is read up-front and the fallback is
  // only built when there is none: `Month` always passes its own `aria-label`
  // through `...rest` (spread last), which means computing the fallback there
  // was pure waste — a locale clone plus `format("D MMMM YYYY")`, the most
  // expensive token set in the file, for a string that was always discarded,
  // ×42 cells every render. Reading the explicit label here also means NATIVE
  // (`accessibilityLabel` below) now announces the same custom label web does,
  // instead of the generic date it used to fall back to.
  const explicitAriaLabel = props["aria-label"];
  const ariaLabel = isStatic
    ? undefined
    : (explicitAriaLabel ??
      parse()
        .locale(locale || ctx.locale)
        .format("D MMMM YYYY"));

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

  const content = renderDay
    ? renderDay(date)
    : isCanonicalDateString(date)
      ? Number(date.slice(8, 10))
      : parse().date();
  const isTextContent = typeof content === "string" || typeof content === "number";

  return (
    <DayFrame
      ref={ref}
      size={size}
      static={isStatic}
      weekend={isWeekend}
      outside={isOutside}
      // v3 applies active variants in PROP ORDER at the call site (not in the
      // order they are declared in `variants`), so this order IS the precedence:
      // `inRange` squares the corners, the edge flags round their own two after
      // it, and `selected` comes last so a selected range endpoint keeps the
      // solid accent over the in-range tint.
      inRange={isInRange}
      firstInRange={isFirstInRange}
      lastInRange={isLastInRange}
      today={showToday}
      selected={isSelected}
      hidden={hidden}
      fullWidth={fullWidth}
      disabled={disabled}
      role={isStatic ? "presentation" : "button"}
      aria-label={ariaLabel}
      aria-selected={isSelected || undefined}
      aria-disabled={disabled || undefined}
      aria-hidden={hidden || undefined}
      // Native (VoiceOver/TalkBack) counterparts of the web `role`/`aria-*` above;
      // a static display cell announces nothing interactive (`role="none"`).
      {...controlA11yProps({
        role: isStatic ? "none" : "button",
        label: ariaLabel,
        selected: isSelected,
        disabled,
      })}
      render={isStatic ? "div" : "button"}
      // `type` is a runtime-only `<button>` attribute outside Tamagui's style
      // types; spread from a frozen module constant (no excess-prop check, no
      // per-render object). Only on the interactive (button) host.
      {...(isStatic ? null : BUTTON_TYPE)}
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
