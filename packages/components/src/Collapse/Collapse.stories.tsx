import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Collapse } from "./Collapse";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Overlays/Collapse",
  component: Collapse,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Collapse animates a content region between a zero-size collapsed state and its natural expanded size. " +
          "The `expanded` prop (or its legacy aliases `in` / `opened`) drives the transition. " +
          "`orientation` flips the axis, `animateOpacity` cross-fades alongside, and `keepMounted` " +
          "opts-in to keeping DOM nodes alive while collapsed.",
      },
    },
  },
  args: {
    expanded: true,
    orientation: "vertical",
    transitionDuration: 200,
    transitionTimingFunction: "ease",
    animateOpacity: true,
    keepMounted: false,
  },
  argTypes: {
    expanded: {
      control: "boolean",
      description: "Expanded state — drives the open/close transition.",
    },
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
      description: "Collapse axis — vertical (height) or horizontal (width).",
    },
    transitionDuration: {
      control: { type: "range", min: 0, max: 800, step: 50 },
      description: "Transition duration in milliseconds.",
    },
    transitionTimingFunction: {
      control: "select",
      options: ["ease", "linear", "ease-in", "ease-out", "cubic-bezier(0.34,1.56,0.64,1)"],
      description:
        "CSS timing function — 'linear' maps to the stripe preset, a cubic-bezier to bouncy.",
    },
    animateOpacity: {
      control: "boolean",
      description: "Cross-fade opacity alongside the size transition.",
    },
    keepMounted: {
      control: "boolean",
      description:
        "Keep content mounted in the DOM while collapsed (useful for SEO / focus management).",
    },
    children: { control: false },
  },
} satisfies Meta<typeof Collapse>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Collapse>>;

// ---------------------------------------------------------------------------
// Shared demo content
// ---------------------------------------------------------------------------

const DemoCard = () => (
  <Box
    backgroundColor="$color2"
    borderColor="$borderColor"
    borderWidth={1}
    borderRadius="$md"
    padding="$md"
    width={300}
  >
    <Text fontWeight="700" marginBottom="$xs">
      Collapsed region
    </Text>
    <Text>
      This content lives inside the Collapse. When the transition runs you can see the height
      animate smoothly to zero and the opacity fade out.
    </Text>
  </Box>
);

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Collapse {...args}>
      <DemoCard />
    </Collapse>
  ),
};

/** Toggle the panel open and closed with a button — demonstrates controlled usage. */
export const Controlled: Story = {
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    return (
      <Box gap="$md" alignItems="flex-start">
        <Box
          render="button"
          onPress={() => setOpen((v) => !v)}
          backgroundColor="$color4"
          borderRadius="$sm"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          cursor="pointer"
        >
          <Text>{open ? "▲ Hide details" : "▼ Show details"}</Text>
        </Box>
        <Collapse {...args} expanded={open}>
          <DemoCard />
        </Collapse>
      </Box>
    );
  },
  args: {
    expanded: undefined,
  },
};

/** Starts fully expanded — no transition required on initial render. */
export const DefaultExpanded: Story = {
  args: { expanded: true },
  render: (args) => (
    <Collapse {...args}>
      <DemoCard />
    </Collapse>
  ),
};

/** Starts fully collapsed — content is unmounted (default keepMounted=false). */
export const DefaultCollapsed: Story = {
  args: { expanded: false },
  render: (args) => (
    <Box>
      <Text color="$color10" marginBottom="$sm">
        The region below is collapsed — content is unmounted.
      </Text>
      <Collapse {...args}>
        <DemoCard />
      </Collapse>
    </Box>
  ),
};

/** The inherited `shadow` elevation ladder — each region rendered open, from `xs` to `xl`. */
export const Shadows: Story = {
  args: { expanded: true },
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {SHADOWS.map((shadow) => (
        <Collapse key={shadow} {...args} shadow={shadow}>
          <Box backgroundColor="$color2" borderRadius="$md" padding="$md" width={120}>
            <Text fontWeight="700">{shadow}</Text>
          </Box>
        </Collapse>
      ))}
    </Box>
  ),
};

