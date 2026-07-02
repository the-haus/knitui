import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Code } from "./Code";

const meta = {
  title: "Typography/Code",
  component: Code,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Inline or block-level monospace code. Tint comes from the active theme ramp (`$color3` surface, `$color12` text), so the `theme` prop recolors it with no per-component logic. `block` switches from inline `<code>` to a full-width `<pre>`.",
      },
    },
  },
  args: {
    children: "npm install @knitui/components",
    block: false,
  },
  argTypes: {
    block: {
      control: "boolean",
      description: "Render as a full-width `<pre>` block instead of inline `<code>`.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the code surface via the palette ramp.",
    },
    children: { control: "text" },
  },
} satisfies Meta<typeof Code>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Code>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Inline code sits inside running prose without breaking the line. */
export const Inline: Story = {
  render: (args) => (
    <Text>
      Run <Code {...args}>npm install</Code> to add the package to your project.
    </Text>
  ),
  args: { children: "npm install", block: false },
};

/** Block code spans the full container width, suitable for multi-line snippets. */
export const Block: Story = {
  args: {
    block: true,
    children: `import { Code } from "@knitui/components";\n\nexport default function App() {\n  return <Code block>Hello, world!</Code>;\n}`,
  },
  decorators: [
    (Story) => (
      <Box width={480}>
        <Story />
      </Box>
    ),
  ],
};

/** Inline and block variants side by side for a quick comparison. */
export const InlineVsBlock: Story = {
  render: (args) => (
    <Box gap="$md">
      <Text>
        Inline: <Code {...args}>const x = 42;</Code>
      </Text>
      <Code {...args} block>
        {`// Block\nconst x = 42;\nconsole.log(x);`}
      </Code>
    </Box>
  ),
  args: { children: undefined },
};

/** The palette ramp follows the active theme — same component, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink", "gray"] as const).map((theme) => (
        <Code key={theme} {...args} theme={theme}>
          {theme}
        </Code>
      ))}
    </Box>
  ),
  args: { children: undefined },
};

/** Block code themed to different accents for visual regression. */
export const ThemedBlock: Story = {
  render: (args) => (
    <Box gap="$md">
      {(["blue", "red", "green", "yellow", "pink", "gray"] as const).map((theme) => (
        <Code key={theme} {...args} block theme={theme}>
          {`// theme="${theme}"\nconst color = "${theme}";`}
        </Code>
      ))}
    </Box>
  ),
  args: { children: undefined },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** Code embedded in a realistic paragraph of explanatory text. */
export const InProse: Story = {
  render: () => (
    <Text>
      To start the dev server, run <Code>pnpm dev</Code>. To build for production, use{" "}
      <Code>pnpm build</Code>. The output will appear in <Code>dist/</Code>.
    </Text>
  ),
};
