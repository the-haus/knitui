/**
 * Stub for `react-native/Libraries/Image/AssetRegistry` in the @knitui/graphics
 * Storybook.
 *
 * Skia's `Platform.web.js` `resolveAsset` lazily
 * `require("react-native/Libraries/Image/AssetRegistry")` to turn a numeric
 * (require()'d) image source into a URI. That module ships with react-native but
 * not react-native-web (which we alias react-native to), so the bundler can't
 * resolve it. @knitui/graphics stories only use string image URLs, never numeric
 * assets, so this branch is dead — but it still has to *resolve*. These no-ops
 * satisfy the import; `getAssetByID` throws only if a numeric source actually
 * reaches it.
 */
export function registerAsset() {
  return 0;
}

export function getAssetByID() {
  throw new Error(
    "[@knitui/graphics] Numeric/require()'d image assets aren't supported on web in Storybook — use a URL string source instead.",
  );
}
