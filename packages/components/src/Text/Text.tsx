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
  displayName: "Text",
  fontFamily: "body",
  color: "color",
  fontSize: "md",
  // v2 parity: Tamagui v2's shared `font_*` rule gave every font-classed text the
  // font's `$true` line height (the `md` step) whatever its `fontSize`. v3's rule
  // only sets `font-family` (and fonts have no `true` key), so without this every
  // Text fell back to `line-height: normal` and text rows shrank (26px → 15–33px).
  // Components that pair line height with size set it explicitly and win. Web
  // only (a static spread, not a `web:` clause, so a later bare value still
  // replaces it): v2 never applied a default line height on native.
  ...(isWeb ? { lineHeight: "md" as const } : null),
  variants: {
    size: fontSizeVariant,
    /**
     * Multi-line clamp. Maps onto the host `numberOfLines`, which v3's own Text
     * turns into `-webkit-line-clamp` on web (a variant of the base Text there)
     * and passes to the native `<Text>` on iOS/Android.
     */
    lineClamp: styled.dynamic<number>((lines) => ({ numberOfLines: lines })),
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
    /**
     * Mantine parity: render an inline element. The kit's `Text` already renders
     * a `<span>` on web (and an inline RN `<Text>` on native), so this is a
     * declared, consumed prop with no style of its own — a variant body cannot
     * carry `render` in v3. Use `render="p"` / `Paragraph` for a block.
     */
    span: styled.dynamic<boolean>(),
  } as const,
});

export type TextProps = GetProps<typeof Text>;
