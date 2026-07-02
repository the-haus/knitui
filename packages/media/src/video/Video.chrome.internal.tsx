/**
 * Shared local helpers + constants for the `<Video>` control chrome. These are
 * private to the `Video.chrome.*` modules (not part of the public surface); they
 * live here so the chrome's split files (controls, overlays, menus) can share
 * them without importing each other and creating cycles.
 */
import * as React from "react";

import { ControlIconProvider } from "@knitui/components/control-system";
import { IconVolume, IconVolume2, IconVolumeOff } from "@knitui/icons";

import { clampMediaSize, type MediaSize } from "../control-size";

/**
 * Publish the over-media icon context for a `<Video>` control: glyphs auto-size to
 * the control's size key (canonical ladder) and paint crisp white-on-scrim via the
 * theme-independent `$mediaOnScrim` token. This is the video equivalent of the
 * icon context `ActionIcon` already provides on a normal surface — used INSIDE the
 * transport `ActionIcon`s, where the surrounding fill is the video, not a theme
 * color, so the variant foreground would be wrong. Replaces the old per-icon
 * `size={iconSizeFor(size)} color={ON_DARK}` threading.
 */
export function OnScrimIcons({
  size,
  children,
}: {
  size: MediaSize;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <ControlIconProvider size={clampMediaSize(size)} color="$mediaOnScrim">
      {children}
    </ControlIconProvider>
  );
}

/** Pick the speaker glyph that matches the current level (off / low / full). */
export function volumeIconFor(muted: boolean, volume: number): typeof IconVolume {
  if (muted || volume === 0) return IconVolumeOff;
  if (volume < 0.5) return IconVolume2;
  return IconVolume;
}

/**
 * Drive a menu's open state while pinning the chrome open. The auto-hide timer
 * is suspended for as long as the menu is open (and re-armed on close/unmount)
 * so a dropdown never collapses out from under the user mid-selection.
 */
export function useHoldWhileOpen(
  holdControls: (active: boolean) => void,
  keepAlive: () => void,
): [boolean, (opened: boolean) => void] {
  const [opened, setOpened] = React.useState(false);
  React.useEffect(() => {
    if (!opened) return undefined;
    holdControls(true);
    return () => holdControls(false);
  }, [opened, holdControls]);
  const onChange = React.useCallback(
    (next: boolean) => {
      setOpened(next);
      if (next) keepAlive();
    },
    [keepAlive],
  );
  return [opened, onChange];
}
