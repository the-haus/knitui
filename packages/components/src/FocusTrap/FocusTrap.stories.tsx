import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { TextInput } from "../TextInput";
import { FocusTrap } from "./FocusTrap";

const meta = {
  title: "Overlays/FocusTrap",
  component: FocusTrap,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`FocusTrap` is a purely behavioural component — it clones its single child and attaches a focus-trap ref so that keyboard focus stays within the wrapped region while `active` is `true`. On web, Tab cycles within the trapped element; Tab order restores when `active` becomes `false`. Rendering and styling are delegated entirely to the child.",
      },
    },
  },
  args: {
    active: true,
    refProp: "ref",
  },
  argTypes: {
    active: {
      control: "boolean",
      description: "When `false`, focus trapping is disabled and Tab behaves normally.",
    },
    refProp: {
      control: "text",
      description: "Prop name used to forward the internal ref into the child element.",
    },
    children: { control: false },
    innerRef: { control: false },
  },
} satisfies Meta<typeof FocusTrap>;

export default meta;

type Story = StoryObj<ComponentProps<typeof FocusTrap>>;

/** The interactive playground — toggle `active` from the Controls panel to enable or disable trapping. */
export const Playground: Story = {
  render: (args) => (
    <FocusTrap {...args}>
      <Box
        borderWidth={2}
        borderColor="$borderColor"
        borderRadius="$md"
        padding="$lg"
        gap="$md"
        width={320}
      >
        <Text fontWeight="700">Focus is trapped inside this box</Text>
        <TextInput placeholder="First input" />
        <TextInput placeholder="Second input" />
        <Button tabIndex={0}>Action</Button>
      </Box>
    </FocusTrap>
  ),
};

/** Active trap — Tab key stays within the wrapped region until `active` is set to `false`. */
export const Active: Story = {
  args: { active: true },
  render: (args) => (
    <FocusTrap {...args}>
      <Box
        borderWidth={2}
        borderColor="$blue8"
        borderRadius="$md"
        padding="$lg"
        gap="$md"
        width={320}
      >
        <Text fontWeight="700" color="$blue10">
          Trap active — Tab cycles within
        </Text>
        <TextInput placeholder="First field" />
        <TextInput placeholder="Second field" />
        <Button tabIndex={0}>Submit</Button>
      </Box>
    </FocusTrap>
  ),
};

/** Inactive trap — `active={false}` disables trapping; Tab moves freely through the page. */
export const Inactive: Story = {
  args: { active: false },
  render: (args) => (
    <Box gap="$md">
      <TextInput placeholder="Outside — before" />
      <FocusTrap {...args}>
        <Box
          borderWidth={2}
          borderColor="$gray6"
          borderRadius="$md"
          padding="$lg"
          gap="$md"
          width={320}
          opacity={0.6}
        >
          <Text fontWeight="700" color="$gray10">
            Trap inactive — focus flows through
          </Text>
          <TextInput placeholder="Inside field" />
          <Button tabIndex={0}>Button</Button>
        </Box>
      </FocusTrap>
      <TextInput placeholder="Outside — after" />
    </Box>
  ),
};

/** `FocusTrap.InitialFocus` — the hidden marker receives focus first; useful in modals and dialogs to prevent focus jumping to the first interactive element unexpectedly. */
export const WithInitialFocus: Story = {
  render: (args) => (
    <FocusTrap {...args}>
      <Box
        borderWidth={2}
        borderColor="$green8"
        borderRadius="$md"
        padding="$lg"
        gap="$md"
        width={320}
      >
        <FocusTrap.InitialFocus />
        <Text fontWeight="700" color="$green10">
          Initial focus lands on the hidden marker
        </Text>
        <Text fontSize="$sm" color="$color10">
          The visually-hidden <Text fontWeight="700">InitialFocus</Text> marker (rendered before the
          inputs) receives focus first — no visible jump on open.
        </Text>
        <TextInput placeholder="First visible field" />
        <TextInput placeholder="Second visible field" />
        <Button tabIndex={0}>Confirm</Button>
      </Box>
    </FocusTrap>
  ),
};

/** Controlled toggle — a button outside the trap enables/disables it at runtime, demonstrating the `active` prop change. */
export const ControlledToggle: Story = {
  render: (args) => {
    const [active, setActive] = React.useState(false);
    return (
      <Box gap="$lg" alignItems="center">
        <Button onClick={() => setActive((v) => !v)} tabIndex={0}>
          {active ? "Disable trap" : "Enable trap"}
        </Button>

        <FocusTrap {...args} active={active}>
          <Box
            borderWidth={2}
            borderColor={active ? "$blue8" : "$gray6"}
            borderRadius="$md"
            padding="$lg"
            gap="$md"
            width={320}
          >
            <Text fontWeight="700" color={active ? "$blue10" : "$gray10"}>
              {active ? "Trap is ON" : "Trap is OFF"}
            </Text>
            <TextInput placeholder="Field A" />
            <TextInput placeholder="Field B" />
            <Button tabIndex={0}>OK</Button>
          </Box>
        </FocusTrap>
      </Box>
    );
  },
};

/** Modal-like overlay — demonstrates the canonical use-case: a dialog that traps focus while open and restores it on close. */
export const ModalLike: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <Box alignItems="center" justifyContent="center" minHeight={240}>
        <Button onClick={() => setOpen(true)} tabIndex={0}>
          Open dialog
        </Button>

        {open && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0,0,0,0.4)"
            alignItems="center"
            justifyContent="center"
          >
            <FocusTrap active>
              <Box
                backgroundColor="$background"
                borderRadius="$md"
                padding="$xl"
                gap="$md"
                width={340}
                shadow="xl"
              >
                <FocusTrap.InitialFocus />
                <Text fontWeight="700" fontSize="$lg">
                  Dialog title
                </Text>
                <Text color="$color10">
                  Focus is trapped inside this dialog. Tab will cycle between the fields and the
                  close button.
                </Text>
                <TextInput placeholder="Your name" />
                <Box flexDirection="row" gap="$md" justifyContent="flex-end">
                  <Button onClick={() => setOpen(false)} tabIndex={0} variant="default">
                    Cancel
                  </Button>
                  <Button onClick={() => setOpen(false)} tabIndex={0}>
                    Confirm
                  </Button>
                </Box>
              </Box>
            </FocusTrap>
          </Box>
        )}
      </Box>
    );
  },
};
