---
"@knitui/map": patch
---

`SvgImage` no longer gives up on a raster whose surface has not painted yet. Exhausting the eager capture window ended the job without ever calling `onCapture`, and nothing re-requests a raster — so the store slot stayed unresolved forever, no MapLibre image was registered, and every `SymbolLayer` drawing that icon silently drew nothing for the rest of the session, with no log and no retry.

The eager window assumed the surface was racing its first draw and would win within ~80 frames. A surface that is not being drawn at all breaks that assumption rather than losing the race: a map mounted offscreen to warm its GL context, a screen frozen by `freezeOnBlur`, an Android view pruned before it painted. All of those resolve later, at which point the next attempt would have succeeded — so ending the job turned a transient condition into a permanent one.

The window is now only a change of pace. Past it a job hands its concurrency slot back and keeps polling at ~1s until it succeeds or its surface unmounts; returning the slot matters, because surfaces that are not painting would otherwise hold every slot forever and starve one that would succeed immediately. A dev-only `console.warn` (`typeof`-guarded, so a bundler that does not define `__DEV__` cannot turn a slow icon into a crash) now names the likely cause on the transition to the patient cadence.
