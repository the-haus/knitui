/**
 * Stack decks end to end on the web target (react-native-web in jsdom): which
 * data item sits where, paint order, the single-axis pan, the two-axis deck and
 * its axis lock, nesting, and flick-vs-drag settling.
 *
 * Drags go through RNGH's own jest utilities against the carousel's real pan
 * (found by its `testID`), so the kit's worklet callbacks, the shared offset,
 * the settle animation and the web painter all run for real. jsdom has no
 * layout, so every carousel gets explicit page sizes.
 */
import * as React from "react";
import { State } from "react-native-gesture-handler";
import {
  createGestureController,
  fireGestureHandler,
  getByGestureTestId,
} from "react-native-gesture-handler/jest-utils";

import { Text } from "@knitui/components";

import { Carousel } from "../index";
import { act, render, screen, waitFor } from "../test-utils";
import type { CarouselProps, CarouselRef, StackConfig } from "../types";

const PAGE = 100;
const N = 20;
const DATA = Array.from({ length: N }, (_, i) => i);

/** Fast settle so each drag lands in ~150ms of real time. */
const DURATION = 50;

type Props = Partial<CarouselProps<number>>;

/* ---- DOM probes --------------------------------------------------------- */

/** The painter-owned host element of slide `i` (it carries `will-change`). */
function host(i: number): HTMLElement {
  let el: HTMLElement | null = screen.getByText(`card-${i}`);
  while (el && el.style.willChange !== "transform") el = el.parentElement;
  if (!el) throw new Error(`no slide host for card-${i}`);
  return el;
}

/** Mounted slide indices. */
function mounted(): number[] {
  return DATA.filter((i) => screen.queryByText(`card-${i}`) !== null);
}

const opacityOf = (i: number) => (host(i).style.opacity === "" ? 1 : Number(host(i).style.opacity));
const zOf = (i: number) => Number(host(i).style.zIndex || 0);

/** Visible slides (opacity > 0), front first: the stack as the eye reads it. */
function visibleStack(): number[] {
  return mounted()
    .filter((i) => opacityOf(i) > 0)
    .sort((a, b) => zOf(b) - zOf(a));
}

/** translate px of slide `i` along `axis` (0 if absent). */
function translate(i: number, axis: "X" | "Y"): number {
  const m = new RegExp(`translate${axis}\\((-?[\\d.e-]+)px\\)`).exec(host(i).style.transform);
  return m ? Number(m[1]) : 0;
}

/** An RNGH offset pair as the pan stores it (`<name>Start` / `<name>End`). */
function offsets(gesture: unknown, name: string): [number, number] | undefined {
  const config = (gesture as { config: Record<string, number | undefined> }).config;
  const start = config[`${name}Start`];
  const end = config[`${name}End`];
  return start === undefined && end === undefined ? undefined : [start!, end!];
}

/* ---- harness ------------------------------------------------------------ */

function Card({ index }: { index: number }) {
  return <Text>{`card-${index}`}</Text>;
}

const renderItem: CarouselProps<number>["renderItem"] = ({ item }) => <Card index={item} />;

/** A controlled deck whose parent follows `onScrollEnd`, like an app would. */
function ControlledDeck({
  initial = 0,
  onEnd,
  carouselRef,
  setIndexRef,
  ...props
}: Props & {
  initial?: number;
  onEnd?: (i: number) => void;
  carouselRef?: React.Ref<CarouselRef>;
  setIndexRef?: { current: ((i: number) => void) | null };
}) {
  const [index, setIndex] = React.useState(initial);
  if (setIndexRef) setIndexRef.current = setIndex;
  return (
    <Carousel
      ref={carouselRef}
      data={DATA}
      vertical
      loop={false}
      mode="vertical-stack"
      modeConfig={{ showLength: 3, stackInterval: 16 }}
      itemSize={PAGE}
      windowSize={11}
      scrollAnimationDuration={DURATION}
      style={{ width: PAGE, height: PAGE }}
      gestureConfig={GESTURE}
      renderItem={renderItem}
      index={index}
      defaultIndex={initial}
      onScrollEnd={(i) => {
        onEnd?.(i);
        setIndex(i);
      }}
      {...props}
    />
  );
}

const GESTURE = { testID: "deck-pan" } as const;
const pan = () => getByGestureTestId("deck-pan") as never;

/** One whole drag: down, move through `path`, release with `velocity`. */
function drag(
  gesture: never,
  path: Array<[number, number]>,
  velocity: [number, number] = [0, 0],
): void {
  const [vx, vy] = velocity;
  const last = path[path.length - 1] ?? [0, 0];
  act(() => {
    fireGestureHandler(gesture, [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: path[0]![0], translationY: path[0]![1] },
      ...path.map(([x, y]) => ({ translationX: x, translationY: y })),
      {
        state: State.END,
        translationX: last[0],
        translationY: last[1],
        velocityX: vx,
        velocityY: vy,
      },
    ] as never);
  });
}

/** A straight drag of (dx, dy) in 6 even steps. */
const line = (dx: number, dy: number): Array<[number, number]> =>
  Array.from({ length: 6 }, (_, k) => [(dx * (k + 1)) / 6, (dy * (k + 1)) / 6]);

