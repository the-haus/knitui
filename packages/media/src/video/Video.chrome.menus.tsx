/**
 * Menu / flyout chrome for `<Video>` — the controls that open a dropdown or a
 * hover/tap flyout: the volume slider + its space-saving control, the playback-
 * rate and settings (subtitle / audio track) menus, and the Picture-in-Picture
 * and Fullscreen toggles. Each is capability-gated and driven by the
 * {@link VideoContext}.
 */
import * as React from "react";

import { ActionIcon, Box, Menu, Slider, Text } from "@knitui/components";
import { isWeb, styled } from "@knitui/core";
import { IconCheck } from "@knitui/icons/IconCheck";
import { IconMaximize } from "@knitui/icons/IconMaximize";
import { IconMinimize } from "@knitui/icons/IconMinimize";
import { IconPictureInPicture } from "@knitui/icons/IconPictureInPicture";
import { IconPictureInPictureOff } from "@knitui/icons/IconPictureInPictureOff";
import { IconSettings } from "@knitui/icons/IconSettings";

import { clampMediaSize } from "../control-size";
import {
  formatVolumeLabel,
  hoverProps,
  VERTICAL_VOLUME_STYLES,
  VOLUME_LENGTH,
} from "../shared/chrome";
import { OnScrimIcons, useHoldWhileOpen, volumeIconFor } from "./Video.chrome.internal";
import { shallowEqual, useVideo, useVideoState } from "./Video.shared";

/* -------------------------------------------------------------------------- */
/* Volume                                                                     */
/* -------------------------------------------------------------------------- */

export interface VolumeSliderProps {
  /** Layout axis. Default `'horizontal'`. */
  orientation?: "horizontal" | "vertical";
}

/**
 * The bare volume slider. Horizontal by default; pass `orientation="vertical"`
 * for the space-saving flyout used by {@link VolumeControl}. Returns `null` when
 * the backend can't take a programmatic volume (e.g. mobile Safari).
 */
export const VolumeSlider = React.memo(function VolumeSlider({
  orientation = "horizontal",
}: VolumeSliderProps = {}): React.ReactElement | null {
  const { controller, capabilities, keepAlive } = useVideo("Volume");
  const { muted, volume } = useVideoState(
    (s) => ({ muted: s.muted, volume: s.volume }),
    shallowEqual,
  );
  const mutedRef = React.useRef(muted);
  mutedRef.current = muted;
  const onChange = React.useCallback(
    (v: number) => {
      keepAlive();
      controller.setVolume(v);
      if (mutedRef.current && v > 0) controller.setMuted(false);
    },
    [controller, keepAlive],
  );
  if (!capabilities.canSetVolume) return null;
  const vertical = orientation === "vertical";
  const slider = (
    <Slider
      orientation={orientation}
      value={muted ? 0 : volume}
      min={0}
      max={1}
      step={0.05}
      size="xs"
      label={formatVolumeLabel}
      aria-label="Volume"
      {...(vertical ? { styles: VERTICAL_VOLUME_STYLES } : null)}
      onChange={onChange}
    />
  );
  return vertical ? slider : <Box width={VOLUME_LENGTH}>{slider}</Box>;
});

/** The vertical volume flyout, flush against the trigger's top edge. */
const VolumeFlyout = styled(Box, {
  displayName: "VideoVolumeFlyout",
  position: "absolute",
  bottom: "100%",
  alignItems: "center",
  paddingVertical: "sm",
  paddingHorizontal: "xs",
  borderRadius: "sm",
  backgroundColor: "mediaControlSurface",
});

/**
 * Space-saving volume control: a mute toggle that reveals a VERTICAL volume
 * slider in a small flyout above it. On web the flyout opens on hover; on
 * native (no hover) tapping the icon toggles mute and pops the flyout, which
 * closes again when the chrome auto-hides. Falls back to a plain mute toggle
 * when the backend can't set volume.
 */
export const VolumeControl = React.memo(function VolumeControl(): React.ReactElement {
  const { controller, capabilities, size, keepAlive, controlsVisible } = useVideo("Volume");
  const { muted, volume } = useVideoState(
    (s) => ({ muted: s.muted, volume: s.volume }),
    shallowEqual,
  );
  const off = muted || volume === 0;
  const VolumeIcon = volumeIconFor(muted, volume);
  const [open, setOpen] = React.useState(false);
  const flyoutHover = React.useMemo(
    () =>
      hoverProps(
        () => setOpen(true),
        () => setOpen(false),
      ),
    [],
  );

  // The flyout has no hover-out on native, so dismiss it with the chrome.
  React.useEffect(() => {
    if (!controlsVisible) setOpen(false);
  }, [controlsVisible]);

  const trigger = (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="transparent"
      aria-label={off ? "Unmute" : "Mute"}
      onPress={() => {
        keepAlive();
        controller.toggleMuted();
        if (!isWeb && capabilities.canSetVolume) setOpen((o) => !o);
      }}
    >
      <OnScrimIcons size={size}>
        <VolumeIcon />
      </OnScrimIcons>
    </ActionIcon>
  );

  if (!capabilities.canSetVolume) return trigger;

  return (
    <Box position="relative" alignItems="center" {...flyoutHover}>
      {open ? (
        // Flush against the trigger's top edge (no gap) so the pointer can
        // travel into the flyout without a hover-out closing it.
        <VolumeFlyout>
          <VolumeSlider orientation="vertical" />
        </VolumeFlyout>
      ) : null}
      {trigger}
    </Box>
  );
});

