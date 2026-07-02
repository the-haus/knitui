import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Drawer } from "./Drawer";

const POSITIONS = ["left", "right", "top", "bottom"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Overlays/Drawer",
  component: Drawer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Drawer slides a panel in from any viewport edge. `position` chooses the anchor edge, `size` sets the panel extent (width for left/right, height for top/bottom), and `title` + `withCloseButton` compose the optional header. The compound sub-parts (`Drawer.Header`, `Drawer.Title`, `Drawer.Body`, `Drawer.Content`) are also exported for fully custom layouts.",
      },
    },
  },
  args: {
    opened: false,
    position: "left",
    size: "md",
    withCloseButton: true,
    title: "Drawer title",
    children: "Drawer body content goes here.",
  },
  argTypes: {
    opened: { control: "boolean" },
    position: {
      control: "inline-radio",
      options: POSITIONS,
      description: "Viewport edge the drawer is anchored to.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Panel extent — width for left/right, height for top/bottom.",
    },
    withCloseButton: {
      control: "boolean",
      description: "Show or hide the close button in the header.",
    },
    title: { control: "text" },
    offset: {
      control: "text",
      description: "Gap between the panel and the viewport edge. Prefer `$space` tokens.",
    },
    radius: { control: "text" },
    shadow: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl"],
      description: "Elevation — drop shadow from the shared ladder.",
    },
    closeOnEscape: { control: "boolean" },
    closeOnClickOutside: { control: "boolean" },
    withOverlay: { control: "boolean" },
    children: { control: "text" },
    onClose: { action: "onClose" },
  },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Drawer>>;

/** The interactive playground — open the drawer and tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center" justifyContent="center" padding="$lg">
        <Text
          onPress={() => setOpened(true)}
          padding="$sm"
          paddingHorizontal="$md"
          backgroundColor="$color5"
          borderRadius="$sm"
          color="$color12"
        >
          Open drawer
        </Text>
        <Drawer {...args} opened={opened} onClose={() => setOpened(false)} />
      </Box>
    );
  },
};

/** A trigger button that opens and closes the drawer — demonstrates controlled open state. */
export const Trigger: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center" justifyContent="center" padding="$lg">
        <Text
          onPress={() => setOpened(true)}
          padding="$sm"
          paddingHorizontal="$md"
          backgroundColor="$color5"
          borderRadius="$sm"
          color="$color12"
        >
          Open drawer
        </Text>
        <Drawer
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          title="Controlled drawer"
        >
          <Text>This drawer is fully controlled — the parent manages the open state.</Text>
          <Text marginTop="$md" color="$color11">
            Press the close button or click outside to dismiss it.
          </Text>
        </Drawer>
      </Box>
    );
  },
};

/** All four anchor positions side by side — each button opens its drawer from a different edge. */
export const Positions: Story = {
  render: (args) => {
    const [position, setPosition] = React.useState<(typeof POSITIONS)[number] | null>(null);
    return (
      <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
        {POSITIONS.map((pos) => (
          <Text
            key={pos}
            onPress={() => setPosition(pos)}
            padding="$sm"
            paddingHorizontal="$md"
            backgroundColor="$color5"
            borderRadius="$sm"
            color="$color12"
          >
            {pos}
          </Text>
        ))}
        <Drawer
          {...args}
          opened={position !== null}
          onClose={() => setPosition(null)}
          position={position ?? "left"}
          title={`${position ?? "left"} drawer`}
        >
          <Text>Anchored to the {position ?? "left"} edge.</Text>
        </Drawer>
      </Box>
    );
  },
};

/** All seven size steps, opening the same left-anchored drawer at increasing widths. */
export const Sizes: Story = {
  render: (args) => {
    const [size, setSize] = React.useState<(typeof SIZES)[number] | null>(null);
    return (
      <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
        {SIZES.map((s) => (
          <Text
            key={s}
            onPress={() => setSize(s)}
            padding="$sm"
            paddingHorizontal="$md"
            backgroundColor="$color5"
            borderRadius="$sm"
            color="$color12"
          >
            {s}
          </Text>
        ))}
        <Drawer
          {...args}
          opened={size !== null}
          onClose={() => setSize(null)}
          size={size ?? "md"}
          title={`Size: ${size ?? "md"}`}
        >
          <Text>Panel extent for size "{size ?? "md"}".</Text>
        </Drawer>
      </Box>
    );
  },
};

/** Drawer without a title — the header is omitted entirely. */
export const NoTitle: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center" justifyContent="center" padding="$lg">
        <Text
          onPress={() => setOpened(true)}
          padding="$sm"
          paddingHorizontal="$md"
          backgroundColor="$color5"
          borderRadius="$sm"
          color="$color12"
        >
          Open (no title)
        </Text>
        <Drawer {...args} opened={opened} onClose={() => setOpened(false)} title={undefined}>
          <Text>This drawer has no title — the header is hidden.</Text>
        </Drawer>
      </Box>
    );
  },
};

