---
"@knitui/sheet": patch
---

Sheet (native): a sheet that is open and at rest no longer vanishes. Reanimated writes the panel's `translateY` to the native view only when it changes; when the view lost that write (a modal sheet closing over a persistent one, the screen re-rendering after a sign-in: about one time in three on Android) the panel stayed at the off-screen value it started from while the sheet's state still said "open". The panel host now re-sends its transform after every render.
