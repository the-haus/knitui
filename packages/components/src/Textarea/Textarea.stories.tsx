import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Textarea } from "./Textarea";

const VARIANTS = ["default", "filled", "unstyled"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const RESIZE_OPTIONS = ["none", "both", "horizontal", "vertical"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Textarea is a multiline text field built on top of `InputBase`. It supports optional autosize growth between `minRows` and `maxRows` (web), a CSS `resize` handle, and the full `InputBase` wrapper API: label, description, error and required state.",
      },
    },
  },
  args: {
    placeholder: "Write something…",
    variant: "default",
    size: "md",
    disabled: false,
    autosize: false,
    minRows: 3,
    resize: "none",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Visual variant of the input chrome.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, padding, radius and font size.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Tamagui accent theme applied to focused and error-adjacent chrome.",
    },
    disabled: { control: "boolean" },
    autosize: {
      control: "boolean",
      description: "When true the textarea grows with its content (web only).",
    },
    minRows: {
      control: "number",
      description: "Minimum number of visible rows / initial height.",
    },
    maxRows: {
      control: "number",
      description: "Maximum rows before the autosize textarea starts scrolling (web only).",
    },
    resize: {
      control: "inline-radio",
      options: RESIZE_OPTIONS,
      description: "CSS `resize` property — controls the drag handle (web only).",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text", description: "Error message — toggles error styling." },
    placeholder: { control: "text" },
    value: { control: "text" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Textarea>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** The three chrome variants — default, filled, and unstyled. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$md" width={360}>
      {VARIANTS.map((variant) => (
        <Textarea key={variant} {...args} variant={variant} placeholder={variant} />
      ))}
    </Box>
  ),
};

