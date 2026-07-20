import { type GetProps, styled } from "@knitui/core";

import { fontSizePassthroughVariant, textWrapVariant } from "../internal/style-props";
import { Text } from "../Text";

export type TitleOrder = 1 | 2 | 3 | 4 | 5 | 6;
export type TitleSize =
  "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/**
 * Heading — mirrors Mantine's `Title`. `order` (1–6) drives the semantic heading
 * element (`h1`–`h6`) and its default size; `size` overrides that size (accepts
 * `'h1'–'h6'`, any seven-step font-size token, or an arbitrary CSS value).
 * `lineClamp`, `truncate`, and `inline` are inherited from `Text`.
 */
const TitleFrame = styled(Text, {
  name: "Title",
  fontFamily: "$heading",
  fontWeight: "700",
  variants: {
    order: {
      1: { fontSize: "$xxl" },
      2: { fontSize: "$xl" },
      3: { fontSize: "$lg" },
      4: { fontSize: "$md" },
      5: { fontSize: "$sm" },
      6: { fontSize: "$xs" },
    },
    /** Override the order-driven size. `h1`–`h6` map to the heading scale;
     *  seven-step font-size tokens and arbitrary CSS values pass through to `fontSize`. */
    size: {
      h1: { fontSize: "$xxl" },
      h2: { fontSize: "$xl" },
      h3: { fontSize: "$lg" },
      h4: { fontSize: "$md" },
      h5: { fontSize: "$sm" },
      h6: { fontSize: "$xs" },
      ...fontSizePassthroughVariant,
    },
    textWrap: textWrapVariant,
  } as const,
  defaultVariants: { order: 1 },
});

export interface TitleProps extends GetProps<typeof TitleFrame> {}

export const Title = TitleFrame.styleable<TitleProps>(function Title(props, ref) {
  const order = props.order ?? 1;
  return <TitleFrame ref={ref} {...props} render={`h${order}`} />;
});
