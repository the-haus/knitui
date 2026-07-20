import * as React from "react";
import type { ComponentProps, ComponentType } from "react";

import {
  type GetProps,
  getTokenValue,
  isWeb,
  styled,
  View,
  withStaticProperties,
} from "@knitui/core";

import { slotStyles, type SlotStyles } from "../internal/styles";
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
type TokenValueInput = Parameters<typeof getTokenValue>[0];
type ImageLoadEvent = Parameters<NonNullable<ImageProps["onLoad"]>>[0];
type ImageErrorEvent = Parameters<NonNullable<ImageProps["onError"]>>[0];

// Radius/size token keys, matching the canonical set in internal/style-props.
// Missing keys silently drop to no-radius, so this must stay in sync.
const SIZE_KEYS = new Set(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"]);

/**
 * Internal alias the unified `transition` prop is forwarded under. expo-image's
 * `transition` (a numeric fade duration / config) collides with Tamagui v2's
 * reserved `transition` animation prop: Tamagui treats ANY component where
 * `"transition" in props` as animated (see @tamagui/web useComponentState) and
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

  if (typeof value === "object" && "isVar" in value && "val" in value) {
    return resolveRadiusValue(value.val, dimensions);
  }

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

  const token = value[0] === "$" ? value : SIZE_KEYS.has(value) ? `$${value}` : undefined;
  if (token) return getTokenValue(token as TokenValueInput, "radius");

  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

/** Resolve a `$size`-token dimension to its numeric value, passing others through. */
const resolveDimension = (value: ImageDimension): ImageDimension =>
  typeof value === "string" && value[0] === "$"
    ? (getTokenValue(value as TokenValueInput, "size") as ImageDimension)
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
 * `fallbackSrc`) and Tamagui styling (`w`, `h`, `bg`, `$token`s).
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
    return React.createElement(Component, {
      ...backendRest,
      ...(transitionValue !== undefined && { transition: transitionValue }),
      ref: backendRef,
    });
  }) as unknown as ComponentType<Record<string, unknown>>;

  const StyledImage = styled(
    BaseComponent,
    {
      name: "Image",
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
   * The backing image — the engine. Resolves the unified API (`src`/`fit`/
   * `radius`/`fallbackSrc`/`objectPosition`) and the cross-platform load/error
   * events, then renders through the Tamagui-styled wrapper. When rendered under
   * an `Image.Root` it reads/updates the shared fallback state via context;
   * standalone it owns its own state via `useImageFallback`.
   */
  const ImagePart = StyledImage.styleable<CombinedProps>((incomingProps, ref) => {
    const props = incomingProps as CombinedProps;
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
    name: "ImageRoot",
    position: "relative",
  });

  const Root = RootFrame.styleable<RootProps>((props, ref) => {
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
    name: "ImageFallback",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  });

  const Fallback = FallbackFrame.styleable<GetProps<typeof FallbackFrame>>((props, ref) => {
    const ctx = React.useContext(ImageContext);
    if (ctx && !ctx.errored) return null;
    return <FallbackFrame ref={ref} {...props} />;
  });

  /**
   * `Image.Placeholder` — content shown while the backing image has not yet
   * displayed and has not errored. Layers absolutely over the image.
   */
  const PlaceholderFrame = styled(View, {
    name: "ImagePlaceholder",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  });

  const Placeholder = PlaceholderFrame.styleable<GetProps<typeof PlaceholderFrame>>(
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
    name: "ImageOverlay",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });

  /**
   * The unified-API sugar. Thin wrapper over the engine: it accepts the classic
   * `<Image src=… fallbackSrc=… />` surface (rendering the backing image
   * directly so the host `<img>` stays the queryable/ref'd element), plus an
   * optional per-slot `styles` map and `fallbackProps`. For multi-layer
   * composition use the `Image.Root` + parts form.
   */
  type SugarProps = CombinedProps & {
    /** Per-slot style sugar — props spread onto the matching part. */
    styles?: SlotStyles<ImageStyles>;
    /** Props spread onto the backing image (alias for `styles.image`). */
    fallbackProps?: Partial<ImageProps>;
  };

  const ImageComponent = StyledImage.styleable<SugarProps>((incomingProps, ref) => {
    const { styles, fallbackProps, ...rest } = incomingProps as SugarProps;
    const s = slotStyles<ImageStyles>(styles, IMAGE_SLOT_KEYS, "Image");
    // Engine props win over the per-slot sugar (explicit beats sugar); the
    // image slot and the legacy `fallbackProps` are the same target.
    return (
      <ImagePartLoose
        ref={ref}
        {...s.get("image")}
        {...fallbackProps}
        {...(rest as CombinedProps)}
      />
    );
  });

  const ImageWithParts = withStaticProperties(ImageComponent, {
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
