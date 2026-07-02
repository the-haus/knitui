import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Pill } from "../Pill";
import { Text } from "../Text";
import { PillsInput } from "./PillsInput";

const VARIANTS = ["default", "filled", "unstyled"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/PillsInput",
  component: PillsInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "PillsInput is a multiline input shell that hosts a `Pill.Group` of pills alongside an editable `PillsInput.Field`. It inherits the full input chrome (label, description, error, left/right sections) from the shared `InputWrapper` + `InputChrome`. Pressing anywhere in the shell focuses the inner field. Accent follows the active Tamagui `theme` prop.",
      },
    },
  },
  args: {
    label: "Tags",
    description: "",
    error: "",
    disabled: false,
    size: "sm",
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Visual variant — how the border and background are rendered.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height metrics and font size.",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    leftSection: { control: false },
    rightSection: { control: false },
  },
} satisfies Meta<typeof PillsInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof PillsInput>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Box width={320}>
      <PillsInput {...args}>
        <Pill.Group>
          <Pill withRemoveButton>react</Pill>
          <Pill withRemoveButton>typescript</Pill>
        </Pill.Group>
        <PillsInput.Field placeholder="Add tag…" />
      </PillsInput>
    </Box>
  ),
};

/** Every visual variant side by side at the default size. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$lg" width={320}>
      {VARIANTS.map((variant) => (
        <PillsInput key={variant} {...args} variant={variant} label={variant}>
          <Pill.Group>
            <Pill>react</Pill>
          </Pill.Group>
          <PillsInput.Field placeholder="Add tag…" />
        </PillsInput>
      ))}
    </Box>
  ),
};

/** The full seven-step size scale, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$lg" width={320}>
      {SIZES.map((size) => (
        <PillsInput key={size} {...args} size={size} label={`size: ${size}`}>
          <Pill.Group>
            <Pill>tag</Pill>
          </Pill.Group>
          <PillsInput.Field placeholder="Add tag…" />
        </PillsInput>
      ))}
    </Box>
  ),
};

/** Each elevation of the inherited `shadow` prop applied to the input shell. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$lg" width={320}>
      {SHADOWS.map((shadow) => (
        <PillsInput key={shadow} {...args} shadow={shadow} label={shadow}>
          <Pill.Group>
            <Pill>react</Pill>
          </Pill.Group>
          <PillsInput.Field placeholder="Add tag…" />
        </PillsInput>
      ))}
    </Box>
  ),
};

/** Variant × size matrix for visual regression across all combinations. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$xl">
      {VARIANTS.map((variant) => (
        <Box key={variant} gap="$md">
          <Text fontSize="$xs" color="$color11">
            {variant}
          </Text>
          <Box gap="$sm">
            {SIZES.map((size) => (
              <PillsInput key={size} variant={variant} size={size}>
                <Pill.Group>
                  <Pill>tag</Pill>
                </Pill.Group>
                <PillsInput.Field placeholder={`${variant} / ${size}`} />
              </PillsInput>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

/** With a label, description, and asterisk — full input wrapper chrome. */
export const WithLabel: Story = {
  render: (args) => (
    <Box width={320}>
      <PillsInput
        {...args}
        label="Technologies"
        description="Add the technologies used in this project."
        withAsterisk
      >
        <Pill.Group>
          <Pill withRemoveButton>react</Pill>
          <Pill withRemoveButton>typescript</Pill>
        </Pill.Group>
        <PillsInput.Field placeholder="Add technology…" />
      </PillsInput>
    </Box>
  ),
};

/** Error state — displays an error message and applies error styling to the frame. */
export const WithError: Story = {
  render: (args) => (
    <Box width={320}>
      <PillsInput {...args} label="Tags" error="At least one tag is required.">
        <PillsInput.Field placeholder="Add tag…" />
      </PillsInput>
    </Box>
  ),
};

/** Loading state — a spinner stands in for a section; position via `loadingPosition`. */
export const Loading: Story = {
  render: (args) => (
    <Box gap="$lg" width={320}>
      <PillsInput {...args} label="Loading right" loading loadingPosition="right">
        <Pill.Group>
          <Pill withRemoveButton>react</Pill>
        </Pill.Group>
        <PillsInput.Field placeholder="Add tag…" />
      </PillsInput>
      <PillsInput {...args} label="Loading left" loading loadingPosition="left">
        <Pill.Group>
          <Pill withRemoveButton>react</Pill>
        </Pill.Group>
        <PillsInput.Field placeholder="Add tag…" />
      </PillsInput>
    </Box>
  ),
};

/** Disabled state — the shell and all child pills and the field are inert. */
export const Disabled: Story = {
  render: (args) => (
    <Box width={320}>
      <PillsInput {...args} label="Tags" disabled>
        <Pill.Group>
          <Pill>react</Pill>
          <Pill>jest</Pill>
        </Pill.Group>
        <PillsInput.Field placeholder="Add tag…" />
      </PillsInput>
    </Box>
  ),
};

/** Left and right sections hold icons or adornments within the chrome frame. */
export const WithSections: Story = {
  render: (args) => (
    <Box width={320}>
      <PillsInput
        {...args}
        label="Tags"
        leftSection={<Text>⭐</Text>}
        rightSection={<Text>🔍</Text>}
      >
        <Pill.Group>
          <Pill withRemoveButton>react</Pill>
        </Pill.Group>
        <PillsInput.Field placeholder="Add tag…" />
      </PillsInput>
    </Box>
  ),
};

/** Controlled — the pill list is owned by the parent; type and press Enter to add. */
export const Controlled: Story = {
  render: (args) => {
    const [tags, setTags] = React.useState(["react", "typescript"]);
    const [inputValue, setInputValue] = React.useState("");

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter" && inputValue.trim()) {
        setTags((prev) => [...prev, inputValue.trim()]);
        setInputValue("");
      }
      if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
      }
    }

    return (
      <Box width={320} gap="$sm">
        <PillsInput {...args} label="Tags" description="Press Enter to add, Backspace to remove.">
          <Pill.Group>
            {tags.map((tag) => (
              <Pill
                key={tag}
                withRemoveButton
                onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
              >
                {tag}
              </Pill>
            ))}
          </Pill.Group>
          <PillsInput.Field
            placeholder="Add tag…"
            value={inputValue}
            onChangeText={setInputValue}
            onKeyDown={handleKeyDown}
          />
        </PillsInput>
        <Text fontSize="$xs" color="$color11">
          tags: {tags.join(", ") || "—"}
        </Text>
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `root` frame, `label` and `leftSection`. */
export const Styles: Story = {
  render: (args) => (
    <Box width={320}>
      <PillsInput
        {...args}
        label="Styled tags"
        leftSection={<Text>⭐</Text>}
        styles={{
          root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
          label: { color: "$blue11" },
          leftSection: { backgroundColor: "$red9" },
        }}
      >
        <Pill.Group>
          <Pill withRemoveButton>react</Pill>
        </Pill.Group>
        <PillsInput.Field placeholder="Add tag…" />
      </PillsInput>
    </Box>
  ),
};

/** Hidden field type — collapses the editable area for non-searchable select scenarios. */
export const HiddenField: Story = {
  render: (args) => (
    <Box width={320}>
      <PillsInput {...args} label="Selected countries" pointer>
        <Pill.Group>
          <Pill withRemoveButton>Netherlands</Pill>
          <Pill withRemoveButton>Germany</Pill>
        </Pill.Group>
        <PillsInput.Field type="hidden" />
      </PillsInput>
    </Box>
  ),
};
