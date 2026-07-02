import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { MaskInput } from "./MaskInput";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/MaskInput",
  component: MaskInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "MaskInput formats user input against a `mask` pattern as the user types. It is built on `InputBase` and supports string masks (using token characters like `9`, `a`, `*`) as well as array masks mixing literals and RegExps. Theme/accent come from the Tamagui `theme` prop.",
      },
    },
  },
  args: {
    mask: "(999) 999-9999",
    placeholder: "Phone number",
    disabled: false,
    alwaysShowMask: false,
    showMaskOnFocus: true,
    autoClear: false,
    slotChar: "_",
  },
  argTypes: {
    mask: {
      control: "text",
      description: "Mask pattern string or array of literals/RegExps.",
    },
    slotChar: {
      control: "text",
      description: "Character shown in unfilled slots. Set to an empty string or null to hide.",
    },
    alwaysShowMask: {
      control: "boolean",
      description: "Show the mask template even when the field is empty and unfocused.",
    },
    showMaskOnFocus: {
      control: "boolean",
      description: "Show the mask template when the field is focused.",
    },
    autoClear: {
      control: "boolean",
      description: "Clear the value on blur when the mask is incomplete.",
    },
    disabled: { control: "boolean" },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
    value: { control: false },
    defaultValue: { control: false },
    onChange: { control: false },
    onChangeRaw: { control: false },
    onComplete: { control: false },
    resetRef: { control: false },
  },
} satisfies Meta<typeof MaskInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof MaskInput>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Common mask patterns shown side by side for a quick visual comparison. */
export const CommonMasks: Story = {
  render: (args) => (
    <Box gap="$md">
      <MaskInput {...args} mask="(999) 999-9999" label="US phone" placeholder="(555) 000-0000" />
      <MaskInput {...args} mask="99/99/9999" label="Date" placeholder="DD/MM/YYYY" />
      <MaskInput {...args} mask="999-99-9999" label="SSN" placeholder="000-00-0000" />
      <MaskInput
        {...args}
        mask="9999 9999 9999 9999"
        label="Credit card"
        placeholder="0000 0000 0000 0000"
      />
      <MaskInput {...args} mask="AA-99999" label="Postal code" placeholder="AB-12345" />
    </Box>
  ),
};

/** The inherited `shadow` elevation prop, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      {SHADOWS.map((shadow) => (
        <MaskInput
          {...args}
          key={shadow}
          shadow={shadow}
          mask="(999) 999-9999"
          label={shadow}
          placeholder="(555) 000-0000"
        />
      ))}
    </Box>
  ),
};

/** alwaysShowMask keeps the slot placeholders visible even without focus. */
export const AlwaysShowMask: Story = {
  args: {
    mask: "(999) 999-9999",
    alwaysShowMask: true,
    slotChar: "_",
    label: "Phone",
  },
};

/** autoClear resets an incomplete value to empty when the field loses focus. */
export const AutoClear: Story = {
  args: {
    mask: "99/99/9999",
    autoClear: true,
    label: "Date (clears on blur if incomplete)",
    description: "Type a partial date, then click away.",
  },
};

/** Disabled state — the input is read-only with reduced opacity. */
export const Disabled: Story = {
  args: {
    mask: "(999) 999-9999",
    defaultValue: "555-123-4567",
    label: "Phone",
    disabled: true,
  },
};

/** Controlled usage — the parent owns the masked value and can observe changes. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("");
    const [raw, setRaw] = React.useState("");

    return (
      <Box gap="$md" width={300}>
        <MaskInput
          {...args}
          mask="(999) 999-9999"
          label="Phone"
          value={value}
          onChange={setValue}
          onChangeRaw={(rawValue, maskedValue) => {
            setRaw(rawValue);
            void maskedValue;
          }}
        />
        <Text>Masked: {value || "—"}</Text>
        <Text>Raw digits: {raw || "—"}</Text>
      </Box>
    );
  },
};

/** onComplete fires exactly once when every required slot is filled. */
export const OnComplete: Story = {
  render: (args) => {
    const [status, setStatus] = React.useState("Incomplete…");

    return (
      <Box gap="$md" width={300}>
        <MaskInput
          {...args}
          mask="99-99"
          label='Short code (format: "99-99")'
          onComplete={(masked, raw) => setStatus(`Complete! masked="${masked}" raw="${raw}"`)}
          onChange={() => setStatus("Incomplete…")}
        />
        <Text>{status}</Text>
      </Box>
    );
  },
};

/** Array mask — mix literal strings and RegExp tokens for fine-grained control. */
export const ArrayMask: Story = {
  render: (args) => (
    <Box gap="$md" width={300}>
      <MaskInput
        {...args}
        mask={[/[0-9]/, "-", /[A-Z]/, /[A-Z]/]}
        label="Digit-dash-two-uppercase (e.g. 1-AB)"
        placeholder="1-AB"
      />
      <MaskInput
        {...args}
        mask={[/[A-Z]/, /[A-Z]/, " ", /[0-9]/, /[0-9]/]}
        label="Two uppercase + space + two digits (e.g. AB 12)"
        placeholder="AB 12"
      />
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `root` frame and `label` (inherited from `InputBase`). */
export const Styles: Story = {
  args: {
    mask: "(999) 999-9999",
    label: "Styled phone",
    alwaysShowMask: true,
    styles: {
      root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
      label: { color: "$blue11" },
    },
  },
};

/** resetRef exposes a programmatic clear function without re-mounting the component. */
export const ResetRef: Story = {
  render: (args) => {
    const resetRef = React.useRef<() => void>(null);

    return (
      <Box gap="$md" width={300}>
        <MaskInput
          {...args}
          mask="999-999"
          label="Code"
          defaultValue="123-456"
          resetRef={resetRef}
        />
        <Box flexDirection="row" gap="$sm">
          <Text
            onPress={() => resetRef.current?.()}
            style={{ textDecorationLine: "underline", cursor: "pointer" }}
          >
            ↩ Reset
          </Text>
        </Box>
      </Box>
    );
  },
};
