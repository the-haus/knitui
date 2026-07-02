import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Grid } from "./Grid";

const GUTTERS = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

/** Shared cell helper — gives each column a visible background so the layout is obvious. */
function Cell({ children, color = "$color5" }: { children: React.ReactNode; color?: string }) {
  return (
    <Box background={color} padding="$md" borderRadius="$sm">
      <Text textAlign="center" fontSize="$xs" fontWeight="600">
        {children}
      </Text>
    </Box>
  );
}

const meta = {
  title: "Layout/Grid",
  component: Grid,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Grid is a 12-column flex-wrap grid that mirrors Mantine's `Grid` + `Grid.Col`. Columns size to `span / columns` as a percentage; `gutter` controls the track gap. Compose `Grid` > `Grid.Col` — each col accepts `span`, `offset`, `order`, and `align` (vertical self-alignment). Responsive per-breakpoint span objects are deferred by design.",
      },
    },
  },
  args: {
    columns: 12,
    gutter: "md",
    grow: false,
  },
  argTypes: {
    columns: {
      control: { type: "number", min: 1, max: 24, step: 1 },
      description: "Total columns the grid is divided into.",
    },
    gutter: {
      control: "inline-radio",
      options: GUTTERS,
      description: "Space between columns — a space key (xxs–xxl), `$space` token, or px number.",
    },
    grow: {
      control: "boolean",
      description: "Let columns grow to fill the last row.",
    },
    align: {
      control: "select",
      options: ["flex-start", "flex-end", "center", "stretch", "baseline"],
      description: "Cross-axis (vertical) alignment of all columns in a row.",
    },
    justify: {
      control: "select",
      options: ["flex-start", "flex-end", "center", "space-between", "space-around"],
      description: "Main-axis (horizontal) justification of columns within a row.",
    },
  },
  decorators: [
    (Story) => (
      <Box width="100%" maxWidth={800}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Grid>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Grid {...args}>
      <Grid.Col span={4}>
        <Cell>4</Cell>
      </Grid.Col>
      <Grid.Col span={4}>
        <Cell>4</Cell>
      </Grid.Col>
      <Grid.Col span={4}>
        <Cell>4</Cell>
      </Grid.Col>
      <Grid.Col span={6}>
        <Cell>6</Cell>
      </Grid.Col>
      <Grid.Col span={6}>
        <Cell>6</Cell>
      </Grid.Col>
      <Grid.Col span={12}>
        <Cell>12</Cell>
      </Grid.Col>
    </Grid>
  ),
};

/** Classic 12-column span combinations: 12, 6+6, 4+4+4, 3+3+3+3. */
export const BasicSpans: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Grid {...args}>
        <Grid.Col span={12}>
          <Cell>12</Cell>
        </Grid.Col>
      </Grid>
      <Grid {...args}>
        <Grid.Col span={6}>
          <Cell>6</Cell>
        </Grid.Col>
        <Grid.Col span={6}>
          <Cell>6</Cell>
        </Grid.Col>
      </Grid>
      <Grid {...args}>
        <Grid.Col span={4}>
          <Cell>4</Cell>
        </Grid.Col>
        <Grid.Col span={4}>
          <Cell>4</Cell>
        </Grid.Col>
        <Grid.Col span={4}>
          <Cell>4</Cell>
        </Grid.Col>
      </Grid>
      <Grid {...args}>
        <Grid.Col span={3}>
          <Cell>3</Cell>
        </Grid.Col>
        <Grid.Col span={3}>
          <Cell>3</Cell>
        </Grid.Col>
        <Grid.Col span={3}>
          <Cell>3</Cell>
        </Grid.Col>
        <Grid.Col span={3}>
          <Cell>3</Cell>
        </Grid.Col>
      </Grid>
    </Box>
  ),
};

/** All gutter sizes from xxs to xxl, keeping the column layout identical. */
export const Gutters: Story = {
  render: () => (
    <Box gap="$xl">
      {GUTTERS.map((gutter) => (
        <Box key={gutter} gap="$xs">
          <Text fontSize="$xs" color="$color11" marginBottom="$xs">
            gutter="{gutter}"
          </Text>
          <Grid gutter={gutter}>
            <Grid.Col span={4}>
              <Cell>{gutter}</Cell>
            </Grid.Col>
            <Grid.Col span={4}>
              <Cell>{gutter}</Cell>
            </Grid.Col>
            <Grid.Col span={4}>
              <Cell>{gutter}</Cell>
            </Grid.Col>
          </Grid>
        </Box>
      ))}
    </Box>
  ),
};

