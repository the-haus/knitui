import { type GetProps, isWeb, styled, Text as TamaguiText } from "@knitui/core";

import { fontSizeVariant } from "../internal/style-props";

/**
 * The CSS `inherit` keyword is web-only and isn't part of Tamagui's token
 * types, so we narrow it to each font style prop's exact type rather than
 * widening to `any`.
 */
type TextStyleProps = GetProps<typeof TamaguiText>;

/**
 * `Text` — the text primitive (text needs a text host element, so it's the one
 * non-Box base). Same Tamagui token/theme/cross-platform superpowers as `Box`.
 *
 * Mirrors Mantine's `Text` public API: `size` (token pairs font-size with
 * line-height), `lineClamp` (multi-line clamp), `truncate` (`true`/`"end"`/
 * `"start"` single-line ellipsis), `inline` (tight line-height), `inherit`
 * (inherit parent font), `span` (render an inline element). Color is the kit's
 * deliberate divergence — use the `c` style prop / `theme`, not a `color` prop.
 */
export const Text = styled(TamaguiText, {
  name: "Text",
  fontFamily: "$body",
  color: "$color",
  fontSize: "$md",
  variants: {
    size: fontSizeVariant,
    lineClamp: {
      ":number": (val: number) => ({ numberOfLines: val }),
    },
    truncate: {
      true: { ellipsis: true },
      end: { ellipsis: true },
      start: isWeb
        ? ({
            // RTL trick: reverses text direction so ellipsis appears at the start.
            // unicode-bidi ensures text content itself isn't reordered.
            direction: "rtl" as const,
            textAlign: "left" as const,
            overflow: "hidden" as const,
            textOverflow: "ellipsis" as const,
            whiteSpace: "nowrap" as const,
            // display:block required for text-overflow on inline elements.
            display: "block" as const,
          } as object)
        : {
            // Native: ellipsizeMode="head" + numberOfLines=1
            ellipsizeMode: "head" as const,
            numberOfLines: 1,
          },
    },
    inline: {
      true: { verticalAlign: "middle" },
    },
    inherit: {
      true: {
        fontSize: "inherit" as TextStyleProps["fontSize"],
        fontWeight: "inherit" as TextStyleProps["fontWeight"],
        lineHeight: "inherit" as TextStyleProps["lineHeight"],
        fontFamily: "inherit" as TextStyleProps["fontFamily"],
      },
    },
    span: {
      true: { render: "span" },
    },
  } as const,
});

export type TextProps = GetProps<typeof Text>;
