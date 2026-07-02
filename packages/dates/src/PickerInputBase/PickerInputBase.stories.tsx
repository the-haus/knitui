import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";
import { useDisclosure } from "@knitui/hooks";

import { PickerInputBase, type PickerInputBaseProps } from "./PickerInputBase";

const meta = {
  title: "Dates/PickerInputBase",
  component: PickerInputBase,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`PickerInputBase` is the shared TRIGGER CHROME every `*PickerInput` (`DatePickerInput`/`MonthPickerInput`/`YearPickerInput`) wraps. It renders an `InputBase` trigger (label/description/error/required + the formatted value or placeholder) and opens its inline-picker `children` in a `Popover.Dropdown` (default) or a centered `Modal`. In production `dropdownOpened`/`dropdownHandlers` are owned by `useDatesInput`; these stories wire them with `useDisclosure`. Per-slot `styles` (`wrapper`/`input`/`dropdown`) is sugar over the composed parts — explicit `popoverProps`/`clearButtonProps`/inline props beat it.",
      },
    },
  },
} satisfies Meta<typeof PickerInputBase>;

export default meta;

type Story = StoryObj<typeof PickerInputBase>;

const Frame = ({ children }: { children: React.ReactNode }) => <Box width={320}>{children}</Box>;

/** A stand-in inline picker body — the real wrappers drop a calendar here. */
const PickerBody = () => (
  <Box padding="$sm">
    <Text>Inline picker body</Text>
  </Box>
);

/**
 * The minimal wiring `useDatesInput` supplies in production: `dropdownOpened` +
 * `dropdownHandlers` from `useDisclosure`. Every other prop flows straight
 * through, so stories below only set the display props.
 */
const Harness = (
  props: Omit<PickerInputBaseProps, "dropdownOpened" | "dropdownHandlers" | "children"> & {
    children?: React.ReactNode;
  },
) => {
  const { children = <PickerBody />, ...rest } = props;
  const [opened, handlers] = useDisclosure(false);
  return (
    <Frame>
      <PickerInputBase {...rest} dropdownOpened={opened} dropdownHandlers={handlers}>
        {children}
      </PickerInputBase>
    </Frame>
  );
};

const baseProps = {
  type: "default" as const,
  value: null,
  onClear: () => {},
  shouldClear: false,
};

/** Empty trigger with a label + placeholder; press it to open the dropdown. */
export const Default: Story = {
  render: () => (
    <Harness {...baseProps} label="Event date" placeholder="Pick a date" formattedValue={null} />
  ),
};

/** A trigger displaying a formatted value. */
export const WithValue: Story = {
  render: () => (
    <Harness
      {...baseProps}
      label="Event date"
      placeholder="Pick a date"
      value="2026-06-16"
      formattedValue="June 16, 2026"
      shouldClear
    />
  ),
};

/** Description + required + error chrome (delegated to `InputBase`). */
export const FullChrome: Story = {
  render: () => (
    <Harness
      {...baseProps}
      label="Event date"
      description="Choose any upcoming day"
      placeholder="Pick a date"
      required
      error="This field is required"
      formattedValue={null}
    />
  ),
};

/** Clearable — the clear button appears in the right section when a value is present. */
export const Clearable: Story = {
  render: () => (
    <Harness
      {...baseProps}
      label="Event date"
      placeholder="Pick a date"
      value="2026-06-16"
      formattedValue="June 16, 2026"
      clearable
      shouldClear
    />
  ),
};

/** Disabled trigger — the dropdown cannot open. */
export const Disabled: Story = {
  render: () => (
    <Harness
      {...baseProps}
      label="Event date"
      placeholder="Pick a date"
      disabled
      formattedValue={null}
    />
  ),
};

/** Read-only trigger — shows a value but cannot open the dropdown. */
export const ReadOnly: Story = {
  render: () => (
    <Harness
      {...baseProps}
      label="Event date"
      placeholder="Pick a date"
      value="2026-06-16"
      formattedValue="June 16, 2026"
      readOnly
    />
  ),
};

/** `dropdownType="modal"` — same trigger, picker presented in a centered `Modal`. */
export const ModalDropdown: Story = {
  render: () => (
    <Harness
      {...baseProps}
      label="Event date"
      placeholder="Pick a date"
      dropdownType="modal"
      formattedValue={null}
    />
  ),
};

/** Per-slot `styles` sugar — tint the dropdown and pad the trigger via the slot map. */
export const StylesSlots: Story = {
  render: () => (
    <Harness
      {...baseProps}
      label="Event date"
      placeholder="Pick a date"
      formattedValue={null}
      styles={{
        dropdown: { backgroundColor: "$color2" },
        input: { variant: "filled" },
      }}
    />
  ),
};

/** Playground — tweak props live. */
export const Playground: Story = {
  args: {
    type: "default",
    value: null,
    formattedValue: null,
    onClear: () => {},
    shouldClear: false,
    label: "Event date",
    placeholder: "Pick a date",
    clearable: false,
    disabled: false,
    readOnly: false,
    required: false,
    dropdownType: "popover",
    size: "sm",
  },
  render: (args) => <Harness {...args} />,
};
