---
"@knitui/components": patch
---

`ScrollArea` (web) no longer turns Space, Home, End, Page Up/Down or the arrow keys into a scroll when they come from a field or widget inside it (inputs, textareas, selects, buttons, contenteditable, ARIA widgets such as sliders and listboxes). Plain content and the focused viewport still scroll.
