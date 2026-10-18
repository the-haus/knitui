---
"@knitui/components": patch
---

`variant="gradient"` without a `gradient` prop now paints the theme gradient (`color5` to `color9` at 45°), as documented, instead of nothing. This covers `ActionIcon`, `Alert`, `Avatar`, `Badge`, `Button`, `CloseButton`, `Pill` and `ThemeIcon`. A `gradient` prop still overrides it.
