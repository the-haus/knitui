import * as React from "react";

import {
  Blur,
  BlurMask,
  Circle,
  FractalNoise,
  Group,
  Image,
  rect,
  Rect,
  RoundedRect,
  rrect,
  Shadow,
  Turbulence,
  useImage,
} from "@shopify/react-native-skia";

import type { Radius, Size, SkiaColor } from "../../types";
import { resolveRadius } from "../../utils";
import { GradientShader, hasGradientColors } from "../gradients/GradientShader";
import { EffectBoundary } from "./EffectBoundary";
import {
  clamp,
  colorOr,
  enumValue,
  FIT_VALUES,
  isEffectLayer,
  isFiniteNumber,
  isRenderableSize,
  MAX_AXIS_STEPS,
  MAX_CELLS,
  MAX_OUTSET,
  nonNeg,
  num,
  positive,
  safePlacement,
  safeRadius,
  sanitizeFill,
  TILE_MODES,
} from "./normalize";
import { OverlayCanvas } from "./OverlayCanvas";
import type {
  BlurredImageEffect,
  BorderEffect,
  CheckerboardEffect,
  DottedGridEffect,
  EffectLayer,
  EffectPlacement,
  FillEffect,
  GlowEffect,
  ImageEffect,
  NoiseEffect,
  ShadowEffect,
} from "./types";

// Skia's <Shadow blur> / <BlurMask blur> are Gaussian sigmas; the visible
// falloff reaches ~3σ. We pad the canvas by that full reach so the soft edge of
// any blur never gets clipped at the canvas boundary.
const BLUR_REACH = 3;
const DEFAULT_GLOW_COLOR = "rgba(255, 255, 255, 0.55)";
const DEFAULT_GLOW_BLUR = 16;
const DEFAULT_SHADOW_SOURCE = "black";

/** Geometry of the content box, in the shared canvas's coordinate space. */
export type PaintContext = {
  /** Canvas-space origin of the content box (= the canvas outset on each axis). */
  origin: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
};

