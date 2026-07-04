import * as React from "react";

import type { EmojiNode } from "../types";

/** Resolves a compiled tag name to the element/component that renders it. */
export type ResolveTag = (tag: string) => React.ElementType;

/**
 * Turns a compiled emoji node tree into a stable array of React elements. Called
 * ONCE per emoji at module eval (not per render): the artwork never changes, so
 * the elements are built up front and reused across every render — only the root
 * `<svg>`/`<Svg>` wrapper (which carries the size) is rebuilt per render.
 *
 * `resolveTag` is the only platform difference: on web it returns the DOM tag
 * name verbatim; on native it maps the tag to a `react-native-svg` component.
 */
export function buildTree(nodes: EmojiNode[], resolveTag: ResolveTag): React.ReactNode[] {
  return nodes.map(([tag, props, children], index) =>
    React.createElement(
      resolveTag(tag),
      { key: index, ...props },
      children && children.length ? buildTree(children, resolveTag) : undefined,
    ),
  );
}
