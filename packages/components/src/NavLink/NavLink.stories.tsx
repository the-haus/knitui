import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { NavLink } from "./NavLink";

const VARIANTS = ["filled", "light", "subtle"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Navigation/NavLink",
  component: NavLink,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "NavLink renders a pressable navigation item with optional label, description, left/right sections, and nestable children. The `variant` prop controls how the active theme ramp is applied. Nesting is handled by composing `<NavLink>` elements as children — the parent automatically shows a chevron and manages open/closed state.",
      },
    },
  },
  args: {
    label: "NavLink",
    variant: "light",
    active: false,
    disabled: false,
    noWrap: false,
    disableRightSectionRotation: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Visual style — controls hover and active background colours.",
    },
    active: { control: "boolean", description: "Applies active styles to the item." },
    disabled: { control: "boolean", description: "Disables pointer events and reduces opacity." },
    noWrap: { control: "boolean", description: "Truncates label and description to one line." },
    label: { control: "text" },
    description: { control: "text" },
    leftSection: { control: false },
    rightSection: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof NavLink>;

export default meta;

type Story = StoryObj<ComponentProps<typeof NavLink>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side at default size. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$xs" width={280}>
      {VARIANTS.map((variant) => (
        <NavLink key={variant} {...args} variant={variant} label={variant} />
      ))}
    </Box>
  ),
};

/** Active state applied to each variant — shows how the active theme ramp is used per variant. */
export const Active: Story = {
  args: {
    variant: "subtle",
  },

  render: (args) => (
    <Box flexDirection="column" gap="$xs" width={280}>
      {VARIANTS.map((variant) => (
        <NavLink key={variant} {...args} variant={variant} active label={`${variant} (active)`} />
      ))}
    </Box>
  ),
};

/** Each elevation of the inherited `shadow` prop applied to the NavLink row. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md" width={280}>
      {SHADOWS.map((shadow) => (
        <NavLink key={shadow} {...args} shadow={shadow} label={shadow} />
      ))}
    </Box>
  ),
};

/** Disabled state — reduced opacity and no pointer events. */
export const Disabled: Story = {
  args: {
    label: "Disabled link",
    disabled: true,
  },
};

/** Label plus a secondary description line below it. */
export const WithDescription: Story = {
  args: {
    label: "Settings",
    description: "Manage your account and preferences",
  },
};

/** Left and right sections hold icons or badges. */
export const WithSections: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$xs" width={280}>
      <NavLink {...args} label="Home" leftSection={<Text>🏠</Text>} />
      <NavLink
        {...args}
        label="Notifications"
        leftSection={<Text>🔔</Text>}
        rightSection={
          <Text fontSize="$xs" fontWeight="bold">
            3
          </Text>
        }
      />
      <NavLink
        {...args}
        label="Profile"
        leftSection={<Text>👤</Text>}
        rightSection={<Text>→</Text>}
      />
    </Box>
  ),
};

/** Nested NavLink children — the parent shows a chevron that rotates on expand. */
export const Nested: Story = {
  render: (args) => (
    <Box width={280}>
      <NavLink {...args} label="Products" leftSection={<Text>📦</Text>} defaultOpened>
        <NavLink label="All products" />
        <NavLink label="Add product" />
        <NavLink label="Categories" />
      </NavLink>
      <NavLink {...args} label="Orders" leftSection={<Text>🛒</Text>}>
        <NavLink label="New orders" />
        <NavLink label="Completed" />
      </NavLink>
    </Box>
  ),
};

/** Controlled open state — the parent component drives `opened` and `onChange`. */
export const Controlled: Story = {
  render: (args) => {
    const [isOpen, setOpen] = React.useState(false);
    return (
      <Box width={280} gap="$sm">
        <Text fontSize="$sm" color="$color">
          Nested section is {isOpen ? "open" : "closed"}
        </Text>
        <NavLink
          {...args}
          label="Settings"
          leftSection={<Text>⚙️</Text>}
          opened={isOpen}
          onChange={setOpen}
        >
          <NavLink label="General" />
          <NavLink label="Security" />
          <NavLink label="Billing" />
        </NavLink>
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `root` row, the `label`, and the `description`. */
export const Styles: Story = {
  args: {
    label: "Settings",
    description: "Manage your account and preferences",
    styles: {
      root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
      label: { color: "$red9", fontWeight: "700" },
      description: { color: "$blue11" },
    },
  },
};

/** A realistic navigation sidebar built from NavLink items. */
export const Sidebar: Story = {
  render: () => (
    <Box width={260} padding="$sm" gap="$xs" borderRadius="$sm" backgroundColor="$background">
      <NavLink label="Dashboard" leftSection={<Text>📊</Text>} active variant="light" />
      <NavLink label="Analytics" leftSection={<Text>📈</Text>} variant="light" />
      <NavLink label="Products" leftSection={<Text>📦</Text>} variant="light" defaultOpened>
        <NavLink label="All products" />
        <NavLink label="Add product" />
        <NavLink label="Categories" description="Organise your catalogue" />
      </NavLink>
      <NavLink label="Orders" leftSection={<Text>🛒</Text>} variant="light">
        <NavLink
          label="New"
          rightSection={
            <Text fontSize="$xs" fontWeight="bold">
              5
            </Text>
          }
        />
        <NavLink label="Completed" />
        <NavLink label="Refunds" disabled />
      </NavLink>
      <NavLink label="Settings" leftSection={<Text>⚙️</Text>} variant="light" disabled />
    </Box>
  ),
};

/** Compound sub-components (NavLink.Root, NavLink.Body, NavLink.Label, etc.) used directly for custom layouts. */
export const CompoundAPI: Story = {
  render: () => (
    <Box flexDirection="column" gap="$sm" width={280}>
      {/* Custom layout using sub-components */}
      <NavLink.Root
        variant="light"
        paddingHorizontal="$sm"
        paddingVertical="$xs"
        borderRadius="$xs"
      >
        <NavLink.Section>
          <Text>⭐</Text>
        </NavLink.Section>
        <NavLink.Body>
          <NavLink.Label>Custom label</NavLink.Label>
          <NavLink.Description>Built with sub-components</NavLink.Description>
        </NavLink.Body>
        <NavLink.Section>
          <Text fontSize="$xs">→</Text>
        </NavLink.Section>
      </NavLink.Root>

      <NavLink.Root
        variant="filled"
        backgroundColor="$color9"
        paddingHorizontal="$sm"
        paddingVertical="$xs"
        borderRadius="$xs"
      >
        <NavLink.Section>
          <Text>🔥</Text>
        </NavLink.Section>
        <NavLink.Body>
          <NavLink.Label color="$color1">Active item</NavLink.Label>
          <NavLink.Description color="$color1" opacity={0.8}>
            Filled variant via sub-components
          </NavLink.Description>
        </NavLink.Body>
      </NavLink.Root>
    </Box>
  ),
};
