import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Button, Stack, Text, TextInput } from "@knitui/components";

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
    <Text fontSize="xl" fontWeight="700">
      {children}
    </Text>
  );
}

function DemoContent({ lines = 6 }: { lines?: number }) {
  return (
    <Stack gap="sm" padding="lg">
      <Title>Sheet title</Title>
      {Array.from({ length: lines }, (_, i) => (
        <Text key={i} color="color11">
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
          <Sheet.Handle backgroundColor="blue9" width={64} height={6} />
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

/**
 * A fixed header + footer via the `Sheet.Header` / `Sheet.Footer` markers. Both
 * stay pinned (below the handle / above the bottom edge) while the
 * `Sheet.ScrollView` between them scrolls independently — the scroll region is
 * squeezed between the two fixed bars.
 */
export const WithHeaderAndFooter: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open sheet with header + footer</Button>
        <Sheet opened={opened} onClose={() => setOpened(false)} snapPoints={[80, 40]}>
          <Sheet.Header>
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              paddingVertical="xs"
            >
              <Title>Header</Title>
              <Button size="sm" variant="subtle" onPress={() => setOpened(false)}>
                Close
              </Button>
            </Box>
          </Sheet.Header>
          <Sheet.Frame>
            <Sheet.ScrollView>
              <DemoContent lines={40} />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Footer>
            <Button fullWidth onPress={() => setOpened(false)}>
              Confirm
            </Button>
          </Sheet.Footer>
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
        <Stack flexDirection="row" gap="sm">
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
            <Box padding="lg" gap="md">
              <Title>Confirm</Title>
              <Text color="color11">This sheet only closes with the button below.</Text>
              <Button onPress={() => setOpened(false)}>Close</Button>
            </Box>
          </Sheet.Frame>
        </Sheet>
      </>
    );
  },
};

/** `snapPoints="fit"` hugs the content, and follows it when it changes height. */
export const FitContent: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    const [lines, setLines] = React.useState(2);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open fit sheet</Button>
        <Sheet
          opened={opened}
          onClose={() => setOpened(false)}
          snapPoints="fit"
          title="Fits its content"
          padded
          dismissOnSnapToBottom
          styles={{ root: { testID: "fit-frame" } }}
        >
          <Stack gap="sm">
            {Array.from({ length: lines }, (_, i) => (
              <Text key={i}>Line {i + 1}</Text>
            ))}
            <Button onPress={() => setLines((n) => (n === 2 ? 8 : 2))}>Change height</Button>
          </Stack>
        </Sheet>
      </>
    );
  },
};

/** A long list stops at `maxHeight` and scrolls above the pinned footer. */
export const FitWithMaxHeight: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open capped sheet</Button>
        <Sheet
          opened={opened}
          onClose={() => setOpened(false)}
          snapPoints="fit"
          maxHeight="70%"
          title="Capped at 70%"
        >
          <Sheet.ScrollView>
            <DemoContent lines={40} />
          </Sheet.ScrollView>
          <Sheet.Footer>
            <Button onPress={() => setOpened(false)}>Done</Button>
          </Sheet.Footer>
        </Sheet>
      </>
    );
  },
};

/** The footer sits on the panel's visible bottom edge at every snap. */
export const PinnedFooter: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open with footer</Button>
        <Sheet
          opened={opened}
          onClose={() => setOpened(false)}
          snapPoints={[85, 40]}
          title="Resting at each snap"
          closeButtonProps={{ "aria-label": "Close the list" }}
        >
          <Sheet.ScrollView>
            <DemoContent lines={40} />
          </Sheet.ScrollView>
          <Sheet.Footer>
            <Button onPress={() => setOpened(false)}>Done</Button>
          </Sheet.Footer>
        </Sheet>
      </>
    );
  },
};

/** New snap points move an open panel without a `snapTo` call. */
export const ChangingSnapPoints: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    const [tall, setTall] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open</Button>
        <Sheet
          opened={opened}
          onClose={() => setOpened(false)}
          snapPoints={[tall ? 80 : 40]}
          padded
        >
          <Button onPress={() => setTall((t) => !t)}>Change the snap point</Button>
        </Sheet>
      </>
    );
  },
};

/** The whole panel rides above the keyboard (native), and the list shrinks to fit. */
export const WithKeyboard: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open with a field</Button>
        <Sheet opened={opened} onClose={() => setOpened(false)} snapPoints={[85, 40]} title="Reply">
          <Sheet.ScrollView keyboardShouldPersistTaps="handled">
            <DemoContent lines={20} />
          </Sheet.ScrollView>
          <Sheet.Footer>
            <TextInput placeholder="Write a reply" aria-label="Reply" />
          </Sheet.Footer>
        </Sheet>
      </>
    );
  },
};

/** A persistent sheet leaves the page behind it free to take touches. */
export const Persistent: Story = {
  render: () => {
    const [position, setPosition] = React.useState(1);
    return (
      <Sheet
        opened
        modal={false}
        withOverlay={false}
        trapFocus={false}
        closeOnEscape={false}
        snapPoints={[85, 40, 12]}
        position={position}
        onPositionChange={setPosition}
        aria-label="Results"
      >
        <Sheet.ScrollView>
          <DemoContent lines={40} />
        </Sheet.ScrollView>
      </Sheet>
    );
  },
};

/** `Sheet.FlatList` gives a virtualized list the same scroll handoff. */
export const VirtualizedList: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    const rows = React.useMemo(() => Array.from({ length: 500 }, (_, i) => `Row ${i + 1}`), []);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open 500 rows</Button>
        <Sheet opened={opened} onClose={() => setOpened(false)} snapPoints={[85, 40]}>
          <Sheet.FlatList
            data={rows}
            keyExtractor={(row) => row}
            renderItem={({ item }) => (
              <Box padding="sm">
                <Text>{item}</Text>
              </Box>
            )}
          />
        </Sheet>
      </>
    );
  },
};

/** `maxWidth` centres the panel on tablets and wide windows. */
export const CentredOnWideScreens: Story = {
  render: () => {
    const [opened, setOpened] = React.useState(false);
    return (
      <>
        <Button onPress={() => setOpened(true)}>Open centred</Button>
        <Sheet
          opened={opened}
          onClose={() => setOpened(false)}
          snapPoints="fit"
          maxWidth={480}
          title="Centred"
          padded
          styles={{ root: { testID: "wide-frame" } }}
        >
          <Text>The panel stops at 480px.</Text>
        </Sheet>
      </>
    );
  },
};

/** Two modal sheets: Escape and Android back close the topmost first. */
export const Stacked: Story = {
  render: () => {
    const [first, setFirst] = React.useState(false);
    const [second, setSecond] = React.useState(false);
    return (
      <>
        <Button onPress={() => setFirst(true)}>Open first</Button>
        <Sheet
          opened={first}
          onClose={() => setFirst(false)}
          snapPoints={[70]}
          title="First"
          padded
        >
          <Button onPress={() => setSecond(true)}>Open second</Button>
        </Sheet>
        <Sheet
          opened={second}
          onClose={() => setSecond(false)}
          snapPoints={[40]}
          title="Second"
          padded
        >
          <Text>On top</Text>
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
            root: { backgroundColor: "blue2" },
            overlay: { backgroundColor: "#1a1a2e", backgroundOpacity: 0.75 },
            handle: { backgroundColor: "blue8" },
          }}
        >
          <DemoContent />
        </Sheet>
      </>
    );
  },
};
