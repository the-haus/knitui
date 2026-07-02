import type { Meta, StoryObj } from "@storybook/react-vite";

import { MonthLevelGroup } from "./MonthLevelGroup";

const meta = {
  title: "Dates/MonthLevelGroup",
  component: MonthLevelGroup,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`MonthLevelGroup` renders `numberOfColumns` `MonthLevel` panels side by side inside a `LevelsGroup`, stepping one month per column over a day grid. It is the day-grid analogue of `YearLevelGroup`/`DecadeLevelGroup` and wires cross-platform arrow-key roving focus across every panel. Only the edge panels show navigation controls: `withPrevious` on the first, `withNext` on the last. It owns no cells of its own — sizing, colors and interaction live downstream in `MonthLevel`/`Month`/`Day`; per-day customization flows through the `getDayProps` callback.",
      },
    },
  },
  args: {
    month: "2024-03-15",
  },
} satisfies Meta<typeof MonthLevelGroup>;

export default meta;

type Story = StoryObj<typeof MonthLevelGroup>;

/** A single month panel (the default). */
export const Default: Story = {};

/** Two months side by side — one month apart, edge-only navigation controls. */
export const TwoColumns: Story = {
  args: { numberOfColumns: 2 },
};

/** Larger cells via the shared `size` ladder. */
export const Large: Story = {
  args: { size: "lg" },
};

/** Stretched to the full width of its container. */
export const FullWidth: Story = {
  args: { fullWidth: true },
};

/** A custom month label format via dayjs tokens. */
export const CustomLabelFormat: Story = {
  args: { monthLabelFormat: "MM/YYYY" },
};

/**
 * Bounded by `minDate`/`maxDate`: the previous/next controls disable at the
 * bounds and out-of-range day cells are disabled (delegated to `Month`/`Day`).
 */
export const Bounded: Story = {
  args: {
    minDate: "2024-03-05",
    maxDate: "2024-03-25",
  },
};

/**
 * Per-day customization via `getDayProps` — the "explicit per-item beats sugar"
 * callback (#7), forwarded to every panel. Here it disables the 15th.
 */
export const PerDayProps: Story = {
  args: {
    getDayProps: (date) => ({
      disabled: date.endsWith("-15"),
    }),
  },
};

/** Static (non-interactive) display cells via the `static` prop. */
export const Static: Story = {
  args: { static: true },
};
