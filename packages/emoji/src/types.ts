import type * as React from "react";

/**
 * One compiled SVG node: `[tag, props, children?]`. Produced at generate time by
 * parsing each Noto Emoji's SVG once (`svgson`), camelCasing every attribute
 * to the form both React DOM and `react-native-svg` accept, converting inline
 * `style` strings to objects, and namespacing every `id`/`url(#…)` reference to
 * the emoji. Shipping the parsed tree — instead of a raw SVG string parsed by
 * `SvgXml` at runtime — is the whole point: there is no XML parsing on the
 * device, and each emoji's element tree is built once at module eval, not per
 * render.
 */
export type EmojiNode = [
  tag: string,
  props: Record<string, string | number | Record<string, string>>,
  children?: EmojiNode[],
];

/**
 * Compiled geometry handed to `createEmoji`. Unlike the monochrome
 * `@knitui/icons` (one merged `<path>` painted a single color), Noto Emoji are
 * full-color artwork — many paths, gradients and clip paths — so each emoji
 * ships as a `viewBox` plus its parsed node tree, rendered verbatim (the kit
 * never recolors it).
 */
export interface EmojiGeometry {
  /** Source viewBox, e.g. `"0 0 128 128"`. Noto Emoji are authored on a 128-unit grid. */
  viewBox: string;
  /** Parsed, render-ready SVG nodes (the inner artwork of the source `<svg>`). */
  nodes: EmojiNode[];
}

/**
 * The shape `createEmoji` accepts for the generated geometry literal. `nodes` is
 * deliberately `readonly unknown[]` rather than `EmojiNode[]`: TypeScript would
 * otherwise structurally deep-check the large nested tuple literal in every one
 * of the ~3k emoji modules — enough to OOM `tsc` on a full build and to cost
 * consumers on each imported emoji. The generator (plus the render smoke tests)
 * is the real validation; the renderer casts `nodes` back to `EmojiNode[]`. This
 * mirrors why `@knitui/icons` types its geometry shallowly.
 */
export interface RawEmojiGeometry {
  viewBox: string;
  nodes: readonly unknown[];
}

export interface EmojiProps {
  /** Width and height of the rendered emoji. Defaults to `24`. */
  size?: number | string;
  /** Suspense fallback used by the dynamic `Emoji` component while a lazy emoji loads. */
  fallback?: React.ReactNode;
  /** Accessible label. Maps to `aria-label` (web) / `accessibilityLabel` (native). */
  title?: string;
  className?: string;
  style?: unknown;
  testID?: string;
  accessibilityLabel?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  [key: string]: unknown;
}

export type EmojiComponent = React.FC<EmojiProps>;
