/**
 * Web measurement layer for the floating engine.
 *
 * Everything is measured in **viewport coordinates** (`getBoundingClientRect`),
 * which is exactly the space `position: fixed` uses — so for the (default) fixed
 * strategy the floating element lands correctly no matter where in the DOM it is
 * teleported. For `absolute`, we subtract the offset parent's rect so the result
 * is still correct. `autoUpdate` keeps it in sync on scroll/resize/element-resize.
 */
import type { TamaguiElement } from "@knitui/core";

import type { Coords, Dimensions, Rect, Strategy } from "./core";

/** What {@link measure} resolves to (shared shape with the native platform). */
export type MeasureResult = {
  reference: Rect | null;
  floating: Dimensions | null;
  /** Window-space origin of the floating element's positioning context. */
  containerOrigin: Coords;
};

const asHTMLElement = (node: TamaguiElement | null): HTMLElement | null =>
  node && typeof (node as HTMLElement).getBoundingClientRect === "function"
    ? (node as HTMLElement)
    : null;

/** The viewport rect in window coordinates. */
export function getViewport(): Rect {
  if (typeof window === "undefined") return { x: 0, y: 0, width: 0, height: 0 };
  return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
}

function getContainerOrigin(floating: HTMLElement, strategy: Strategy): Coords {
  // For `fixed`, top/left are viewport-relative — origin is (0, 0).
  if (strategy === "fixed") return { x: 0, y: 0 };
  // For `absolute`, top/left are relative to the offset parent's padding box.
  const offsetParent = floating.offsetParent as HTMLElement | null;
  if (offsetParent && typeof offsetParent.getBoundingClientRect === "function") {
    const r = offsetParent.getBoundingClientRect();
    return { x: r.left + offsetParent.clientLeft, y: r.top + offsetParent.clientTop };
  }
  return { x: 0, y: 0 };
}

/**
 * Measure the reference and floating elements (viewport coords) plus the
 * floating element's container origin. Resolves synchronously (wrapped in a
 * Promise so the hook can treat web and native uniformly).
 */
export function measure(
  referenceNode: TamaguiElement | null,
  floatingNode: TamaguiElement | null,
  strategy: Strategy,
  // Web reads the floating size synchronously from the DOM, so the `onLayout`
  // size hint the native platform uses is accepted for signature parity only.
  _floatingSize?: Dimensions | null,
): Promise<MeasureResult> {
  const reference = asHTMLElement(referenceNode);
  const floating = asHTMLElement(floatingNode);

  if (!reference || !floating) {
    return Promise.resolve({ reference: null, floating: null, containerOrigin: { x: 0, y: 0 } });
  }

  const r = reference.getBoundingClientRect();
  const f = floating.getBoundingClientRect();

  return Promise.resolve({
    reference: { x: r.left, y: r.top, width: r.width, height: r.height },
    floating: { width: f.width, height: f.height },
    containerOrigin: getContainerOrigin(floating, strategy),
  });
}

/**
 * Reposition `onUpdate` whenever the layout could have changed: scroll (captured
 * so nested scroll containers count), window resize, and element resize. Calls
 * `onUpdate` once immediately so the first position is computed synchronously.
 */
export function autoUpdate(
  referenceNode: TamaguiElement | null,
  floatingNode: TamaguiElement | null,
  onUpdate: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = () => onUpdate();
  window.addEventListener("scroll", handler, { capture: true, passive: true });
  window.addEventListener("resize", handler, { passive: true });

  let observer: ResizeObserver | undefined;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(handler);
    const reference = asHTMLElement(referenceNode);
    const floating = asHTMLElement(floatingNode);
    if (reference) observer.observe(reference);
    if (floating) observer.observe(floating);
  }

  onUpdate();

  return () => {
    window.removeEventListener("scroll", handler, { capture: true });
    window.removeEventListener("resize", handler);
    observer?.disconnect();
  };
}
