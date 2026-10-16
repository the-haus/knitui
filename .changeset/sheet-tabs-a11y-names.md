---
"@knitui/sheet": minor
"@knitui/components": patch
---

Sheet: new `aria-label` / `aria-labelledby` props name the panel, on the element that carries its role (native: `aria-label` becomes the panel's `accessibilityLabel`). A modal sheet stays a dialog (`role="dialog"`, `aria-modal="true"`). A non-modal sheet (`modal={false}`, a persistent panel such as a browse sheet over a map) is no longer a dialog: it is a `role="region"` landmark when named, and has no role when not. Before, every sheet was `role="dialog"` with no way to name it (axe `aria-dialog-name`).

**Behaviour change (web):** a `modal={false}` sheet loses `role="dialog"` and `aria-modal="false"`. If you relied on the dialog role for a non-modal sheet, set `role` through `styles.root` (it still wins).

Tabs: a `Tabs.Tab` sets `aria-controls` only while its `Tabs.Panel` is mounted (panels register with the `Tabs` root), so a tab strip without panels, or a panel unmounted by `keepMounted={false}`, no longer points at a missing id (axe `aria-valid-attr-value`). A caller's own `aria-controls` on `Tabs.Tab` now wins over the generated one.