/** `span="auto"` fills remaining row space; `span="content"` shrinks to fit content. */
export const AutoAndContentSpan: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Text fontSize="$xs" color="$color11">
        Fixed 3 + auto fills rest
      </Text>
      <Grid {...args}>
        <Grid.Col span={3}>
          <Cell>3</Cell>
        </Grid.Col>
        <Grid.Col span="auto">
          <Cell>auto</Cell>
        </Grid.Col>
        <Grid.Col span={3}>
          <Cell>3</Cell>
        </Grid.Col>
      </Grid>

      <Text fontSize="$xs" color="$color11">
        Content-sized + auto fills rest
      </Text>
      <Grid {...args}>
        <Grid.Col span="content">
          <Cell>⭐ content</Cell>
        </Grid.Col>
        <Grid.Col span="auto">
          <Cell>auto</Cell>
        </Grid.Col>
        <Grid.Col span="content">
          <Cell>⭐ content</Cell>
        </Grid.Col>
      </Grid>
    </Box>
  ),
};

/** `offset` pushes a column right by N columns without occupying the space. */
export const ColumnOffset: Story = {
  render: (args) => (
    <Box gap="$md">
      <Grid {...args}>
        <Grid.Col span={6}>
          <Cell>span 6, no offset</Cell>
        </Grid.Col>
      </Grid>
      <Grid {...args}>
        <Grid.Col span={6} offset={3}>
          <Cell>span 6, offset 3</Cell>
        </Grid.Col>
      </Grid>
      <Grid {...args}>
        <Grid.Col span={4} offset={4}>
          <Cell>span 4, offset 4</Cell>
        </Grid.Col>
      </Grid>
      <Grid {...args}>
        <Grid.Col span={3}>
          <Cell>3</Cell>
        </Grid.Col>
        <Grid.Col span={3} offset={3}>
          <Cell>3, offset 3</Cell>
        </Grid.Col>
      </Grid>
    </Box>
  ),
};

/** `grow` lets shorter last-row columns expand to fill the track. */
export const GrowColumns: Story = {
  args: { grow: true },
  render: (args) => (
    <Box gap="$lg">
      <Text fontSize="$xs" color="$color11">
        grow=true — last row fills the track
      </Text>
      <Grid {...args}>
        <Grid.Col span={4}>
          <Cell>4</Cell>
        </Grid.Col>
        <Grid.Col span={4}>
          <Cell>4</Cell>
        </Grid.Col>
        <Grid.Col span={4}>
          <Cell>4</Cell>
        </Grid.Col>
        <Grid.Col span={4}>
          <Cell>4 (grows)</Cell>
        </Grid.Col>
      </Grid>

      <Text fontSize="$xs" color="$color11">
        grow=false — last row stays natural width
      </Text>
      <Grid {...args} grow={false}>
        <Grid.Col span={4}>
          <Cell>4</Cell>
        </Grid.Col>
        <Grid.Col span={4}>
          <Cell>4</Cell>
        </Grid.Col>
        <Grid.Col span={4}>
          <Cell>4</Cell>
        </Grid.Col>
        <Grid.Col span={4}>
          <Cell>4 (natural)</Cell>
        </Grid.Col>
      </Grid>
    </Box>
  ),
};

/** `Grid.Col align` controls vertical self-alignment within a mixed-height row. */
export const ColumnAlignment: Story = {
  render: (args) => (
    <Grid {...args}>
      <Grid.Col span={3} align="flex-start">
        <Cell>flex-start</Cell>
      </Grid.Col>
      <Grid.Col span={3} align="center">
        <Cell>center</Cell>
      </Grid.Col>
      <Grid.Col span={3} align="flex-end">
        <Cell>flex-end</Cell>
      </Grid.Col>
      <Grid.Col span={3} align="stretch">
        <Box backgroundColor="$color3" padding="$xl" borderRadius="$sm" height="100%">
          <Text textAlign="center" fontSize="$xs" fontWeight="600">
            stretch (tall)
          </Text>
        </Box>
      </Grid.Col>
    </Grid>
  ),
};

/** Custom `columns` count — a 24-column grid allows finer-grained layouts. */
export const CustomColumnCount: Story = {
  args: { columns: 24 },
  render: (args) => (
    <Box gap="$md">
      <Text fontSize="$xs" color="$color11">
        columns=24 — finer-grained layout
      </Text>
      <Grid {...args}>
        <Grid.Col span={6}>
          <Cell>6/24</Cell>
        </Grid.Col>
        <Grid.Col span={12}>
          <Cell>12/24</Cell>
        </Grid.Col>
        <Grid.Col span={6}>
          <Cell>6/24</Cell>
        </Grid.Col>
      </Grid>
      <Grid {...args}>
        <Grid.Col span={8}>
          <Cell>8/24</Cell>
        </Grid.Col>
        <Grid.Col span={8}>
          <Cell>8/24</Cell>
        </Grid.Col>
        <Grid.Col span={8}>
          <Cell>8/24</Cell>
        </Grid.Col>
      </Grid>
    </Box>
  ),
};
