---
"@knitui/hooks": minor
---

`useFocusTrap` takes an options object. With `containerOnPointer: true`, a trap activated right after a pointer or touch input focuses its container instead of its first control, so the browser draws no focus ring on a control the user never reached by keyboard. Tab still lands on that first control, and `[data-autofocus]` still wins.
