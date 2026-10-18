/**
 * Native counterpart of `expo-globals.ts`: the runtime installs `globalThis.expo`
 * through JSI before the bundle runs, so loading expo-modules-core is enough.
 */
import "expo-modules-core";
