/**
 * Next.js + Tamagui + react-native-web.
 *
 * `@knitui/core/next-plugin` wraps `@tamagui/next-plugin` with the kit's config
 * and component list baked in. It runs the Tamagui compiler (flattening the
 * kit's `styled()` components into atomic CSS at build time) and ALSO handles
 * the `react-native` -> `react-native-web` alias, the `.web.*` resolution
 * order, and the `__DEV__` define — so the hand-rolled `webpack()` block this
 * file used to carry is gone.
 *
 * `transpilePackages` still lists the workspace packages + RNW so Next compiles
 * their untranspiled source.
 *
 * @type {import('next').NextConfig}
 */
import { withKnitui } from "@knitui/plugins/next-plugin";

import maplibreWorker from "../../scripts/maplibre-worker.cjs";

// maplibre-gl v6 needs its worker served as a static file; `page.tsx` points
// `setWorkerUrl` at it (see scripts/maplibre-worker.cjs).
maplibreWorker.copyMaplibreWorker(import.meta.dirname, `${import.meta.dirname}/public/maplibre`);

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "react-native-web",
    "react-native-reanimated",
    "react-native-gesture-handler",
    "expo",
    "expo-image",
    "expo-modules-core",
    "maplibre-gl",
    "@knitui/core",
    "@knitui/plugins",
    "@knitui/components",
    "@knitui/dates",
    "@knitui/icons",
    "@knitui/hooks",
    "@knitui/map",
    "@knitui/graphics",
    "@knitui/mediaquery",
    "@knitui/demo",
  ],
};

export default withKnitui(nextConfig);
