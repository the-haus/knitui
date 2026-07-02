/**
 * Default (web + Android) `AudioStatusBridge` — a NO-OP.
 *
 * Only iOS needs the commit-phase status bridge: there, a `playbackStatusUpdate`
 * listener attached imperatively off the React render phase never fires, so the
 * `.ios` variant re-drives status via `useAudioPlayerStatus`. On web and Android
 * the controller's own `player.addListener` delivers status normally, so this
 * variant renders nothing and avoids a redundant subscription. (Jest resolves
 * this base file, not the `.ios` one — so the web-target tests don't touch the
 * hook, which can't run against jsdom's non-functional media element.)
 */
import type * as React from "react";

import type { ExpoAudioController } from "../controller/expo-controller";

export function AudioStatusBridge(_props: {
  controller: ExpoAudioController;
}): React.ReactElement | null {
  return null;
}
