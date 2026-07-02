import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { Group } from "./Group";

const meta = {
  title: "Layout/Group",
  component: Group,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Group is a horizontal flex container that mirrors Mantine's `Group`. " +
          "`gap`, `align`, `justify`, and `wrap` map Mantine names to flexbox " +
          "style props. `grow` distributes available space equally across children; " +
          "`preventGrowOverflow` (default `true`) caps each child to an equal fraction.",
      },
    },
  },
  args: {
    gap: "$md",
    align: "center",
    justify: "flex-start",
    wrap: "wrap",
    grow: false,
    preventGrowOverflow: true,
  },
  argTypes: {
    gap: {
      control: "select",
      options: ["$xs", "$sm", "$md", "$lg", "$xl"],
      description: "Space between children — a Tamagui spacing token.",
    },
    align: {
      control: "select",
      options: ["flex-start", "center", "flex-end", "stretch", "baseline"],
      description: "Cross-axis alignment (`alignItems`).",
    },
    justify: {
      control: "select",
      options: [
        "flex-start",
        "center",
        "flex-end",
        "space-between",
        "space-around",
        "space-evenly",
      ],
      description: "Main-axis alignment (`justifyContent`).",
    },
    wrap: {
      control: "select",
      options: ["wrap", "nowrap", "wrap-reverse"],
      description: "Whether children wrap to the next line.",
    },
    grow: { control: "boolean", description: "Each child grows to fill the row equally." },
    preventGrowOverflow: {
      control: "boolean",
      description: "Cap each grown child to an equal fraction of the row width.",
    },
  },
} satisfies Meta<typeof Group>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Group>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Group {...args}>
      <Button variant="default">First</Button>
      <Button variant="default">Second</Button>
      <Button variant="default">Third</Button>
    </Group>
  ),
};

/** Default horizontal layout with the standard gap between items. */
export const Default: Story = {
  render: (args) => (
    <Group {...args}>
      <Button variant="filled">Save</Button>
      <Button variant="light">Cancel</Button>
      <Button variant="subtle">Reset</Button>
    </Group>
  ),
};

/** All `justify` values side by side — shows how main-axis alignment behaves. */
export const JustifyVariants: Story = {
  render: (args) => (
    <Box gap="$lg" width={500}>
      {(["flex-start", "center", "flex-end", "space-between", "space-around"] as const).map(
        (justify) => (
          <Box key={justify} gap="$xs">
            <Text fontSize="$sm" color="$colorSubtitle">
              {justify}
            </Text>
            <Box borderWidth={1} borderColor="$borderColor" borderRadius="$sm" padding="$sm">
              <Group {...args} justify={justify} wrap="nowrap">
                <Button variant="default" size="sm">
                  Alpha
                </Button>
                <Button variant="default" size="sm">
                  Beta
                </Button>
                <Button variant="default" size="sm">
                  Gamma
                </Button>
              </Group>
            </Box>
          </Box>
        ),
      )}
    </Box>
  ),
};

/** `grow` makes every child share the row equally — useful for full-width button rows. */
export const Grow: Story = {
  render: (args) => (
    <Box gap="$lg" width={480}>
      <Box gap="$xs">
        <Text fontSize="$sm" color="$colorSubtitle">
          grow (default preventGrowOverflow)
        </Text>
        <Group {...args} grow>
          <Button variant="filled">Accept</Button>
          <Button variant="light">Decline</Button>
          <Button variant="subtle">Skip</Button>
        </Group>
      </Box>

      <Box gap="$xs">
        <Text fontSize="$sm" color="$colorSubtitle">
          grow + preventGrowOverflow=false
        </Text>
        <Group {...args} grow preventGrowOverflow={false}>
          <Button variant="filled">Short</Button>
          <Button variant="light">A much longer label here</Button>
          <Button variant="subtle">Ok</Button>
        </Group>
      </Box>
    </Box>
  ),
};

/** Mixed content types — icons, text badges and buttons can share a Group row. */
export const MixedContent: Story = {
  render: (args) => (
    <Group {...args} align="center">
      <Text fontSize="$xl">⭐</Text>
      <Text fontWeight="bold">Featured</Text>
      <Button variant="light" size="sm">
        View details
      </Button>
      <Button variant="outline" size="sm">
        Share
      </Button>
    </Group>
  ),
};

/** `wrap="nowrap"` keeps children on a single line even when space is tight. */
export const NoWrap: Story = {
  render: (args) => (
    <Box width={320} borderWidth={1} borderColor="$borderColor" padding="$sm" borderRadius="$sm">
      <Group {...args} wrap="nowrap" gap="$sm">
        <Button variant="default">Action 1</Button>
        <Button variant="default">Action 2</Button>
        <Button variant="default">Action 3</Button>
        <Button variant="default">Action 4</Button>
      </Group>
    </Box>
  ),
};

/** Different gap sizes — from tight `$xs` to spacious `$xl`. */
export const GapSizes: Story = {
  render: (args) => (
    <Box gap="$lg">
      {(["$xs", "$sm", "$md", "$lg", "$xl"] as const).map((gap) => (
        <Box key={gap} flexDirection="row" alignItems="center" gap="$md">
          <Text fontSize="$sm" color="$colorSubtitle" width={30}>
            {gap}
          </Text>
          <Group {...args} gap={gap}>
            <Button variant="default" size="sm">
              One
            </Button>
            <Button variant="default" size="sm">
              Two
            </Button>
            <Button variant="default" size="sm">
              Three
            </Button>
          </Group>
        </Box>
      ))}
    </Box>
  ),
};
