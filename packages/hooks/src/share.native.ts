import { Platform, Share } from "react-native";

import type { ShareContent, ShareResult } from "./share.shared";

/**
 * Open the platform share sheet on React Native — resolves how it ended, never
 * rejects. Native counterpart of `share.ts`.
 *
 * The two platforms carry a URL differently and no one payload works on both:
 * iOS treats `url` as a first-class item (it previews the link and lets AirDrop /
 * Messages attach it), while Android's `ACTION_SEND` ignores `url` entirely and
 * shares only the text. So Android gets the URL appended to the message, and iOS
 * gets them separately — passing the URL in both places on iOS would send it twice.
 * Android's `dismissedAction` is never reported (the chooser gives no signal), so
 * a dismissed Android sheet reads as `"shared"`.
 */
export async function share({ title, message, url }: ShareContent): Promise<ShareResult> {
  const text = Platform.OS === "ios" ? message : [message, url].filter(Boolean).join(" ");
  const content =
    Platform.OS === "ios" && url ? { message, url, title } : { message: text ?? "", title };
  try {
    const result = await Share.share(content, { subject: title, dialogTitle: title });
    return result.action === Share.sharedAction ? "shared" : "dismissed";
  } catch {
    return "unavailable";
  }
}
