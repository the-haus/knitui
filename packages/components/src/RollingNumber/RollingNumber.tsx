import * as React from "react";

import {
  DURATIONS,
  getFontSize,
  type GetProps,
  styleable,
  styled,
  withStaticProperties,
} from "@knitui/core";
import { useReducedMotion } from "@knitui/hooks";

import { Box } from "../Box";
import { timedTransition, transitionProps } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text, type TextProps } from "../Text";
import { buildValue, getDigitParts, getRenderSlots } from "./rolling-number-utils";

export type { CharSlot, DigitParts, DigitSlot, RenderSlot } from "./rolling-number-utils";

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const RollingNumberRoot = styled(Box, {
  displayName: "RollingNumber",
  flexDirection: "row",
  alignItems: "center",
  overflow: "hidden",
});

const RollingNumberDigitViewport = styled(Box, {
  displayName: "RollingNumberDigitViewport",
  overflow: "hidden",
});

const RollingNumberDigitStrip = styled(Box, {
  displayName: "RollingNumberDigitStrip",
});

const RollingNumberDigitText = styled(Text, {
  displayName: "RollingNumberDigitText",
  textAlign: "center",
});

const STRIP = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled digit-column part it targets, so `styles={{ digitText: { … } }}`
 * is sugar for `<RollingNumber.DigitText … />`. Threaded through the private
 * digit columns so the prop-API path is restylable without composing the parts.
 */
export interface RollingNumberStyles {
  /** Props for each digit's clipping viewport (`RollingNumber.DigitViewport`). */
  digitViewport?: GetProps<typeof RollingNumberDigitViewport>;
  /** Props for each digit's 0–9 strip (`RollingNumber.DigitStrip`). */
  digitStrip?: GetProps<typeof RollingNumberDigitStrip>;
  /** Props for each digit glyph (`RollingNumber.DigitText`). */
  digitText?: GetProps<typeof RollingNumberDigitText>;
}

const ROLLING_NUMBER_SLOT_KEYS = [
  "digitViewport",
  "digitStrip",
  "digitText",
] as const satisfies readonly (keyof RollingNumberStyles)[];

/* -------------------------------------------------------------------------- */
/* Digit column                                                               */
/* -------------------------------------------------------------------------- */

type RollingNumberFontSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

const DEFAULT_FONT_SIZE: RollingNumberFontSize = "xxl";

/**
 * Resolve the `fontSize` prop to a Tamagui font TOKEN (passed to the rendered
 * `Text` so the digits use the font-size scale, not a hardcoded px) plus its raw
 * px value (needed for the digit-strip `translateY`/`height` geometry, which must
 * be a number to work on native). A bare key (`"xxl"`) IS the v3 font token
 * (no sigil) and its px comes from core's config-free `getFontSize`; a custom
 * number is used verbatim for both.
 */
const resolveFontSize = (
  fontSize: RollingNumberFontSize | number,
): { token: TextProps["fontSize"]; px: number } => ({
  token: fontSize,
  px: getFontSize(fontSize),
});

/**
 * v3: a NUMERIC `lineHeight` is a ratio (×fontSize) on web AND native, so the
 * absolute line box is written as a `"<n>px"` string (native parses it back).
 */
const lineHeightPx = (px: number) => `${px}px` as const;

/** Font props shared by every glyph — built once per render by the parent. */
type DigitFont = Pick<TextProps, "fontSize" | "fontFamily">;

/**
 * The viewport's per-state props as module constants. A visible column must NOT
 * get `width={undefined}`: v3 treats an explicit `undefined` style prop as "clear
 * the value", which would wipe a `styles.digitViewport.width`.
 */
const EMPTY_VIEWPORT = { width: 0, opacity: 0 } as const;
const FULL_VIEWPORT = { opacity: 1 } as const;

/** Resolved per-slot style sugar for the digit-column parts. */
interface RollingDigitSlots {
  viewport?: GetProps<typeof RollingNumberDigitViewport>;
  strip?: GetProps<typeof RollingNumberDigitStrip>;
  text?: GetProps<typeof RollingNumberDigitText>;
}

