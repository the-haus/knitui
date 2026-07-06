/**
 * Resolving the many shapes an "SVG resource" can take into the two things the
 * icon pipeline actually needs: **SVG markup to rasterize**, or a **ready raster
 * to register as-is**.
 *
 * A resource may be:
 *   - inline SVG markup (a string of `<svg>…</svg>`),
 *   - a URL to an `.svg` file (fetched, then rasterized),
 *   - a URL to a raster (`.png`/`.jpg`/…) — registered directly, no rasterization,
 *   - a `require()`d bundled asset (a number, or a resolved URL) — registered directly.
 */

import { useEffect, useRef, useState } from "react";

import type { ImageEntry } from "../components/Images";

/** `true` when `value` looks like inline SVG markup rather than a URL/path. */
export function isSvgMarkup(value: string): boolean {
  return /<svg[\s>]/i.test(value);
}

/**
 * `true` when a URI points at an SVG (so it must be fetched + rasterized) rather
 * than a raster image (which can be registered directly). Handles query strings
 * and `data:` URIs.
 */
export function isSvgUri(uri: string): boolean {
  if (/^data:image\/svg\+xml/i.test(uri)) return true;
  if (/^data:/i.test(uri)) return false; // any other data URI is already a raster
  const path = uri.split(/[?#]/, 1)[0];
  return /\.svg$/i.test(path);
}

/** Fetch an SVG document and return its markup. Throws on a non-OK response. */
export async function fetchSvgMarkup(uri: string): Promise<string> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to fetch SVG "${uri}": ${res.status} ${res.statusText}`);
  return res.text();
}

/**
 * The raster `ImageEntry` to register directly, or `undefined` when the resource
 * is SVG markup that must be rasterized first. `source` always wins; otherwise a
 * non-SVG `uri` is treated as a ready raster.
 */
export function resolvePassthrough(source?: ImageEntry, uri?: string): ImageEntry | undefined {
  if (source != null) return source;
  if (uri && !isSvgUri(uri)) return uri;
  return undefined;
}

/**
 * Resolve inline/remote SVG markup for rasterization. Inline `svg` is returned
 * immediately; a `.svg` `uri` is fetched (re-fetching only when the URL changes).
 * Returns `null` for raster passthroughs and while a remote SVG is still loading.
 */
export function useSvgMarkup(svg?: string, uri?: string): string | null {
  const [fetched, setFetched] = useState<string | null>(null);
  const lastUri = useRef<string | null>(null);

  const remoteSvgUri = !svg && uri && isSvgUri(uri) ? uri : null;

  useEffect(() => {
    if (!remoteSvgUri) {
      lastUri.current = null;
      setFetched(null);
      return;
    }
    if (lastUri.current === remoteSvgUri) return;
    lastUri.current = remoteSvgUri;

    let cancelled = false;
    setFetched(null);
    fetchSvgMarkup(remoteSvgUri)
      .then((markup) => {
        if (!cancelled) setFetched(markup);
      })
      .catch((err) => {
        if (!cancelled && __DEV__) console.warn(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [remoteSvgUri]);

  if (svg) return svg;
  return remoteSvgUri ? fetched : null;
}

declare const __DEV__: boolean;