/** The seven token sizes from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md" width={360}>
      {SIZES.map((size) => (
        <Textarea key={size} {...args} size={size} placeholder={`size: ${size}`} />
      ))}
    </Box>
  ),
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$xl">
      {VARIANTS.map((variant) => (
        <Box key={variant} gap="$md">
          <Text fontWeight="bold" fontSize="$xs" color="$color11">
            {variant}
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="flex-start">
            {SIZES.map((size) => (
              <Textarea
                key={size}
                variant={variant}
                size={size}
                placeholder={`${variant} / ${size}`}
                minRows={2}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

/** The shadow elevation prop, inherited from Box, across all token levels. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md" width={360}>
      {SHADOWS.map((shadow) => (
        <Textarea key={shadow} {...args} shadow={shadow} placeholder={`shadow: ${shadow}`} />
      ))}
    </Box>
  ),
};

/** Theme accent — uses Tamagui's theme prop, not a Mantine color prop. */
export const Themed: Story = {
  args: {
    label: "Feedback",
    placeholder: "Share product feedback",
    theme: "green",
  },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** Label, description and error are wired via `InputBase` — no extra wrapper needed. */
export const WithLabel: Story = {
  args: {
    label: "Bio",
    description: "Tell us a little about yourself.",
    placeholder: "I'm a developer who…",
    minRows: 4,
  },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** Error state — toggles the error border and renders the error message below. */
export const WithError: Story = {
  args: {
    label: "Comment",
    error: "Comment must not exceed 280 characters.",
    defaultValue: "This comment is way too long and will cause a validation error to appear below.",
    minRows: 3,
  },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** Disabled state — reduced opacity and pointer events off. */
export const Disabled: Story = {
  args: {
    label: "Notes",
    disabled: true,
    value: "You cannot edit this field.",
    minRows: 3,
  },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** Autosize grows the textarea as the user types, capped at `maxRows`. */
export const Autosize: Story = {
  args: {
    label: "Autosize (max 6 rows)",
    description: "Start typing — the textarea expands until it hits 6 rows, then scrolls.",
    placeholder: "Keep typing to see it grow…",
    autosize: true,
    minRows: 2,
    maxRows: 6,
  },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** Controlled usage — value is held in state and displayed below. */
export const Controlled: Story = {
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
  render: (args) => {
    const [value, setValue] = React.useState("");
    return (
      <Box gap="$sm">
        <Textarea
          {...args}
          label="Your message"
          value={value}
          onChangeText={setValue}
          placeholder="Type here…"
          minRows={3}
        />
        <Text fontSize="$xs" color="$color11">
          {value.length} character{value.length !== 1 ? "s" : ""}
        </Text>
      </Box>
    );
  },
};

/**
 * Autosize with controlled state — demonstrates that the textarea re-runs the
 * height calculation whenever the React value changes (not just on DOM input events).
 */
export const AutosizeControlled: Story = {
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
  render: (args) => {
    const [value, setValue] = React.useState("");
    return (
      <Textarea
        {...args}
        label="Autosize controlled (max 6 rows)"
        description="Start typing — the textarea grows with its content."
        value={value}
        onChangeText={setValue}
        placeholder="Keep typing to see it grow…"
        autosize
        minRows={2}
        maxRows={6}
      />
    );
  },
};

/** Left / right sections should pin to the top edge in multiline mode. */
export const WithSections: Story = {
  render: (args) => (
    <Box gap="$md" width={360}>
      <Textarea
        {...args}
        label="With left section"
        leftSection={<Text fontSize="$xs">@</Text>}
        placeholder="Left section aligns to top…"
        minRows={4}
      />
      <Textarea
        {...args}
        label="With right section"
        rightSection={<Text fontSize="$xs">✓</Text>}
        rightSectionPointerEvents="none"
        placeholder="Right section aligns to top…"
        minRows={4}
      />
    </Box>
  ),
};

/** The `resize` prop exposes the CSS drag handle — sweep all four options. */
export const ResizeHandles: Story = {
  render: (args) => (
    <Box gap="$md" width={360}>
      {RESIZE_OPTIONS.map((resize) => (
        <Textarea
          key={resize}
          {...args}
          resize={resize}
          label={`resize="${resize}"`}
          placeholder={`resize: ${resize}`}
          minRows={3}
        />
      ))}
    </Box>
  ),
};

/** Read-only — the value is shown but not editable, with no disabled dimming. */
export const ReadOnly: Story = {
  args: {
    label: "Terms",
    value: "These terms are read-only and cannot be edited by the user.",
    readOnly: true,
    minRows: 3,
  },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** Required field — `withAsterisk` appends the asterisk without forcing validation. */
export const Required: Story = {
  render: (args) => (
    <Box gap="$md" width={360}>
      <Textarea
        {...args}
        label="Required (required)"
        placeholder="This field is required"
        required
        minRows={3}
      />
      <Textarea
        {...args}
        label="Required (withAsterisk)"
        description="Asterisk only — no native required attribute."
        placeholder="Asterisk without required"
        withAsterisk
        minRows={3}
      />
    </Box>
  ),
};

/** Loading indicator in either section — pins to the top edge in multiline mode. */
export const Loading: Story = {
  render: (args) => (
    <Box gap="$md" width={360}>
      <Textarea
        {...args}
        label="Loading left"
        placeholder="Checking…"
        loading
        loadingPosition="left"
        minRows={3}
      />
      <Textarea
        {...args}
        label="Loading right"
        placeholder="Saving…"
        loading
        loadingPosition="right"
        minRows={3}
      />
    </Box>
  ),
};

/** Character limit — `maxLength` caps input; a live counter reflects remaining chars. */
export const CharacterLimit: Story = {
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
  render: (args) => {
    const MAX = 120;
    const [value, setValue] = React.useState("");
    return (
      <Box gap="$sm">
        <Textarea
          {...args}
          label="Short bio"
          value={value}
          onChangeText={setValue}
          maxLength={MAX}
          placeholder={`Up to ${MAX} characters…`}
          minRows={3}
        />
        <Text fontSize="$xs" color={value.length >= MAX ? "$red10" : "$color11"}>
          {value.length} / {MAX}
        </Text>
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `root` frame and `label`. */
export const Styles: Story = {
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
  render: (args) => (
    <Textarea
      {...args}
      label="Styled message"
      placeholder="Write something…"
      minRows={3}
      styles={{
        root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
        label: { color: "$blue11" },
      }}
    />
  ),
};

/** Prefilled with long content — a fixed-height field scrolls its overflow. */
export const Prefilled: Story = {
  args: {
    label: "Release notes",
    defaultValue: Array.from(
      { length: 8 },
      (_, i) => `Line ${i + 1}: a change shipped in this release.`,
    ).join("\n"),
    minRows: 4,
    resize: "vertical",
  },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};
