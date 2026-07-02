import type { Meta, StoryObj } from "@storybook/react-vite";

import { MonthLevel } from "../MonthLevel";
import { LevelsGroup } from "./LevelsGroup";

const meta = {
  title: "Dates/LevelsGroup",
  component: LevelsGroup,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          '`LevelsGroup` is the side-by-side column FRAME that holds `numberOfColumns` calendar levels — the flex-row layout that `MonthLevelGroup`/`YearLevelGroup`/`DecadeLevelGroup` each wrap. It is a pure layout wrapper around `role="grid"` levels (it carries no role of its own; callers pass `role="group"`), owns no cells, and forwards its ref + style props to the root, exposed as `LevelsGroup.Frame`. The `fullWidth` variant stretches each column to an equal share of the container; `size` is a parity passthrough.',
      },
    },
  },
} satisfies Meta<typeof LevelsGroup>;

export default meta;

type Story = StoryObj<typeof LevelsGroup>;

/** Two month levels laid side by side — the default column layout. */
export const Default: Story = {
  render: (args) => (
    <LevelsGroup {...args}>
      <MonthLevel month="2024-01-01" />
      <MonthLevel month="2024-02-01" />
    </LevelsGroup>
  ),
};

/** A single child renders without issue (one column). */
export const SingleColumn: Story = {
  render: (args) => (
    <LevelsGroup {...args}>
      <MonthLevel month="2024-01-01" />
    </LevelsGroup>
  ),
};

/** Three columns side by side (the `numberOfColumns` parity case from the groups). */
export const ThreeColumns: Story = {
  render: (args) => (
    <LevelsGroup {...args}>
      <MonthLevel month="2024-01-01" />
      <MonthLevel month="2024-02-01" />
      <MonthLevel month="2024-03-01" />
    </LevelsGroup>
  ),
};

/** Stretched to the full width of its container (`fullWidth` maps `data-full-width`). */
export const FullWidth: Story = {
  args: { fullWidth: true },
  render: (args) => (
    <LevelsGroup {...args}>
      <MonthLevel month="2024-01-01" />
      <MonthLevel month="2024-02-01" />
    </LevelsGroup>
  ),
};
