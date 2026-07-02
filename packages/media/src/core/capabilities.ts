/**
 * Generic capability-refinement helper shared by both media domains. Each domain
 * keeps its own `WEB`/`NATIVE` capability constants (the data genuinely differs),
 * but the "start from the web baseline and override with runtime probes" merge is
 * identical, so it lives here once.
 */

/**
 * Returns a copy of `base` with each defined field of `overrides` applied.
 * `undefined` override values are skipped — they mean "no probe result, keep the
 * baseline" — which mirrors the `probe ?? base` idiom the domain resolvers used.
 */
export function refineCapabilities<C extends object>(base: C, overrides: Partial<C>): C {
  const result = { ...base };
  for (const key in overrides) {
    const value = overrides[key as keyof C];
    if (value !== undefined) {
      result[key as keyof C] = value as C[keyof C];
    }
  }
  return result;
}

/**
 * Whether the browser honors programmatic volume. iOS / mobile Safari force
 * volume to hardware control and ignore `el.volume`, so the volume slider is
 * hidden there. Returns `true` outside the browser (no DOM to probe). Shared by
 * both domains' web capability resolvers — the UA sniff is identical.
 */
export function detectVolumeControllable(): boolean {
  if (typeof navigator === "undefined" || typeof document === "undefined") return true;
  const ua = navigator.userAgent || "";
  const isIOS = /iP(hone|od|ad)/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  return !isIOS;
}
