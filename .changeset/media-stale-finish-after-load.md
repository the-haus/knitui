---
"@knitui/media": patch
---

A playlist no longer shows "The connection was lost before the track finished." when it moves to the next track on iOS. A track's finish report could reach the controller twice (its own listener, then the iOS status bridge); the second one arrived after the next track had loaded, and read against that track's position it looked like a stream that gave out. The player then stayed in the error state while the next track played, and the queue stopped advancing. A finish report that follows a load is now ignored until the new source has reported something else.
