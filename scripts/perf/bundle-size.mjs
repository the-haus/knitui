#!/usr/bin/env node
/**
 * Web bundle size of the @knitui/components barrel (esbuild, min + gzip).
 *
 *   node scripts/perf/bundle-size.mjs [out.json] [--entry=src|lib]
 *
 * Bundles `import * as K from "@knitui/components"; console.log(K)` (keeps the
 * whole barrel; no tree-shaking credit) for the web target:
 *   - externals: react, react-dom, react/jsx-runtime, react-native-web (and the
 *     `react-native` alias that points at it)
 *   - platform extensions: .web.* first
 *   - define NODE_ENV=production, TAMAGUI_TARGET=web
 * Also bundles a "Button only" entry to measure the tree-shaken floor.
 * Writes sizes plus a per-package breakdown from the metafile (bytes of
 * minified output attributed to each node_modules package / workspace dir).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const COMP = join(ROOT, "packages/components");
const require = createRequire(join(COMP, "package.json"));
const esbuild = require("esbuild");

const out = resolve(
  process.argv.slice(2).find((a) => !a.startsWith("--")) ??
    join(ROOT, "scripts/perf/out/bundle-size.json"),
);
const entryKind = (process.argv.find((a) => a.startsWith("--entry=")) ?? "--entry=src").slice(8);
mkdirSync(dirname(out), { recursive: true });

const target = entryKind === "lib" ? "@knitui/components" : join(COMP, "src/index.ts");

const EXTERNAL = [
  "react",
  "react-dom",
  "react-dom/*",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-native-web",
  "react-native-web/*",
];

const rnAlias = {
  name: "rn-alias",
  setup(build) {
    build.onResolve({ filter: /^react-native$/ }, () => ({
      path: "react-native-web",
      external: true,
    }));
  },
};

async function bundle(name, contents) {
  const t0 = Date.now();
  const res = await esbuild.build({
    stdin: { contents, resolveDir: COMP, loader: "tsx", sourcefile: `${name}.tsx` },
    bundle: true,
    minify: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    write: false,
    metafile: true,
    treeShaking: true,
    logLevel: "silent",
    external: EXTERNAL,
    plugins: [rnAlias],
    resolveExtensions: [
      ".web.tsx",
      ".web.ts",
      ".web.jsx",
      ".web.js",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".mjs",
      ".cjs",
      ".json",
    ],
    mainFields: ["browser", "module", "main"],
    conditions: ["browser", "import", "default"],
    loader: {
      ".js": "jsx",
      ".png": "dataurl",
      ".ttf": "dataurl",
      ".woff": "dataurl",
      ".woff2": "dataurl",
    },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.TAMAGUI_TARGET": '"web"',
      "process.env.EXPO_OS": '"web"',
      __DEV__: "false",
      global: "globalThis",
    },
    jsx: "automatic",
  });
  const code = res.outputFiles[0].contents;
  const byPkg = {};
  for (const [file, info] of Object.entries(
    res.metafile.outputs[Object.keys(res.metafile.outputs)[0]].inputs,
  )) {
    let key;
    const nm = file.lastIndexOf("node_modules/");
    if (nm >= 0) {
      const rest = file.slice(nm + 13).split("/");
      key = rest[0].startsWith("@") ? `${rest[0]}/${rest[1]}` : rest[0];
      if (key === ".pnpm")
        key =
          rest.slice(1).join("/").split("/node_modules/")[1]?.split("/").slice(0, 2).join("/") ??
          "pnpm";
    } else {
      const m = /packages\/([^/]+)\//.exec(file);
      key = m ? `workspace:${m[1]}` : file;
    }
    byPkg[key] = (byPkg[key] ?? 0) + info.bytesInOutput;
  }
  const top = Object.entries(byPkg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([k, v]) => ({ pkg: k, bytes: v }));
  const outsideRepo = Object.keys(res.metafile.inputs).filter(
    (f) => !resolve(COMP, f).startsWith(ROOT),
  ).length;
  return {
    name,
    outsideRepoInputs: outsideRepo,
    minBytes: code.length,
    gzipBytes: gzipSync(code, { level: 9 }).length,
    inputs: Object.keys(res.metafile.inputs).length,
    ms: Date.now() - t0,
    warnings: res.warnings.length,
    topPackages: top,
  };
}

const pkgVersion = (name) => {
  try {
    return require(`${name}/package.json`).version;
  } catch {
    return null;
  }
};
const results = {
  entry: entryKind,
  versions: {
    "@tamagui/core": pkgVersion("@tamagui/core"),
    "@tamagui/web": pkgVersion("@tamagui/web"),
    esbuild: esbuild.version,
  },
  externals: EXTERNAL,
  barrel: await bundle("barrel", `import * as K from ${JSON.stringify(target)}; console.log(K);`),
  buttonOnly: await bundle(
    "button",
    `import { Button } from ${JSON.stringify(target)}; console.log(Button);`,
  ),
  selectOnly: await bundle(
    "select",
    `import { Select } from ${JSON.stringify(target)}; console.log(Select);`,
  ),
};
writeFileSync(out, JSON.stringify(results, null, 2));
const kb = (n) => `${(n / 1024).toFixed(1)} KiB`;
for (const k of ["barrel", "buttonOnly", "selectOnly"])
  console.log(
    `[bundle] ${k}: min ${kb(results[k].minBytes)}  gzip ${kb(results[k].gzipBytes)}  (${results[k].inputs} inputs)`,
  );
console.log(`[bundle] wrote ${out}`);
