import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { TextInput } from "../TextInput";
import { KeyboardAvoidingView } from "./KeyboardAvoidingView";

const meta = {
  title: "Layout/KeyboardAvoidingView",
  component: KeyboardAvoidingView,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`KeyboardAvoidingView` is a cross-platform form primitive. On native it shifts its content out from behind the on-screen keyboard (via `behavior` / `keyboardVerticalOffset`); on web there is no keyboard to avoid, so it renders as a plain pass-through `Box` and the native-only props are accepted but stripped. Use it to wrap forms that should stay visible while a field is focused.",
      },
    },
  },
  args: {
    behavior: "padding",
  },
  argTypes: {
    behavior: {
      control: "select",
      options: ["height", "padding", "position", "translate-with-padding"],
      description: "Native strategy used to avoid the keyboard. Ignored on web.",
    },
    keyboardVerticalOffset: {
      control: "number",
      description: "Extra offset (native only) added above the keyboard.",
    },
    enabled: { control: "boolean", description: "Toggle keyboard avoidance (native only)." },
    children: { control: false },
  },
} satisfies Meta<typeof KeyboardAvoidingView>;

export default meta;

type Story = StoryObj<ComponentProps<typeof KeyboardAvoidingView>>;

/** The interactive playground — adjust the native-only props from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <KeyboardAvoidingView {...args}>
      <Box
        borderWidth={2}
        borderColor="$borderColor"
        borderRadius="$md"
        padding="$lg"
        gap="$md"
        width={320}
      >
        <Text fontWeight="700">Sign in</Text>
        <TextInput placeholder="Email" />
        <TextInput placeholder="Password" />
        <Button>Submit</Button>
      </Box>
    </KeyboardAvoidingView>
  ),
};

/** Wrapping a simple login form — the canonical use-case. */
export const LoginForm: Story = {
  render: (args) => (
    <KeyboardAvoidingView {...args}>
      <Box
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$md"
        padding="$xl"
        gap="$md"
        width={360}
      >
        <Text fontWeight="700" fontSize="$lg">
          Welcome back
        </Text>
        <Text color="$color10">Enter your details to continue.</Text>
        <TextInput placeholder="you@example.com" />
        <TextInput placeholder="Password" />
        <Box flexDirection="row" justifyContent="flex-end" gap="$md">
          <Button variant="default">Cancel</Button>
          <Button>Sign in</Button>
        </Box>
      </Box>
    </KeyboardAvoidingView>
  ),
};
