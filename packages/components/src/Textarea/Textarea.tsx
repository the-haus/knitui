import * as React from "react";

import { isWeb } from "@knitui/core";
import { useMergedRef } from "@knitui/hooks";

import { InputBase, type InputBaseProps } from "../InputBase";

/** Mirrors the CSS `resize` keyword (web only). */
export type TextareaResize = "none" | "both" | "horizontal" | "vertical";

type TextareaBaseProps = Omit<
  InputBaseProps,
  "autosize" | "minRows" | "maxRows" | "multiline" | "resize"
>;

export interface TextareaProps extends TextareaBaseProps {
  /** Textarea always renders a multiline host; this prop is intentionally owned. */
  multiline?: never;

  /** If set, the textarea height grows with its content (web). @default false */
  autosize?: boolean;

  /**
   * Minimum number of rows — the textarea's initial height. Maps to the `rows`
   * attribute + min-height on web and the multiline min-height on native.
   * @default 2
   */
  minRows?: number;

  /** Maximum number of rows the autosize textarea grows to before scrolling (web). */
  maxRows?: number;

  /** Controls the CSS `resize` property (web only). @default "none" */
  resize?: TextareaResize;
}

export type TextareaRef = React.ComponentRef<typeof InputBase>;

/**
 * Reads the host element off a forwarded ref as an `HTMLTextAreaElement`, or
 * `null` on native / before mount. `instanceof` is guarded so it never throws in
 * a React Native runtime where `HTMLTextAreaElement` is undefined.
 */
const asTextarea = (node: TextareaRef | null): HTMLTextAreaElement | null =>
  typeof HTMLTextAreaElement !== "undefined" && node instanceof HTMLTextAreaElement ? node : null;

/**
 * Textarea — a multiline text field. Mirrors Mantine's `Textarea`: `InputBase`
 * with `multiline` forced on, plus optional `autosize` between `minRows` and
 * `maxRows` and a `resize` control.
 *
 * Cross-platform: the underlying `Input` host renders a `<textarea>` on web and a
 * multiline React Native `TextInput` on native. The field opens at `minRows` lines
 * (default 2) on both platforms, with the row height derived from the shared
 * sizing system so a textarea row matches a single-line `Input` of the same size.
 * `autosize` grows the field from `minRows` up to `maxRows` on both platforms; the
 * CSS `resize` handle is web-only (a no-op on native).
 */
export const Textarea = InputBase.styleable<TextareaProps>(function Textarea(props, ref) {
  const {
    autosize = false,
    // A Textarea always opens at two text lines unless the consumer narrows it.
    minRows = 2,
    maxRows,
    resize = "none",
    value,
    multiline,
    ...others
  } = props;

  void multiline;

  // Track the DOM node via state so effects re-run once the node is available.
  const [node, setNode] = React.useState<TextareaRef | null>(null);

  // Callback ref: called with the DOM node when mounted and null when unmounted.
  const callbackRef = React.useCallback((el: TextareaRef | null) => {
    setNode(el);
  }, []);

  const mergedRef = useMergedRef(ref, callbackRef);

  // Apply the CSS resize property on web (no-op on native). The DOM node is
  // tracked solely for this — autosize itself is owned by the underlying `Input`
  // host on BOTH platforms (web: scrollHeight via useTextareaAutosize; native:
  // onContentSizeChange clamped between minRows/maxRows), which is why the
  // autosize/minRows/maxRows props are forwarded down rather than handled here.
  React.useEffect(() => {
    if (!isWeb) return;
    const ta = asTextarea(node);
    if (ta) {
      ta.style.resize = resize;
    }
  }, [node, resize]);

  return (
    <InputBase
      ref={mergedRef}
      rows={minRows}
      autosize={autosize}
      minRows={minRows}
      maxRows={maxRows}
      value={value}
      {...others}
      multiline
    />
  );
});
