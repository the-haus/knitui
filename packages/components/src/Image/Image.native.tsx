import { Image as ExpoImage } from "expo-image";

import { createImage } from "./createImage";
import { objectFitToContentFit } from "./shared";

/**
 * Native `Image` (iOS / Android), backed by
 * [expo-image](https://docs.expo.dev/versions/latest/sdk/image/). The web twin
 * (`Image.tsx`) renders its own `<img>` with the same props: expo-image's web
 * build mounts its `<img>` only after an effect and replays the fade on every
 * mount, so an image the browser already had blinked each time it came back.
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
