/**
 * Internal helpers shared by the `<Audio>` control chrome modules
 * ({@link ./Audio.chrome} and {@link ./Audio.chrome.controls}). Kept in their own
 * module so both files import from here and neither has to depend on the other.
 */
import { IconVolume } from "@knitui/icons/IconVolume";
import { IconVolume2 } from "@knitui/icons/IconVolume2";
import { IconVolume3 } from "@knitui/icons/IconVolume3";
import { IconVolumeOff } from "@knitui/icons/IconVolumeOff";

/** Pick the speaker glyph that matches the current level (off / low / mid / full). */
export function volumeIconFor(muted: boolean, volume: number): typeof IconVolume {
  if (muted || volume === 0) return IconVolumeOff;
  if (volume < 0.33) return IconVolume2;
  if (volume < 0.66) return IconVolume3;
  return IconVolume;
}
