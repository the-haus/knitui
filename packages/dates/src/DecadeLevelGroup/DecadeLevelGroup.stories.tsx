import type { Meta, StoryObj } from "@storybook/react-vite";

import { DecadeLevelGroup } from "./DecadeLevelGroup";

const meta = {
  title: "Dates/DecadeLevelGroup",
  component: DecadeLevelGroup,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`DecadeLevelGroup` renders `numberOfColumns` `DecadeLevel` panels side by side inside a `LevelsGroup`, stepping ten years (one decade) per column over a year grid. It is the decade analogue of `YearLevelGroup`/`MonthLevelGroup` and the top calendar level (no zoom-out). Only the edge panels show navigation controls: `withPrevious` on the first, `withNext` on the last. It owns no cells of its own — sizing, colors and interaction live downstream in `DecadeLevel`/`YearsList`; per-year customization flows through the `getYearControlProps` callback.",
      },
    },
  },
  args: {
    decade: "2024-03-15",
  },
} satisfies Meta<typeof DecadeLevelGroup>;

export default meta;

type Story = StoryObj<typeof DecadeLevelGroup>;

/** A single decade panel (the default). */
export const Default: Story = {};

/** Two decades side by side — ten years apart, edge-only navigation controls. */
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

/**
 * Bounded by `minDate`/`maxDate`: the previous/next controls disable at the
 * bounds and out-of-range year cells are disabled (delegated to `YearsList`).
 */
export const Bounded: Story = {
  args: {
    minDate: "2020-01-01",
    maxDate: "2027-12-31",
  },
};

/**
 * Per-year customization via `getYearControlProps` — the "explicit per-item beats
 * sugar" callback (#7), forwarded to every panel. Here it disables the year 2025.
 */
export const PerYearProps: Story = {
  args: {
    getYearControlProps: (date) => ({
      disabled: date.startsWith("2025"),
    }),
  },
};
