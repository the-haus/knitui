# Plan: One shared video engine across all `<Video>` players

## Context

`@knitui/video` mirrors `@knitui/audio`'s "hybrid backend behind one contract" architecture. Today each `<Video>` instantiates its OWN controller and its OWN playback element:

- Web: `useVideoController` (`hooks/useVideoController.tsx:20-27`) does `React.useState(() => new HtmlVideoController({...}))`, one per component. `HtmlVideoController` (`controller/html-controller.ts:62`) holds a private `element` and attaches to the `<video>` rendered by the web surface via `attachRef` (`html-controller.ts:87-91`).
- Native: `useVideoController.native.tsx:23-37` creates an `expo-video` player via `useVideoPlayer` and wraps it in one `ExpoVideoController` per player; that controller owns `player` (`expo-controller.native.ts:53`), bound to the `VideoView` in `VideoSurface.native.tsx:35-47`.

Where the actual playback element is created / rendered:
- **Web `<video>` element**: `surface/VideoSurface.tsx:35-60` — a raw DOM `<video ref={html.attachRef} …>` inside `VideoSurfaceFrame`.
- **Native `VideoView`**: `surface/VideoSurface.native.tsx:35-47` — `<VideoView player={expo.player} …>`.
- **Per-component controller instantiation**: `hooks/useVideoController.tsx:20` (web), `hooks/useVideoController.native.tsx:33-37` (native).
- **Surface mounted by the root**: `Video.tsx:368-378` renders exactly one `<VideoSurface controller={controller} …/>` per `<Video>`.

The chrome (`Video.chrome.tsx`), the root (`Video.tsx`), the keyboard handler (`engine/keyboard.ts` + `applyKeyAction` in `Video.tsx:70-106`), and the context (`Video.shared.ts` `VideoContextValue`) all program against the `VideoController` interface (`controller/controller.shared.ts:23-74`) and against `state`. They never touch the concrete controller except via the optional `setFullscreenContainer` feature-detect (`Video.tsx:62-67`) and the surface's `attachRef` / `attachView` casts.

The same nuance from audio applies, **plus a visual one**: audio's `<audio>` is `display:none` (`AudioSurface.tsx:21`), so one shared hidden element is trivial. A `<video>`/`VideoView` paints pixels at a specific layout position, so a single shared surface must be **displayed inside whichever player is currently active**. That is the main video-specific problem this plan solves.

**Scope**: single `<Video>` players only. There is **no playlist/queue variant** in `@knitui/video` (audio has `playlist/`; video does not), so there is nothing to mark out of scope beyond noting it. PiP and fullscreen are in-scope because the shared engine changes their semantics (only the active player can be fullscreen/PiP).

## Approach (shared controller + per-player facade)

Mirror the audio design exactly:

1. **`SharedVideoSession`** owns ONE real `VideoController` (an unchanged `HtmlVideoController` on web / `ExpoVideoController` on native). It tracks `activeId: string | null` and a per-id registry of descriptors:
   ```
   { source, config, textTracks, metadata?, lastPosition, lastDuration, lastError }
   ```
   Key methods:
   - `register(id, descriptor)` / `update(id, patch)` / `unregister(id)`.
   - `activate(id)`: if `id === activeId` no-op; else (a) capture the outgoing active player's `currentTime`/`duration` into its descriptor (`lastPosition`/`lastDuration`), (b) call `controller.replace(newDescriptor.source)`, (c) re-apply that descriptor's config (loop/muted/volume/playbackRate, textTracks) and `seekTo(lastPosition)`, (d) set `activeId = id`, (e) notify subscribers.
   - `snapshotFor(id)`: returns the **live** `controller.state` when `id === activeId`, otherwise a **memoized idle snapshot** derived from the descriptor (`createInitialState` + `currentTime: lastPosition`, `duration: lastDuration`, the stored config values, `status: "idle"`). Memoization per id is mandatory — `useSyncExternalStore` compares snapshot identity, so returning a fresh object each call loops.
   - `subscribe(listener)`: fans out the underlying controller's `change` plus session-level changes (activeId flips, descriptor updates). Implemented with the existing `TypedEmitter` (`engine/emitter.ts`) so it matches the rest of the package.

