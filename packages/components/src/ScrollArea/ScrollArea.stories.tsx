import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { ScrollArea } from "./ScrollArea";
import type { ScrollAreaHandle } from "./ScrollArea";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const ITEMS = Array.from({ length: 20 }, (_, i) => `Item ${i + 1} — ${LOREM.slice(0, 60)}`);

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Navigation/ScrollArea",
  component: ScrollArea,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ScrollArea is a scrollable viewport with **custom overlay scrollbars** that render and behave identically on web and React Native — the browser-native scrollbar is hidden and replaced by draggable thumbs we draw ourselves, so they are fully themeable. It mirrors Mantine's ScrollArea public API (`scrollbars`, `type`, `scrollbarSize`, `offsetScrollbars`, `scrollHideDelay`, `onScrollPositionChange`, `viewportRef`, `viewportProps`) and adds `scrollbarProps` / `thumbProps` / `cornerProps` styling hooks. Ships a `ScrollArea.Autosize` sub-component that grows with content up to a maximum height before scrolling.",
      },
    },
  },
  args: {
    scrollbars: "xy",
    type: "hover",
    scrollbarSize: 12,
    offsetScrollbars: false,
    scrollHideDelay: 1000,
    width: 320,
    height: 200,
  },
  argTypes: {
    scrollbars: {
      control: "select",
      options: ["x", "y", "xy", false],
      description: "Axes on which scrolling is enabled.",
    },
    type: {
      control: "select",
      options: ["hover", "auto", "always", "scroll", "never"],
      description:
        "Scrollbar visibility: `hover` (on hover/scroll), `scroll` (while scrolling), `auto` (whenever content overflows), `always`, or `never`.",
    },
    scrollbarSize: {
      control: { type: "range", min: 4, max: 24, step: 2 },
      description: "Scrollbar (thumb + rail) thickness in px.",
    },
    offsetScrollbars: {
      control: "boolean",
      description:
        "Reserve stable gutter space so content does not sit under the overlay scrollbar.",
    },
    scrollHideDelay: {
      control: { type: "number" },
      description: "Delay in ms before scrollbars hide in `hover` / `scroll` modes.",
    },
    onScrollPositionChange: { control: false },
    viewportRef: { control: false },
    viewportProps: { control: false },
    scrollbarProps: { control: false },
    thumbProps: { control: false },
    cornerProps: { control: false },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<ComponentProps<typeof ScrollArea>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <ScrollArea {...args}>
      {ITEMS.map((item) => (
        <Text key={item} paddingVertical="$xs">
          {item}
        </Text>
      ))}
    </ScrollArea>
  ),
};

/** Vertical-only scrolling — horizontal overflow is hidden. */
export const VerticalOnly: Story = {
  args: { scrollbars: "y", width: 320, height: 200 },
  render: (args) => (
    <ScrollArea {...args}>
      {ITEMS.map((item) => (
        <Text key={item} paddingVertical="$xs">
          {item}
        </Text>
      ))}
    </ScrollArea>
  ),
};

/** Horizontal-only scrolling — a wide single-line row of items. */
export const HorizontalOnly: Story = {
  args: { scrollbars: "x", width: 320, height: 80 },
  render: (args) => (
    <ScrollArea {...args}>
      <Box flexDirection="row" gap="$md" alignItems="center" flexWrap="nowrap">
        {Array.from({ length: 30 }, (_, i) => (
          <Box
            key={i}
            backgroundColor="$color5"
            borderRadius="$sm"
            padding="$sm"
            minWidth={80}
            alignItems="center"
          >
            <Text>{`Col ${i + 1}`}</Text>
          </Box>
        ))}
      </Box>
    </ScrollArea>
  ),
};

