---
"@knitui/components": patch
---

PinInput: Backspace in an empty field works on Android. Soft keyboards (Gboard) send neither a key event nor a text change for it, so a wrong digit could not be walked back to from the keyboard. The focused empty field now holds a zero-width space on Android; deleting it steps back and clears the previous character. Also, an `onFocus`/`onBlur` passed through `getInputProps` is now called alongside the row's own handlers instead of replacing them (replacing them broke the focused-field tracking the placeholder relies on).
