import type { ShareContent, ShareResult } from "./share.shared";

/**
 * Open the platform share sheet (web: the Web Share API, `navigator.share`) —
 * resolves how it ended, never rejects. Most desktop browsers have no share
 * sheet, so expect `"unavailable"` there and fall back (see `useClipboard`).
 * Must be called from a user gesture. The `share.native` sibling uses React
 * Native's `Share`.
 */
export async function share({ title, message, url }: ShareContent): Promise<ShareResult> {
  // Feature-detected per call: this module may be evaluated on the server.
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unavailable";
  }
  try {
    await navigator.share({ title, text: message, url });
    return "shared";
  } catch (error) {
    // Dismissing the sheet rejects with `AbortError`. Anything else (a browser
    // that advertises `share` but refuses this payload, a non-secure context, a
    // missing user gesture) is a sheet that isn't available for this call.
    if (error instanceof Error && error.name === "AbortError") return "dismissed";
    return "unavailable";
  }
}
