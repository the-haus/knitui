import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Pagination } from "./Pagination";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Navigation/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Pagination renders a row of page controls built from `Pagination.Root` + `Pagination.Items` + step/edge controls. Use the composite `<Pagination>` for the common case, or compose sub-components directly for custom layouts. `size` scales the control dimensions and typography. `withEdges` adds first/last jumps; `withControls` adds previous/next steps. `grouped` visually attaches every control into a single flush group (collapsed borders, only the outer corners rounded). Pass `value` + `onChange` for fully controlled behaviour.",
      },
    },
  },
  args: {
    total: 10,
    defaultValue: 1,
    size: "md",
    withControls: true,
    withEdges: false,
    withPages: true,
    grouped: false,
    disabled: false,
    hideWithOnePage: false,
    siblings: 1,
    boundaries: 1,
  },
  argTypes: {
    total: {
      control: { type: "number", min: 1, max: 50 },
      description: "Total number of pages.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls the dimensions of each page button.",
    },
    withControls: { control: "boolean", description: "Show previous / next step controls." },
    withEdges: { control: "boolean", description: "Show first / last edge controls." },
    withPages: { control: "boolean", description: "Show the numbered page controls." },
    grouped: {
      control: "boolean",
      description: "Attach all controls into a single flush group (collapsed borders).",
    },
    disabled: { control: "boolean", description: "Disable the entire pagination." },
    hideWithOnePage: { control: "boolean", description: "Hide entirely when total <= 1." },
    siblings: {
      control: { type: "number", min: 1, max: 5 },
      description: "Pages shown on each side of the active page.",
    },
    boundaries: {
      control: { type: "number", min: 1, max: 5 },
      description: "Pages always shown at the start and end.",
    },
    radius: { control: "text", description: "Border-radius token applied to each control." },
    onChange: { action: "onChange" },
    onNextPage: { action: "onNextPage" },
    onPreviousPage: { action: "onPreviousPage" },
    onFirstPage: { action: "onFirstPage" },
    onLastPage: { action: "onLastPage" },
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Pagination>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All seven sizes rendered side-by-side, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$lg">
      {SIZES.map((size) => (
        <Box key={size} flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
          <Text width="$xl" fontSize="$xs" color="$color11">
            {size}
          </Text>
          <Pagination {...args} size={size} total={7} defaultValue={3} />
        </Box>
      ))}
    </Box>
  ),
};

/** Each elevation of the inherited `shadow` prop applied to the pagination row. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$xl">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} flexDirection="row" gap="$md" alignItems="center">
          <Text width="$xl" fontSize="$xs" color="$color11">
            {shadow}
          </Text>
          <Pagination {...args} shadow={shadow} total={7} defaultValue={3} />
        </Box>
      ))}
    </Box>
  ),
};

/** Disabled state — all controls are dimmed and non-interactive. */
export const Disabled: Story = {
  args: { disabled: true, total: 10, defaultValue: 5 },
};

/** Edge controls (first / last) are shown alongside prev / next. */
export const WithEdges: Story = {
  args: { withEdges: true, total: 20, defaultValue: 10 },
};

/**
 * `grouped` attaches every control into a single flush group: gaps collapse,
 * adjacent borders merge into a shared 1px line, and only the outer corners stay
 * rounded — the same attached treatment as `Button.Group` / `ActionIcon.Group`.
 */
export const Grouped: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          Pages only
        </Text>
        <Pagination {...args} grouped total={10} defaultValue={4} />
      </Box>
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          With prev / next + first / last edges
        </Text>
        <Pagination {...args} grouped withEdges total={20} defaultValue={10} />
      </Box>
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          Grouped across sizes
        </Text>
        {SIZES.map((size) => (
          <Pagination key={size} {...args} grouped size={size} total={7} defaultValue={3} />
        ))}
      </Box>
    </Box>
  ),
};

/** Wider siblings and boundaries values reduce dots truncation. */
export const SiblingsAndBoundaries: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          siblings=1 boundaries=1 (default)
        </Text>
        <Pagination {...args} total={20} defaultValue={10} siblings={1} boundaries={1} />
      </Box>
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          siblings=2 boundaries=2
        </Text>
        <Pagination {...args} total={20} defaultValue={10} siblings={2} boundaries={2} />
      </Box>
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          siblings=3 boundaries=1
        </Text>
        <Pagination {...args} total={20} defaultValue={10} siblings={3} boundaries={1} />
      </Box>
    </Box>
  ),
};

/** Custom icons replace the default arrow glyphs on the step and edge controls. */
export const CustomIcons: Story = {
  args: {
    total: 10,
    defaultValue: 5,
    withEdges: true,
    previousIcon: <Text>←</Text>,
    nextIcon: <Text>→</Text>,
    firstIcon: <Text>⏮</Text>,
    lastIcon: <Text>⏭</Text>,
    dotsIcon: <Text>•••</Text>,
  },
};

/** Controlled — active page is owned by the parent component; current page is displayed. */
export const Controlled: Story = {
  render: (args) => {
    const [page, setPage] = React.useState(1);
    return (
      <Box gap="$md" alignItems="center">
        <Pagination {...args} total={10} value={page} onChange={setPage} />
        <Text fontSize="$sm" color="$color11">
          Active page: {page}
        </Text>
      </Box>
    );
  },
};

/** Compound API — build a custom layout using Pagination.Root and its sub-components directly. */
export const CompoundAPI: Story = {
  args: {
    size: "xs",
  },

  render: (args) => (
    <Box gap="$lg">
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          Only numbers (no step controls)
        </Text>
        <Pagination.Root {...args} total={5} defaultValue={2} size="md">
          <Pagination.Items />
        </Pagination.Root>
      </Box>

      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          Custom arrangement: First · Prev · Items · Next · Last
        </Text>
        <Pagination.Root {...args} total={8} defaultValue={4} size="md">
          <Pagination.First />
          <Pagination.Previous />
          <Pagination.Items />
          <Pagination.Next />
          <Pagination.Last />
        </Pagination.Root>
      </Box>

      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          Standalone controls with custom children
        </Text>
        <Pagination.Root total={5} defaultValue={1} size="md">
          <Pagination.Previous icon={<Text>⬅</Text>} />
          <Pagination.Items />
          <Pagination.Next icon={<Text>➡</Text>} />
        </Pagination.Root>
      </Box>
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `item` page controls and the `control` step controls. */
export const Styles: Story = {
  args: {
    total: 10,
    defaultValue: 5,
    withEdges: true,
    styles: {
      item: { borderColor: "$blue7", borderWidth: 2 },
      control: { backgroundColor: "$blue3" },
      dots: { backgroundColor: "$yellow3" },
    },
  },
};
