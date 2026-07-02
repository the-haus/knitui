# Plan: One shared audio engine across all `<Audio>` players

## Context

Today every `<Audio>` component is fully self-contained: `useAudioController` creates its
**own** `HtmlAudioController` (web) / `ExpoAudioController` (native), each of which owns its
**own** playback element (a hidden DOM `<audio>` via `AudioSurface` on web; an `expo-audio`
player on native). Two players on the same page are completely independent — playing one does
**not** stop the other, and there is no shared state anywhere
(`packages/audio/src/hooks/useAudioController.tsx:20`, `.native.tsx:34`).

We want the behaviour of a real app: **one audio engine, shared by all players**. Pressing
play on a second player switches that one engine to the new player's source (stopping whatever
was playing). When you switch away, the previous player remembers its position so returning to
it resumes where you left off.

**Scope (confirmed):** single-track `<Audio>` players only. `<AudioPlaylist>` stays on its own
engine for now (it owns a gapless-lookahead element that needs separate reconciliation).
**Inactive UX (confirmed):** remember position per player.

## Approach: one real controller + a per-player facade

Keep the existing `AudioController` contract and the real backends (`HtmlAudioController` /
`ExpoAudioController`) **exactly as they are** — they already do everything (play, `replace`,
seek, sampling, lock-screen). Introduce a session layer that owns **one** real controller and
hands each `<Audio>` a lightweight **facade** that also implements `AudioController`.

Because the facade implements the same interface, **none of the chrome or `Audio.tsx` changes**
— they keep calling `controller.play()` / `controller.seekTo()` / reading `controller.state`.
Only the hook that mints the controller changes. This is the key best-practice win: zero churn
in the ~15 chrome components, the keyboard handler, lock-screen wiring, and visualizer.

### The session (single source of truth)

New file `packages/audio/src/session/audio-session.ts` (shared, DOM-free) exporting a
`SharedAudioSession` class:

