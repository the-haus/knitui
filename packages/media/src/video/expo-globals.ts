/**
 * Installs the `globalThis.expo` polyfill before `expo-video` loads. Its web build
 * extends `globalThis.expo.SharedObject` at import time but never imports
 * expo-modules-core (whose web entry installs that global) itself, so it relied on
 * something else having loaded it first: the `expo` entry in an Expo app, and
 * until 0.14 expo-image through `@knitui/components`. A web app without either
 * (Next, a test) crashed with "Cannot read properties of undefined (reading
 * 'SharedObject')". Import this module above every runtime `expo-video` import.
 */
import "expo-modules-core";
