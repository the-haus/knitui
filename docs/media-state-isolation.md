# Media state isolation (per-field channels)

Status: **implemented**. This documents how `@knitui/media` state management works after
the per-field-channel change, what problem it solves, and how to consume it.

## The problem it solves

Every `@knitui/media` controller (player, recorder, playlist, video) keeps ONE immutable
state snapshot behind a typed emitter (`StatefulEmitter`). `setState(patch)` merges
copy-on-write and fires a single coarse `"change"` event. Before this change, a player's
chrome stayed cheap **only at the React render level**: `useMediaSelector` re-ran _every_
mounted leaf's selector on _every_ change and bailed the re-render when the selected slice
was `isEqual` to the previous value.

That meant a 60 Hz `currentTime` tick still:

1. minted a new whole-snapshot object,
2. fired `"change"`,
3. woke the session's single coarse subscriber list,
4. re-ran the selector of **every** chrome leaf (play/pause, mute, fullscreen, scrubber…),
5. and only then bailed all but the scrubber/timecode in `isEqual`.

The waveform/spectrum path (`sampleUpdate`) already showed the right discipline — it's a
granular event kept _off_ the snapshot, gated on `hasListeners`, driving a ref + rAF loop
with **zero** React work per frame. The goal of this change was to give _state_ the same
discipline: a change to one field should reach only the components that read that field,
**at the store level**, not merely the render level.

## The design: per-field channels + auto-tracking selectors

Purely **additive** to the existing architecture. The single immutable snapshot, its `===`
identity, `mergeState`'s same-ref-when-unchanged bail, the coarse `"change"` event, and the
centralized `deriveEvents` granular-event fan-out are all preserved (the shared-engine
session, `useMediaState`, and ~270 existing tests are untouched). One shared real
`<audio>` / `<video>` per medium, source-switched via `MediaSession`, is unchanged.

### 1. `StatefulEmitter` — per-field listener registry

`core/stateful-emitter.ts` gains a `fieldListeners: Map<keyof State, Set<() => void>>` and a
public `subscribeKeys(keys, listener)`. `setState` fans a real transition out on **three**
channels from one place:

```
setState(patch)
  → emit("change", next)        // coarse, back-compat (session, useMediaState)
  → notifyFields(prev,next,patch) // per-field channels — the isolation
  → deriveEvents(prev, next)     // granular typed events (.on consumers)
```

`notifyFields` notifies only the listeners of fields whose value actually moved (only
patched keys can differ), **deduped** across changed keys so a `{volume, muted}` listener
fires once even when one `setState` moves both. A throwing field listener never blocks the
rest. Nothing is field-subscribed → `notifyFields` is a no-op.

### 2. `useMediaSelector` — auto-tracking

`core/react/useMediaSelector.ts`: when the store exposes `subscribeKeys`, the selector is
run once through a tracking `Proxy` (`runTracked`) that records exactly which top-level
fields it reads, and the hook subscribes to **only those** field channels. So
`useAudioState(s => s.volume)` binds to the `volume` channel alone — a `currentTime` tick
never even runs its selector. The public API is unchanged, so the chrome did not change.

- Re-tracks and re-registers whenever the read set shifts — both store-driven (in
  `onChange`, before notifying React) and render-driven (a post-commit effect reconciles the
  registration when a prop-driven / conditional selector starts reading different fields), so
  it never stays bound to a stale field channel and miss updates.
- Falls back to the coarse `subscribe` when the store has no `subscribeKeys`, or when a
  selector reads nothing trackable (`s => s`) — correctness is never traded for the
  optimization.
- `subscribeKeys` is `.bind(store)`-ed so a class-based store works as well as the
  object-literal stores we ship.

### 3. `MediaSession` — field-scoping through the shared engine

`session/media-session.shared.ts` adds two channels alongside the unchanged coarse
`subscribe`/`emit` (which still fire on every controller tick for `useMediaState` /
`<MediaProvider>`):

- `subscribeStructural(listener)` — fires **only** on activation flips and descriptor edits
  (`activate` / `update` / `unregister`), never on a per-frame tick.
- `subscribeControllerKeys(keys, listener)` — forwards to the one shared controller's
  `subscribeKeys` (the live field wakes).

### 4. The per-player store (`createMediaControllerHook`)

The per-player store's `subscribeKeys` = `subscribeControllerKeys(keys, …)` **guarded by
`isActive(id)`** + `subscribeStructural`. So:

- The **active** player's scrubber is woken by `currentTime` field wakes; its mute button by
  `volume`/`muted`; nothing cross-wakes.
- An **inactive** player ignores the shared controller's ticks (driven by whoever owns the
  engine) via the `isActive` guard, and re-reads only on a **structural** wake — i.e. when
  it (re)activates and its snapshot swaps from the idle cache to the live controller state.

### 5. Playlist convergence

The playlist was the outlier — it extended `StatefulEmitter` directly, duplicated playback
fields, **hand-emitted** events, and declared events it never fired. It now has a
`deriveEvents` override (`statusChange` / `playingChange` / `trackChange`-from-`currentIndex`
/ `volumeChange` / `durationChange` / `playToEnd` / `error` / gated `timeUpdate`), and the
expo adapter is a pure `setState` translator. This kills the double-fire drift and the dead
events, and gives the playlist the same per-field isolation as the player (a `currentTime`
tick no longer wakes `tracks` / `currentIndex` subscribers). It still keeps its tri-state
`loop` ("none"/"single"/"all"), so it stays on `StatefulEmitter` rather than
`BaseMediaController` (whose `loop` is boolean).

## How to consume

Nothing changed for consumers — the win is automatic:

```ts
// In the chrome — unchanged call, now state-isolated:
const muted = useAudioState((s) => s.muted); // woken ONLY by a muted change
const { currentTime } = useAudioState((s) => ({ currentTime: s.currentTime }), shallowEqual); // woken ONLY by a currentTime tick
```

Imperative consumers keep using the granular events:

```ts
controller.on("volumeChange", ({ volume, muted }) => {
  /* … */
});
```

And the low-level field channel is available directly if ever needed:

```ts
const off = controller.subscribeKeys(["currentTime"], () => paint(controller.state));
```

## What is intentionally NOT done

- **Tier-2 "zero-render playback"**: moving `currentTime` / caption text / metering off the
  snapshot entirely onto an rAF channel (like `sampleUpdate`) so active playback causes
  _zero_ React renders. The scrubber/timecode still re-render per tick — but now they are
  the _only_ things that do. This is a possible follow-up; it requires rewriting the hot
  chrome leaves to be imperative.
- The playlist still doesn't surface backend `error` into `status` (pre-existing gap,
  unrelated to this change).
