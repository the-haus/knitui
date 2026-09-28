import { AccessibilityInfo } from "react-native";

import type { AnnounceOptions } from "./announce.shared";

/**
 * Speak `message` through VoiceOver / TalkBack — the NATIVE half. iOS has no live
 * regions, so the OS announcement API is the one path that reaches both screen
 * readers. `assertive` uses the queue-interrupting variant where the platform
 * has one.
 */
export function announce(message: string, { politeness = "polite" }: AnnounceOptions = {}): void {
  if (politeness === "assertive") {
    AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: false });
    return;
  }
  AccessibilityInfo.announceForAccessibility(message);
}
