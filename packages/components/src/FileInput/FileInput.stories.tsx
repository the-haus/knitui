import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { FileInput, type FileInputValue } from "./FileInput";

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/FileInput",
  component: FileInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'FileInput opens the native file picker and displays the picked file name(s). Built on `FileButton` + `InputBase component="button"`. Supports single and multiple file selection, a clearable value, a custom value renderer, and imperatively clearing via `resetRef`.',
      },
    },
  },
  args: {
    placeholder: "Pick a file",
    size: "sm",
    clearable: false,
    multiple: false,
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding, radius and font size.",
    },
    clearable: {
      control: "boolean",
      description: "Show a clear button in the right section when a file is picked.",
    },
    multiple: {
      control: "boolean",
      description: "Allow picking more than one file.",
    },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    accept: {
      control: "text",
      description: 'Accepted MIME types / extensions, e.g. "image/png,image/jpeg".',
    },
    placeholder: { control: "text" },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    valueComponent: { control: false },
    clearButtonProps: { control: false },
    fileInputProps: { control: false },
    resetRef: { control: false },
  },
} satisfies Meta<typeof FileInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof FileInput>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** The five sizes, from xs to xl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md">
      {SIZES.map((size) => (
        <FileInput key={size} {...args} size={size} placeholder={`Size: ${size}`} />
      ))}
    </Box>
  ),
};

/** The inherited `shadow` elevation ladder, from `xs` to `xl`. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$xl">
      {SHADOWS.map((shadow) => (
        <FileInput key={shadow} {...args} shadow={shadow} placeholder={`Shadow: ${shadow}`} />
      ))}
    </Box>
  ),
};

/** Disabled state — the picker cannot be opened and reduced opacity is applied. */
export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "No file chosen",
  },
};

/** ReadOnly state — the trigger renders but the picker will not open. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    placeholder: "Read-only field",
  },
};

/** Clearable — a clear button appears in the right section once a file is selected. */
export const Clearable: Story = {
  args: {
    clearable: true,
    placeholder: "Pick a file — then clear it",
  },
};

/** Multiple selection — comma-joined file names are displayed by default. */
export const Multiple: Story = {
  args: {
    multiple: true,
    placeholder: "Pick one or more files",
    clearable: true,
  },
};

/** Accept filter — restricts the native picker to image files only. */
export const AcceptImages: Story = {
  args: {
    accept: "image/png,image/jpeg,image/gif,image/webp",
    placeholder: "Pick an image (PNG, JPEG, GIF, WebP)",
    clearable: true,
  },
};

/** With label, description, and error — demonstrates the full InputBase field layout. */
export const WithLabelAndError: Story = {
  args: {
    label: "Attachment",
    description: "Accepted formats: PDF, DOCX, TXT (max 5 MB).",
    error: "File exceeds the 5 MB limit.",
    accept: ".pdf,.docx,.txt",
    placeholder: "Choose a file…",
  },
};

/** Custom value renderer — replaces the default file-name text with a bespoke component. */
export const CustomValueComponent: Story = {
  args: {
    placeholder: "Pick any file",
    clearable: true,
    valueComponent: ({ value }: { value: FileInputValue }) => {
      if (!value) return null;
      const files = Array.isArray(value) ? value : [value];
      return (
        <Box flexDirection="row" gap="$xs" alignItems="center">
          <Text>📄</Text>
          <Text>{files.map((f) => f.name).join(", ")}</Text>
          <Text opacity={0.5}>
            ({files.length} file{files.length !== 1 ? "s" : ""})
          </Text>
        </Box>
      );
    },
  },
};

/** Controlled — value and onChange are fully managed by the parent; demonstrates resetRef usage. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<FileInputValue>(null);
    const resetRef = React.useRef<() => void>(null);

    const handleClear = () => {
      setValue(null);
      resetRef.current?.();
    };

    return (
      <Box flexDirection="column" gap="$md" width={320}>
        <FileInput
          {...args}
          value={value}
          onChange={setValue}
          resetRef={resetRef}
          placeholder="Pick a file"
          clearable
          label="Controlled file input"
        />
        <Box flexDirection="row" gap="$sm">
          <Text>
            Selected:{" "}
            {value
              ? Array.isArray(value)
                ? value.map((f) => f.name).join(", ")
                : value.name
              : "none"}
          </Text>
        </Box>
        <Text onPress={handleClear} style={{ textDecorationLine: "underline", cursor: "pointer" }}>
          Reset imperatively
        </Text>
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `root`, `label`, and `placeholder`. */
export const Styles: Story = {
  args: {
    label: "Attachment",
    placeholder: "Pick a file",
    styles: {
      root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
      label: { color: "$red9", fontWeight: "700" },
      placeholder: { color: "$blue9" },
    },
  },
};
