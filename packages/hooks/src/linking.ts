/**
 * Handing a URL to the outside world — the WEB half. The `linking.native`
 * sibling wraps React Native's `Linking`. Every function resolves (never
 * rejects), so a caller can branch on the result without a try/catch.
 */

/**
 * Open `url` in a NEW tab, so the page the reader is mid-task on survives the
 * trip. Resolves `true` once handed off, `false` only where there is no `window`
 * (SSR).
 *
 * The new tab is detached from this one (`opener = null`) because the target is
 * usually cross-origin and must not get a live `window.opener` handle back. That
 * is done by hand rather than with the `noopener` feature string: with
 * `noopener`, `window.open` is specified to return `null` EVEN ON SUCCESS, which
 * makes a blocked popup indistinguishable from an opened one. A popup blocker
 * that does return `null` gets an in-place navigation instead — worse than a new
 * tab, better than a dead press.
 */
export async function openURL(url: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const opened = window.open(url, "_blank");
  if (opened) {
    try {
      opened.opener = null;
    } catch {
      // Already cross-origin (some browsers commit the navigation synchronously);
      // the window is then isolated by COOP/`noopener`-by-default anyway.
    }
    return true;
  }
  window.location.href = url;
  return true;
}

/**
 * Whether something can handle `url`. A browser will attempt any URL (an unknown
 * scheme fails silently in the new tab), so the web answer is always `true`; the
 * question only has a real answer on native.
 */
export async function canOpenURL(_url: string): Promise<boolean> {
  return typeof window !== "undefined";
}

/**
 * Open this app's own page in the system Settings — where its permission
 * switches live. A web page has no such page (site permissions live in browser
 * chrome no page can reach), so this resolves `false`; hide the control on web.
 */
export async function openAppSettings(): Promise<boolean> {
  return false;
}
