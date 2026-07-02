// Adds jest-dom matchers (toBeVisible, toHaveTextContent, toBeDisabled, …) to
// `expect` for any jsdom-rendered component trees. Mirrors
// packages/components/jest.setup.ts so later component tests are turnkey.
import "@testing-library/jest-dom";
// Register the non-English dayjs locales the suite exercises. dayjs ships only
// `en` by default and silently falls back to it for any unregistered locale, so
// without these imports a `DatesProvider locale="ru"` test would render English
// and pass vacuously. Consuming apps import the locales they ship; tests import
// the ones they assert on. Side-effect imports — they self-register on `dayjs`.
import "dayjs/locale/ru";
import "dayjs/locale/fr";

// Reanimated expects React Native's development global to exist when the shared
// Tamagui config is imported in tests.
(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
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
