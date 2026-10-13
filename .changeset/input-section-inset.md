---
"@knitui/components": patch
---

Input / NativeSelect: the text no longer sits too far from a `leftSection`/`rightSection`. A section is a control-height square that already holds the gap around its icon, but the host still added its own horizontal padding on that side (26px icon→text vs 10px border→icon at `md`). The host padding is now dropped on any side carrying a section, loader, clear button or chevron — on web and native. A padding prop passed to the input still wins.