/* ---- tests -------------------------------------------------------------- */

describe("stack deck — which items sit in the stack", () => {
  const cases: Array<[string, Props]> = [
    ["vertical-stack / left", { vertical: true, mode: "vertical-stack" }],
    [
      "vertical-stack / right",
      {
        vertical: true,
        mode: "vertical-stack",
        modeConfig: { showLength: 3, stackInterval: 16, snapDirection: "right" },
      },
    ],
    ["horizontal-stack / left", { vertical: false, mode: "horizontal-stack" }],
    [
      "horizontal-stack / right",
      {
        vertical: false,
        mode: "horizontal-stack",
        modeConfig: { showLength: 3, stackInterval: 16, snapDirection: "right" },
      },
    ],
  ];

  it.each(cases)("%s: data[i+1] and data[i+2] sit behind data[i] (controlled index)", (_n, p) => {
    const setIndex: { current: ((i: number) => void) | null } = { current: null };
    render(<ControlledDeck {...p} setIndexRef={setIndex} />);
    for (const i of [0, 1, 2, 3]) {
      act(() => setIndex.current!(i));
      // Front card on top, then exactly the next two items — nothing else shows.
      expect(visibleStack()).toEqual([i, i + 1, i + 2]);
    }
  });

  it.each(cases)("%s: same after each drag step", async (_n, p) => {
    const ends: number[] = [];
    render(<ControlledDeck {...p} onEnd={(i) => ends.push(i)} />);
    const vertical = p.vertical ?? true;
    expect(visibleStack()).toEqual([0, 1, 2]);
    for (const i of [1, 2, 3]) {
      drag(pan(), vertical ? line(0, -70) : line(-70, 0));
      await waitFor(() => expect(ends.length).toBe(i));
      expect(ends[i - 1]).toBe(i);
      expect(visibleStack()).toEqual([i, i + 1, i + 2]);
    }
  });

  it("windowSize = data.length changes nothing", () => {
    const setIndex: { current: ((i: number) => void) | null } = { current: null };
    render(<ControlledDeck windowSize={N} setIndexRef={setIndex} />);
    expect(mounted()).toHaveLength(N);
    expect(visibleStack()).toEqual([0, 1, 2]);
    act(() => setIndex.current!(1));
    expect(visibleStack()).toEqual([1, 2, 3]);
  });
});

describe("stack deck — paint order after a step", () => {
  it.each([3, 4] as const)(
    "showLength %i: front on top, showLength-1 cards behind, the rest at opacity 0",
    async (showLength) => {
      const ref = React.createRef<CarouselRef>();
      const ends: number[] = [];
      render(
        <ControlledDeck
          carouselRef={ref}
          modeConfig={{ showLength } satisfies StackConfig}
          onEnd={(i) => ends.push(i)}
        />,
      );
      act(() => ref.current!.scrollTo({ index: 1, animated: false }));
      const expectAt = (i: number) => {
        const stack = visibleStack();
        expect(stack[0]).toBe(i);
        expect(stack).toHaveLength(showLength);
        for (const j of mounted()) {
          if (!stack.includes(j)) expect(opacityOf(j)).toBe(0);
          // Above every VISIBLE card (the card that left sits higher, at opacity 0).
          else if (j !== i) expect(zOf(i)).toBeGreaterThan(zOf(j));
        }
      };
      expectAt(1);
      drag(pan(), line(0, -80));
      await waitFor(() => expect(ends).toContain(2));
      expectAt(2);
    },
  );
});

describe("vertical-only stack — single axis", () => {
  it("configures RNGH to activate vertically and fail horizontally", () => {
    render(<ControlledDeck />);
    expect(offsets(pan(), "activeOffsetY")).toEqual([-10, 10]);
    expect(offsets(pan(), "failOffsetX")).toEqual([-10, 10]);
    expect(offsets(pan(), "activeOffsetX")).toBeUndefined();
  });

  it("a vertical drag past half a page steps +1 then -1", async () => {
    const ends: number[] = [];
    render(<ControlledDeck onEnd={(i) => ends.push(i)} />);
    drag(pan(), line(0, -60));
    await waitFor(() => expect(ends).toEqual([1]));
    drag(pan(), line(0, 60));
    await waitFor(() => expect(ends).toEqual([1, 0]));
  });

  it("a horizontal drag of any length never moves it (left to a parent)", async () => {
    const ends: number[] = [];
    const onIndexChange = jest.fn();
    render(<ControlledDeck onEnd={(i) => ends.push(i)} onIndexChange={onIndexChange} />);
    for (const dx of [-30, -100, -400, 250]) {
      drag(pan(), line(dx, 3), [dx * 10, 0]);
      expect(translate(0, "Y")).toBe(0);
      expect(translate(0, "X")).toBe(0);
    }
    await waitFor(() => expect(ends).toHaveLength(4));
    expect(new Set(ends)).toEqual(new Set([0]));
    // Only the mount-time report of 0; never another index.
    expect(onIndexChange.mock.calls.every(([i]) => i === 0)).toBe(true);
  });

  it("a touch a parent wins (BEGAN → FAILED) still pairs onScrollStart with onScrollEnd", async () => {
    const onScrollStart = jest.fn();
    const ends: number[] = [];
    render(<ControlledDeck onScrollStart={onScrollStart} onEnd={(i) => ends.push(i)} />);
    act(() => {
      fireGestureHandler(pan(), [
        { state: State.BEGAN, translationX: 0, translationY: 0 },
        { state: State.FAILED, translationX: -15, translationY: 0 },
      ] as never);
    });
    await waitFor(() => expect(ends).toEqual([0]));
    expect(onScrollStart).toHaveBeenCalledTimes(1);
  });
});

