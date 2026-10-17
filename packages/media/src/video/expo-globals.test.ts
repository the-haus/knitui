/**
 * Guards the `globalThis.expo` install against tree-shaking. `expo-globals.ts` is
 * a side-effect-only module (`import "expo-modules-core"`), imported bare above
 * every runtime `expo-video` import. A package-wide `"sideEffects": false` lets
 * webpack / esbuild / Rollup DROP such a bare import in production bundles, which
 * brings back the "Cannot read properties of undefined (reading 'SharedObject')"
 * crash on web. The package therefore lists the module in `sideEffects`, and
 * nothing else, so the rest of the package still tree-shakes.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PKG_ROOT = join(__dirname, "..", "..");
const SRC = join(PKG_ROOT, "src");

const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")) as {
  sideEffects?: boolean | string[];
};

/** The bundler glob semantics webpack/esbuild apply to `sideEffects` entries. */
const globToRegExp = (glob: string): RegExp =>
  new RegExp(
    `^${glob
      .replace(/^\.\//, "")
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*\//g, "(?:.*/)?")
      .replace(/\*/g, "[^/]*")}$`,
  );

const hasSideEffects = (file: string): boolean => {
  const { sideEffects } = pkg;
  if (sideEffects === undefined || sideEffects === true) return true;
  if (sideEffects === false) return false;
  return sideEffects.some((glob) => globToRegExp(glob).test(file));
};

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? sourceFiles(full) : /\.tsx?$/.test(full) ? [full] : [];
  });

describe("expo-globals side effect survives bundling", () => {
  it("declares sideEffects as an allow-list (not false)", () => {
    expect(Array.isArray(pkg.sideEffects)).toBe(true);
  });

  it.each([
    "src/video/expo-globals.ts",
    "lib/module/video/expo-globals.js",
    "lib/commonjs/video/expo-globals.js",
  ])("marks %s as side-effectful", (file) => {
    expect(hasSideEffects(file)).toBe(true);
  });

  it.each(["src/video/Video.tsx", "src/audio/Audio.tsx", "lib/module/index.js"])(
    "keeps %s tree-shakeable",
    (file) => {
      expect(hasSideEffects(file)).toBe(false);
    },
  );

  it("installs the global before every runtime expo-video import", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      if (/\.test\.tsx?$/.test(file)) continue;
      const text = readFileSync(file, "utf8");
      const runtime = /^import (?!type\b)[^;]*from "expo-video";/m.exec(text);
      if (!runtime) continue;
      const globals = text.indexOf('import "../expo-globals";');
      if (globals < 0 || globals > runtime.index) offenders.push(relative(SRC, file));
    }
    expect(offenders).toEqual([]);
  });
});
