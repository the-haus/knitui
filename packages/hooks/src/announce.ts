/**
 * Screen-reader announcements — the WEB half: a visually hidden live region the
 * kit mounts on `document.body` the first time it's needed. The `announce.native`
 * sibling calls the OS announcement API (iOS has no live regions at all).
 */

import type { AnnounceOptions } from "./announce.shared";

const VISUALLY_HIDDEN =
  "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;" +
  "clip:rect(0,0,0,0);white-space:nowrap;border:0;";

const regions: Partial<Record<"polite" | "assertive", HTMLElement>> = {};

function regionFor(politeness: "polite" | "assertive"): HTMLElement {
  const existing = regions[politeness];
  if (existing?.isConnected) return existing;
  const region = document.createElement("div");
  region.setAttribute("role", politeness === "assertive" ? "alert" : "status");
  region.setAttribute("aria-live", politeness);
  region.setAttribute("aria-atomic", "true");
  region.setAttribute("data-knitui-announcer", politeness);
  region.style.cssText = VISUALLY_HIDDEN;
  document.body.appendChild(region);
  regions[politeness] = region;
  return region;
}

/**
 * Speak `message` to screen readers without showing anything ("12 results",
 * "Message sent"). The region is emptied first and the text written a tick later,
 * because a live region is only read when its content CHANGES — the same message
 * twice would otherwise be spoken once, and a region created in the same tick as
 * its text is often not read at all.
 *
 * If the app already keeps its own live region for this (a toast host with
 * `role="status"`), route announcements through that instead so two regions don't
 * both speak.
 */
export function announce(message: string, { politeness = "polite" }: AnnounceOptions = {}): void {
  if (typeof document === "undefined" || !document.body) return;
  const region = regionFor(politeness);
  region.textContent = "";
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}