/** Both axes active — a wide, tall content area that scrolls in every direction. */
export const BothAxes: Story = {
  args: { scrollbars: "xy", width: 320, height: 200 },
  render: (args) => (
    <ScrollArea {...args}>
      {Array.from({ length: 20 }, (_, row) => (
        <Box key={row} flexDirection="row" gap="$md" flexWrap="nowrap">
          {Array.from({ length: 20 }, (_, col) => (
            <Box key={col} minWidth={60} padding="$xs">
              <Text>{`${row + 1}×${col + 1}`}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </ScrollArea>
  ),
};

/**
 * Elevation shadow ladder applied to the ScrollArea frame via the inherited
 * `shadow` prop. Distinct from `EdgeShadows`, which is the scroll-fade overlay.
 */
export const Shadows: Story = {
  args: { scrollbars: "y", width: 320, height: 160 },
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs" alignItems="center">
          <ScrollArea {...args} shadow={shadow}>
            {ITEMS.map((item) => (
              <Text key={item} paddingVertical="$xs">
                {item}
              </Text>
            ))}
          </ScrollArea>
          <Text fontSize="$xs" color="$color11">
            {shadow}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Thick scrollbar (16 px) vs. thin scrollbar (4 px) side by side. */
export const ScrollbarSizes: Story = {
  args: {
    type: "auto",
  },

  render: () => (
    <Box flexDirection="row" gap="$lg" alignItems="flex-start">
      <Box gap="$xs">
        <Text fontWeight="700">Thick (16 px)</Text>
        <ScrollArea scrollbars="y" scrollbarSize={16} width={200} height={160}>
          {ITEMS.slice(0, 10).map((item) => (
            <Text key={item} paddingVertical="$xs">
              {item}
            </Text>
          ))}
        </ScrollArea>
      </Box>
      <Box gap="$xs">
        <Text fontWeight="700">Thin (4 px)</Text>
        <ScrollArea scrollbars="y" scrollbarSize={4} width={200} height={160}>
          {ITEMS.slice(0, 10).map((item) => (
            <Text key={item} paddingVertical="$xs">
              {item}
            </Text>
          ))}
        </ScrollArea>
      </Box>
    </Box>
  ),
};

/** onScrollPositionChange — the current x/y offset is displayed in real time. */
export const ScrollPositionTracking: Story = {
  render: (args) => {
    const [pos, setPos] = React.useState({ x: 0, y: 0 });
    return (
      <Box gap="$md" alignItems="flex-start">
        <Text>
          <Text fontWeight="700">Scroll position: </Text>
          {`x=${pos.x}  y=${pos.y}`}
        </Text>
        <ScrollArea
          {...args}
          scrollbars="y"
          width={320}
          height={200}
          onScrollPositionChange={setPos}
        >
          {ITEMS.map((item) => (
            <Text key={item} paddingVertical="$xs">
              {item}
            </Text>
          ))}
        </ScrollArea>
      </Box>
    );
  },
};

/** ScrollArea.Autosize grows with its content until maxHeight is reached, then scrolls. */
export const Autosize: Story = {
  render: () => (
    <Box flexDirection="row" gap="$xl" alignItems="flex-start">
      <Box gap="$xs">
        <Text fontWeight="700">3 items (no scroll)</Text>
        <ScrollArea.Autosize maxHeight={200} width={240} scrollbars="y">
          {ITEMS.slice(0, 3).map((item) => (
            <Text key={item} paddingVertical="$xs">
              {item}
            </Text>
          ))}
        </ScrollArea.Autosize>
      </Box>
      <Box gap="$xs">
        <Text fontWeight="700">20 items (scrolls)</Text>
        <ScrollArea.Autosize maxHeight={200} width={240} scrollbars="y">
          {ITEMS.map((item) => (
            <Text key={item} paddingVertical="$xs">
              {item}
            </Text>
          ))}
        </ScrollArea.Autosize>
      </Box>
    </Box>
  ),
};

/**
 * Fully custom scrollbars — the rail, thumb and corner are styled via
 * `scrollbarProps`, `thumbProps` and `cornerProps`. These accept any `Box` prop,
 * so colour, radius, padding and even hover/press styles are yours to set.
 */
export const CustomScrollbars: Story = {
  args: { scrollbars: "xy", type: "always", scrollbarSize: 14, width: 320, height: 200 },
  render: (args) => (
    <ScrollArea
      {...args}
      scrollbarProps={{ backgroundColor: "$color3", borderRadius: "$sm" }}
      thumbProps={{
        backgroundColor: "$blue9",
        opacity: 1,
        hoverStyle: { backgroundColor: "$blue10" },
      }}
      cornerProps={{ backgroundColor: "$color3" }}
    >
      {Array.from({ length: 20 }, (_, row) => (
        <Box key={row} flexDirection="row" gap="$md" flexWrap="nowrap">
          {Array.from({ length: 20 }, (_, col) => (
            <Box key={col} minWidth={60} padding="$xs">
              <Text>{`${row + 1}×${col + 1}`}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </ScrollArea>
  ),
};

/**
 * `type` behaviours side by side — `always` (persistent), `hover` (on
 * hover/scroll), `scroll` (while scrolling only) and `never` (no scrollbars,
 * still scrolls).
 */
export const VisibilityTypes: Story = {
  render: () => (
    <Box flexDirection="row" gap="$lg" alignItems="flex-start" flexWrap="wrap">
      {(["always", "hover", "scroll", "never"] as const).map((t) => (
        <Box key={t} gap="$xs">
          <Text fontWeight="700">{t}</Text>
          <ScrollArea type={t} scrollbars="y" width={200} height={160}>
            {ITEMS.slice(0, 12).map((item) => (
              <Text key={item} paddingVertical="$xs">
                {item}
              </Text>
            ))}
          </ScrollArea>
        </Box>
      ))}
    </Box>
  ),
};

/**
 * Imperative handle — the forwarded `ref` is a `ScrollAreaHandle` exposing
 * `scrollTo`, `scrollToTop`, `scrollToBottom`, `scrollToEnd`, `scrollIntoView`,
 * `getViewport` and `getScrollPosition`.
 */
export const ImperativeControls: Story = {
  render: () => {
    const ref = React.useRef<ScrollAreaHandle>(null);
    return (
      <Box gap="$md" alignItems="flex-start">
        <Box flexDirection="row" gap="$xs" flexWrap="wrap">
          <Button size="xs" variant="default" onPress={() => ref.current?.scrollToTop(true)}>
            Top
          </Button>
          <Button size="xs" variant="default" onPress={() => ref.current?.scrollToBottom(true)}>
            Bottom
          </Button>
          <Button
            size="xs"
            variant="default"
            onPress={() =>
              ref.current?.scrollIntoView("#target", { animated: true, block: "center" })
            }
          >
            Reveal item 15
          </Button>
        </Box>
        <ScrollArea ref={ref} scrollbars="y" type="always" width={320} height={200}>
          {ITEMS.map((item, i) => (
            <Text key={item} id={i === 14 ? "target" : undefined} paddingVertical="$xs">
              {i === 14 ? `★ ${item}` : item}
            </Text>
          ))}
        </ScrollArea>
      </Box>
    );
  },
};

/**
 * Edge fade shadows — overlays fade in on each scrollable edge to hint at hidden
 * content, and fade out as you reach that edge. Driven by the `shadows` prop.
 */
export const EdgeShadows: Story = {
  args: { scrollbars: "xy", type: "hover", width: 320, height: 200 },
  render: (args) => (
    <ScrollArea {...args} shadows shadowSize={40}>
      {Array.from({ length: 24 }, (_, row) => (
        <Box key={row} flexDirection="row" gap="$md" flexWrap="nowrap">
          {Array.from({ length: 24 }, (_, col) => (
            <Box key={col} minWidth={64} padding="$sm">
              <Text>{`${row + 1}×${col + 1}`}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </ScrollArea>
  ),
};

/**
 * Infinite scroll — `onReachBottom` (with a `reachThreshold`) appends more items
 * as you approach the end. `onReachTop`/`onReachStart`/`onReachEnd`/`onScrollEnd`
 * round out the edge callbacks.
 */
export const InfiniteScroll: Story = {
  render: () => {
    const [count, setCount] = React.useState(20);
    const [loads, setLoads] = React.useState(0);
    return (
      <Box gap="$md" alignItems="flex-start">
        <Text>
          <Text fontWeight="700">Items: </Text>
          {`${count}  ·  loads: ${loads}`}
        </Text>
        <ScrollArea
          scrollbars="y"
          type="always"
          width={320}
          height={220}
          reachThreshold={40}
          onReachBottom={() => {
            setCount((c) => c + 10);
            setLoads((l) => l + 1);
          }}
        >
          {Array.from({ length: count }, (_, i) => (
            <Text key={i} paddingVertical="$xs">
              {`Row ${i + 1}`}
            </Text>
          ))}
        </ScrollArea>
      </Box>
    );
  },
};

/**
 * Stick-to-bottom — a chat/log pattern. New lines pin to the bottom while you're
 * already there; scroll up and the follow releases until you return.
 */
export const StickToBottom: Story = {
  render: () => {
    const [lines, setLines] = React.useState<string[]>(() =>
      Array.from({ length: 8 }, (_, i) => `Log line ${i + 1}`),
    );
    React.useEffect(() => {
      const id = setInterval(
        () => setLines((prev) => [...prev, `Log line ${prev.length + 1}`]),
        800,
      );
      return () => clearInterval(id);
    }, []);
    return (
      <Box gap="$xs" alignItems="flex-start">
        <Text fontWeight="700">Live log (sticks to bottom)</Text>
        <ScrollArea stickToBottom scrollbars="y" type="always" width={320} height={200}>
          {lines.map((line) => (
            <Text key={line} fontFamily="$mono" paddingVertical="$xxs">
              {line}
            </Text>
          ))}
        </ScrollArea>
      </Box>
    );
  },
};

/**
 * Track click paging — with `trackClickBehavior="page"`, clicking the rail
 * outside the thumb steps one viewport toward the click instead of jumping.
 */
export const TrackPaging: Story = {
  args: { scrollbars: "y", type: "always", trackClickBehavior: "page", width: 320, height: 200 },
  render: (args) => (
    <ScrollArea {...args}>
      {ITEMS.map((item) => (
        <Text key={item} paddingVertical="$xs">
          {item}
        </Text>
      ))}
    </ScrollArea>
  ),
};

/**
 * Hover-grow thumb — the rail rests thin (`idleScrollbarSize`) and animates to
 * `scrollbarSize` on hover/drag, macOS-style. Hover the area to see it thicken.
 */
export const HoverGrow: Story = {
  args: {
    scrollbars: "y",
    type: "always",
    idleScrollbarSize: 4,
    scrollbarSize: 14,
    width: 320,
    height: 200,
  },
  render: (args) => (
    <ScrollArea {...args}>
      {ITEMS.map((item) => (
        <Text key={item} paddingVertical="$xs">
          {item}
        </Text>
      ))}
    </ScrollArea>
  ),
};

/**
 * Keyboard scrolling — focus the area (Tab) and use Arrow / PageUp / PageDown /
 * Home / End / Space to scroll. Enabled by default via `keyboardScrolling`.
 */
export const Keyboard: Story = {
  render: () => (
    <Box gap="$xs" alignItems="flex-start">
      <Text>Tab to focus, then use the arrow / page / home / end keys.</Text>
      <ScrollArea scrollbars="y" type="always" width={320} height={200} keyStep={48}>
        {ITEMS.map((item) => (
          <Text key={item} paddingVertical="$xs">
            {item}
          </Text>
        ))}
      </ScrollArea>
    </Box>
  ),
};

/**
 * Per-slot `styles` targets individual parts — here the `viewport`, `scrollbar`,
 * `thumb`, and `corner`.
 */
export const Styles: Story = {
  args: { scrollbars: "xy", type: "always", scrollbarSize: 14, width: 320, height: 200 },
  render: (args) => (
    <ScrollArea
      {...args}
      styles={{
        viewport: { backgroundColor: "$blue2" },
        scrollbar: { backgroundColor: "$blue3", borderRadius: "$sm" },
        thumb: { backgroundColor: "$blue9" },
        corner: { backgroundColor: "$blue3" },
      }}
    >
      {Array.from({ length: 20 }, (_, row) => (
        <Box key={row} flexDirection="row" gap="$md" flexWrap="nowrap">
          {Array.from({ length: 20 }, (_, col) => (
            <Box key={col} minWidth={60} padding="$xs">
              <Text>{`${row + 1}×${col + 1}`}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </ScrollArea>
  ),
};
