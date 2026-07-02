/**
 * `<Video>` — the composed, cross-platform video component.
 *
 * A SINGLE root works on both platforms because the backend is the one
 * `expo-video`-based `VideoController` (it resolves to expo's native module on
 * device and its `.web` backend in the browser) joined through `useVideoController`,
 * and the playback element is the one `VideoSurface` (the expo `VideoView`). This
 * root wires the controller into the {@link VideoContext}, manages the auto-hiding
 * chrome, keyboard shortcuts, hover/cursor behavior, and forwards callbacks.
 *
 * Composition: the chrome parts are attached as `Video.PlayPause`,
 * `Video.Scrubber`, … so a custom bar can be passed via the `controls` prop.
 */
import * as React from "react";

import { Box, PortalHost, useMotionPreset } from "@knitui/components";
import {
  isWeb,
  slotStyles,
  type TamaguiElement,
  useTheme,
  variableToString,
  withStaticProperties,
} from "@knitui/core";

import { useMediaCallbacks } from "../core/react/useMediaCallbacks";
import { useRequireMediaProvider, videoHostName } from "../provider/context";
import { applyMediaKeyAction } from "../shared";
import type { VideoController } from "./controller/video-controller-base";
import { resolveKeyAction, type VideoKeyAction } from "./engine";
import { useVideoController } from "./hooks/useVideoController";
import type { VideoControllerState, VideoMetadata, VideoSource, VideoSourceObject } from "./types";
import {
  BigPlayButton,
  BufferingOverlay,
  CaptionOverlay,
  ControlBar,
  ErrorOverlay,
  FullscreenButton,
  MuteButton,
  PiPButton,
  PlaybackRateMenu,
  PlayPauseButton,
  Scrubber,
  SeekButton,
  SettingsMenu,
  TimeCurrent,
  TimeDisplay,
  TimeDuration,
  VolumeControl,
  VolumeSlider,
} from "./Video.chrome";
import {
  DEFAULT_AUTO_HIDE_MS,
  hoverProps,
  useVideo,
  VIDEO_SLOT_KEYS,
  VideoContext,
  type VideoContextValue,
  VideoControlBarFrame,
  VideoFrame,
  type VideoProps,
} from "./Video.shared";

function resolveAutoHideMs(autoHide: VideoProps["autoHide"]): number | null {
  if (autoHide === false) return null;
  if (autoHide === true || autoHide === undefined) return DEFAULT_AUTO_HIDE_MS;
  return autoHide;
}

/** Resolve the now-playing metadata from `nowPlaying` + the title/artist/artwork props. */
function resolveNowPlayingMetadata(props: VideoProps): VideoMetadata | null {
  if (!props.nowPlaying) return null;
  if (typeof props.nowPlaying === "object") return props.nowPlaying;
  const { title, artist, artwork } = props;
  if (!title && !artist && !artwork) return null;
  return { title, artist, artwork };
}

/**
 * Fold the now-playing metadata into the source object — expo-video reads the
 * displayed title/artist/artwork from `source.metadata`, not from a setter. A
 * bundled-asset (`number`) source is passed through untouched.
 */
function withMetadataSource(source: VideoSource, metadata: VideoMetadata | null): VideoSource {
  if (!metadata || source == null || typeof source === "number") return source;
  const base: VideoSourceObject = typeof source === "string" ? { uri: source } : source;
  return { ...base, metadata: { ...base.metadata, ...metadata } };
}

/**
 * Applies a resolved keyboard action against the controller. The two video-only
 * actions (fullscreen / picture-in-picture) are handled here; every common action
 * is delegated to the shared {@link applyMediaKeyAction}.
 */
function applyKeyAction(
  controller: VideoController,
  state: VideoControllerState,
  action: VideoKeyAction,
): void {
  switch (action.type) {
    case "toggleFullscreen":
      void controller.toggleFullscreen();
      break;
    case "togglePictureInPicture":
      void controller.togglePictureInPicture();
      break;
    default:
      applyMediaKeyAction(controller, state, action);
  }
}

