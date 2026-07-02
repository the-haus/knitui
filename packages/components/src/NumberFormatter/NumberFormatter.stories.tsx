import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { NumberFormatter } from "./NumberFormatter";

const meta = {
  title: "Typography/NumberFormatter",
  component: NumberFormatter,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`NumberFormatter` is a pure display component that formats a number with thousands separators, decimal rounding, and optional prefix/suffix. It mirrors the Mantine `NumberFormatter` API and renders via the `Text` component, so all `Text` style props are supported.",
      },
    },
  },
  args: {
    value: 1234567.89,
    thousandSeparator: true,
    decimalScale: 2,
    fixedDecimalScale: false,
    prefix: "",
    suffix: "",
    thousandsGroupStyle: "thousand",
    allowNegative: true,
    decimalSeparator: ".",
  },
  argTypes: {
    value: {
      control: "number",
      description: "The numeric value to format.",
    },
    thousandSeparator: {
      control: "text",
      description: "Character used to separate thousands groups. `true` uses a comma.",
    },
    thousandsGroupStyle: {
      control: "select",
      options: ["thousand", "lakh", "wan", "none"],
      description: "Grouping strategy: standard (3), Indian lakh (2/3), CJK wan (4), or none.",
    },
    decimalScale: {
      control: "number",
      description: "Maximum digits after the decimal point.",
    },
    fixedDecimalScale: {
      control: "boolean",
      description: "Pad trailing zeros so the decimal part always has `decimalScale` digits.",
    },
    decimalSeparator: {
      control: "text",
      description: "Character used as the decimal separator.",
    },
    prefix: {
      control: "text",
      description: "String prepended to the formatted value (e.g. currency symbol).",
    },
    suffix: {
      control: "text",
      description: "String appended to the formatted value (e.g. unit label).",
    },
    allowNegative: {
      control: "boolean",
      description: "When false, the absolute value is shown for negative inputs.",
    },
  },
} satisfies Meta<typeof NumberFormatter>;

export default meta;

type Story = StoryObj<ComponentProps<typeof NumberFormatter>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Currency prefix and suffix with two fixed decimal places. */
export const CurrencyDisplay: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <NumberFormatter
        {...args}
        value={1234567.5}
        prefix="$"
        suffix=" USD"
        decimalScale={2}
        fixedDecimalScale
        thousandSeparator
      />
      <NumberFormatter
        {...args}
        value={9999.0}
        prefix="€"
        suffix=" EUR"
        decimalScale={2}
        fixedDecimalScale
        thousandSeparator
      />
      <NumberFormatter
        {...args}
        value={500}
        prefix="£"
        suffix=" GBP"
        decimalScale={2}
        fixedDecimalScale
        thousandSeparator
      />
    </Box>
  ),
  args: {},
};

/** Fixed decimal scale pads trailing zeros so the decimal column always aligns. */
export const FixedDecimalScale: Story = {
  render: (args) => (
    <Box gap="$sm">
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>fixedDecimalScale=false</Text>
        <NumberFormatter {...args} value={5} decimalScale={2} fixedDecimalScale={false} />
        <NumberFormatter {...args} value={5.1} decimalScale={2} fixedDecimalScale={false} />
        <NumberFormatter {...args} value={5.12} decimalScale={2} fixedDecimalScale={false} />
      </Box>
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>fixedDecimalScale=true</Text>
        <NumberFormatter {...args} value={5} decimalScale={2} fixedDecimalScale />
        <NumberFormatter {...args} value={5.1} decimalScale={2} fixedDecimalScale />
        <NumberFormatter {...args} value={5.12} decimalScale={2} fixedDecimalScale />
      </Box>
    </Box>
  ),
  args: {},
};

/** Different thousands grouping styles — standard, Indian lakh, and CJK wan. */
export const ThousandsGroupStyles: Story = {
  render: (args) => (
    <Box gap="$sm">
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>thousand</Text>
        <NumberFormatter
          {...args}
          value={1234567890}
          thousandSeparator
          thousandsGroupStyle="thousand"
        />
      </Box>
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>lakh</Text>
        <NumberFormatter
          {...args}
          value={1234567890}
          thousandSeparator
          thousandsGroupStyle="lakh"
        />
      </Box>
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>wan</Text>
        <NumberFormatter {...args} value={1234567890} thousandSeparator thousandsGroupStyle="wan" />
      </Box>
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>none</Text>
        <NumberFormatter {...args} value={1234567890} thousandsGroupStyle="none" />
      </Box>
    </Box>
  ),
  args: {},
};

/** Negative values — with and without the allowNegative guard. */
export const NegativeValues: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Box gap="$xs" alignItems="center">
        <Text>allowNegative=true</Text>
        <NumberFormatter {...args} value={-42000} thousandSeparator allowNegative />
      </Box>
      <Box gap="$xs" alignItems="center">
        <Text>allowNegative=false</Text>
        <NumberFormatter {...args} value={-42000} thousandSeparator allowNegative={false} />
      </Box>
    </Box>
  ),
  args: {},
};

/** Custom decimal and thousands separator characters for locale-specific formatting. */
export const CustomSeparators: Story = {
  render: (args) => (
    <Box gap="$sm">
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>European (. thousands, , decimal)</Text>
        <NumberFormatter
          {...args}
          value={1234567.89}
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          fixedDecimalScale
        />
      </Box>
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>Space thousands</Text>
        <NumberFormatter
          {...args}
          value={1234567.89}
          thousandSeparator=" "
          decimalScale={2}
          fixedDecimalScale
        />
      </Box>
    </Box>
  ),
  args: {},
};

/** Edge cases: empty value, non-finite input, and zero. */
export const EdgeCases: Story = {
  render: () => (
    <Box gap="$sm">
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>Empty value (renders nothing):</Text>
        <Text>[</Text>
        <NumberFormatter value="" />
        <Text>]</Text>
      </Box>
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>Zero with fixed decimals:</Text>
        <NumberFormatter value={0} decimalScale={2} fixedDecimalScale prefix="$" />
      </Box>
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Text>Very large number:</Text>
        <NumberFormatter value={999999999999} thousandSeparator />
      </Box>
    </Box>
  ),
};
