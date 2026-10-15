---
"@knitui/core": minor
"@knitui/components": patch
---

Font tokens are `rem` on the web, so browser text-only zoom and a raised default font size now scale the kit's text (WCAG 1.4.4). The `size` and `lineHeight` sections of every font — the stock `fonts` and everything `createTheme` builds, including `fontSizes` and per-font `fonts.*.size` / `lineHeight` px overrides — are emitted as `px / 16` rem on the web (`$md` → `1.125rem`, its line height → `1.625rem`); native keeps numbers. With the default 16px root every size renders the same px as before. The Textarea's per-size line height is now the matching line-height token instead of a px number, so its rows grow with the text.

**Behaviour change (web):** reading a font token's value from the config (`config.fonts.body.size.md`, `getVariableValue` on a font token) now returns a rem string instead of a number. For px math use `getFontSize` / `getLineHeight`, which stay numeric on every platform. Raw numeric `fontSize` / `lineHeight` props are untouched and stay px. No new public API; nothing to migrate for apps that only use `$` tokens.
