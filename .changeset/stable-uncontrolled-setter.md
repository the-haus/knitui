---
"@knitui/hooks": patch
---

Give `useUncontrolled` a referentially stable setter

`handleUncontrolledChange` was a plain function declaration, so the setter had a
new identity on every render — and the controlled branch handed back the caller's
raw `onChange`, which callers almost always pass as an inline arrow. Either way,
every consumer got a fresh setter every render.

Around 48 files across `components`, `dates` and `sheet` call this hook and pass
that setter straight into a child, a context value, or a `useMemo`/`useEffect`
dependency list, so the churn cascaded. The clearest case was `Combobox`: a new
`setOpen` made `use-combobox`'s `useMemo` store a new object, which made the
`ComboboxContext` value a new object — and because context propagation walks
_past_ `React.memo`, the deliberately memoized option row re-rendered anyway.
Typing one character re-resolved every option frame in an open dropdown, with the
cost scaling in the option count. `NumberInput`'s handler-assignment effect
re-ran on every render for the same reason.

Both branches now return one stable setter, with the latest `onChange` read
through a ref (`useCallbackRef`) rather than closed over. That second half fixes
a class of stale-closure bug as well: a consumer that memoized a handler with
`[]` deps around the setter previously kept calling the `onChange` from its first
render — `ColorPicker`'s `handleChange` did exactly that — and now always invokes
the current one.

Behaviour is otherwise unchanged: the controlled branch still never tracks its
own state, `defaultValue` still wins over `finalValue`, and a missing `onChange`
is still a no-op. Added a test suite covering the value semantics, the setter's
identity across re-renders and state changes in both branches, and the
always-latest-`onChange` guarantee.
