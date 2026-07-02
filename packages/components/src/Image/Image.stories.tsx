import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Image } from "./Image";

const PLACEHOLDER = "https://picsum.photos/seed/knitui/400/300";
const PLACEHOLDER_WIDE = "https://picsum.photos/seed/knitui-wide/800/300";
const PLACEHOLDER_SQUARE = "https://picsum.photos/seed/knitui-sq/300/300";
const BROKEN_SRC = "https://example.com/does-not-exist.png";
const FALLBACK_SRC = "https://picsum.photos/seed/fallback/400/300";

const FIT_VALUES = ["cover", "contain", "fill", "none", "scale-down"] as const;
const RADIUS_VALUES = ["0", "4", "8", "16", "50%"] as const;
const RADIUS_TOKENS = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const PRIORITIES = ["low", "normal", "high"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Display/Image",
  component: Image,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Cross-platform `Image` backed by [expo-image](https://docs.expo.dev/versions/latest/sdk/image/) on web, iOS, and Android. It accepts `src` (preferred), the deprecated `source` prop, and optional `fallbackSrc` for graceful error handling. The `fit` prop maps to expo-image's `contentFit` (CSS `object-fit` values); `objectPosition` maps to `contentPosition`; `radius` applies a border-radius token or CSS value. The full expo-image surface is also exposed: `transition`, `placeholder`, `blurRadius`, `tintColor`, `priority`, `cachePolicy`, `recyclingKey`, and more.",
      },
    },
  },
  args: {
    src: PLACEHOLDER,
    alt: "Sample image",
    width: 400,
    height: 300,
    fit: "cover",
  },
  argTypes: {
    src: { control: "text", description: "Image URL or require() result." },
    alt: { control: "text", description: "Accessible alternative text." },
    fit: {
      control: "select",
      options: FIT_VALUES,
      description: 'CSS object-fit value. Defaults to "cover".',
    },
    radius: {
      control: "text",
      description: "Border-radius — a theme token key or any valid CSS value.",
    },
    fallbackSrc: {
      control: "text",
      description: "URL shown when the primary source fails to load.",
    },
    width: { control: "number" },
    height: { control: "number" },
    source: { control: false, description: "Deprecated — use src instead." },
    resizeMode: { control: false, description: "Deprecated — use fit instead." },
    transition: {
      control: "number",
      description: "expo-image cross-fade duration in ms (or an ImageTransition object).",
    },
    blurRadius: { control: "number", description: "expo-image blur effect radius in points." },
    tintColor: { control: "text", description: "expo-image template tint color." },
    priority: {
      control: "select",
      options: ["low", "normal", "high"],
      description: "expo-image load priority.",
    },
    cachePolicy: {
      control: "select",
      options: ["none", "disk", "memory", "memory-disk"],
      description: "expo-image cache strategy.",
    },
    onLoad: { control: false },
    onError: { control: false },
  },
} satisfies Meta<typeof Image>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Image>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All object-fit values side by side; each image is constrained to the same box. */
export const FitModes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {FIT_VALUES.map((fit) => (
        <Box key={fit} gap="$xs" alignItems="center">
          <Image {...args} fit={fit} width={160} height={120} />
          <Text fontSize="$xs" color="$gray9">
            {fit}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Border-radius applied via a raw CSS value — from sharp to fully rounded. */
export const Radius: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {RADIUS_VALUES.map((radius) => (
        <Box key={radius} gap="$xs" alignItems="center">
          <Image {...args} radius={radius} width={140} height={140} src={PLACEHOLDER_SQUARE} />
          <Text fontSize="$xs" color="$gray9">
            {radius}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** When the primary src is broken, the image automatically shows fallbackSrc. */
export const Fallback: Story = {
  args: {
    src: BROKEN_SRC,
    fallbackSrc: FALLBACK_SRC,
    alt: "Falls back gracefully",
    width: 400,
    height: 300,
  },
};

/** No src and no fallbackSrc — demonstrates empty / missing image handling. */
export const NoSource: Story = {
  args: {
    src: undefined,
    alt: "No source provided",
    width: 400,
    height: 300,
    fallbackSrc: undefined,
  },
};

/** Wide aspect ratio constrained to a fixed height — useful for banners. */
export const Banner: Story = {
  args: {
    src: PLACEHOLDER_WIDE,
    alt: "Banner image",
    width: 800,
    height: 200,
    fit: "cover",
    radius: "8",
  },
};

/** Square thumbnail with a circular radius — common for avatars. */
export const Avatar: Story = {
  args: {
    src: PLACEHOLDER_SQUARE,
    alt: "Avatar",
    width: 96,
    height: 96,
    radius: "50%",
    fit: "cover",
  },
};

/** Demonstrates the deprecated `source` prop still resolves correctly. */
export const DeprecatedSource: Story = {
  args: {
    source: PLACEHOLDER,
    src: undefined,
    alt: "Loaded via deprecated source prop",
    width: 400,
    height: 300,
  },
};

/**
 * expo-image cross-fades the image in once it loads. `transition` accepts a
 * duration in ms (shown) or a full `ImageTransition` object (`{ duration,
 * effect, timing }`).
 */
export const Transition: Story = {
  args: {
    src: "https://picsum.photos/seed/knitui-transition/400/300",
    alt: "Fades in on load",
    width: 400,
    height: 300,
    transition: 600,
    radius: "8",
  },
};

/**
 * A blurhash `placeholder` is shown while the full image loads, avoiding layout
 * shift and blank space. `placeholder` also accepts a thumbhash or a low-res
 * source.
 */
export const Placeholder: Story = {
  args: {
    src: "https://picsum.photos/seed/knitui-placeholder/400/300",
    alt: "Loads behind a blurhash placeholder",
    width: 400,
    height: 300,
    placeholder: { blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" },
    transition: 400,
    radius: "8",
  },
};

/** `blurRadius` applies a native blur to the rendered image. */
export const Blurred: Story = {
  args: {
    src: PLACEHOLDER,
    alt: "Blurred image",
    width: 400,
    height: 300,
    blurRadius: 12,
    radius: "8",
  },
};

/**
 * `objectPosition` (expo-image's `contentPosition`) controls how the image is
 * aligned within its frame when it overflows.
 */
export const ObjectPosition: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["top", "center", "bottom"] as const).map((position) => (
        <Box key={position} gap="$xs" alignItems="center">
          <Image
            {...args}
            src={PLACEHOLDER_WIDE}
            fit="cover"
            objectPosition={position}
            width={160}
            height={160}
          />
          <Text fontSize="$xs" color="$gray9">
            {position}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/**
 * `radius` accepts the theme radius tokens (`xxs`–`xxl`) in addition to raw CSS
 * values. The image is clipped to the rounded frame on web and native alike.
 */
export const RadiusTokens: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {RADIUS_TOKENS.map((radius) => (
        <Box key={radius} gap="$xs" alignItems="center">
          <Image {...args} radius={radius} width={96} height={96} src={PLACEHOLDER_SQUARE} />
          <Text fontSize="$xs" color="$gray9">
            {radius}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/**
 * `tintColor` recolors the image — useful for monochrome icons/templates. It
 * maps to expo-image's `tintColor` on native and an SVG color filter on web.
 */
export const Tinted: Story = {
  render: (args) => (
    <Box flexDirection="row" gap="$md" alignItems="center">
      {[undefined, "#e64980", "#228be6", "#12b886"].map((tint) => (
        <Box key={tint ?? "none"} gap="$xs" alignItems="center">
          <Image
            {...args}
            src={PLACEHOLDER_SQUARE}
            tintColor={tint}
            width={96}
            height={96}
            radius="md"
          />
          <Text fontSize="$xs" color="$gray9">
            {tint ?? "none"}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/**
 * `objectPosition` (→ `contentPosition`) also accepts the object form with
 * point/percent offsets from any edge.
 */
export const ContentPositionObject: Story = {
  args: {
    src: PLACEHOLDER_WIDE,
    alt: "Positioned from the top-left",
    width: 200,
    height: 200,
    fit: "none",
    objectPosition: { top: 16, left: 16 },
    radius: "8",
  },
};

/**
 * `priority` hints how urgently the image should load (`low` | `normal` |
 * `high`). On web it sets `fetchpriority` on the underlying `<img>`.
 */
export const Priorities: Story = {
  render: (args) => (
    <Box flexDirection="row" gap="$md" alignItems="center">
      {PRIORITIES.map((priority, i) => (
        <Box key={priority} gap="$xs" alignItems="center">
          <Image
            {...args}
            src={`https://picsum.photos/seed/knitui-priority-${priority}/240/180`}
            priority={priority}
            width={140}
            height={105}
            radius="md"
          />
          <Text fontSize="$xs" color="$gray9">
            {priority}
            {i === 1 ? " (default)" : ""}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** The inherited `shadow` elevation prop, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs" alignItems="center">
          <Image {...args} shadow={shadow} width={120} height={120} src={PLACEHOLDER_SQUARE} />
          <Text fontSize="$xs" color="$gray9">
            {shadow}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `root` frame and `image`. */
export const Styles: Story = {
  args: {
    src: PLACEHOLDER_SQUARE,
    alt: "Styled image",
    width: 160,
    height: 160,
  },
  render: (args) => (
    <Image
      {...args}
      styles={{
        root: { backgroundColor: "$blue3", padding: "$sm" },
        image: { borderColor: "$red9", borderWidth: 4, radius: "lg" },
      }}
    />
  ),
};

/**
 * A feature showcase: rounded, animated cross-fade in, with a blurhash
 * placeholder, memory-disk caching, and a recycling key.
 */
export const Showcase: Story = {
  args: {
    src: "https://picsum.photos/seed/knitui-showcase/600/400",
    alt: "Fully featured image",
    width: 600,
    height: 400,
    fit: "cover",
    radius: "lg",
    transition: { duration: 500, effect: "cross-dissolve", timing: "ease-out" },
    placeholder: { blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" },
    placeholderContentFit: "cover",
    cachePolicy: "memory-disk",
    recyclingKey: "knitui-showcase",
    priority: "high",
  },
};
