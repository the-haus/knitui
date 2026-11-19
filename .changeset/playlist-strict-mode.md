---
"@knitui/media": patch
---

A playlist no longer goes deaf in React StrictMode. `useAudioPlaylistController` keeps its controller across an effect that React cleans up and runs again (StrictMode in development, a tree hidden and shown again), and the cleanup disposed it for good: the tracks played, while `playing` stayed false, the clock stayed at 0:00 and the queue did not advance. The controller now reconnects when the effect runs again.
