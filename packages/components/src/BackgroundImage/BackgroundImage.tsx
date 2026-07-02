import * as React from "react";

import { type GetProps, isWeb, styled } from "@knitui/core";

import { Box } from "../Box";
import { Image, type ImageProps } from "../Image";
import { radiusVariant, shadowVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";

/** RN's `resizeMode` values — how the image fills the frame. */
type BackgroundImageResizeMode = NonNullable<ImageProps["resizeMode"]>;
type WebRepeatStyle = {
  backgroundImage: string;
  backgroundPosition: "0";
  backgroundRepeat: "repeat";
  backgroundSize: "auto";
};

/**
 * Frame for `BackgroundImage`. The image is a real `Image` element layered
 * behind the content (rather than a web-only `background-image` CSS string), so
 * the component renders consistently on web and native through the local `Image`.
 * `overflow: hidden` clips the image to the frame's `radius`; defaults mirror
 * Mantine: full width, cover fit, no radius.
 */
const BackgroundImageFrame = styled(Box, {
  name: "BackgroundImage",
  position: "relative",
  // Establish a stacking context so the `zIndex: -1` backing image (below) is
  // contained within the frame and paints behind the in-flow `children` rather
  // than escaping to an ancestor context. On native `zIndex: 0` is a harmless
  // no-op; on web it is what makes the layered image sit behind the content.
  zIndex: 0,
  overflow: "hidden",
  width: "100%",
  borderWidth: 0,

  variants: {
    radius: radiusVariant,
    shadow: shadowVariant,
  } as const,
});

type BackgroundImageFrameProps = Omit<GetProps<typeof BackgroundImageFrame>, "src">;

/**
 * Named style slots for `BackgroundImage` (Pillar B / `internal/styles.ts`).
 * Exposes the previously-opaque backing image so it can be styled/configured.
 */
export interface BackgroundImageStyles {
  /** Props for the frame the image and content layer inside (the `Box` root). */
  root?: BackgroundImageFrameProps;
  /** Props for the layered backing `<Image>` behind the content. */
  image?: Partial<ImageProps>;
}

const BACKGROUND_IMAGE_SLOT_KEYS = [
  "root",
  "image",
] as const satisfies readonly (keyof BackgroundImageStyles)[];

export interface BackgroundImageProps extends BackgroundImageFrameProps {
  /** Image URL rendered behind the content. */
  src: string;
  /**
   * How the image fills the frame — a CSS `object-fit` value forwarded to the
   * inner `Image`'s `fit`. @default 'cover'
   */
  fit?: ImageProps["fit"];
  /**
   * How the image is aligned within the frame when it overflows — a CSS
   * `object-position` value (keyword, `"x y"`, or `{ top, left, … }`) forwarded
   * to the inner `Image`. Honored on web and native alike.
   */
  objectPosition?: ImageProps["objectPosition"];
  /**
   * RN `resizeMode`. Still honored — and the only way to get web `repeat`
   * tiling — but prefer `fit` for the cross-platform CSS `object-fit` values.
   * @deprecated Use `fit` instead (except for `repeat`).
   */
  resizeMode?: BackgroundImageResizeMode;
  /**
   * Props spread onto the layered backing `<Image>`, making the previously
   * opaque inner image reachable (e.g. `transition`, `placeholder`, `radius`).
   * Engine-owned props (`src`/`fit`/`objectPosition`/`resizeMode`/positioning)
   * still win. Alias for `styles.image`.
   */
  imageProps?: Partial<ImageProps>;
  /** Per-slot style sugar — props spread onto the matching part (`root`/`image`). */
  styles?: SlotStyles<BackgroundImageStyles>;
}

const getWebRepeatStyle = (src: string): WebRepeatStyle => ({
  backgroundImage: `url(${JSON.stringify(src)})`,
  backgroundPosition: "0",
  backgroundRepeat: "repeat",
  backgroundSize: "auto",
});

/**
 * `BackgroundImage` - renders content over a cover-positioned image. Mirrors
 * Mantine's `BackgroundImage` (`src` + `radius`) and additionally forwards the
 * unified `Image` props `fit` and `objectPosition` to the layered image. The
 * full `Box` style surface (width, height, padding, ...) is inherited for sizing
 * the area; the image fills it behind `children`.
 */
export const BackgroundImage = BackgroundImageFrame.styleable<BackgroundImageProps>(
  function BackgroundImage(props, ref) {
    const { src, fit, objectPosition, resizeMode, imageProps, styles, children, ...rest } = props;
    // `repeat` has no CSS `object-fit` / expo-image equivalent, so it stays a
    // resizeMode-only mode backed by a web `background-image` tile.
    const useWebRepeat = isWeb && resizeMode === "repeat";

    const s = slotStyles<BackgroundImageStyles>(
      styles,
      BACKGROUND_IMAGE_SLOT_KEYS,
      "BackgroundImage",
    );

    return (
      <BackgroundImageFrame ref={ref} {...s.merge("root", rest)}>
        {useWebRepeat ? (
          <Box
            aria-hidden
            position="absolute"
            inset={0}
            // Sit one layer behind the in-flow `children`. Without this, the
            // positioned background tile paints ABOVE the non-positioned content
            // on web (CSS paint order), hiding overlay text.
            zIndex={-1}
            width="100%"
            height="100%"
            pointerEvents="none"
            {...getWebRepeatStyle(src)}
          />
        ) : (
          <Image
            aria-hidden
            alt=""
            // Sugar (`styles.image`) and the `imageProps` alias spread UNDER the
            // engine-owned props below, so positioning/fit always win.
            {...s.get("image")}
            {...imageProps}
            src={src}
            fit={fit}
            objectPosition={objectPosition}
            resizeMode={resizeMode}
            position="absolute"
            inset={0}
            // Sit one layer behind the in-flow `children`. Without this, the
            // positioned image paints ABOVE the non-positioned content on web
            // (CSS paint order), hiding overlay text. Native is unaffected.
            zIndex={-1}
            width="100%"
            height="100%"
            pointerEvents="none"
          />
        )}
        {children}
      </BackgroundImageFrame>
    );
  },
);

export type { BackgroundImageResizeMode };
