import dayjs from "dayjs";

import type { DatePickerType, DatePickerValue, DateStringValue } from "../../types";

interface DateFormatterInput {
  type: DatePickerType;
  date: DatePickerValue<DatePickerType>;
  locale: string;
  format: string;
  labelSeparator: string;
}

/** Formats a picker value into the string shown in an input. Override via `valueFormat`/`valueFormatter`. */
export type DateFormatter = (input: DateFormatterInput) => string;

/**
 * Default value formatter, honouring `type` (default/multiple/range), `locale`,
 * `format`, and `labelSeparator` — mirrors @mantine/dates. Ports its dayjs logic
 * directly.
 */
export function defaultDateFormatter({
  type,
  date,
  locale,
  format,
  labelSeparator,
}: DateFormatterInput): string {
  const formatDate = (value: DateStringValue | Date) => dayjs(value).locale(locale).format(format);

  if (type === "default") {
    return date === null ? "" : formatDate(date as DateStringValue);
  }

  if (type === "multiple") {
    return (date as DateStringValue[]).map(formatDate).join(", ");
  }

  if (type === "range" && Array.isArray(date)) {
    if (date[0] && date[1]) {
      return `${formatDate(date[0])} ${labelSeparator} ${formatDate(date[1])}`;
    }

    if (date[0]) {
      return `${formatDate(date[0])} ${labelSeparator} `;
    }

    return "";
  }

  return "";
}

interface GetFormattedDateInput extends DateFormatterInput {
  formatter?: DateFormatter;
}

/** Format a picker value, using `formatter` when provided or {@link defaultDateFormatter}. */
export function getFormattedDate({ formatter, ...others }: GetFormattedDateInput): string {
  return (formatter || defaultDateFormatter)(others);
}
