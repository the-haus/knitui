import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { Modal } from "./Modal";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

/**
 * Every story drives the modal through a local `opened` state and a trigger
 * button. A modal renders into a full-screen portal layer, so without a trigger
 * a story would either show nothing (`opened` defaults to `false`) or cover the
 * whole gallery. The trigger pattern makes each story self-contained and lets
 * the shared `@knitui/demo` gallery (web + Expo) render them faithfully.
 */
const meta = {
  title: "Overlays/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Modal is an overlay dialog composed of `Modal.Content`, `Modal.Header`, `Modal.Title`, `Modal.Body`, and `Modal.CloseButton`. Pass `opened` and `onClose` to control visibility. `size` sets the content width, `centered` vertically centres the panel, and `fullScreen` expands it to fill the viewport. `padding` tunes the inner spacing, `withHeaderDivider` separates a pinned header from a scrolling body, and `closeButtonProps` fully customises the close control. Behaviour knobs (`closeOnEscape`, `closeOnClickOutside`, `lockScroll`, `trapFocus`, `returnFocus`, `keepMounted`) mirror Mantine. The body scrolls automatically when its content is taller than the viewport while the header stays pinned.",
      },
    },
  },
  args: {
    opened: false,
    title: "Modal title",
    children: "Modal body content goes here.",
    size: "md",
    shadow: "xl",
    centered: false,
    fullScreen: false,
    withCloseButton: true,
    withHeaderDivider: false,
    withOverlay: true,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Content width — key (xxs–xxl), px number, or CSS string.",
    },
    shadow: {
      control: "inline-radio",
      options: SIZES,
      description: "Drop-shadow elevation of the content panel (xxs–xxl).",
    },
    centered: {
      control: "boolean",
      description: "Center the content vertically inside the viewport.",
    },
    fullScreen: {
      control: "boolean",
      description: "Expand the modal to fill the entire screen.",
    },
    withCloseButton: {
      control: "boolean",
      description: "Show the close button in the header.",
    },
    withHeaderDivider: {
      control: "boolean",
      description: "Render a hairline divider under the header.",
    },
    withOverlay: {
      control: "boolean",
      description: "Render a dimmed backdrop behind the modal.",
    },
    title: { control: "text" },
    children: { control: "text" },
    radius: { control: "text", description: "Content corner radius." },
    padding: { control: "text", description: "Inner spacing for the header and body." },
    yOffset: { control: "text", description: "Vertical gap from viewport edges." },
    xOffset: { control: "text", description: "Horizontal gap from viewport edges." },
    closeOnEscape: { control: "boolean" },
    closeOnClickOutside: { control: "boolean" },
    keepMounted: { control: "boolean", description: "Keep mounted while closed." },
    trapFocus: { control: "boolean", description: "Trap keyboard focus while opened (web)." },
    lockScroll: { control: "boolean", description: "Lock body scroll while opened (web)." },
    onClose: { action: "onClose" },
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Modal>>;

/** A reusable trigger button + controlled modal, so each story actually opens. */
function ModalDemo({
  label = "Open modal",
  ...props
}: ComponentProps<typeof Modal> & { label?: string }) {
  const [opened, setOpened] = React.useState(false);
  return (
    <Box gap="$md" alignItems="center">
      <Button onPress={() => setOpened(true)} variant="default">
        {label}
      </Button>
      <Modal {...props} opened={opened} onClose={() => setOpened(false)} />
    </Box>
  );
}

/** The interactive playground — open the modal and tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => <ModalDemo {...args} />,
};

/** A controlled trigger — press the button to open, close button or backdrop to dismiss. */
export const Trigger: Story = {
  render: (args) => (
    <ModalDemo {...args} title="Controlled modal">
      <Text>Press the close button or click the backdrop to dismiss.</Text>
    </ModalDemo>
  ),
};

