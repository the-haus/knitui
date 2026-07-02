import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { AnimatePresence } from "@knitui/core";

import { Box } from "../Box";
import { Button } from "../Button";
import {
  MotionConfig,
  type MotionPresetName,
  motionPresets,
  useMotionPreset,
} from "../internal/motion";
import { Text } from "../Text";

const PRESET_NAMES = Object.keys(motionPresets) as MotionPresetName[];

/**
 * One animated tile driven entirely by `useMotionPreset` + `AnimatePresence`. This
 * is the whole integration: resolve a preset to spreadable props, spread them onto
 * the frame, and let `AnimatePresence` play the enter AND exit.
 */
function MotionTile({
  animation,
  duration,
  open,
}: {
  animation: MotionPresetName;
  duration?: number;
  open: boolean;
}) {
  const motion = useMotionPreset(animation, { duration });
  return (
    <Box width={120} height={120} alignItems="center" justifyContent="center">
      <AnimatePresence>
        {open ? (
          <Box
            key="tile"
            {...motion}
            width={96}
            height={96}
            borderRadius="$md"
            backgroundColor="$color9"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="$color1" fontSize="$xs">
              {animation}
            </Text>
          </Box>
        ) : null}
      </AnimatePresence>
    </Box>
  );
}

interface PlaygroundArgs {
  animation: MotionPresetName;
  duration: number;
}

const meta: Meta = {
  title: "Overlays/Motion",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Configurable, preset-driven animation. `useMotionPreset(name, { transition?, duration? })` resolves a named recipe (or an inline preset, or `false`) into spreadable `{ transition, enterStyle, exitStyle, animateOnly }` props. Spread them onto any frame and wrap it in `AnimatePresence` for enter + exit. Reduced motion is honoured automatically. Presets use cross-platform Tamagui shorthand transforms, so they render identically on web and native.",
      },
    },
  },
};

export default meta;

/** Toggle a single tile in and out with a chosen preset. */
export const Playground: StoryObj<PlaygroundArgs> = {
  render: (args) => {
    const [open, setOpen] = React.useState(true);
    return (
      <Box gap="$md" alignItems="center">
        <Button onPress={() => setOpen((o) => !o)}>{open ? "Hide" : "Show"}</Button>
        <MotionTile animation={args.animation} duration={args.duration} open={open} />
      </Box>
    );
  },
  args: { animation: "pop", duration: 200 },
  argTypes: {
    animation: { control: "select", options: PRESET_NAMES, description: "Motion preset name." },
    duration: {
      control: { type: "range", min: 0, max: 1200, step: 50 },
      description: "Duration override (ms); keeps the preset's easing.",
    },
  },
};

/** Retune (or disable) all motion in a subtree from a single `MotionConfig`. */
export const GlobalConfig: StoryObj<{ durationScale: number; disabled: boolean }> = {
  render: (args) => {
    const [open, setOpen] = React.useState(true);
    return (
      <MotionConfig durationScale={args.durationScale} disabled={args.disabled}>
        <Box gap="$md" alignItems="center">
          <Button onPress={() => setOpen((o) => !o)}>{open ? "Hide" : "Show"}</Button>
          <MotionTile animation="pop" open={open} />
        </Box>
      </MotionConfig>
    );
  },
  args: { durationScale: 1, disabled: false },
  argTypes: {
    durationScale: {
      control: { type: "range", min: 0, max: 3, step: 0.25 },
      description: "Global speed multiplier — 1 = normal, 0.5 = 2× faster, 2 = half speed.",
    },
    disabled: { control: "boolean", description: "Force-disable all motion in the subtree." },
  },
};

/** Every built-in preset, auto-cycling so all enter/exit recipes are visible. */
export const AllPresets: StoryObj = {
  render: () => {
    const [open, setOpen] = React.useState(true);
    React.useEffect(() => {
      const id = setInterval(() => setOpen((o) => !o), 1400);
      return () => clearInterval(id);
    }, []);
    return (
      <Box flexDirection="row" flexWrap="wrap" gap="$md" maxWidth={560} justifyContent="center">
        {PRESET_NAMES.map((name) => (
          <MotionTile key={name} animation={name} open={open} />
        ))}
      </Box>
    );
  },
};
