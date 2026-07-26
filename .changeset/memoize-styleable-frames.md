---
"@knitui/core": minor
---

Memoize `.styleable()` output so a parent render stops re-rendering the whole kit

Tamagui memoizes the component `styled()` returns unconditionally
(`createComponent.tsx`: `res = React.memo(res)`). It does **not** memoize the
component `.styleable()` returns — that is gated behind a flag:

```js
// @tamagui/web/src/createComponent.tsx:1906
if (extendedConfig.memo || process.env.TAMAGUI_MEMOIZE_STYLEABLE) {
  out = React.memo(out);
}
```

Every public component in this kit is `styled(...).styleable(...)`, and the
`.styleable()` HOC **is** the exported component — 155 sites across
`@knitui/components` (139) and `@knitui/dates` (16). The kit passed neither
`memo` nor the env var, so the kit's own layer was the only unmemoized layer in
the stack: any parent state change re-rendered every kit component in the
subtree even when not one of its props had changed.

Measured in jsdom on a 300-instance tree (100 rows × `Button` + `Badge` +
`Text`), one parent `setState` with **identical** child props, median of 21 runs:

|        | median update |
| ------ | ------------- |
| before | 86.9 ms       |
| after  | 3.8 ms        |

≈23× on that shape. With props that genuinely change every render (an inline
`onPress` per row) the win narrows to the low tens of percent — memo then pays
for a comparison it cannot skip on. It is not meaningfully negative in either
case, because the inner frame is _already_ memoized, so prop-equality skipping is
already how this stack behaves.

**`@knitui/core` now exports its own `styled`** (`src/styled.ts`), which is
Tamagui's factory plus `staticConfig.memo = true` on the frame it returns.
`styleable()` reads the flag off `extendStyledConfig()`, which spreads the
frame's own `staticConfig` first and the per-call `options.staticConfig` second —
so setting it on the frame reaches every `.styleable()` call from one place,
including components added later, and a call site can still opt out explicitly
with `.styleable(render, { staticConfig: { memo: false } })` because its spread
wins. `styled()` does not forward a `memo` key into `staticConfig` (verified), so
this is a post-hoc assignment rather than an option passed through, and
`src/essentials.ts` no longer re-exports the raw Tamagui `styled` — there is one
`styled` on the `@knitui/core` surface.

`memo` is read in exactly **one** place in all of `@tamagui/web` — the branch
quoted above — so setting it has precisely that one effect and no other
behavioural change. The env var in the same condition is not a shipping option:
it is read at module scope in the consumer's bundle, and neither Metro nor
webpack reliably defines it.

Verified: the full suite is green (27/27 packages; `@knitui/components` 120
suites / 1606 tests, `@knitui/dates` 49 / 853), the Next production build
succeeds, and the extracted CSS is **byte-identical** to before (69,935 B) — so
the Tamagui compiler treats the wrapped factory exactly as it did the raw one.
