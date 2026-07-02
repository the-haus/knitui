/**
 * @knitui/carousel — a cross-platform (React Native + Web) carousel/slider.
 *
 * Clean-sheet design; see `docs/fresh-carousel-plan.md` for the full plan.
 *
 * The motion math lives in a platform-free, reanimated-free engine (`./engine`,
 * re-exported below for advanced use); the React surface is `<Carousel>` plus
 * the decoupled `<Pagination>`.
 */

export * as engine from "./engine";
export { Pagination, type PaginationProps, type PaginationStyles } from "./pagination/Pagination";
export {
  type DotStyle,
  PaginationItem,
  type PaginationItemAccessibilityOverrides,
  type PaginationItemProps,
} from "./pagination/PaginationItem";
export {
  type BasicPaginationProps,
  type CustomPaginationProps,
  Basic as PaginationBasic,
  Custom as PaginationCustom,
} from "./pagination/variants";
export { type AsyncSlideSourceOptions, createAsyncSlideSource, type SlideSource } from "./source";
export type {
  AnimationStyle,
  CarouselMode,
  CarouselProps,
  CarouselRef,
  CoverflowConfig,
  CubeConfig,
  DepthConfig,
  FadeConfig,
  FlipConfig,
  OnProgressChange,
  ParallaxConfig,
  RenderItem,
  RenderItemInfo,
  RotateConfig,
  ScaleConfig,
  ScrollToOptions,
  StackConfig,
  StepOptions,
  WithAnimation,
} from "./types";
export { Carousel } from "./view/Carousel";

export {
  CarouselControls,
  CarouselDot,
  CarouselDots,
  CarouselFrame,
  CarouselIndicators,
  CarouselOverlay,
  type CarouselStyles,
  CarouselViewport,
  SlideBox,
} from "./view/chrome";
