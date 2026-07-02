import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { SimpleGrid } from "./SimpleGrid";

/** Helper that renders a visually distinct grid cell so the layout is easy to see. */
const Cell = ({ label }: { label: string }) => (
  <Box
    backgroundColor="$color4"
    borderRadius="$sm"
    padding="$md"
    alignItems="center"
    justifyContent="center"
    minHeight="$xxl"
  >
    <Text fontWeight="600">{label}</Text>
  </Box>
);

const meta = {
  title: "Layout/SimpleGrid",
  component: SimpleGrid,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "SimpleGrid renders equal-width columns using a flex-wrap row layout. " +
          "Use `cols` for a fixed column count or `minColWidth` for auto-fill behaviour. " +
          "Gap between cells is controlled by `spacing` (columns) and `verticalSpacing` (rows).",
      },
    },
  },
  args: {
    cols: 3,
    spacing: "md",
  },
  argTypes: {
    cols: {
      control: { type: "number", min: 1, max: 12, step: 1 },
      description: "Number of equal columns (ignored when `minColWidth` is set).",
    },
    spacing: {
      control: "inline-radio",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Gap between columns — space key, `$space` token, or raw px number.",
    },
    verticalSpacing: {
      control: "inline-radio",
      options: [undefined, "xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Gap between rows; falls back to `spacing` when unset.",
    },
    minColWidth: {
      control: { type: "number", min: 60, max: 400, step: 10 },
      description: "Minimum column width in px. When set, `cols` is ignored and columns auto-fill.",
    },
    autoFlow: {
      control: "inline-radio",
      options: ["auto-fill", "auto-fit"],
      description: "Fill behaviour for `minColWidth` mode.",
    },
  },
} satisfies Meta<typeof SimpleGrid>;

export default meta;

type Story = StoryObj<ComponentProps<typeof SimpleGrid>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <SimpleGrid {...args}>
      <Cell label="Cell 1" />
      <Cell label="Cell 2" />
      <Cell label="Cell 3" />
      <Cell label="Cell 4" />
      <Cell label="Cell 5" />
      <Cell label="Cell 6" />
    </SimpleGrid>
  ),
};

/** Fixed column count — two, three and four columns, each wrapping six cells. */
export const ColumnCounts: Story = {
  render: () => (
    <Box gap="$xl">
      {([2, 3, 4] as const).map((cols) => (
        <Box key={cols} gap="$sm">
          <Text fontWeight="700">{cols} columns</Text>
          <SimpleGrid cols={cols} spacing="md">
            {Array.from({ length: 6 }, (_, i) => (
              <Cell key={i} label={`${cols}col · ${i + 1}`} />
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </Box>
  ),
};

/** Spacing scale — all seven space keys applied to the same 3-column grid. */
export const SpacingScale: Story = {
  render: () => (
    <Box gap="$xl">
      {(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const).map((spacing) => (
        <Box key={spacing} gap="$sm">
          <Text fontWeight="700">spacing="{spacing}"</Text>
          <SimpleGrid cols={3} spacing={spacing}>
            <Cell label="A" />
            <Cell label="B" />
            <Cell label="C" />
          </SimpleGrid>
        </Box>
      ))}
    </Box>
  ),
};

/** Independent vertical spacing — rows use "xl" while columns stay at "sm". */
export const AsymmetricSpacing: Story = {
  args: {
    cols: 3,
    spacing: "sm",
    verticalSpacing: "xl",
  },
  render: (args) => (
    <SimpleGrid {...args}>
      {Array.from({ length: 6 }, (_, i) => (
        <Cell key={i} label={`Cell ${i + 1}`} />
      ))}
    </SimpleGrid>
  ),
};

/** minColWidth mode — columns auto-fill at ≥ 160 px; resize the canvas to see them reflow. */
export const MinColWidth: Story = {
  args: {
    cols: undefined,
    minColWidth: 160,
    spacing: "md",
  },
  render: (args) => (
    <SimpleGrid {...args}>
      {Array.from({ length: 8 }, (_, i) => (
        <Cell key={i} label={`Item ${i + 1}`} />
      ))}
    </SimpleGrid>
  ),
};

/** auto-fit vs auto-fill — auto-fit stretches the last row to fill; auto-fill leaves gaps. */
export const AutoFitVsFill: Story = {
  render: () => (
    <Box gap="$xl">
      {(["auto-fit", "auto-fill"] as const).map((autoFlow) => (
        <Box key={autoFlow} gap="$sm">
          <Text fontWeight="700">autoFlow="{autoFlow}"</Text>
          <SimpleGrid minColWidth={160} autoFlow={autoFlow} spacing="md">
            <Cell label="1" />
            <Cell label="2" />
            <Cell label="3" />
          </SimpleGrid>
        </Box>
      ))}
    </Box>
  ),
};

/** Renders correctly with no children — the grid frame is present but empty. */
export const Empty: Story = {
  args: {
    cols: 3,
  },
  render: (args) => (
    <Box
      borderWidth={1}
      borderColor="$borderColor"
      borderStyle="dashed"
      borderRadius="$sm"
      padding="$md"
    >
      <SimpleGrid {...args} />
      <Text color="$color9" fontSize="$sm" marginTop="$sm">
        (empty grid — no children)
      </Text>
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `cell` wrapper around each child. */
export const Styles: Story = {
  args: {
    cols: 3,
    styles: {
      cell: { backgroundColor: "$blue3", borderRadius: "$sm" },
    },
  },
  render: (args) => (
    <SimpleGrid {...args}>
      {Array.from({ length: 6 }, (_, i) => (
        <Cell key={i} label={`Cell ${i + 1}`} />
      ))}
    </SimpleGrid>
  ),
};
