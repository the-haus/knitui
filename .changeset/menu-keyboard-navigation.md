---
"@knitui/components": patch
---

`Menu` is now operable from the keyboard: Arrow-key roving focus, focus moved into the dropdown on open, and focus returned to the trigger on close.

`Menu` rendered `role="menu"` with `role="menuitem"` children but had no key handling at all, and `menuItemTabIndex` defaulted to `-1` — so every item was out of the tab order with nothing to put focus on them. An open menu could not be reached, navigated or activated with a keyboard, which for a `role="menu"` is worse than shipping no role: assistive technology announces a menu whose items cannot be got to. The items also carried `focusRingStyle` while being unfocusable — a dead ring, the exact invariant `src/__tests__/focus-ring.test.tsx` exists to catch, and `Menu` was missing from its case list, which is how this survived.

What changed:

- **Roving focus.** <kbd>↓</kbd>/<kbd>↑</kbd> move between enabled items (wrapping, unless `loop={false}`), <kbd>Home</kbd>/<kbd>End</kbd> jump to the ends. Disabled items are skipped. Items are enumerated from the DOM (`[role="menuitem"]`) rather than from cloned children, because a menu's children are arbitrary — items interleaved with labels, dividers and the consumer's own fragments.
- **Opening from the trigger.** <kbd>↓</kbd> opens the menu focusing the first item, <kbd>↑</kbd> the last. This is also the only way to open a _hover_ menu from the keyboard without pressing it.
- **Focus management.** `trapFocus` and `returnFocus` are now forwarded to the underlying `Popover`, which already implemented both. They default to `true` for `trigger="click"` and `false` for hover triggers: a menu opened by pointing at something never held focus, so taking it on hover-in — and pushing it onto the trigger on hover-out — would move the caret out of whatever the user was actually doing. Both are overridable per menu.

`menuItemTabIndex` keeps its `-1` default and its meaning; it is no longer the only way to reach an item, and the docs now say so. Behaviour for pointer users is unchanged.

`Menu` joins the focus-ring guardrail, along with `ColorPicker`, `Stepper` and `TreeSelect` — three more ring-bearing components the contract test never covered.