describe("two-axis deck", () => {
  const twoAxis: Props = { crossAxis: { itemSize: PAGE } };

  it("configures one pan that activates on either axis; web frame owns both", () => {
    const { container } = render(<ControlledDeck {...twoAxis} testID="deck" />);
    expect(offsets(pan(), "activeOffsetX")).toEqual([-10, 10]);
    expect(offsets(pan(), "activeOffsetY")).toEqual([-10, 10]);
    expect(offsets(pan(), "failOffsetX")).toBeUndefined();
    const frame = container.querySelector('[data-testid="deck"]') as HTMLElement;
    expect(frame.style.touchAction).toBe("none");
  });

  it("single-axis frames keep the browser's other pan", () => {
    const { container } = render(<ControlledDeck testID="deck" />);
    const frame = container.querySelector('[data-testid="deck"]') as HTMLElement;
    expect(frame.style.touchAction).toBe("pan-x");
  });

  it("vertical drag steps the stack, horizontal drag pages; same index, one onScrollEnd each", async () => {
    const ends: number[] = [];
    const onIndexChange = jest.fn();
    render(
      <ControlledDeck {...twoAxis} onEnd={(i) => ends.push(i)} onIndexChange={onIndexChange} />,
    );

    // Vertical: the stack motion — the front card flies off along Y, never X.
    const c = createGestureController<Record<string, number>>("deck-pan");
    act(() => {
      c.begin({ translationX: 0, translationY: 0 });
      c.activate({ translationX: 0, translationY: -12 });
      c.update({ translationX: 2, translationY: -40 });
    });
    expect(translate(0, "Y")).toBeLessThan(0);
    expect(translate(0, "X")).toBe(0);
    act(() => c.update({ translationX: 2, translationY: -60 }));
    act(() => c.end({ translationX: 2, translationY: -60, velocityX: 0, velocityY: 0 }));
    await waitFor(() => expect(ends).toEqual([1]));
    expect(visibleStack()).toEqual([1, 2, 3]);

    // Horizontal: the front card slides out sideways, the deck stays a deck.
    act(() => {
      c.begin({ translationX: 0, translationY: 0 });
      c.activate({ translationX: -12, translationY: 0 });
      c.update({ translationX: -40, translationY: 3 });
    });
    expect(translate(1, "X")).toBeCloseTo(-40);
    expect(translate(1, "Y")).toBe(0);
    // The next card is still behind it in the stack layout, coming forward.
    expect(zOf(1)).toBeGreaterThan(zOf(2));
    act(() => c.update({ translationX: -60, translationY: 3 }));
    act(() => c.end({ translationX: -60, translationY: 3, velocityX: 0, velocityY: 0 }));
    await waitFor(() => expect(ends).toEqual([1, 2]));
    // Landed: back in the stack layout with the right cards.
    expect(visibleStack()).toEqual([2, 3, 4]);
    expect(translate(2, "X")).toBe(0);

    // And back with a horizontal drag the other way.
    drag(pan(), line(60, 0));
    await waitFor(() => expect(ends).toEqual([1, 2, 1]));
    expect(visibleStack()).toEqual([1, 2, 3]);
    // The mount-time report of 0, then one change per step.
    expect(onIndexChange.mock.calls.map(([i]) => i)).toEqual([0, 1, 2, 1]);
  });

  it("respects loop=false at both ends on both axes", async () => {
    const ends: number[] = [];
    render(<ControlledDeck {...twoAxis} overscrollEnabled={false} onEnd={(i) => ends.push(i)} />);
    drag(pan(), line(80, 0));
    await waitFor(() => expect(ends).toEqual([0]));
    drag(pan(), line(0, 80));
    await waitFor(() => expect(ends).toEqual([0, 0]));
  });

  it("wraps with loop on the cross axis", async () => {
    const ends: number[] = [];
    render(<ControlledDeck {...twoAxis} loop onEnd={(i) => ends.push(i)} />);
    drag(pan(), line(70, 0));
    await waitFor(() => expect(ends).toEqual([N - 1]));
  });
});

