/// <reference lib="dom" />
import type { Image as ExpoImage } from "expo-image";
import * as React from "react";
import { View } from "react-native";

import { createImage } from "./createImage";
import { normalizeContentPosition, objectFitToContentFit } from "./shared";
import type { ImageObjectFit, ImageObjectPosition, ImageType } from "./types";

/**
 * Web `Image`: the same component and props as the native one (`Image.native.tsx`,
 * expo-image), rendered as a wrapper view plus a real `<img>` that is in the
 * very first render — so it is in the server HTML, and an image the browser
 * already has paints on the frame it mounts.
 *
 * Why not expo-image's own web build: it renders NOTHING until an effect adds
 * its `<img>` (one blank frame per mount, an empty box in the SSR markup), and
 * its fade starts every mount at `opacity: 0` — cached or not. A virtualized
 * list, a revisited page or a hydrating one remounts images all the time, so
 * every one of them blinked.
 *
 * Shown as soon as the browser can: `transition` is a NATIVE fade. On the web
 * the `<img>` is never held hidden; the browser paints it as it decodes (a
 * cached one at once), over whatever backdrop the caller gives the box.
 *
 * Kept from expo-image's web behaviour: `contentFit` → `object-fit` (default
 * `cover`), `contentPosition` → `object-position`, lazy loading (the browser
 * fetches an image as it nears the viewport), `priority` → `fetchpriority`,
 * `blurRadius` → a CSS blur, a URL `placeholder` shown until the image loads
 * (`placeholderContentFit`, default `scale-down`), and the load / error /
 * display events with expo-image's payloads. `Image.prefetch` preloads through
 * the browser cache.
 *
 * Not on web: BlurHash / ThumbHash placeholders (only URL placeholders render),
 * `tintColor`, `transition`, and the cache-management statics
 * (`clearMemoryCache` / `clearDiskCache` / `getCachePathAsync` /
 * `generateBlurhashAsync` / `loadAsync` resolve as the no-ops `createImage`
 * provides).
 */

type Source = { uri?: string; width?: number; height?: number } | string | number | null;
type ContentPosition = Exclude<ImageObjectPosition, string> | string;

type WebImageProps = {
  source?: Source | Source[];
  placeholder?: Source | Source[];
  contentFit?: ImageObjectFit;
  contentPosition?: ContentPosition;
  placeholderContentFit?: ImageObjectFit;
  blurRadius?: number;
  priority?: "low" | "normal" | "high" | null;
  loading?: "lazy" | "eager";
  responsivePolicy?: string;
  accessibilityLabel?: string;
  alt?: string;
  draggable?: boolean;
  onLoadStart?: () => void;
  onLoad?: (event: {
    source: { url: string; width: number; height: number; mediaType: null };
    cacheType: "none";
  }) => void;
  onError?: (event: { error: string }) => void;
  onLoadEnd?: () => void;
  onDisplay?: () => void;
  // Accepted for parity with the native surface; no web effect.
  transition?: unknown;
  tintColor?: unknown;
  cachePolicy?: unknown;
  recyclingKey?: unknown;
  style?: unknown;
};

const FILL: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
};

/** The first renderable URL of an expo-image source (string, `{ uri }`, list). */
function sourceUri(source: Source | Source[] | undefined): string | undefined {
  const first = Array.isArray(source) ? source[0] : source;
  if (first == null || typeof first === "number") return undefined;
  if (typeof first === "string") return first;
  return first.uri;
}

/** A placeholder string is a URL, not a BlurHash / ThumbHash. */
function isUrlLike(value: string): boolean {
  return /^(https?:|data:|blob:|file:|\/|\.\.?\/)/.test(value) || value.includes("://");
}

/** expo-image's web units: numbers are px, percentages pass through. */
function webUnits(value: string | number): string {
  const text = String(value).trim();
  return text.endsWith("%") ? text : `${text}px`;
}

/** expo-image's `contentPosition` (object or CSS string) → CSS `object-position`. */
export function objectPositionOf(position: ContentPosition | undefined): string {
  const object = normalizeContentPosition(position as ImageObjectPosition | undefined) as
    Record<string, string | number> | undefined;
  if (!object) return "50% 50%";
  const resolved = { ...object };
  if (resolved.top == null && resolved.bottom == null) resolved.top = "50%";
  if (resolved.left == null && resolved.right == null) resolved.left = "50%";
  return (
    (["top", "bottom", "left", "right"] as const)
      .filter((key) => resolved[key] != null)
      .map((key) => `${key} ${webUnits(resolved[key]!)}`)
      .join(" ") || "50% 50%"
  );
}

