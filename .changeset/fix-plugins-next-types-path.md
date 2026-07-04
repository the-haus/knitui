---
"@knitui/plugins": patch
---

Fix `@knitui/plugins/next` (and every other subpath) reporting "Could not find
a declaration file for module" in consumers' `tsc`. The `typescript` bob target
built with `project: tsconfig.build.json`, whose `tsconfig.build.json` set no
`rootDir`. tsc therefore inferred the package root as the root and emitted the
`.d.ts` files one level too deep — at `lib/typescript/module/src/next.d.ts` —
while the `exports[...].types` paths (correctly) pointed at
`lib/typescript/module/next.d.ts`. Runtime JS resolved fine, but a consumer's
type checker (bundler resolution) couldn't find the declarations. Setting
`rootDir: "src"` in `tsconfig.build.json` flattens the output to exactly where
`exports` already points. No API or runtime change.
