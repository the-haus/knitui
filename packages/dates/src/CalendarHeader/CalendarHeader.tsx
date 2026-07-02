// ───────────────────────────────────────────────────────────────────────────
// CalendarHeader — mirrors @mantine/dates' CalendarHeader API, rebuilt on
// @knitui/components (`Box` / `Text` / `UnstyledButton`) + @knitui/core. It is the
// prev / level-label / next bar that sits atop every calendar level.
//
// Cross-platform: one source renders on web + native. Web a11y (`role`/`aria-*`)
// and native a11y (`accessibility*` via `internal/a11y`) are set side-by-side.
// Accent is the active Tamagui theme ramp — there is no Mantine-style `color`
// prop and no hard-coded palette hex.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import { Box, Text, UnstyledButton } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  slotStyles,
  type SlotStyles,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { type CalendarSize, CELL_WIDTH } from "../cell-metrics";
import { controlA11yProps } from "../internal/a11y";
import { hasPreventDefault } from "../internal/has-prevent-default";
import { webCursor } from "../internal/web-cursor";

// ── Sizing derived from the shared `cell-metrics` ladder ──────────────────────
// Never hard-code pixels: the header controls scale on the shared `CELL_WIDTH`
// ladder (the calendar twin of components' `controlMetrics`), so retuning the
// ladder moves every grid component together. Values resolve at module-load.

/** Square prev/next control size per `size`, from the shared `CELL_WIDTH` ladder. */
const controlSquareVariant = {
  xxs: { width: CELL_WIDTH.xxs, height: CELL_WIDTH.xxs },
  xs: { width: CELL_WIDTH.xs, height: CELL_WIDTH.xs },
  sm: { width: CELL_WIDTH.sm, height: CELL_WIDTH.sm },
  md: { width: CELL_WIDTH.md, height: CELL_WIDTH.md },
  lg: { width: CELL_WIDTH.lg, height: CELL_WIDTH.lg },
  xl: { width: CELL_WIDTH.xl, height: CELL_WIDTH.xl },
  xxl: { width: CELL_WIDTH.xxl, height: CELL_WIDTH.xxl },
} as const;

/** Level (label) control height per `size`, from the shared `CELL_WIDTH` ladder. */
const levelHeightVariant = {
  xxs: { height: CELL_WIDTH.xxs },
  xs: { height: CELL_WIDTH.xs },
  sm: { height: CELL_WIDTH.sm },
  md: { height: CELL_WIDTH.md },
  lg: { height: CELL_WIDTH.lg },
  xl: { height: CELL_WIDTH.xl },
  xxl: { height: CELL_WIDTH.xxl },
} as const;

/** Level label font per `size` (≈ control size / 2.6, capitalized month/year text). */
const levelFontVariant = {
  xxs: { fontSize: Math.round(CELL_WIDTH.xxs / 2.6) },
  xs: { fontSize: Math.round(CELL_WIDTH.xs / 2.6) },
  sm: { fontSize: Math.round(CELL_WIDTH.sm / 2.6) },
  md: { fontSize: Math.round(CELL_WIDTH.md / 2.6) },
  lg: { fontSize: Math.round(CELL_WIDTH.lg / 2.6) },
  xl: { fontSize: Math.round(CELL_WIDTH.xl / 2.6) },
  xxl: { fontSize: Math.round(CELL_WIDTH.xxl / 2.6) },
} as const;

/** Chevron glyph font per `size` (≈ 55% of the control size). */
const iconFontVariant = {
  xxs: { fontSize: Math.round(CELL_WIDTH.xxs * 0.55) },
  xs: { fontSize: Math.round(CELL_WIDTH.xs * 0.55) },
  sm: { fontSize: Math.round(CELL_WIDTH.sm * 0.55) },
  md: { fontSize: Math.round(CELL_WIDTH.md * 0.55) },
  lg: { fontSize: Math.round(CELL_WIDTH.lg * 0.55) },
  xl: { fontSize: Math.round(CELL_WIDTH.xl * 0.55) },
  xxl: { fontSize: Math.round(CELL_WIDTH.xxl * 0.55) },
} as const;

// ── Shared context ────────────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to every styled part so the leaf
// controls read the SAME size the consumer set on the root WITHOUT prop-drilling.
const CalendarHeaderContext = createStyledContext<{ size: CalendarSize }>({ size: "md" });

// ── Styled parts ────────────────────────────────────────────────────────────

