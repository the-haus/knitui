import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Switch } from "./Switch";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const THEMES = ["blue", "red", "green", "yellow", "pink", "gray"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Switch is a toggle control built on a styled `Box` track and thumb. It supports controlled and uncontrolled modes, inline labels, on/off track labels, a thumb icon slot, and a `Switch.Group` for multi-select scenarios.",
      },
    },
  },
  args: {
    label: "Switch",
    size: "sm",
    disabled: false,
    withThumbIndicator: true,
    labelPosition: "right",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls the height, width and thumb dimensions of the track.",
    },
    disabled: { control: "boolean" },
    withThumbIndicator: {
      control: "boolean",
      description: "Show a coloured dot inside the thumb.",
    },
    labelPosition: {
      control: "inline-radio",
      options: ["left", "right"],
      description: "Position of the label relative to the track.",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    offLabel: { control: "text" },
    onLabel: { control: "text" },
    checked: { control: false },
    onChange: { control: false },
    thumbIcon: { control: false },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Switch>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All seven sizes side by side for a quick visual comparison. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Switch key={size} {...args} size={size} label={size} />
      ))}
    </Box>
  ),
};

/** Elevation shadow ladder applied to the track via the inherited `shadow` prop. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Switch key={shadow} {...args} shadow={shadow} label={shadow} />
      ))}
    </Box>
  ),
};

/** Disabled state — the switch is non-interactive and visually dimmed. */
export const Disabled: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Switch {...args} disabled label="Disabled off" />
      <Switch {...args} disabled defaultChecked label="Disabled on" />
    </Box>
  ),
};

/** On/off labels rendered inside the track, behind the thumb. */
export const TrackLabels: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Switch {...args} size="md" onLabel="ON" offLabel="OFF" label="With track labels" />
      <Switch
        {...args}
        size="lg"
        onLabel={<Text>✓</Text>}
        offLabel={<Text>✕</Text>}
        label="Icon track labels"
      />
    </Box>
  ),
};

/** An icon rendered inside the thumb replaces the default dot indicator. */
export const ThumbIcon: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Switch {...args} size="md" thumbIcon={<Text fontSize="$xxs">⭐</Text>} label="Star thumb" />
      <Switch {...args} size="lg" thumbIcon={<Text fontSize="$xs">🔔</Text>} label="Bell thumb" />
    </Box>
  ),
};

/** Accent colour comes from the Tamagui theme prop. */
export const Themes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {THEMES.map((theme) => (
        <Switch key={theme} {...args} theme={theme} defaultChecked label={theme} />
      ))}
    </Box>
  ),
};

/** Label placed to the left of the track. */
export const LabelLeft: Story = {
  args: {
    label: "Label on the left",
    description: "Secondary description text",
    labelPosition: "left",
  },
};

/** Description and error slot — rendered below the label when provided. */
export const WithDescriptionAndError: Story = {
  render: (args) => (
    <Box gap="$md">
      <Switch
        {...args}
        label="With description"
        description="This setting affects your notification preferences."
      />
      <Switch {...args} label="With error" error="This field is required." />
    </Box>
  ),
};

/** Fully controlled switch — the parent manages checked state via React.useState. */
export const Controlled: Story = {
  render: (args) => {
    const [checked, setChecked] = React.useState(false);
    return (
      <Box gap="$md" alignItems="flex-start">
        <Switch {...args} checked={checked} onChange={setChecked} label={checked ? "On" : "Off"} />
        <Text>Current value: {String(checked)}</Text>
      </Box>
    );
  },
};

/** `Switch.Group` manages a set of switches as a multi-select; `maxSelectedValues` caps the selection. */
export const Group: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Switch.Group label="Notifications" description="Choose which alerts to enable.">
        <Switch {...args} value="email" label="Email" />
        <Switch {...args} value="sms" label="SMS" />
        <Switch {...args} value="push" label="Push" />
      </Switch.Group>

      <Switch.Group label="Max 2 selected" defaultValue={["wifi"]} maxSelectedValues={2} size="md">
        <Switch value="wifi" label="Wi-Fi" />
        <Switch value="bluetooth" label="Bluetooth" />
        <Switch value="nfc" label="NFC" />
      </Switch.Group>
    </Box>
  ),
};

/** A read-only `Switch.Group` keeps the current values visible but prevents toggling them. */
export const GroupReadOnly: Story = {
  render: (args) => (
    <Switch.Group label="Read-only group" readOnly defaultValue={["email"]} size="md">
      <Switch {...args} value="email" label="Email" />
      <Switch {...args} value="sms" label="SMS" />
      <Switch {...args} value="push" label="Push" />
    </Switch.Group>
  ),
};

/** Controlled `Switch.Group` — parent tracks the selected values array. */
export const ControlledGroup: Story = {
  render: () => {
    const [value, setValue] = React.useState<string[]>(["dark"]);
    return (
      <Box gap="$md">
        <Switch.Group label="Appearance" value={value} onChange={setValue} size="md">
          <Switch value="dark" label="Dark mode" />
          <Switch value="animations" label="Animations" />
          <Switch value="compact" label="Compact view" />
        </Switch.Group>
        <Text>Selected: {value.length > 0 ? value.join(", ") : "none"}</Text>
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `track`, `thumb` and `label`. */
export const Styles: Story = {
  args: {
    label: "Styled switch",
    defaultChecked: true,
    styles: {
      track: { backgroundColor: "$blue7" },
      thumb: { backgroundColor: "$red9" },
      label: { color: "$red9", fontWeight: "700" },
    },
  },
};
