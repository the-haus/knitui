/**
 * Resolve a layer's `paint`/`layout` from the explicit spec props plus the
 * (deprecated) camelCase `style` prop.
 *
 * The public `@knitui/map` layer API still accepts a typed, camelCase `style`
 * object. Upstream `@maplibre/maplibre-react-native` deprecated forwarding
 * `style` to its native `Layer` (it warns and will remove it in v12), and
 * `maplibre-gl` on web only understands spec-shaped `paint`/`layout`. So both
 * platforms normalize `style` here: keys are converted to spec kebab-case and
 * split into `paint` vs `layout`, then merged with any explicit props.
 *
 * Precedence matches the rest of the kit: explicit `paint`/`layout` win over
 * keys derived from `style`.
 */

export interface PaintLayout {
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
}

export function camelToDash(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/** camelCase style keys that belong to a layer's `layout` (everything else is `paint`). */
const LAYOUT_PROPERTIES = new Set([
  "visibility",
  "lineCap",
  "lineJoin",
  "lineMiterLimit",
  "lineRoundLimit",
  "lineSortKey",
  "fillSortKey",
  "circleSortKey",
  "symbolPlacement",
  "symbolSpacing",
  "symbolAvoidEdges",
  "symbolSortKey",
  "symbolZOrder",
  "iconAllowOverlap",
  "iconIgnorePlacement",
  "iconOptional",
  "iconRotationAlignment",
  "iconSize",
  "iconTextFit",
  "iconTextFitPadding",
  "iconImage",
  "iconRotate",
  "iconPadding",
  "iconKeepUpright",
  "iconOffset",
  "iconAnchor",
  "iconPitchAlignment",
  "textPitchAlignment",
  "textRotationAlignment",
  "textField",
  "textFont",
  "textSize",
  "textMaxWidth",
  "textLineHeight",
  "textLetterSpacing",
  "textJustify",
  "textRadialOffset",
  "textVariableAnchor",
  "textAnchor",
  "textMaxAngle",
  "textWritingMode",
  "textRotate",
  "textPadding",
  "textKeepUpright",
  "textTransform",
  "textOffset",
  "textAllowOverlap",
  "textIgnorePlacement",
  "textOptional",
]);

/** Heuristic to classify a camelCase style key as a layout property. */
export function isLayoutProperty(key: string): boolean {
  return LAYOUT_PROPERTIES.has(key);
}

/**
 * Merge explicit `paint`/`layout` with a deprecated camelCase `style` object,
 * returning spec-shaped `paint`/`layout` ready for `maplibre-gl` /
 * `@maplibre/maplibre-react-native`. Omits empty buckets so the caller can
 * spread the result without setting `paint: {}` / `layout: {}`.
 */
export function resolvePaintLayout(
  style?: object,
  paint?: Record<string, unknown>,
  layout?: Record<string, unknown>,
): PaintLayout {
  let resolvedPaint = paint ? { ...paint } : undefined;
  let resolvedLayout = layout ? { ...layout } : undefined;

  if (style) {
    for (const [key, value] of Object.entries(style as Record<string, unknown>)) {
      const dashKey = camelToDash(key);
      if (isLayoutProperty(key)) {
        (resolvedLayout ??= {})[dashKey] = value;
      } else {
        (resolvedPaint ??= {})[dashKey] = value;
      }
    }
  }

  const result: PaintLayout = {};
  if (resolvedPaint && Object.keys(resolvedPaint).length > 0) result.paint = resolvedPaint;
  if (resolvedLayout && Object.keys(resolvedLayout).length > 0) result.layout = resolvedLayout;
  return result;
}
