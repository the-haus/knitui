import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

import { AudioPlaylist } from "./AudioPlaylist";

// Short samplelib clips — quick to load, fine for exercising track-switching.
const SOURCES = [
  { uri: "https://samplelib.com/mp3/sample-30s.mp3", name: "Sample 30s" },
  { uri: "https://samplelib.com/mp3/sample-15s.mp3", name: "Sample 15s" },
  { uri: "https://samplelib.com/mp3/sample-12s.mp3", name: "Sample 12s" },
];

// Minutes-long CC / public-domain tracks (Internet Archive, CORS `*`) — a more
// realistic queue with full-length songs and a meaningful scrubber per track.
const LONG_SOURCES = [
  {
    uri: "https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3",
    name: "Moonlight Sonata",
  },
  { uri: "https://archive.org/download/FREE_background_music_dhalius/Guilt.mp3", name: "Guilt" },
  {
    uri: "https://archive.org/download/FREE_background_music_dhalius/Director.mp3",
    name: "Director",
  },
];

const meta = {
  title: "Media/AudioPlaylist",
  component: AudioPlaylist,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A cross-platform playlist player. Web drives an internal `HTMLAudioElement` " +
          "queue; native drives the expo-audio `AudioPlaylist` (gapless). One controller " +
          "contract, one kit chrome (transport + scrubber + clickable track list).",
      },
    },
  },
  args: { sources: SOURCES, size: "md", controls: true, showTrackList: true, loop: "none" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    loop: { control: "select", options: ["none", "single", "all"] },
  },
  decorators: [
    (Story) => (
      <Box maxWidth={460} width="100%">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof AudioPlaylist>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const LoopAll: Story = { args: { loop: "all" } };

/** A queue of full-length tracks — real durations to scrub and queue through. */
export const LongTracks: Story = { args: { sources: LONG_SOURCES } };

export const NoTrackList: Story = { args: { showTrackList: false } };

export const Styles: Story = {
  args: {
    styles: {
      root: { backgroundColor: "$green3", borderColor: "$green6" },
      trackRow: { borderRadius: "$lg" },
    },
  },
};
