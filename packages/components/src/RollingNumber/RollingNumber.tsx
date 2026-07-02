import * as React from "react";

import { DURATIONS, getFontSize, type GetProps, styled, withStaticProperties } from "@knitui/core";
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
  name: "RollingNumber",
  flexDirection: "row",
  alignItems: "center",
  overflow: "hidden",
});

const RollingNumberDigitViewport = styled(Box, {
  name: "RollingNumberDigitViewport",
  overflow: "hidden",
});

const RollingNumberDigitStrip = styled(Box, {
  name: "RollingNumberDigitStrip",
});

const RollingNumberDigitText = styled(Text, {
  name: "RollingNumberDigitText",
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
 * be a number to work on native). A bare key (`"xxl"`) maps to its `$`-token and
 * its px via `getFontSize`; a custom number is used verbatim for both.
 */
const resolveFontSize = (
  fontSize: RollingNumberFontSize | number,
): { token: TextProps["fontSize"]; px: number } =>
  typeof fontSize === "number"
    ? { token: fontSize, px: fontSize }
    : { token: `$${fontSize}` as TextProps["fontSize"], px: getFontSize(fontSize) };

interface RollingDigitProps {
  digit: string;
  empty: boolean;
  digitHeight: number;
  fontSize: TextProps["fontSize"];
  fontFamily: TextProps["fontFamily"];
  animate: boolean;
  duration: number;
  /** Resolved per-slot style sugar for the digit-column parts. */
  slots: {
    viewport?: GetProps<typeof RollingNumberDigitViewport>;
    strip?: GetProps<typeof RollingNumberDigitStrip>;
    text?: GetProps<typeof RollingNumberDigitText>;
  };
}

/** A single rolling digit — a 0–9 strip translated so the target digit shows.
 *  The continuous `translateY` interpolation rolls through the intermediate
 *  digits when the value changes. */
function RollingDigit({
  digit,
  empty,
  digitHeight,
  fontSize,
  fontFamily,
  animate,
  duration,
  slots,
}: RollingDigitProps) {
  const index = parseInt(digit, 10) || 0;
  const transition = animate ? transitionProps(timedTransition(duration)) : transitionProps(null);

  // `styles` slot sugar is lowest precedence — it spreads UNDER the
  // component-owned geometry/transition props, which always win.
  return (
    <RollingNumberDigitViewport
      {...slots.viewport}
      height={digitHeight}
      width={empty ? 0 : undefined}
      opacity={empty ? 0 : 1}
      aria-hidden
      {...transition}
    >
      <RollingNumberDigitStrip {...slots.strip} y={-index * digitHeight} {...transition}>
        {STRIP.map((d, i) => (
          <RollingNumberDigitText
            key={i}
            {...slots.text}
            height={digitHeight}
            lineHeight={digitHeight}
            fontSize={fontSize}
            fontFamily={fontFamily}
          >
            {d}
          </RollingNumberDigitText>
        ))}
      </RollingNumberDigitStrip>
    </RollingNumberDigitViewport>
  );
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type RollingNumberRootProps = Omit<GetProps<typeof RollingNumberRoot>, "children" | "fontSize">;

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
const RollingNumberBase = RollingNumberRoot.styleable<RollingNumberProps>(
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
    const digitSlots = {
      viewport: s.get("digitViewport"),
      strip: s.get("digitStrip"),
      text: s.get("digitText"),
    };

    const reduced = useReducedMotion();
    const duration = reduced ? 0 : animationDuration;

    const { token: fontToken, px: fontSizePx } = resolveFontSize(fontSize);
    const digitHeight = Math.round(fontSizePx * 1.25);
    const fontFamily: TextProps["fontFamily"] = tabularNumbers ? "$mono" : undefined;

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
              fontSize={fontToken}
              fontFamily={fontFamily}
              animate={duration > 0}
              duration={duration}
              slots={digitSlots}
            />
          ) : (
            <Text
              key={slot.key}
              fontSize={fontToken}
              lineHeight={digitHeight}
              fontFamily={fontFamily}
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