describe("two-axis deck — axis lock", () => {
  const twoAxis: Props = { crossAxis: { itemSize: PAGE } };

  async function lockedDrag(path: Array<[number, number]>, ends: number[], expected: number) {
    const c = createGestureController<Record<string, number>>("deck-pan");
    act(() => {
      c.begin({ translationX: 0, translationY: 0 });
      c.activate({ translationX: path[0]![0], translationY: path[0]![1] });
    });
    for (const [x, y] of path) {
      act(() => c.update({ translationX: x, translationY: y }));
      // Never both: the front card moves along one axis only, all drag long.
      const front = 0;
      expect(translate(front, "X") === 0 || translate(front, "Y") === 0).toBe(true);
    }
    const [x, y] = path[path.length - 1]!;
    act(() => c.end({ translationX: x, translationY: y, velocityX: 0, velocityY: 0 }));
    await waitFor(() => expect(ends).toHaveLength(1));
    expect(ends[0]).toBe(expected);
  }

  it("horizontal then vertical stays horizontal", async () => {
    const ends: number[] = [];
    render(<ControlledDeck {...twoAxis} onEnd={(i) => ends.push(i)} />);
    // Decides sideways in the first 10px, then turns hard downward-up.
    await lockedDrag(
      [
        [-12, 0],
        [-30, -5],
        [-55, -90],
        [-60, -200],
      ],
      ends,
      1,
    );
    expect(translate(1, "Y")).toBe(0);
  });

  it("vertical then horizontal stays vertical", async () => {
    const ends: number[] = [];
    render(<ControlledDeck {...twoAxis} onEnd={(i) => ends.push(i)} />);
    await lockedDrag(
      [
        [0, -12],
        [-5, -30],
        [-150, -55],
        [-300, -60],
      ],
      ends,
      1,
    );
    expect(translate(1, "X")).toBe(0);
  });

  it("a 45° diagonal goes to the main (stack) axis, every time", async () => {
    for (let run = 0; run < 3; run++) {
      const ends: number[] = [];
      const { unmount } = render(<ControlledDeck {...twoAxis} onEnd={(i) => ends.push(i)} />);
      const c = createGestureController<Record<string, number>>("deck-pan");
      act(() => {
        c.begin({ translationX: 0, translationY: 0 });
        c.activate({ translationX: -11, translationY: -11 });
        c.update({ translationX: -30, translationY: -30 });
      });
      expect(translate(0, "Y")).toBeLessThan(0);
      expect(translate(0, "X")).toBe(0);
      act(() => c.update({ translationX: -60, translationY: -60 }));
      act(() => c.end({ translationX: -60, translationY: -60, velocityX: 0, velocityY: 0 }));
      await waitFor(() => expect(ends).toEqual([1]));
      unmount();
    }
  });

  it("a tiny drag is a tap: nothing moves", async () => {
    const ends: number[] = [];
    render(<ControlledDeck {...twoAxis} onEnd={(i) => ends.push(i)} />);
    drag(pan(), [
      [2, 3],
      [4, -3],
    ]);
    await waitFor(() => expect(ends).toEqual([0]));
    expect(visibleStack()).toEqual([0, 1, 2]);
  });
});

describe("fast flick vs slow drag", () => {
  const twoAxis: Props = { crossAxis: { itemSize: PAGE } };

  it.each([
    ["vertical (stack)", [0, -20], [0, -900]],
    ["horizontal (cross)", [-20, 0], [-900, 0]],
  ] as const)("%s: a short fast flick steps", async (_n, [dx, dy], velocity) => {
    const ends: number[] = [];
    render(<ControlledDeck {...twoAxis} onEnd={(i) => ends.push(i)} />);
    drag(pan(), line(dx, dy), [velocity[0], velocity[1]]);
    await waitFor(() => expect(ends).toEqual([1]));
  });

  it.each([
    ["vertical (stack)", [0, -40], [0, -60]],
    ["horizontal (cross)", [-40, 0], [-60, 0]],
  ] as const)("%s: a slow drag under half a page snaps back", async (_n, [dx, dy], velocity) => {
    const ends: number[] = [];
    render(<ControlledDeck {...twoAxis} onEnd={(i) => ends.push(i)} />);
    drag(pan(), line(dx, dy), [velocity[0], velocity[1]]);
    await waitFor(() => expect(ends).toEqual([0]));
    expect(visibleStack()).toEqual([0, 1, 2]);
    expect(translate(0, "X")).toBe(0);
  });
});

