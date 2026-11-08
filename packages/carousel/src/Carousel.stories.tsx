import * as React from "react";
import { useSharedValue } from "react-native-reanimated";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Box, Button, Group, Image, Text } from "@knitui/components";
import { isWeb } from "@knitui/core";

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

/* ------------------------------------------------------------ Stack decks */

const DECK_SIZE = 24;
const DECK = Array.from({ length: DECK_SIZE }, (_, i) => i);
const DECK_TITLES = [
  "Harbour Lights",
  "North Sea Jazz",
  "Field Day",
  "Kite Fest",
  "Open Air Cinema",
  "Night Market",
];
/** Card height; the page adds room under it for the peeking cards. */
const DECK_CARD = 252;
const DECK_PEEK = 44;
const DECK_PAGE = DECK_CARD + DECK_PEEK;
const DECK_WIDTH = 320;

/** A real event card — image, copy, badge, buttons — the stack decks page through. */
function DeckCard({ index, badge, caption }: { index: number; badge?: string; caption?: string }) {
  return (
    <Box
      style={{
        height: DECK_CARD,
        marginHorizontal: 8,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#E6E8EB",
      }}
    >
      <Image
        src={`https://picsum.photos/seed/knitui-deck-${index}/640/240`}
        fit="cover"
        width="100%"
        height={104}
        alt=""
      />
      <Box style={{ padding: 12, gap: 6 }}>
        <Group gap="xs">
          <Badge size="sm">{badge ?? `#${index + 1}`}</Badge>
          <Text style={{ fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
            {DECK_TITLES[index % DECK_TITLES.length]}
          </Text>
        </Group>
        <Text style={{ color: "#687076", fontSize: 13 }} numberOfLines={2}>
          {caption ??
            `Card ${index + 1} of ${DECK_SIZE}. Swipe up/down for the stack, sideways to page.`}
        </Text>
        <Group gap="xs">
          <Button size="xs" variant="light">
            Save
          </Button>
          <Button size="xs" variant="default">
            Directions
          </Button>
        </Group>
      </Box>
    </Box>
  );
}

const deckItem: CarouselProps<number>["renderItem"] = ({ item }) => <DeckCard index={item} />;

/**
 * The deck steps DOWN into the `DECK_PEEK` slack under each card (the default
 * `snapDirection`). With `"right"` a vertical deck steps up instead, so the card
 * would need its slack above it.
 */
const DECK_STACK = { showLength: 3, stackInterval: 16 } as const;

/** Shared props of the stack-deck stories (a controlled, non-looping vertical stack). */
function useDeck() {
  const [index, setIndex] = React.useState(0);
  return {
    index,
    setIndex,
    props: {
      data: DECK,
      vertical: true,
      loop: false,
      mode: "vertical-stack",
      modeConfig: DECK_STACK,
      itemHeight: DECK_PAGE,
      windowSize: 11,
      index,
      defaultIndex: 0,
      onScrollEnd: setIndex,
      renderItem: deckItem,
      style: { width: DECK_WIDTH, height: DECK_PAGE },
    } satisfies CarouselProps<number>,
  };
}

function DeckStatus({ index }: { index: number }) {
  return (
    <Text style={{ color: "#687076", fontSize: 13 }}>{`index ${index} / ${DECK_SIZE - 1}`}</Text>
  );
}

function StackVerticalOnlyDemo() {
  const deck = useDeck();
  return (
    <Box style={{ gap: 8 }}>
      <Carousel {...deck.props} testID="carousel" />
      <DeckStatus index={deck.index} />
    </Box>
  );
}

/** Vertical drag only; a horizontal drag is left to the page around it. */
export const StackVerticalOnly: Story = {
  name: "Stack · vertical only",
  render: () => <StackVerticalOnlyDemo />,
};

function StackTwoAxesDemo() {
  const deck = useDeck();
  const ref = React.useRef<CarouselRef>(null);
  return (
    <Box style={{ gap: 8 }}>
      <Carousel ref={ref} {...deck.props} crossAxis testID="carousel" />
      <Group gap="xs">
        <Button size="xs" variant="default" onPress={() => ref.current?.prev({ axis: "cross" })}>
          ←
        </Button>
        <Button size="xs" variant="default" onPress={() => ref.current?.prev()}>
          ↑
        </Button>
        <Button size="xs" variant="default" onPress={() => ref.current?.next()}>
          ↓
        </Button>
        <Button size="xs" variant="default" onPress={() => ref.current?.next({ axis: "cross" })}>
          →
        </Button>
        <DeckStatus index={deck.index} />
      </Group>
    </Box>
  );
}

/** One deck, one index: vertical drag = stack, horizontal drag = carousel paging. */
export const StackTwoAxes: Story = {
  name: "Stack · two axes",
  render: () => <StackTwoAxesDemo />,
};

const SHELVES = ["Tonight", "This weekend", "Next week"];

function StackInHorizontalCarouselDemo() {
  return (
    <Carousel
      data={[0, 1, 2]}
      loop={false}
      itemWidth={DECK_WIDTH}
      style={{ width: DECK_WIDTH, height: DECK_PAGE + 28 }}
      withIndicators
      testID="carousel"
      renderItem={({ item }) => <Shelf title={SHELVES[item]!} />}
    />
  );
}

function Shelf({ title }: { title: string }) {
  const deck = useDeck();
  return (
    <Box style={{ gap: 4 }}>
      <Text
        style={{ fontWeight: "700", paddingHorizontal: 8 }}
      >{`${title} · ${deck.index + 1}`}</Text>
      <Carousel {...deck.props} />
    </Box>
  );
}

/** Horizontal drags page the outer carousel; vertical drags move the inner stack. */
export const StackInsideHorizontalCarousel: Story = {
  name: "Stack inside horizontal carousel",
  render: () => <StackInHorizontalCarouselDemo />,
};

function StackOverMapDemo() {
  const deck = useDeck();
  const ref = React.useRef<CarouselRef>(null);
  const mapRef = React.useRef<unknown>(null);
  const [zoom, setZoom] = React.useState(12);
  // Stand-in for a map's wheel zoom: it must never fire while the pointer is
  // on the deck (the deck consumes its wheel events).
  React.useEffect(() => {
    const el = mapRef.current as HTMLElement | null;
    if (!isWeb || !el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(1, Math.min(20, z + (e.deltaY > 0 ? -0.25 : 0.25))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  return (
    <Box
      ref={mapRef as never}
      style={{
        width: 720,
        maxWidth: "100%",
        height: DECK_PAGE + 120,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#DDE7D8",
        padding: 16,
        justifyContent: "flex-end",
      }}
    >
      <Text style={{ position: "absolute", top: 12, right: 16, color: "#4B5B47" }}>
        {`map zoom ${zoom.toFixed(2)} (wheel here)`}
      </Text>
      <Box style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Button size="xs" variant="default" onPress={() => ref.current?.prev({ axis: "cross" })}>
          ‹
        </Button>
        <Carousel ref={ref} {...deck.props} crossAxis wheelEnabled testID="carousel" />
        <Button size="xs" variant="default" onPress={() => ref.current?.next({ axis: "cross" })}>
          ›
        </Button>
      </Box>
      <DeckStatus index={deck.index} />
    </Box>
  );
}

/**
 * Desktop: a fixed 320px two-axis deck over a map. Vertical wheel steps the
 * stack, sideways wheel (trackpad / shift + wheel) pages it, and none of it
 * reaches the map's zoom; the side buttons page with the sideways motion.
 */
export const StackOverMap: Story = {
  name: "Stack · desktop card over a map",
  render: () => <StackOverMapDemo />,
};

/** Map hotspots, each holding a different number of events. */
const HOTSPOTS = [
  { id: "harbour", name: "Harbour", count: 1 },
  { id: "park", name: "City Park", count: 3 },
  { id: "market", name: "Old Market", count: 7 },
  { id: "beach", name: "Beach", count: 20 },
  { id: "station", name: "Station", count: 2 },
  { id: "campus", name: "Campus", count: 12 },
].map((spot, k, all) => ({
  ...spot,
  // Distinct event ids across hotspots so every card gets its own image.
  events: Array.from(
    { length: spot.count },
    (_, e) => all.slice(0, k).reduce((n, s) => n + s.count, 0) + e,
  ),
}));
type Hotspot = (typeof HOTSPOTS)[number];
const HOTSPOT_STACK = { ...DECK_STACK, exit: "back" } as const;

function HotspotStack({
  spot,
  index,
  onIndex,
}: {
  spot: Hotspot;
  index: number;
  onIndex: (id: string, i: number) => void;
}) {
  const n = spot.events.length;
  return (
    <Box style={{ gap: 4 }}>
      <Text style={{ fontWeight: "700", paddingHorizontal: 8 }}>
        {`${spot.name} · ${index + 1} / ${n}`}
      </Text>
      <Carousel
        data={spot.events}
        vertical
        loop={false}
        mode="vertical-stack"
        // `exit: "back"`: a card you swipe past tucks under the next one and goes
        // to the back of the deck instead of flying off over it.
        modeConfig={HOTSPOT_STACK}
        itemHeight={DECK_PAGE}
        // No `crossAxis`: the stack leaves horizontal drags to the hotspot rail.
        index={index}
        defaultIndex={index}
        onScrollEnd={(i) => onIndex(spot.id, i)}
        style={{ width: DECK_WIDTH, height: DECK_PAGE }}
        testID={`hotspot-${spot.id}`}
        renderItem={({ item, index: k }) => (
          <DeckCard
            index={item}
            badge={`${k + 1}/${n}`}
            caption={`${spot.name}: event ${k + 1} of ${n}. Up/down for this hotspot, sideways for the next.`}
          />
        )}
      />
    </Box>
  );
}

function StackHotspotsDemo() {
  const [hotspot, setHotspot] = React.useState(0);
  // Each hotspot's position lives HERE, keyed by id, so a stack keeps its place
  // when the rail virtualizes its page away and back.
  const [deckIndex, setDeckIndex] = React.useState<Record<string, number>>({});
  const onIndex = React.useCallback(
    (id: string, i: number) => setDeckIndex((s) => (s[id] === i ? s : { ...s, [id]: i })),
    [],
  );
  const spot = HOTSPOTS[hotspot]!;
  return (
    <Box style={{ gap: 8 }}>
      <Carousel
        data={HOTSPOTS}
        loop={false}
        itemWidth={DECK_WIDTH}
        windowSize={3}
        index={hotspot}
        onScrollEnd={setHotspot}
        withIndicators
        style={{ width: DECK_WIDTH, height: DECK_PAGE + 48 }}
        testID="carousel"
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <HotspotStack spot={item} index={deckIndex[item.id] ?? 0} onIndex={onIndex} />
        )}
      />
      <Text style={{ color: "#687076", fontSize: 13 }}>
        {`hotspot ${hotspot + 1} / ${HOTSPOTS.length} (${spot.name}, ${spot.count} events) · ` +
          `card ${(deckIndex[spot.id] ?? 0) + 1}`}
      </Text>
    </Box>
  );
}

/**
 * A horizontal rail of map hotspots, each a vertical stack of its own length
 * (1, 3, 7, 20, 2, 12 events). Swipe sideways to move between hotspots (the
 * whole stack slides along); swipe up/down to go through that hotspot's events.
 * Each stack remembers its card when you come back to it, and a card you swipe
 * past goes under the next one, to the back of the deck (`exit: "back"`).
 */
export const StackHotspots: Story = {
  name: "Stack · hotspots (varied counts)",
  render: () => <StackHotspotsDemo />,
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
        root: { borderRadius: 16, borderWidth: 2, borderColor: "blue8" },
        slide: { padding: 8 },
        control: { variant: "filled", radius: "md" },
        dot: { backgroundColor: "blue6" },
        activeDot: { backgroundColor: "blue10" },
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
