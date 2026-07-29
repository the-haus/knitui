---
"@knitui/media": minor
---

`useAudioPlaylistController` exposes the single-track player underneath the queue

The hook now returns a third field, `player`: the `AudioController` slot the playlist
drives, stable for the hook's lifetime.

It exists for the surfaces that belong to the PLAYER rather than the queue, which the
playlist contract cannot express. The motivating one is spectrum sampling —
`useAudioSpectrum` needs `setSamplingEnabled` and `sampleUpdate`, which live on the
single-track controller only, because a playlist has no notion of PCM. Before this
there was no supported way to reach the sampler from a playlist at all: the facade is
private on the controller and its slot id is an internal `useId` no caller could pass
to `getFacade`, so a visualizer over a queue was simply not buildable.

```tsx
const { controller, store, player } = useAudioPlaylistController({ sources });
useAudioSpectrum(player, { onFrame: (bands) => viz.current?.push(bands) });
```

Playback still goes through `controller`: transport calls on `player` move the slot
without telling the queue, and the two snapshots then disagree.