describe("nesting: each carousel gets only its own axis", () => {
  /** A vertical stack inside each page of a horizontal carousel. */
  function Nested({
    onOuter,
    onInner,
  }: {
    onOuter: (i: number) => void;
    onInner: (i: number) => void;
  }) {
    return (
      <Carousel
        data={[0, 1, 2]}
        loop={false}
        itemSize={PAGE}
        scrollAnimationDuration={DURATION}
        style={{ width: PAGE, height: PAGE }}
        gestureConfig={OUTER}
        onScrollEnd={onOuter}
        windowSize={1}
        renderItem={() => <ControlledDeck gestureConfig={INNER} onEnd={onInner} />}
      />
    );
  }
  const OUTER = { testID: "outer-pan" } as const;
  const INNER = { testID: "inner-pan" } as const;

  it("outer pages horizontally only, inner stacks vertically only", () => {
    render(<Nested onOuter={() => {}} onInner={() => {}} />);
    const outer = getByGestureTestId("outer-pan");
    const inner = getByGestureTestId("inner-pan");
    // RNGH arbitration: a horizontal drag fails the inner and activates the outer.
    expect(offsets(outer, "activeOffsetX")).toEqual([-10, 10]);
    expect(offsets(outer, "failOffsetY")).toEqual([-10, 10]);
    expect(offsets(inner, "activeOffsetY")).toEqual([-10, 10]);
    expect(offsets(inner, "failOffsetX")).toEqual([-10, 10]);
  });

  it("a horizontal drag pages the outer; the inner, even if it sees the drag, doesn't move", async () => {
    const outerEnds: number[] = [];
    const innerEnds: number[] = [];
    render(<Nested onOuter={(i) => outerEnds.push(i)} onInner={(i) => innerEnds.push(i)} />);
    // Worst case: both handlers receive the whole horizontal drag.
    drag(getByGestureTestId("inner-pan") as never, line(-70, 2));
    drag(getByGestureTestId("outer-pan") as never, line(-70, 2));
    await waitFor(() => expect(outerEnds).toEqual([1]));
    await waitFor(() => expect(innerEnds).toEqual([0]));
  });

  it("a vertical drag moves the inner stack; the outer ignores it", async () => {
    const outerEnds: number[] = [];
    const innerEnds: number[] = [];
    render(<Nested onOuter={(i) => outerEnds.push(i)} onInner={(i) => innerEnds.push(i)} />);
    drag(getByGestureTestId("outer-pan") as never, line(2, -70));
    drag(getByGestureTestId("inner-pan") as never, line(2, -70));
    await waitFor(() => expect(innerEnds).toEqual([1]));
    await waitFor(() => expect(outerEnds).toEqual([0]));
  });

  it("a horizontal carousel inside a vertical scroller fails on vertical drags", () => {
    render(
      <Carousel
        data={DATA}
        itemSize={PAGE}
        style={{ width: PAGE, height: PAGE }}
        gestureConfig={OUTER}
        renderItem={renderItem}
      />,
    );
    const g = getByGestureTestId("outer-pan");
    expect(offsets(g, "activeOffsetX")).toEqual([-10, 10]);
    expect(offsets(g, "failOffsetY")).toEqual([-10, 10]);
  });

  it("a caller's own activation config replaces the kit's defaults", () => {
    const custom = { testID: "custom-pan", activeOffsetX: [-4, 4] as [number, number] };
    render(
      <Carousel
        data={DATA}
        itemSize={PAGE}
        style={{ width: PAGE, height: PAGE }}
        gestureConfig={custom}
        renderItem={renderItem}
      />,
    );
    const g = getByGestureTestId("custom-pan");
    expect(offsets(g, "activeOffsetX")).toEqual([-4, 4]);
    expect(offsets(g, "failOffsetY")).toBeUndefined();
  });
});

describe("two-axis deck — programmatic and keyboard steps", () => {
  it("ref.next({ axis: 'cross' }) steps with the cross motion and lands in the stack", async () => {
    const ref = React.createRef<CarouselRef>();
    const ends: number[] = [];
    render(
      <ControlledDeck
        carouselRef={ref}
        crossAxis={{ itemSize: PAGE }}
        onEnd={(i) => ends.push(i)}
      />,
    );
    act(() => ref.current!.next({ axis: "cross" }));
    await waitFor(() => expect(ends).toEqual([1]));
    expect(visibleStack()).toEqual([1, 2, 3]);
  });

  it("arrow keys: ↑/↓ step the stack, ←/→ page the cross axis", async () => {
    const ends: number[] = [];
    render(
      <ControlledDeck crossAxis={{ itemSize: PAGE }} testID="deck" onEnd={(i) => ends.push(i)} />,
    );
    const frame = document.querySelector('[data-testid="deck"]') as HTMLElement;
    const key = (k: string) =>
      act(() => {
        frame.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
      });
    key("ArrowDown");
    await waitFor(() => expect(ends).toEqual([1]));
    key("ArrowRight");
    await waitFor(() => expect(ends).toEqual([1, 2]));
    key("ArrowLeft");
    await waitFor(() => expect(ends).toEqual([1, 2, 1]));
    key("ArrowUp");
    await waitFor(() => expect(ends).toEqual([1, 2, 1, 0]));
  });

  it("wheel: vertical → stack, sideways → cross; consumed so a parent never sees it", async () => {
    const ends: number[] = [];
    const parentWheel = jest.fn();
    render(
      <div onWheel={parentWheel}>
        <ControlledDeck crossAxis={{ itemSize: PAGE }} testID="deck" onEnd={(i) => ends.push(i)} />
      </div>,
    );
    const frame = document.querySelector('[data-testid="deck"]') as HTMLElement;
    const wheel = (deltaX: number, deltaY: number, extra: WheelEventInit = {}) =>
      act(() => {
        frame.dispatchEvent(
          new WheelEvent("wheel", { deltaX, deltaY, bubbles: true, cancelable: true, ...extra }),
        );
      });
    wheel(0, 40);
    await waitFor(() => expect(ends).toEqual([1]));
    await new Promise((r) => setTimeout(r, 350)); // the one-step cooldown
    wheel(40, 2);
    await waitFor(() => expect(ends).toEqual([1, 2]));
    await new Promise((r) => setTimeout(r, 350));
    wheel(0, -40, { shiftKey: true }); // shift + wheel = sideways, back
    await waitFor(() => expect(ends).toEqual([1, 2, 1]));
    wheel(0, 3); // under the step threshold: no step, still consumed
    expect(parentWheel).not.toHaveBeenCalled();
  });
});

