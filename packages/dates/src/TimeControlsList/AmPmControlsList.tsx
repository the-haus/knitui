import { Box } from "@knitui/components";

import { type CalendarSize } from "../cell-metrics";
import type { TimePickerAmPmLabels } from "../types";
import { TimeControl } from "./TimeControl";

/** Props for {@link AmPmControlsList}. */
export interface AmPmControlsListProps {
  /** Currently selected am/pm label, or `null`. */
  value: string | null;

  /** Called with the pressed label. */
  onSelect: (value: string) => void;

  /** Localized am/pm labels. */
  labels: TimePickerAmPmLabels;

  /** Label font size. @default 'sm' */
  size?: CalendarSize;
}

/**
 * `AmPmControlsList` — the two-cell am/pm variant of {@link TimeControlsList}
 * shown in the `12h` `TimePicker` dropdown. The `any`-free, cross-platform port
 * of Mantine's `AmPmControlsList`. Folder-local to the `TimePicker` dropdown.
 */
export function AmPmControlsList({ labels, value, onSelect, size = "sm" }: AmPmControlsListProps) {
  return (
    <Box gap={2} paddingHorizontal={2}>
      {[labels.am, labels.pm].map((control) => (
        <TimeControl
          key={control}
          value={control}
          active={value === control}
          onSelect={onSelect}
          size={size}
        />
      ))}
    </Box>
  );
}

AmPmControlsList.displayName = "@knitui/dates/AmPmControlsList";
