const path = require("path");

// Metro config for an Expo app inside a pnpm monorepo.
const { getDefaultConfig } = require("expo/metro-config");

const withKnitui = require("@knitui/plugins/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so edits in packages/* trigger fast refresh.
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from the app and the hoisted root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Honor package "exports"/"react-native"/"source" (Metro follows pnpm
//    symlinks by default).
config.resolver.unstable_enablePackageExports = true;

// 4. Serve maplibre-gl's worker from public/ for the web build; the root layout
//    points the map at it (scripts/maplibre-worker.cjs explains why).
require("../../scripts/maplibre-worker.cjs").copyMaplibreWorker(
  projectRoot,
  path.join(projectRoot, "public", "maplibre"),
);

// 5. Run the Tamagui v3 compiler (@tamagui/cli/metro; kit config + components
//    baked in). It is the only compiler on v3 (no babel plugin): it flattens the
//    kit's styled() components, extracts atomic CSS for web and hoists static
//    styles on native. Wraps last so it sees the resolver tweaks. After a
//    Tamagui config change restart with `npx expo start -c`.
module.exports = withKnitui(config);
