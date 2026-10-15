---
"@knitui/components": patch
---

SimpleGrid: the gutter no longer overflows the parent. The grid used a negative-margin track, so inside a fixed-width scrolling column it reached half a gap past each edge and scrolled sideways. Rows now use `rowGap`; in `cols` mode the column gap is split across each cell's inline padding by column index (equal column widths, outer columns flush); `minColWidth` mode uses `columnGap`. The API and the visual spacing are unchanged.
