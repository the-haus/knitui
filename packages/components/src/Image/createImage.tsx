import * as React from "react";
import type { ComponentProps, ComponentType } from "react";

import {
  type GetProps,
  isWeb,
  resolveToken,
  styleable,
  styled,
  View,
  withStaticProperties,
} from "@knitui/core";
import { useCallbackRef, useMergedRef } from "@knitui/hooks";

import { shadowVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { themeColorToCssVar } from "../internal/theme-color-web";
import {
  attachImageStatics,
  normalizeContentPosition,
  objectFitToResizeMode,
  resizeModeToObjectFit,
  resolveSource,
  useImageFallback,
} from "./shared";
import type { ImageProps, ImageType } from "./types";

type ImageDimension = ImageProps["width"] | ImageProps["height"];
type TransformSourceInput = {
  src?: ImageProps["src"];
  source?: ImageProps["source"];
  width?: ImageDimension;
  height?: ImageDimension;
};
type ImageLoadLikeEvent = {
  nativeEvent?: {
    source?: {
      width?: number;
      height?: number;
    };
  };
  source?: {
    width?: number;
    height?: number;
  };
};
type ComponentWithImageStatics = Partial<ImageType>;
type ImageLoadEvent = Parameters<NonNullable<ImageProps["onLoad"]>>[0];
type ImageErrorEvent = Parameters<NonNullable<ImageProps["onError"]>>[0];

/**
 * Internal alias the unified `transition` prop is forwarded under. expo-image's
 * `transition` (a numeric fade duration / config) collides with Tamagui's
 * reserved `transition` animation prop: Tamagui treats ANY component where
 * `"transition" in props` as animated (v3 still does) and
 * engages its animation driver. On web that driver calls `getComputedStyle(host)`,
 * but the backing expo-image host ref is not a DOM `Element`, so it throws
 * ("parameter 1 is not of type 'Element'") and blanks the tree. We therefore
 * forward the value to the backend under this Tamagui-invisible alias and remap
 * it back to `transition` in the adapter that wraps the backend component.
 */
const TRANSITION_INLINE_ALIAS = "expoImageTransition";

/**
 * Props handed straight to the underlying image component without Tamagui
 * processing. Covers the full expo-image surface so every feature prop
 * (transition, placeholder, tintColor, cache policy, …) reaches the backend.
 * NOTE: `transition` is deliberately absent — it is forwarded under
 * `TRANSITION_INLINE_ALIAS` instead (see above) so Tamagui never sees a raw
 * `transition` prop that would (crash-inducingly) mark the image as animated.
 */
const DEFAULT_INLINE_PROPS = new Set([
  "source",
  "placeholder",
  "placeholderContentFit",
  "contentFit",
  "contentPosition",
  TRANSITION_INLINE_ALIAS,
  "blurRadius",
  "tintColor",
  "priority",
  "cachePolicy",
  "responsivePolicy",
  "recyclingKey",
  "autoplay",
  "allowDownscaling",
  "decodeFormat",
  "enableLiveTextInteraction",
  "useAppleWebpCodec",
  "enforceEarlyResizing",
  "focusable",
  "accessible",
  "accessibilityLabel",
  "alt",
  "onLoadStart",
  "onProgress",
  "onLoadEnd",
  "onDisplay",
  // Identity/test hooks: forwarded untouched so the backend (e.g. expo-image's
  // outer view → `data-testid` on web) keeps them queryable rather than letting
  // Tamagui consume them onto a host element it does not render here.
  "testID",
  "nativeID",
  "dataSet",
]);

export type CreateImageOptions<C extends ComponentType<Record<string, unknown>>> = {
  /**
   * The underlying image component to use.
   * Can be expo-image, React Native's `Image`, react-native-fast-image, or
   * another compatible component.
   */
  Component: C;
  /**
   * Map a CSS `object-fit` value to the component's fit prop.
   * Default maps to React Native's `resizeMode`; expo-image uses an identity map.
   */
  mapObjectFitToResizeMode?: (objectFit: string) => string;
  /**
   * The prop name used for the resize/fit behavior.
   * Default: 'resizeMode' (React Native). expo-image uses: 'contentFit'.
   */
  resizeModePropName?: string;
  /**
   * The prop name used for object position.
   * Default: undefined (React Native's `Image` does not support it).
   * expo-image uses: 'contentPosition'.
   */
  objectPositionPropName?: string;
  /**
   * Custom source transformation. Useful for backends with a bespoke source
   * format.
   */
  transformSource?: (props: TransformSourceInput) => unknown;
  /**
   * Extra prop names to forward untouched to the underlying component, merged
   * with the default expo-image surface.
   */
  inlineProps?: Iterable<string>;
};

/** A finite numeric dimension usable as an intrinsic `source.width`/`height`. */
const numericDimension = (value: ImageDimension): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const defaultTransformSource = (props: TransformSourceInput) => {
  const { src, source, width, height } = props;
  if (source) return source;
  if (src && typeof src !== "string") return src;
  // `source.width`/`height` are INTRINSIC pixel dimensions and must be numeric:
  // the native expo-image module decodes them as `Double` and drops the whole
  // source when they aren't. Layout dimensions like `"100%"` (e.g. a fill image
  // such as `BackgroundImage`'s) would otherwise reach native as un-decodable
  // strings and silently render nothing, so only forward finite numbers here.
  return {
    uri: src,
    ...(numericDimension(width) !== undefined && { width: numericDimension(width) }),
    ...(numericDimension(height) !== undefined && { height: numericDimension(height) }),
  };
};

/**
 * Resolve a `radius` prop to a border-radius value usable in RN/web styles.
 * Exported for unit testing the native percentage path (see Image.test).
 */
export const resolveRadiusValue = (
  value: unknown,
  dimensions?: { width?: ImageDimension; height?: ImageDimension },
): unknown => {
  if (typeof value === "number" || value == null) return value;

  if (typeof value !== "string") return value;

  // Percentages (e.g. "50%" for circular avatars). expo-image's web build
  // renders an `<img>`, so a CSS percentage there is honored verbatim. Native
  // expo-image decodes `borderRadius` as a `Double` and throws on a string
  // ("cannot be cast from String to double"), so resolve the percentage to
  // pixels against the known numeric dimensions — using the smaller edge so a
  // non-square box reads as a pill. When the box is itself percentage-sized
  // (e.g. a fill image like Avatar's, where width/height are "100%") no pixel
  // basis exists, so fall back to a fully-rounded sentinel.
  if (value.endsWith("%")) {
    if (isWeb) return value;
    const fraction = Number.parseFloat(value) / 100;
    if (!Number.isFinite(fraction)) return undefined;
    const w = numericDimension(dimensions?.width);
    const h = numericDimension(dimensions?.height);
    const basis = w !== undefined && h !== undefined ? Math.min(w, h) : (w ?? h);
    return basis !== undefined ? basis * fraction : 9999;
  }

  // A radius token (`"md"`, `"radius.md"`) resolves through the active config.
  const token = resolveToken(value, "radius");
  if (token !== undefined) return token;

  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

/**
 * Colour style props (longhand or the kit's shorthand) that v3 drops when it
 * styles a NON-Tamagui host such as the image backend: theme names
 * (`bg="color3"`) never reach the DOM. On web they are lifted into the inline
 * style as the theme's CSS variable (theme-free, follows theme changes).
 */
const COLOR_STYLE_KEYS: Readonly<Record<string, string>> = {
  bg: "backgroundColor",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor",
  borderTopColor: "borderTopColor",
  borderRightColor: "borderRightColor",
  borderBottomColor: "borderBottomColor",
  borderLeftColor: "borderLeftColor",
};

/** Web: pull theme-name colour props out of `rest` into an inline style block. */
function liftWebColors(rest: Record<string, unknown>): Record<string, string> | undefined {
  if (!isWeb) return undefined;
  let lifted: Record<string, string> | undefined;
  for (const key in COLOR_STYLE_KEYS) {
    const value = rest[key];
    if (typeof value !== "string") continue;
    (lifted ??= {})[COLOR_STYLE_KEYS[key]!] = themeColorToCssVar(value);
    delete rest[key];
  }
  return lifted;
}

/** Frames `useWebCachedImageLoad` waits for the backend to put its `<img>` in the DOM. */
const CACHED_LOAD_MAX_FRAMES = 10;

/**
 * Find the rendered `<img>` behind a backend instance on web: the instance itself
 * (a plain `<img>` backend), or the backend's container element — the kit's web
 * `Image` wrapper, or expo-image's `containerViewRef` — whose LAST `<img>` is the
 * current source (a placeholder node, when any, comes first).
 */
const findWebImg = (instance: unknown): HTMLImageElement | null => {
  if (typeof HTMLElement === "undefined" || instance == null) return null;
  if (instance instanceof HTMLImageElement) return instance;
  const container =
    instance instanceof HTMLElement
      ? instance
      : (instance as { containerViewRef?: { current?: unknown } }).containerViewRef?.current;
  if (container instanceof HTMLElement) {
    const imgs = container.querySelectorAll("img");
    return imgs.length ? imgs[imgs.length - 1]! : null;
  }
  return null;
};

const sourceKey = (source: unknown): unknown =>
  source && typeof source === "object" && "uri" in source
    ? (source as { uri?: unknown }).uri
    : source;

/**
 * Web only: report an image the browser already had as loaded.
 *
 * A cached image fires `load` as soon as React creates its `<img>`, which in a
 * concurrent render can land before the commit; React then drops the event.
 * expo-image's web fade holds the `<img>` at `opacity: 0` until that `onLoad`, so
 * the image stayed loaded and invisible for good. After mount (and on each new
 * source) this checks the committed `<img>`: when it is `complete` with a
 * `naturalWidth` and no `load` reached us, it re-dispatches `load` on the element
 * so the backend (and the consumer's `onLoad`) hear it once.
 */
function useWebCachedImageLoad(
  forwardedRef: React.ForwardedRef<unknown>,
  onLoad: ((...args: unknown[]) => void) | undefined,
  source: unknown,
) {
  const instanceRef = React.useRef<unknown>(null);
  const ref = useMergedRef(forwardedRef, instanceRef);
  const loadedRef = React.useRef(false);
  const latestOnLoad = useCallbackRef(onLoad);
  const key = sourceKey(source);

  const handleLoad = React.useCallback(
    (...args: unknown[]) => {
      loadedRef.current = true;
      latestOnLoad(...args);
    },
    [latestOnLoad],
  );

  React.useEffect(() => {
    if (!isWeb || typeof requestAnimationFrame === "undefined") return;
    loadedRef.current = false;
    let frame = 0;
    let handle = 0;
    const check = () => {
      if (loadedRef.current) return;
      const img = findWebImg(instanceRef.current);
      if (img) {
        if (img.complete && img.naturalWidth > 0) img.dispatchEvent(new Event("load"));
        return;
      }
      if (frame++ < CACHED_LOAD_MAX_FRAMES) handle = requestAnimationFrame(check);
    };
    // The backend may add its `<img>` from its own effect, so look one frame on.
    handle = requestAnimationFrame(check);
    return () => cancelAnimationFrame(handle);
  }, [key]);

  return { ref, onLoad: isWeb && onLoad ? handleLoad : onLoad };
}

/**
 * Resolve a size-token dimension (`"md"`) to its raw value, passing numbers and
 * CSS lengths (`"100%"`, `"auto"`) through. The raw value both sizes the frame
 * and, when numeric, becomes the backend source's intrinsic width/height.
 */
const resolveDimension = (value: ImageDimension): ImageDimension =>
  typeof value === "string"
    ? ((resolveToken(value, "size") as ImageDimension | undefined) ?? value)
    : value;

/**
 * Named style slots for the composable `Image` family (Pillar B /
 * `internal/styles.ts`). Each key maps to the props of the part it targets, so
 * `styles={{ image: { radius: "md" } }}` is sugar for `<Image.Image radius="md" />`.
 */
export interface ImageStyles {
  /** Props for the relative-positioned `Image.Root` frame (parts layer over it). */
  root?: GetProps<typeof View>;
  /** Props for the backing image element (`Image.Image`). */
  image?: Partial<ImageProps>;
  /** Props for the error-state slot (`Image.Fallback`). */
  fallback?: GetProps<typeof View>;
  /** Props for the loading-state slot (`Image.Placeholder`). */
  placeholder?: GetProps<typeof View>;
  /** Props for the always-on content slot layered over the image (`Image.Overlay`). */
  overlay?: GetProps<typeof View>;
}

const IMAGE_SLOT_KEYS = [
  "root",
  "image",
  "fallback",
  "placeholder",
  "overlay",
] as const satisfies readonly (keyof ImageStyles)[];

/**
 * Load state shared by `Image.Root` and the parts layered over it. `errored`
 * drives `Image.Fallback`; `loaded` drives `Image.Placeholder` (which shows
 * until the image first displays). The handlers let the backing image report
 * load/error transitions up to the Root that owns the state.
 */
type ImageContextValue = {
  errored: boolean;
  loaded: boolean;
  markErrored: () => void;
  markLoaded: () => void;
};

/**
 * Create a cross-platform `Image` with a pluggable underlying implementation.
 *
 * Returns the unified-API sugar component widened with composable parts
 * (`Image.Root` / `Image.Image` / `Image.Fallback` / `Image.Placeholder` /
 * `Image.Overlay`) via `withStaticProperties`, plus expo-image's static methods.
 *
 * @example
 * Using with expo-image (the default backend for `@knitui/components`'s `Image`)
 * import { Image as ExpoImage } from 'expo-image'
 * import { createImage } from './createImage'
 * import { objectFitToContentFit } from './shared'
 *
 * export const Image = createImage({
 *   Component: ExpoImage,
 *   resizeModePropName: 'contentFit',
 *   objectPositionPropName: 'contentPosition',
 *   mapObjectFitToResizeMode: objectFitToContentFit,
 * })
 *
 * You then get every expo-image prop (transition, placeholder, cachePolicy, …)
 * plus the unified API (`src`, `fit`/`objectFit`, `objectPosition`, `radius`,
 * `fallbackSrc`) and Tamagui styling (`w`, `h`, `bg`, token names like `"md"`).
 * <Image src="https://example.com/photo.jpg" fit="cover" transition={300} radius="md" />
 *
 * @example
 * Composed parts (independently stylable, layered over the engine):
 * <Image.Root src={src} fallbackSrc={fb}>
 *   <Image.Image fit="cover" />
 *   <Image.Placeholder>Loading…</Image.Placeholder>
 *   <Image.Fallback>Broken</Image.Fallback>
 *   <Image.Overlay><Badge /></Image.Overlay>
 * </Image.Root>
 */
export function createImage<C extends ComponentType<Record<string, unknown>>>(
  options: CreateImageOptions<C>,
) {
  const {
    Component,
    mapObjectFitToResizeMode = objectFitToResizeMode,
    resizeModePropName = "resizeMode",
    objectPositionPropName,
    transformSource = defaultTransformSource,
    inlineProps,
  } = options;

  const inlinePropsSet = new Set(DEFAULT_INLINE_PROPS);
  if (inlineProps) for (const name of inlineProps) inlinePropsSet.add(name);

  // Adapter wrapping the backend component: remaps `TRANSITION_INLINE_ALIAS`
  // (the Tamagui-invisible key the styled layer forwards) back to the backend's
  // real `transition` prop. This sits BELOW the Tamagui `styled()` layer, so
  // Tamagui never sees a raw `transition` prop (which would mark the image
  // animated and crash the web CSS animation driver on the non-Element host).
  const BaseComponent: ComponentType<Record<string, unknown>> = React.forwardRef<
    unknown,
    Record<string, unknown>
  >(function ImageBackendAdapter(backendProps, backendRef) {
    const { [TRANSITION_INLINE_ALIAS]: transitionValue, ...backendRest } = backendProps;
    const { ref, onLoad } = useWebCachedImageLoad(
      backendRef,
      backendRest.onLoad as ((...args: unknown[]) => void) | undefined,
      backendRest.source,
    );
    return React.createElement(Component, {
      ...backendRest,
      ...(transitionValue !== undefined && { transition: transitionValue }),
      ...(onLoad && { onLoad }),
      ref,
    });
  }) as unknown as ComponentType<Record<string, unknown>>;

  const StyledImage = styled(
    BaseComponent,
    {
      displayName: "Image",
      variants: {
        // The shared elevation ladder (`shadow="md"`), as on `Box`.
        shadow: shadowVariant,
      } as const,
    },
    {
      inlineProps: inlinePropsSet,
    },
  );

  // Combined props: ImageProps (unified) + the backend's own props.
  type CombinedProps = ImageProps & Omit<ComponentProps<C>, keyof ImageProps>;

  // Context owned by `Image.Root`. `undefined` means "no Root above me", which
  // lets the backing image self-manage its fallback state for standalone use.
  const ImageContext = React.createContext<ImageContextValue | undefined>(undefined);

  /**
   * The unified-API props: the engine's own surface plus an optional per-slot
   * `styles` map and the legacy `fallbackProps` (both target the backing image).
   */
  type SugarProps = CombinedProps & {
    /** Per-slot style sugar — props spread onto the matching part. */
    styles?: SlotStyles<ImageStyles>;
    /** Props spread onto the backing image (alias for `styles.image`). */
    fallbackProps?: Partial<ImageProps>;
  };

  /**
   * The backing image — the engine, and also the public `Image` itself (the
   * sugar used to be a separate wrapper; folding it in saves one component
   * layer per image, which adds up in long lists). Resolves the unified API
   * (`src`/`fit`/`radius`/`fallbackSrc`/`objectPosition`) and the
   * cross-platform load/error events, then renders through the Tamagui-styled
   * wrapper. When rendered under an `Image.Root` it reads/updates the shared
   * fallback state via context; standalone it owns its own state via
   * `useImageFallback`.
   */
  const ImagePart = styleable<SugarProps>(StyledImage, function Image(incomingProps, ref) {
    const { styles, fallbackProps, ...direct } = incomingProps as SugarProps;
    // Engine props win over the per-slot sugar (explicit beats sugar); the image
    // slot and the legacy `fallbackProps` are the same target. Only allocate a
    // merged object when either sugar is present.
    const props = (
      styles || fallbackProps
        ? {
            ...slotStyles<ImageStyles>(styles, IMAGE_SLOT_KEYS, "Image").get("image"),
            ...fallbackProps,
            ...direct,
          }
        : direct
    ) as CombinedProps;
    const {
      src,
      source,
      width,
      height,
      radius,
      borderRadius,
      fit,
      objectFit,
      objectPosition,
      resizeMode,
      fallbackSrc,
      alt,
      accessibilityLabel,
      onLoad,
      onError,
      // Pulled out so it never reaches the Tamagui `styled()` layer as a raw
      // `transition` prop (which marks the image animated → crashes the web CSS
      // animation driver on the non-Element host). Re-forwarded under
      // `TRANSITION_INLINE_ALIAS` below and unwrapped in the backend adapter.
      transition,
      ...rest
    } = props;

    const resolvedSrc = resolveSource(src) ?? resolveSource(source);

    // Prefer the Root's shared state when composed; otherwise self-manage so a
    // bare `<Image.Image src=.../>` still swaps to its own `fallbackSrc`.
    const ctx = React.useContext(ImageContext);
    const own = useImageFallback(resolvedSrc);
    const errored = ctx ? ctx.errored : own.errored;
    const markErrored = ctx ? ctx.markErrored : own.markErrored;
    const markLoaded = ctx?.markLoaded;

    const resolvedWidth = resolveDimension(width);
    const resolvedHeight = resolveDimension(height);

    const finalSource = transformSource({
      src: errored && fallbackSrc ? fallbackSrc : src,
      source: errored && fallbackSrc ? undefined : source,
      width: resolvedWidth,
      height: resolvedHeight,
    });

    const incomingStyle = Array.isArray(rest.style)
      ? Object.assign({}, ...rest.style.flat())
      : rest.style;
    // `rest` is this render's own object (a destructuring rest), safe to edit.
    const liftedColors = liftWebColors(rest as Record<string, unknown>);

    const resolvedBorderRadius = resolveRadiusValue(radius ?? borderRadius, {
      width: resolvedWidth,
      height: resolvedHeight,
    });

    const handleLoad = React.useMemo(() => {
      return (e: ImageLoadLikeEvent) => {
        markLoaded?.();
        if (!onLoad) return;
        const loadSource = e?.nativeEvent?.source || e?.source || {};
        const loadEvent: ImageLoadEvent = {
          nativeEvent: {
            source: { height: loadSource?.height, width: loadSource?.width },
          },
          type: "load",
        };
        onLoad(loadEvent);
      };
    }, [onLoad, markLoaded]);

    const handleError = React.useCallback(() => {
      markErrored();
      const errorEvent: ImageErrorEvent = {
        nativeEvent: { error: "Image failed to load" },
        type: "error",
      };
      onError?.(errorEvent);
    }, [markErrored, onError]);

    const finalProps: Record<string, unknown> = {
      ...rest,
      source: finalSource,
      style: {
        ...liftedColors,
        ...incomingStyle,
        ...(resolvedBorderRadius !== undefined && { borderRadius: resolvedBorderRadius }),
        ...(resolvedWidth !== undefined && { width: resolvedWidth }),
        ...(resolvedHeight !== undefined && { height: resolvedHeight }),
      },
      onError: handleError,
      onLoad: handleLoad,
    };

    // Forward the backend fade config under the Tamagui-invisible alias (the
    // backend adapter remaps it to `transition`). Keyed so a value of `0` (no
    // fade) still forwards; only an absent prop is skipped.
    if (transition !== undefined) {
      finalProps[TRANSITION_INLINE_ALIAS] = transition;
    }

    // The unified API uses web-style `alt`; expo-image's web build reads only
    // `accessibilityLabel` for the `<img alt>`, so normalize `alt` onto it
    // (native expo-image already treats `alt` as an alias).
    const resolvedAccessibilityLabel = accessibilityLabel ?? alt;
    if (resolvedAccessibilityLabel !== undefined) {
      finalProps.accessibilityLabel = resolvedAccessibilityLabel;
      finalProps.alt = resolvedAccessibilityLabel;
    }

    // `testID` reaches expo-image on native but Tamagui swallows it before the
    // web `<img>`. Mirror it onto `dataSet.testid` so react-native-web emits a
    // queryable `data-testid` on the web wrapper, keeping `testID` working on
    // every platform.
    const restRecord = rest as { testID?: string; dataSet?: Record<string, unknown> };
    if (isWeb && restRecord.testID != null) {
      finalProps.dataSet = { ...restRecord.dataSet, testid: restRecord.testID };
    }

    // Resolve the fit, honoring the deprecated `resizeMode`, defaulting to
    // "cover" like the web `<img>` it replaces.
    const resolvedFit = fit ?? objectFit ?? resizeModeToObjectFit(resizeMode) ?? "cover";
    finalProps[resizeModePropName] = mapObjectFitToResizeMode(resolvedFit);

    // Forward object position to the backend prop that supports it (expo-image),
    // normalizing CSS-style keyword/percentage strings into the edge-keyed object
    // form — the only shape expo-image's web `<img>` renderer honors.
    if (objectPositionPropName && objectPosition) {
      finalProps[objectPositionPropName] = normalizeContentPosition(objectPosition);
    }

    // Render through the Tamagui-styled wrapper so style props and shorthands
    // (w, h, bg, margins, …) are resolved and applied to the underlying
    // component. Rendering the raw Component here would drop every Tamagui
    // style prop, leaving the image with no dimensions.
    return React.createElement(
      StyledImage as ComponentType<Record<string, unknown> & React.RefAttributes<unknown>>,
      {
        ...finalProps,
        ref,
      },
    );
  });

  // Tamagui's `.styleable` JSX prop type is a union too large for a plain object
  // to satisfy structurally (and intersecting it with `children` overflows the
  // checker). For the kit's own internal spreads we render through a loosened
  // alias typed on the unified `CombinedProps` — mirroring the `StyledImage`
  // cast above. The public `Image.Image` static keeps `ImagePart`'s full type.
  const ImagePartLoose = ImagePart as unknown as ComponentType<
    CombinedProps & React.RefAttributes<unknown>
  >;

  /**
   * `Image.Root` — owns the fallback/load state for everything inside it and
   * exposes it through context. It is a relative-positioned frame so the
   * `Fallback`/`Placeholder`/`Overlay` parts can layer absolutely over the
   * backing image. When no `<Image.Image>` child is provided, Root renders one
   * itself from the unified props it receives, so the composed and sugar forms
   * share a single engine.
   */
  type RootProps = CombinedProps & {
    children?: React.ReactNode;
  };

  const RootFrame = styled(View, {
    displayName: "ImageRoot",
    position: "relative",
  });

  const Root = styleable<RootProps>(RootFrame, (props, ref) => {
    // Split children out at runtime without forming `CombinedProps & {children}`
    // — that intersection overflows the checker (TS2590). The remaining props are
    // the unified image API, re-typed for the `.src`/`.source` reads below.
    const { children, ...rest } = props as { children?: React.ReactNode } & Record<string, unknown>;
    const imageProps = rest as unknown as CombinedProps;

    const resolvedSrc = resolveSource(imageProps.src) ?? resolveSource(imageProps.source);
    const { errored, markErrored } = useImageFallback(resolvedSrc);
    const [loaded, setLoaded] = React.useState(false);
    const markLoaded = React.useCallback(() => setLoaded(true), []);

    // Reset the loaded flag when the resolved source changes so the placeholder
    // shows again for the new image.
    React.useEffect(() => setLoaded(false), [resolvedSrc]);

    const value = React.useMemo<ImageContextValue>(
      () => ({ errored, loaded, markErrored, markLoaded }),
      [errored, loaded, markErrored, markLoaded],
    );

    // Split: own-frame style props (width/height/position/...) stay on the
    // frame; the unified image API flows to the backing `Image.Image`. Detect
    // composed children — if the caller supplied their own `Image.Image`, don't
    // inject a second one.
    const hasImageChild = React.Children.toArray(children).some(
      (child) => React.isValidElement(child) && child.type === ImagePart,
    );

    return (
      <ImageContext.Provider value={value}>
        <RootFrame ref={ref} {...(imageProps as GetProps<typeof RootFrame>)}>
          {hasImageChild ? null : <ImagePartLoose {...imageProps} />}
          {children}
        </RootFrame>
      </ImageContext.Provider>
    );
  });

  /**
   * `Image.Fallback` — content shown only once the backing image has errored
   * (and no usable `fallbackSrc` rendered). Layers absolutely over the image.
   */
  const FallbackFrame = styled(View, {
    displayName: "ImageFallback",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  });

  const Fallback = styleable<GetProps<typeof FallbackFrame>>(FallbackFrame, (props, ref) => {
    const ctx = React.useContext(ImageContext);
    if (ctx && !ctx.errored) return null;
    return <FallbackFrame ref={ref} {...props} />;
  });

  /**
   * `Image.Placeholder` — content shown while the backing image has not yet
   * displayed and has not errored. Layers absolutely over the image.
   */
  const PlaceholderFrame = styled(View, {
    displayName: "ImagePlaceholder",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  });

  const Placeholder = styleable<GetProps<typeof PlaceholderFrame>>(
    PlaceholderFrame,
    (props, ref) => {
      const ctx = React.useContext(ImageContext);
      if (ctx && (ctx.loaded || ctx.errored)) return null;
      return <PlaceholderFrame ref={ref} {...props} />;
    },
  );

  /**
   * `Image.Overlay` — always-on content layered over the image (badges, scrims,
   * captions). Unlike `Fallback`/`Placeholder` it does not depend on load state.
   */
  const Overlay = styled(View, {
    displayName: "ImageOverlay",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });

  const ImageWithParts = withStaticProperties(ImagePart, {
    Root,
    Image: ImagePart,
    Fallback,
    Placeholder,
    Overlay,
  });

  // Prefer the underlying component's statics (expo-image exposes
  // prefetch/clearMemoryCache/…); fall back to safe no-ops otherwise. The
  // factory returns the component widened with the `ImageType` statics.
  return attachImageStatics(ImageWithParts, Component as ComponentWithImageStatics);
}
