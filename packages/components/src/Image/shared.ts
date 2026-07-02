/**
 * Cross-platform helpers shared by the `Image` component (`Image.tsx`, backed by
 * expo-image on every platform) and the `createImage` factory. Keeping source
 * resolution, fit mapping, fallback state, and static-method wiring in one place
 * stops the public surface from drifting apart.
 */
import type { ImageContentPosition } from "expo-image";
import * as React from "react";

import type {
  ImageHostResizeMode,
  ImageObjectFit,
  ImageObjectPosition,
  ImageProps,
  ImageType,
} from "./types";

/**
 * Pull a usable `src` value (URL string, `require()` number, or `{ uri }`
 * object) out of either the `src` or deprecated `source` prop. Returns
 * `undefined` when nothing renderable is present.
 */
export const resolveSource = (value: unknown): string | number | undefined => {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && "uri" in value) return (value as { uri?: string }).uri;
  return undefined;
};

/**
 * Map a CSS `object-fit` value onto expo-image's `contentFit`. The two enums are
 * identical, so this is an identity pass-through kept as a named helper for
 * symmetry with `objectFitToResizeMode`.
 */
export const objectFitToContentFit = (objectFit: string): ImageObjectFit =>
  objectFit as ImageObjectFit;

const HORIZONTAL_EDGES = new Set(["left", "right"]);
const VERTICAL_EDGES = new Set(["top", "bottom"]);
const POSITION_KEYWORDS = new Set(["left", "right", "top", "bottom", "center"]);

/**
 * Normalize an `objectPosition` value into the edge-keyed object form
 * (`{ top | bottom, left | right }`) that expo-image understands on every
 * platform.
 *
 * expo-image's web `<img>` renderer only converts the OBJECT form of
 * `contentPosition` to CSS `object-position` — it spreads the value and reads
 * `top/bottom/left/right`. A keyword string like `"top"` (valid in the type and
 * on native) spreads to nothing, so web silently falls back to centered. We
 * therefore parse CSS-style strings (`"top"`, `"bottom right"`, `"25% 50%"`)
 * into the object form here; the result is equally valid on native, so this
 * stays a single cross-platform code path.
 */
export const normalizeContentPosition = (
  value: ImageObjectPosition | undefined,
): ImageContentPosition | undefined => {
  // Nullish or already the object form → forward untouched.
  if (value == null || typeof value !== "string") return value as ImageContentPosition | undefined;

  const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return undefined;

  const position: Record<string, number | string> = {};
  let horizontalSet = false;
  let verticalSet = false;

  // Assign a single keyword to its edge (offset 0). `center` is a no-op — the
  // defaults below center any axis left unset. Returns false for non-keywords.
  const assignKeyword = (token: string): boolean => {
    if (HORIZONTAL_EDGES.has(token)) {
      position[token] = 0;
      horizontalSet = true;
      return true;
    }
    if (VERTICAL_EDGES.has(token)) {
      position[token] = 0;
      verticalSet = true;
      return true;
    }
    return token === "center";
  };

  if (tokens.length === 1) {
    // A lone length/percentage applies to the horizontal axis (CSS rule).
    if (!assignKeyword(tokens[0])) {
      position.left = tokens[0];
      horizontalSet = true;
    }
  } else if (tokens.every((token) => POSITION_KEYWORDS.has(token))) {
    // Keyword pair in any order, e.g. "top right" / "right top".
    tokens.forEach(assignKeyword);
  } else {
    // "x y" form: first token is horizontal, second vertical.
    const [x, y] = tokens;
    if (!assignKeyword(x)) {
      position.left = x;
      horizontalSet = true;
    }
    if (!assignKeyword(y)) {
      position.top = y;
      verticalSet = true;
    }
  }

  if (!horizontalSet) position.left = "50%";
  if (!verticalSet) position.top = "50%";

  return position as ImageContentPosition;
};

/** Map a CSS `object-fit` value onto React Native's legacy `resizeMode`. */
export const objectFitToResizeMode = (objectFit: string): ImageHostResizeMode => {
  switch (objectFit) {
    case "fill":
      return "stretch";
    case "none":
      return "center";
    case "scale-down":
    case "contain":
      return "contain";
    default:
      return "cover";
  }
};

/** Map React Native's legacy `resizeMode` onto a CSS `object-fit` value. */
export const resizeModeToObjectFit = (
  resizeMode: ImageProps["resizeMode"],
): ImageObjectFit | undefined => {
  switch (resizeMode) {
    case "stretch":
      return "fill";
    case "contain":
      return "contain";
    case "cover":
      return "cover";
    case "center":
      return "none";
    default:
      return undefined;
  }
};

/**
 * Track whether the primary source failed to load so a `fallbackSrc` can take
 * over. Seeds the error state when there is no primary source at all, and
 * resets whenever the resolved source changes.
 */
export const useImageFallback = (resolvedSrc: string | number | undefined) => {
  const [errored, setErrored] = React.useState(!resolvedSrc);

  React.useEffect(() => {
    setErrored(!resolvedSrc);
  }, [resolvedSrc]);

  const markErrored = React.useCallback(() => setErrored(true), []);

  return { errored, markErrored };
};

type ImageStaticHost = Partial<ImageType>;

const noopBoolAsync = (() => Promise.resolve(false)) as ImageType["prefetch"];
const noopClearAsync = (() => Promise.resolve(false)) as ImageType["clearMemoryCache"];
const noopCachePath = (() => Promise.resolve(null)) as ImageType["getCachePathAsync"];
const noopBlurhash = (() => Promise.resolve(null)) as ImageType["generateBlurhashAsync"];
const noopLoad = (() =>
  Promise.reject(
    new Error("Image.loadAsync is not supported on this platform"),
  )) as ImageType["loadAsync"];

/**
 * Attach expo-image's static methods (`prefetch`, `clearMemoryCache`,
 * `getCachePathAsync`, …) to a component, preferring the host implementation and
 * falling back to safe no-ops so the cross-platform `ImageType` surface is always
 * met. Returns `target` widened to include the statics; the single cast is sound
 * because every static is assigned below.
 */
export const attachImageStatics = <T extends object>(
  target: T,
  host: ImageStaticHost = {},
): T & ImageType => {
  const image = target as T & ImageType;
  image.prefetch = host.prefetch ?? noopBoolAsync;
  image.clearMemoryCache = host.clearMemoryCache ?? noopClearAsync;
  image.clearDiskCache = host.clearDiskCache ?? noopClearAsync;
  image.getCachePathAsync = host.getCachePathAsync ?? noopCachePath;
  image.generateBlurhashAsync = host.generateBlurhashAsync ?? noopBlurhash;
  image.loadAsync = host.loadAsync ?? noopLoad;
  return image;
};