/** All seven content widths shown via a controlled trigger for each size. */
export const Sizes: Story = {
  args: { radius: "20" },
  render: () => {
    const [openSize, setOpenSize] = React.useState<(typeof SIZES)[number] | null>(null);
    return (
      <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
        {SIZES.map((size) => (
          <Button key={size} onPress={() => setOpenSize(size)} variant="default">
            Open {size}
          </Button>
        ))}
        <Modal
          opened={openSize !== null}
          onClose={() => setOpenSize(null)}
          title={`Size: ${openSize ?? "md"}`}
          size={openSize ?? "md"}
        >
          <Text>This modal uses the "{openSize ?? "md"}" size preset.</Text>
        </Modal>
      </Box>
    );
  },
};

/** Each shadow elevation step (xxs–xxl) on the content panel. */
export const Shadows: Story = {
  render: () => {
    const [openShadow, setOpenShadow] = React.useState<(typeof SIZES)[number] | null>(null);
    return (
      <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
        {SIZES.map((shadow) => (
          <Button key={shadow} onPress={() => setOpenShadow(shadow)} variant="default">
            Shadow {shadow}
          </Button>
        ))}
        <Modal
          opened={openShadow !== null}
          onClose={() => setOpenShadow(null)}
          title={`Shadow: ${openShadow ?? "xl"}`}
          shadow={openShadow ?? "xl"}
          centered
        >
          <Text>This panel uses the "{openShadow ?? "xl"}" shadow elevation.</Text>
        </Modal>
      </Box>
    );
  },
};

/** Vertically centred in the viewport — useful for confirmation dialogs. */
export const Centered: Story = {
  render: (args) => (
    <ModalDemo {...args} label="Open centered" centered title="Centered modal">
      <Text>This panel is vertically centred in the viewport.</Text>
    </ModalDemo>
  ),
};

/** Full-screen mode — no radius, no padding offset, fills the entire viewport. */
export const FullScreen: Story = {
  render: (args) => (
    <ModalDemo {...args} label="Open full-screen" fullScreen title="Full-screen modal">
      <Text>This modal fills the entire screen — no radius and no viewport offset.</Text>
    </ModalDemo>
  ),
};

/** Close button hidden — the caller is responsible for dismissal. */
export const WithoutCloseButton: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      label="Open (no close button)"
      withCloseButton={false}
      title="No close button"
    >
      <Text>Click the backdrop or press Escape to dismiss this modal.</Text>
    </ModalDemo>
  ),
};

/** Custom aria-label on the close button for screen-reader users. */
export const CustomCloseLabel: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      label="Open (custom close label)"
      title="Custom aria-label"
      closeButtonProps={{ "aria-label": "Dismiss dialog" }}
    >
      <Text>The close button is labelled "Dismiss dialog" for assistive technology.</Text>
    </ModalDemo>
  ),
};

/** Long content scrolls inside the body while the header stays pinned. */
export const ScrollableBody: Story = {
  render: (args) => (
    <ModalDemo {...args} label="Open long modal" title="Terms & conditions">
      <Box gap="$sm">
        {Array.from({ length: 18 }, (_, i) => (
          <Text key={i} color="$color11">
            {i + 1}. This is a long paragraph of body content used to demonstrate that the modal
            body scrolls vertically when it is taller than the viewport, while the header and close
            button remain pinned in place.
          </Text>
        ))}
      </Box>
    </ModalDemo>
  ),
};

/** Compound API — compose Modal.Header, Modal.Title, and Modal.Body directly. */
export const CompoundAPI: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box gap="$md" alignItems="center">
        <Button onPress={() => setOpened(true)} variant="default">
          Open (compound)
        </Button>
        <Modal
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          title={undefined}
          withCloseButton={false}
          aria-labelledby="custom-modal-title"
        >
          <Modal.Header>
            <Modal.Title id="custom-modal-title">Custom header</Modal.Title>
            <Modal.CloseButton onPress={() => setOpened(false)} aria-label="Close" />
          </Modal.Header>
          <Modal.Body>
            <Box gap="$sm">
              <Text fontWeight="600">Composed manually</Text>
              <Text color="$color11">
                Use Modal.Content, Modal.Header, Modal.Title, and Modal.Body to build fully custom
                layouts while keeping the accessibility wiring intact.
              </Text>
            </Box>
          </Modal.Body>
        </Modal>
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `overlay`, `content`, and `title`. */
export const Styles: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      label="Open (styled)"
      title="Styled modal"
      styles={{
        overlay: { backgroundColor: "$blue3" },
        content: { borderColor: "$blue9", borderWidth: 2 },
        title: { color: "$blue11" },
      }}
    >
      <Text>The overlay, content border, and title are styled via the per-slot `styles` map.</Text>
    </ModalDemo>
  ),
};

