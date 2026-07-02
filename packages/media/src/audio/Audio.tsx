/**
 * `<Audio>` — the composed, cross-platform audio player.
 *
 * A SINGLE root works on both platforms because every platform difference is
 * isolated below it: `useAudioController` joins the one shared engine, whose
 * `expo-audio` backend resolves to its native module on device and its `.web`
 * backend in the browser. This root wires the controller into the {@link AudioContext}, renders the
 * metadata header + control bar, handles web keyboard shortcuts, optional
 * lock-screen activation, and forwards callbacks.
 *
 * Composition: the chrome parts are attached as `Audio.PlayPause`,
 * `Audio.Scrubber`, … so a custom bar can be passed via the `controls` prop.
 */
import * as React from "react";

import { Image, PortalHost, Stack, Text } from "@knitui/components";
import { isWeb, slotStyles, type TamaguiElement, withStaticProperties } from "@knitui/core";

import { useMediaCallbacks } from "../core/react/useMediaCallbacks";
import { audioHostName, useRequireMediaProvider } from "../provider/context";
import { applyMediaKeyAction } from "../shared";
import {
  BufferingIndicator,
  ControlBar,
  ErrorOverlay,
  LoopButton,
  MuteButton,
  PlaybackRateMenu,
  PlayPauseButton,
  Scrubber,
  SeekButton,
  TimeCurrent,
  TimeDisplay,
  TimeDuration,
  VolumeControl,
  VolumeSlider,
} from "./Audio.chrome";
import {
  AUDIO_SLOT_KEYS,
  AudioArtwork,
  AudioContext,
  type AudioContextValue,
  AudioControlBarFrame,
  AudioFrame,
  AudioHeaderFrame,
  type AudioProps,
  useAudio,
  useAudioState,
} from "./Audio.shared";
import { resolveKeyAction } from "./engine";
import { useAudioController } from "./hooks/useAudioController";
import type { AudioMetadata } from "./types";

/** Resolve the lock-screen metadata from the prop + the display metadata. */
function resolveLockScreenMetadata(props: AudioProps): AudioMetadata | null {
  if (!props.lockScreen) return null;
  if (typeof props.lockScreen === "object") return props.lockScreen;
  return {
    title: props.title,
    artist: props.artist,
    albumTitle: props.album,
    artwork: props.artwork,
  };
}

function MetadataHeader(): React.ReactElement | null {
  const { styles, headerMetadata } = useAudio("Header");
  // Props-derived header metadata wins; otherwise fall back to the live
  // lock-screen metadata on the snapshot (read as a slice so the header only
  // re-renders when the metadata actually changes, not every tick).
  const stateMetadata = useAudioState((s) => s.metadata);
  const metadata = headerMetadata ?? stateMetadata;
  // Canonical field is `artwork`; fall back to the deprecated `artworkUrl` one cycle.
  const artwork = metadata?.artwork ?? metadata?.artworkUrl;
  // The header is driven by the props the root folds into context metadata.
  if (!metadata || (!metadata.title && !metadata.artist && !artwork)) return null;
  return (
    <AudioHeaderFrame {...styles?.get("header")}>
      {artwork ? (
        <AudioArtwork {...styles?.get("artwork")}>
          <Image
            source={{ uri: artwork }}
            style={{ width: "100%", height: "100%" }}
            alt={metadata.title ? `${metadata.title} artwork` : "Artwork"}
          />
        </AudioArtwork>
      ) : null}
      <Stack flex={1} gap="$xxs">
        {metadata.title ? (
          <Text fontWeight="600" numberOfLines={1} {...styles?.get("title")}>
            {metadata.title}
          </Text>
        ) : null}
        {metadata.artist ? (
          <Text size="sm" color="$color11" numberOfLines={1} {...styles?.get("artist")}>
            {metadata.artist}
          </Text>
        ) : null}
      </Stack>
    </AudioHeaderFrame>
  );
}

