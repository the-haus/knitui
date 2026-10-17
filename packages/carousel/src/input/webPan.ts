import * as React from "react";

/**
 * A pan recogniser on DOM pointer events — the web stand-in for
 * `react-native-gesture-handler`'s `Gesture.Pan()`, imported only by `.web`
 * files so no web bundle reaches the gesture library.
 *
 * Lifecycle, mirroring RNGH's pan: `onBegin` on pointer down; the pan
 * ACTIVATES once the pointer travels {@link PAN_SLOP} px along an allowed
 * axis (a mostly-vertical move on a horizontal pan is left to the page: it
 * never activates, and the browser's own scroll — `touch-action` — takes it);
 * `onUpdate(translationX, translationY)` while active; `onEnd(velocityX,
 * velocityY, activated)` on release or cancel, velocities in px/s like RNGH's.
 * Unlike RNGH, `onEnd` also fires for a press that never activated
 * (`activated: false`), so a caller that stopped motion in `onBegin` can put it
 * back to rest.
 *
 * While attached it owns the element's `touch-action` (the browser keeps the
 * other axis — or nothing, for a free pan) and turns off text selection, as
 * RNGH's web detector did.
 *
 * A click that ends an activated drag is swallowed, so a slide or card's own
 * pressable content doesn't also fire at the end of a swipe.
 */

/** Distance (px) the pointer must travel before the pan takes over. */
export const PAN_SLOP = 6;
/** How far back (ms) the release velocity is measured over. */
const VELOCITY_WINDOW_MS = 100;

export interface WebPanHandlers {
  enabled: boolean;
  /** The axis that must lead for the pan to activate (`both`: any direction). */
  axis: "x" | "y" | "both";
  onBegin?: () => void;
  onUpdate: (translationX: number, translationY: number) => void;
  onEnd: (velocityX: number, velocityY: number, activated: boolean) => void;
}

/** What a web gesture hook returns: hand it to `DragDetector` (`input/DragDetector`). */
export interface WebPan {
  /** Callback ref for the element that receives the pointer. */
  attach: (el: unknown) => void;
}

interface Sample {
  x: number;
  y: number;
  t: number;
}

export function useWebPan(handlers: WebPanHandlers): WebPan {
  const latest = React.useRef(handlers);
  latest.current = handlers;
  const [el, setEl] = React.useState<HTMLElement | null>(null);
  const attach = React.useCallback((node: unknown) => {
    setEl((node as HTMLElement | null) ?? null);
  }, []);
  const { enabled } = handlers;

  React.useEffect(() => {
    if (!el || !enabled || typeof window === "undefined") return undefined;
    const { axis } = latest.current;
    const style = el.style as CSSStyleDeclaration & { webkitUserSelect?: string };
    const before = {
      touchAction: style.touchAction,
      userSelect: style.userSelect,
      webkitUserSelect: style.webkitUserSelect,
    };
    style.touchAction = axis === "both" ? "none" : axis === "x" ? "pan-y" : "pan-x";
    style.userSelect = "none";
    style.webkitUserSelect = "none";
    let pointerId: number | null = null;
    let start: Sample = { x: 0, y: 0, t: 0 };
    let samples: Sample[] = [];
    let activated = false;

    const swallowClick = () => {
      const stop = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
      };
      el.addEventListener("click", stop, { capture: true, once: true });
      // A drag that ends outside the element gets no click: don't eat a later one.
      setTimeout(() => el.removeEventListener("click", stop, { capture: true }), 0);
    };

    const end = (e: PointerEvent, cancelled: boolean) => {
      if (e.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      pointerId = null;
      let vx = 0;
      let vy = 0;
      if (activated && !cancelled && samples.length > 1) {
        const last = samples[samples.length - 1]!;
        const first = samples.find((s) => last.t - s.t <= VELOCITY_WINDOW_MS) ?? samples[0]!;
        const dt = (last.t - first.t) / 1000;
        if (dt > 0) {
          vx = (last.x - first.x) / dt;
          vy = (last.y - first.y) / dt;
        }
      }
      if (activated) swallowClick();
      const wasActive = activated;
      activated = false;
      samples = [];
      latest.current.onEnd(vx, vy, wasActive);
    };
    const onUp = (e: PointerEvent) => end(e, false);
    const onCancel = (e: PointerEvent) => end(e, true);

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!activated) {
        if (Math.hypot(dx, dy) < PAN_SLOP) return;
        const { axis } = latest.current;
        const leads =
          axis === "both" ||
          (axis === "x" ? Math.abs(dx) >= Math.abs(dy) : Math.abs(dy) >= Math.abs(dx));
        if (!leads) {
          // The other axis leads: the page scrolls, this pan never starts.
          end(e, true);
          return;
        }
        activated = true;
        try {
          el.setPointerCapture?.(e.pointerId);
        } catch {
          // The pointer may already be gone (a synthetic event): tracking via window still works.
        }
      }
      // No text selection / native drag-and-drop while panning with a mouse.
      if (e.pointerType === "mouse") e.preventDefault();
      samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
      const cutoff = e.timeStamp - VELOCITY_WINDOW_MS * 2;
      while (samples.length > 2 && samples[0]!.t < cutoff) samples.shift();
      latest.current.onUpdate(dx, dy);
    };

    const onDown = (e: PointerEvent) => {
      if (pointerId !== null) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointerId = e.pointerId;
      start = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      samples = [start];
      activated = false;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      latest.current.onBegin?.();
    };

    el.addEventListener("pointerdown", onDown);
    return () => {
      style.touchAction = before.touchAction;
      style.userSelect = before.userSelect;
      style.webkitUserSelect = before.webkitUserSelect ?? "";
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [el, enabled, handlers.axis]);

  return React.useMemo(() => ({ attach }), [attach]);
}
