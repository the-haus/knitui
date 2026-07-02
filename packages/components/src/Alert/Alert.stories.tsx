import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import type { GradientValue } from "../internal/gradient";
import { Text } from "../Text";
import { Alert } from "./Alert";

const GRADIENT_PRESETS = {
  Sunset: { from: "#f97316", to: "#ec4899", deg: 45 },
  Ocean: { from: "#0ea5e9", to: "#22d3ee", deg: 45 },
  Forest: { from: "#22c55e", to: "#15803d", deg: 45 },
  Grape: { from: "#8b5cf6", to: "#ec4899", deg: 45 },
  Spectrum: {
    stops: [
      { color: "#f97316", offset: 0 },
      { color: "#eab308", offset: 25 },
      { color: "#22c55e", offset: 50 },
      { color: "#0ea5e9", offset: 75 },
      { color: "#8b5cf6", offset: 100 },
    ],
    deg: 90,
  },
} satisfies Record<string, GradientValue>;

const VARIANTS = [
  "filled",
  "light",
  "outline",
  "default",
  "transparent",
  "white",
  "gradient",
] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Feedback/Alert",
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          'Alert is a feedback panel composed from `Box` + `Text`. Accent comes from the `theme` prop + palette ramp (never a `color` prop). `variant` picks the fill, `size` sets token-driven spacing/type metrics, and `radius` the rounding. Optional `title`, `icon` and a `withCloseButton`/`onClose` affordance. It carries `role="alert"` with `aria-labelledby`/`aria-describedby` wired to the title and body.',
      },
    },
  },
  args: {
    children: "Your changes have been saved.",
    variant: "light",
    title: "",
    withCloseButton: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual fill — how the theme color ramp is applied.",
    },
    size: {
      control: "select",
      options: SIZES,
      description: "Token size for panel spacing, content gaps, text, and close button metrics.",
    },
    radius: {
      control: "text",
      description: "Theme radius token (e.g. `$sm`) or any CSS value.",
    },
    shadow: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl"],
      description: "Elevation — drop shadow from the shared ladder.",
    },
    title: { control: "text" },
    withCloseButton: { control: "boolean" },
    closeButtonLabel: { control: "text" },
    children: { control: "text" },
    icon: { control: false },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink"],
    },
    gradient: {
      control: "object",
      description: "Gradient fill for variant='gradient' — { from, to, deg } or { stops, deg }.",
    },
  },
  decorators: [
    (Story) => (
      <Box width={420}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Alert>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant stacked. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$md">
      {VARIANTS.map((variant) => (
        <Alert key={variant} {...args} variant={variant} title={variant}>
          The {variant} variant of the alert panel.
        </Alert>
      ))}
    </Box>
  ),
};

/** Every size on the full token scale. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md">
      {SIZES.map((size) => (
        <Alert key={size} {...args} size={size} title={`Size ${size}`} withCloseButton>
          Token-driven alert metrics for {size}.
        </Alert>
      ))}
    </Box>
  ),
};

/** A title is rendered bold above the body and wired as the alert's label. */
export const WithTitle: Story = {
  args: { title: "Heads up!", children: "This action cannot be undone." },
};

/** An icon sits in a column beside the body. */
export const WithIcon: Story = {
  args: {
    title: "Information",
    icon: <Text>ⓘ</Text>,
    children: "Read the docs before proceeding.",
  },
};

/** A close button pinned top-right; wire `onClose` to dismiss. */
export const WithCloseButton: Story = {
  args: {
    title: "Dismissable",
    withCloseButton: true,
    children: "Press the × to close this alert.",
  },
};

/** Rounded corners via the `radius` prop. */
export const Radius: Story = {
  args: { radius: "$xl", title: "Rounded", children: "Extra-large corner radius." },
};

/** The palette ramp follows the active theme — same alert, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box gap="$md">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Alert key={theme} {...args} theme={theme} variant="light" title={theme}>
          The {theme} accent.
        </Alert>
      ))}
    </Box>
  ),
};

/**
 * `Alert.Title` and `Alert.Message` are the compound parts the default layout
 * composes — usable directly for fully custom alert bodies.
 */
export const CompoundParts: Story = {
  render: () => (
    <Alert>
      <Alert.Title>Custom layout</Alert.Title>
      <Alert.Message>Built from Alert.Title + Alert.Message directly.</Alert.Message>
    </Alert>
  ),
};

/**
 * The `gradient` variant fills the panel with a linear gradient. With no
 * `gradient` prop it follows the theme ramp; otherwise it accepts a two-color
 * shorthand, `$colorN` tokens, or a multi-step `stops` list. Text renders white.
 */
export const Gradient: Story = {
  render: (args) => (
    <Box gap="$md">
      <Alert {...args} variant="gradient" title="Themed">
        Derives its ramp from the active theme.
      </Alert>
      <Alert
        {...args}
        variant="gradient"
        gradient={{ from: "#4f46e5", to: "#ec4899", deg: 60 }}
        title="Shorthand"
      >
        A two-color `from`/`to` gradient at 60°.
      </Alert>
      <Alert
        {...args}
        variant="gradient"
        gradient={{ from: "$blue9", to: "$teal9" }}
        title="Tokens"
      >
        Built from `$colorN` theme tokens.
      </Alert>
      <Alert
        {...args}
        variant="gradient"
        gradient={{
          stops: [
            { color: "#f97316", offset: 0 },
            { color: "#22c55e", offset: 50 },
            { color: "#8b5cf6", offset: 100 },
          ],
          deg: 90,
        }}
        title="Multi-step"
      >
        A multi-stop gradient at 90°.
      </Alert>
    </Box>
  ),
};

/** A set of curated multi-color gradient presets. */
export const GradientPresets: Story = {
  render: (args) => (
    <Box gap="$md">
      {Object.entries(GRADIENT_PRESETS).map(([name, gradient]) => (
        <Alert key={name} {...args} variant="gradient" gradient={gradient} title={name}>
          The {name} preset.
        </Alert>
      ))}
    </Box>
  ),
};

/** The themed gradient (no `gradient` prop) derives its ramp from the active theme. */
export const GradientThemed: Story = {
  render: (args) => (
    <Box gap="$md">
      {(["blue", "red", "green", "orange", "pink", "teal"] as const).map((theme) => (
        <Alert key={theme} {...args} variant="gradient" theme={theme} title={theme}>
          The {theme} themed gradient.
        </Alert>
      ))}
    </Box>
  ),
};

/** The same two-color gradient swept across a range of angles. */
export const GradientAngles: Story = {
  render: (args) => (
    <Box gap="$md">
      {[0, 45, 90, 135].map((deg) => (
        <Alert
          key={deg}
          {...args}
          variant="gradient"
          gradient={{ from: "#4f46e5", to: "#ec4899", deg }}
          title={`${deg}°`}
        >
          A gradient at {deg} degrees.
        </Alert>
      ))}
    </Box>
  ),
};

/** Optional elevation via the `shadow` prop — the shared ladder from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md">
      {SHADOWS.map((shadow) => (
        <Alert key={shadow} {...args} shadow={shadow} title={`Shadow ${shadow}`}>
          Elevation {shadow} from the shared shadow ladder.
        </Alert>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `title` and `message`. */
export const Styles: Story = {
  args: {
    title: "Per-slot styles",
    children: "The title and message are styled independently.",
    styles: {
      title: { color: "$red9", fontWeight: "700" },
      message: { color: "$blue11" },
    },
  },
};
