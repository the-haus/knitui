import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { Affix } from "./Affix";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Layout/Affix",
  component: Affix,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "`Affix` pins its children to a fixed position on the viewport (or nearest filling ancestor on React Native). Pass a `position` object with `top`, `right`, `bottom`, and/or `left` offsets — `$`-space tokens (`'$md'`) or raw numbers are accepted. By default the layer renders through a `Portal` so it escapes `overflow:hidden` / transformed ancestors.",
      },
    },
  },
  args: {
    withinPortal: false,
    zIndex: 200,
    position: { bottom: 0, right: 0 },
  },
  argTypes: {
    zIndex: {
      control: "number",
      description: "Stack order of the fixed layer.",
    },
    withinPortal: {
      control: "boolean",
      description:
        "When true the layer is rendered through a Portal so it escapes transformed / overflow:hidden ancestors.",
    },
    position: {
      control: "object",
      description:
        "Edge offsets — top, right, bottom, left. Accepts `$`-space tokens ('$md') or raw numbers.",
    },
    shadow: {
      control: "select",
      options: [undefined, ...SHADOWS],
      description: "Elevation — drop shadow from the shared ladder.",
    },
  },
} satisfies Meta<typeof Affix>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Affix>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  args: {
    children: (
      <Box
        backgroundColor="$color8"
        paddingHorizontal="$md"
        paddingVertical="$sm"
        borderRadius="$md"
      >
        <Text color="white">Pinned content</Text>
      </Box>
    ),
  },
};

/** Default placement — bottom-right corner of the viewport. */
export const BottomRight: Story = {
  args: {
    position: { bottom: "$lg", right: "$lg" },
    children: (
      <Box
        backgroundColor="$color8"
        paddingHorizontal="$md"
        paddingVertical="$sm"
        borderRadius="$md"
      >
        <Text color="white">Bottom right</Text>
      </Box>
    ),
  },
};

/** Top-left placement using spacing tokens as offsets. */
export const TopLeft: Story = {
  args: {
    position: { top: "$md", left: "$md" },
    children: (
      <Box
        backgroundColor="$color8"
        paddingHorizontal="$md"
        paddingVertical="$sm"
        borderRadius="$md"
      >
        <Text color="white">Top left</Text>
      </Box>
    ),
  },
};

/** Offsets expressed as Tamagui space tokens instead of raw numbers. */
export const TokenOffsets: Story = {
  args: {
    position: { bottom: "$md", right: "$md" },
    children: (
      <Box
        backgroundColor="$color9"
        paddingHorizontal="$lg"
        paddingVertical="$md"
        borderRadius="$lg"
      >
        <Text color="white">Token offsets (md)</Text>
      </Box>
    ),
  },
};

/** Rendered in-place (`withinPortal={false}`) — does not escape overflow:hidden ancestors. */
export const WithoutPortal: Story = {
  args: {
    withinPortal: false,
    position: { bottom: "$md", right: "$md" },
    children: (
      <Box
        backgroundColor="$color7"
        paddingHorizontal="$md"
        paddingVertical="$sm"
        borderRadius="$md"
      >
        <Text color="white">No portal</Text>
      </Box>
    ),
  },
};

/** A realistic scroll-to-top button pattern pinned to the bottom-right. */
export const ScrollToTop: Story = {
  render: (args) => {
    const [visible, setVisible] = React.useState(true);

    return (
      <Box height={300} position="relative" overflow="hidden">
        <Box padding="$lg" gap="$md">
          <Text>Scroll the page to reveal the scroll-to-top button.</Text>
          <Button variant="subtle" onPress={() => setVisible((v) => !v)}>
            {visible ? "Hide button" : "Show button"}
          </Button>
        </Box>

        {visible && (
          <Affix {...args} withinPortal={false} position={{ bottom: "$md", right: "$md" }}>
            <Box
              backgroundColor="$color8"
              width="$xl"
              height="$xl"
              borderRadius="$xl"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white">⬆</Text>
            </Box>
          </Affix>
        )}
      </Box>
    );
  },
};

/** All five shadow levels stacked in a contained frame to compare elevation. */
export const Shadows: Story = {
  render: () => (
    <Box height={300} position="relative" overflow="hidden" padding="$md" gap="$md">
      {SHADOWS.map((shadow, i) => (
        <Affix
          key={shadow}
          withinPortal={false}
          shadow={shadow}
          position={{ top: i * 56 + 16, left: "$md" }}
        >
          <Box
            backgroundColor="$background"
            paddingHorizontal="$md"
            paddingVertical="$sm"
            borderRadius="$md"
          >
            <Text>shadow="{shadow}"</Text>
          </Box>
        </Affix>
      ))}
    </Box>
  ),
};

/** All four corners shown simultaneously using four independent Affix layers. */
export const AllCorners: Story = {
  render: () => (
    <Box height={300} position="relative" overflow="hidden">
      {(
        [
          { position: { top: "$md", left: "$md" }, label: "TL" },
          { position: { top: "$md", right: "$md" }, label: "TR" },
          { position: { bottom: "$md", left: "$md" }, label: "BL" },
          { position: { bottom: "$md", right: "$md" }, label: "BR" },
        ] as const
      ).map(({ position, label }) => (
        <Affix key={label} withinPortal={false} position={position}>
          <Box
            backgroundColor="$color8"
            paddingHorizontal="$sm"
            paddingVertical="$xs"
            borderRadius="$sm"
          >
            <Text color="white">{label}</Text>
          </Box>
        </Affix>
      ))}
    </Box>
  ),
};