describe("hotspot rail: stacks of different lengths inside a horizontal carousel", () => {
  const SPOTS = [
    { id: "a", count: 1 },
    { id: "b", count: 3 },
    { id: "c", count: 7 },
  ];
  const RAIL = { testID: "rail-pan" } as const;
  const stackGesture = (id: string) => getByGestureTestId(`stack-${id}`) as never;
  const STACK_GESTURES = Object.fromEntries(SPOTS.map((s) => [s.id, { testID: `stack-${s.id}` }]));

  /** Visible cards of hotspot `id`, front first. */
  function spotStack(id: string, count: number): number[] {
    const rows: Array<{ k: number; o: number; z: number }> = [];
    for (let k = 0; k < count; k++) {
      const label = screen.queryByText(`card-${id}-${k}`);
      if (!label) continue;
      let el: HTMLElement | null = label;
      while (el && el.style.willChange !== "transform") el = el.parentElement;
      const o = el!.style.opacity === "" ? 1 : Number(el!.style.opacity);
      rows.push({ k, o, z: Number(el!.style.zIndex || 0) });
    }
    return rows
      .filter((r) => r.o > 0)
      .sort((a, b) => b.z - a.z)
      .map((r) => r.k);
  }

  function Rail({ log }: { log: string[] }) {
    const [spot, setSpot] = React.useState(0);
    const [pos, setPos] = React.useState<Record<string, number>>({});
    return (
      <Carousel
        data={SPOTS}
        loop={false}
        itemSize={PAGE}
        // Only the current hotspot is mounted: positions must survive remounts.
        windowSize={1}
        scrollAnimationDuration={DURATION}
        style={{ width: PAGE, height: PAGE }}
        gestureConfig={RAIL}
        index={spot}
        onScrollEnd={(i) => {
          log.push(`rail:${i}`);
          setSpot(i);
        }}
        keyExtractor={(s) => s.id}
        renderItem={({ item: s }) => (
          <Carousel
            data={Array.from({ length: s.count }, (_, k) => k)}
            vertical
            loop={false}
            mode="vertical-stack"
            modeConfig={{ showLength: 3 }}
            itemSize={PAGE}
            scrollAnimationDuration={DURATION}
            style={{ width: PAGE, height: PAGE }}
            gestureConfig={STACK_GESTURES[s.id]}
            index={pos[s.id] ?? 0}
            defaultIndex={pos[s.id] ?? 0}
            onScrollEnd={(i) => {
              log.push(`${s.id}:${i}`);
              setPos((p) => ({ ...p, [s.id]: i }));
            }}
            renderItem={({ item }) => <Text>{`card-${s.id}-${item}`}</Text>}
          />
        )}
      />
    );
  }

  it("each stack steps within its own length, and keeps its card across hotspot changes", async () => {
    const log: string[] = [];
    render(<Rail log={log} />);
    const settle = async (entry: string) => {
      await waitFor(() => expect(log[log.length - 1]).toBe(entry));
      await act(async () => {});
    };

    // Hotspot a: one event. A vertical drag can't go anywhere.
    expect(spotStack("a", 1)).toEqual([0]);
    drag(stackGesture("a"), line(0, -70));
    await settle("a:0");
    expect(spotStack("a", 1)).toEqual([0]);

    // Sideways → hotspot b (3 events), even when the drag starts on the stack.
    drag(stackGesture("a"), line(-70, 2));
    drag(getByGestureTestId("rail-pan") as never, line(-70, 2));
    await settle("rail:1");
    expect(spotStack("b", 3)).toEqual([0, 1, 2]);

    // Up through b's three events; a fourth drag stops at the last one.
    drag(stackGesture("b"), line(0, -70));
    await settle("b:1");
    expect(spotStack("b", 3)).toEqual([1, 2]);
    drag(stackGesture("b"), line(0, -70));
    await settle("b:2");
    expect(spotStack("b", 3)).toEqual([2]);
    drag(stackGesture("b"), line(0, -70));
    await settle("b:2");

    // → hotspot c (7 events): starts at its own first card.
    drag(getByGestureTestId("rail-pan") as never, line(-70, 2));
    await settle("rail:2");
    expect(spotStack("c", 7)).toEqual([0, 1, 2]);
    drag(stackGesture("c"), line(0, -70));
    await settle("c:1");
    expect(spotStack("c", 7)).toEqual([1, 2, 3]);

    // ← back to b (its page was unmounted): still on its last card.
    drag(getByGestureTestId("rail-pan") as never, line(70, 2));
    await settle("rail:1");
    expect(screen.queryByText("card-c-0")).toBeNull();
    expect(spotStack("b", 3)).toEqual([2]);

    // → c again: still on card 1.
    drag(getByGestureTestId("rail-pan") as never, line(-70, 2));
    await settle("rail:2");
    expect(spotStack("c", 7)).toEqual([1, 2, 3]);

    // The rail never moved on a vertical drag, the stacks never on a sideways one.
    expect(log.filter((e) => e.startsWith("rail:"))).toEqual([
      "rail:1",
      "rail:2",
      "rail:1",
      "rail:2",
    ]);
  });
});

