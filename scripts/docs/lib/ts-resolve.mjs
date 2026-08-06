/**
 * Module hooks that let a generator import the site's own TypeScript.
 *
 * Two things stand between Node and `apps/docs/src/**`:
 *
 *   1. **Extension guessing.** Every file there is written for a bundler
 *      (`import "./markers"`), and Node does not guess extensions. `resolve`
 *      appends `.ts` for extensionless relative specifiers.
 *   2. **Types.** Node only strips types from `.ts` on its own from v22.6, and
 *      this repo supports `node >=20` (CI pins 20). On Node 20 a bare `.ts`
 *      import dies with `ERR_UNKNOWN_FILE_EXTENSION`, so `load` transpiles with
 *      the TypeScript compiler already in the toolchain rather than depending on
 *      the runtime's version. Doing it unconditionally also keeps every Node
 *      version on the same code path, so a check cannot pass locally and fail in
 *      CI for a reason that has nothing to do with what it is checking.
 *
 * Type-stripping only — no downlevelling. The site's modules are modern ESM and
 * the point is to run the real code, not a rewritten copy of it.
 *
 *   import { register } from "node:module";
 *   register("./lib/ts-resolve.mjs", import.meta.url);
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import ts from "typescript";

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return next(`${specifier}.ts`, context);
    }
    throw error;
  }
}

export async function load(url, context, next) {
  if (!/\.tsx?($|\?)/.test(url)) return next(url, context);

  const path = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    fileName: path,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      // The site's TS is `verbatimModuleSyntax`-clean, so `import type` is already
      // marked and nothing else needs eliding.
      verbatimModuleSyntax: true,
      jsx: ts.JsxEmit.Preserve,
    },
  });

  return { format: "module", shortCircuit: true, source: outputText };
}
