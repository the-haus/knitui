import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Group } from "@knitui/components";

import { RECORDING_PRESETS } from "../engine/recording-presets";
import { AudioRecorder } from "./AudioRecorder";

const meta = {
  title: "Media/AudioRecorder",
  component: AudioRecorder,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A hybrid, cross-platform audio recorder. On web it drives the browser " +
          "`MediaRecorder` (+ Web Audio metering); on React Native it drives the " +
          "`expo-audio` recorder. Both share one controller contract and the same " +
          "kit-built chrome.",
      },
    },
  },
  args: {
    size: "md",
    controls: true,
    options: RECORDING_PRESETS.HIGH_QUALITY,
  },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    controls: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <Box maxWidth={460} width="100%">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof AudioRecorder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Metering enabled — the input-level bar tracks the microphone in real time. */
export const WithMeter: Story = {
  args: { meteringEnabled: true },
};

export const Sizes: Story = {
  render: (args) => (
    <Box gap={16}>
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <AudioRecorder key={size} {...args} size={size} />
      ))}
    </Box>
  ),
};

/** Compose a custom bar from the exported parts. */
export const CustomLayout: Story = {
  args: {
    controls: (
      <Group justify="space-between" align="center" width="100%">
        <Group gap="$xs" align="center" wrap="nowrap">
          <AudioRecorder.Record />
          <AudioRecorder.PauseResume />
        </Group>
        <AudioRecorder.Duration />
      </Group>
    ),
  },
};

/** Per-slot style overrides. */
export const Styles: Story = {
  args: {
    meteringEnabled: true,
    styles: {
      root: { backgroundColor: "$blue3", borderColor: "$blue6" },
      meterFill: { backgroundColor: "$blue9" },
      duration: { color: "$blue11" },
    },
  },
};
