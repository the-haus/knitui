---
"@knitui/hooks": patch
---

Stop `useListState` corrupting the list on an out-of-range index.

`reorder` destructured the spliced-out item, so a `from` beyond the end inserted a literal `undefined` into the list. `swap` wrote `undefined` over a real row when either index was out of range, and `setItemProp` spread a missing row into a bare `{ [prop]: value }` object masquerading as a `T`. All three now leave the list untouched when an index does not resolve.
