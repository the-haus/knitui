import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

import { LiveAudioMeter } from "./LiveAudioMeter";

const meta = {
  title: "Media/LiveAudioMeter",
  component: LiveAudioMeter,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A live microphone level meter built on `useAudioStream`. On web it captures " +
          "the mic via `getUserMedia` + a Web Audio `AnalyserNode`; on React Native it " +
          "wraps `expo-audio`'s `useAudioStream` (PCM buffers decoded via `decodePcm`). " +
          "Both share one platform-free contract. Requires microphone permission, granted " +
          "on Start.",
      },
    },
  },
  args: {
    metric: "rms",
  },
  argTypes: {
    metric: { control: "radio", options: ["rms", "peak"] },
    encoding: { control: "radio", options: ["float32", "int16"] },
  },
  decorators: [
    (Story) => (
      <Box maxWidth={360} width="100%">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof LiveAudioMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const PeakMeter: Story = {
  name: "Peak amplitude",
  args: { metric: "peak" },
};

export const Stereo: Story = {
  args: { channels: 2 },
};
