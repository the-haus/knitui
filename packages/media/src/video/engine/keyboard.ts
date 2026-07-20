/**
 * Keyboard-shortcut mapping for the video player. Wraps the common media shortcut
 * set (which lives once in `@knitui/media`'s shared internals) and adds the two
 * video-surface keys — `f`/`F` for fullscreen and `p`/`P` for picture-in-picture.
 * DOM-free so it can be unit-tested directly.
 */
import { type MediaKeyAction, type MediaKeyOptions, resolveMediaKeyAction } from "../../shared";

export type VideoKeyOptions = MediaKeyOptions;

export type VideoKeyAction =
  MediaKeyAction | { type: "toggleFullscreen" } | { type: "togglePictureInPicture" };

/**
 * Maps a `KeyboardEvent.key` to a player action, or `null` if the key is not a
 * shortcut (the caller should then let the event through). Letter keys are
 * case-insensitive.
 */
export function resolveKeyAction(
  key: string,
  options: VideoKeyOptions = {},
): VideoKeyAction | null {
  switch (key) {
    case "f":
    case "F":
      return { type: "toggleFullscreen" };
    case "p":
    case "P":
      return { type: "togglePictureInPicture" };
    default:
      return resolveMediaKeyAction(key, options);
  }
}