/** keepMounted keeps the DOM node alive while collapsed; the region is aria-hidden. */
export const KeepMounted: Story = {
  args: { expanded: false, keepMounted: true },
  render: (args) => (
    <Box gap="$sm">
      <Text color="$color10">
        Collapsed with keepMounted — the content node stays in the DOM (check DevTools) but is
        hidden from assistive technology via aria-hidden.
      </Text>
      <Collapse {...args}>
        <DemoCard />
      </Collapse>
    </Box>
  ),
};

/** Collapses along the horizontal (width) axis instead of the default vertical. */
export const HorizontalOrientation: Story = {
  render: (args) => {
    const [open, setOpen] = React.useState(true);
    return (
      <Box gap="$md" alignItems="flex-start" flexDirection="row" flexWrap="wrap">
        <Box
          render="button"
          onPress={() => setOpen((v) => !v)}
          backgroundColor="$color4"
          borderRadius="$sm"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          cursor="pointer"
          flexShrink={0}
        >
          <Text>{open ? "◀ Collapse" : "▶ Expand"}</Text>
        </Box>
        <Collapse {...args} orientation="horizontal" expanded={open}>
          <Box
            backgroundColor="$color2"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius="$md"
            padding="$md"
            width={240}
          >
            <Text fontWeight="700" marginBottom="$xs">
              Horizontal panel
            </Text>
            <Text>Animates along the width axis.</Text>
          </Box>
        </Collapse>
      </Box>
    );
  },
  args: {
    expanded: undefined,
    orientation: "horizontal",
  },
};

/** Opacity animation disabled — only the size transitions, content stays fully opaque. */
export const NoOpacityAnimation: Story = {
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    return (
      <Box gap="$md" alignItems="flex-start">
        <Box
          render="button"
          onPress={() => setOpen((v) => !v)}
          backgroundColor="$color4"
          borderRadius="$sm"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          cursor="pointer"
        >
          <Text>{open ? "▲ Hide" : "▼ Show (no fade)"}</Text>
        </Box>
        <Collapse {...args} animateOpacity={false} expanded={open}>
          <DemoCard />
        </Collapse>
      </Box>
    );
  },
  args: {
    animateOpacity: false,
    expanded: undefined,
  },
};

/** Per-slot `styles` targets individual parts — here the `root` clip box and `content` wrapper. */
export const Styles: Story = {
  args: {
    expanded: true,
    styles: {
      root: { borderColor: "$blue7", borderWidth: 2, borderRadius: "$md" },
      content: { backgroundColor: "$blue3", padding: "$md" },
    },
  },
  render: (args) => (
    <Collapse {...args}>
      <DemoCard />
    </Collapse>
  ),
};

/** Multiple independently-controlled collapse regions in a stack. */
export const MultipleRegions: Story = {
  render: (args) => {
    const items = [
      { label: "Section A", body: "Content for section A." },
      { label: "Section B", body: "Content for section B." },
      { label: "Section C", body: "Content for section C." },
    ];
    const [openIndex, setOpenIndex] = React.useState<number | null>(0);

    return (
      <Box width={320} gap="$xs">
        {items.map((item, i) => (
          <Box key={item.label}>
            <Box
              render="button"
              onPress={() => setOpenIndex(openIndex === i ? null : i)}
              backgroundColor="$color3"
              borderRadius="$sm"
              paddingHorizontal="$md"
              paddingVertical="$sm"
              cursor="pointer"
            >
              <Text fontWeight="600">
                {openIndex === i ? "▲" : "▼"} {item.label}
              </Text>
            </Box>
            <Collapse {...args} expanded={openIndex === i}>
              <Box
                backgroundColor="$color2"
                borderColor="$borderColor"
                borderWidth={1}
                borderBottomLeftRadius="$sm"
                borderBottomRightRadius="$sm"
                padding="$md"
              >
                <Text>{item.body}</Text>
              </Box>
            </Collapse>
          </Box>
        ))}
      </Box>
    );
  },
  args: { expanded: undefined },
};
