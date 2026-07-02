/**
 * Formats a duration in seconds as a clock string. Pure — no platform deps.
 * Shared by the media players (`@knitui/media/audio`, `@knitui/media/video`).
 *
 *   formatTime(0)      // "0:00"
 *   formatTime(75)     // "1:15"
 *   formatTime(3661)   // "1:01:01"
 *
 * The hours field only appears once the duration crosses an hour, and the
 * minutes field is zero-padded only when hours are shown, matching the
 * convention used by most native media players.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const ss = secs.toString().padStart(2, "0");
  if (hrs > 0) {
    const mm = mins.toString().padStart(2, "0");
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mins}:${ss}`;
}
