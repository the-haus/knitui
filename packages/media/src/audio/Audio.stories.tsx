import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Group, Stack } from "@knitui/components";
import { Theme } from "@knitui/core";

import { Audio } from "./Audio";

// samplelib clips — real audio with proper duration metadata (good for the
// scrubber) and CORS headers (good for Web Audio / the visualizer). Distinct
// lengths so the scrubber/duration readout differ per track.
const SONG_1 = "https://samplelib.com/mp3/sample-30s.mp3";
const SONG_2 = "https://samplelib.com/mp3/sample-15s.mp3";
const SONG_3 = "https://samplelib.com/mp3/sample-12s.mp3";

// A minutes-long public-domain track (Internet Archive, CORS `*`) — better for
// exercising the scrubber and watching the spectrum evolve over a full song.
const LONG_1 = "https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3"; // ~6:10

const meta = {
  title: "Media/Audio",
  component: Audio,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A hybrid, cross-platform audio player. On web it drives the real browser " +
          "`HTMLAudioElement` (+ Web Audio / MediaSession); on React Native it drives " +
          "`expo-audio`.",
      },
    },
  },
  args: {
    source: SONG_1,
    size: "md",
    controls: true,
    loop: false,
    muted: false,
  },
  argTypes: {
    // The full kit size scale; `xxs`/`xxl` clamp to `xs`/`xl` (see `control-size`).
    size: { control: "select", options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] },
    controls: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <Box maxWidth={480} width="100%">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Audio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const WithMetadata: Story = {
  args: {
    source: SONG_2,
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    artwork: "https://picsum.photos/seed/album/200",
  },
};

/**
 * Lock-screen / now-playing controls with a **cover preview**. Setting
 * `lockScreen` publishes the `title`/`artist`/`album`/`artwork` to the OS:
 * on native (`expo-audio`) it owns the iOS lock screen / Android media
 * notification, and on web it drives the browser **MediaSession** API — so the
 * artwork shows as the cover in the OS media controls / hardware-key UI. Play it,
 * then check your system media controls (or lock the device on a native build).
 */
export const LockScreen: Story = {
  args: {
    source: SONG_2,
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    artwork: "https://picsum.photos/seed/album/512",
    lockScreen: true,
  },
};

export const Looping: Story = { args: { loop: true } };

export const Sizes: Story = {
  render: (args) => (
    <Box gap={16}>
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Audio key={size} {...args} size={size} />
      ))}
    </Box>
  ),
};

/** Compose a custom bar from the exported parts. */
export const CustomControlBar: Story = {
  args: {
    controls: (
      <Group justify="space-between" align="center" width="100%">
        <Group gap="$xs" align="center" wrap="nowrap">
          <Audio.PlayPause />
          <Audio.Time />
        </Group>
        <Group gap="$xs" align="center" wrap="nowrap">
          <Audio.Mute />
          <Audio.PlaybackRate />
        </Group>
      </Group>
    ),
  },
};

/** Headless: no transport, just the header. Drive it via `Audio.useAudio()`. */
export const Headless: Story = {
  args: { controls: false, title: "Just the header", artist: "No transport bar" },
};

/** Per-slot style overrides. */
export const Styles: Story = {
  args: {
    title: "Styled player",
    artist: "Custom slots",
    artwork: "https://picsum.photos/seed/styled/200",
    styles: {
      root: { backgroundColor: "$blue3", borderColor: "$blue6" },
      title: { color: "$blue11" },
    },
  },
};

/**
 * Theme-driven recolor. The whole player is built on `$colorN` ramp tokens, so
 * dropping it under a `<Theme>` recolors it with zero per-component logic — the
 * same property that themes Button/ActionIcon. No hardcoded colors anywhere.
 */
export const Themed: Story = {
  render: (args) => (
    <Stack gap={16}>
      <Theme name="red">
        <Audio {...args} title="Red theme" artist="$colorN recolor" />
      </Theme>
      <Theme name="dark">
        <Audio {...args} title="Dark theme" artist="$colorN recolor" />
      </Theme>
    </Stack>
  ),
  args: { artwork: "https://picsum.photos/seed/themed/200" },
};

export const AlternateSource: Story = { args: { source: SONG_3 } };

/**
 * A full, minutes-long track — gives the scrubber real range to drag across and a
 * meaningful elapsed/remaining readout (the short sample clips are only seconds).
 */
export const LongTrack: Story = {
  args: {
    source: LONG_1,
    title: "Moonlight Sonata",
    artist: "Beethoven",
    album: "Public Domain",
    artwork: "https://picsum.photos/seed/moonlight/512",
    lockScreen: true,
  },
};

/**
 * Two players sharing ONE shared audio engine (the default singleton). Press play
 * on one, then play on the other: the engine switches to the second track and the
 * first pauses — there is only ever ONE `<audio>` element. Return to the first and
 * it resumes from where you left off.
 */
export const TwoPlayers: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Stack gap="$lg" maxWidth={480} width="100%">
      <Audio source={SONG_1} title="Song 1" artist="Shared engine" />
      <Audio source={SONG_2} title="Song 2" artist="Shared engine" />
    </Stack>
  ),
};
