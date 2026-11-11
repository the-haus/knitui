---
"@knitui/media": patch
---

A playlist no longer shows "The connection was lost before the track finished." when it moves to the next track on iOS. A track's finish report could reach the controller twice (its own listener, then the iOS status bridge); the second one arrived after the next track had loaded, and read against that track's position it looked like a stream that gave out. The player then stayed in the error state while the next track played, and the queue stopped advancing. A finish report that follows a load is now ignored until the new source has reported itself loaded. Each status object is also taken once, however many feeds deliver it, so the bridge's later copy of any status can no longer overwrite newer state.

A play request the backend dropped is repeated once. On iOS a play made as a track ends can lose to AVFoundation's own pause-at-end, which left the next track of a playlist loaded but silent; when a source reports loaded, idle and not buffering while play is still wanted and was never reported as started, the controller asks again.
