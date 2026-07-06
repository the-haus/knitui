import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Button, Stack, Text } from "@knitui/components";

import { Sheet } from "./Sheet";

/**
 * Stories for `@knitui/sheet`. Each renders a trigger button; the sheet teleports
 * to the Provider's root host (modal mode) and slides up. Drag the handle / panel
 * to move between snap points; tap the scrim or press Escape to close.
 *
 * NOTE: under Storybook's Vite tooling the panel animates via the imperative web
 * painter (reanimated's worklet plugin doesn't run here) — see README. Authored
 * in CSF3 (`StoryObj` with `render`) so the @knitui/demo gallery picks them up.
 */
const meta: Meta<typeof Sheet> = {
  title: "Sheet",
  component: Sheet,
};
export default meta;

type Story = StoryObj<typeof Sheet>;

function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="$xl" fontWeight="700">
      {children}
    </Text>
  );
}

function DemoContent({ lines = 6 }: { lines?: number }) {
  return (
    <Stack gap="$sm" padding="$lg">
      <Title>Sheet title</Title>
      {Array.from({ length: lines }, (_, i) => (
        <Text key={i} color="$color11">
          Drag the handle to cycle snap points, or fling down to dismiss. Row {i + 1}.
        </Text>
      ))}
    </Stack>
  );
}

/** The default two-snap sheet ([80, 10]) with a handle. */
export const Default: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open sheet</Button>
        <Sheet opened={opened} onClose={() => setOpened(false)}>
          <DemoContent />
        </Sheet>
      </>
    );
  },
};

/** Three snap points; dismissible by flinging past the lowest. */
export const SnapPoints: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open (90 / 50 / 25)</Button>
        <Sheet
          opened={opened}
          onClose={() => setOpened(false)}
          snapPoints={[90, 50, 25]}
          dismissOnSnapToBottom
        >
          <DemoContent lines={12} />
        </Sheet>
      </>
    );
  },
};

/** A custom handle via the `Sheet.Handle` marker. */
export const CustomHandle: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open with custom handle</Button>
        <Sheet opened={opened} onClose={() => setOpened(false)}>
          <Sheet.Handle backgroundColor="$blue9" width={64} height={6} />
          <Sheet.Frame>
            <DemoContent />
          </Sheet.Frame>
        </Sheet>
      </>
    );
  },
};

/**
 * Scrollable content inside the panel via `Sheet.ScrollView`, exercising the
 * scroll↔drag handoff (native): at the top snap the list scrolls; drag it back to
 * the top and keep pulling down and the sheet takes over (collapses to 40 %, then
 * dismisses). From the 40 % snap a drag moves the sheet, not the list.
 */
export const WithScrollView: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open scrollable sheet</Button>
        <Sheet
          opened={opened}
          onClose={() => setOpened(false)}
          snapPoints={[80, 40]}
          dismissOnSnapToBottom
        >
          <Sheet.Frame>
            <Sheet.ScrollView>
              <DemoContent lines={40} />
            </Sheet.ScrollView>
          </Sheet.Frame>
        </Sheet>
      </>
    );
  },
};

/** Top-corner rounding scale. */
export const Sizes: Story = {
  render: () => {
    const [size, setSize] = React.useState<"sm" | "md" | "lg" | "xl" | null>(null);
    return (
      <>
        <Stack flexDirection="row" gap="$sm">
          {(["sm", "md", "lg", "xl"] as const).map((sz) => (
            <Button key={sz} onPress={() => setSize(sz)}>
              {sz}
            </Button>
          ))}
        </Stack>
        <Sheet opened={size !== null} onClose={() => setSize(null)} size={size ?? "lg"}>
          <DemoContent />
        </Sheet>
      </>
    );
  },
};

/** Per-slot `styles` overrides (root / overlay / handle). */
export const Styles: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open styled sheet</Button>
        <Sheet
          opened={opened}
          onClose={() => setOpened(false)}
          styles={{
            root: { backgroundColor: "$blue2" },
            overlay: { backgroundColor: "#1a1a2e", backgroundOpacity: 0.75 },
            handle: { backgroundColor: "$blue8" },
          }}
        >
          <DemoContent />
        </Sheet>
      </>
    );
  },
};

/** Non-dismissible (no overlay press / snap-to-bottom); close via a button. */
export const ControlledOnly: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open (button-close only)</Button>
        <Sheet
          opened={opened}
          onClose={() => setOpened(false)}
          dismissOnOverlayPress={false}
          snapPoints={[60]}
        >
          <Sheet.Frame>
            <Box padding="$lg" gap="$md">
              <Title>Confirm</Title>
              <Text color="$color11">This sheet only closes with the button below.</Text>
              <Button onPress={() => setOpened(false)}>Close</Button>
            </Box>
          </Sheet.Frame>
        </Sheet>
      </>
    );
  },
};
