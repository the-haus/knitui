---
"@knitui/core": minor
"@knitui/components": minor
---

Retune the line-height ladder so leading tracks font size consistently

`lineHeightRatios` climbed with font size (1.35 → 1.65), so the largest text got
the loosest leading and the smallest got the tightest — the opposite of what
typography needs. `$xxl` headings rendered a 46px line box at 28px, reading as
double-spaced, while several steps landed on odd pixel values (23px, 31px).

The ladder is now a hump — 1.35 at the caption end, peaking at 1.5 for body,
tapering to 1.3 for display — which matches the shape Mantine (body `lineHeights`
plus `headings.sizes`) and Tailwind both use. Derived line heights per font step:

| token | font | before | after |
| ----- | ---- | ------ | ----- |
| xxs   | 12   | 16     | 16    |
| xs    | 14   | 20     | 20    |
| sm    | 16   | 23     | 24    |
| md    | 18   | 27     | 26    |
| lg    | 20   | 31     | 28    |
| xl    | 24   | 38     | 32    |
| xxl   | 28   | 46     | 36    |

Every value is now even, so a `(height − lineHeight) / 2` centering gap stays on
whole pixels, and each one matches the leading Tailwind or Mantine gives that same
font size.

Also fixed: `getLineHeight()` multiplied a raw numeric size by the `md` ratio
regardless of the number, so `fontSize={28}` and `fontSize="$xxl"` (also 28)
produced different line heights. A number now takes the ratio of the nearest step
on the font scale, so both resolve to 36. `TableOfContents` hardcoded its own
`value * 1.4` for numeric sizes and now goes through the same ladder.

This shifts rendered text metrics across the kit — anything measuring or pinning
line boxes (notably `Textarea` row heights, which derive from `rows × lineHeight`)
will lay out slightly differently. Consumers on `^0.5.x` opt in explicitly rather
than picking it up as a patch.