interface RollingDigitProps {
  digit: string;
  empty: boolean;
  digitHeight: number;
  /** Memoised by the parent (`fontFamily` only present for tabular digits). */
  font: DigitFont;
  /**
   * The ready-made `{ transition }` object, built ONCE by the parent. Every
   * column used to recompute the identical `transitionProps(timedTransition(…))`
   * itself, and the fresh object also broke the `React.memo` below.
   */
  transition: ReturnType<typeof transitionProps>;
  slots: RollingDigitSlots;
}

/** A single rolling digit — a 0–9 strip translated so the target digit shows.
 *  The continuous `translateY` interpolation rolls through the intermediate
 *  digits when the value changes.
 *
 *  Memoized: a number ticking from 1 to 2 changes ONE column, but the parent
 *  re-renders on every tick, and each column is a viewport + strip + ten glyph
 *  `Text`s. Without the memo a 6-digit value re-rendered ~78 styled nodes per
 *  tick to move one strip. Every prop is either a primitive or hoisted/memoized
 *  by the parent so the comparison can actually bail out. */
const RollingDigit = React.memo(function RollingDigit({
  digit,
  empty,
  digitHeight,
  font,
  transition,
  slots,
}: RollingDigitProps) {
  const index = parseInt(digit, 10) || 0;

  // `styles` slot sugar is lowest precedence — it spreads UNDER the
  // component-owned geometry/transition props, which always win.
  return (
    <RollingNumberDigitViewport
      {...slots.viewport}
      height={digitHeight}
      {...(empty ? EMPTY_VIEWPORT : FULL_VIEWPORT)}
      aria-hidden
      {...transition}
    >
      <RollingNumberDigitStrip {...slots.strip} y={-index * digitHeight} {...transition}>
        {STRIP.map((d, i) => (
          <RollingNumberDigitText
            key={i}
            {...slots.text}
            height={digitHeight}
            lineHeight={lineHeightPx(digitHeight)}
            {...font}
          >
            {d}
          </RollingNumberDigitText>
        ))}
      </RollingNumberDigitStrip>
    </RollingNumberDigitViewport>
  );
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * `animationDuration` is a CSS style prop in v3, so the root's own one is
 * omitted: here it is the roll duration in ms (Mantine's name).
 */
type RollingNumberRootProps = Omit<
  GetProps<typeof RollingNumberRoot>,
  "children" | "fontSize" | "animationDuration"
>;

export interface RollingNumberProps extends RollingNumberRootProps {
  /** Number value to display. */
  value: number;
  /** Prefix rendered before the value. */
  prefix?: string;
  /** Suffix rendered after the value. */
  suffix?: string;
  /** Decimal separator character. @default "." */
  decimalSeparator?: string;
  /** Thousands separator; `true` uses `,`. @default false */
  thousandSeparator?: string | boolean;
  /** Number of decimal places to display. */
  decimalScale?: number;
  /** Pad trailing zeros to match `decimalScale`. @default false */
  fixedDecimalScale?: boolean;
  /** Roll animation duration in ms. @default 600 */
  animationDuration?: number;
  /** Use tabular (monospace) digits so columns stay aligned. @default true */
  tabularNumbers?: boolean;
  /**
   * When set, the root is an `aria-live` region (`role="status"`) so screen
   * readers announce every change; otherwise `role="img"`. @default false
   */
  withLiveRegion?: boolean;
  /**
   * Digit/character font size. Standard values resolve against the fontSize
   * scale; a number is a custom px size. @default "xxl"
   */
  fontSize?: RollingNumberFontSize | number;
  /** Per-slot style sugar — props spread onto the matching digit-column parts. */
  styles?: SlotStyles<RollingNumberStyles>;
}

/* -------------------------------------------------------------------------- */
/* RollingNumber                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Animated number whose digits roll between values — mirrors Mantine's
 * `RollingNumber`. Each digit is a 0–9 strip translated by `y` (px, not `em`, so
 * it works on native) via the `transition` driver; non-digit characters render
 * statically. Formatting (prefix/suffix/separators/decimals) comes from the pure
 * ports of Mantine's value helpers. Respects reduced motion (snaps, no roll).
 */
const RollingNumberBase = styleable<RollingNumberProps>(
  RollingNumberRoot,
  function RollingNumber(props, ref) {
    const {
      value,
      prefix,
      suffix,
      decimalSeparator = ".",
      thousandSeparator,
      decimalScale,
      fixedDecimalScale,
      animationDuration = DURATIONS.ambient,
      tabularNumbers = true,
      withLiveRegion = false,
      fontSize = DEFAULT_FONT_SIZE,
      styles,
      ...rest
    } = props;

    const s = slotStyles<RollingNumberStyles>(styles, ROLLING_NUMBER_SLOT_KEYS, "RollingNumber");
    // Both of these are props of the memoized `RollingDigit`, so they have to be
    // referentially stable or the memo never bails out. `s.get(…)` hands back the
    // consumer's own slot objects unchanged, so keying on them is exact.
    const viewportSlot = s.get("digitViewport");
    const stripSlot = s.get("digitStrip");
    const textSlot = s.get("digitText");
    const digitSlots = React.useMemo<RollingDigitSlots>(
      () => ({ viewport: viewportSlot, strip: stripSlot, text: textSlot }),
      [viewportSlot, stripSlot, textSlot],
    );

    const reduced = useReducedMotion();
    const duration = reduced ? 0 : animationDuration;

    // One `{ transition }` object for ALL columns instead of one per column per
    // render. `null` (reduced motion) keeps the prop present so Tamagui's
    // animation driver hook order is stable — see `transitionProps`.
    const digitTransition = React.useMemo(
      () => (duration > 0 ? transitionProps(timedTransition(duration)) : transitionProps(null)),
      [duration],
    );

    const { token: fontToken, px: fontSizePx } = resolveFontSize(fontSize);
    const digitHeight = Math.round(fontSizePx * 1.25);
    const font = React.useMemo<DigitFont>(
      () =>
        tabularNumbers ? { fontSize: fontToken, fontFamily: "mono" } : { fontSize: fontToken },
      [fontToken, tabularNumbers],
    );

    const previousRef = React.useRef(value);
    const previousValue = previousRef.current;
    React.useEffect(() => {
      previousRef.current = value;
    });

    const current = getDigitParts({ value, decimalScale, fixedDecimalScale });
    const previous = getDigitParts({ value: previousValue, decimalScale, fixedDecimalScale });
    const slots = getRenderSlots({
      current,
      previous,
      prefix,
      suffix,
      decimalSeparator,
      thousandSeparator,
    });
    const accessibleValue = buildValue({
      value,
      prefix,
      suffix,
      decimalSeparator,
      thousandSeparator,
      decimalScale,
      fixedDecimalScale,
    });

    const ariaProps: { role: "status" | "img"; "aria-label": string; "aria-live"?: "polite" } = {
      role: withLiveRegion ? "status" : "img",
      "aria-label": accessibleValue,
      ...(withLiveRegion ? { "aria-live": "polite" } : {}),
    };

    return (
      <RollingNumberRoot ref={ref} {...rest} {...ariaProps}>
        {slots.map((slot) =>
          slot.type === "digit" ? (
            <RollingDigit
              key={slot.key}
              digit={slot.digit}
              empty={slot.empty}
              digitHeight={digitHeight}
              font={font}
              transition={digitTransition}
              slots={digitSlots}
            />
          ) : (
            <Text
              key={slot.key}
              lineHeight={lineHeightPx(digitHeight)}
              {...font}
              opacity={slot.empty ? 0 : 1}
              aria-hidden
            >
              {slot.char}
            </Text>
          ),
        )}
      </RollingNumberRoot>
    );
  },
);

export const RollingNumber = withStaticProperties(RollingNumberBase, {
  Root: RollingNumberRoot,
  DigitViewport: RollingNumberDigitViewport,
  DigitStrip: RollingNumberDigitStrip,
  DigitText: RollingNumberDigitText,
});

export type { RollingNumberFontSize };
