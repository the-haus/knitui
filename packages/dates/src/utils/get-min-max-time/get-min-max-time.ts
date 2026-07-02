import dayjs from "dayjs";

import type { DateStringValue } from "../../types";

/** Input for {@link getMinTime}. */
interface GetMinTimeInput {
  /** Minimum selectable date (`YYYY-MM-DD[ HH:mm:ss]` string or `Date`). */
  minDate?: DateStringValue | Date;

  /** The currently selected single date value. */
  value: DateStringValue | null;
}

/**
 * The minimum time-of-day (`"HH:mm:ss"`) the time inputs may use — but ONLY when
 * the selected `value` lands on the same instant as `minDate` (so the day is the
 * boundary day and the time must not dip below the limit). Otherwise `undefined`
 * (no lower bound on the time). Ported from Mantine's `getMinTime`, re-typed
 * `any`-free.
 */
export function getMinTime({ minDate, value }: GetMinTimeInput): string | undefined {
  const minTime = minDate ? dayjs(minDate).format("HH:mm:ss") : null;
  return value && minDate && value === minDate ? (minTime ?? undefined) : undefined;
}

/** Input for {@link getMaxTime}. */
interface GetMaxTimeInput {
  /** Maximum selectable date (`YYYY-MM-DD[ HH:mm:ss]` string or `Date`). */
  maxDate?: DateStringValue | Date;

  /** The currently selected single date value. */
  value: DateStringValue | null;
}

/**
 * The maximum time-of-day (`"HH:mm:ss"`) the time inputs may use — ONLY when the
 * selected `value` matches `maxDate` (the boundary day). Otherwise `undefined`.
 * Ported from Mantine's `getMaxTime`, re-typed `any`-free.
 */
export function getMaxTime({ maxDate, value }: GetMaxTimeInput): string | undefined {
  const maxTime = maxDate ? dayjs(maxDate).format("HH:mm:ss") : null;
  return value && maxDate && value === maxDate ? (maxTime ?? undefined) : undefined;
}
