import * as React from "react";

import { Text, UnstyledButton } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  styleable,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { type CalendarSize, cellFontVariant, pickerCellVariant } from "../cell-metrics";
import { controlA11yProps } from "../internal/a11y";

/** PickerControl size — the kit's shared control size scale. */
type PickerControlSize = CalendarSize;

/**
 * Month/year cell metrics shared down to the label via context. The cell is a
 * WIDE rectangle (Mantine: `width = height * 7/3`) sized off the shared
 * `CELL_WIDTH` ladder so a 3-column month/year grid spans the same width as the
 * 7-column day grid; the label font tracks the shared `CELL_FONT` ladder.
 */
// `minHeight` mirrors `height` so it floors the cell when `fullWidth` swaps
// `height` to `"100%"` to fill a constrained calendar height — an unconstrained
// parent resolves that percentage to "auto" and the cell would otherwise
// collapse to its label's line-height (the same floor `Day` carries).
const PickerControlContext = createStyledContext<{ size: PickerControlSize }>({ size: "md" });

/**
 * The month/year cell — the `Day` analogue for the year & decade levels — an
 * `UnstyledButton`-based control composed via `styled`. Accent comes from the
 * active theme's palette ramp via the `theme` prop (no Mantine `color` prop): a
 * selected control fills with `color9`/`color1` text; in-range controls take a
 * `color4` tint with the range edges rounded by the `firstInRange`/`lastInRange`
 * corner variants (the `inRange` base squares all four corners, the edge variants
 * round their own two — so a single control range gets all four back). States use
 * `hover:`/`press:` clauses + a `disabled` variant, never a runtime hover flag.
 *
 * Variant precedence: Tamagui v3 applies active variants in PROP order (later
 * wins), not declaration order: the wrapper passes `inRange` before
 * `firstInRange`/`lastInRange` (the edges win on radius) and `selected` last. Mantine precedence (selected over in-range, all suppressed when
 * disabled) is applied in the component by gating the boolean flags.
 */
