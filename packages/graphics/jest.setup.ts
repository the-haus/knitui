// jest-dom matchers (toBeVisible, …) for the jsdom-rendered story smoke test.
import "@testing-library/jest-dom";

// Tamagui v3 guard: fail on leaked v2 `…Style` props, "removed in v3" APIs and
// `$`-prefixed tokens (docs/v3/conventions.md §8).
import { installTamaguiV3Guard } from "../../scripts/jest/v3-guard";

installTamaguiV3Guard();

// Reanimated / the shared Tamagui config expect React Native's development
// global to exist when imported in tests.
(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;

// jsdom-only stubs (the engine tests run in node and need none of this).
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  if (!("ResizeObserver" in globalThis)) {
    class ResizeObserverStub {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
  }
}
