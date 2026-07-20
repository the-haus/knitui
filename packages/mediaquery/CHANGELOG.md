# @knitui/mediaquery

## 0.5.0

### Patch Changes

- Updated dependencies [4f7830c]
  - @knitui/core@0.5.0
  - @knitui/hooks@0.5.0

## 0.4.0

### Patch Changes

- @knitui/core@0.4.0
- @knitui/hooks@0.4.0

## 0.3.0

### Patch Changes

- @knitui/core@0.3.0
- @knitui/hooks@0.3.0

## 0.2.0

### Minor Changes

- c346356: Add `@knitui/mediaquery`: cross-platform, SSR-safe media queries and responsive
  breakpoints for web (Next.js) and React Native (Expo). Ships `useMediaQuery`
  (matchMedia string or structured descriptor), `useBreakpoint` /
  `useBreakpointValue` over the shared `@knitui/core` breakpoint scale, an optional
  `MediaQueryProvider` with `User-Agent` device seeding for SSR, and a pure query
  engine (`parseMediaQuery` / `matchesQuery` / `queryToString`). `@knitui/core` now
  re-exports its `breakpoints` scale.

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/hooks@0.2.0
