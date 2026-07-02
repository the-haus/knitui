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
  return `${neg ? "-" : ""}${digits.replace(new RegExp(`\\B(?=(\\d{${groupSize}})+(?!\\d))`, "g"), sep)}`;
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
      value: _value,
      allowNegative: _allowNegative,
      decimalScale: _decimalScale,
      decimalSeparator: _decimalSeparator,
      fixedDecimalScale: _fixedDecimalScale,
      prefix: _prefix,
      suffix: _suffix,
      thousandSeparator: _thousandSeparator,
      thousandsGroupStyle: _thousandsGroupStyle,
      ...textProps
    } = props;

    const formatted = formatValue(props);
    if (!formatted) return null;

    return (
      <NumberFormatterFrame ref={ref} {...textProps}>
        {formatted}
      </NumberFormatterFrame>
    );
  },
);