/** Close button hidden via `withCloseButton={false}` — only click-outside or Escape closes it. */
export const WithoutCloseButton: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center" justifyContent="center" padding="$lg">
        <Text
          onPress={() => setOpened(true)}
          padding="$sm"
          paddingHorizontal="$md"
          backgroundColor="$color5"
          borderRadius="$sm"
          color="$color12"
        >
          Open (no close button)
        </Text>
        <Drawer
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          title="No close button"
          withCloseButton={false}
        >
          <Text>Click outside or press Escape to close this drawer.</Text>
        </Drawer>
      </Box>
    );
  },
};

/** Drawer with an offset that creates a gap between the panel and the viewport edge. */
export const WithOffset: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center" justifyContent="center" padding="$lg">
        <Text
          onPress={() => setOpened(true)}
          padding="$sm"
          paddingHorizontal="$md"
          backgroundColor="$color5"
          borderRadius="$sm"
          color="$color12"
        >
          Open with offset
        </Text>
        <Drawer
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          title="Offset drawer"
          offset="$md"
          radius="$md"
        >
          <Text>A tokenized gap separates this panel from the viewport edge.</Text>
        </Drawer>
      </Box>
    );
  },
};

/**
 * All five `shadow` levels across the shared elevation ladder. Rendered on the
 * static `Drawer.Content` part (each in its own contained, non-overlapping cell)
 * so the drop shadows are directly comparable without the portaled overlay. The
 * live drawer defaults to `shadow="xl"`.
 */
export const Shadows: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center" padding="$xl">
      {SHADOWS.map((shadow) => (
        <Drawer.Content
          key={shadow}
          shadow={shadow}
          radius="$md"
          alignSelf="auto"
          width={140}
          height={100}
          alignItems="center"
          justifyContent="center"
        >
          <Text fontWeight="600">{shadow}</Text>
        </Drawer.Content>
      ))}
    </Box>
  ),
};

/** Compound API — assembling the drawer manually with `Drawer.Header`, `Drawer.Title`, and `Drawer.Body`. */
export const CompoundAPI: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center" justifyContent="center" padding="$lg">
        <Text
          onPress={() => setOpened(true)}
          padding="$sm"
          paddingHorizontal="$md"
          backgroundColor="$color5"
          borderRadius="$sm"
          color="$color12"
        >
          Open (compound)
        </Text>
        <Drawer
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          title={undefined}
          withCloseButton={false}
        >
          <Drawer.Header>
            <Drawer.Title>
              <Text>⭐</Text> Custom Header
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <Text>
              Built with <Text fontWeight="600">Drawer.Header</Text>,{" "}
              <Text fontWeight="600">Drawer.Title</Text>, and{" "}
              <Text fontWeight="600">Drawer.Body</Text> for full layout control.
            </Text>
          </Drawer.Body>
        </Drawer>
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `overlay`, `content`, and `title`. */
export const Styles: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center" justifyContent="center" padding="$lg">
        <Text
          onPress={() => setOpened(true)}
          padding="$sm"
          paddingHorizontal="$md"
          backgroundColor="$color5"
          borderRadius="$sm"
          color="$color12"
        >
          Open (styled)
        </Text>
        <Drawer
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          title="Styled drawer"
          styles={{
            overlay: { backgroundColor: "$blue3" },
            content: { borderColor: "$blue9", borderWidth: 2 },
            title: { color: "$blue11" },
          }}
        >
          <Text>
            The overlay, content border, and title are styled via the per-slot `styles` map.
          </Text>
        </Drawer>
      </Box>
    );
  },
};

/**
 * Drag-to-dismiss (`dragToDismiss`) — drag the panel toward its anchored edge to
 * close it (the same reanimated + gesture mechanic as `@knitui/sheet`): a left
 * drawer drags left, a bottom drawer drags down, etc. The CSS enter/exit slide is
 * unchanged. Release past ~30% of the panel extent (or a fling toward the edge)
 * dismisses; a short drag springs back.
 */
export const DragToDismiss: Story = {
  render: (args) => {
    const [position, setPosition] = React.useState<(typeof POSITIONS)[number] | null>(null);
    return (
      <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
        {POSITIONS.map((pos) => (
          <Text
            key={pos}
            onPress={() => setPosition(pos)}
            padding="$sm"
            paddingHorizontal="$md"
            backgroundColor="$color5"
            borderRadius="$sm"
            color="$color12"
          >
            {pos}
          </Text>
        ))}
        <Drawer
          {...args}
          opened={position !== null}
          onClose={() => setPosition(null)}
          position={position ?? "left"}
          title={`Drag the ${position ?? "left"} drawer`}
          dragToDismiss
        >
          <Text>Drag toward the {position ?? "left"} edge and release to dismiss.</Text>
        </Drawer>
      </Box>
    );
  },
};
