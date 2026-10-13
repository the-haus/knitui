---
"@knitui/components": patch
---

Transition (native): a `keepMounted` child no longer crashes with "Rendered more hooks than during the previous render" when `mounted` turns true. The hidden frame was returned without the Tamagui `transition` prop and got it a render later, which changes an animated view's hook order. Every element the native Transition returns now carries the `transition` key (`null` when there is nothing to animate, e.g. under reduced motion).