const PickerControlFrame = styled(UnstyledButton.Frame, {
  displayName: "PickerControl",
  context: PickerControlContext,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 0,
  borderColor: "transparent",
  borderRadius: "sm",
  backgroundColor: "transparent hover:color2 press:color3",
  cursor: "web:pointer",

  variants: {
    size: pickerCellVariant,

    /**
     * Control fills its grid cell in BOTH axes: `width: "100%"` + the
     * `flexGrow`/`flexBasis` share it across the row, and `height: "100%"` lets
     * it grow to fill a constrained calendar height (the row distributes the
     * extra). The square-ladder `minHeight` floors it when no height is set.
     */
    fullWidth: {
      true: { width: "100%", height: "100%", flexGrow: 1, flexBasis: 0 },
    },

    /** Control within a selected range — tinted background, squared corners. */
    inRange: {
      true: {
        backgroundColor: "color4 hover:color5 press:color5",
        borderRadius: 0,
      },
    },

    /** First control of a range — round the inline-start corners. */
    firstInRange: {
      true: { borderTopLeftRadius: "sm", borderBottomLeftRadius: "sm" },
    },

    /** Last control of a range — round the inline-end corners. */
    lastInRange: {
      true: { borderTopRightRadius: "sm", borderBottomRightRadius: "sm" },
    },

    /** Selected control — solid accent fill. */
    selected: {
      true: {
        backgroundColor: "color9 hover:color10 press:color8",
      },
    },

    /** Non-interactive cursor/selection + dimmed, no hover affordance. */
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
        cursor: "web:not-allowed",
        backgroundColor: "hover:transparent press:transparent",
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

/**
 * The control label — shares `size` via context, colour set per state.
 *
 * Colour is expressed as boolean VARIANTS, never a per-render dynamic `color`
 * style prop: the idle label is the neutral `color`, and on the solid accent
 * fill a `selected` label flips to the contrast `color1`. Keeping colour in
 * variants — not a runtime ternary — keeps the cell compiler-safe (no dynamic
 * style prop for the optimiser to fold into the whole cell; mirrors `DayLabel`).
 */
const PickerControlLabel = styled(Text, {
  displayName: "PickerControlLabel",
  context: PickerControlContext,
  userSelect: "none",
  color: "color",
  variants: {
    size: cellFontVariant,

    /** Selected control — contrast text on the solid accent fill. */
    selected: {
      true: { color: "color1" },
    },
  } as const,

  defaultVariants: { size: "md" },
});

type PickerControlFrameProps = GetProps<typeof PickerControlFrame>;

/**
 * `type="button"` — a runtime-only `<button>` attribute outside Tamagui's style
 * types, spread from one frozen module constant (no excess-prop check, no
 * per-render object).
 */
const BUTTON_TYPE: { type: string } = Object.freeze({ type: "button" });

export interface PickerControlProps extends Omit<
  PickerControlFrameProps,
  "size" | "selected" | "inRange" | "firstInRange" | "lastInRange" | "disabled" | "children"
> {
  /** Control children — the month / year label (or a custom node). */
  children?: React.ReactNode;

  /** Width/font of the control. @default 'md' */
  size?: PickerControlSize;

  /** Disables the control. @default false */
  disabled?: boolean;

  /** Assigns selected styles. @default false */
  selected?: boolean;

  /** Assigns in-range styles. @default false */
  inRange?: boolean;

  /** Assigns first-in-range styles. @default false */
  firstInRange?: boolean;

  /** Assigns last-in-range styles. @default false */
  lastInRange?: boolean;

  /** Determines whether the control should take the full width of its cell. @default false */
  fullWidth?: boolean;
}

/**
 * `PickerControl` — the shared cell button for the month & year selection grids
 * (the `Day` analogue for the year/decade levels). Built on `UnstyledButton`,
 * themed via the active Tamagui theme ramp. Forwards its ref to the host node.
 *
 * a11y: it is a button (`role="button"`); `aria-label` (via `...rest`),
 * `aria-selected` and `aria-disabled` are exposed for screen readers.
 */
const PickerControlComponent = styleable<PickerControlProps>(
  PickerControlFrame,
  function PickerControl(props, ref) {
    const {
      children,
      size = "md",
      disabled = false,
      selected = false,
      inRange = false,
      firstInRange = false,
      lastInRange = false,
      fullWidth = false,
      "aria-label": ariaLabel,
      ...rest
    } = props;

    // Mirror Mantine's data-attribute gating: a disabled control shows none of
    // the selection/range styling, and a selected control suppresses the in-range
    // tint (selected wins).
    const isSelected = !disabled && selected;
    const isInRange = !disabled && !selected && inRange;
    const isFirstInRange = !disabled && firstInRange;
    const isLastInRange = !disabled && lastInRange;

    const content = children;
    const isTextContent = typeof content === "string" || typeof content === "number";

    return (
      <PickerControlFrame
        ref={ref}
        size={size}
        // v3 applies variants in PROP ORDER (later wins): inRange squares the
        // corners, the edges round theirs after it, `selected` wins last.
        inRange={isInRange}
        firstInRange={isFirstInRange}
        lastInRange={isLastInRange}
        selected={isSelected}
        disabled={disabled}
        fullWidth={fullWidth}
        role="button"
        aria-label={ariaLabel}
        aria-selected={isSelected || undefined}
        aria-disabled={disabled || undefined}
        // Native (VoiceOver/TalkBack) counterparts of the web `role`/`aria-*`;
        // the month/year label arrives via `aria-label` and is forwarded here.
        {...controlA11yProps({
          role: "button",
          label: ariaLabel,
          selected: isSelected,
          disabled,
        })}
        render="button"
        {...BUTTON_TYPE}
        {...rest}
      >
        {isTextContent ? (
          <PickerControlLabel selected={isSelected}>{content}</PickerControlLabel>
        ) : (
          content
        )}
      </PickerControlFrame>
    );
  },
);

PickerControlComponent.displayName = "@knitui/dates/PickerControl";

// Public surface: the component plus its styled parts, so consumers can target /
// extend them (`styled(PickerControl.Frame, …)` / `styled(PickerControl.Label, …)`).
export const PickerControl = withStaticProperties(PickerControlComponent, {
  Frame: PickerControlFrame,
  Label: PickerControlLabel,
});

export type { PickerControlSize };
