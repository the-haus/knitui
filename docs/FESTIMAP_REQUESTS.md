# Festimap requests

What Festimap (the-haus/festimap) has asked of `@knitui/*`, mirrored from its
`docs/KNITUI_REQUESTS.md`. Each item names the need, where it is handled here,
and its status. A released item is deleted (history:
`git log -- docs/FESTIMAP_REQUESTS.md`); Festimap deletes its own workaround
when the release lands.

**Status: 1 open (fixed on a branch, unreleased).**

## K-01 (P2): the web `Image` takes `srcSet`, `sizes`, intrinsic size, `decoding`, `fetchPriority`, `<picture>` format `sources` and a CSS-background placeholder

- **Need.** Festimap serves every catalogue picture from its image CDN in a
  fixed variant grid (`i/<hash>/<width>.avif`, widths 96 / 256 / 512 / 1024 /
  1600). On the web the browser should pick the variant itself (by the layout
  width and the device pixel ratio) and know the aspect ratio before the bytes
  arrive, and a decoded ThumbHash (`data:` URL) should show in the server HTML
  as the image box's preview. A browser without AVIF (Safari < 16, ~5%)
  must get the WebP variants instead, and an AVIF-capable one must download
  only the AVIF: the standard `<picture><source type="image/avif">` + WebP
  `<img>` fallback.
- **Was (1.1.0).** `srcSet` / `sizes` / `decoding` fell into `...rest` and
  landed on the wrapper `View`; numeric `width` / `height` sized the wrapper
  but never reached the `<img>` as attributes; a URL placeholder was a second
  `<img>`.
- **Fix (branch `feat/image-web-responsive`, changesets
  `image-web-responsive.md` and `image-web-sources.md`, both minor).** `packages/components/src/Image/`:
  - `types.ts`: `ImageWebProps` (`srcSet`, `sizes`, `decoding`,
    `fetchPriority`, `loading`, `sources: ImageWebSource[]`) on `ImageProps`, exported
    from the package with `ImageWebSource` (`{ srcSet, type, sizes?, media? }`).
  - `Image.tsx` (web): the four written on the `<img>` (candidates before
    `src`), `fetchPriority` winning over `priority`; the first source's finite
    `width` / `height` written as the `<img>`'s attributes (style still fills
    the box); a URL / `data:` placeholder painted as a CSS background layer
    under the `<img>` (`placeholderContentFit` → `background-size`,
    `contentPosition` → `background-position`), gone once the photo loads.
    `sources` (non-empty) wraps the `<img>` in a `display: contents`
    `<picture>` with one `<source>` per entry before it; the `<img>` keeps its
    attributes and stays the element with `onLoad` / `onError`.
  - `createImage.tsx`: the six in the inline-prop set (Tamagui never reads
    them); `withoutWebOnlyProps` drops them on native before expo-image.
    After an error, `fallbackSrc` renders without the primary's `srcSet` /
    `sizes` / `sources` (else the browser keeps picking the failed variant).
  - Tests in `Image.test.tsx` ("responsive <img> attributes (Festimap K-01)",
    "on native: web-only attributes"): attributes on the `<img>` not the
    wrapper, in `renderToString` output ahead of `src`, the placeholder layer
    in the SSR HTML and removed on load, nothing reaching native; "format
    fallback through <picture> sources": `<source>`s in order before the
    `<img>`, `display: contents`, in the SSR HTML, the `<img>` still loading /
    erroring, `fallbackSrc` alone after an error.
- **Festimap side until released.** A pnpm patch of `@knitui/components@1.1.0`
  (`patches/@knitui__components@1.1.0.patch`, `patchedDependencies` in its
  `pnpm-workspace.yaml`), deleted when the release lands.