const WebImage = React.forwardRef<unknown, WebImageProps>(function WebImage(props, ref) {
  const {
    source,
    placeholder,
    contentFit = "cover",
    contentPosition,
    placeholderContentFit = "scale-down",
    blurRadius,
    priority,
    loading,
    responsivePolicy,
    accessibilityLabel,
    alt,
    draggable,
    onLoadStart,
    onLoad,
    onError,
    onLoadEnd,
    onDisplay,
    transition: _transition,
    tintColor: _tintColor,
    cachePolicy: _cachePolicy,
    recyclingKey: _recyclingKey,
    style,
    ...rest
  } = props as WebImageProps & Record<string, unknown>;

  const uri = sourceUri(source);
  const placeholderValue = sourceUri(placeholder);
  const placeholderUri =
    placeholderValue && isUrlLike(placeholderValue) ? placeholderValue : undefined;
  // Keyed on the source, so a new `uri` brings its placeholder back without an effect.
  const [loadedUri, setLoadedUri] = React.useState<string>();

  React.useEffect(() => {
    if (uri) onLoadStart?.();
    // `onLoadStart` is an event prop: a new identity is not a new load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  const filter = blurRadius ? `blur(${blurRadius}px)` : undefined;
  const label = accessibilityLabel ?? alt;
  const fetchPriority = priority === "high" || priority === "low" ? priority : undefined;
  const resolvedLoading =
    loading ?? (responsivePolicy == null || responsivePolicy === "static" ? "lazy" : undefined);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    setLoadedUri(uri);
    onLoad?.({
      source: {
        url: target.currentSrc || target.src,
        width: target.naturalWidth,
        height: target.naturalHeight,
        mediaType: null,
      },
      cacheType: "none",
    });
    onLoadEnd?.();
    // There is no "displayed" event on the web; the repaint after the load is it.
    if (onDisplay && typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => onDisplay());
    }
  };

  const handleError = () => {
    onError?.({ error: `Failed to load image from url: ${uri}` });
    onLoadEnd?.();
  };

  return (
    <View ref={ref as never} {...(rest as object)} style={[{ overflow: "hidden" }, style as never]}>
      {placeholderUri && loadedUri !== uri ? (
        <img
          src={placeholderUri}
          alt=""
          aria-hidden
          draggable={draggable}
          style={{ ...FILL, objectFit: placeholderContentFit, filter }}
        />
      ) : null}
      {uri ? (
        <img
          // A new source is a new element: the old bitmap never shows under the new URL.
          key={uri}
          src={uri}
          {...(label !== undefined && { alt: label })}
          loading={resolvedLoading}
          // React 19 knows `fetchPriority`; older DOM typings don't.
          {...(fetchPriority && ({ fetchPriority } as object))}
          draggable={draggable}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            ...FILL,
            objectFit: contentFit,
            objectPosition: objectPositionOf(contentPosition),
            filter,
          }}
        />
      ) : null}
    </View>
  );
});

/** Warm the browser cache for one or more URLs; resolves `true` when all loaded. */
function prefetch(urls: string | string[]): Promise<boolean> {
  const list = Array.isArray(urls) ? urls : [urls];
  if (typeof window === "undefined" || typeof window.Image !== "function") {
    return Promise.resolve(false);
  }
  return Promise.all(
    list.map(
      (url) =>
        new Promise<boolean>((resolve) => {
          const image = new window.Image();
          image.onload = () => resolve(true);
          image.onerror = () => resolve(false);
          image.src = url;
        }),
    ),
  ).then((results) => results.every(Boolean));
}

(WebImage as unknown as Partial<ImageType>).prefetch = prefetch as ImageType["prefetch"];

/**
 * Cross-platform `Image` (web build). Same API and types as on native — see
 * `Image.native.tsx` for the full prop surface and examples.
 */
export const Image = createImage({
  // Typed as expo-image so both platforms export one prop surface.
  Component: WebImage as unknown as typeof ExpoImage,
  resizeModePropName: "contentFit",
  objectPositionPropName: "contentPosition",
  mapObjectFitToResizeMode: objectFitToContentFit,
});
