import * as React from "react";

import { clamp } from "../internal/number-utils";

/**
 * Drives textarea autosize on web.
 *
 * When autosize=false, only enforces minRows as a CSS min-height.
 * When autosize=true, resizes the element on every `input` event, clamped to
 * minRows/maxRows computed from the element's own computed line-height.
 */
export function useTextareaAutosize(
  node: HTMLTextAreaElement | null,
  autosize: boolean | undefined,
  minRows: number | undefined,
  maxRows: number | undefined,
  value?: unknown,
): void {
  React.useEffect(() => {
    if (!node) return;

    const computed = window.getComputedStyle(node);
    const lineHeight = parseFloat(computed.lineHeight) || 20;
    const verticalExtra =
      (parseFloat(computed.paddingTop) || 0) +
      (parseFloat(computed.paddingBottom) || 0) +
      (parseFloat(computed.borderTopWidth) || 0) +
      (parseFloat(computed.borderBottomWidth) || 0);
    const minPx = typeof minRows === "number" ? lineHeight * minRows + verticalExtra : 0;

    if (!autosize) {
      if (minPx > 0) node.style.minHeight = `${minPx}px`;
      return;
    }

    const resizeToFit = () => {
      node.style.height = "auto";
      const scrollH = node.scrollHeight;
      const maxPx =
        typeof maxRows === "number" && lineHeight > 0
          ? lineHeight * maxRows + verticalExtra
          : Infinity;
      const clamped = clamp(scrollH, minPx, maxPx);
      node.style.overflowY = scrollH > maxPx ? "auto" : "hidden";
      node.style.height = `${clamped}px`;
    };

    resizeToFit();
    node.addEventListener("input", resizeToFit);
    return () => node.removeEventListener("input", resizeToFit);
  }, [node, autosize, minRows, maxRows, value]);
}