/* -------------------------------------------------------------------------- */
/* Playback rate                                                              */
/* -------------------------------------------------------------------------- */

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const PlaybackRateMenu = React.memo(function PlaybackRateMenu(): React.ReactElement | null {
  const { controller, capabilities, size, keepAlive, holdControls } = useVideo("PlaybackRate");
  const playbackRate = useVideoState((s) => s.playbackRate);
  const [opened, onOpenChange] = useHoldWhileOpen(holdControls, keepAlive);
  if (!capabilities.canSetPlaybackRate) return null;
  return (
    <Menu position="top" trigger="click" opened={opened} onChange={onOpenChange}>
      <Menu.Target>
        <ActionIcon
          size={clampMediaSize(size)}
          variant="transparent"
          // The visible rate must be part of the name (WCAG 2.5.3 label-in-name).
          aria-label={`Playback speed ${playbackRate}×`}
          onPress={keepAlive}
        >
          <Text size="xs" fontWeight="700" color="mediaOnScrim">
            {playbackRate}×
          </Text>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Speed</Menu.Label>
        {RATES.map((rate) => (
          <Menu.Item
            key={rate}
            rightSection={rate === playbackRate ? <IconCheck size={14} /> : undefined}
            onPress={() => controller.setPlaybackRate(rate)}
          >
            {rate === 1 ? "Normal" : `${rate}×`}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
});

/* -------------------------------------------------------------------------- */
/* Settings (subtitle / audio track selection)                               */
/* -------------------------------------------------------------------------- */

export const SettingsMenu = React.memo(function SettingsMenu(): React.ReactElement | null {
  const { controller, capabilities, size, keepAlive, holdControls } = useVideo("Settings");
  const { availableSubtitleTracks, availableAudioTracks, subtitleTrackId, audioTrackId } =
    useVideoState(
      (s) => ({
        availableSubtitleTracks: s.availableSubtitleTracks,
        availableAudioTracks: s.availableAudioTracks,
        subtitleTrackId: s.subtitleTrackId,
        audioTrackId: s.audioTrackId,
      }),
      shallowEqual,
    );
  const [opened, onOpenChange] = useHoldWhileOpen(holdControls, keepAlive);
  const showSubtitles = capabilities.canSelectSubtitleTracks && availableSubtitleTracks.length > 0;
  const showAudio = capabilities.canSelectAudioTracks && availableAudioTracks.length > 1;
  if (!showSubtitles && !showAudio) return null;

  return (
    <Menu position="top" trigger="click" opened={opened} onChange={onOpenChange}>
      <Menu.Target>
        <ActionIcon
          size={clampMediaSize(size)}
          variant="transparent"
          aria-label="Settings"
          onPress={keepAlive}
        >
          <OnScrimIcons size={size}>
            <IconSettings />
          </OnScrimIcons>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {showSubtitles ? (
          <>
            <Menu.Label>Subtitles</Menu.Label>
            <Menu.Item
              rightSection={subtitleTrackId == null ? <IconCheck size={14} /> : undefined}
              onPress={() => controller.selectSubtitleTrack(null)}
            >
              Off
            </Menu.Item>
            {availableSubtitleTracks.map((track) => (
              <Menu.Item
                key={track.id}
                rightSection={subtitleTrackId === track.id ? <IconCheck size={14} /> : undefined}
                onPress={() => controller.selectSubtitleTrack(track.id)}
              >
                {track.label}
              </Menu.Item>
            ))}
          </>
        ) : null}
        {showAudio ? (
          <>
            <Menu.Label>Audio</Menu.Label>
            {availableAudioTracks.map((track) => (
              <Menu.Item
                key={track.id}
                rightSection={audioTrackId === track.id ? <IconCheck size={14} /> : undefined}
                onPress={() => controller.selectAudioTrack(track.id)}
              >
                {track.label}
              </Menu.Item>
            ))}
          </>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
});

/* -------------------------------------------------------------------------- */
/* Picture-in-Picture                                                         */
/* -------------------------------------------------------------------------- */

export const PiPButton = React.memo(function PiPButton(): React.ReactElement | null {
  const { controller, capabilities, size, keepAlive } = useVideo("PiP");
  const pictureInPicture = useVideoState((s) => s.pictureInPicture);
  if (!capabilities.canPictureInPicture) return null;
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="transparent"
      aria-label={pictureInPicture ? "Exit Picture in Picture" : "Picture in Picture"}
      onPress={() => {
        keepAlive();
        void controller.togglePictureInPicture();
      }}
    >
      <OnScrimIcons size={size}>
        {pictureInPicture ? <IconPictureInPictureOff /> : <IconPictureInPicture />}
      </OnScrimIcons>
    </ActionIcon>
  );
});

/* -------------------------------------------------------------------------- */
/* Fullscreen                                                                 */
/* -------------------------------------------------------------------------- */

export const FullscreenButton = React.memo(function FullscreenButton(): React.ReactElement | null {
  const { controller, capabilities, size, keepAlive } = useVideo("Fullscreen");
  const fullscreen = useVideoState((s) => s.fullscreen);
  if (!capabilities.canFullscreen) return null;
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="transparent"
      aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
      onPress={() => {
        keepAlive();
        void controller.toggleFullscreen();
      }}
    >
      <OnScrimIcons size={size}>{fullscreen ? <IconMinimize /> : <IconMaximize />}</OnScrimIcons>
    </ActionIcon>
  );
});