function AudioRoot(props: AudioProps): React.ReactElement {
  const {
    source,
    autoPlay,
    loop,
    muted,
    volume,
    playbackRate,
    shouldCorrectPitch,
    updateInterval,
    size = "md",
    controls = true,
    title,
    artist,
    album,
    artwork,
    showHeader,
    id: idProp,
    keyboard = true,
    label = "Audio player",
    getController,
    onReady,
    onStatusChange,
    onPlayingChange,
    onTimeUpdate,
    onEnded,
    onError,
    styles,
    testID,
    width = "100%",
    maxWidth,
  } = props;

  // Own the player id (like <Video>) so we can render a matching surface host.
  const generatedId = React.useId();
  const playerId = idProp ?? generatedId;

  useRequireMediaProvider("Audio");

  const { controller, store } = useAudioController({
    source,
    autoPlay,
    loop,
    muted,
    volume,
    playbackRate,
    shouldCorrectPitch,
    updateInterval,
    id: playerId,
  });

  /* Forward declarative callbacks. ----------------------------------------- */
  React.useEffect(() => {
    getController?.(controller);
  }, [controller, getController]);

  useMediaCallbacks(controller, {
    onReady,
    onStatusChange,
    onPlayingChange,
    onTimeUpdate,
    onEnded,
    onError,
  });

  /* Lock-screen / now-playing. --------------------------------------------- */
  const lockMeta = resolveLockScreenMetadata(props);
  React.useEffect(() => {
    if (!lockMeta) return undefined;
    controller.setActiveForLockScreen(true, lockMeta);
    return () => controller.clearLockScreenControls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, lockMeta?.title, lockMeta?.artist, lockMeta?.albumTitle, lockMeta?.artwork]);

  /* Display metadata for the header, derived from props only (stable across
     ticks). `null` means "no header props" — the header then falls back to the
     live lock-screen `state.metadata` it reads itself via a selector. */
  const headerMetadata: AudioMetadata | null = React.useMemo(() => {
    const visible = showHeader ?? Boolean(title || artist || artwork);
    if (!visible) return null;
    return { title, artist, albumTitle: album, artwork };
  }, [showHeader, title, artist, album, artwork]);

  /* Web keyboard shortcuts on the focusable region. ------------------------ */
  const [frameEl, setFrameEl] = React.useState<HTMLElement | null>(null);
  const setFrameRef = React.useCallback((node: TamaguiElement | null) => {
    setFrameEl(node && "addEventListener" in node ? (node as unknown as HTMLElement) : null);
  }, []);

  React.useEffect(() => {
    const el = frameEl;
    if (!el) return undefined;
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", label);
    el.tabIndex = 0;
    if (!keyboard) return undefined;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const action = resolveKeyAction(e.key);
      if (!action) return;
      e.preventDefault();
      // Read the live snapshot at event time (facade `state` getter), so the
      // root needn't re-render per tick to keep this handler's state fresh.
      applyMediaKeyAction(controller, controller.state, action);
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [frameEl, controller, keyboard, label]);

  const accessor = React.useMemo(() => slotStyles(styles, AUDIO_SLOT_KEYS), [styles]);

  const ctx: AudioContextValue = React.useMemo(
    () => ({
      controller,
      store,
      headerMetadata,
      capabilities: controller.capabilities,
      size,
      styles: accessor,
    }),
    [controller, store, headerMetadata, size, accessor],
  );

  return (
    <AudioContext.Provider value={ctx}>
      <AudioFrame
        ref={setFrameRef}
        testID={testID}
        width={width}
        maxWidth={maxWidth}
        {...accessor.get("root")}
      >
        {/* The single shared (hidden) <audio> teleports into this host while this
            player is active. It has no visual footprint. */}
        <PortalHost name={audioHostName(playerId)} />
        <MetadataHeader />
        {controls === false ? null : (
          <AudioControlBarFrame {...(isWeb ? {} : {})} {...accessor.get("controlBar")}>
            {controls === true ? <ControlBar /> : controls}
          </AudioControlBarFrame>
        )}
      </AudioFrame>
    </AudioContext.Provider>
  );
}

/**
 * `<Audio>` with attached compound parts for custom layouts:
 *
 *   <Audio source={src} controls={<Audio.ControlBar />} />
 *
 *   <Audio source={src} controls={
 *     <Group><Audio.PlayPause /><Audio.Scrubber /><Audio.Time /></Group>
 *   } />
 */
export const Audio = withStaticProperties(AudioRoot, {
  ControlBar,
  PlayPause: PlayPauseButton,
  Seek: SeekButton,
  Scrubber,
  Time: TimeDisplay,
  TimeCurrent,
  TimeDuration,
  Mute: MuteButton,
  Volume: VolumeControl,
  VolumeSlider,
  PlaybackRate: PlaybackRateMenu,
  Loop: LoopButton,
  Buffering: BufferingIndicator,
  Error: ErrorOverlay,
  /** Escape hatch for advanced custom chrome. */
  useAudio,
});
