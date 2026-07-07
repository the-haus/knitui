import * as React from "react";

import { Text } from "@knitui/components";

import { render, screen } from "../test-utils";
import { SwipeDeck } from "./SwipeDeck";
import type { DeckCardState, SwipeDeckRef } from "./types";

const renderCard = (item: number) => <Text>{`card-${item}`}</Text>;

describe("SwipeDeck — rendering", () => {
  it("mounts only the top card and the cards within stackSize", () => {
    render(
      <SwipeDeck
        data={[0, 1, 2, 3, 4]}
        stackSize={3}
        renderCard={renderCard}
        style={{ width: 300, height: 400 }}
      />,
    );
    expect(screen.getByText("card-0")).toBeTruthy();
    expect(screen.getByText("card-1")).toBeTruthy();
    expect(screen.getByText("card-2")).toBeTruthy();
    // Beyond the window is not mounted.
    expect(screen.queryByText("card-3")).toBeNull();
  });

  it("renders built-in stamps for the labeled, enabled directions", () => {
    render(
      <SwipeDeck
        data={[0]}
        directions={["left", "right"]}
        stampLabels={{ right: "LIKE", left: "NOPE" }}
        renderCard={renderCard}
        style={{ width: 300, height: 400 }}
      />,
    );
    expect(screen.getByText("LIKE")).toBeTruthy();
    expect(screen.getByText("NOPE")).toBeTruthy();
  });

  it("renders the empty state when there are no cards", () => {
    render(
      <SwipeDeck
        data={[] as number[]}
        renderCard={renderCard}
        renderEmpty={() => <Text>no more</Text>}
      />,
    );
    expect(screen.getByText("no more")).toBeTruthy();
  });

  it("accepts a custom effect worklet without crashing", () => {
    const custom = (s: DeckCardState) => ({ opacity: s.isTop ? 1 : 0.4 });
    render(<SwipeDeck data={[0, 1]} effect={custom} renderCard={renderCard} />);
    expect(screen.getByText("card-0")).toBeTruthy();
  });

  it.each(["tinder", "stack", "fan", "swipe"] as const)("renders with the %s effect", (effect) => {
    render(<SwipeDeck data={[0, 1]} effect={effect} renderCard={renderCard} />);
    expect(screen.getByText("card-0")).toBeTruthy();
  });
});

describe("SwipeDeck — imperative ref", () => {
  it("exposes the swipe API and starts at index 0", () => {
    const ref = React.createRef<SwipeDeckRef>();
    render(
      <SwipeDeck
        ref={ref}
        data={[0, 1, 2]}
        renderCard={renderCard}
        style={{ width: 300, height: 400 }}
      />,
    );
    expect(ref.current?.getActiveIndex()).toBe(0);
    expect(typeof ref.current?.swipe).toBe("function");
    expect(typeof ref.current?.swipeRight).toBe("function");
    expect(typeof ref.current?.swipeLeft).toBe("function");
    expect(typeof ref.current?.swipeUp).toBe("function");
    // The advance/commit path (shared by gesture + imperative swipes) is covered
    // deterministically in useSwipeDeck.test.ts — driving the fling animation here
    // would depend on reanimated's web loop, which does not progress under jsdom.
  });
});
