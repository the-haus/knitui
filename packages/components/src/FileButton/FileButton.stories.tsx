import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { FileButton } from "./FileButton";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/FileButton",
  component: FileButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'FileButton opens the native file picker from any trigger you render. A render-prop `children` receives `{ onClick }`, and the picked `File` or `File[]` is delivered through `onChange`. The actual `<input type="file">` is hidden. Use `resetRef` to imperatively clear the selection.',
      },
    },
  },
  args: {
    onChange: () => {},
    children: ({ onClick }: { onClick: () => void }) => (
      <Button onClick={onClick}>Select file</Button>
    ),
    disabled: false,
    multiple: false,
  },
  argTypes: {
    accept: {
      control: "text",
      description: 'MIME type filter, e.g. `"image/png,image/jpeg"`.',
    },
    multiple: {
      control: "boolean",
      description: "Allow selecting more than one file at once.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the picker — the render-prop onClick becomes a no-op.",
    },
    capture: {
      control: "select",
      options: [undefined, true, "user", "environment"],
      description: "Request a fresh capture from a device camera or microphone.",
    },
    name: { control: "text" },
    form: { control: "text" },
    onChange: { control: false },
    children: { control: false },
    resetRef: { control: false },
    inputProps: { control: false },
  },
} satisfies Meta<typeof FileButton>;

export default meta;

type Story = StoryObj<ComponentProps<typeof FileButton>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/**
 * The `shadow` elevation ladder applied to the render-prop `Button` trigger, from `xs` to `xl`.
 */
export const Shadows: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <FileButton key={shadow} onChange={() => {}}>
          {({ onClick }) => (
            <Button onClick={onClick} shadow={shadow}>
              {shadow}
            </Button>
          )}
        </FileButton>
      ))}
    </Box>
  ),
};

/** Disabled state — the trigger is rendered but clicking it does nothing. */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: ({ onClick }: { onClick: () => void }) => (
      <Button disabled onClick={onClick}>
        Select file
      </Button>
    ),
  },
};

/** Multiple selection — onChange receives a File[] instead of a single File | null. */
export const Multiple: Story = {
  render: () => {
    const [files, setFiles] = React.useState<File[]>([]);
    return (
      <Box gap="$md" alignItems="flex-start">
        <FileButton multiple onChange={setFiles}>
          {({ onClick }) => (
            <Button onClick={onClick}>
              <Text>📂</Text> Select multiple files
            </Button>
          )}
        </FileButton>
        {files.length > 0 ? (
          <Box gap="$xs">
            {files.map((f) => (
              <Text key={f.name} fontSize="$sm">
                {f.name}
              </Text>
            ))}
          </Box>
        ) : (
          <Text fontSize="$sm" color="$color10">
            No files selected
          </Text>
        )}
      </Box>
    );
  },
};

/** Accept filter — restricts the picker to image files only via the accept prop. */
export const AcceptImages: Story = {
  args: {
    accept: "image/png,image/jpeg,image/webp",
    children: ({ onClick }: { onClick: () => void }) => (
      <Button onClick={onClick} variant="light">
        <Text>🖼</Text> Upload image
      </Button>
    ),
  },
};

/** Controlled with reset — shows the selected filename and lets the user clear the input via resetRef. */
export const WithReset: Story = {
  render: () => {
    const [file, setFile] = React.useState<File | null>(null);
    const resetRef = React.useRef<() => void>(null);

    const handleClear = () => {
      setFile(null);
      resetRef.current?.();
    };

    return (
      <Box gap="$md" alignItems="flex-start">
        <Box flexDirection="row" gap="$sm" alignItems="center" flexWrap="wrap">
          <FileButton onChange={setFile} resetRef={resetRef}>
            {({ onClick }) => <Button onClick={onClick}>Choose file</Button>}
          </FileButton>
          {file && (
            <Button variant="subtle" onClick={handleClear}>
              Clear
            </Button>
          )}
        </Box>
        <Text fontSize="$sm" color="$color10">
          {file ? `Selected: ${file.name}` : "No file selected"}
        </Text>
      </Box>
    );
  },
};

/** Custom trigger — any element can act as the trigger, not just a Button. */
export const CustomTrigger: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <FileButton onChange={() => {}}>
        {({ onClick }) => (
          <Box
            render="button"
            onClick={onClick}
            borderWidth={2}
            borderStyle="dashed"
            borderColor="$color8"
            borderRadius="$md"
            padding="$lg"
            style={{ cursor: "pointer" }}
            alignItems="center"
            gap="$xs"
            hoverStyle={{ borderColor: "$color10", backgroundColor: "$color2" }}
          >
            <Text fontSize="$xl">⭐</Text>
            <Text fontSize="$sm" color="$color10">
              Click to upload
            </Text>
          </Box>
        )}
      </FileButton>
    </Box>
  ),
};

/** Capture — requests a direct camera or microphone capture on supported devices. */
export const Capture: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <FileButton onChange={() => {}} capture="user" accept="image/*">
        {({ onClick }) => (
          <Button onClick={onClick} variant="outline">
            <Text>📷</Text> Front camera
          </Button>
        )}
      </FileButton>
      <FileButton onChange={() => {}} capture="environment" accept="image/*">
        {({ onClick }) => (
          <Button onClick={onClick} variant="outline">
            <Text>📸</Text> Rear camera
          </Button>
        )}
      </FileButton>
    </Box>
  ),
};
