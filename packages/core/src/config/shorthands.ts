/**
 * Mantine `MantineStyleProps` registered as Tamagui shorthands, so `Box` (and
 * everything built on it) supports the familiar Mantine style props —
 * `<Box m="$md" px="$lg" bg="$color4" c="$color" fz="$lg" maw={320} />` — while
 * still compiling to atomic CSS.
 *
 * Props that Tamagui already exposes natively are intentionally omitted (no
 * alias needed): `opacity`, `top`, `left`, `right`, `bottom`, `inset`,
 * `display`, `flex`. Web-only background props (`bgsz`/`bgp`/`bgr`/`bga`) and the
 * CSS `border` shorthand (`bd`) are omitted too — no cross-platform equivalent.
 */
export const shorthands = {
  // margin
  m: "margin",
  my: "marginVertical",
  mx: "marginHorizontal",
  mt: "marginTop",
  mb: "marginBottom",
  ms: "marginStart",
  me: "marginEnd",
  mis: "marginStart",
  mie: "marginEnd",
  ml: "marginLeft",
  mr: "marginRight",
  // padding
  p: "padding",
  py: "paddingVertical",
  px: "paddingHorizontal",
  pt: "paddingTop",
  pb: "paddingBottom",
  ps: "paddingStart",
  pe: "paddingEnd",
  pis: "paddingStart",
  pie: "paddingEnd",
  pl: "paddingLeft",
  pr: "paddingRight",
  // border / background / color
  bdrs: "borderRadius",
  br: "borderRadius",
  bg: "backgroundColor",
  c: "color",
  // typography
  ff: "fontFamily",
  fz: "fontSize",
  fw: "fontWeight",
  lts: "letterSpacing",
  ta: "textAlign",
  lh: "lineHeight",
  fs: "fontStyle",
  tt: "textTransform",
  td: "textDecorationLine",
  // sizing
  w: "width",
  miw: "minWidth",
  maw: "maxWidth",
  h: "height",
  mih: "minHeight",
  mah: "maxHeight",
  // position
  pos: "position",
} as const;
