import type { Fit, ImageSource, Radius, SkiaColor, TileMode } from "../../types";
import type { GradientFill } from "../gradients/types";

/** Where a layer sits relative to the element's content. Each effect has a sensible default. */
export type EffectPlacement = "behind" | "front";

type LayerBase = {
  placement?: EffectPlacement;
};

/**
 * Distributes `Base` across each member of the {@link GradientFill} union, so a
 * gradient-backed effect is a real discriminated union
 * (`(Base & LinearGradientFill) | (Base & RadialGradientFill) | …`) rather than
 * the intersection-with-a-union `Base & GradientFill`. The distinction is what
 * an editor needs to narrow on `type` while authoring an `effects` literal —
 * surfacing only the matching kind's knobs and flagging fields from the wrong
 * kind. (`Base & GradientFill` stays lazy and offers the merged superset.)
 */
type PerGradientKind<Base> = GradientFill extends infer G
  ? G extends GradientFill
    ? Base & G
    : never
  : never;

// --- Frame effects: Skia paint that may bleed outside the element's box ---

export type FrameShadowSpec = {
  dx?: number;
  dy?: number;
  blur: number;
  color: SkiaColor;
  /** Cast the shadow inward (inset) rather than as an outer drop shadow. */
  inner?: boolean;
};

/** Stroke knobs layered on top of a gradient fill to turn it into a border. */
type BorderStrokeProps = {
  /** Stroke thickness in px. */
  width?: number;
  /**
   * Gap between the content edge and the inner edge of the stroke. Positive
   * pushes the border outward (a ring around the content); negative insets it.
   */
  offset?: number;
  /** Solid stroke color — used only when no gradient `colors`/`stops` are given. */
  color?: SkiaColor;
  /** Border corner radius. Defaults to the element radius grown by the offset. */
  radius?: Radius;
};

/** A gradient (or solid `color`) stroke spec — one per gradient kind. */
export type GradientBorderSpec = PerGradientKind<BorderStrokeProps>;

export type FrameGlow = {
  /** Halo color. Defaults to a soft white. */
  color?: SkiaColor;
  blur?: number;
  /** How far the halo extends beyond the element edge, in px. */
  spread?: number;
  opacity?: number;
};

/** A gradient (or solid `color`) fill painted in the element's rounded box. */
export type FillEffect = PerGradientKind<LayerBase & { effect: "fill"; color?: SkiaColor }>;
/** A gradient/solid stroke around the element, with optional offset. */
export type BorderEffect = PerGradientKind<LayerBase & { effect: "border" } & BorderStrokeProps>;
/** A soft colored halo behind the element. */
export type GlowEffect = LayerBase & { effect: "glow" } & FrameGlow;
/** A single drop (or `inner`) shadow. Stack several by adding several shadow layers. */
export type ShadowEffect = LayerBase & { effect: "shadow" } & FrameShadowSpec;

// --- Texture / image effects: painted into the box and clipped to its corners.
// The element's measured size is injected, so these only carry their own knobs. ---

/** A grid of dots. */
export type DottedGridEffect = LayerBase & {
  effect: "dottedGrid";
  dotSize?: number;
  gap?: number;
  color?: SkiaColor;
  backgroundColor?: SkiaColor;
};

/** A two-tone checkerboard. */
export type CheckerboardEffect = LayerBase & {
  effect: "checkerboard";
  cellSize?: number;
  colors?: readonly [SkiaColor, SkiaColor];
};

/** Fractal / turbulence noise. */
export type NoiseEffect = LayerBase & {
  effect: "noise";
  type?: "fractal" | "turbulence";
  freqX?: number;
  freqY?: number;
  octaves?: number;
  seed?: number;
  tileWidth?: number;
  tileHeight?: number;
  opacity?: number;
};

/** An image painted into the box. */
export type ImageEffect = LayerBase & {
  effect: "image";
  source: ImageSource;
  fit?: Fit;
  opacity?: number;
};

/** An image with a Gaussian blur and an optional color wash on top. */
export type BlurredImageEffect = LayerBase & {
  effect: "blurredImage";
  source: ImageSource;
  fit?: Fit;
  opacity?: number;
  blur?: number;
  blurMode?: TileMode;
  overlayColor?: SkiaColor;
};

/**
 * One entry in a {@link import("./EffectView").EffectView}'s `effects` array. A discriminated
 * union keyed on `effect`: frame paints (`fill`, `border`, `glow`, `shadow`) plus
 * texture / image effects (`dottedGrid`, `checkerboard`, `noise`, `image`,
 * `blurredImage`). The element's measured size and `borderRadius` are injected, so
 * a descriptor only carries the effect's own knobs. Never a component — the user
 * passes data, not JSX.
 */
export type EffectLayer =
  | FillEffect
  | BorderEffect
  | GlowEffect
  | ShadowEffect
  | DottedGridEffect
  | CheckerboardEffect
  | NoiseEffect
  | ImageEffect
  | BlurredImageEffect;

/** The `effect` discriminator of an {@link EffectLayer}. */
export type EffectKind = EffectLayer["effect"];
