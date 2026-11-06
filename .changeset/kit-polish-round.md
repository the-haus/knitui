---
"@knitui/components": patch
"@knitui/core": patch
"@knitui/icons": patch
---

Fix sizing, layout and styling issues across controls and fields.

- `Avatar` keeps a border inside its size, and the new `getAvatarSize()` returns the
  rendered diameter of each step, so spacers can match it.
- `UnstyledButton` removes the browser's button padding and margin, and honours padding
  and margin props.
- `Button`, `ActionIcon` and other controls keep their height under `flex: 1 1 0` in a
  column. Setting a `height` below the size step now needs a matching `minHeight`.
- `TextInput` and other `InputBase` fields apply `flex`, `alignSelf`, `width` and margin
  props to the outer field, so they size as expected in a row.
- `Input` lets caller styles beat its focused and error states. Set a `focus:` clause to
  keep a focus colour alongside your own `borderColor`.
- Icons resolve theme colour names, such as `color="blue9"`, as other components do.
- Fix an Android crash when a numeric style key left a component using the reanimated
  driver, for every frame on the kit's `animations` config.