- Lazily creates and owns **one** real `AudioController`. On web it constructs a
  `HtmlAudioController` and renders a single hidden `<audio>` element for it (see "Where the
  one element lives" below). On native it builds an `ExpoAudioController` over an imperatively
  created `expo-audio` player (`createAudioPlayer`, not the `useAudioPlayer` hook), so its
  lifecycle is owned by the session, not a component.
- Tracks `activeId: string | null` and a per-id registry:
  `{ source, config, metadata, lastPosition, lastDuration }`.
- `register(id, descriptor)` / `update(id, partialDescriptor)` / `unregister(id)` — players
  register on mount, push declarative prop changes (source, loop, volume…), and drop out on
  unmount. Unregistering does **not** dispose the engine.
- `activate(id)` — the heart of the switch: if `id` is already active, no-op. Otherwise it
  snapshots the outgoing player's `currentTime`→`lastPosition`, calls
  `controller.replace(descriptor.source)`, re-applies that player's config + lock-screen
  metadata, seeks to the remembered `lastPosition`, sets `activeId = id`, and fires a session
  `change` event.
- `snapshotFor(id)` — returns the state a given player should display: the **live**
  `controller.state` when `id === activeId`, otherwise a memoized **idle** snapshot
  (paused, `currentTime = lastPosition`, `duration = lastDuration`) built once with
  `createInitialState` from `../engine` and cached until that player's stored fields change.
  Caching the idle snapshot per id is required so `useSyncExternalStore` gets a stable
  reference and doesn't loop (cf. the carousel snapshot-equality guards).
- `subscribe(listener)` — fans out on both the real controller's `change` **and** `activeId`
  changes, so a player re-renders when it gains/loses focus.
- `getFacade(id)` — returns a stable facade instance (below).
- `dispose()` — disposes the real controller + tears down the element. Called only when the
  provider unmounts.

### The facade (what each `<Audio>` gets)

`SharedAudioSession.getFacade(id)` returns an object implementing `AudioController`:

- **Reads** (`state`, `capabilities`) → delegate to `session.snapshotFor(id)` /
  `controller.capabilities`.
- **Play intent** (`play`, `togglePlay`→play branch, `replay`) → `session.activate(id)` first,
  then delegate to the real controller. This is what makes "press another player → it switches"
  work automatically, including from the keyboard handler and lock-screen.
- **Other writes while inactive** (`seekTo`, `setVolume`, `setLoop`, `replace`, sampling, …)
  → if active, delegate to the real controller; if inactive, write into the stored descriptor
  (e.g. an inactive seek updates `lastPosition`) so it takes effect on next activation.
- `setActiveForLockScreen` / lock-screen metadata → delegate when active; store otherwise.
- `dispose()` on the facade → `session.unregister(id)` (NOT real dispose).
- `subscribe` / `on` → forward through the session, filtered so granular events only reach the
  facade while it's the active player.

### Provider + singleton fallback (best practice, backward compatible)

New `packages/audio/src/session/AudioEngineProvider.tsx` (+ `.shared.ts` for the context/types):

- `<AudioEngineProvider>` creates one `SharedAudioSession` and renders the single hidden
  `<audio>` host once (web). Mount it once near the app root to scope a group of players.
- A module-level lazy singleton `getSharedAudioSession()` (consistent with the existing
  module-level `session/preload.ts` and `session/audio-mode.ts`) is used as the **default** when
  no provider is present — so standalone `<Audio>` keeps working with no setup, and existing
  single-player code is unaffected.
- `useAudioEngine()` reads the context, falling back to the singleton.

### Where the one `<audio>` element lives (web)

Currently each `<Audio>` renders `<AudioSurface controller={controller} />`
(`Audio.tsx:268` → `surface/AudioSurface.tsx:18`, `ref={html.attachRef}`). With a shared
engine there must be exactly **one** element, owned by the session — not one per player.

- The single hidden `<audio>` is rendered by `AudioEngineProvider` (and by a tiny invisible
  host the singleton mounts via the existing teleport/Portal root when no provider is used, so
  the standalone path still has an element). It calls `realController.attachRef` once.
- `Audio.tsx` **stops rendering `AudioSurface`** — remove the per-player surface so we don't
  create N elements. (Native has no surface element today, so no change there.)

## Files to change

- **New** `packages/audio/src/session/audio-session.ts` — `SharedAudioSession` + facade
  (shared/DOM-free core; takes a "create real controller" factory injected per platform).
- **New** `packages/audio/src/session/audio-session.web.ts` /
  `audio-session.native.ts` — platform factories that build `HtmlAudioController` (+ element
  host) / `ExpoAudioController` (+ `createAudioPlayer`).
- **New** `packages/audio/src/session/AudioEngineProvider.tsx` + `.shared.ts` — provider,
  context, `useAudioEngine`, `getSharedAudioSession` singleton.
- **Edit** `packages/audio/src/hooks/useAudioController.tsx` **and** `.native.tsx` — replace
  the `useState(() => new …Controller())` body with: resolve the session via `useAudioEngine`,
  derive a stable `id` (`options.id ?? React.useId()`), `register`/`update` the descriptor from
  the existing declarative effects (reuse the current source/loop/muted/volume/rate/sampling
  effect blocks, but route them to `session.update(id, …)`), `useSyncExternalStore` over
  `session.subscribe` / `session.snapshotFor(id)`, and return
  `{ controller: session.getFacade(id), state }`. Dispose effect now `unregister`s instead of
  disposing the engine.
- **Edit** `packages/audio/src/hooks/useAudioController.shared.ts` — add optional `id?: string`
  to `UseAudioControllerOptions`.
- **Edit** `packages/audio/src/Audio.tsx` — accept an optional `id` prop, pass it through to the
  hook, and **remove** the `<AudioSurface …>` render (the element now lives in the session).
- **Edit** `packages/audio/src/Audio.shared.ts` — add `id?: string` to `AudioProps`.
- **Edit** `packages/audio/src/index.ts` — export `AudioEngineProvider`, `useAudioEngine`,
  `getSharedAudioSession`, and the session types.
- **Possibly remove/retire** `packages/audio/src/surface/AudioSurface.tsx` +
  `.shared.ts` once the element moves into the session host (keep the host markup minimal —
  reuse the same `<audio crossOrigin preload="metadata" style={{display:"none"}}>` from
  `AudioSurface.tsx:16-23`).

## Reuse (don't reinvent)

- Real backends `HtmlAudioController` / `ExpoAudioController` and their `replace()` — unchanged.
- `AudioController` interface (`controller/controller.shared.ts:27`) — the facade implements it.
- `createInitialState` / `mergeState` / `TypedEmitter` from `../engine` for idle snapshots and
  the session's own change emitter.
- Existing declarative-sync effect blocks in both `useAudioController` files — re-pointed at the
  session, not rewritten.
- The hidden-`<audio>` markup from `surface/AudioSurface.tsx`.
- Module-singleton pattern already used by `session/preload.ts` / `session/audio-mode.ts`.

## Edge cases / best practices to honour

- **Stable idle snapshots** per id (memoized, only re-created on stored-field change) to avoid
  `useSyncExternalStore` render loops.
- **Engine disposal** only on provider/singleton teardown — never on per-player unmount.
- **Stable player id**: `id` prop wins; else `React.useId()` (don't key off `source`, which can
  collide / change).
- **Autoplay**: `autoPlay` should activate-then-play through the facade like any play intent;
  only the most-recently-mounted autoplay player should win (last `activate` wins naturally).
- **Lock-screen / MediaSession** reflects the active player only (routes through the facade).
- **Sampling/visualizer**: only the active player samples (one analyser on the one element);
  inactive waveforms render idle — acceptable and expected.

## Verification

1. **Unit** — new `packages/audio/src/session/audio-session.test.ts`: register two players;
   `activate(B)` while A is active ⇒ A's `lastPosition` captured, real `replace` called with B's
   source, `activeId === "B"`, `snapshotFor("A")` is idle@lastPosition while `snapshotFor("B")`
   is live. Cover the activate→play / inactive-seek-stores-position paths. Run
   `pnpm --filter @knitui/audio test`.
2. **Existing suites** — `pnpm --filter @knitui/audio test` (controller/emit-gate/smoothing
   tests must stay green; chrome is untouched).
3. **Web manual (Storybook 6010)** — add/extend a story rendering **two** `<Audio>` players
   with different sources. Use the Playwright MCP: navigate to the audio Storybook, play
   player 1, confirm audio + waveform animate; press play on player 2 and confirm player 1
   pauses, player 2 loads its file and plays, and the DOM has exactly **one** `<audio>` element
   (`browser_evaluate` → `document.querySelectorAll('audio').length === 1`). Switch back to
   player 1 and confirm it resumes near its remembered time.
4. **Native** — smoke-check in the demo app that two players coordinate (manual; expo player is
   imperative now).
5. `pnpm --filter @knitui/audio lint` and typecheck.
