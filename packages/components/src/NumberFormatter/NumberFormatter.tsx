import * as React from "react";

import { type GetProps, styled } from "@knitui/core";

import { Text } from "../Text";

const NumberFormatterFrame = styled(Text, {
  name: "NumberFormatter",
});

type NumberFormatterFrameProps = Omit<GetProps<typeof NumberFormatterFrame>, "children">;

export interface NumberFormatterProps extends NumberFormatterFrameProps {
  /** Value to format. */
  value?: number | string;
  /** If set, negative values are allowed. @default true */
  allowNegative?: boolean;
  /** Limits digits after the decimal point. @default Infinity */
  decimalScale?: number;
  /** Character used as a decimal separator. @default '.' */
  decimalSeparator?: string;
  /** Pad zeros after the decimal to match `decimalScale`. @default false */
  fixedDecimalScale?: boolean;
  /** Prefix added before the value. */
  prefix?: string;
  /** Suffix added after the value. */
  suffix?: string;
  /** Thousand-grouping style. @default 'none' */
  thousandsGroupStyle?: "thousand" | "lakh" | "wan" | "none";
  /** Separator character inserted at group boundaries. `true` → `','`. */
  thousandSeparator?: string | boolean;
}

/**
 * Group-separator patterns, compiled once at module scope.
 *
 * `groupDigits` ran `new RegExp(...)` on every format call — i.e. once per table
 * cell / list row on every render — recompiling one of only two realistic
 * patterns. `thousandsGroupStyle` can only reach group size 3 (`thousand`) or 4
 * (`wan`), so both are precompiled; an unusual size still works, it is built and
 * cached on first use rather than rejected.
 *
 * Reusing a `/g` regex across calls is safe here: `String.prototype.replace`
 * resets `lastIndex` before and after a global match, so no state leaks between
 * calls.
 */
const GROUP_PATTERNS = new Map<number, RegExp>([
  [3, /\B(?=(\d{3})+(?!\d))/g],
  [4, /\B(?=(\d{4})+(?!\d))/g],
]);

function groupPattern(groupSize: number): RegExp {
  let pattern = GROUP_PATTERNS.get(groupSize);
  if (pattern === undefined) {
    pattern = new RegExp(`\\B(?=(\\d{${groupSize}})+(?!\\d))`, "g");
    GROUP_PATTERNS.set(groupSize, pattern);
  }
  return pattern;
}

function groupDigits(
  intPart: string,
  style: NonNullable<NumberFormatterProps["thousandsGroupStyle"]>,
  sep: string,
): string {
  if (style === "none") return intPart;

  const neg = intPart.startsWith("-");
  const digits = neg ? intPart.slice(1) : intPart;

  if (style === "lakh") {
    if (digits.length <= 3) return intPart;

    const head = digits.slice(0, -3);
    const tail = digits.slice(-3);
    const groupedHead = head.replace(/\B(?=(\d{2})+(?!\d))/g, sep);
    return `${neg ? "-" : ""}${groupedHead}${sep}${tail}`;
  }

  const groupSize = style === "wan" ? 4 : 3;
  return `${neg ? "-" : ""}${digits.replace(groupPattern(groupSize), sep)}`;
}

function formatValue(props: NumberFormatterProps): string {
  const {
    value,
    allowNegative = true,
    decimalScale,
    decimalSeparator = ".",
    fixedDecimalScale = false,
    prefix = "",
    suffix = "",
    thousandSeparator = false,
    thousandsGroupStyle = "none",
  } = props;

  if (value === undefined || value === null || value === "") return "";

  let num = typeof value === "string" ? parseFloat(String(value)) : value;
  if (!Number.isFinite(num)) return String(value);
  if (!allowNegative && num < 0) num = Math.abs(num);

  let formatted: string;
  if (decimalScale !== undefined) {
    formatted = fixedDecimalScale
      ? num.toFixed(decimalScale)
      : String(parseFloat(num.toFixed(decimalScale)));
  } else {
    formatted = String(num);
  }

  // Split into integer / decimal parts
  const dotIndex = formatted.indexOf(".");
  let intPart = dotIndex === -1 ? formatted : formatted.slice(0, dotIndex);
  let decPart = dotIndex === -1 ? undefined : formatted.slice(dotIndex + 1);

  if (fixedDecimalScale && decimalScale !== undefined && decimalScale > 0 && !decPart) {
    decPart = "0".repeat(decimalScale);
  }

  // Thousands grouping
  if (thousandSeparator !== false) {
    const sep = thousandSeparator === true ? "," : thousandSeparator;
    const style = thousandsGroupStyle === "none" ? "thousand" : thousandsGroupStyle;
    intPart = groupDigits(intPart, style, sep);
  }

  const body = decPart !== undefined ? `${intPart}${decimalSeparator}${decPart}` : intPart;
  return `${prefix}${body}${suffix}`;
}

/**
 * `NumberFormatter` — pure display component that formats a number with
 * thousands separators, decimal rounding, and optional prefix/suffix. Mirrors
 * Mantine's `NumberFormatter` API (which wraps `react-number-format`); this
 * implementation is self-contained so there is no extra dependency.
 */
export const NumberFormatter = NumberFormatterFrame.styleable<NumberFormatterProps>(
  function NumberFormatter(props, ref) {
    const {
      value,
      allowNegative,
      decimalScale,
      decimalSeparator,
      fixedDecimalScale,
      prefix,
      suffix,
      thousandSeparator,
      thousandsGroupStyle,
      ...textProps
    } = props;

    // Formatting is pure over these nine props (the defaults live in
    // `formatValue`), so memoize it: this component renders per table cell / list
    // row, and re-running the parse + rounding + grouping on every parent render —
    // including renders where only a style prop moved — was wasted string work.
    const formatted = React.useMemo(
      () =>
        formatValue({
          value,
          allowNegative,
          decimalScale,
          decimalSeparator,
          fixedDecimalScale,
          prefix,
          suffix,
          thousandSeparator,
          thousandsGroupStyle,
        }),
      [
        value,
        allowNegative,
        decimalScale,
        decimalSeparator,
        fixedDecimalScale,
        prefix,
        suffix,
        thousandSeparator,
        thousandsGroupStyle,
      ],
    );
    if (!formatted) return null;

    return (
      <NumberFormatterFrame ref={ref} {...textProps}>
        {formatted}
      </NumberFormatterFrame>
    );
  },
);
