# @knitui/components

## 0.1.1

### Patch Changes

- 407bef6: UnstyledButton: reset the semantic `<button>`'s user-agent `text-align: center` on web so text content is left-aligned, matching native (React Native starts pressable text at the inline edge). The same tree no longer diverges across platforms. The reset is web-only and applied ahead of the caller's `style`, so anyone who wants centred content still overrides it explicitly. Internally the button-host wiring now reuses the shared `webButton()` helper (correctly a no-op on native) instead of hardcoding `render="button"`.
  - @knitui/core@0.1.1
  - @knitui/hooks@0.1.1
  - @knitui/icons@0.1.1
