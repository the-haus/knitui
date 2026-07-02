import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { TextInput } from "../TextInput";
import { KeyboardAwareScrollView } from "./KeyboardAwareScrollView";

const meta = {
  title: "Layout/KeyboardAwareScrollView",
  component: KeyboardAwareScrollView,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`KeyboardAwareScrollView` is a cross-platform form primitive. On native it scrolls so the focused field stays above the on-screen keyboard (via `bottomOffset` / `extraKeyboardSpace`); on web there is no keyboard to scroll around, so it renders as a plain scrollable `Box` and the native-only props are accepted but stripped. `contentContainerStyle` is applied to an inner wrapper, matching the native `ScrollView` content container.",
      },
    },
  },
  argTypes: {
    bottomOffset: {
      control: "number",
      description: "Extra space (native only) kept between the focused field and the keyboard.",
    },
    extraKeyboardSpace: {
      control: "number",
      description: "Additional space (native only) added above the keyboard.",
    },
    enabled: { control: "boolean", description: "Toggle keyboard-aware scrolling (native only)." },
    children: { control: false },
  },
} satisfies Meta<typeof KeyboardAwareScrollView>;

export default meta;

type Story = StoryObj<ComponentProps<typeof KeyboardAwareScrollView>>;

/** The interactive playground — adjust the native-only props from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Box height={320} width={360} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
      <KeyboardAwareScrollView {...args} contentContainerStyle={{ padding: 16 }}>
        <Box gap="$md">
          <Text fontWeight="700">Profile</Text>
          {Array.from({ length: 8 }).map((_, i) => (
            <TextInput key={i} placeholder={`Field ${i + 1}`} />
          ))}
          <Button>Save</Button>
        </Box>
      </KeyboardAwareScrollView>
    </Box>
  ),
};

/** A long scrollable form — the canonical use-case. Focus a field near the bottom on native to see it scroll above the keyboard. */
export const LongForm: Story = {
  render: (args) => (
    <Box height={360} width={380} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
      <KeyboardAwareScrollView {...args} contentContainerStyle={{ padding: 20 }}>
        <Box gap="$md">
          <Text fontWeight="700" fontSize="$lg">
            Account details
          </Text>
          <Text color="$color10">Scroll through and fill in every field.</Text>
          {[
            "First name",
            "Last name",
            "Email",
            "Phone",
            "Street",
            "City",
            "Postal code",
            "Country",
            "Notes",
          ].map((label) => (
            <TextInput key={label} placeholder={label} />
          ))}
          <Button>Submit</Button>
        </Box>
      </KeyboardAwareScrollView>
    </Box>
  ),
};
