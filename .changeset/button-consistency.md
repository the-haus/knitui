---
"@knitui/components": minor
---

Button consistency pass (from a consumer-app button audit):

- `Button` and `ActionIcon` take `href`: on web they render a real `<a href>` with `role="link"` (middle-click / ⌘-click / URL preview work); ignored on native and while disabled/loading.
- `CloseButton` is now a real, keyboard-focusable `<button>` on web (it was a `<div role="button">`, so its focus ring never fired) and sets `aria-disabled`.
- Control label at `md` is 16px (was 18px), closing the 14 → 18 gap; the `controlMetrics` docblock table is regenerated from `scales.ts`.
- `ActionIcon` / `ThemeIcon` corners from `sm` to `xl` are `$md` (8), matching `Button` (were 4 at sm/md).
- Disabled opacity is 0.6 everywhere (Tabs were 0.4, Pill 0.5, SegmentedControl items 0.45).
- `Tabs.Tab` and `SegmentedControl` segments get the shared press dip.
- A loading `Button` with no left section keeps its width: the loader overlays the (invisible, still-announced) label instead of being prepended.
- `controlIconSize` resolves size tokens (`"$sm"`) like bare keys — Pill's remove ✕ now scales with the pill instead of always drawing at 20px.
