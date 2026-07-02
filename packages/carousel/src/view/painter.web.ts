import * as React from "react";

import { itemProgress, rawIndex } from "../engine";
import { useSharedValueListener } from "../hooks/useSharedValueListener";
import type { RegisterFn, WebPainterParams } from "./painter";
import { transformToCss } from "./transformToCss";

export type { PainterEntry, RegisterFn, WebPainterParams } from "./painter";
// Re-exported so existing `./painter.web` importers (and painter.test.ts) keep
// resolving it; the implementation now lives in the platform-neutral module.
export { transformToCss } from "./transformToCss";

interface LiveEntry {
  el: HTMLElement;
  progress: { value: number };
}

function applyStyle(el: HTMLElement, style: Record<string, unknown>): void {
  el.style.transform = transformToCss(style.transform);
  el.style.opacity = style.opacity != null ? String(style.opacity) : "";
  el.style.zIndex = style.zIndex != null ? String(style.zIndex) : "";
  // Forwarded so 3D layouts (flip/cube) render correctly: a hinge pivot and a
  // hidden back face. Constant per slide, but rewritten with the rest of the
  // style each paint — both are cheap string assignments.
  el.style.transformOrigin = style.transformOrigin != null ? String(style.transformOrigin) : "";
  el.style.backfaceVisibility =
    style.backfaceVisibility != null ? String(style.backfaceVisibility) : "";
}

/**
 * Web imperative painter (plan §13.1-B). Reanimated's web reactivity
 * (`useAnimatedStyle`/`useAnimatedReaction` re-running on shared-value changes)
 * does not run under this repo's Vite tooling, so on web we paint slide
 * transforms ourselves, writing each registered element's transform directly.
 *
 * We subscribe to the `offset` (and `size`) shared value via `addListener`
 * rather than running our own rAF poll. Reanimated's web animation loop writes
 * the shared value on every frame of a `withTiming`/`withSpring`/`withDecay`
 * animation (its `valueSetter` step assigns `_value`, which fires listeners),
 * and gesture/programmatic writes are direct `.value` assignments — so a single
 * listener catches every visual change at the same cadence the old rAF loop
 * polled at, while doing *zero* work when the carousel is idle (no writes → no
 * callbacks → no spinning frame loop). This is the same path the core's
 * progress publishing uses, so it is exercised synchronously under jsdom.
 */
export function useWebPainter({
  offset,
  size,
  count,
  loop,
  animationStyle,
  onCenter,
}: WebPainterParams): RegisterFn {
  const entries = React.useRef(new Map<number, LiveEntry>());

  // Keep params fresh for the stable listener callbacks without resubscribing.
  const latest = React.useRef({ count, loop, animationStyle, onCenter });
  latest.current = { count, loop, animationStyle, onCenter };

  const lastCenter = React.useRef(Number.NaN);

  // Paint a single entry from an explicit offset/size (used on registration so a
  // freshly-mounted slide is positioned immediately, not one offset-write later).
  const paintEntry = React.useCallback((index: number, entry: LiveEntry, o: number, s: number) => {
    const { count: c, loop: l, animationStyle: style } = latest.current;
    const p = itemProgress(rawIndex(o, s), index, c, l);
    entry.progress.value = p;
    applyStyle(entry.el, style(p, index) as Record<string, unknown>);
  }, []);

  // Repaint every registered entry and advance the virtualization window when
  // the centered item changes. (On web `onCenter` is the only signal that moves
  // the window — `useAnimatedReaction` does not re-run here.)
  const paintAll = React.useCallback(() => {
    const s = size.value;
    if (!(s > 0)) return;
    const scroll = rawIndex(offset.value, s);
    const { count: c, loop: l, animationStyle: style, onCenter: reportCenter } = latest.current;
    entries.current.forEach((entry, index) => {
      const p = itemProgress(scroll, index, c, l);
      entry.progress.value = p;
      applyStyle(entry.el, style(p, index) as Record<string, unknown>);
    });
    const center = Math.round(scroll);
    if (center !== lastCenter.current) {
      lastCenter.current = center;
      reportCenter?.(center);
    }
  }, [offset, size]);

  const register = React.useCallback<RegisterFn>(
    (index, entry) => {
      if (entry && entry.el) {
        const live = entry as unknown as LiveEntry;
        entries.current.set(index, live);
        const s = size.value;
        if (s > 0) paintEntry(index, live, offset.value, s);
      } else {
        entries.current.delete(index);
      }
    },
    [offset, size, paintEntry],
  );

  // Repaint on every offset write (animation frame or direct gesture/program
  // write) and on size changes (initial measure / resize). `addListener`
  // delivers the current value once on subscribe, so the first mounted window is
  // painted without waiting for motion.
  useSharedValueListener(offset, paintAll);
  useSharedValueListener(size, paintAll);

  // `count`/`loop`/`animationStyle` can change without an offset write (e.g. a
  // new transition preset or data shape); repaint once when they do.
  React.useEffect(() => {
    paintAll();
  }, [count, loop, animationStyle, paintAll]);

  return register;
}
