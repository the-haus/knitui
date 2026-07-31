---
"@knitui/core": patch
---

`<Provider>` now registers the config it is handed as the active Tamagui config, and `setConfig` joins `getConfig` in the `@knitui/core` surface.

Tamagui keeps one config per process and `createTamagui` registers its result as a side effect of being called, but `<TamaguiProvider config={…}>` does not register what it is passed — it only reads `getCSS()` and `animations`. So an app that built its own config with `createTheme` was in a two-writer race with the kit's built-in config (the `config` prop's default), and which one ended up resolving `$token`s was decided by module evaluation order:

- webpack evaluates the built-in config eagerly, so in a Next app the app's config could win during SSR and lose on the client — raw colour tokens resolved in the server HTML and silently stopped resolving after hydration.
- Metro's `inlineRequires` defers that import to its first use, so any code that merely touched the built-in config (a diagnostic comparing it against `getConfig()`, say) evaluated it at that moment and clobbered the app's config mid-render.

Only raw tokens were affected, which is what made it hard to spot: theme values (`$background`, `$color10`, `$borderColor`) resolve through the theme and both configs ship the same theme names, so the app looked correct while every custom `$brandColor` resolved to nothing. The provider is where a consumer states which config is theirs, so it is now where that becomes true; it also re-asserts on later renders, so a stray late `createTamagui` no longer poisons the session.
