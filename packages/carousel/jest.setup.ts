// Adds jest-dom matchers (toBeVisible, toHaveTextContent, toBeDisabled, …) to
// `expect` for the jsdom-rendered component trees.
import "@testing-library/jest-dom";

// jsdom's CSS parser rejects some of the rules Tamagui/react-native-web inject on
// mount and emits a non-fatal "Could not parse CSS stylesheet" jsdomError.
// Rendering and assertions are unaffected, so filter that one message.
const originalError = console.error.bind(console);
console.error = (...args: unknown[]): void => {
  const first = args[0];
  const text = first instanceof Error ? first.message : String(first ?? "");
  if (text.includes("Could not parse CSS stylesheet")) return;
  originalError(...args);
};

// Reanimated / the shared Tamagui config expect React Native's development
// global to exist when imported in tests.
(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// jsdom does not implement ResizeObserver; the web controller / surface measure
// the element with it. Provide an inert stub.
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
}

// NOTE: Reanimated's web animation loop does not progress under jsdom (no real
// frame loop), so withTiming/withSpring transitions never *complete* in tests.
// We therefore exercise the controller via its non-animated paths (`animated:
// false`) and direct shared-value writes, which drive the same offset → reaction
// → reporting pipeline deterministically. Don't assert on animated completion.
