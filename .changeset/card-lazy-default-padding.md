---
"@knitui/components": patch
---

Card: importing the module no longer reads a token. The context default resolved `$lg` at module scope, which threw when `Card` was evaluated before the Tamagui config was registered (e.g. an SSR chunk loading ahead of the config). A `Card.Section` outside any `Card` now resolves the default padding on render.
