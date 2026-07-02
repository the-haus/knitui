import dayjs from "dayjs";

import type { DateStringValue } from "../../../types";

/**
 * Whether `date` falls within the inclusive `[start, end]` range, ported 1:1 from
 * Mantine's `is-in-range`. The pair is sorted first (so callers may pass the
 * endpoints in either order), then the bounds are widened by 1ms to the day's
 * edges so the comparison is inclusive of both endpoints. Pure dayjs — no DOM.
 */
export function isInRange(
  date: DateStringValue,
  range: [DateStringValue, DateStringValue],
): boolean {
  const _range = [...range].sort((a, b) => (dayjs(a).isAfter(dayjs(b)) ? 1 : -1));
  return (
    dayjs(_range[0]).startOf("day").subtract(1, "ms").isBefore(date) &&
    dayjs(_range[1]).endOf("day").add(1, "ms").isAfter(date)
  );
}