2. **Per-player FACADE** implements the full `VideoController` interface (`controller.shared.ts:23-74`) so NONE of the chrome / root / keyboard / context change — they keep calling `controller.play()`, read `controller.state`, `controller.capabilities`, `controller.on(...)`. The facade:
   - **reads** (`state`, `capabilities`) → `session.snapshotFor(id)` / `session.capabilities`.
   - **subscribe/on** → subscribe through the session, but filter so an inactive player only re-renders on changes to ITS descriptor (not on the active player's `timeUpdate` firehose).
   - **play-intent methods** (`play`, `togglePlay`→play branch, `replay`, `seekTo`/`seekBy` while inactive) → `session.activate(id)` first, then delegate to the real controller.
   - **other writes while inactive** (`setVolume`, `setMuted`, `setLoop`, `setPlaybackRate`, `selectSubtitleTrack`, …) → stored into the descriptor's `config`/selection so they apply on next `activate`; when active, delegate straight through.
   - **presentation** (`enterFullscreen`/`PiP`) → only meaningful for the active player; on an inactive player, `activate(id)` first (you can't fullscreen a player that isn't showing).
   - **`replace(source)`** → update the descriptor's source; if active, delegate to the real `controller.replace`.
   - **`dispose()`** → `session.unregister(id)` (NEVER dispose the shared engine).

3. **`<VideoEngineProvider>`** owns the one `SharedVideoSession` + renders the single surface host (see next section), exposed via a new `VideoEngineContext`. Plus a **module-level lazy singleton fallback** `getSharedVideoSession()` so standalone `<Video>` players work with zero setup — consistent with the audio plan's module-level session API and the existing `@knitui/core` `<Provider>`/`PortalProvider` pattern.

4. **`useVideoController` rewrite** (both platform files): stop `useState(() => new Controller())`. Instead:
   - Resolve the session: `React.useContext(VideoEngineContext) ?? getSharedVideoSession()`.
   - Derive a stable id: `const id = props.id ?? React.useId()`.
   - Register/update the descriptor via the existing declarative-sync effects (the `firstSource`/loop/muted/volume/playbackRate effects already in `useVideoController.tsx:42-64` become `session.update(id, …)` calls).
   - Build a stable facade: `React.useMemo(() => new VideoControllerFacade(session, id), [session, id])`.
   - `useSyncExternalStore(facade.subscribe, () => facade.state, () => facade.state)`.
   - Cleanup effect `unregister`s the id instead of disposing.
   - Return `{ controller: facade, state }` — same shape (`useVideoController.shared.ts:31-36`), so `Video.tsx:152` is unchanged.

   Add an optional `id?: string` to `UseVideoControllerOptions` (`useVideoController.shared.ts:15`) and to `VideoProps` (`Video.shared.ts:193`) so a host can give players stable ids (otherwise `React.useId()`).

## Where the one `<video>` surface lives (the visual-reparenting problem)

This is the part with no audio analogue. There are two viable shapes; the recommendation is **Option A**.

### Recommended — Option A: ONE surface, teleported into the active player's frame (`react-native-teleport` Portal)

The repo already has the exact primitive: `@knitui/components` re-exports `react-native-teleport` as `Portal`/`PortalHost`/`PortalProvider` (`packages/components/src/Portal/index.ts:20`). Crucially, the doc comment states it performs **real native view re-parenting** — "real Fabric portals on iOS/Android, `createPortal` + DOM `moveBefore` on web" (`Portal/index.ts:6-9`). `moveBefore` re-parents the live DOM node **without unmounting it**, which is exactly what a playing `<video>` needs (a remount would tear down the media element and lose buffered data / playback).

Design:
- `VideoEngineProvider` (and the lazy-singleton host it renders) mounts the **single** `VideoSurface` once, wrapped in a `<Portal name="knitui-video-surface" hostName={activeHostName}>`. `activeHostName` is the session's active player's host name (e.g. `video-host:<activeId>`), or a hidden offscreen parking host when `activeId == null`.
- Each `<Video>` root, instead of rendering `<VideoSurface>` directly (`Video.tsx:368-378`), renders a **`<PortalHost name={"video-host:" + id}/>`** sized to fill its `VideoSurfaceFrame`. The active player's host receives the teleported surface; inactive players render a **poster/placeholder** in the same frame.
- When `session.activate(id)` flips `activeId`, the Portal's `hostName` changes, and `react-native-teleport` re-parents the live `<video>` node into the newly-active player's host — no remount, playback state preserved.

Why this is cleanest:
- One real media element, guaranteed (verifiable: exactly one `<video>` in the DOM).
- No remount on switch → no buffer/decoder churn, position continuity is automatic for the active element (and remembered positions handle the inactive ones).
- Reuses an established, tested kit primitive rather than inventing a re-parenting mechanism.
- The chrome already overlays the `VideoSurfaceFrame` absolutely (`Video.tsx:380-437`), so it stays per-player and on top of the teleported surface naturally.

Trade-offs / risks to handle:
- **Fullscreen target**: `HtmlVideoController.setFullscreenContainer` (`html-controller.ts:94`) is registered by each root with its own frame (`Video.tsx:266-272`). With a shared element, only the **active** player's frame should be the fullscreen target. Fix: the facade forwards `setFullscreenContainer` to the real controller **only while active**; on `activate`, the session re-points the fullscreen target to the new active frame. Keep `setFullscreenContainer` on the facade so the feature-detect in `Video.tsx:65` still passes.
- **`attachRef` ownership**: today the web surface calls `html.attachRef` (`VideoSurface.tsx:36`). With one shared surface bound to the shared controller, `attachRef` binds **once** to the single element — correct, since there is one controller. The facade does NOT expose `attachRef` (only the real controller, mounted by the provider, binds). Confirm `Video.tsx` never reads `attachRef` (it doesn't — only the surface does).
- **`<track>` / textTracks and poster are per-source**: the single `<video>` must re-render its `<track>` children and `poster` when the active descriptor changes. The surface reads them from the session's active descriptor (the provider passes the active descriptor's `textTracks`/`poster`/`contentFit`), not from a single static prop. `contentFit` (object-fit, `VideoSurface.tsx:14-18`) likewise follows the active player.
- **Layout/styling**: the teleported `<video>` is `position:absolute; inset:0` (`VideoSurface.tsx:41-47`), so it fills whatever host it lands in. The `PortalHost` must be sized to fill the frame (`style={{minHeight…}}` or absolute fill, as in `Portal.stories.tsx:87`).
- **Native**: `react-native-teleport` re-parents Fabric views, so the same Portal/Host pattern works for `VideoView`. But `expo-video`'s `VideoView` is tied to its `player`; re-parenting the view is fine since there's one shared player. Validate that `VideoView` survives re-parent on native (lower priority — web is the Storybook verification target).

### Alternative — Option B: per-player surfaces, only the active one binds the shared element

Each player renders its own `<video>`, but only the active player's element is `attach`ed to the shared controller; inactive elements show a poster and are detached. Rejected because it defeats the "exactly ONE `<video>` element" requirement, doubles decoder allocation, and `HtmlVideoController` is built around a single `attachRef` swap (`html-controller.ts:87-91`) — moving the bind between elements forces detach/attach churn and loses buffered ranges. Option A's teleport keeps the literal same element alive.

**Recommendation: Option A.** It's the only one that yields exactly one live `<video>` and zero remount on switch, and it reuses the existing teleport primitive.

## Files to change

### New files
- `packages/video/src/session/SharedVideoSession.shared.ts` — the `SharedVideoSession` class (platform-free: owns a `VideoController`, the descriptor registry, `activate`, `snapshotFor` with per-id memoization, subscribe via `TypedEmitter`). Mirror `audio/src/session/` location.
- `packages/video/src/session/VideoControllerFacade.shared.ts` — the per-player facade implementing `VideoController` by delegating to a `SharedVideoSession` + id. (Could live in the same file as the session; keep separate to mirror audio.)
- `packages/video/src/session/getSharedVideoSession.ts` + `.native.ts` — module-level lazy singleton (`HtmlVideoController` on web, an `ExpoVideoController`-backed session on native). Platform-split because each constructs a different real controller.
- `packages/video/src/session/VideoEngineProvider.tsx` + `.native.tsx` — provider that owns a session, mounts the single `<VideoSurface>` inside a `<Portal name="knitui-video-surface" hostName={activeHostName}>`, and provides `VideoEngineContext`.
- `packages/video/src/session/VideoEngineContext.ts` — `React.createContext<SharedVideoSession | null>(null)` + a `useVideoEngine()` reader that falls back to `getSharedVideoSession()`.
- `packages/video/src/session/SharedVideoSession.test.ts` — unit tests (see Verification).

### Edited files
- `packages/video/src/hooks/useVideoController.tsx` (web) — rewrite to resolve session, derive id, register descriptor, build facade, `useSyncExternalStore`, unregister on unmount. The existing declarative-sync effects (`:42-64`) become `session.update(id, …)`.
- `packages/video/src/hooks/useVideoController.native.tsx` — same rewrite. Note: today it creates the player via `useVideoPlayer` (`:23`). The shared player must move into the session/provider; the hook stops calling `useVideoPlayer` and instead registers a descriptor. The session owns the one player.
- `packages/video/src/hooks/useVideoController.shared.ts` — add `id?: string` to `UseVideoControllerOptions` (`:15`); types of the result stay identical.
- `packages/video/src/surface/VideoSurface.tsx` + `.native.tsx` — the surface now reads source/textTracks/poster/contentFit/fullscreen-target from the **active descriptor** supplied by the provider, and is mounted once (inside the Portal) rather than per-root. `attachRef`/`attachView` binds to the single shared controller.
- `packages/video/src/Video.tsx` — replace the inline `<VideoSurface .../>` (`:368-378`) with a `<PortalHost name={"video-host:" + id}/>` filling the frame, plus a poster/placeholder when inactive. The `setFullscreenContainer` effect (`:266-272`) registers the frame as the active fullscreen target via the facade (forwarded only while active). Everything else (auto-hide, keyboard, tap layer, chrome) is unchanged because it talks to the facade `controller`.
- `packages/video/src/Video.shared.ts` — add optional `id?: string` to `VideoProps` (`:193`); optionally export `VideoEngineProvider`.
- `packages/video/src/index.ts` — export `VideoEngineProvider`, `getSharedVideoSession`, `SharedVideoSession` type, `useVideoEngine`. (`:58-89`)

## Reuse (don't reinvent)
- **`Portal` / `PortalHost` / `PortalProvider`** from `@knitui/components` (`packages/components/src/Portal/index.ts:20`) for the surface re-parenting — DOM `moveBefore` keeps the `<video>` alive across the switch. The root `"root"` `PortalHost` is already mounted by `@knitui/core`'s `<Provider>` (`Portal/index.ts:22-26`), and named hosts work as shown in `Portal.stories.tsx:79-97`.
- **`BaseVideoController` + the two real adapters** (`controller.shared.ts`, `html-controller.ts`, `expo-controller.native.ts`) — UNCHANGED. The session wraps one instance; `replace()` (`html-controller.ts:437`, `expo-controller.native.ts:416`) is the exact seam `activate` uses to switch source.
- **`TypedEmitter`** (`engine/emitter.ts`) for the session's change fan-out — same primitive the controllers use.
- **`createInitialState` / `mergeState`** (`engine/state.ts:8,40`) to build memoized idle snapshots for inactive players.
- **`pickPlayerConfig`** (`useVideoController.shared.ts:39`) to extract the descriptor's config subset.
- The `VideoController` interface itself (`controller.shared.ts:23-74`) is the facade's contract — implement every method so the chrome/keyboard stay untouched.

## Edge cases / best practices
- **Idle snapshot memoization per id** — return the SAME object until that descriptor changes, or `useSyncExternalStore` infinite-loops. Audio's plan calls this out explicitly; the same risk exists here.
- **Subscription filtering** — an inactive player must NOT re-render on the active player's `timeUpdate` torrent (`html-controller.ts:175` fires per frame). The facade's `subscribe` should only notify when the active player's `change` matters to it OR when its own descriptor / the `activeId` changes.
- **Position capture on switch** — capture the outgoing player's `currentTime`/`duration` BEFORE `controller.replace()` resets them (`replace` zeroes `currentTime`/`duration`: `html-controller.ts:439-446`). After replace + metadata load, `seekTo(lastPosition)`; note seeking before `loadedmetadata` clamps — re-apply on `loadedmetadata`/`canplay` or store `lastPosition` and seek in the `sourceLoad` handler path.
- **`autoPlay`** — only the activated player should autoplay; on `activate` the session re-applies `config.autoPlay` by calling `play()`. Don't autoplay inactive registrations.
- **Fullscreen / PiP single-owner** — only the active player can be fullscreen/PiP. The facade routes `enterFullscreen`/`startPictureInPicture` through `activate(id)` first; the session repoints `setFullscreenContainer` to the active frame. When switching away from a fullscreen/PiP player, exit it first (the OS only allows one).
- **`<track>` cleanup** — when the source switches, the shared `<video>`'s old `<track>` children must be replaced with the new descriptor's; the controller already re-reads text tracks on `loadedmetadata` (`html-controller.ts:154-158, 250-282`).
- **Muted-autoplay fallback** — `play()`'s muted-retry (`html-controller.ts:309-319`) still works; just make sure the facade's `play` path activates first.
- **No provider mounted** — `getSharedVideoSession()` lazily creates the singleton + parks the surface in an offscreen host until first activation, so a standalone `<Video>` with no `<VideoEngineProvider>` still works.
- **Concurrent `<Video>` mount order** — the first player to `play()` wins `activeId`; others stay idle showing posters. Two players autoplaying simultaneously is resolved last-write-wins by `activate`.
- **Native player ownership** — moving the `expo-video` player out of `useVideoPlayer` (currently in `useVideoController.native.tsx:23`) into the session means the session must create and release the player (its own lifecycle). Confirm `expo-video` allows creating a `VideoPlayer` outside the hook (it does, via `createVideoPlayer`), and dispose it when the provider/singleton tears down.

## Verification
- **Unit test** `session/SharedVideoSession.test.ts` (Jest, jsdom — package already uses jsdom per `html-controller.test.ts`): register two ids A and B; `activate(A)`, advance A to t=12s, `activate(B)` → assert (1) `controller.replace` called with B's source, (2) A's descriptor `lastPosition≈12`, (3) `snapshotFor(A)` returns idle snapshot with `currentTime≈12` and `playing:false`, (4) `snapshotFor(B)` returns live state, (5) re-`activate(A)` calls `seekTo(12)`. Assert `snapshotFor(id)` returns a **stable reference** across calls while the descriptor is unchanged (the loop-guard). Use a fake `VideoController` test double (the test can pass a stub controller into the session constructor) so it stays DOM-light, following the existing controller test style.
- **Storybook two-player manual check (Playwright MCP)** — add a `TwoPlayers` story to `Video.stories.tsx` rendering two `<Video>` with `SAMPLE` and `SAMPLE_2` (both constants already exist, `Video.stories.tsx:9-10`). Video Storybook runs on **port 6009** (`packages/video/package.json:36`). Steps: start `pnpm --filter @knitui/video storybook` (run-only; do not commit), navigate Playwright to `http://localhost:6009/?path=/story/media-video--two-players`, then:
  1. `browser_evaluate` `document.querySelectorAll('video').length` → assert **exactly 1**.
  2. Click play on player 1, wait, assert it's playing and the `<video>` sits inside player 1's host.
  3. Click play on player 2 → assert player 1 paused, `<video>` re-parented into player 2's host (still exactly 1 `<video>`), player 2 playing from 0.
  4. Re-activate player 1 → assert it resumes near its remembered position (not 0).
  5. Re-assert `document.querySelectorAll('video').length === 1` throughout.

## Critical files for implementation
- `packages/video/src/hooks/useVideoController.tsx`
- `packages/video/src/controller/html-controller.ts`
- `packages/video/src/Video.tsx`
- `packages/video/src/surface/VideoSurface.tsx`
- `packages/components/src/Portal/index.ts`
