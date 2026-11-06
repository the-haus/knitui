/**
 * Installs the `globalThis.expo` polyfill before `expo-video` or `expo-audio` loads.
 * Their web builds extend `globalThis.expo.SharedObject` at import time (expo-audio
 * since SDK 58: `AudioPlayerWeb`, `AudioRecorderWeb`, `AudioPlaylistWeb`) but never
 * import expo-modules-core (whose web entry installs that global) themselves, so they
 * rely on something else having loaded it first: the `expo` entry in an Expo app, and
 * until 0.14 expo-image through `@knitui/components`. A web app without either (Next,
 * a test) crashed with "Cannot read properties of undefined (reading 'SharedObject')".
 * Import this module above every runtime `expo-video` / `expo-audio` import.
 *
 * This is not a bare `import "expo-modules-core"`: since SDK 58 that package resolves to
 * `build/index.js`, which its own `sideEffects` list omits, so a production bundler
 * drops a bare import of it and the global is never installed. Using `SharedObject`
 * keeps `build/SharedObject.js` in the bundle; it calls `ensureNativeModulesAreInstalled`,
 * which loads the web polyfill that installs the global. Both of those are on
 * expo-modules-core's `sideEffects` list. Native gets the JSI global from the runtime
 * instead (see `expo-globals.native.ts`).
 *
 * The assignment below is what keeps that import: rolldown (Vite) treats `void SharedObject`
 * as pure and drops it, so the value has to reach a visible side effect. It must not
 * throw when the value is missing, because this module also runs where the polyfill
 * doesn't: Tamagui's static evaluation in Node, and tests that mock expo-modules-core.
 */
import { SharedObject } from "expo-modules-core";

(globalThis as { __knituiExpoSharedObject?: unknown }).__knituiExpoSharedObject = SharedObject;
