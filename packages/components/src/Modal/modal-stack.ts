import * as React from "react";

/**
 * Module-level stack of the open modal layers (`Modal`, `Drawer`, and a modal
 * `Sheet` through {@link useEscapeLayer}), in open order. One shared `document` keydown listener routes Escape to the TOP entry
 * only, so a stack of modals unwinds one layer per press instead of every open
 * layer closing at once (each layer used to own its own document listener).
 *
 * Every open layer registers, including those with `closeOnEscape={false}`: such
 * a layer still occupies the top, so Escape is swallowed rather than falling
 * through to the layer beneath it.
 *
 * Inert on native (no `document`); the stack still tracks but nothing listens.
 */

export interface ModalStackEntry {
  /**
   * Open-order key from {@link nextModalOrder}, taken on the render that opens
   * the layer. Render order is parent-first, whereas effects run child-first, so
   * registering in effect order would put an outer modal mounted open alongside
   * an inner one ON TOP of it. The stack is kept sorted by this key instead.
   */
  order: number;
  /** Read at keydown time so the latest prop wins without re-registering. */
  closeOnEscape: () => boolean;
  onClose: () => void;
}

const stack: ModalStackEntry[] = [];
let counter = 0;

/** A fresh, increasing open-order key (see {@link ModalStackEntry.order}). */
export function nextModalOrder(): number {
  counter += 1;
  return counter;
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  const top = stack[stack.length - 1];
  if (!top || !top.closeOnEscape()) return;
  // Mark the event handled so any other Escape consumer (and a layer that
  // becomes the top later in this same dispatch) leaves it alone.
  event.preventDefault();
  top.onClose();
}

/** Push `entry` onto the stack; returns the matching unregister. */
export function registerModalLayer(entry: ModalStackEntry): () => void {
  let index = stack.length;
  while (index > 0 && stack[index - 1].order > entry.order) index -= 1;
  stack.splice(index, 0, entry);
  if (stack.length === 1 && typeof document !== "undefined") {
    document.addEventListener("keydown", onKeyDown);
  }
  return () => {
    const index = stack.lastIndexOf(entry);
    if (index !== -1) stack.splice(index, 1);
    if (stack.length === 0 && typeof document !== "undefined") {
      document.removeEventListener("keydown", onKeyDown);
    }
  };
}

/** Whether any modal layer is open (so a non-modal surface leaves Escape to it). */
export function hasOpenEscapeLayer(): boolean {
  return stack.length > 0;
}

export interface EscapeLayerOptions {
  /** Close on Escape while this layer is the top one. @default true */
  closeOnEscape?: boolean;
  /** Called when Escape reaches this layer. */
  onClose: () => void;
}

/**
 * Put a modal layer on the shared Escape stack while `opened`: Escape then
 * closes only the topmost open layer, whichever component it belongs to. The
 * open order is taken on the render that opens the layer (see
 * {@link ModalStackEntry.order}); the latest options are read at keydown time.
 * Web only in effect; on native there is no keydown stream.
 */
export function useEscapeLayer(opened: boolean, options: EscapeLayerOptions): void {
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const wasOpenedRef = React.useRef(false);
  const orderRef = React.useRef(0);
  if (opened && !wasOpenedRef.current) orderRef.current = nextModalOrder();
  wasOpenedRef.current = opened;

  React.useEffect(() => {
    if (!opened) return undefined;
    return registerModalLayer({
      order: orderRef.current,
      closeOnEscape: () => optionsRef.current.closeOnEscape ?? true,
      onClose: () => optionsRef.current.onClose(),
    });
  }, [opened]);
}
