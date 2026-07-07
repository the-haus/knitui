import * as React from "react";
import { useSharedValue } from "react-native-reanimated";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { Carousel, createAsyncSlideSource, Pagination } from "./index";
import type { CarouselProps, CarouselRef } from "./types";

const COLORS = ["#0A7EA4", "#E0245E", "#17BF63", "#794BC4", "#F45D22", "#1B95E0"];
const DATA = Array.from({ length: 6 }, (_, i) => i);

function Slide({ index, label }: { index: number; label?: string }) {
  return (
    <Box
      style={{
        flex: 1,
        margin: 4,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS[index % COLORS.length],
      }}
    >
      <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>{label ?? index + 1}</Text>
    </Box>
  );
}

/** A richer slide — media band + copy — for the "real content" examples. */
function Card({ index }: { index: number }) {
  return (
    <Box
      style={{
        flex: 1,
        margin: 4,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#E6E8EB",
      }}
    >
      <Box
        style={{
          height: 110,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS[index % COLORS.length],
        }}
      >
        <Text style={{ color: "white", fontSize: 32, fontWeight: "800" }}>{index + 1}</Text>
      </Box>
      <Box style={{ padding: 12, gap: 4 }}>
        <Text style={{ fontWeight: "700", fontSize: 15 }}>Slide {index + 1}</Text>
        <Text style={{ color: "#687076", fontSize: 13 }}>A richer card with media + copy.</Text>
      </Box>
    </Box>
  );
}

const renderItem: CarouselProps<number>["renderItem"] = ({ index }) => <Slide index={index} />;

const meta: Meta<typeof Carousel<number>> = {
  title: "Carousel",
  component: Carousel,
};
export default meta;

type Story = StoryObj<typeof Carousel<number>>;

const frame = { width: 320, height: 200 } as const;

/* ------------------------------------------------------------------ Basics */

export const Basic: Story = {
  name: "Basics / Default",
  render: () => <Carousel data={DATA} renderItem={renderItem} style={frame} testID="carousel" />,
};

export const NonLoop: Story = {
  name: "Basics / Without loop",
  render: () => (
    <Carousel data={DATA} loop={false} renderItem={renderItem} style={frame} testID="carousel" />
  ),
};

export const Vertical: Story = {
  name: "Basics / Vertical",
  render: () => (
    <Carousel data={DATA} vertical renderItem={renderItem} style={frame} testID="carousel" />
  ),
};

export const MultiplePerView: Story = {
  name: "Basics / Multiple per view",
  render: () => (
    <Carousel
      data={DATA}
      itemSize={140}
      renderItem={renderItem}
      style={{ width: 420, height: 200 }}
      testID="carousel"
    />
  ),
};

export const PeekNeighbours: Story = {
  name: "Basics / Peek neighbours",
  render: () => (
    <Carousel data={DATA} itemWidth={240} renderItem={renderItem} style={frame} testID="carousel" />
  ),
};

