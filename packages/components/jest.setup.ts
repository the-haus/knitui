// Adds jest-dom matchers (toBeVisible, toHaveTextContent, toBeDisabled, …) to
// `expect` for the jsdom-rendered component trees.
import "@testing-library/jest-dom";

// Reanimated expects React Native's development global to exist when the shared
// Tamagui config is imported in tests.
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

// jsdom's CSS parser rejects some of the rules react-native-web injects on mount
// and emits a non-fatal "Could not parse CSS stylesheet" jsdomError. Rendering and
// assertions are unaffected, so filter that one message to keep test output clean.
const originalError = console.error.bind(console);
console.error = (...args: unknown[]): void => {
  const first = args[0];
  const text = first instanceof Error ? first.message : String(first ?? "");
  if (text.includes("Could not parse CSS stylesheet")) return;
  originalError(...args);
};
