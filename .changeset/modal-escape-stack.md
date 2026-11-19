---
"@knitui/components": minor
"@knitui/sheet": patch
---

Escape now closes only the topmost overlay, and focus returns to that layer's own opener. This covers a stack of `Modal`s and `Drawer`s, and a modal `Sheet` stacked with either of them; previously every open layer closed on one press. A top layer with `closeOnEscape={false}` swallows Escape instead of letting it close the layer beneath. New exports: `useEscapeLayer` puts a custom modal layer on the same stack, and `hasOpenEscapeLayer` reports whether one is open.
