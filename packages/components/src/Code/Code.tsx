import { type GetProps, styled } from "@knitui/core";

import { fontSizePassthroughVariant } from "../internal/style-props";
import { Text } from "../Text";

/**
 * Inline / block code — mirrors Mantine's `Code`. Monospace text on a subtle
 * tinted surface. `block` switches the semantic element from `<code>` (inline)
 * to `<pre>` (full-width block with larger padding). Tint comes from the theme
 * ramp (`$color3` surface, `$color12` text); recolor via the `theme` prop.
 */
const CodeFrame = styled(Text, {
  name: "Code",
  fontFamily: "$mono",
  backgroundColor: "$color3",
  color: "$color12",
  borderRadius: "$sm",
  paddingVertical: "$xxs",
  paddingHorizontal: "$xs",

  variants: {
    size: fontSizePassthroughVariant,
    block: {
      true: {
        display: "block" as const,
        width: "100%",
        padding: "$xs",
      },
    },
  } as const,

  defaultVariants: { size: "xs" },
});

type CodeFrameProps = Omit<GetProps<typeof CodeFrame>, "block">;

export interface CodeProps extends CodeFrameProps {
  /** Render the code in a full-width `<pre>` block instead of inline `<code>`. */
  block?: boolean;
}

export const Code = CodeFrame.styleable<CodeProps>(function Code(props, ref) {
  const { block, ...rest } = props;
  return <CodeFrame ref={ref} block={block} {...rest} render={block ? "pre" : "code"} />;
});
