import type { ScrollAreaProps } from "@knitui/components";

/**
 * Props for `Sheet.ScrollView`. Mirrors the kit's `ScrollArea` API so the web
 * build (`ScrollView.tsx`) is a thin, fully-featured wrapper. The native build
 * (`ScrollView.native.tsx`) honours the common subset (`children` / `style` /
 * `keyboardShouldPersistTaps`) and drives a coordinated scroller for the
 * scroll↔drag handoff; `ScrollArea`-only props (custom overlay scrollbars, etc.)
 * are accepted for API parity but not rendered there.
 */
export type SheetScrollViewProps = ScrollAreaProps;
