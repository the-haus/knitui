# Jest tests

**Cross-platform components are tested on the WEB target**: `react-native` → `react-native-web`, run in **jsdom**. Library is `@testing-library/react` (+ `user-event`, `jest-dom`) — **never** the RN Testing Library. Tests assert real DOM host tags/roles, not testIDs.

## Config (identical across every package — keep it that way)

`packages/components/jest.config.js`:

```js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  moduleNameMapper: { "^react-native$": "react-native-web" },
  transform: { "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": ["babel-jest", { caller: { platform: "web" } }] },
  transformIgnorePatterns: [
    "node_modules/(?!(...react-native...|@tamagui/.*|tamagui|@knitui/.*|expo...|react-native-reanimated))",
  ],
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "web.js", "js", "mjs", "cjs", "json"],
  clearMocks: true,
};
```

`jest.setup.ts`: imports `@testing-library/jest-dom`; sets `globalThis.__DEV__ = false` (Reanimated expects it); polyfills `window.matchMedia`; filters the benign `"Could not parse CSS stylesheet"` jsdomError from react-native-web.

## Always render through the shared wrapper

Import from the local `test-utils`, never `@testing-library/react` directly — the wrapper wraps every tree in the design-system `<Provider defaultColorScheme="light">`:

```ts
import { render, screen, fireEvent } from "../test-utils"; // or "../../test-utils"
```

`test-utils.tsx` re-exports everything from RTL plus a `render` bound to the Provider wrapper.

## What to assert

### Real host element / role

```ts
expect(screen.getByRole("button")).toBeInTheDocument();
expect(button).toHaveAttribute("aria-disabled", "true"); // real attribute, not a prop
expect(screen.getByText("Esc").tagName).toBe("KBD"); // render="kbd" landed a real <kbd>
```

### Web-leak guard (RN-only props must not hit the DOM)

```ts
it("does not pass nativeID to the DOM on web", () => {
  // ...assert not.toHaveAttribute("nativeID") and no console.error mentioning it
});
```

### The per-slot `styles` map (mirrors the Styles story)

Reach each slot by injecting a `testID` through the styles map:

```ts
render(<Button styles={{ label: { testID: "label-part" } }}>Labeled</Button>);
expect(screen.getByTestId("label-part")).toHaveTextContent("Labeled");
```

Also encode precedence: "explicit `loaderProps` beats `styles.loader` sugar"; "Left marker slot wins over `leftSection`".

### Render-prop components

Capture the child-fn payload:

```ts
render(<CopyButton value="hello">{({ copied }) => <span>{copied ? "Copied" : "Copy"}</span>}</CopyButton>);
expect(screen.getByText("Copy")).toBeInTheDocument();   // + assert payload shape: typeof copy === "function"
```

## Gotchas

### Reduced motion — mutable mocked flag

`useReducedMotion` (from `@knitui/hooks`) is jest-mocked with a mutable outer flag so both branches run. The factory may only reference `mock`-prefixed bindings (Jest hoists it above imports); reset in `beforeEach`:

```ts
const mockState = { reduced: false };
jest.mock("@knitui/hooks", () => ({ useReducedMotion: () => mockState.reduced }));
beforeEach(() => {
  mockState.reduced = false;
});
```

Invariant locked in: under reduced motion every motion hook collapses to `{ transition: null }` (and `usePressScale` → `pressStyle: { scale: 1 }`).

### Dates / timers

- **Fixed reference date, never `new Date()` at test time.** Pass a constant as `defaultDate` so grids are deterministic: `const JAN_2024 = new Date(2024, 0, 1);`. Assert `onChange` against ISO strings (`"2024-01-15"`).
- **Fake timers must be restored.** `jest.useFakeTimers()` in the test, `jest.useRealTimers()` in `afterEach`; restore patched globals (`navigator.clipboard`); wrap `advanceTimersByTime` in `act(...)`.

### The focus-ring pairing guardrail — `src/__tests__/focus-ring.test.tsx`

A single cross-component guardrail (lives in `src/__tests__/`, not beside a component). Renders a representative instance of **every** interactive component from a `CASES` array and asserts one invariant: _every element carrying the `:focus-visible` ring class is itself keyboard-focusable_ — a ring on a non-focusable `<div>` is a dead ring (a real bug that shipped on NavLink/Accordion/Pagination/Tree).

- Ring detection: `root.querySelectorAll('[class*="focus-visible"]')`.
- Focusability decided by **presence of the `tabindex` attribute** (or a native `BUTTON/INPUT/SELECT/TEXTAREA/A[href]`), NOT the `tabIndex` property (which reports `-1` for both a dead div and a legit roving item).
- **Add your new interactive component to `CASES`.**

## Running

- Per package: `jest` (`test`), `jest --watch` (`test:watch`), `playwright test` (`test:visual`, separate visual-regression suite).
- Repo root: `turbo run test --concurrency=1` — **serialized across packages** on purpose (shared jsdom/Tamagui global state — `__DEV__`, `matchMedia`, CSS injection — is not parallel-safe).

## Lint

- Per package: `"lint": "eslint ."` (lints the whole package — configs, `.storybook`, stories, tests — relying on the flat config's `ignores`, not `eslint src`).
- Per-package `eslint.config.mjs` just calls the shared factory: `import { defineConfig } from "../../eslint.config.base.mjs"; export default defineConfig();`.
- Base (`eslint.config.base.mjs`): TS + React + react-hooks + import-x + **perfectionist** (autofix import/export sort), `@knitui/*` treated as internal. `no-explicit-any` off; `no-console` warn. Story files relax `rules-of-hooks`/`exhaustive-deps`; test files add jest globals. Prettier is appended **last** (enforced through ESLint).
