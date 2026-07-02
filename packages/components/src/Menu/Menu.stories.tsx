import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { Menu } from "./Menu";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Overlays/Menu",
  component: Menu,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Menu is a compound component built on top of `Popover`. Compose `Menu.Target` (the trigger element), `Menu.Dropdown` (the panel), `Menu.Item` (an interactive row), `Menu.Label` (a section header), and `Menu.Divider` (a separator). State can be uncontrolled (`defaultOpened`) or fully controlled (`opened` + `onChange`).",
      },
    },
  },
  args: {
    position: "bottom-start",
    closeOnItemClick: true,
    withArrow: false,
    disabled: false,
    trigger: "click",
    shadow: "md",
  },
  argTypes: {
    position: {
      control: "select",
      options: [
        "top",
        "top-start",
        "top-end",
        "bottom",
        "bottom-start",
        "bottom-end",
        "left",
        "left-start",
        "left-end",
        "right",
        "right-start",
        "right-end",
      ],
      description: "Dropdown placement relative to the target.",
    },
    trigger: {
      control: "inline-radio",
      options: ["click", "hover", "click-hover"],
      description: "Event that opens the menu.",
    },
    shadow: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Dropdown shadow scale.",
    },
    closeOnItemClick: { control: "boolean" },
    withArrow: { control: "boolean" },
    disabled: { control: "boolean" },
    withinPortal: { control: "boolean" },
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Menu>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Menu {...args} defaultOpened>
      <Menu.Target>
        <Button>Open menu</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Account</Menu.Label>
        <Menu.Item leftSection={<Text>👤</Text>}>Profile</Menu.Item>
        <Menu.Item leftSection={<Text>⚙️</Text>}>Settings</Menu.Item>
        <Menu.Divider />
        <Menu.Label>Danger zone</Menu.Label>
        <Menu.Item leftSection={<Text>🗑️</Text>} disabled>
          Delete account
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  ),
};

/** Fully controlled open state driven by React.useState — demonstrates the Trigger pattern. */
export const Controlled: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box gap="$md" alignItems="center">
        <Menu {...args} opened={opened} onChange={setOpened}>
          <Menu.Target>
            <Button variant={opened ? "filled" : "default"}>
              {opened ? "Close menu" : "Open menu"}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onPress={() => setOpened(false)}>Action one</Menu.Item>
            <Menu.Item onPress={() => setOpened(false)}>Action two</Menu.Item>
            <Menu.Item onPress={() => setOpened(false)}>Action three</Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Text fontSize="$sm" color="$color11">
          Menu is {opened ? "open" : "closed"}
        </Text>
      </Box>
    );
  },
};

/** Labels and a divider group related items into named sections. */
export const WithLabelsAndDivider: Story = {
  render: (args) => (
    <Menu {...args} defaultOpened>
      <Menu.Target>
        <Button>User menu</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Profile</Menu.Label>
        <Menu.Item leftSection={<Text>👤</Text>}>Account</Menu.Item>
        <Menu.Item leftSection={<Text>📧</Text>}>Messages</Menu.Item>
        <Menu.Divider />
        <Menu.Label>Settings</Menu.Label>
        <Menu.Item leftSection={<Text>🔔</Text>}>Notifications</Menu.Item>
        <Menu.Item leftSection={<Text>🔒</Text>}>Security</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<Text>🚪</Text>}>Sign out</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  ),
};

/** Left and right sections hold icons or badges on either side of the label. */
export const WithSections: Story = {
  render: (args) => (
    <Menu {...args} defaultOpened>
      <Menu.Target>
        <Button>Actions</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<Text>✏️</Text>}
          rightSection={
            <Text fontSize="$xs" color="$color10">
              Ctrl+E
            </Text>
          }
        >
          Edit
        </Menu.Item>
        <Menu.Item
          leftSection={<Text>📋</Text>}
          rightSection={
            <Text fontSize="$xs" color="$color10">
              Ctrl+C
            </Text>
          }
        >
          Copy
        </Menu.Item>
        <Menu.Item
          leftSection={<Text>📌</Text>}
          rightSection={
            <Text fontSize="$xs" color="$color10">
              Ctrl+V
            </Text>
          }
        >
          Paste
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<Text>🗑️</Text>}
          rightSection={
            <Text fontSize="$xs" color="$color10">
              Del
            </Text>
          }
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  ),
};

/** Disabled items are visually muted and do not respond to press events. */
export const DisabledItems: Story = {
  render: (args) => (
    <Menu {...args} defaultOpened>
      <Menu.Target>
        <Button>Options</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<Text>✅</Text>}>Available action</Menu.Item>
        <Menu.Item leftSection={<Text>⛔</Text>} disabled>
          Disabled action
        </Menu.Item>
        <Menu.Item leftSection={<Text>⛔</Text>} disabled>
          Another disabled
        </Menu.Item>
        <Menu.Item leftSection={<Text>✅</Text>}>Another available</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  ),
};

/** The whole menu can be disabled — the dropdown never renders. */
export const DisabledMenu: Story = {
  args: { disabled: true },
  render: (args) => (
    <Menu {...args}>
      <Menu.Target>
        <Button disabled>Menu disabled</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item>You will never see this</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  ),
};

/** The arrow variant draws a pointer from the dropdown toward the target. */
export const WithArrow: Story = {
  args: { withArrow: true, position: "bottom" },
  render: (args) => (
    <Menu {...args} defaultOpened>
      <Menu.Target>
        <Button>With arrow</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<Text>⭐</Text>}>Favourite</Menu.Item>
        <Menu.Item leftSection={<Text>📎</Text>}>Attach</Menu.Item>
        <Menu.Item leftSection={<Text>🔗</Text>}>Share link</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  ),
};

/** Per-slot `styles` targets individual parts — here the `label`, `item`, and `itemLabel`. */
export const Styles: Story = {
  render: (args) => (
    <Menu
      {...args}
      defaultOpened
      styles={{
        label: { color: "$red9" },
        item: { backgroundColor: "$blue3" },
        itemLabel: { color: "$blue11", fontWeight: "700" },
      }}
    >
      <Menu.Target>
        <Button>Open menu</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Account</Menu.Label>
        <Menu.Item leftSection={<Text>👤</Text>}>Profile</Menu.Item>
        <Menu.Item leftSection={<Text>⚙️</Text>}>Settings</Menu.Item>
        <Menu.Item leftSection={<Text>🚪</Text>}>Sign out</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  ),
};

/**
 * All five shadow levels side by side to compare dropdown elevation. Each menu is
 * always open and rendered in its own contained relative wrapper (`withinPortal={false}`)
 * so the dropdowns sit inline and don't overlap.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} position="relative" alignItems="center" gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {shadow}
          </Text>
          <Menu {...args} defaultOpened shadow={shadow} withinPortal={false}>
            <Menu.Target>
              <Button variant="default">{shadow}</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<Text>👤</Text>}>Profile</Menu.Item>
              <Menu.Item leftSection={<Text>⚙️</Text>}>Settings</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Box>
      ))}
    </Box>
  ),
};

/** Hover trigger opens the menu on pointer enter and closes on pointer leave. */
export const HoverTrigger: Story = {
  args: { trigger: "hover" },
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Menu {...args}>
        <Menu.Target>
          <Button variant="outline">Hover me</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<Text>📄</Text>}>New document</Menu.Item>
          <Menu.Item leftSection={<Text>📁</Text>}>New folder</Menu.Item>
          <Menu.Item leftSection={<Text>⬆️</Text>}>Upload file</Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Text color="$color11" fontSize="$sm">
        Hover the button to open
      </Text>
    </Box>
  ),
};
