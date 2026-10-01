---
"@knitui/components": patch
---

Input (web): `placeholderTextColor` no longer leaks onto the DOM `<input>` as an unknown attribute (React "does not recognize the `placeholderTextColor` prop" warning). It now sets the placeholder color through `--t_placeholderColor`, matching native.
