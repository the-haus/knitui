/**
 * Shared hook that builds the props for upstream's native `Layer`, with a
 * **stable identity**.
 *
 * Upstream `Layer` guards its expensive work with `useMemo(…, [props])` where
 * `props` is a fresh rest-spread object — so that memo never hits, regardless of
 * what we pass. Every render therefore runs `mergeStyleProps` → `transformStyle`
 * (a `processColor` per colour and a `new BridgeValue(...).toJSON()` walk over
 * every expression array) and produces a brand-new `reactStyle` prop, which the
 * native layer then re-applies wholesale.
 *
 * We can't fix upstream's memo, but we can stop the *native prop identity* from
 * changing: memoize the resolved `paint`/`layout` and the whole props object on
 * the real inputs. Upstream still re-runs `transformStyle`, but only when
 * something actually changed — and when nothing changed, Fabric diffs the layer
 * props to nothing.
 *
 * `style`/`paint`/`layout`/`filter` are stabilized structurally
 * ({@link useStableStyleValue}) because the public API is an inline object /
 * expression-array literal at basically every call site.
 */

import { useMemo } from "react";

import type { LayerProps } from "@maplibre/maplibre-react-native";

import { resolvePaintLayout } from "./resolvePaintLayout";
import { useStableStyleValue } from "./styleIdentity";

/** The subset of layer props this hook forwards. Mirrors `BaseLayerProps`. */
export interface NativeLayerInput {
  id?: string;
  source?: string;
  sourceLayer?: string;
  "source-layer"?: string;
  beforeId?: string;
  afterId?: string;
  layerIndex?: number;
  minzoom?: number;
  maxzoom?: number;
  filter?: unknown;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  style?: object;
}

/**
 * Resolve + memoize the props for upstream's `Layer`.
 *
 * @param type - Style-spec layer type (`"symbol"`, `"circle"`, …).
 * @param props - The public layer props.
 * @param sourceBound - Whether this layer type binds to a source. `false` for
 *   `background`, which has no `source`/`source-layer`/`filter` — those keys are
 *   then omitted entirely rather than forwarded as `undefined`.
 */
export function useNativeLayerProps(
  type: string,
  props: NativeLayerInput,
  sourceBound = true,
): LayerProps {
  const style = useStableStyleValue(props.style);
  const paintProp = useStableStyleValue(props.paint);
  const layoutProp = useStableStyleValue(props.layout);
  const filter = useStableStyleValue(props.filter);

  const {
    id,
    source,
    sourceLayer,
    "source-layer": sourceLayerAlt,
    beforeId,
    afterId,
    layerIndex,
    minzoom,
    maxzoom,
  } = props;

  return useMemo(() => {
    // Normalize the (deprecated) camelCase `style` prop into spec-shaped
    // paint/layout so upstream never sees `style` (it warns / removes it in v12).
    const { paint, layout } = resolvePaintLayout(style, paintProp, layoutProp);

    const base: Record<string, unknown> = {
      type,
      id,
      beforeId,
      afterId,
      layerIndex,
      minzoom,
      maxzoom,
    };

    if (sourceBound) {
      base.source = source;
      base["source-layer"] = sourceLayer ?? sourceLayerAlt;
      base.filter = filter;
    }

    if (paint) base.paint = paint;
    if (layout) base.layout = layout;

    // The public per-layer props are already validated against the style spec by
    // each component's own `*.types.ts`; this is the same widening the hand-rolled
    // per-layer objects used to do.
    return base as unknown as LayerProps;
  }, [
    type,
    sourceBound,
    id,
    source,
    sourceLayer,
    sourceLayerAlt,
    beforeId,
    afterId,
    layerIndex,
    minzoom,
    maxzoom,
    filter,
    paintProp,
    layoutProp,
    style,
  ]);
}