describe("stack deck — exit: back", () => {
  it("the dragged card goes under the incoming one past half-way; at rest the deck is unchanged", async () => {
    const ends: number[] = [];
    render(
      <ControlledDeck
        modeConfig={{ showLength: 3, stackInterval: 16, exit: "back" }}
        onEnd={(i) => ends.push(i)}
      />,
    );
    const c = createGestureController<Record<string, number>>("deck-pan");
    act(() => {
      c.begin({ translationX: 0, translationY: 0 });
      c.activate({ translationX: 0, translationY: -12 });
      c.update({ translationX: 0, translationY: -25 });
    });
    // A quarter of the way: card 0 is still on top.
    expect(zOf(0)).toBeGreaterThan(zOf(1));
    act(() => c.update({ translationX: 0, translationY: -70 }));
    // Past half-way: card 1 has come up on top; card 0 is under it and the deck, still visible.
    expect(zOf(1)).toBeGreaterThan(zOf(0));
    expect(zOf(2)).toBeGreaterThan(zOf(0));
    expect(opacityOf(0)).toBeGreaterThan(0);
    act(() => c.end({ translationX: 0, translationY: -70, velocityX: 0, velocityY: 0 }));
    await waitFor(() => expect(ends).toEqual([1]));
    expect(visibleStack()).toEqual([1, 2, 3]);

    // And back: card 0 rises from behind the deck and lands on top.
    drag(pan(), line(0, 70));
    await waitFor(() => expect(ends).toEqual([1, 0]));
    expect(visibleStack()).toEqual([0, 1, 2]);
  });
});