/** A hairline divider separates the pinned header from a scrolling body. */
export const WithHeaderDivider: Story = {
  render: (args) => (
    <ModalDemo {...args} label="Open (header divider)" title="Terms & conditions" withHeaderDivider>
      <Box gap="$sm">
        {Array.from({ length: 14 }, (_, i) => (
          <Text key={i} color="$color11">
            {i + 1}. Scroll the body — the header stays pinned with a divider beneath it.
          </Text>
        ))}
      </Box>
    </ModalDemo>
  ),
};

/** Roomier `padding` on the header and body for a more spacious layout. */
export const CustomPadding: Story = {
  render: (args) => (
    <ModalDemo {...args} label="Open (roomy padding)" padding="$xl" title="Spacious modal">
      <Text>The header and body use `padding=&quot;$xl&quot;` for extra breathing room.</Text>
    </ModalDemo>
  ),
};

/** The close control is fully customisable via `closeButtonProps` — here a larger, rounded button. */
export const CustomCloseButton: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      label="Open (custom close)"
      title="Custom close button"
      closeButtonProps={{ size: "lg", radius: "xl", variant: "light" }}
    >
      <Text>The close button uses a larger size, pill radius, and the light variant.</Text>
    </ModalDemo>
  ),
};

/** No backdrop — the modal floats over the page without dimming it. */
export const NoOverlay: Story = {
  render: (args) => (
    <ModalDemo {...args} label="Open (no overlay)" withOverlay={false} title="No overlay">
      <Text>There is no dimmed scrim — press Escape or the close button to dismiss.</Text>
    </ModalDemo>
  ),
};

/** A non-dismissable dialog — escape and backdrop clicks are disabled; only an explicit action closes it. */
export const NonDismissable: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box gap="$md" alignItems="center">
        <Button onPress={() => setOpened(true)} variant="default">
          Open (must confirm)
        </Button>
        <Modal
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          title="Action required"
          withCloseButton={false}
          closeOnEscape={false}
          closeOnClickOutside={false}
          centered
          size="sm"
        >
          <Box gap="$md">
            <Text color="$color11">
              You must make a choice — the backdrop and Escape key will not dismiss this dialog.
            </Text>
            <Box flexDirection="row" gap="$sm" justifyContent="flex-end">
              <Button variant="default" onPress={() => setOpened(false)}>
                Decline
              </Button>
              <Button variant="filled" onPress={() => setOpened(false)}>
                Accept
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    );
  },
};

/** Rich body content — a confirmation dialog with actions. */
export const WithRichContent: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center">
        <Button variant="filled" theme="red" onPress={() => setOpened(true)}>
          Delete item
        </Button>
        <Modal
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          title="Confirm delete"
          size="sm"
          centered
        >
          <Box gap="$md">
            <Text color="$color11">
              Are you sure you want to delete this item? This action cannot be undone.
            </Text>
            <Box flexDirection="row" gap="$sm" justifyContent="flex-end">
              <Button variant="default" onPress={() => setOpened(false)}>
                Cancel
              </Button>
              <Button variant="filled" theme="red" onPress={() => setOpened(false)}>
                Delete
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    );
  },
};

/**
 * Drag-to-dismiss (`dragToDismiss`) — flick the panel up to close it, the same
 * reanimated + gesture mechanic as `@knitui/sheet`. The CSS enter/exit motion is
 * unchanged; this only adds the interactive drag. Release past ~30% of the panel
 * height (or an upward fling) dismisses; a short drag springs back. A stationary
 * tap on the backdrop still dismisses.
 */
export const DragToDismiss: Story = {
  render: (args) => (
    <ModalDemo {...args} label="Open draggable modal" title="Drag me up" dragToDismiss>
      <Text>Drag this panel upward and release to dismiss it.</Text>
    </ModalDemo>
  ),
};
