import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Tabs } from "./Tabs";

const VARIANTS = ["default", "outline", "pills"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          "Tabs organises content into labelled panels. Compose `Tabs.List` + `Tabs.Tab` with matching `Tabs.Panel` elements. `variant` styles the indicator, `orientation` switches the axis, `inverted` places the list after the panels, and `placement` controls which side the list sits on when vertical.",
      },
    },
  },
  args: {
    variant: "default",
    orientation: "horizontal",
    inverted: false,
    keepMounted: true,
    allowTabDeactivation: false,
    loop: true,
    defaultValue: "general",
    size: "sm",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Visual style of the tab indicator.",
    },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Layout axis of the tab list.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Size of tab labels and spacing.",
    },
    placement: {
      control: "inline-radio",
      options: ["left", "right"],
      description: "Side the list sits on when orientation is vertical.",
    },
    inverted: {
      control: "boolean",
      description: "Render the tab list after the panels.",
    },
    keepMounted: {
      control: "boolean",
      description: "Keep inactive panels mounted (hidden) in the DOM.",
    },
    allowTabDeactivation: {
      control: "boolean",
      description: "Allow clicking an active tab to deselect it.",
    },
    loop: {
      control: "boolean",
      description: "Wrap arrow-key roving focus at the ends.",
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Tabs>>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const TABS = [
  { value: "general", label: "General", body: "General settings and preferences." },
  {
    value: "security",
    label: "Security",
    body: "Password, two-factor authentication and sessions.",
  },
  {
    value: "notifications",
    label: "Notifications",
    body: "Choose how and when you receive alerts.",
  },
] as const;

function BasicTabs(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="general" {...props}>
      <Tabs.List>
        {TABS.map((t) => (
          <Tabs.Tab key={t.value} value={t.value}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {TABS.map((t) => (
        <Tabs.Panel key={t.value} value={t.value} padding="$md">
          <Text>{t.body}</Text>
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => <BasicTabs {...args} />,
};

/** All three visual variants side by side. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {variant}
          </Text>
          <BasicTabs {...args} variant={variant} defaultValue="general" />
        </Box>
      ))}
    </Box>
  ),
};

/** Full token size scale. */
export const Sizes: Story = {
  args: {
    placement: "left",
  },

  render: (args) => (
    <Box gap="$lg">
      {SIZES.map((size) => (
        <Box key={size} gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {size}
          </Text>
          <BasicTabs {...args} size={size} defaultValue="general" />
        </Box>
      ))}
    </Box>
  ),
};

/** The shadow elevation prop, inherited from Box, applied to the Tabs root. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$lg">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {shadow}
          </Text>
          <BasicTabs {...args} shadow={shadow} defaultValue="general" />
        </Box>
      ))}
    </Box>
  ),
};

/** Accent theme comes from Tamagui's `theme` prop. */
export const Themed: Story = {
  render: (args) => (
    <Box gap="$lg">
      {(["blue", "red", "green"] as const).map((theme) => (
        <BasicTabs key={theme} {...args} theme={theme} variant="pills" defaultValue="general" />
      ))}
    </Box>
  ),
};

/** A disabled tab cannot be activated and is visually dimmed. */
export const WithDisabledTab: Story = {
  render: (args) => (
    <Tabs defaultValue="general" {...args}>
      <Tabs.List>
        <Tabs.Tab value="general">General</Tabs.Tab>
        <Tabs.Tab value="security">Security</Tabs.Tab>
        <Tabs.Tab value="billing" disabled>
          Billing
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="general" padding="$md">
        <Text>General settings content.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="security" padding="$md">
        <Text>Security settings content.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="billing" padding="$md">
        <Text>Billing content (unreachable).</Text>
      </Tabs.Panel>
    </Tabs>
  ),
};

/** Tabs with left/right icon sections for visual adornment. */
export const WithSections: Story = {
  render: (args) => (
    <Tabs defaultValue="profile" {...args}>
      <Tabs.List>
        <Tabs.Tab value="profile" leftSection={<Text>👤</Text>}>
          Profile
        </Tabs.Tab>
        <Tabs.Tab value="activity" leftSection={<Text>⚡</Text>}>
          Activity
        </Tabs.Tab>
        <Tabs.Tab value="settings" leftSection={<Text>⚙️</Text>} rightSection={<Text>🔴</Text>}>
          Settings
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="profile" padding="$md">
        <Text>Profile panel content.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="activity" padding="$md">
        <Text>Activity panel content.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="settings" padding="$md">
        <Text>Settings panel content.</Text>
      </Tabs.Panel>
    </Tabs>
  ),
};

/** Vertical orientation with the list on the left side (default placement). */
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <Box height={200}>
      <BasicTabs {...args} />
    </Box>
  ),
};

/** Vertical orientation with the tab list placed on the right side. */
export const VerticalRight: Story = {
  args: { orientation: "vertical", placement: "right" },
  render: (args) => (
    <Box height={200}>
      <BasicTabs {...args} />
    </Box>
  ),
};

/** Inverted layout — the tab list renders below the panel content. */
export const Inverted: Story = {
  args: { inverted: true },
  render: (args) => <BasicTabs {...args} />,
};

/** Controlled — the active tab is owned by the parent component. */
export const Controlled: Story = {
  render: (args) => {
    const [active, setActive] = React.useState<string | null>("general");
    return (
      <Box gap="$sm">
        <Tabs {...args} value={active} onChange={setActive}>
          <Tabs.List>
            {TABS.map((t) => (
              <Tabs.Tab key={t.value} value={t.value}>
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {TABS.map((t) => (
            <Tabs.Panel key={t.value} value={t.value} padding="$md">
              <Text>{t.body}</Text>
            </Tabs.Panel>
          ))}
        </Tabs>
        <Text fontSize="$sm" color="$color11">
          Active tab: {active ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** `grow` makes tabs expand to fill the full width of the list. */
export const GrowingTabs: Story = {
  render: (args) => (
    <Tabs defaultValue="general" {...args}>
      <Tabs.List grow>
        {TABS.map((t) => (
          <Tabs.Tab key={t.value} value={t.value}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {TABS.map((t) => (
        <Tabs.Panel key={t.value} value={t.value} padding="$md">
          <Text>{t.body}</Text>
        </Tabs.Panel>
      ))}
    </Tabs>
  ),
};

/** Per-slot `styles` targets individual parts — here the `tab`, `label` and `panel`. */
export const Styles: Story = {
  args: {
    styles: {
      tab: { backgroundColor: "$blue3" },
      label: { color: "$red9", fontWeight: "700" },
      panel: { backgroundColor: "$blue2" },
    },
  },
  render: (args) => <BasicTabs {...args} />,
};
