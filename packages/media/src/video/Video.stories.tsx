import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Group, Text } from "@knitui/components";

import { Video } from "./Video";

const SAMPLE = "https://media.w3.org/2010/05/sintel/trailer.mp4";
const SAMPLE_2 = "https://media.w3.org/2010/05/bunny/movie.mp4";

const meta = {
  title: "Media/Video",
  component: Video,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A hybrid, cross-platform video player. On web it drives the real browser " +
          "`<video>` element; on React Native it drives `expo-video`. Both share one " +
          "controller contract and the same kit-built control chrome.",
      },
    },
  },
  args: {
    source: SAMPLE,
    contentFit: "contain",
    size: "md",
    controls: true,
    autoHide: true,
    loop: false,
    muted: false,
  },
  argTypes: {
    contentFit: { control: "select", options: ["contain", "cover", "fill"] },
    // The full kit size scale; `xxs`/`xxl` clamp to `xs`/`xl` (see `control-size`).
    size: { control: "select", options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] },
    autoHide: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <Box maxWidth={720} width="100%">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Video>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: { aspectRatio: 16 / 9 },
};

export const AutoPlayMuted: Story = {
  args: { aspectRatio: 16 / 9, autoPlay: true, muted: true, loop: true },
};

export const ContentFitCover: Story = {
  args: { aspectRatio: 1, contentFit: "cover" },
};

/**
 * Control sizing across the shared kit scale — the chrome's buttons, icons, and
 * scrubber all step together off the canonical `controlMetrics`/icon ladders
 * (the same scale Button/ActionIcon use), not a media-local copy.
 */
export const Sizes: Story = {
  render: (args) => (
    <Box gap={16}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Video key={size} {...args} size={size} aspectRatio={16 / 9} />
      ))}
    </Box>
  ),
};

export const NativePlatformControls: Story = {
  name: "Native (browser) controls",
  args: { aspectRatio: 16 / 9, nativeControls: true },
};

/** Compose a custom control bar from the exported parts. */
export const CustomControlBar: Story = {
  args: {
    aspectRatio: 16 / 9,
    controls: (
      <Group justify="space-between" align="center" width="100%">
        <Group gap="$xs" align="center" wrap="nowrap">
          <Video.PlayPause />
          <Video.Time />
        </Group>
        <Group gap="$xs" align="center" wrap="nowrap">
          <Video.Mute />
          <Video.Fullscreen />
        </Group>
      </Group>
    ),
  },
};

/**
 * Cross-platform captions from a sidecar VTT file. The kit renders the active
 * cue with its OWN overlay on both platforms (web sets the `<track>` to
 * `hidden` and reads `activeCues`; native fetches + parses the file itself,
 * since `expo-video` only surfaces tracks embedded in the manifest). One code
 * path, one stylable overlay — pick a track in the settings menu.
 * (Self-contained data-URI VTT so the demo works offline.)
 */
const CAPTIONS_VTT =
  "data:text/vtt;charset=utf-8," +
  encodeURIComponent(
    `WEBVTT

1
00:00:11.850 --> 00:00:13.710
What brings you to the land of the

2
00:00:13.710 --> 00:00:14.230
gatekeepers?

3
00:00:18.090 --> 00:00:19.870
I'm searching for someone.

4
00:00:36.270 --> 00:00:38.730
A dangerous quest for a lone hunter.

5
00:00:41.850 --> 00:00:43.150
I've been alone for as long as I

6
00:00:43.150 --> 00:00:43.810
can remember.
`,
  );

export const Captions: Story = {
  args: {
    aspectRatio: 16 / 9,
    textTracks: [{ src: CAPTIONS_VTT, label: "English", language: "en", default: true }],
  },
};

/**
 * Because captions ride the kit overlay (not the platform's built-in subtitle
 * renderer), their typography is fully stylable via the `captions` /
 * `captionText` style slots — font, size, color, weight, background.
 */
export const CustomStyledCaptions: Story = {
  args: {
    aspectRatio: 16 / 9,
    textTracks: [{ src: CAPTIONS_VTT, label: "English", language: "en", default: true }],
    styles: {
      captions: { backgroundColor: "rgba(20,20,40,0.85)", borderRadius: "$lg" },
      captionText: { fontSize: 22, fontWeight: "700", color: "$yellow9" },
    },
  },
};

/**
 * Keyboard shortcuts (focus the player first): Space/k play·pause, ←/→ seek,
 * ↑/↓ volume, m mute, f fullscreen, p PiP, 0–9 jump, `<`/`>` speed.
 */
export const KeyboardShortcuts: Story = {
  args: { aspectRatio: 16 / 9 },
};

/** Always-visible controls (no auto-hide). */
export const PersistentControls: Story = {
  args: { aspectRatio: 16 / 9, autoHide: false },
};

/** Per-slot `styles` overrides (Pillar B). */
export const Styles: Story = {
  args: {
    aspectRatio: 16 / 9,
    styles: {
      root: { borderRadius: "$xl", borderWidth: 2, borderColor: "$blue9" },
      controlBar: { backgroundColor: "rgba(0,0,0,0.55)" },
    },
  },
};

/** Two players sharing nothing but the contract — swap the source at runtime. */
export const SwapSource: Story = {
  render: (args) => {
    const [src, setSrc] = React.useState(SAMPLE);
    return (
      <Box gap="$sm">
        <Video {...args} source={src} aspectRatio={16 / 9} />
        <Group gap="$sm">
          <Text
            onPress={() => setSrc(SAMPLE)}
            color={src === SAMPLE ? "$blue9" : "$color11"}
            style={{ cursor: "pointer" }}
          >
            Sintel
          </Text>
          <Text
            onPress={() => setSrc(SAMPLE_2)}
            color={src === SAMPLE_2 ? "$blue9" : "$color11"}
            style={{ cursor: "pointer" }}
          >
            Big Buck Bunny
          </Text>
        </Group>
      </Box>
    );
  },
};

/**
 * Two players sharing ONE shared video engine (the default singleton). The single
 * `<video>` teleports into whichever player you press play on; the other shows its
 * poster and pauses. Returning to the first resumes from where you left off — and
 * there is only ever ONE `<video>` element in the DOM.
 */
export const TwoPlayers: Story = {
  render: () => (
    <Box gap="$lg" maxWidth={720} width="100%">
      <Video source={SAMPLE} poster="https://media.w3.org/2010/05/sintel/poster.png" />
      <Video source={SAMPLE_2} poster="https://media.w3.org/2010/05/bunny/poster.png" />
    </Box>
  ),
};

/**
 * Now-playing / lock-screen controls with a **cover preview**. `nowPlaying`
 * folds the `title`/`artist`/`artwork` into the source metadata and flips
 * `expo-video`'s `showNowPlayingNotification` + `staysActiveInBackground`, so the
 * OS shows a media notification with the artwork as the cover and playback keeps
 * going in the background. Native-only — surfacing it on a device build also
 * needs the `expo-video` config plugin's `supportsBackgroundPlayback: true`.
 * (No-op on web; the story still renders a normal player there.)
 */
export const NowPlaying: Story = {
  args: {
    aspectRatio: 16 / 9,
    poster: "https://media.w3.org/2010/05/sintel/poster.png",
    title: "Sintel",
    artist: "Blender Foundation",
    artwork: "https://media.w3.org/2010/05/sintel/poster.png",
    nowPlaying: true,
  },
};
