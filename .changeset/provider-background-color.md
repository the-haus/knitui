---
"@knitui/core": minor
---

`Provider` accepts `backgroundColor` for the full-screen layer it paints behind every route. It still defaults to the theme's `$background`; hosts that paint their own page background (a web page with CSS gradients or custom properties) can now pass `"transparent"` so that background is not covered.
