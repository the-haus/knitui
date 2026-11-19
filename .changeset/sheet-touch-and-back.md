---
"@knitui/sheet": minor
---

- New `closeOnBrowserBack` (web, off by default): the browser's Back closes the open sheet, as Android's hardware back does. While open, the sheet owns one history entry and leaves the URL alone. It removes that entry when it closes any other way, and copies the router's own history state into it.
- On touch web, a drag down in a `Sheet.ScrollView` or `Sheet.FlatList` whose list is at its top now moves the sheet. So does any vertical drag while the sheet isn't at its most-open snap. Before, the browser scrolled the list and the sheet never moved.
- A double tap on a sheet's opener leaves the sheet open: a scrim tap in the first 400 ms after opening is ignored.
- Opening a sheet by tap or click focuses the panel rather than ✕, so no focus ring shows on ✕. Opened from the keyboard, ✕ still takes focus.
