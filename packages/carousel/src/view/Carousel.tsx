import * as React from "react";
import { GestureDetector } from "react-native-gesture-handler";

import { ActionIcon } from "@knitui/components";
import { isWeb, type LayoutChangeEvent, type ViewStyle, withStaticProperties } from "@knitui/core";
import { useReducedMotion } from "@knitui/hooks";
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp } from "@knitui/icons";

import { useAutoplay } from "../hooks/useAutoplay";
import { useDragGesture } from "../input/useDragGesture";
import { useKeyboard } from "../input/useKeyboard";
import { useWheel } from "../input/useWheel";
import { useLayout } from "../layouts";
import { resolveConfig, type SeekFn, useCarouselCore } from "../motion/useCarouselCore";
import { Pagination } from "../pagination/Pagination";
import { useResolvedSource } from "../source";
import type { CarouselProps, CarouselRef } from "../types";
import {
  CarouselControls,
  CarouselDot,
  CarouselDots,
  CarouselFrame,
  CarouselIndicators,
  CarouselOverlay,
  CarouselSlots,
  CarouselStylesProvider,
  CarouselViewport,
  SlideBox,
  useCarouselSlots,
} from "./chrome";
import { NativeTrack } from "./NativeTrack";
import { Track } from "./Track";

function CarouselInner<T>(props: CarouselProps<T>, ref: React.Ref<CarouselRef>) {
  const config = resolveConfig(props);
  const { count, vertical, loop, windowSize, prefetchCount, defaultIndex, enabled } = config;
  const native = config.scrollMode === "native";

  // Normalize eager `data` and lazy `source` into one accessor; re-renders as
  // async pages arrive.
  const resolved = useResolvedSource(props.data, props.source);

  // Map engine-space (possibly auto-filled) indices back to real data indices.
  const { rawCount } = config;
  const toReal = React.useCallback(
    (i: number) => (rawCount > 0 ? ((i % rawCount) + rawCount) % rawCount : i),
    [rawCount],
  );
  const getItem = React.useCallback((i: number) => resolved.getItem(toReal(i)), [resolved, toReal]);
  const ensure = React.useCallback(
    (indices: number[]) => resolved.ensure(indices.map(toReal)),
    [resolved, toReal],
  );

  // Autoplay needs the controller; the core needs to pause/resume autoplay.
  // Break the cycle with a ref the core reads lazily.
  const autoplayRef = React.useRef<{ pause: () => void; resume: () => void } | null>(null);
  // In native scroll mode the track registers an imperative seek here so the
  // controller / controlled `index` drive the real scroll container.
  const seekRef = React.useRef<SeekFn | null>(null);
  const registerSeek = React.useCallback((fn: SeekFn | null) => {
    seekRef.current = fn;
  }, []);
  const core = useCarouselCore(props, config, autoplayRef, seekRef);

  // Honour reduced-motion: never auto-advance when the user prefers less motion.
  const reducedMotion = useReducedMotion();
  const autoplay = useAutoplay({
    enabled: (props.autoPlay ?? false) && !reducedMotion,
    reverse: props.autoPlayReverse ?? false,
    interval: props.autoPlayInterval ?? 3000,
    controller: core.controller,
  });
  React.useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay, autoplayRef]);

  // Pause autoplay while the tab/page is hidden (web).
  React.useEffect(() => {
    if (!isWeb || typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") autoplay.pause();
      else autoplay.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [autoplay]);

  React.useImperativeHandle(ref, () => core.controller, [core.controller]);

  const animationStyle = useLayout({
    mode: props.mode,
    modeConfig: props.modeConfig,
    customAnimation: props.customAnimation,
    size: core.pageSize,
    vertical,
  });

  const gesture = useDragGesture({
    offset: core.offset,
    size: core.size,
    config,
    withAnimation: props.withAnimation,
    maxScrollDistancePerSwipe: props.maxScrollDistancePerSwipe,
    minScrollDistancePerSwipe: props.minScrollDistancePerSwipe,
    gestureConfig: props.gestureConfig,
    onStart: core.onInteractionStart,
    onSettle: core.onInteractionEnd,
  });

  const hostRef = React.useRef<unknown>(null);
  useWheel({
    hostRef,
    // Native mode lets the platform own the wheel/trackpad (the scroll container
    // scrolls itself); the custom page-per-wheel handler would fight it.
    enabled: enabled && !native && (props.wheelEnabled ?? true),
    vertical,
    count,
    controller: core.controller,
  });
  useKeyboard({
    hostRef,
    enabled: enabled && (props.keyboardEnabled ?? true),
    vertical,
    count,
    controller: core.controller,
  });

  // Measure the container when no explicit itemSize is given.
  const onLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      props.onLayout?.(e);
      if (config.itemSize > 0) return;
      const { width, height } = e.nativeEvent.layout;
      core.setSize(Math.round(vertical ? height : width));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.itemSize, vertical, core.setSize],
  );

  // Web-only ARIA / focusability so keyboard nav and SRs work. RNW passes these
  // W3C props straight through to the host element. NB: do NOT put `style` here —
  // a `style` key in this spread would clobber the View's own style prop.
  const webProps = isWeb
    ? ({
        role: "region",
        "aria-roledescription": "carousel",
        "aria-label": props.accessibilityLabel,
        tabIndex: enabled && (props.keyboardEnabled ?? true) ? 0 : undefined,
      } as Record<string, unknown>)
    : null;
  // Transform mode: let the browser own the cross-axis scroll; we own the main
  // axis. Native mode leaves `touch-action` alone so the real scroll container
  // handles touch itself.
  const touchActionStyle =
    isWeb && !native
      ? ({ touchAction: vertical ? "pan-x" : "pan-y" } as unknown as ViewStyle)
      : null;

  // Per-slot style sugar + marker-slot chrome (Controls / Indicators / Overlay).
  const s = useCarouselSlots(props.styles);
  const slots = CarouselSlots.collect(props.children, { displayName: "Carousel" });

  // Real-data boundaries for built-in control disabling (loop never disables).
  const realCount = rawCount > 0 ? rawCount : count;
  const prevDisabled = !loop && core.activeIndex <= 0;
  const nextDisabled = !loop && core.activeIndex >= realCount - 1;

  const controls =
    slots.Controls || props.withControls ? (
      <CarouselControls
        flexDirection={vertical ? "column" : "row"}
        {...(props.controlsPosition === "outside"
          ? { top: 0, bottom: 0, left: 0, right: 0 }
          : null)}
        {...s.get("controls")}
      >
        {slots.Controls ? (
          slots.Controls.children
        ) : (
          <>
            <NavButton
              direction="prev"
              vertical={vertical}
              disabled={prevDisabled}
              onPress={() => core.controller.prev()}
              render={props.renderControl}
              controlProps={s.get("control")}
            />
            <NavButton
              direction="next"
              vertical={vertical}
              disabled={nextDisabled}
              onPress={() => core.controller.next()}
              render={props.renderControl}
              controlProps={s.get("control")}
            />
          </>
        )}
      </CarouselControls>
    ) : null;

  const indicators =
    slots.Indicators || props.withIndicators ? (
      <CarouselIndicators orientation={vertical ? "vertical" : "horizontal"}>
        {slots.Indicators ? (
          slots.Indicators.children
        ) : (
          <Pagination
            progress={core.progress}
            count={realCount}
            vertical={vertical}
            onPress={(i) => core.controller.scrollTo({ index: i })}
            styles={{ dots: s.get("dots"), dot: s.get("dot"), activeDot: s.get("activeDot") }}
          />
        )}
      </CarouselIndicators>
    ) : null;

  const overlay = slots.Overlay ? (
    <CarouselOverlay>{slots.Overlay.children}</CarouselOverlay>
  ) : null;

  return (
    <CarouselStylesProvider value={props.styles}>
      <CarouselFrame
        ref={hostRef as never}
        testID={props.testID}
        orientation={vertical ? "vertical" : "horizontal"}
        // Native a11y label only; on web the label rides on `aria-label` (webProps).
        // Passing the RN prop key on web — even as `undefined` — leaks it to the DOM.
        {...(!isWeb ? { accessibilityLabel: props.accessibilityLabel } : null)}
        onLayout={onLayout}
        {...s.get("root")}
        style={[touchActionStyle, props.style]}
        {...webProps}
      >
        {native ? (
          <CarouselViewport collapsable={false} {...s.get("viewport")}>
            {core.pageSize > 0 ? (
              <NativeTrack
                getItem={getItem}
                ensure={ensure}
                renderItem={props.renderItem}
                renderPlaceholder={props.renderPlaceholder}
                keyExtractor={props.keyExtractor}
                count={count}
                loop={loop}
                vertical={vertical}
                pageSize={core.pageSize}
                defaultIndex={defaultIndex}
                offset={core.offset}
                size={core.size}
                enabled={enabled}
                snapEnabled={config.snapEnabled}
                pagingEnabled={config.pagingEnabled}
                overscrollEnabled={config.overscrollEnabled}
                contentContainerStyle={props.contentContainerStyle}
                onInteractionStart={core.onInteractionStart}
                onInteractionEnd={core.onInteractionEnd}
                registerSeek={registerSeek}
                testID={props.testID ? `${props.testID}-scroll` : undefined}
              />
            ) : null}
          </CarouselViewport>
        ) : (
          <GestureDetector gesture={gesture}>
            <CarouselViewport
              collapsable={false}
              {...s.get("viewport")}
              style={props.contentContainerStyle}
            >
              {core.pageSize > 0 ? (
                <Track
                  getItem={getItem}
                  ensure={ensure}
                  renderItem={props.renderItem}
                  renderPlaceholder={props.renderPlaceholder}
                  keyExtractor={props.keyExtractor}
                  count={count}
                  loop={loop}
                  vertical={vertical}
                  windowSize={windowSize}
                  prefetchCount={prefetchCount}
                  defaultIndex={defaultIndex}
                  pageSize={core.pageSize}
                  offset={core.offset}
                  size={core.size}
                  animationStyle={animationStyle}
                />
              ) : null}
            </CarouselViewport>
          </GestureDetector>
        )}
        {controls}
        {indicators}
        {overlay}
      </CarouselFrame>
    </CarouselStylesProvider>
  );
}

