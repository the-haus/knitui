/**
 * Keyboard-shortcut mapping for the audio player. Audio has no video surface, so
 * it uses the common media shortcut set verbatim (no fullscreen / PiP). The
 * mapping itself lives once in `@knitui/media`'s shared internals; this module
 * re-exports it under the audio-domain names so existing `../engine` imports keep
 * working.
 */
import { type MediaKeyAction, type MediaKeyOptions, resolveMediaKeyAction } from "../../shared";

export type AudioKeyOptions = MediaKeyOptions;
export type AudioKeyAction = MediaKeyAction;

/**
 * Maps a `KeyboardEvent.key` to a player action, or `null` if the key is not a
 * shortcut (the caller should then let the event through). Letter keys are
 * case-insensitive.
 */
export const resolveKeyAction: (key: string, options?: AudioKeyOptions) => AudioKeyAction | null =
  resolveMediaKeyAction;