export const InitialIndex: Story = {
  name: "Basics / Initial index",
  render: () => (
    <Carousel
      data={DATA}
      defaultIndex={3}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const CardContent: Story = {
  name: "Basics / Card content",
  render: () => (
    <Carousel
      data={DATA}
      itemWidth={240}
      renderItem={({ index }) => <Card index={index} />}
      style={{ width: 320, height: 220 }}
      testID="carousel"
    />
  ),
};

/* -------------------------------------------------------------- Playback */

export const Autoplay: Story = {
  name: "Playback / Autoplay",
  render: () => (
    <Carousel
      data={DATA}
      autoPlay
      autoPlayInterval={1500}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const AutoplayReverse: Story = {
  name: "Playback / Autoplay reverse",
  render: () => (
    <Carousel
      data={DATA}
      autoPlay
      autoPlayReverse
      autoPlayInterval={1500}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

/* ----------------------------------------------------------- Transitions */

export const Fade: Story = {
  name: "Transitions / Fade",
  render: () => (
    <Carousel data={DATA} mode="fade" renderItem={renderItem} style={frame} testID="carousel" />
  ),
};

export const Scale: Story = {
  name: "Transitions / Scale",
  render: () => (
    <Carousel
      data={DATA}
      mode="scale"
      itemWidth={240}
      modeConfig={{ inactiveScale: 0.8, inactiveOpacity: 0.6 }}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const Parallax: Story = {
  name: "Transitions / Parallax",
  render: () => (
    <Carousel
      data={DATA}
      mode="parallax"
      modeConfig={{ parallaxScrollingScale: 0.85, parallaxScrollingOffset: 50 }}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const RotateFan: Story = {
  name: "Transitions / Rotate fan",
  render: () => (
    <Carousel
      data={DATA}
      mode="rotate"
      itemWidth={240}
      modeConfig={{ rotateZDeg: 14 }}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const Coverflow: Story = {
  name: "Transitions / Coverflow",
  render: () => (
    <Carousel
      data={DATA}
      mode="coverflow"
      itemWidth={200}
      modeConfig={{ rotateYDeg: 55, spacing: 0.6 }}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const Flip: Story = {
  name: "Transitions / Flip",
  render: () => (
    <Carousel
      data={DATA}
      mode="flip"
      modeConfig={{ perspective: 800 }}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const Cube: Story = {
  name: "Transitions / Cube",
  render: () => (
    <Carousel
      data={DATA}
      mode="cube"
      modeConfig={{ perspective: 800 }}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const Depth: Story = {
  name: "Transitions / Depth",
  render: () => (
    <Carousel data={DATA} mode="depth" renderItem={renderItem} style={frame} testID="carousel" />
  ),
};

export const HorizontalStack: Story = {
  name: "Transitions / Horizontal stack",
  render: () => (
    <Carousel
      data={DATA}
      mode="horizontal-stack"
      modeConfig={{ showLength: 3 }}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const VerticalStack: Story = {
  name: "Transitions / Vertical stack",
  render: () => (
    <Carousel
      data={DATA}
      mode="vertical-stack"
      modeConfig={{ showLength: 3 }}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const CustomAnimation: Story = {
  name: "Transitions / Custom animation",
  render: () => (
    <Carousel
      data={DATA}
      // A hand-rolled coverflow-style worklet via `customAnimation` (overrides `mode`).
      // The worklet must translate the slide itself (progress × page size).
      customAnimation={(progress) => {
        "worklet";
        const dist = Math.min(Math.abs(progress), 1);
        return {
          transform: [
            { translateX: progress * frame.width },
            { perspective: 800 },
            { rotateY: `${progress * -20}deg` },
            { scale: 1 - dist * 0.25 },
          ],
          opacity: 1 - dist * 0.4,
        };
      }}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

/* ------------------------------------------------------------ Pagination */

export const WithPagination: Story = {
  name: "Pagination / Default",
  render: () => {
    const progress = useSharedValue(0);
    const ref = React.useRef<CarouselRef>(null);
    return (
      <Box style={{ gap: 12 }}>
        <Carousel
          ref={ref}
          data={DATA}
          progress={progress}
          renderItem={renderItem}
          style={frame}
          testID="carousel"
        />
        <Pagination
          progress={progress}
          count={DATA.length}
          onPress={(i) => ref.current?.scrollTo({ index: i })}
          styles={{ activeDot: { backgroundColor: "#0A7EA4" } }}
        />
      </Box>
    );
  },
};

export const PaginationBasicVariant: Story = {
  name: "Pagination / Basic variant",
  render: () => {
    const progress = useSharedValue(0);
    const ref = React.useRef<CarouselRef>(null);
    return (
      <Box style={{ gap: 12 }}>
        <Carousel
          ref={ref}
          data={DATA}
          onProgressChange={progress}
          renderItem={renderItem}
          style={frame}
          testID="carousel"
        />
        <Pagination.Basic
          progress={progress}
          data={DATA}
          size={12}
          dotStyle={{ borderRadius: 6, backgroundColor: "#C8CDD0" }}
          activeDotStyle={{ backgroundColor: "#0A7EA4" }}
          onPress={(i) => ref.current?.scrollTo({ index: i })}
          carouselName="Showcase"
        />
      </Box>
    );
  },
};

export const PaginationCustomVariant: Story = {
  name: "Pagination / Custom variant",
  render: () => {
    const progress = useSharedValue(0);
    const ref = React.useRef<CarouselRef>(null);
    return (
      <Box style={{ gap: 12 }}>
        <Carousel
          ref={ref}
          data={DATA}
          onProgressChange={progress}
          renderItem={renderItem}
          style={frame}
          testID="carousel"
        />
        <Pagination.Custom
          progress={progress}
          data={DATA}
          size={14}
          dotStyle={{ borderRadius: 7, backgroundColor: "#C8CDD0" }}
          activeDotStyle={{ borderRadius: 7, backgroundColor: "#0A7EA4" }}
          onPress={(i) => ref.current?.scrollTo({ index: i })}
          // Worklet: grow + brighten the dot nearest the current item.
          customReanimatedStyle={(value, index, length) => {
            "worklet";
            let distance = Math.abs(value - index);
            if (index === 0 && value > length - 1) distance = Math.abs(value - length);
            const scale = 1 - Math.min(distance, 1) * 0.4;
            return { transform: [{ scale }] };
          }}
        />
      </Box>
    );
  },
};

/* ---------------------------------------------------------------- Chrome */

export const BuiltInControls: Story = {
  name: "Chrome / Built-in controls",
  render: () => (
    <Carousel data={DATA} withControls renderItem={renderItem} style={frame} testID="carousel" />
  ),
};

export const BuiltInIndicators: Story = {
  name: "Chrome / Built-in indicators",
  render: () => (
    <Carousel data={DATA} withIndicators renderItem={renderItem} style={frame} testID="carousel" />
  ),
};

export const FullChrome: Story = {
  name: "Chrome / Controls + indicators",
  render: () => (
    <Carousel
      data={DATA}
      withControls
      withIndicators
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const ControlsOutside: Story = {
  name: "Chrome / Controls outside",
  render: () => (
    <Box style={{ paddingHorizontal: 28 }}>
      <Carousel
        data={DATA}
        withControls
        controlsPosition="outside"
        renderItem={renderItem}
        style={frame}
        testID="carousel"
      />
    </Box>
  ),
};

export const Styles: Story = {
  name: "Chrome / Per-slot styles",
  render: () => (
    <Carousel
      data={DATA}
      withControls
      withIndicators
      renderItem={renderItem}
      // Per-slot `styles` sugar — every key maps to a styled part.
      styles={{
        root: { borderRadius: 16, borderWidth: 2, borderColor: "$blue8" },
        slide: { padding: 8 },
        control: { variant: "filled", radius: "md" },
        dot: { backgroundColor: "$blue6" },
        activeDot: { backgroundColor: "$blue10" },
      }}
      style={frame}
      testID="carousel"
    />
  ),
};

export const CustomChrome: Story = {
  name: "Chrome / Custom chrome (marker slots)",
  render: () => {
    const ref = React.useRef<CarouselRef>(null);
    return (
      <Carousel ref={ref} data={DATA} renderItem={renderItem} style={frame} testID="carousel">
        <Carousel.Overlay>
          <Box
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Featured</Text>
          </Box>
        </Carousel.Overlay>
        <Carousel.Controls>
          <Text testID="prev" onPress={() => ref.current?.prev()} style={{ fontSize: 24 }}>
            ◀
          </Text>
          <Text testID="next" onPress={() => ref.current?.next()} style={{ fontSize: 24 }}>
            ▶
          </Text>
        </Carousel.Controls>
      </Carousel>
    );
  },
};

/* ------------------------------------------------------------------- API */

export const ImperativeControls: Story = {
  name: "API / Imperative controls",
  render: () => {
    const ref = React.useRef<CarouselRef>(null);
    return (
      <Box style={{ gap: 12 }}>
        <Carousel ref={ref} data={DATA} renderItem={renderItem} style={frame} testID="carousel" />
        <Box style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
          <Text testID="prev" onPress={() => ref.current?.prev()} style={{ fontSize: 18 }}>
            ◀ Prev
          </Text>
          <Text testID="next" onPress={() => ref.current?.next()} style={{ fontSize: 18 }}>
            Next ▶
          </Text>
        </Box>
      </Box>
    );
  },
};

export const ControlledIndex: Story = {
  name: "API / Controlled index",
  render: () => {
    const [index, setIndex] = React.useState(0);
    return (
      <Box style={{ gap: 12 }}>
        <Carousel
          data={DATA}
          index={index}
          onIndexChange={setIndex}
          renderItem={renderItem}
          style={frame}
          testID="carousel"
        />
        <Text style={{ textAlign: "center", color: "#687076" }}>Active slide: {index + 1}</Text>
        <Box style={{ flexDirection: "row", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {DATA.map((i) => (
            <Text
              key={i}
              testID={`go-${i}`}
              onPress={() => setIndex(i)}
              style={{ fontSize: 16, fontWeight: index === i ? "800" : "400" }}
            >
              {i + 1}
            </Text>
          ))}
        </Box>
      </Box>
    );
  },
};

export const FixedDirection: Story = {
  name: "API / Fixed direction",
  render: () => {
    const ref = React.useRef<CarouselRef>(null);
    return (
      <Box style={{ gap: 12 }}>
        <Carousel
          ref={ref}
          data={DATA}
          fixedDirection="positive"
          renderItem={renderItem}
          style={frame}
          testID="carousel"
        />
        <Text style={{ textAlign: "center", color: "#687076" }}>
          Jumps always travel forward (loop)
        </Text>
        <Box style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
          <Text testID="jump-0" onPress={() => ref.current?.scrollTo({ index: 0 })}>
            ① Go to 1
          </Text>
          <Text testID="jump-5" onPress={() => ref.current?.scrollTo({ index: 5 })}>
            ⑥ Go to 6
          </Text>
        </Box>
      </Box>
    );
  },
};

/* ------------------------------------------------------------------ Data */

export const LargeData: Story = {
  name: "Data / Large dataset",
  render: () => (
    <Carousel
      data={Array.from({ length: 5000 }, (_, i) => i)}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const RemoteAsyncData: Story = {
  name: "Data / Remote async",
  render: () => {
    const source = React.useMemo(
      () =>
        createAsyncSlideSource<number>({
          length: 500,
          pageSize: 10,
          // Simulate a paged network fetch with latency.
          fetchRange: (start, count) =>
            new Promise((resolve) =>
              setTimeout(() => resolve(Array.from({ length: count }, (_, i) => start + i)), 400),
            ),
        }),
      [],
    );
    return (
      <Carousel
        source={source}
        renderItem={({ item }) => <Slide index={item} label={String(item + 1)} />}
        renderPlaceholder={() => (
          <Box
            style={{
              flex: 1,
              margin: 4,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#E6E8EB",
            }}
          >
            <Text style={{ color: "#687076" }}>Loading…</Text>
          </Box>
        )}
        style={frame}
        testID="carousel"
      />
    );
  },
};

/* ------------------------------------------------------------ Native scroll */

export const NativeScroll: Story = {
  name: "Native scroll / Default",
  render: () => (
    <Carousel
      data={DATA}
      scrollMode="native"
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const NativeScrollFree: Story = {
  name: "Native scroll / Free (no snap)",
  render: () => (
    <Carousel
      data={DATA}
      scrollMode="native"
      snapEnabled={false}
      itemWidth={200}
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const NativeScrollLoopingRail: Story = {
  name: "Native scroll / Looping rail (start-aligned)",
  render: () => (
    // A media-card rail: start-aligned (first card at the leading edge, not
    // centered) AND infinitely looping. Native mode clones the ring and
    // silently recentres on settle, so free-scrolling wraps seamlessly.
    <Carousel
      data={DATA}
      scrollMode="native"
      snapEnabled={false}
      itemWidth={160}
      renderItem={renderItem}
      style={{ width: 420, height: 200 }}
      testID="carousel"
    />
  ),
};

export const NativeScrollFinite: Story = {
  name: "Native scroll / Finite rail (loop off)",
  render: () => (
    // The same rail with looping disabled: a finite start-aligned row that
    // stops at the last card.
    <Carousel
      data={DATA}
      scrollMode="native"
      snapEnabled={false}
      loop={false}
      itemWidth={160}
      renderItem={renderItem}
      style={{ width: 420, height: 200 }}
      testID="carousel"
    />
  ),
};

export const NativeScrollMultiple: Story = {
  name: "Native scroll / Multiple per view",
  render: () => (
    <Carousel
      data={DATA}
      scrollMode="native"
      itemWidth={160}
      renderItem={renderItem}
      style={{ width: 420, height: 200 }}
      testID="carousel"
    />
  ),
};

export const NativeScrollVertical: Story = {
  name: "Native scroll / Vertical",
  render: () => (
    <Carousel
      data={DATA}
      scrollMode="native"
      vertical
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const NativeScrollPaged: Story = {
  name: "Native scroll / One page per swipe",
  render: () => (
    <Carousel
      data={DATA}
      scrollMode="native"
      pagingEnabled
      renderItem={renderItem}
      style={frame}
      testID="carousel"
    />
  ),
};

export const NativeScrollWithChrome: Story = {
  name: "Native scroll / Controls + indicators",
  render: () => {
    const progress = useSharedValue(0);
    const ref = React.useRef<CarouselRef>(null);
    return (
      <Box style={{ gap: 12 }}>
        <Carousel
          ref={ref}
          data={DATA}
          scrollMode="native"
          progress={progress}
          withControls
          renderItem={renderItem}
          style={frame}
          testID="carousel"
        />
        <Pagination
          progress={progress}
          count={DATA.length}
          onPress={(i) => ref.current?.scrollTo({ index: i })}
        />
      </Box>
    );
  },
};
