import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { CopyButton } from "./CopyButton";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/CopyButton",
  component: CopyButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`CopyButton` is a renderless copy-to-clipboard controller. It has no visual of its own — it hands `{ copied, copy }` to a render-prop child via `children`, which decides what to render. The `copied` flag resets to `false` after `timeout` ms (default 1 000 ms).",
      },
    },
  },
  args: {
    value: "https://example.com",
    timeout: 1000,
  },
  argTypes: {
    value: {
      control: "text",
      description: "The string that will be written to the clipboard.",
    },
    timeout: {
      control: "number",
      description: "Duration in ms the `copied` flag stays true after a copy.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof CopyButton>;

export default meta;

type Story = StoryObj<ComponentProps<typeof CopyButton>>;

/** The interactive playground — tweak `value` and `timeout` from the Controls panel. */
export const Playground: Story = {
  args: {
    value: "https://example.com",
  },
  render: (args) => (
    <CopyButton {...args}>
      {({ copied, copy }) => (
        <Button variant={copied ? "filled" : "default"} onPress={copy}>
          {copied ? "✓ Copied!" : "Copy URL"}
        </Button>
      )}
    </CopyButton>
  ),
};

/** Render-prop child shows a simple text toggle between "Copy" and "Copied!". */
export const BasicToggle: Story = {
  args: { value: "Hello, world!" },
  render: (args) => (
    <CopyButton {...args}>
      {({ copied, copy }) => (
        <Button variant="outline" onPress={copy}>
          {copied ? "Copied!" : "Copy text"}
        </Button>
      )}
    </CopyButton>
  ),
};

/**
 * The `shadow` elevation ladder applied to the render-prop `Button` trigger, from `xs` to `xl`.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <CopyButton key={shadow} {...args} value={`copy-${shadow}`}>
          {({ copied, copy }) => (
            <Button variant={copied ? "filled" : "default"} shadow={shadow} onPress={copy}>
              {copied ? "✓" : shadow}
            </Button>
          )}
        </CopyButton>
      ))}
    </Box>
  ),
};

/** Uses an icon-only action button to demonstrate a compact copy trigger. */
export const IconButton: Story = {
  args: { value: "icon-button-value" },
  render: (args) => (
    <CopyButton {...args}>
      {({ copied, copy }) => (
        <Button
          variant={copied ? "filled" : "subtle"}
          size="sm"
          onPress={copy}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
        >
          <Text>{copied ? "✓" : "📋"}</Text>
        </Button>
      )}
    </CopyButton>
  ),
};

/** Multiple independent CopyButtons on a single page — each manages its own state. */
export const Multiple: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {["npm install @knitui/ui", "yarn add @knitui/ui", "pnpm add @knitui/ui"].map((cmd) => (
        <CopyButton key={cmd} value={cmd}>
          {({ copied, copy }) => (
            <Button variant={copied ? "filled" : "default"} size="sm" onPress={copy}>
              {copied ? "✓ Copied" : cmd}
            </Button>
          )}
        </CopyButton>
      ))}
    </Box>
  ),
};

/** Short timeout (500 ms) — the "Copied" feedback disappears faster than the default. */
export const ShortTimeout: Story = {
  args: { value: "quick-copy", timeout: 500 },
  render: (args) => (
    <CopyButton {...args}>
      {({ copied, copy }) => (
        <Button variant={copied ? "filled" : "outline"} onPress={copy}>
          {copied ? "✓ Copied (resets in 0.5 s)" : "Copy — short timeout"}
        </Button>
      )}
    </CopyButton>
  ),
};

/** Long timeout (5 000 ms) — the "Copied" feedback persists for 5 seconds. */
export const LongTimeout: Story = {
  args: { value: "long-copy", timeout: 5000 },
  render: (args) => (
    <CopyButton {...args}>
      {({ copied, copy }) => (
        <Button variant={copied ? "filled" : "outline"} onPress={copy}>
          {copied ? "✓ Copied (resets in 5 s)" : "Copy — long timeout"}
        </Button>
      )}
    </CopyButton>
  ),
};

/** Demonstrates full render-prop flexibility — child renders a styled code snippet with an embedded copy action. */
export const InlineCode: Story = {
  args: { value: "const x = 42;" },
  render: (args) => (
    <CopyButton {...args}>
      {({ copied, copy }) => (
        <Box
          flexDirection="row"
          alignItems="center"
          gap="$sm"
          padding="$sm"
          borderRadius="$sm"
          backgroundColor="$backgroundStrong"
        >
          <Text flex={1}>const x = 42;</Text>
          <Button variant="subtle" size="xs" onPress={copy}>
            <Text>{copied ? "✓" : "⎘"}</Text>
          </Button>
        </Box>
      )}
    </CopyButton>
  ),
};
