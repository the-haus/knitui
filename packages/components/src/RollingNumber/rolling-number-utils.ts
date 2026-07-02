/**
 * Pure value/slot helpers for `RollingNumber` — faithful ports of Mantine's
 * `get-digit-parts`, `get-render-slots`, and `build-value`. No DOM/CSS, so they
 * are identical on web and native.
 */

export interface DigitParts {
  negative: boolean;
  intDigits: string[];
  fracDigits: string[];
  hasDecimal: boolean;
}

export interface GetDigitPartsInput {
  value: number;
  decimalScale?: number;
  fixedDecimalScale?: boolean;
}

const PLAIN_FORMAT = new Intl.NumberFormat("en-US", {
  useGrouping: false,
  maximumFractionDigits: 20,
});

function toPlainString(num: number, decimalScale?: number): string {
  if (!Number.isFinite(num)) {
    return "0";
  }

  if (decimalScale !== undefined) {
    return new Intl.NumberFormat("en-US", {
      useGrouping: false,
      minimumFractionDigits: decimalScale,
      maximumFractionDigits: decimalScale,
    }).format(num);
  }

  const str = String(num);
  if (!str.includes("e") && !str.includes("E")) {
    return str;
  }

  return PLAIN_FORMAT.format(num);
}

export function getDigitParts({
  value,
  decimalScale,
  fixedDecimalScale,
}: GetDigitPartsInput): DigitParts {
  const abs = Math.abs(value);
  let str = toPlainString(abs, decimalScale);

  if (!fixedDecimalScale && decimalScale !== undefined) {
    const parts = str.split(".");
    if (parts[1]) {
      const trimmed = parts[1].replace(/0+$/, "");
      str = trimmed ? `${parts[0]}.${trimmed}` : parts[0];
    }
  }

  const dotIdx = str.indexOf(".");
  const intStr = dotIdx >= 0 ? str.slice(0, dotIdx) : str;
  const fracStr = dotIdx >= 0 ? str.slice(dotIdx + 1) : "";

  return {
    negative: value < 0,
    intDigits: intStr.split(""),
    fracDigits: fracStr ? fracStr.split("") : [],
    hasDecimal: dotIdx >= 0,
  };
}

export interface DigitSlot {
  type: "digit";
  key: string;
  digit: string;
  previousDigit: string | null;
  empty: boolean;
}

export interface CharSlot {
  type: "char";
  key: string;
  char: string;
  empty: boolean;
}

export type RenderSlot = DigitSlot | CharSlot;

export interface GetRenderSlotsInput {
  current: DigitParts;
  previous: DigitParts;
  prefix?: string;
  suffix?: string;
  decimalSeparator?: string;
  thousandSeparator?: string | boolean;
}

function padLeft(arr: string[], length: number): (string | null)[] {
  return [...Array(length - arr.length).fill(null), ...arr];
}

function padRight(arr: string[], length: number): (string | null)[] {
  return [...arr, ...Array(length - arr.length).fill(null)];
}

export function getRenderSlots({
  current,
  previous,
  prefix,
  suffix,
  decimalSeparator = ".",
  thousandSeparator,
}: GetRenderSlotsInput): RenderSlot[] {
  const maxIntLen = Math.max(current.intDigits.length, previous.intDigits.length);
  const maxFracLen = Math.max(current.fracDigits.length, previous.fracDigits.length);

  const currIntPadded = padLeft(current.intDigits, maxIntLen);
  const prevIntPadded = padLeft(previous.intDigits, maxIntLen);
  const currFracPadded = padRight(current.fracDigits, maxFracLen);
  const prevFracPadded = padRight(previous.fracDigits, maxFracLen);

  const sep = thousandSeparator
    ? typeof thousandSeparator === "string"
      ? thousandSeparator
      : ","
    : null;

  const slots: RenderSlot[] = [];

  if (prefix) {
    for (let i = 0; i < prefix.length; i++) {
      slots.push({ type: "char", key: `prefix-${i}`, char: prefix[i], empty: false });
    }
  }

  if (current.negative || previous.negative) {
    slots.push({ type: "char", key: "sign", char: "-", empty: !current.negative });
  }

  for (let i = 0; i < maxIntLen; i++) {
    const posFromRight = maxIntLen - 1 - i;
    const currDigit = currIntPadded[i];
    const prevDigit = prevIntPadded[i];
    const isEmpty = currDigit === null;

    slots.push({
      type: "digit",
      key: `int-${posFromRight}`,
      digit: currDigit ?? "0",
      previousDigit: prevDigit,
      empty: isEmpty,
    });

    if (sep && posFromRight > 0 && posFromRight % 3 === 0) {
      slots.push({ type: "char", key: `sep-${posFromRight}`, char: sep, empty: isEmpty });
    }
  }

  if (current.hasDecimal || previous.hasDecimal) {
    slots.push({
      type: "char",
      key: "dec",
      char: decimalSeparator,
      empty: !current.hasDecimal,
    });
  }

  for (let i = 0; i < maxFracLen; i++) {
    const currDigit = currFracPadded[i];
    const prevDigit = prevFracPadded[i];
    const isEmpty = currDigit === null;

    slots.push({
      type: "digit",
      key: `frac-${i}`,
      digit: currDigit ?? "0",
      previousDigit: prevDigit,
      empty: isEmpty,
    });
  }

  if (suffix) {
    for (let i = 0; i < suffix.length; i++) {
      slots.push({ type: "char", key: `suffix-${i}`, char: suffix[i], empty: false });
    }
  }

  return slots;
}

export interface BuildValueInput {
  value: number;
  prefix?: string;
  suffix?: string;
  decimalSeparator?: string;
  thousandSeparator?: string | boolean;
  decimalScale?: number;
  fixedDecimalScale?: boolean;
}

export function buildValue({
  value,
  prefix,
  suffix,
  decimalSeparator = ".",
  thousandSeparator,
  decimalScale,
  fixedDecimalScale,
}: BuildValueInput): string {
  const parts = getDigitParts({ value, decimalScale, fixedDecimalScale });
  let intStr = parts.intDigits.join("");

  if (thousandSeparator) {
    const sep = typeof thousandSeparator === "string" ? thousandSeparator : ",";
    intStr = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }

  let result = parts.negative ? `-${intStr}` : intStr;
  if (parts.fracDigits.length > 0) {
    result += `${decimalSeparator}${parts.fracDigits.join("")}`;
  }

  return `${prefix || ""}${result}${suffix || ""}`;
}