/** The header bar — a flex row; level control flexes to fill between prev/next. */
const CalendarHeaderFrame = styled(Box, {
  name: "CalendarHeader",
  context: CalendarHeaderContext,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "$xs",

  variants: {
    /** Header (and its level control) stretch to the full width of the container. */
    fullWidth: {
      true: { width: "100%" },
    },
  } as const,
});

/** Shared interaction base for both the prev/next controls and the level button. */
const headerControlBase = {
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "$sm",
  backgroundColor: "transparent",
  ...webCursor("pointer"),
  hoverStyle: { backgroundColor: "$color2" },
  pressStyle: { backgroundColor: "$color3" },
} as const;

/** Prev/next square control — chevron button. */
const CalendarHeaderControl = styled(UnstyledButton.Frame, {
  name: "CalendarHeaderControl",
  context: CalendarHeaderContext,
  ...headerControlBase,

  variants: {
    size: controlSquareVariant,

    /** Disabled control — strongly dimmed, non-interactive (Mantine parity: 0.2). */
    disabled: {
      true: {
        opacity: 0.2,
        pointerEvents: "none",
        ...webCursor("not-allowed"),
        hoverStyle: { backgroundColor: "transparent" },
        pressStyle: { backgroundColor: "transparent" },
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

/** Level (label) control — flexes to fill, switches to a static `div` at the top level. */
const CalendarHeaderLevel = styled(UnstyledButton.Frame, {
  name: "CalendarHeaderLevel",
  context: CalendarHeaderContext,
  ...headerControlBase,
  flex: 1,

  variants: {
    size: levelHeightVariant,

    /** Non-interactive display label (top level) — default cursor, no hover. */
    static: {
      true: {
        ...webCursor("default"),
        hoverStyle: { backgroundColor: "transparent" },
        pressStyle: { backgroundColor: "transparent" },
      },
    },

    /** Disabled (no next level) — strongly dimmed (Mantine parity: 0.2). */
    disabled: {
      true: {
        opacity: 0.2,
        ...webCursor("not-allowed"),
        hoverStyle: { backgroundColor: "transparent" },
        pressStyle: { backgroundColor: "transparent" },
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

/** Level label text — capitalized, shares `size` via context. */
const CalendarHeaderLevelLabel = styled(Text, {
  name: "CalendarHeaderLevelLabel",
  context: CalendarHeaderContext,
  color: "$color",
  fontWeight: "500",
  textTransform: "capitalize",
  userSelect: "none",

  variants: {
    size: levelFontVariant,
  } as const,

  defaultVariants: { size: "md" },
});

/** Default chevron glyph — shares `size` via context. */
const CalendarHeaderIcon = styled(Text, {
  name: "CalendarHeaderControlIcon",
  context: CalendarHeaderContext,
  color: "$color",
  userSelect: "none",

  variants: {
    size: iconFontVariant,
  } as const,

  defaultVariants: { size: "md" },
});

type CalendarHeaderControlProps = GetProps<typeof CalendarHeaderControl>;
type CalendarHeaderFrameProps = GetProps<typeof CalendarHeaderFrame>;

/** Cross-platform press-in event derived from the control's own prop signature. */
type ControlPressInEvent = Parameters<NonNullable<CalendarHeaderControlProps["onPressIn"]>>[0];

/** Which header controls to render, and in what order. */
export type CalendarHeaderControlName = "previous" | "next" | "level";

// ── Per-slot `styles` sugar ───────────────────────────────────────────────────
// The kit's ONE styling model is props on the parts. `styles` is thin sugar over
// that: a map from named slot → that part's props, resolved through
// `slotStyles().merge` so the precedence is fixed in one place —
//   defaults < styles[slot] < explicit xxxProps < inline props on a composed part.

/** The named style slots and the styled part each targets. */
export interface CalendarHeaderStyles {
  /** Props for the header bar (`.Frame`). */
  root?: GetProps<typeof CalendarHeaderFrame>;
  /** Props for each prev/next control button (`.Control`). */
  control?: GetProps<typeof CalendarHeaderControl>;
  /** Props for the level (label) control (`.Level`). */
  level?: GetProps<typeof CalendarHeaderLevel>;
  /** Props for the level label text (`.LevelLabel`). */
  levelLabel?: GetProps<typeof CalendarHeaderLevelLabel>;
  /** Props for the default chevron glyphs (`.Icon`). */
  icon?: GetProps<typeof CalendarHeaderIcon>;
}

const CALENDAR_HEADER_SLOT_KEYS = [
  "root",
  "control",
  "level",
  "levelLabel",
  "icon",
] as const satisfies readonly (keyof CalendarHeaderStyles)[];

export interface CalendarHeaderSettings {
  /** Prevent focus shift when a control is pressed (calls `preventDefault` on press-in). */
  __preventFocus?: boolean;

  /** Whether propagation for the `Escape` key should be stopped (reserved, API parity). */
  __stopPropagation?: boolean;

  /** Replace the next-button icon. */
  nextIcon?: React.ReactNode;

  /** Replace the previous-button icon. */
  previousIcon?: React.ReactNode;

  /** Next button `aria-label`. */
  nextLabel?: string;

  /** Previous button `aria-label`. */
  previousLabel?: string;

  /** Called when the next button is pressed. */
  onNext?: () => void;

  /** Called when the previous button is pressed. */
  onPrevious?: () => void;

  /** Called when the level button is pressed. */
  onLevelClick?: () => void;

  /** Disables the next control. @default false */
  nextDisabled?: boolean;

  /** Disables the previous control. @default false */
  previousDisabled?: boolean;

  /** Whether the level button can zoom out to the next level. @default true */
  hasNextLevel?: boolean;

  /** Whether the next control is rendered. @default true */
  withNext?: boolean;

  /** Whether the previous control is rendered. @default true */
  withPrevious?: boolean;

  /** Width/font of the header controls. @default 'md' */
  size?: CalendarSize;

  /** Order in which the controls are rendered. @default ['previous', 'level', 'next'] */
  headerControlsOrder?: CalendarHeaderControlName[];

  /** Header (and level control) take the full width of the container. @default false */
  fullWidth?: boolean;
}

export interface CalendarHeaderProps
  extends
    Omit<CalendarHeaderFrameProps, "size" | "fullWidth" | "children">,
    CalendarHeaderSettings {
  /** Label displayed between the previous and next buttons. */
  label: React.ReactNode;

  /** Level control `aria-label`. */
  levelControlAriaLabel?: string;

  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<CalendarHeaderStyles>;
}

/**
 * `CalendarHeader` — the prev / level-label / next bar that sits atop every
 * calendar level. Built from `Box` + `UnstyledButton` (never HTML elements) so
 * it renders on web + native; themed via the active Tamagui theme ramp.
 *
 * The level button is interactive (a `button` that zooms out a level) while
 * `hasNextLevel` is true, and a static, dimmed `div` at the topmost level.
 * `__preventFocus` is ported via `onPressIn` + a cross-platform `preventDefault`
 * guard, NOT a DOM `onMouseDown` handler. Forwards its ref + style props to the
 * root via `.styleable`.
 *
 * Per-slot style sugar: `styles={{ control: { borderRadius: "$lg" } }}` spreads
 * onto the matching part; precedence is fixed (`defaults < styles[slot]`).
 *
 * a11y: prev/next/level each expose their `aria-label`s and `aria-disabled`;
 * the level control is non-interactive (`role="presentation"`) when `!hasNextLevel`.
 *
 * @example
 * <CalendarHeader
 *   label="March 2024"
 *   onPrevious={prevMonth}
 *   onNext={nextMonth}
 *   onLevelClick={zoomOut}
 * />
 */
const CalendarHeaderComponent = CalendarHeaderFrame.styleable<CalendarHeaderProps>(
  function CalendarHeader(props, ref) {
    const {
      __preventFocus,
      __stopPropagation,
      nextIcon,
      previousIcon,
      nextLabel,
      previousLabel,
      onNext,
      onPrevious,
      onLevelClick,
      label,
      nextDisabled = false,
      previousDisabled = false,
      hasNextLevel = true,
      levelControlAriaLabel,
      withNext = true,
      withPrevious = true,
      size = "md",
      headerControlsOrder = ["previous", "level", "next"],
      fullWidth = false,
      styles,
      ...rest
    } = props;

    // `__stopPropagation` is accepted for Mantine API parity; the cross-platform
    // Escape-handling lives at the picker/popover layer, so it is a no-op here
    // (same reservation `Month` makes for it).
    void __stopPropagation;

    // Typed per-slot accessor (dev-warns unknown keys against the known set).
    const s = slotStyles<CalendarHeaderStyles>(styles, CALENDAR_HEADER_SLOT_KEYS, "CalendarHeader");

    // Port Mantine's `preventFocus` (mousedown → preventDefault) cross-platform:
    // run it on press-in, calling `preventDefault` only when the event supports
    // it (web). On native there is nothing to prevent, so the guard short-circuits.
    const preventFocus = __preventFocus
      ? (event: ControlPressInEvent) => {
          if (hasPreventDefault(event)) {
            event.preventDefault();
          }
        }
      : undefined;

    // `type` is a runtime-only `<button>` attribute outside Tamagui's style types;
    // narrow via a precise local object (spread → no excess-prop check).
    const buttonTypeProps: { type: string } = { type: "button" };

    const previousControl = withPrevious ? (
      <CalendarHeaderControl
        key="previous"
        size={size}
        disabled={previousDisabled}
        aria-label={previousLabel}
        aria-disabled={previousDisabled || undefined}
        {...controlA11yProps({ role: "button", label: previousLabel, disabled: previousDisabled })}
        tabIndex={__preventFocus || previousDisabled ? -1 : 0}
        render="button"
        {...buttonTypeProps}
        {...s.get("control")}
        onPress={onPrevious}
        onPressIn={preventFocus}
      >
        {previousIcon ?? (
          <CalendarHeaderIcon size={size} {...s.get("icon")}>
            ‹
          </CalendarHeaderIcon>
        )}
      </CalendarHeaderControl>
    ) : null;

    const nextControl = withNext ? (
      <CalendarHeaderControl
        key="next"
        size={size}
        disabled={nextDisabled}
        aria-label={nextLabel}
        aria-disabled={nextDisabled || undefined}
        {...controlA11yProps({ role: "button", label: nextLabel, disabled: nextDisabled })}
        tabIndex={__preventFocus || nextDisabled ? -1 : 0}
        render="button"
        {...buttonTypeProps}
        {...s.get("control")}
        onPress={onNext}
        onPressIn={preventFocus}
      >
        {nextIcon ?? (
          <CalendarHeaderIcon size={size} {...s.get("icon")}>
            ›
          </CalendarHeaderIcon>
        )}
      </CalendarHeaderControl>
    ) : null;

    const isTextLabel = typeof label === "string" || typeof label === "number";

    const levelControl = (
      <CalendarHeaderLevel
        key="level"
        size={size}
        static={!hasNextLevel}
        disabled={!hasNextLevel}
        aria-label={levelControlAriaLabel}
        aria-disabled={!hasNextLevel || undefined}
        role={hasNextLevel ? "button" : "presentation"}
        // Native role drops to "none" at the topmost level (no zoom-out); RN has
        // no "presentation" member, "none" is its equivalent.
        {...controlA11yProps({
          role: hasNextLevel ? "button" : "none",
          label: levelControlAriaLabel,
          disabled: !hasNextLevel,
        })}
        tabIndex={__preventFocus || !hasNextLevel ? -1 : 0}
        render={hasNextLevel ? "button" : "div"}
        {...(hasNextLevel ? buttonTypeProps : {})}
        {...s.get("level")}
        onPress={hasNextLevel ? onLevelClick : undefined}
        onPressIn={hasNextLevel ? preventFocus : undefined}
      >
        {isTextLabel ? (
          <CalendarHeaderLevelLabel size={size} {...s.get("levelLabel")}>
            {label}
          </CalendarHeaderLevelLabel>
        ) : (
          label
        )}
      </CalendarHeaderLevel>
    );

    const controls = headerControlsOrder.map((control) => {
      if (control === "previous") {
        return previousControl;
      }
      if (control === "level") {
        return levelControl;
      }
      return nextControl;
    });

    return (
      <CalendarHeaderFrame ref={ref} fullWidth={fullWidth} {...s.merge("root", rest)}>
        {controls}
      </CalendarHeaderFrame>
    );
  },
);

// ── Public surface ────────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled parts so consumers can both target
// them via the `styles` sugar and extend them (`styled(CalendarHeader.Control, …)`).
export const CalendarHeader = withStaticProperties(CalendarHeaderComponent, {
  /** The header bar root. */
  Frame: CalendarHeaderFrame,
  /** A prev/next square chevron control. */
  Control: CalendarHeaderControl,
  /** The level (label) control. */
  Level: CalendarHeaderLevel,
  /** The level label text. */
  LevelLabel: CalendarHeaderLevelLabel,
  /** The default chevron glyph. */
  Icon: CalendarHeaderIcon,
});
