import * as React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  FeBlend,
  FeColorMatrix,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  FeOffset,
  Filter,
  G,
  Line,
  LinearGradient,
  Mask,
  Path,
  Pattern,
  Polygon,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Svg,
  Symbol as SvgSymbol,
  Use,
} from "react-native-svg";

import type { EmojiComponent, EmojiNode, EmojiProps, RawEmojiGeometry } from "../types";
import { buildTree } from "./build-tree";
import { useEmojiContext } from "./emoji-context";

/**
 * Maps a compiled SVG tag to its `react-native-svg` component — the same mapping
 * `react-native-svg`'s own `SvgXml` uses, but resolved at build/eval time from
 * the pre-parsed tree instead of parsing an XML string on every first render.
 * Covers every tag the Noto Emoji set uses (plus a few common extras so a
 * future data bump degrades gracefully).
 */
const TAGS: Record<string, React.ElementType> = {
  circle: Circle,
  clipPath: ClipPath,
  defs: Defs,
  ellipse: Ellipse,
  feBlend: FeBlend,
  feColorMatrix: FeColorMatrix,
  feComposite: FeComposite,
  feFlood: FeFlood,
  feGaussianBlur: FeGaussianBlur,
  feMerge: FeMerge,
  feMergeNode: FeMergeNode,
  feOffset: FeOffset,
  filter: Filter,
  g: G,
  line: Line,
  linearGradient: LinearGradient,
  mask: Mask,
  path: Path,
  pattern: Pattern,
  polygon: Polygon,
  polyline: Polyline,
  radialGradient: RadialGradient,
  rect: Rect,
  stop: Stop,
  symbol: SvgSymbol,
  use: Use,
};

/**
 * Native renderer. Noto Emoji are full-color SVG artwork (many paths,
 * gradients, clip paths). Rather than hand `react-native-svg`'s
 * `SvgXml` a raw string to parse at runtime, the pre-compiled node tree is built
 * into a `react-native-svg` element tree ONCE here at module eval — no XML
 * parser runs on the device, and each render only rebuilds the root `<Svg>`
 * wrapper carrying the size.
 *
 * Emoji are full-color, so there is no `color`/`stroke` prop — only `size`
 * (explicit prop → ambient `EmojiProvider` → hard default of 24).
 */
export function createEmoji(
  _emojiName: string,
  displayName: string,
  geometry: RawEmojiGeometry,
): EmojiComponent {
  const { viewBox, nodes } = geometry;
  const children = buildTree(nodes as EmojiNode[], (tag) => TAGS[tag] ?? G);

  const Emoji = React.memo(
    ({
      size: sizeProp,
      title,
      accessibilityLabel,
      testID,
      style,
      // DOM-only props are dropped so they never reach react-native-svg.
      className: _className,
      fallback: _fallback,
      children: _children,
      "aria-label": _ariaLabel,
      "aria-hidden": _ariaHidden,
      ...rest
    }: EmojiProps) => {
      const ctx = useEmojiContext();
      const size = sizeProp ?? ctx.size ?? 24;

      return React.createElement(
        Svg,
        {
          width: size,
          height: size,
          viewBox,
          accessibilityLabel: accessibilityLabel ?? title,
          testID,
          style: style as StyleProp<ViewStyle>,
          ...rest,
        },
        children,
      );
    },
  );

  Emoji.displayName = displayName;
  return Emoji;
}
