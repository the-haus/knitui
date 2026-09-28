---
"@knitui/components": minor
---

ScrollArea + VirtualList: pull-to-refresh. New `onRefresh`, `refreshing` and `refreshColor` (theme token or concrete colour, default `$color10`) props mount a theme-tinted RN `RefreshControl` on the native single-axis scroller (and `ScrollArea.Autosize`), so consumers no longer import `RefreshControl` from `react-native` or cast it through `viewportProps`. VirtualList accepts the same three props and forwards them to its ScrollArea. Web accepts and ignores them (an inner web scroller has no pull gesture); the two-axis Pan engine has no native scroller, so it ignores them too.
