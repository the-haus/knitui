// Serves maplibre-gl's web worker from an app's static directory.
//
// maplibre-gl v6 can't find its worker inside a bundle (see
// packages/map/src/worker.ts), so every web surface that renders a map serves
// `maplibre-gl-worker.mjs` plus the `maplibre-gl-shared.mjs` it imports, and
// calls `setWorkerUrl("/maplibre/maplibre-gl-worker.mjs")`.
//
// Called from next.config / metro.config rather than a package script, because
// CI invokes `next build` directly and would skip a prebuild hook. CommonJS so
// metro.config.js can require it.

const fs = require("node:fs");
const path = require("node:path");

const MAPLIBRE_WORKER_FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

/** The installed maplibre-gl `dist/` directory, resolved from `fromDir`. */
function maplibreDistDir(fromDir) {
  const pkg = require.resolve("maplibre-gl/package.json", { paths: [fromDir] });
  return path.join(path.dirname(pkg), "dist");
}

/**
 * Copy the worker and its shared chunk into `destDir`. Files whose contents already
 * match are left alone, so repeated dev reloads don't touch the disk.
 */
function copyMaplibreWorker(fromDir, destDir) {
  const dist = maplibreDistDir(fromDir);
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of MAPLIBRE_WORKER_FILES) {
    const src = path.join(dist, file);
    const dest = path.join(destDir, file);
    const next = fs.readFileSync(src);
    if (fs.existsSync(dest) && fs.readFileSync(dest).equals(next)) continue;
    fs.writeFileSync(dest, next);
  }
}

module.exports = { MAPLIBRE_WORKER_FILES, copyMaplibreWorker, maplibreDistDir };
