import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Overlay } from "./Overlay";

const meta = {
  title: "Display/Overlay",
  component: Overlay,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Overlay is a full-cover scrim — an absolutely- (or fixed-) positioned element that fills its parent with a translucent wash. `backgroundColor` and `backgroundOpacity` control the wash; `gradient` replaces the flat color with a CSS gradient. `blur` adds a `backdrop-filter` on web. `center` flex-centers any children (e.g. a spinner or message). The scrim is a neutral dimmer and does not follow the theme palette ramp.",
      },
    },
  },
  args: {
    backgroundColor: "#000",
    backgroundOpacity: 0.6,
    fixed: false,
    center: false,
    zIndex: 200,
  },
  argTypes: {
    backgroundColor: {
      control: "color",
      description: "Scrim base color (hex). Ignored when `gradient` is set.",
    },
    backgroundOpacity: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description: "Opacity of the scrim color, 0–1. Ignored when `gradient` is set.",
    },
    blur: {
      control: { type: "number", min: 0, max: 40, step: 1 },
      description: "Web-only backdrop blur in px (`backdrop-filter`). No-op on native.",
    },
    gradient: {
      control: "text",
      description:
        "Web-only CSS gradient string. Overrides `backgroundColor`/`backgroundOpacity` when set.",
    },
    fixed: {
      control: "boolean",
      description:
        "When true, positions relative to the viewport (`fixed`) instead of the parent (`absolute`).",
    },
    center: {
      control: "boolean",
      description: "Flex-centers children inside the overlay.",
    },
    zIndex: {
      control: { type: "number" },
      description: "Stack order — defaults to 200 (modal level).",
    },
    radius: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl", "full"],
      description: "Border radius token applied to the scrim frame.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof Overlay>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Overlay>>;

// ---------------------------------------------------------------------------
// Helper: a constrained box that establishes a positioned context so
// `position: absolute` overlays are visible in the canvas.
// ---------------------------------------------------------------------------
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <Box
      position="relative"
      width={280}
      height={160}
      backgroundColor="#e8eaed"
      borderRadius="$sm"
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
    >
      <Text color="#555" fontSize="$sm">
        Content behind the overlay
      </Text>
      {children}
    </Box>
  );
}

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  decorators: [
    (Story) => (
      <Stage>
        <Story />
      </Stage>
    ),
  ],
};

/** Default scrim at 60 % black opacity — covers its positioned parent completely. */
export const Default: Story = {
  decorators: [
    (Story) => (
      <Stage>
        <Story />
      </Stage>
    ),
  ],
};

/** `center` prop flex-centers children inside the scrim — ideal for a loading spinner or message. */
export const Centered: Story = {
  args: {
    center: true,
    children: (
      <Text color="#fff" fontWeight="700">
        Loading…
      </Text>
    ),
  },
  decorators: [
    (Story) => (
      <Stage>
        <Story />
      </Stage>
    ),
  ],
};

/** Light wash over a white or bright surface — white scrim at low opacity. */
export const LightWash: Story = {
  args: {
    backgroundColor: "#fff",
    backgroundOpacity: 0.7,
  },
  decorators: [
    (Story) => (
      <Stage>
        <Story />
      </Stage>
    ),
  ],
};

/** Each elevation of the inherited `shadow` prop applied to the scrim frame. */
export const Shadows: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((shadow) => (
        <Stage key={shadow}>
          <Overlay shadow={shadow} backgroundOpacity={0.6} center>
            <Text color="#fff" fontWeight="600" fontSize="$sm">
              {shadow}
            </Text>
          </Overlay>
        </Stage>
      ))}
    </Box>
  ),
};

/** Colour-tinted scrim — a branded accent wash rather than neutral black. */
export const ColoredTint: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(
        [
          { color: "#1c4ed8", label: "Blue" },
          { color: "#15803d", label: "Green" },
          { color: "#b91c1c", label: "Red" },
          { color: "#7c3aed", label: "Purple" },
        ] as const
      ).map(({ color, label }) => (
        <Stage key={label}>
          <Overlay backgroundColor={color} backgroundOpacity={0.55} center>
            <Text color="#fff" fontWeight="600" fontSize="$sm">
              {label}
            </Text>
          </Overlay>
        </Stage>
      ))}
    </Box>
  ),
};

/** Gradient scrim — CSS gradient replaces the flat color wash. */
export const Gradient: Story = {
  args: {
    gradient: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)",
    center: true,
    children: (
      <Text color="#fff" fontWeight="700" alignSelf="flex-end">
        Caption text
      </Text>
    ),
  },
  decorators: [
    (Story) => (
      <Stage>
        <Story />
      </Stage>
    ),
  ],
};

/** Blur effect — `backdrop-filter` blurs content behind the scrim (web only). */
export const BlurScrim: Story = {
  args: {
    blur: 8,
    backgroundOpacity: 0.3,
    center: true,
    children: (
      <Text color="#fff" fontWeight="600">
        Blurred backdrop
      </Text>
    ),
  },
  decorators: [
    (Story) => (
      <Stage>
        <Story />
      </Stage>
    ),
  ],
};

/** Radius — rounded corners clip the scrim to match a card or panel. */
export const WithRadius: Story = {
  args: {
    radius: "lg",
    backgroundOpacity: 0.75,
    center: true,
    children: <Text color="#fff">Rounded scrim</Text>,
  },
  decorators: [
    (Story) => (
      <Stage>
        <Story />
      </Stage>
    ),
  ],
};

/** Controlled visibility — click the button to toggle the overlay on/off. */
export const Trigger: Story = {
  render: (args) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <Box gap="$md" alignItems="center">
        <Stage>
          <Text color="#555" fontSize="$sm" position="absolute">
            Content behind overlay
          </Text>
          {visible && (
            <Overlay
              {...args}
              center
              onPress={() => setVisible(false)}
              style={{ cursor: "pointer" }}
            >
              <Text color="#fff" fontWeight="600">
                Click to dismiss
              </Text>
            </Overlay>
          )}
        </Stage>
        <Text
          onPress={() => setVisible((v) => !v)}
          color="#1c4ed8"
          fontWeight="600"
          style={{ cursor: "pointer" }}
        >
          {visible ? "Hide overlay" : "Show overlay"}
        </Text>
      </Box>
    );
  },
};
