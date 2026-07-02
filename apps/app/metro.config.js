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

// 3. Follow pnpm symlinks and honor package "exports"/"react-native"/"source".
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// 4. Run the Tamagui compiler (kit config + components baked in). Flattens the
//    kit's styled() components and extracts atomic CSS for the web output;
//    a no-op style cost on native. Wraps last so it sees the resolver tweaks.
module.exports = withKnitui(config);
