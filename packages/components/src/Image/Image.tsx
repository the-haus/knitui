import { Image as ExpoImage } from "expo-image";

import { createImage } from "./createImage";
import { objectFitToContentFit } from "./shared";

/**
 * Cross-platform `Image`, backed by [expo-image](https://docs.expo.dev/versions/latest/sdk/image/)
 * on web, iOS, and Android. The same file resolves on every platform because
 * expo-image ships platform builds (a real `<img>` on web, native views on
 * device), so there is no `.native` split.
 *
 * On top of expo-image's full prop surface (`transition`, `placeholder`,
 * `cachePolicy`, `tintColor`, `blurRadius`, `priority`, …) it adds the unified,
 * Mantine-compatible API: `src`, `fit`/`objectFit` (→ `contentFit`),
 * `objectPosition` (→ `contentPosition`), `radius`, `fallbackSrc`, plus Tamagui
 * styling props (`w`, `h`, `bg`, `$token`s). expo-image's static methods
 * (`Image.prefetch`, `Image.clearMemoryCache`, …) are forwarded as-is.
 *
 * @example
 * <Image
 *   src="https://example.com/photo.jpg"
 *   fallbackSrc="https://example.com/placeholder.jpg"
 *   fit="cover"
 *   radius="md"
 *   transition={300}
 *   w={320}
 *   h={180}
 * />
 */
export const Image = createImage({
  Component: ExpoImage,
  resizeModePropName: "contentFit",
  objectPositionPropName: "contentPosition",
  mapObjectFitToResizeMode: objectFitToContentFit,
});
