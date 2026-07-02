import { useAudioPlayerStatus } from "expo-audio";
/**
 * Drives the shared audio engine's playback status from a React COMMIT-phase
 * hook, instead of relying solely on the controller's constructor-attached
 * `player.addListener('playbackStatusUpdate', …)`.
 *
 * Why this exists: the engine builds its `ExpoAudioController` imperatively inside
 * `<MediaProvider>`'s `useMemo` (render phase), and on iOS a `playbackStatusUpdate`
 * listener attached to a `createAudioPlayer` player OFF the React lifecycle never
 * receives events — playback runs but no status ever reaches JS, so currentTime /
 * duration / isLive freeze at their initial values (web + Android are unaffected).
 * `useAudioPlayerStatus` subscribes the way expo-audio's own hooks do — in a
 * mounted effect on the retained player — which delivers reliably on iOS.
 *
 * It feeds every status into {@link ExpoAudioController.applyStatus}; `setState`
 * de-dupes, so on platforms where the imperative listener already fires this is a
 * harmless no-op rather than a double update.
 */
import * as React from "react";

import type { ExpoAudioController } from "../controller/expo-controller";

export function AudioStatusBridge({
  controller,
}: {
  controller: ExpoAudioController;
}): React.ReactElement | null {
  const status = useAudioPlayerStatus(controller.player);
  React.useEffect(() => {
    if (status) controller.applyStatus(status);
  }, [controller, status]);
  return null;
}