describe("invertDrag", () => {
  it("vertical: a drag DOWN steps +1, a drag UP steps back; the card follows the finger's sign flipped", async () => {
    const ends: number[] = [];
    render(<ControlledDeck invertDrag onEnd={(i) => ends.push(i)} />);
    const c = createGestureController<Record<string, number>>("deck-pan");
    act(() => {
      c.begin({ translationX: 0, translationY: 0 });
      c.activate({ translationX: 0, translationY: 12 });
      c.update({ translationX: 0, translationY: 40 });
    });
    // Same motion as an UNinverted drag of -40: the front card leaves upward.
    expect(translate(0, "Y")).toBeLessThan(0);
    act(() => c.update({ translationX: 0, translationY: 60 }));
    act(() => c.end({ translationX: 0, translationY: 60, velocityX: 0, velocityY: 0 }));
    await waitFor(() => expect(ends).toEqual([1]));
    expect(visibleStack()).toEqual([1, 2, 3]);

    drag(pan(), line(0, -60));
    await waitFor(() => expect(ends).toEqual([1, 0]));
    expect(visibleStack()).toEqual([0, 1, 2]);
  });

  it("vertical: the drag that steps an uninverted deck forward does nothing at index 0", async () => {
    const ends: number[] = [];
    render(<ControlledDeck invertDrag overscrollEnabled={false} onEnd={(i) => ends.push(i)} />);
    drag(pan(), line(0, -80));
    await waitFor(() => expect(ends).toEqual([0]));
  });

  it("horizontal: a drag RIGHT steps +1, a drag LEFT steps back", async () => {
    const ends: number[] = [];
    render(
      <ControlledDeck
        invertDrag
        vertical={false}
        mode="horizontal-stack"
        onEnd={(i) => ends.push(i)}
      />,
    );
    drag(pan(), line(60, 0));
    await waitFor(() => expect(ends).toEqual([1]));
    drag(pan(), line(-60, 0));
    await waitFor(() => expect(ends).toEqual([1, 0]));
  });

  it("a plain (non-stack) carousel inverts too", async () => {
    const ends: number[] = [];
    render(
      <Carousel
        data={DATA}
        loop={false}
        invertDrag
        itemSize={PAGE}
        scrollAnimationDuration={DURATION}
        style={{ width: PAGE, height: PAGE }}
        gestureConfig={GESTURE}
        renderItem={renderItem}
        onScrollEnd={(i) => ends.push(i)}
      />,
    );
    drag(pan(), line(60, 0));
    await waitFor(() => expect(ends).toEqual([1]));
  });

  it.each([
    ["inverted, fling down", true, 900, 1],
    ["inverted, fling up", true, -900, 0],
    ["plain, fling down", false, 900, 0],
    ["plain, fling up", false, -900, 1],
  ] as const)("%s: a short fast flick follows the drag sign", async (_n, invert, vy, expected) => {
    const ends: number[] = [];
    render(<ControlledDeck invertDrag={invert} onEnd={(i) => ends.push(i)} />);
    drag(pan(), line(0, Math.sign(vy) * 20), [0, vy]);
    await waitFor(() => expect(ends).toEqual([expected]));
  });

  it("a slow inverted drag under half a page snaps back", async () => {
    const ends: number[] = [];
    render(<ControlledDeck invertDrag onEnd={(i) => ends.push(i)} />);
    drag(pan(), line(0, 40), [0, 60]);
    await waitFor(() => expect(ends).toEqual([0]));
    expect(translate(0, "Y")).toBe(0);
  });

  it("two-axis: only the main axis flips; the cross drag keeps its direction", async () => {
    const ends: number[] = [];
    render(
      <ControlledDeck invertDrag crossAxis={{ itemSize: PAGE }} onEnd={(i) => ends.push(i)} />,
    );
    drag(pan(), line(0, 60)); // down → next (inverted main)
    await waitFor(() => expect(ends).toEqual([1]));
    drag(pan(), line(-60, 0)); // left → next (cross, unchanged)
    await waitFor(() => expect(ends).toEqual([1, 2]));
    drag(pan(), line(60, 0)); // right → back
    await waitFor(() => expect(ends).toEqual([1, 2, 1]));
  });

  it("wheel and keys keep their directions", async () => {
    const ends: number[] = [];
    render(<ControlledDeck invertDrag testID="deck" onEnd={(i) => ends.push(i)} />);
    const frame = document.querySelector('[data-testid="deck"]') as HTMLElement;
    act(() => {
      frame.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    await waitFor(() => expect(ends).toEqual([1]));
    act(() => {
      frame.dispatchEvent(
        new WheelEvent("wheel", { deltaX: 0, deltaY: 40, bubbles: true, cancelable: true }),
      );
    });
    await waitFor(() => expect(ends).toEqual([1, 2]));
  });
});

describe("data appended mid-gesture", () => {
  /** A deck whose parent can grow its data (e.g. the next page of a feed). */
  function GrowingDeck({
    growRef,
    ...props
  }: Props & { growRef: { current: (() => void) | null }; onEnd: (i: number) => void }) {
    const [data, setData] = React.useState(DATA.slice(0, 5));
    growRef.current = () => setData((d) => [...d, ...DATA.slice(d.length, d.length + 5)]);
    return <ControlledDeck data={data} {...props} />;
  }

  it("items appended while the drag is held: the card stays under the finger and lands", async () => {
    const ends: number[] = [];
    const grow: { current: (() => void) | null } = { current: null };
    render(<GrowingDeck growRef={grow} onEnd={(i) => ends.push(i)} />);
    const c = createGestureController<Record<string, number>>("deck-pan");
    act(() => {
      c.begin({ translationX: 0, translationY: 0 });
      c.activate({ translationX: 0, translationY: -12 });
      c.update({ translationX: 0, translationY: -40 });
    });
    const before = translate(0, "Y");
    expect(before).toBeLessThan(0);
    act(() => grow.current!());
    expect(translate(0, "Y")).toBeCloseTo(before);
    act(() => c.update({ translationX: 0, translationY: -60 }));
    act(() => c.end({ translationX: 0, translationY: -60, velocityX: 0, velocityY: 0 }));
    await waitFor(() => expect(ends).toEqual([1]));
    expect(visibleStack()).toEqual([1, 2, 3]);
  });

  it("items appended while the settle animates: it still lands on the next card", async () => {
    const ends: number[] = [];
    const grow: { current: (() => void) | null } = { current: null };
    render(
      <GrowingDeck growRef={grow} scrollAnimationDuration={300} onEnd={(i) => ends.push(i)} />,
    );
    drag(pan(), line(0, -60));
    // Mid-settle: the deck is between card 0 and card 1.
    act(() => grow.current!());
    await waitFor(() => expect(ends).toEqual([1]));
    expect(visibleStack()).toEqual([1, 2, 3]);
  });

  it("items appended at rest leave the deck where it is", async () => {
    const ends: number[] = [];
    const grow: { current: (() => void) | null } = { current: null };
    render(<GrowingDeck growRef={grow} onEnd={(i) => ends.push(i)} />);
    drag(pan(), line(0, -60));
    await waitFor(() => expect(ends).toEqual([1]));
    act(() => grow.current!());
    expect(visibleStack()).toEqual([1, 2, 3]);
    expect(translate(1, "Y")).toBe(0);
  });

  it("data shrunk under the active item still clamps to the last one", () => {
    const ref = React.createRef<CarouselRef>();
    const setData: { current: ((d: number[]) => void) | null } = { current: null };
    function Shrinking() {
      const [data, set] = React.useState(DATA.slice(0, 8));
      setData.current = set;
      return <ControlledDeck carouselRef={ref} data={data} />;
    }
    render(<Shrinking />);
    act(() => ref.current!.scrollTo({ index: 6, animated: false }));
    act(() => setData.current!(DATA.slice(0, 3)));
    expect(ref.current!.getCurrentIndex()).toBe(2);
  });
});
