import { useCallback, useEffect, useRef, useState } from "react";

import type { TamaguiElement } from "@knitui/core";

import type {
  ElementSize,
  ElementSizeRootProps,
  UseElementSizeReturn,
} from "./use-element-size.shared";

const EMPTY_ROOT_PROPS: ElementSizeRootProps = {};

/**
 * Measure an element's content box, kept in sync via `ResizeObserver` (web).
 * Returns a `ref` to attach, the measured `width`/`height`, and an empty
 * `rootProps` (web drives measurement through the ref). The
 * `use-element-size.native` sibling measures via `onLayout` instead. Mirrors the
 * `ref` + `rootProps` shape of `use-move`.
 *
 * The returned `ref` is a CALLBACK ref, not an object ref — load-bearing. A
 * one-shot `useEffect(() => …, [])` observer would capture `ref.current` at mount
 * and never re-run, so it misses any element that mounts LATER (the measured node
 * isn't in the DOM on first render). That is exactly a `keepMounted={false}`
 * `Collapse` subtree (e.g. every collapsed `Tree` branch): its content mounts only
 * on expand, so the observer never attached, the measured size stayed `0`, and the
 * panel stayed clipped to `height: 0` — open in state, invisible on screen. A
 * callback ref runs every time React attaches/detaches the node, so the observer
 * follows the element across mounts.
 */
export function useElementSize(): UseElementSizeReturn {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: TamaguiElement | null) => {
    // Detach from the previous node (or a stale observer) before re-attaching.
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node || typeof ResizeObserver === "undefined" || !("getBoundingClientRect" in node)) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    observer.observe(node as unknown as Element);
    observerRef.current = observer;
  }, []);

  // Disconnect on unmount so a teardown without a preceding `ref(null)` (e.g. the
  // whole tree unmounting) can't leak the observer.
  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, rootProps: EMPTY_ROOT_PROPS, width: size.width, height: size.height };
}
