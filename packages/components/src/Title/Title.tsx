import { type GetProps, styleable, styled } from "@knitui/core";

import {
  fontSizeOf,
  fontSizeVariant,
  tableVariant,
  textWrapVariant,
} from "../internal/style-props";
import { Text } from "../Text";

export type TitleOrder = 1 | 2 | 3 | 4 | 5 | 6;
export type TitleSize =
  "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/** `h1`–`h6` + the seven-step font scale, with a raw / CSS `fontSize` fallthrough. */
const titleSizeVariant = tableVariant(
  {
    h1: { fontSize: "xxl" },
    h2: { fontSize: "xl" },
    h3: { fontSize: "lg" },
    h4: { fontSize: "md" },
    h5: { fontSize: "sm" },
    h6: { fontSize: "xs" },
    ...fontSizeVariant,
  },
  fontSizeOf,
);

/**
 * Heading — mirrors Mantine's `Title`. `order` (1–6) drives the semantic heading
 * element (`h1`–`h6`) and its default size; `size` overrides that size (accepts
 * `'h1'–'h6'`, any seven-step font-size token, or an arbitrary CSS value).
 * `lineClamp`, `truncate`, and `inline` are inherited from `Text`.
 */
const TitleFrame = styled(Text, {
  displayName: "Title",
  fontFamily: "heading",
  fontWeight: "700",
  variants: {
    order: {
      1: { fontSize: "xxl" },
      2: { fontSize: "xl" },
      3: { fontSize: "lg" },
      4: { fontSize: "md" },
      5: { fontSize: "sm" },
      6: { fontSize: "xs" },
    },
    /** Override the order-driven size. `h1`–`h6` map to the heading scale;
     *  seven-step font-size tokens and arbitrary CSS values pass through to `fontSize`. */
    size: titleSizeVariant,
    textWrap: textWrapVariant,
  } as const,
  defaultVariants: { order: 1 },
});

export interface TitleProps extends Omit<GetProps<typeof TitleFrame>, "order"> {
  /**
   * Heading level 1–6: picks the semantic `<h1>`–`<h6>` host and the default
   * size. A single value (not a clause program), because the host element cannot
   * change per breakpoint; use `size` for responsive sizing. @default 1
   */
  order?: TitleOrder;
}

const HEADING_HOSTS = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

/**
 * Behaviour wrapper (stays `styleable`): the host element is DERIVED from
 * `order`, and v3 variant bodies cannot carry `render`. Everything else is the
 * flattenable `TitleFrame`.
 */
export const Title = styleable<TitleProps>(TitleFrame, function Title(props, ref) {
  const host = HEADING_HOSTS[props.order ?? 1] ?? "h1";
  return <TitleFrame ref={ref} {...props} render={host} />;
});
