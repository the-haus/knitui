import type {
  Image as ExpoImage,
  ImageProps as ExpoImageProps,
  ImageContentPosition,
  ImageErrorEventData,
  ImageSource,
} from "expo-image";

import type { TamaguiElement, ViewProps } from "@knitui/core";

/** CSS `object-fit` values — identical to expo-image's `contentFit` enum. */
export type ImageObjectFit = "contain" | "cover" | "fill" | "none" | "scale-down";
/** CSS `object-position` value — accepts expo-image's richer `ImageContentPosition`. */
export type ImageObjectPosition = ImageContentPosition | string;
/** React Native's legacy `resizeMode` values (deprecated; prefer `fit`). */
export type ImageHostResizeMode = "cover" | "contain" | "stretch" | "repeat" | "center";
/** A source object accepted by the host image (expo-image `ImageSource` or RN shape). */
export type ImageHostSource = ImageSource | { uri?: string; width?: number; height?: number };
/** Anything usable as an image source: URL string, `require()` number, or source object. */
export type ImageSrc = string | number | ImageHostSource;

/**
 * Cross-platform load event. Normalised to the React Native `onLoad` shape so
 * call sites stay platform-agnostic; the raw expo-image payload is forwarded
 * untouched on `nativeEvent.source`.
 */
export type ImageLoadEvent = {
  nativeEvent?: {
    source?: {
      width?: number;
      height?: number;
    };
  };
  type?: "load";
};

/** Cross-platform error event, normalised to the React Native `onError` shape. */
export type ImageErrorEvent = {
  nativeEvent?: {
    error?: string;
  };
  type?: "error";
};

/**
 * expo-image props forwarded verbatim to the underlying component. Picked from
 * expo-image's own `ImageProps` so the surface stays in sync with the installed
 * version — adding a key here that expo-image drops is a compile error.
 */
type ForwardedExpoProps = Pick<
  ExpoImageProps,
  | "placeholder"
  | "placeholderContentFit"
  | "contentFit"
  | "contentPosition"
  | "transition"
  | "blurRadius"
  | "tintColor"
  | "priority"
  | "cachePolicy"
  | "responsivePolicy"
  | "recyclingKey"
  | "autoplay"
  | "allowDownscaling"
  | "decodeFormat"
  | "enableLiveTextInteraction"
  | "useAppleWebpCodec"
  | "enforceEarlyResizing"
  | "focusable"
  | "accessible"
  | "accessibilityLabel"
  | "alt"
  | "onLoadStart"
  | "onProgress"
  | "onLoadEnd"
  | "onDisplay"
>;

/**
 * Props for the cross-platform `Image`. Combines:
 * - Tamagui `ViewProps` for styling (width, height, bg, margins, `$token`s…),
 * - the forwarded expo-image surface (`ForwardedExpoProps`),
 * - Mantine-compatible aliases (`fit`, `radius`, `fallbackSrc`, `src`),
 * - cross-platform-normalised `onLoad`/`onError` handlers.
 */
export type ImageProps = Omit<ViewProps, "transition"> &
  ForwardedExpoProps & {
    /**
     * Key of radius scale or a valid CSS/numeric value to set border-radius.
     * Mirrors Mantine's `radius` prop.
     */
    radius?: string | number;
    /**
     * How the image should be resized to fit its container. Mantine-compatible
     * alias for `contentFit`/`objectFit`.
     * @default "cover"
     */
    fit?: ImageObjectFit;
    /** Image url used as a fallback if the primary source cannot be loaded. */
    fallbackSrc?: string;
    /**
     * The image source: URL string, `require()` result, or source object.
     * Preferred over `source`.
     */
    src?: ImageSrc;
    /**
     * @deprecated use `src` instead
     */
    source?: ImageSrc;
    /**
     * @deprecated use `fit` instead
     */
    resizeMode?: ImageHostResizeMode;
    /** Alias for `fit`/`contentFit`. */
    objectFit?: ImageObjectFit;
    /** Alias for `contentPosition`. */
    objectPosition?: ImageObjectPosition;
    onLoad?: (event: ImageLoadEvent) => void;
    onError?: (event: ImageErrorEvent) => void;
  };

export type { ImageErrorEventData };

/**
 * The static methods exposed by expo-image's `Image` (prefetch, cache control,
 * blurhash generation, …). Derived from the class so it tracks the installed
 * expo-image version.
 */
export type ImageStatics = Pick<
  typeof ExpoImage,
  | "prefetch"
  | "clearMemoryCache"
  | "clearDiskCache"
  | "getCachePathAsync"
  | "generateBlurhashAsync"
  | "loadAsync"
>;

export type ImageType = React.ForwardRefExoticComponent<
  Partial<ImageProps> & React.RefAttributes<TamaguiElement>
> &
  ImageStatics;