/** An optional, non-empty color, or `undefined`. */
function optionalColor(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

/** A finite opacity clamped to `[0, 1]`, or `undefined`. */
function optionalOpacity(value: unknown): number | undefined {
  return isFiniteNumber(value) ? clamp(value, 0, 1) : undefined;
}

function defaultPlacement(layer: EffectLayer): EffectPlacement {
  if (layer.effect === "border") {
    return "front";
  }

  if (layer.effect === "shadow" && layer.inner) {
    return "front";
  }

  return "behind";
}

/**
 * The placement a layer resolves to: an explicit (valid) `placement`, else the
 * per-kind default — borders and inner shadows above the content, everything else
 * behind it.
 */
export function resolvePlacement(layer: EffectLayer): EffectPlacement {
  return safePlacement(layer.placement) ?? defaultPlacement(layer);
}

/**
 * How far this layer bleeds past the content box, so the shared canvas can be
 * inflated to contain every layer's reach. Coerced finite and capped at
 * {@link MAX_OUTSET} so a hostile value can't request a gigantic canvas.
 */
export function layerOutset(layer: EffectLayer): number {
  let raw = 0;

  switch (layer.effect) {
    case "glow":
      raw = nonNeg(layer.spread, 0) + positive(layer.blur, DEFAULT_GLOW_BLUR) * BLUR_REACH;
      break;
    case "shadow": {
      if (layer.inner) {
        break;
      }
      const reach = Math.max(Math.abs(num(layer.dx, 0)), Math.abs(num(layer.dy, 0)));
      raw = reach + nonNeg(layer.blur, 0) * BLUR_REACH;
      break;
    }
    case "border":
      raw = num(layer.offset, 0) + nonNeg(layer.width, 2);
      break;
    default:
      raw = 0;
  }

  return clamp(Math.ceil(raw), 0, MAX_OUTSET);
}

/** A rounded-rect clip hugging the content box — used to keep box-filling effects in bounds. */
function boxClip(ctx: PaintContext) {
  return rrect(rect(ctx.origin, ctx.origin, ctx.width, ctx.height), ctx.rx, ctx.ry);
}

/** Evenly-spaced positions across `extent`, bounded so a tiny/zero step can never loop forever. */
function axisPositions(extent: number, step: number, centered: boolean): number[] {
  const positions: number[] = [];
  const count = Math.min(Math.ceil(extent / step) + 1, MAX_AXIS_STEPS);
  const start = centered ? step / 2 : 0;

  for (let index = 0; index < count; index += 1) {
    const value = start + index * step;
    if (value >= extent) {
      break;
    }
    positions.push(value);
  }

  return positions;
}

function FillPaint({ layer, ctx }: { layer: FillEffect; ctx: PaintContext }) {
  const fill = sanitizeFill(layer);
  const gradient = hasGradientColors(fill);
  const solid = optionalColor(layer.color);

  if (!gradient && solid == null) {
    return null;
  }

  const bounds = { x: ctx.origin, y: ctx.origin, width: ctx.width, height: ctx.height };

  return (
    <RoundedRect
      x={ctx.origin}
      y={ctx.origin}
      width={ctx.width}
      height={ctx.height}
      r={{ x: ctx.rx, y: ctx.ry }}
      color={gradient ? undefined : solid}
      opacity={gradient ? fill.opacity : undefined}
    >
      {gradient ? <GradientShader fill={fill} bounds={bounds} /> : null}
    </RoundedRect>
  );
}

function BorderPaint({ layer, ctx }: { layer: BorderEffect; ctx: PaintContext }) {
  const fill = sanitizeFill(layer);
  const gradient = hasGradientColors(fill);
  const solid = optionalColor(layer.color);

  // No usable paint (no gradient colors, no solid color) → draw nothing rather
  // than falling back to a surprise default gradient.
  if (!gradient && solid == null) {
    return null;
  }

  const borderWidth = nonNeg(layer.width, 2);
  const inflate = num(layer.offset, 0) + borderWidth / 2;
  const bounds = {
    x: ctx.origin - inflate,
    y: ctx.origin - inflate,
    width: ctx.width + inflate * 2,
    height: ctx.height + inflate * 2,
  };

  let brx: number;
  let bry: number;
  if (layer.radius != null) {
    ({ rx: brx, ry: bry } = resolveRadius(safeRadius(layer.radius)));
  } else {
    brx = Math.max(0, ctx.rx + inflate);
    bry = Math.max(0, ctx.ry + inflate);
  }

  return (
    <RoundedRect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      r={{ x: Math.max(0, brx), y: Math.max(0, bry) }}
      style="stroke"
      strokeWidth={borderWidth}
      color={gradient ? undefined : solid}
      opacity={optionalOpacity(layer.opacity)}
    >
      {gradient ? <GradientShader fill={fill} bounds={bounds} /> : null}
    </RoundedRect>
  );
}

function GlowPaint({ layer, ctx }: { layer: GlowEffect; ctx: PaintContext }) {
  const blur = positive(layer.blur, DEFAULT_GLOW_BLUR);
  const edge = nonNeg(layer.spread, 0);

  return (
    <RoundedRect
      x={ctx.origin - edge}
      y={ctx.origin - edge}
      width={ctx.width + edge * 2}
      height={ctx.height + edge * 2}
      r={{ x: Math.max(0, ctx.rx + edge), y: Math.max(0, ctx.ry + edge) }}
      color={colorOr(layer.color, DEFAULT_GLOW_COLOR)}
      opacity={optionalOpacity(layer.opacity)}
    >
      <BlurMask blur={blur} style="normal" />
    </RoundedRect>
  );
}

function ShadowPaint({ layer, ctx }: { layer: ShadowEffect; ctx: PaintContext }) {
  // An opaque rounded rect whose only visible output is the shadow it casts.
  return (
    <RoundedRect
      x={ctx.origin}
      y={ctx.origin}
      width={ctx.width}
      height={ctx.height}
      r={{ x: ctx.rx, y: ctx.ry }}
      color={DEFAULT_SHADOW_SOURCE}
    >
      <Shadow
        dx={num(layer.dx, 0)}
        dy={num(layer.dy, 0)}
        blur={nonNeg(layer.blur, 0)}
        color={colorOr(layer.color, DEFAULT_SHADOW_SOURCE)}
        inner={Boolean(layer.inner)}
        shadowOnly
      />
    </RoundedRect>
  );
}

function DottedGridPaint({ layer, ctx }: { layer: DottedGridEffect; ctx: PaintContext }) {
  const dotSize = nonNeg(layer.dotSize, 2);
  const gap = positive(layer.gap, 14);
  const color = colorOr(layer.color, "rgba(15, 23, 42, 0.24)");
  const backgroundColor = optionalColor(layer.backgroundColor);

  const xs = axisPositions(ctx.width, gap, true);
  const ys = axisPositions(ctx.height, gap, true);
  const dots: Array<{ x: number; y: number }> = [];
  let capped = false;
  for (const x of xs) {
    if (capped) {
      break;
    }
    for (const y of ys) {
      dots.push({ x: ctx.origin + x, y: ctx.origin + y });
      if (dots.length >= MAX_CELLS) {
        capped = true;
        break;
      }
    }
  }

  return (
    <Group clip={boxClip(ctx)}>
      {backgroundColor ? (
        <Rect
          x={ctx.origin}
          y={ctx.origin}
          width={ctx.width}
          height={ctx.height}
          color={backgroundColor}
        />
      ) : null}
      {dots.map((dot, index) => (
        <Circle key={index} cx={dot.x} cy={dot.y} r={dotSize} color={color} />
      ))}
    </Group>
  );
}

function CheckerboardPaint({ layer, ctx }: { layer: CheckerboardEffect; ctx: PaintContext }) {
  const cellSize = positive(layer.cellSize, 16);
  const first = Array.isArray(layer.colors) ? optionalColor(layer.colors[0]) : undefined;
  const second = Array.isArray(layer.colors) ? optionalColor(layer.colors[1]) : undefined;
  const colors: readonly [SkiaColor, SkiaColor] = [first ?? "#f8fafc", second ?? "#cbd5e1"];

  const xs = axisPositions(ctx.width, cellSize, false);
  const ys = axisPositions(ctx.height, cellSize, false);
  const cells: Array<{ x: number; y: number; color: SkiaColor }> = [];
  let capped = false;
  for (let cx = 0; cx < xs.length && !capped; cx += 1) {
    for (let cy = 0; cy < ys.length; cy += 1) {
      cells.push({ x: ctx.origin + xs[cx], y: ctx.origin + ys[cy], color: colors[(cx + cy) % 2] });
      if (cells.length >= MAX_CELLS) {
        capped = true;
        break;
      }
    }
  }

  return (
    <Group clip={boxClip(ctx)}>
      <Rect x={ctx.origin} y={ctx.origin} width={ctx.width} height={ctx.height} color={colors[0]} />
      {cells.map((cell, index) => (
        <Rect
          key={index}
          x={cell.x}
          y={cell.y}
          width={cellSize}
          height={cellSize}
          color={cell.color}
        />
      ))}
    </Group>
  );
}

function NoisePaint({ layer, ctx }: { layer: NoiseEffect; ctx: PaintContext }) {
  const shaderProps = {
    freqX: num(layer.freqX, 0.04),
    freqY: num(layer.freqY, 0.04),
    octaves: clamp(Math.round(num(layer.octaves, 4)), 1, 12),
    seed: num(layer.seed, 0),
    tileWidth: isFiniteNumber(layer.tileWidth) ? layer.tileWidth : undefined,
    tileHeight: isFiniteNumber(layer.tileHeight) ? layer.tileHeight : undefined,
  };

  return (
    <Group clip={boxClip(ctx)}>
      <Rect
        x={ctx.origin}
        y={ctx.origin}
        width={ctx.width}
        height={ctx.height}
        opacity={optionalOpacity(layer.opacity)}
      >
        {layer.type === "turbulence" ? (
          <Turbulence {...shaderProps} />
        ) : (
          <FractalNoise {...shaderProps} />
        )}
      </Rect>
    </Group>
  );
}

function ImagePaint({ layer, ctx }: { layer: ImageEffect; ctx: PaintContext }) {
  const image = useImage(layer.source ?? null);
  if (!image) {
    return null;
  }

  return (
    <Group clip={boxClip(ctx)}>
      <Image
        image={image}
        x={ctx.origin}
        y={ctx.origin}
        width={ctx.width}
        height={ctx.height}
        fit={enumValue(layer.fit, FIT_VALUES, "cover")}
        opacity={optionalOpacity(layer.opacity)}
      />
    </Group>
  );
}

function BlurredImagePaint({ layer, ctx }: { layer: BlurredImageEffect; ctx: PaintContext }) {
  const image = useImage(layer.source ?? null);
  const overlayColor = optionalColor(layer.overlayColor);

  return (
    <Group clip={boxClip(ctx)}>
      {image ? (
        <Image
          image={image}
          x={ctx.origin}
          y={ctx.origin}
          width={ctx.width}
          height={ctx.height}
          fit={enumValue(layer.fit, FIT_VALUES, "cover")}
          opacity={optionalOpacity(layer.opacity)}
        >
          <Blur
            blur={nonNeg(layer.blur, 8)}
            mode={enumValue(layer.blurMode, TILE_MODES, "clamp")}
          />
        </Image>
      ) : null}
      {overlayColor ? (
        <Rect
          x={ctx.origin}
          y={ctx.origin}
          width={ctx.width}
          height={ctx.height}
          color={overlayColor}
        />
      ) : null}
    </Group>
  );
}

export type LayerPaintProps = {
  layer: EffectLayer;
  /** Content corner radius — normally the element's own `borderRadius`. */
  radius?: Radius;
  /** Canvas-space origin of the content box (= the shared canvas's outset). */
  origin: number;
  width: number;
  height: number;
};

/**
 * Emits one {@link EffectLayer}'s Skia nodes into the shared canvas — the data →
 * Skia mapping. Every numeric / color / enum knob is coerced (see [[normalize]])
 * so a malformed prop degrades gracefully instead of crashing. Frame effects
 * paint directly; box-filling effects are wrapped in a Skia `Group` clipped to
 * the rounded content box. Shared verbatim between web and native View.
 */
export function LayerPaint({ layer, radius, origin, width, height }: LayerPaintProps) {
  const { rx, ry } = resolveRadius(safeRadius(radius));
  const ctx: PaintContext = { origin, width, height, rx, ry };

  switch (layer.effect) {
    case "fill":
      return <FillPaint layer={layer} ctx={ctx} />;
    case "border":
      return <BorderPaint layer={layer} ctx={ctx} />;
    case "glow":
      return <GlowPaint layer={layer} ctx={ctx} />;
    case "shadow":
      return <ShadowPaint layer={layer} ctx={ctx} />;
    case "dottedGrid":
      return <DottedGridPaint layer={layer} ctx={ctx} />;
    case "checkerboard":
      return <CheckerboardPaint layer={layer} ctx={ctx} />;
    case "noise":
      return <NoisePaint layer={layer} ctx={ctx} />;
    case "image":
      return <ImagePaint layer={layer} ctx={ctx} />;
    case "blurredImage":
      return <BlurredImagePaint layer={layer} ctx={ctx} />;
    default:
      return null;
  }
}

export type EffectCanvasProps = {
  layers: readonly EffectLayer[];
  placement: EffectPlacement;
  size: Size;
  radius?: Radius;
  androidWarmup?: boolean;
};

/**
 * Paints every valid layer for one placement into a **single** absolutely-
 * positioned Skia canvas, inflated to contain the widest-bleeding layer. Junk
 * entries (null, non-objects, unknown `effect` kinds) are filtered out, the size
 * is validated before a canvas is mounted, and the whole subtree is wrapped in an
 * {@link EffectBoundary} so nothing here can crash the host element.
 */
export function EffectCanvas({
  layers,
  placement,
  size,
  radius,
  androidWarmup,
}: EffectCanvasProps) {
  const valid = (Array.isArray(layers) ? layers : []).filter(isEffectLayer);
  const selected = valid.filter((layer) => resolvePlacement(layer) === placement);

  if (selected.length === 0 || !isRenderableSize(size.width, size.height)) {
    return null;
  }

  const outset = selected.reduce((max, layer) => Math.max(max, layerOutset(layer)), 0);

  return (
    <EffectBoundary>
      <OverlayCanvas
        width={size.width}
        height={size.height}
        outset={outset}
        androidWarmup={androidWarmup}
      >
        {selected.map((layer, index) => (
          <LayerPaint
            key={index}
            layer={layer}
            radius={radius}
            origin={outset}
            width={size.width}
            height={size.height}
          />
        ))}
      </OverlayCanvas>
    </EffectBoundary>
  );
}
