/**
 * `<AudioPlaylist>` — the composed, cross-platform playlist player.
 *
 * A SINGLE root works on both platforms: `useAudioPlaylistController` is a queue
 * over the one shared audio engine (whose `expo-audio` backend resolves per
 * platform), so there is no surface element to render. This root wires the
 * controller into context, renders the control bar + track list, forwards
 * callbacks, and binds web keyboard shortcuts.
 */
import * as React from "react";

import { slotStyles, type TamaguiElement, withStaticProperties } from "@knitui/core";

import { resolveKeyAction } from "../engine";
import { useAudioPlaylistController } from "../hooks/useAudioPlaylistController";
import {
  ControlBar,
  LoopButton,
  NextButton,
  PlayPauseButton,
  PreviousButton,
  Scrubber,
  TimeDisplay,
  TrackList,
  VolumeControl,
} from "./AudioPlaylist.chrome";
import {
  AUDIO_PLAYLIST_SLOT_KEYS,
  AudioPlaylistContext,
  type AudioPlaylistContextValue,
  AudioPlaylistFrame,
  type AudioPlaylistProps,
  useAudioPlaylistContext,
} from "./AudioPlaylist.shared";

function AudioPlaylistRoot(props: AudioPlaylistProps): React.ReactElement {
  const {
    sources,
    loop,
    volume,
    muted,
    playbackRate,
    size = "md",
    controls = true,
    showTrackList = true,
    keyboard = true,
    label = "Audio playlist",
    getController,
    onTrackChange,
    onEnded,
    onError,
    styles,
    testID,
    width = "100%",
    maxWidth,
  } = props;

  const { controller, store } = useAudioPlaylistController({
    sources,
    loop,
    volume,
    muted,
    playbackRate,
  });

  React.useEffect(() => {
    getController?.(controller);
  }, [controller, getController]);

  React.useEffect(() => {
    const unsubs = [
      onTrackChange &&
        controller.on("trackChange", (p) => onTrackChange(p.currentIndex, p.previousIndex)),
      onEnded && controller.on("playToEnd", () => onEnded()),
      onError && controller.on("error", (e) => onError(e)),
    ].filter(Boolean) as Array<() => void>;
    return () => unsubs.forEach((u) => u());
  }, [controller, onTrackChange, onEnded, onError]);

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
      // Read the live snapshot at event time so the root needn't re-render per
      // tick just to keep a fresh `state` around for this handler.
      const s = controller.state;
      switch (action.type) {
        case "togglePlay":
          controller.togglePlay();
          break;
        case "seekBy":
          void controller.seekBy(action.seconds);
          break;
        case "seekToFraction":
          if (Number.isFinite(s.duration) && s.duration > 0)
            void controller.seekTo(s.duration * action.fraction);
          break;
        case "toggleMute":
          controller.toggleMuted();
          break;
        case "adjustVolume": {
          const v = Math.min(1, Math.max(0, s.volume + action.delta));
          controller.setVolume(v);
          break;
        }
        case "adjustRate":
          controller.setPlaybackRate(Math.min(4, Math.max(0.25, s.playbackRate + action.delta)));
          break;
      }
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [frameEl, controller, keyboard, label]);

  const accessor = React.useMemo(() => slotStyles(styles, AUDIO_PLAYLIST_SLOT_KEYS), [styles]);

  const ctx: AudioPlaylistContextValue = React.useMemo(
    () => ({ controller, store, capabilities: controller.capabilities, size, styles: accessor }),
    [controller, store, size, accessor],
  );

  return (
    <AudioPlaylistContext.Provider value={ctx}>
      <AudioPlaylistFrame
        ref={setFrameRef}
        testID={testID}
        width={width}
        maxWidth={maxWidth}
        {...accessor.get("root")}
      >
        {showTrackList ? <TrackList /> : null}
        {controls === false ? null : controls === true ? <ControlBar /> : controls}
      </AudioPlaylistFrame>
    </AudioPlaylistContext.Provider>
  );
}

export const AudioPlaylist = withStaticProperties(AudioPlaylistRoot, {
  ControlBar,
  PlayPause: PlayPauseButton,
  Previous: PreviousButton,
  Next: NextButton,
  Loop: LoopButton,
  Scrubber,
  Time: TimeDisplay,
  Volume: VolumeControl,
  TrackList,
  useAudioPlaylist: useAudioPlaylistContext,
});