/**
 * The bottom legibility scrim as a `linear-gradient`, built from the resolved
 * `$mediaScrim` token (web → a `var(--…)` reference that tracks the theme, native
 * → the raw color — both valid inside a gradient). Tamagui's `backgroundImage`
 * prop paints this on BOTH platforms (CSS gradient on web, RN's experimental
 * gradient on native), so there's one cross-platform scrim and no flat fallback.
 * A `linear-gradient` can't itself be a theme token, hence the resolve-and-interp.
 */
const makeScrimGradient = (scrim: string): string =>
  `linear-gradient(to top, ${scrim} 0%, transparent 100%)`;

/** Fill style for the teleport host so the re-parented surface sizes to the frame. */
const SURFACE_HOST_STYLE = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

/** Window (ms) a single tap waits for a double-click before toggling play (web). */
const DOUBLE_CLICK_GRACE_MS = 250;

function VideoRoot(props: VideoProps): React.ReactElement {
  const {
    source,
    id: idProp,
    autoPlay,
    loop,
    muted,
    volume,
    playbackRate,
    updateInterval,
    timeUpdateInterval,
    contentFit = "contain",
    aspectRatio,
    size = "md",
    controls = true,
    showBigPlayButton = true,
    autoHide = true,
    nativeControls = false,
    poster,
    allowsPictureInPicture = true,
    textTracks,
    keyboard = true,
    doubleClickToFullscreen = true,
    label = "Video player",
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
    height,
    controlsOffset,
  } = props;

  const generatedId = React.useId();
  const playerId = idProp ?? generatedId;

  useRequireMediaProvider("Video");

  const surface = React.useMemo(
    () => ({
      contentFit,
      nativeControls,
      allowsPictureInPicture,
      textTracks,
    }),
    [contentFit, nativeControls, allowsPictureInPicture, textTracks],
  );

  // Now-playing metadata rides on the source (expo-video reads it from there);
  // a separate effect flips the player flags that surface the OS notification.
  const nowPlayingMeta = resolveNowPlayingMetadata(props);
  const effectiveSource = React.useMemo(
    () => withMetadataSource(source, nowPlayingMeta),
    // Re-fold only when the source or the resolved metadata fields change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, nowPlayingMeta?.title, nowPlayingMeta?.artist, nowPlayingMeta?.artwork],
  );

  const { controller, store } = useVideoController({
    source: effectiveSource,
    autoPlay,
    loop,
    muted,
    volume,
    playbackRate,
    updateInterval,
    timeUpdateInterval,
    textTracks,
    id: playerId,
    surface,
  });

  // The chrome's auto-hide fade — cross-platform + reduced-motion-safe (the
  // preset collapses to no transition under reduced motion / disabled config).
  const chromeMotion = useMotionPreset("fade");

  // Resolve the scrim token once for the gradient (theme-independent value).
  const theme = useTheme();
  const scrimColor = variableToString(theme.mediaScrim);

  /* Forward declarative callbacks. ----------------------------------------- */
  React.useEffect(() => {
    getController?.(controller);
  }, [controller, getController]);

  /* Now-playing / lock-screen (native). ------------------------------------ */
  const nowPlayingEnabled = Boolean(nowPlayingMeta);
  React.useEffect(() => {
    if (!nowPlayingEnabled) return undefined;
    controller.setNowPlayingEnabled(true);
    return () => controller.setNowPlayingEnabled(false);
  }, [controller, nowPlayingEnabled]);

  useMediaCallbacks(controller, {
    onReady,
    onStatusChange,
    onPlayingChange,
    onTimeUpdate,
    onEnded,
    onError,
  });

  /* Auto-hide chrome. ------------------------------------------------------- */
  // The chrome always auto-hides after the delay — whether playing OR paused —
  // and reveals on any interaction (move / key / tap / control press). A "hold"
  // counter suspends the timer while a sustained interaction is in progress (the
  // bar is hovered on web, or a menu is open) so it never collapses mid-action.
  const autoHideMs = resolveAutoHideMs(autoHide);
  const [controlsVisible, setControlsVisible] = React.useState(true);
  const [holdCount, setHoldCount] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const keepAlive = React.useCallback(() => {
    setControlsVisible(true);
    clearTimer();
    if (autoHideMs != null && holdCount === 0) {
      timerRef.current = setTimeout(() => setControlsVisible(false), autoHideMs);
    }
  }, [autoHideMs, clearTimer, holdCount]);

  const holdControls = React.useCallback((active: boolean) => {
    setHoldCount((c) => Math.max(0, c + (active ? 1 : -1)));
  }, []);

  // Re-arm (or suspend) the timer whenever the hold count flips: `keepAlive`'s
  // identity tracks `holdCount`, so this fires on every hold/release.
  React.useEffect(() => {
    keepAlive();
    return clearTimer;
  }, [keepAlive, clearTimer]);

  // Latest values for the imperative DOM handlers (avoid re-binding listeners).
  const keepAliveRef = React.useRef(keepAlive);
  keepAliveRef.current = keepAlive;
  const holdCountRef = React.useRef(holdCount);
  holdCountRef.current = holdCount;

  /* Tap-to-toggle-play, debounced so a double-click (fullscreen) wins. -------- */
  // On web a double-click arrives as two single clicks THEN a dblclick. Toggling
  // play on each click would flash pause→play before fullscreen kicks in, so we
  // briefly defer the toggle and let the dblclick handler cancel it. Native has
  // no dblclick (and no such race), so it toggles instantly.
  const playTapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPendingPlayTap = React.useCallback(() => {
    if (playTapTimerRef.current != null) {
      clearTimeout(playTapTimerRef.current);
      playTapTimerRef.current = null;
    }
  }, []);
  const tapTogglePlay = React.useCallback(() => {
    if (!isWeb || !doubleClickToFullscreen) {
      controller.togglePlay();
      return;
    }
    cancelPendingPlayTap();
    playTapTimerRef.current = setTimeout(() => {
      playTapTimerRef.current = null;
      controller.togglePlay();
    }, DOUBLE_CLICK_GRACE_MS);
  }, [controller, doubleClickToFullscreen, cancelPendingPlayTap]);
  React.useEffect(() => cancelPendingPlayTap, [cancelPendingPlayTap]);

  /* Web wiring: focusable ARIA region + keyboard + hover/cursor + fullscreen. */
  const [frameEl, setFrameEl] = React.useState<HTMLElement | null>(null);
  const setFrameRef = React.useCallback((node: TamaguiElement | null) => {
    setFrameEl(node && "addEventListener" in node ? (node as unknown as HTMLElement) : null);
  }, []);

  React.useEffect(() => {
    const el = frameEl;
    if (!el) return undefined;

    el.setAttribute("role", "region");
    el.setAttribute("aria-label", label);
    el.tabIndex = 0;
    if (keyboard) {
      el.setAttribute("aria-keyshortcuts", "Space ArrowLeft ArrowRight ArrowUp ArrowDown m f");
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      if (!keyboard || e.metaKey || e.ctrlKey || e.altKey) return;
      const action = resolveKeyAction(e.key);
      if (!action) return;
      e.preventDefault();
      // Read the live snapshot at event time (the facade's `state` getter
      // delegates to the session), so the root needn't re-render per tick to
      // keep a fresh `state` around for this handler.
      applyKeyAction(controller, controller.state, action);
      keepAliveRef.current();
    };
    const onMove = (): void => keepAliveRef.current();
    const onLeave = (): void => {
      // Hide as soon as the pointer leaves — unless a hold is active (an open
      // menu the pointer moved onto, a slider being dragged).
      if (holdCountRef.current === 0) {
        clearTimer();
        setControlsVisible(false);
      }
    };
    const onDbl = (e: MouseEvent): void => {
      if (!doubleClickToFullscreen) return;
      e.preventDefault();
      cancelPendingPlayTap();
      void controller.toggleFullscreen();
    };

    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("dblclick", onDbl);
    return () => {
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("dblclick", onDbl);
    };
  }, [
    frameEl,
    controller,
    keyboard,
    label,
    doubleClickToFullscreen,
    clearTimer,
    cancelPendingPlayTap,
  ]);

  // Always auto-hide: the chrome follows the auto-hide timer regardless of play
  // state. (The big play button stays its own overlay so a paused, chrome-hidden
  // player still shows an affordance.)
  const chromeVisible = controlsVisible;

  // Hide the cursor along with the chrome during playback (web).
  React.useEffect(() => {
    if (frameEl) frameEl.style.cursor = chromeVisible ? "" : "none";
  }, [frameEl, chromeVisible]);

  const accessor = React.useMemo(() => slotStyles(styles, VIDEO_SLOT_KEYS), [styles]);

  const ctx: VideoContextValue = React.useMemo(
    () => ({
      controller,
      store,
      capabilities: controller.capabilities,
      size,
      contentFit,
      controlsVisible: chromeVisible,
      keepAlive,
      holdControls,
      styles: accessor,
    }),
    [controller, store, size, contentFit, chromeVisible, keepAlive, holdControls, accessor],
  );

  const showChrome = controls !== false && !nativeControls;

  return (
    <VideoContext.Provider value={ctx}>
      <VideoFrame
        ref={setFrameRef}
        testID={testID}
        width={width}
        height={height}
        aspectRatio={aspectRatio}
        {...accessor.get("root")}
      >
        {/* Poster placeholder (shown while this player is idle; the teleported
            shared <video> covers it when this player is active). */}
        {poster ? (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="black"
            style={
              isWeb
                ? ({
                    backgroundImage: `url("${poster}")`,
                    backgroundSize: contentFit === "cover" ? "cover" : "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  } as never)
                : undefined
            }
          />
        ) : null}

        {/* The shared VideoView teleports into this host while this player is
            active. The host must carry its own fill size: react-native-teleport
            re-parents the surface INTO this node, and the surface is absolutely
            positioned — on native it sizes to its direct parent (this host), so a
            zero-size host would collapse the video. Absolute inset:0 stretches it
            to the frame on both platforms (and gives web a positioned ancestor). */}
        <PortalHost name={videoHostName(playerId)} style={SURFACE_HOST_STYLE} />

        {/* Tap layer: reveal chrome / toggle on tap, without blocking controls. */}
        {showChrome ? (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            onPress={() => (chromeVisible ? tapTogglePlay() : keepAlive())}
          />
        ) : null}

        {/* Captions are content, not chrome — shown even with custom/no controls. */}
        <CaptionOverlay />

        {showChrome && showBigPlayButton ? <BigPlayButton /> : null}
        {showChrome ? <BufferingOverlay /> : null}
        {showChrome ? <ErrorOverlay /> : null}

        {showChrome ? (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            pointerEvents="box-none"
            opacity={chromeVisible ? 1 : 0}
            transition={chromeMotion.transition}
            {...accessor.get("scrim")}
          >
            {/* Bottom scrim for legibility — one `backgroundImage` linear gradient
                on both platforms (Tamagui maps it to RN's experimental gradient
                on native, CSS `background-image` on web). */}
            <Box
              position="absolute"
              left={0}
              right={0}
              bottom={0}
              height="55%"
              pointerEvents="none"
              backgroundImage={makeScrimGradient(scrimColor)}
            />
            <VideoControlBarFrame
              pointerEvents="auto"
              paddingHorizontal={controlsOffset as never}
              // Hovering the bar (and any flyout that descends from it) pins the
              // chrome open on web; leaving it re-arms the auto-hide timer.
              {...hoverProps(
                isWeb
                  ? { onHoverIn: () => holdControls(true), onHoverOut: () => holdControls(false) }
                  : {},
              )}
              {...accessor.get("controlBar")}
            >
              {controls === true ? <ControlBar /> : controls}
            </VideoControlBarFrame>
          </Box>
        ) : null}
      </VideoFrame>
    </VideoContext.Provider>
  );
}

/**
 * `<Video>` with attached compound parts for custom layouts:
 *
 *   <Video source={src} controls={<Video.ControlBar />} />
 *
 *   <Video source={src} controls={
 *     <Group><Video.PlayPause /><Video.Scrubber /><Video.Fullscreen /></Group>
 *   } />
 */
export const Video = withStaticProperties(VideoRoot, {
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
  Settings: SettingsMenu,
  PiP: PiPButton,
  Fullscreen: FullscreenButton,
  BigPlayButton,
  Buffering: BufferingOverlay,
  Captions: CaptionOverlay,
  Error: ErrorOverlay,
  /** Escape hatch for advanced custom chrome. */
  useVideo,
});
