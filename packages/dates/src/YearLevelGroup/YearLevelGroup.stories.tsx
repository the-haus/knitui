import type { Meta, StoryObj } from "@storybook/react-vite";

import { YearLevelGroup } from "./YearLevelGroup";

const meta = {
  title: "Dates/YearLevelGroup",
  component: YearLevelGroup,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`YearLevelGroup` renders `numberOfColumns` `YearLevel` panels side by side inside a `LevelsGroup`, stepping one year per column over a month grid. It is the month-grid analogue of `MonthLevelGroup`/`DecadeLevelGroup` and wires cross-platform arrow-key roving focus across every panel. Only the edge panels show navigation controls: `withPrevious` on the first, `withNext` on the last. It owns no cells of its own — sizing, colors and interaction live downstream in `YearLevel`/`MonthsList`/`PickerControl`; per-month customization flows through the `getMonthControlProps` callback.",
      },
    },
  },
  args: {
    year: "2024-03-15",
  },
} satisfies Meta<typeof YearLevelGroup>;

export default meta;

type Story = StoryObj<typeof YearLevelGroup>;

/** A single year panel (the default). */
export const Default: Story = {};

/** Two years side by side — one year apart, edge-only navigation controls. */
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

/** A custom year label format via dayjs tokens. */
export const CustomLabelFormat: Story = {
  args: { yearLabelFormat: "YY" },
};

/**
 * Bounded by `minDate`/`maxDate`: the previous/next controls disable at the
 * bounds and out-of-range month cells are disabled (delegated to `MonthsList`).
 */
export const Bounded: Story = {
  args: {
    minDate: "2024-03-01",
    maxDate: "2024-09-30",
  },
};

/**
 * Per-month customization via `getMonthControlProps` — the "explicit per-item
 * beats sugar" callback (#7), forwarded to every panel. Here it disables June.
 */
export const PerMonthProps: Story = {
  args: {
    getMonthControlProps: (date) => ({
      disabled: date.startsWith("2024-06"),
    }),
  },
};
