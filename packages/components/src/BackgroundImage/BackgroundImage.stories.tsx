import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { BackgroundImage } from "./BackgroundImage";

/** A sample image URL used across stories. */
const SAMPLE_SRC = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80";

const RESIZE_MODES = ["cover", "contain", "stretch", "center", "repeat"] as const;

const RADIUS_VALUES = ["xs", "sm", "md", "lg", "xl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Display/BackgroundImage",
  component: BackgroundImage,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`BackgroundImage` renders content over a cover-positioned image. The image is a real `Image` element layered behind children, so it renders identically on web and native. `src` sets the image URL, `resizeMode` controls how it fills the frame, and `radius` clips the corners. The full `Box` style surface is available for sizing.",
      },
    },
  },
  args: {
    src: SAMPLE_SRC,
    resizeMode: "cover",
    width: 400,
    height: 200,
  },
  argTypes: {
    src: {
      control: "text",
      description: "Image URL rendered behind the content.",
    },
    resizeMode: {
      control: "select",
      options: RESIZE_MODES,
      description: "How the image fills the frame.",
    },
    radius: {
      control: "select",
      options: [undefined, ...RADIUS_VALUES],
      description: "Corner radius token — clips the image to the frame.",
    },
    shadow: {
      control: "select",
      options: [undefined, ...SHADOWS],
      description: "Elevation — drop shadow from the shared ladder.",
    },
  },
} satisfies Meta<typeof BackgroundImage>;

export default meta;

type Story = StoryObj<ComponentProps<typeof BackgroundImage>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Default cover fit with a text overlay centered in the frame. */
export const WithOverlay: Story = {
  args: {
    width: 400,
    height: 220,
    padding: "$lg",
    justifyContent: "flex-end",
  },
  render: (args) => (
    <BackgroundImage {...args}>
      <Box
        backgroundColor="rgba(0,0,0,0.45)"
        padding="$sm"
        borderRadius="$sm"
        alignSelf="flex-start"
      >
        <Text color="white" fontWeight="700" fontSize="$lg">
          Mountain landscape
        </Text>
        <Text color="white" fontSize="$xs" opacity={0.85}>
          Photo by Unsplash
        </Text>
      </Box>
    </BackgroundImage>
  ),
};

/** All five resize modes side by side — shows how the image fills each frame. */
export const ResizeModes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {RESIZE_MODES.map((mode) => (
        <Box key={mode} alignItems="center" gap="$xs">
          <BackgroundImage {...args} resizeMode={mode} width={160} height={100}>
            <Box flex={1} justifyContent="flex-end" padding="$xs">
              <Text
                color="white"
                fontSize="$xxs"
                fontWeight="600"
                backgroundColor="rgba(0,0,0,0.5)"
                paddingHorizontal="$xs"
              >
                {mode}
              </Text>
            </Box>
          </BackgroundImage>
        </Box>
      ))}
    </Box>
  ),
};

/** Rounded corners via the radius token — clipped by overflow hidden. */
export const Rounded: Story = {
  args: {
    radius: "xl",
    width: 400,
    height: 200,
    padding: "$lg",
    justifyContent: "center",
    alignItems: "center",
  },
  render: (args) => (
    <BackgroundImage {...args}>
      <Text color="white" fontWeight="700" fontSize="$xl">
        radius="xl"
      </Text>
    </BackgroundImage>
  ),
};

/** Sweep of all radius values showing how corners are clipped. */
export const RadiusScale: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {RADIUS_VALUES.map((radius) => (
        <Box key={radius} alignItems="center" gap="$xs">
          <BackgroundImage
            {...args}
            radius={radius}
            width={140}
            height={90}
            justifyContent="center"
            alignItems="center"
          >
            <Text
              color="white"
              fontWeight="600"
              fontSize="$xs"
              backgroundColor="rgba(0,0,0,0.5)"
              paddingHorizontal="$xs"
            >
              {radius}
            </Text>
          </BackgroundImage>
        </Box>
      ))}
    </Box>
  ),
};

/** Sweep of all shadow levels showing the elevation ladder behind the image frame. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} alignItems="center" gap="$xs">
          <BackgroundImage
            {...args}
            shadow={shadow}
            radius="md"
            width={140}
            height={90}
            justifyContent="center"
            alignItems="center"
          >
            <Text
              color="white"
              fontWeight="600"
              fontSize="$xs"
              backgroundColor="rgba(0,0,0,0.5)"
              paddingHorizontal="$xs"
            >
              {shadow}
            </Text>
          </BackgroundImage>
        </Box>
      ))}
    </Box>
  ),
};

/** Fixed dimensions — explicit width and height constrain the image frame. */
export const FixedSize: Story = {
  args: {
    width: 240,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  render: (args) => (
    <BackgroundImage {...args}>
      <Text color="white" fontWeight="700" fontSize="$md">
        240 x 240
      </Text>
    </BackgroundImage>
  ),
};

/** Full-width banner — stretches to fill the container width. */
export const FullWidthBanner: Story = {
  args: {
    width: "100%",
    height: 180,
    padding: "$xl",
    justifyContent: "center",
    alignItems: "center",
  },
  decorators: [
    (Story) => (
      <Box width={600}>
        <Story />
      </Box>
    ),
  ],
  render: (args) => (
    <BackgroundImage {...args}>
      <Text color="white" fontWeight="800" fontSize="$xxl" textAlign="center">
        Full-width banner
      </Text>
    </BackgroundImage>
  ),
};

/** Per-slot `styles` targets individual parts — here the `root` frame and backing `image`. */
export const Styles: Story = {
  args: {
    width: 400,
    height: 200,
    padding: "$lg",
    justifyContent: "center",
    alignItems: "center",
    styles: {
      root: { borderColor: "$blue7", borderWidth: 4, borderRadius: "$xl" },
      image: { opacity: 0.5 },
    },
  },
  render: (args) => (
    <BackgroundImage {...args}>
      <Text color="white" fontWeight="700" fontSize="$xl">
        Styled frame + image
      </Text>
    </BackgroundImage>
  ),
};
