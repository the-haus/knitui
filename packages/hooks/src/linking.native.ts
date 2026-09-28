import { Linking } from "react-native";

/**
 * Handing a URL to the outside world — the NATIVE half (React Native `Linking`).
 * Every function resolves (never rejects); see `linking.ts` for the web half.
 */

/**
 * Open `url` in the system browser, or the app that claims it. `Linking.openURL`
 * REJECTS when nothing can handle the URL (a `geo:` link on a device with no maps
 * app) — that rejection is the `false`.
 */
export async function openURL(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether an installed app can handle `url`. On iOS this only answers truthfully
 * for schemes the app declares in `LSApplicationQueriesSchemes` (Info.plist);
 * any other scheme reads `false`. On Android 11+ the scheme needs a matching
 * `<queries>` entry in the manifest.
 */
export async function canOpenURL(url: string): Promise<boolean> {
  try {
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
}

/**
 * Open this app's own page in the system Settings app — where its permission
 * switches live. It can't reach a system-wide pane (iOS Location Services), so
 * only offer it for a grant the app itself holds.
 */
export async function openAppSettings(): Promise<boolean> {
  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}
