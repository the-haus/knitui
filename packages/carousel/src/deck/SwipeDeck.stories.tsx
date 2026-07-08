import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text, UnstyledButton } from "@knitui/components";

import { SwipeDeck } from "./SwipeDeck";
import type { SwipeDeckProps, SwipeDeckRef, SwipeDirection } from "./types";

const COLORS = ["#0A7EA4", "#E0245E", "#17BF63", "#794BC4", "#F45D22", "#1B95E0"];
const PEOPLE = [
  { name: "Robin", age: 27, bio: "Coffee, climbing, and questionable puns." },
  { name: "Sam", age: 31, bio: "Chef by day, vinyl collector by night." },
  { name: "Alex", age: 24, bio: "Trail runner chasing the next ridge line." },
  { name: "Jordan", age: 29, bio: "Designs by day, bakes sourdough by night." },
  { name: "Casey", age: 26, bio: "Plant parent to 40 (and counting)." },
  { name: "Riley", age: 33, bio: "Amateur astronomer, professional napper." },
];

type Person = (typeof PEOPLE)[number];

/** A profile card — the deck's `renderCard` content. */
function ProfileCard({ person, index }: { person: Person; index: number }) {
  return (
    <Box style={{ flex: 1 }}>
      <Box
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS[index % COLORS.length],
        }}
      >
        <Text style={{ color: "white", fontSize: 64, fontWeight: "800" }}>{person.name[0]}</Text>
      </Box>
      <Box style={{ padding: 16, gap: 4 }}>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>
          {person.name}, {person.age}
        </Text>
        <Text style={{ fontSize: 14, opacity: 0.7 }}>{person.bio}</Text>
      </Box>
    </Box>
  );
}

const renderCard: SwipeDeckProps<Person>["renderCard"] = (person, index) => (
  <ProfileCard person={person} index={index} />
);

/** A frame that sizes the deck and shows the running like/nope tally. */
function Stage({ children }: { children: React.ReactNode }) {
  return <Box style={{ width: 320, height: 460, alignSelf: "center", padding: 8 }}>{children}</Box>;
}

const meta: Meta<typeof SwipeDeck<Person>> = {
  title: "SwipeDeck",
  component: SwipeDeck,
};
export default meta;

type Story = StoryObj<typeof SwipeDeck<Person>>;

/** The default: drag left/right to nope/like, with LIKE / NOPE stamps. */
export const Default: Story = {
  render: () => (
    <Stage>
      <SwipeDeck
        data={PEOPLE}
        renderCard={renderCard}
        keyExtractor={(p) => p.name}
        stampLabels={{ right: "LIKE", left: "NOPE" }}
        style={{ flex: 1 }}
      />
    </Stage>
  ),
};

/** Super-like enabled — drag up as well as left/right. */
export const SuperLike: Story = {
  render: () => (
    <Stage>
      <SwipeDeck
        data={PEOPLE}
        renderCard={renderCard}
        keyExtractor={(p) => p.name}
        directions={["left", "right", "up"]}
        stampLabels={{ right: "LIKE", left: "NOPE", up: "SUPER" }}
        style={{ flex: 1 }}
      />
    </Stage>
  ),
};

/** The `fan` effect — cards behind spread out like a hand. */
export const FanEffect: Story = {
  render: () => (
    <Stage>
      <SwipeDeck
        data={PEOPLE}
        renderCard={renderCard}
        keyExtractor={(p) => p.name}
        effect="fan"
        stampLabels={{ right: "LIKE", left: "NOPE" }}
        style={{ flex: 1 }}
      />
    </Stage>
  ),
};

/** The `stack` effect — a calm concentric wallet stack. */
export const StackEffect: Story = {
  render: () => (
    <Stage>
      <SwipeDeck
        data={PEOPLE}
        renderCard={renderCard}
        keyExtractor={(p) => p.name}
        effect="stack"
        stampLabels={{ right: "LIKE", left: "NOPE" }}
        style={{ flex: 1 }}
      />
    </Stage>
  ),
};

/**
 * A custom effect worklet — the extensibility seam. Off-center cards tumble in
 * 3-D depth. Any `(state) => ViewStyle` worklet plugs in the same way.
 */
export const CustomEffect: Story = {
  render: () => (
    <Stage>
      <SwipeDeck
        data={PEOPLE}
        renderCard={renderCard}
        keyExtractor={(p) => p.name}
        effect={(s) => {
          "worklet";
          if (s.isTop) {
            const tilt = (s.size.width > 0 ? s.drag.x / s.size.width : 0) * 18;
            return {
              transform: [
                { perspective: 1000 },
                { translateX: s.drag.x },
                { translateY: s.drag.y },
                { rotateZ: `${tilt}deg` },
              ],
              zIndex: 100,
            };
          }
          const d = Math.max(0, s.depth);
          return {
            transform: [
              { perspective: 1000 },
              { translateY: d * 24 },
              { rotateX: `${d * 12}deg` },
              { scale: 1 - d * 0.08 },
            ],
            opacity: 1 - d * 0.15,
            zIndex: Math.round(100 - d * 10),
          };
        }}
        stampLabels={{ right: "LIKE", left: "NOPE" }}
        style={{ flex: 1 }}
      />
    </Stage>
  ),
};

/** Buttons drive the deck through the imperative ref — no dragging required. */
export const ImperativeButtons: Story = {
  render: () => {
    const ref = React.useRef<SwipeDeckRef>(null);
    const fling = (direction: SwipeDirection) => () => ref.current?.swipe(direction);
    const Btn = ({
      label,
      color,
      onPress,
    }: {
      label: string;
      color: string;
      onPress: () => void;
    }) => (
      <UnstyledButton
        onPress={onPress}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: color,
        }}
        pressStyle={{ opacity: 0.6 }}
      >
        <Text style={{ color, fontWeight: "700" }}>{label}</Text>
      </UnstyledButton>
    );
    return (
      <Box style={{ alignItems: "center", gap: 16 }}>
        <Box style={{ width: 320, height: 420, padding: 8 }}>
          <SwipeDeck
            ref={ref}
            data={PEOPLE}
            renderCard={renderCard}
            keyExtractor={(p) => p.name}
            directions={["left", "right", "up"]}
            stampLabels={{ right: "LIKE", left: "NOPE", up: "SUPER" }}
            style={{ flex: 1 }}
          />
        </Box>
        <Box style={{ flexDirection: "row", gap: 12 }}>
          <Btn label="✕ Nope" color="#E0245E" onPress={fling("left")} />
          <Btn label="★ Super" color="#1B95E0" onPress={fling("up")} />
          <Btn label="♥ Like" color="#17BF63" onPress={fling("right")} />
        </Box>
      </Box>
    );
  },
};
