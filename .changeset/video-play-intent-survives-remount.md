---
"@knitui/media": patch
---

Stop web video silently dropping a `play()` made before its view exists

`expo-video`'s web backend applies `play()` by iterating the `HTMLVideoElement`s
currently mounted into the player, so a call made while no view is attached iterates
an empty set: no throw, no error status, no retry, nothing to observe. In a kit whose
surface is a single teleported element that is not an edge case — it is what happens
on a cold mount, where the call beats the view's own effect, and on every switch
between players in the shared session, where the surface is destroyed and a NEW
element is built for the incoming player's frame. `autoPlay` was the plainest
casualty: it ran in the constructor, before any view could exist.

The controller now tracks a standing play INTENT — set by `play()`/`replay()`,
cleared by `pause()` and by `dispose()` — and `attachView` re-applies it, which is
what makes both cases work. It is idempotent by construction: `player.play()` on an
already-playing player is a no-op on both backends, and a paused intent re-applies
nothing.

`attachView(null)` also now marks the snapshot as not playing. Detaching is the only
moment the controller learns its element has been handed to another player, and the
outgoing element takes its playback with it while never reporting a `pause` — it is
unmounted from the player first, so its events no longer count. The snapshot was left
claiming `playing: true` over a torn-down element, and every consumer that branches
on it — a play/pause toggle most of all — then did the opposite of what it should.
