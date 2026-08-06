/**
 * A module-resolution hook that lets a generator import the site's own TypeScript.
 *
 * Node strips types out of `.ts` files on its own, but it will not guess an
 * extension the way a bundler does, so `import "./markers"` — how every file in
 * `apps/docs/src` is written — fails to resolve. This appends `.ts` for relative
 * specifiers that have no extension, which is enough to share real site code with
 * the checks instead of re-implementing it here.
 *
 *   import { register } from "node:module";
 *   register("./lib/ts-resolve.mjs", import.meta.url);
 */
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
