/**
 * The visualizer's Skia path builders: flat shape buffer (see `geometry.ts`) →
 * `SkPath`. Split out of `AudioVisualizer.tsx` so this — the one place per frame
 * that touches CanvasKit — can be unit-tested against a recording `PathBuilder`
 * without pulling React / reanimated / the Skia runtime into the suite.
 *
 * Both are worklets: they run on the UI thread (native) or in the rAF-driven
 * derived value (web), 60 times a second, so they allocate as close to nothing as
 * the bindings allow.
 */
import { Skia, type SkPath } from "@shopify/react-native-skia";

import {
  CIRCLE_SLOTS,
  LINE_HEADER_SLOTS,
  RECT_SLOTS,
  SHAPE_CIRCLE,
  SHAPE_END,
  SHAPE_RECT,
} from "./geometry";

/**
 * Build the fill path (bars / dots / closed polylines) from a flat shape buffer.
 *
 * The `PathBuilder` (not the deprecated mutable `SkPath.add*`/`moveTo`/`lineTo`;
 * `detach()` returns the finished `SkPath`) is created LAZILY — only once a fill
 * shape is actually seen. Each variant emits either fill OR stroke shapes, so for
 * a stroke-only variant (`line`/`radial`) this returns `""` without ever touching
 * CanvasKit, saving a native path alloc + `detach()` every frame.
 *
 * Rects go in through ONE mutable plain-object rect/rrect pair, reused for every
 * bar. `Skia.XYWHRect` + `Skia.RRectXY` each returned a real host object (a JSI
 * `HostObject` holding a C++ `shared_ptr` on native; a `JsiSkRect` wrapping a fresh
 * `Float32Array` on web) — 2 per bar, 96 per frame at the default `count`, all
 * immediately garbage. Both bindings also accept a plain `{x, y, width, height}` /
 * `{rect, rx, ry}` and copy out of it synchronously (`JsiSkRect::fromValue` /
 * `JsiSkRRect::fromValue`; `JsiSkRect.fromValue` / `JsiSkRRect.fromValue` on web),
 * so reuse is safe and the `SkRRect` is built by the identical `SkRRect::MakeRectXY`
 * call as before. A zero radius takes `addRect`, which is exactly what Skia's
 * `addRRect` degenerates to for a radius-less rrect. Worklet.
 */
export function buildFillPath(shapes: Float64Array): SkPath | "" {
  "worklet";
  let p: ReturnType<typeof Skia.PathBuilder.Make> | null = null;
  const rect = { x: 0, y: 0, width: 0, height: 0 };
  const rrect = { rect, rx: 0, ry: 0 };
  let i = 0;
  while (i < shapes.length) {
    const kind = shapes[i];
    if (kind === SHAPE_END) break;
    if (kind === SHAPE_RECT) {
      if (!p) p = Skia.PathBuilder.Make();
      rect.x = shapes[i + 1];
      rect.y = shapes[i + 2];
      rect.width = shapes[i + 3];
      rect.height = shapes[i + 4];
      const r = shapes[i + 5];
      if (r > 0) {
        rrect.rx = r;
        rrect.ry = r;
        p.addRRect(rrect);
      } else {
        p.addRect(rect);
      }
      i += RECT_SLOTS;
    } else if (kind === SHAPE_CIRCLE) {
      if (!p) p = Skia.PathBuilder.Make();
      p.addCircle(shapes[i + 1], shapes[i + 2], shapes[i + 3]);
      i += CIRCLE_SLOTS;
    } else {
      const pointCount = shapes[i + 3];
      const base = i + LINE_HEADER_SLOTS;
      // Closed lines are the filled envelope (`wave`); 3+ points to enclose an area.
      if (shapes[i + 1] !== 0 && pointCount >= 3) {
        if (!p) p = Skia.PathBuilder.Make();
        p.moveTo(shapes[base], shapes[base + 1]);
        for (let k = 1; k < pointCount; k++) {
          p.lineTo(shapes[base + 2 * k], shapes[base + 2 * k + 1]);
        }
        p.close();
      }
      i = base + pointCount * 2;
    }
  }
  return p ? p.detach() : "";
}

/**
 * Build the stroke path (open polylines / radial spokes) from a flat shape buffer.
 * Lazy `PathBuilder` like {@link buildFillPath}: a fill-only variant (`bars` /
 * `mirror` / `dots` / `wave`) returns `""` without allocating a native path. Worklet.
 */
export function buildStrokePath(shapes: Float64Array): SkPath | "" {
  "worklet";
  let p: ReturnType<typeof Skia.PathBuilder.Make> | null = null;
  let i = 0;
  while (i < shapes.length) {
    const kind = shapes[i];
    if (kind === SHAPE_END) break;
    if (kind === SHAPE_RECT) {
      i += RECT_SLOTS;
    } else if (kind === SHAPE_CIRCLE) {
      i += CIRCLE_SLOTS;
    } else {
      const pointCount = shapes[i + 3];
      const base = i + LINE_HEADER_SLOTS;
      if (shapes[i + 1] === 0 && pointCount >= 2) {
        if (!p) p = Skia.PathBuilder.Make();
        p.moveTo(shapes[base], shapes[base + 1]);
        for (let k = 1; k < pointCount; k++) {
          p.lineTo(shapes[base + 2 * k], shapes[base + 2 * k + 1]);
        }
      }
      i = base + pointCount * 2;
    }
  }
  return p ? p.detach() : "";
}
