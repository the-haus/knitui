import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import type { DateStringValue } from "../types";

// Register `customParseFormat` exactly once so strict format parsing works.
// `dayjs.extend` is idempotent, so a repeated import is a harmless no-op.
dayjs.extend(customParseFormat);

/** Input for {@link parseDateString}. */
export interface ParseDateStringInput {
  /** Raw text typed by the user. */
  value: string;

  /** `dayjs` format the text is expected to match (the field's `valueFormat`). */
  format: string;

  /** Resolved `dayjs` locale (from `DatesProvider` / the `locale` prop). */
  locale: string;

  /** Keep the time component in the canonical output. @default false */
  withTime?: boolean;
}

/**
 * Deterministic, native-safe replacement for Mantine's `defaultDateParser` +
 * `dateStringParser` (which reach for `new Date(dateString)`). Parses typed text
 * to a canonical `YYYY-MM-DD` (or `YYYY-MM-DD HH:mm:ss` with `withTime`) string,
 * or `null` when it cannot be understood.
 *
 * Tries a strict match against `format` first (via `customParseFormat`), then a
 * lenient `dayjs(value)` fallback for ISO-ish input — NEVER `new Date(value)` for
 * parsing, so it behaves identically on web and native.
 */
export function parseDateString({
  value,
  format,
  locale,
  withTime = false,
}: ParseDateStringInput): DateStringValue | null {
  const outputFormat = withTime ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD";

  const strict = dayjs(value, format, locale, true);
  if (strict.isValid()) {
    return strict.format(outputFormat);
  }

  const lenient = dayjs(value);
  if (lenient.isValid()) {
    return lenient.locale(locale).format(outputFormat);
  }

  return null;
}
