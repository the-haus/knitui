---
"@knitui/mediaquery": minor
"@knitui/core": patch
---

Add `@knitui/mediaquery`: cross-platform, SSR-safe media queries and responsive
breakpoints for web (Next.js) and React Native (Expo). Ships `useMediaQuery`
(matchMedia string or structured descriptor), `useBreakpoint` /
`useBreakpointValue` over the shared `@knitui/core` breakpoint scale, an optional
`MediaQueryProvider` with `User-Agent` device seeding for SSR, and a pure query
engine (`parseMediaQuery` / `matchesQuery` / `queryToString`). `@knitui/core` now
re-exports its `breakpoints` scale.
