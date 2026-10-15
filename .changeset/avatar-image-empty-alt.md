---
"@knitui/components": patch
---

Avatar: the photo gets `alt=""`. The frame already carries `role="img"` and the `aria-label`; without an alt some screen readers announced the image file name (WCAG 1.1.1).
