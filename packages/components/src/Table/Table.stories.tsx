import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Table } from "./Table";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Data Display/Table",
  component: Table,
  parameters: {
    docs: {
      description: {
        component:
          "Table is a compound component that renders structured data. Use the `data` prop for a quick data-driven table, or compose `Table.Thead`, `Table.Tbody`, `Table.Tfoot`, `Table.Tr`, `Table.Th`, `Table.Td`, and `Table.Caption` for full control. Boolean flags `withTableBorder`, `withColumnBorders`, `withRowBorders`, `striped`, and `highlightOnHover` toggle common visual treatments. Cell padding is tuned via `horizontalSpacing` and `verticalSpacing`.",
      },
    },
  },
  args: {
    withTableBorder: false,
    withColumnBorders: false,
    withRowBorders: true,
    striped: false,
    highlightOnHover: false,
    horizontalSpacing: "xs",
    verticalSpacing: "xs",
    captionSide: "bottom",
  },
  argTypes: {
    withTableBorder: { control: "boolean", description: "Draws a border around the outer table." },
    withColumnBorders: { control: "boolean", description: "Draws borders between columns." },
    withRowBorders: { control: "boolean", description: "Draws borders between rows." },
    striped: {
      control: "select",
      options: [false, true, "odd", "even"],
      description: 'Stripe rows. `true` is equivalent to `"odd"`.',
    },
    highlightOnHover: { control: "boolean", description: "Highlights the row under the pointer." },
    horizontalSpacing: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Horizontal cell padding — token name or number.",
    },
    verticalSpacing: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Vertical cell padding — token name or number.",
    },
    captionSide: {
      control: "inline-radio",
      options: ["top", "bottom"],
      description: "Placement of the caption.",
    },
    shadow: {
      control: "select",
      options: [undefined, ...SHADOWS],
      description: "Elevation — drop shadow from the shared ladder.",
    },
    data: { control: false },
  },
  decorators: [
    (Story) => (
      <Box width={560}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Table>>;

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

const COUNTRIES = [
  { country: "Germany", capital: "Berlin", population: "83 m" },
  { country: "France", capital: "Paris", population: "68 m" },
  { country: "Japan", capital: "Tokyo", population: "125 m" },
  { country: "Brazil", capital: "Brasília", population: "215 m" },
];

/** Reusable compound markup used across multiple stories. */
function SampleTable(props: React.ComponentProps<typeof Table>) {
  return (
    <Table {...props}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Country</Table.Th>
          <Table.Th>Capital</Table.Th>
          <Table.Th>Population</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {COUNTRIES.map((row) => (
          <Table.Tr key={row.country}>
            <Table.Td>{row.country}</Table.Td>
            <Table.Td>{row.capital}</Table.Td>
            <Table.Td>{row.population}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
      <Table.Tfoot>
        <Table.Tr>
          <Table.Th>Country</Table.Th>
          <Table.Th>Capital</Table.Th>
          <Table.Th>Population</Table.Th>
        </Table.Tr>
      </Table.Tfoot>
    </Table>
  );
}

/* -------------------------------------------------------------------------- */
/* Stories                                                                     */
/* -------------------------------------------------------------------------- */

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => <SampleTable {...args} />,
};

/** Compound API — `Table.Thead`, `Table.Tbody`, `Table.Tfoot`, `Table.Tr`, `Table.Th`, `Table.Td`. */
export const CompoundAPI: Story = {
  render: (args) => <SampleTable {...args} />,
};

/** Data-driven shorthand via the `data` prop — no JSX children required. */
export const DataProp: Story = {
  render: (args) => (
    <Table
      {...args}
      data={{
        caption: "Selected world capitals",
        head: ["Country", "Capital", "Population"],
        body: COUNTRIES.map((r) => [r.country, r.capital, r.population]),
        foot: ["Country", "Capital", "Population"],
      }}
    />
  ),
};

/** Outer table border, column borders, and row borders all enabled together. */
export const AllBorders: Story = {
  args: {
    withTableBorder: true,
    withColumnBorders: true,
    withRowBorders: true,
  },
  render: (args) => <SampleTable {...args} />,
};

/** Alternating row background — `striped="odd"` shades the first, third… rows. */
export const Striped: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Text fontWeight="700" fontSize="$sm" color="$color11">
        odd (default)
      </Text>
      <SampleTable {...args} striped="odd" withTableBorder />
      <Text fontWeight="700" fontSize="$sm" color="$color11">
        even
      </Text>
      <SampleTable {...args} striped="even" withTableBorder />
    </Box>
  ),
};

/** Rows highlight on pointer hover — useful for large scannable tables. */
export const HighlightOnHover: Story = {
  args: { highlightOnHover: true, withTableBorder: true },
  render: (args) => <SampleTable {...args} />,
};

/** Caption placed above the table via `captionSide="top"`. */
export const CaptionTop: Story = {
  args: { captionSide: "top" },
  render: (args) => (
    <Table {...args}>
      <Table.Caption>World capitals — caption at the top</Table.Caption>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Country</Table.Th>
          <Table.Th>Capital</Table.Th>
          <Table.Th>Population</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {COUNTRIES.map((row) => (
          <Table.Tr key={row.country}>
            <Table.Td>{row.country}</Table.Td>
            <Table.Td>{row.capital}</Table.Td>
            <Table.Td>{row.population}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  ),
};

/** Custom spacing — wider horizontal padding and taller rows for a spacious layout. */
export const CustomSpacing: Story = {
  args: { horizontalSpacing: "lg", verticalSpacing: "md", withTableBorder: true },
  render: (args) => <SampleTable {...args} />,
};

/** Per-slot `styles` targets individual parts — here the `th`, `td` and `table`. */
export const Styles: Story = {
  args: {
    withTableBorder: true,
    styles: {
      table: { borderColor: "$blue7", borderWidth: 2 },
      th: { color: "$red9", fontWeight: "700" },
      td: { color: "$blue9" },
    },
  },
  render: (args) => (
    <Table
      {...args}
      data={{
        head: ["Country", "Capital", "Population"],
        body: COUNTRIES.map((r) => [r.country, r.capital, r.population]),
      }}
    />
  ),
};

/** The five shadow levels from the shared elevation ladder, mapped over the scale. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$xl">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs">
          <Text fontWeight="700" fontSize="$sm" color="$color11">
            {shadow}
          </Text>
          <SampleTable {...args} shadow={shadow} withTableBorder />
        </Box>
      ))}
    </Box>
  ),
};

/** All decorative features combined: outer border, column borders, striping, and hover. */
export const FullyDecorated: Story = {
  args: {
    withTableBorder: true,
    withColumnBorders: true,
    withRowBorders: true,
    striped: true,
    highlightOnHover: true,
    horizontalSpacing: "md",
    verticalSpacing: "xs",
  },
  render: (args) => (
    <Table {...args}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            <Text>⭐</Text> Country
          </Table.Th>
          <Table.Th>Capital</Table.Th>
          <Table.Th>Population</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {COUNTRIES.map((row) => (
          <Table.Tr key={row.country}>
            <Table.Td>{row.country}</Table.Td>
            <Table.Td>{row.capital}</Table.Td>
            <Table.Td>{row.population}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
      <Table.Caption>Hover a row — it highlights.</Table.Caption>
    </Table>
  ),
};