/** Direction of a built-in nav button. */
type NavDirection = "prev" | "next";

interface NavButtonProps {
  direction: NavDirection;
  vertical: boolean;
  disabled: boolean;
  onPress: () => void;
  render?: CarouselProps<unknown>["renderControl"];
  controlProps?: Partial<React.ComponentProps<typeof ActionIcon>>;
}

/**
 * One built-in prev/next control. Reuses `ActionIcon` + `@knitui/icons` chevrons
 * (matches `icons-in-components`); `pointerEvents:"auto"` so it takes taps inside
 * the `box-none` controls overlay. `renderControl` fully overrides it.
 */
function NavButton({
  direction,
  vertical,
  disabled,
  onPress,
  render,
  controlProps,
}: NavButtonProps) {
  const label = direction === "prev" ? "Previous slide" : "Next slide";
  if (render) return render(direction, { onPress, disabled, accessibilityLabel: label });
  const Icon =
    direction === "prev"
      ? vertical
        ? IconChevronUp
        : IconChevronLeft
      : vertical
        ? IconChevronDown
        : IconChevronRight;
  return (
    <ActionIcon
      variant="default"
      radius="xl"
      pointerEvents="auto"
      onPress={onPress}
      disabled={disabled}
      // Web a11y rides on `aria-label`; native on `accessibilityLabel`. Passing
      // the RN prop on web leaks it to the DOM as an unknown attribute.
      {...(isWeb ? { "aria-label": label } : { accessibilityLabel: label })}
      {...controlProps}
    >
      <Icon />
    </ActionIcon>
  );
}

/**
 * Cross-platform carousel / slider. Generic over the item type `T`; the
 * `forwardRef` cast preserves that generic at the call site.
 */
const CarouselComponent = React.forwardRef(CarouselInner) as <T>(
  props: CarouselProps<T> & { ref?: React.Ref<CarouselRef> },
) => React.ReactElement;

/**
 * Public surface. Marker slots (`Carousel.Controls` / `.Indicators` /
 * `.Overlay`) are the children-driven composition API; the styled parts
 * (`Frame` / `Viewport` / `Slide` / `Dots` / `Dot`) are exposed for advanced
 * theming and as the targets of the `styles` map.
 */
export const Carousel = withStaticProperties(CarouselComponent, {
  ...CarouselSlots.markers, // Controls, Indicators, Overlay (marker slots)
  Frame: CarouselFrame,
  Viewport: CarouselViewport,
  Slide: SlideBox,
  Dots: CarouselDots,
  Dot: CarouselDot,
});
