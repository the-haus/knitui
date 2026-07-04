import * as React from "react";

import type { EmojiComponent, EmojiNode, EmojiProps, RawEmojiGeometry } from "../types";
import { buildTree } from "./build-tree";
import { useEmojiContext } from "./emoji-context";

/**
 * Web renderer. The compiled node tree is turned into DOM SVG elements ONCE here
 * at module eval — React DOM renders `<path>`, `<linearGradient>`, `<filter>`,
 * … from their verbatim (lowercase/camelCase) tag names, and the generator has
 * already camelCased every attribute so React logs no "Invalid DOM property"
 * warnings. The native counterpart lives in `create-emoji.native.tsx`;
 * bundlers/Metro pick the right one per platform.
 *
 * Emoji are full-color, so there is no `color`/`stroke` prop — only `size`
 * (explicit prop → ambient `EmojiProvider` → hard default of 24). The component
 * is `React.memo`'d and only rebuilds the root `<svg>` wrapper per render; the
 * artwork children are stable.
 */
export function createEmoji(
  emojiName: string,
  displayName: string,
  geometry: RawEmojiGeometry,
): EmojiComponent {
  const { viewBox, nodes } = geometry;
  // Web resolves each compiled tag to its DOM name verbatim (a lowercase/camelCase
  // SVG element name React renders as-is).
  const children = buildTree(nodes as EmojiNode[], (tag) => tag as React.ElementType);

  const Emoji = React.memo(
    ({
      size: sizeProp,
      title,
      className,
      accessibilityLabel,
      testID,
      // Destructured purely so they never leak onto the DOM element.
      fallback: _fallback,
      children: _children,
      ...rest
    }: EmojiProps) => {
      const ctx = useEmojiContext();
      const size = sizeProp ?? ctx.size ?? 24;
      const label = (rest["aria-label"] as string | undefined) ?? accessibilityLabel ?? title;

      return React.createElement(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: size,
          height: size,
          viewBox,
          className: ["knitui-emoji", `knitui-emoji-${emojiName}`, className]
            .filter(Boolean)
            .join(" "),
          role: label ? "img" : undefined,
          "aria-label": label,
          "aria-hidden": label ? undefined : true,
          "data-testid": testID,
          ...rest,
        },
        children,
      );
    },
  );

  Emoji.displayName = displayName;
  return Emoji;
}
