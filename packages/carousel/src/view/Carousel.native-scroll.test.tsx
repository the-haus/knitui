import * as React from "react";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";

import { Text } from "@knitui/components";

import { Carousel } from "../index";
import { act, fireEvent, render, screen, waitFor } from "../test-utils";
import type { CarouselProps, CarouselRef } from "../types";

/**
 * `scrollMode="native"` renders a real scroll container (resolved to the web
 * track under jsdom). These tests cover the behaviours unique to native mode:
 * mount-all (no virtualization), loop forced off, the imperative controller /
 * controlled index driving the container, and the scroll→offset sync that keeps
 * pagination in step.
 */
function renderNative(
  props: Partial<CarouselProps<number>> & { data: number[] },
  ref?: React.Ref<CarouselRef>,
) {
  const { data, ...rest } = props;
  return render(
    <Carousel
      ref={ref}
      data={data}
      scrollMode="native"
      itemSize={100}
      style={{ width: 100, height: 100 }}
      testID="carousel"
      renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
      {...rest}
    />,
  );
}

describe("Carousel — native scroll mode", () => {
  it("mounts every slide (no windowed virtualization)", () => {
    renderNative({ data: Array.from({ length: 12 }, (_, i) => i), loop: false });
    // Transform mode would window a 12-item list; native mounts them all.
    expect(screen.getByText("slide-0")).toBeTruthy();
    expect(screen.getByText("slide-6")).toBeTruthy();
    expect(screen.getByText("slide-11")).toBeTruthy();
  });

  it("loops without warning: clones the ring and wraps past the ends", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const ref = React.createRef<CarouselRef>();
      renderNative({ data: [0, 1, 2], loop: true }, ref);
      // No "loop unsupported" warning any more.
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("loop"));

      // The ring is cloned LOOP_COPIES (3) times, so each item mounts 3×.
      expect(screen.getAllByText("slide-0")).toHaveLength(3);
      expect(screen.getAllByText("slide-2")).toHaveLength(3);

      // Looping: prev from the first item wraps to the last.
      act(() => ref.current?.prev({ animated: false }));
      await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(2));
      // …and next from the last wraps back to the first.
      act(() => ref.current?.next({ animated: false }));
      await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(0));
    } finally {
      process.env.NODE_ENV = prevEnv;
      warn.mockRestore();
    }
  });

  it("does not clone when loop is disabled", () => {
    renderNative({ data: [0, 1, 2], loop: false });
    expect(screen.getAllByText("slide-0")).toHaveLength(1);
  });

  it("scrollTo({ index }) drives the container and reports the index", async () => {
    const onIndexChange = jest.fn();
    const ref = React.createRef<CarouselRef>();
    renderNative({ data: [0, 1, 2, 3], onIndexChange }, ref);

    act(() => ref.current?.scrollTo({ index: 2, animated: false }));

    await waitFor(() => expect(onIndexChange).toHaveBeenCalledWith(2));
    expect(ref.current?.getCurrentIndex()).toBe(2);
  });

  it("next()/prev() step and clamp at the boundaries", async () => {
    const ref = React.createRef<CarouselRef>();
    renderNative({ data: [0, 1, 2], loop: false }, ref);

    act(() => ref.current?.next({ animated: false }));
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(1));

    act(() => ref.current?.next({ animated: false }));
    act(() => ref.current?.next({ animated: false })); // past the end → clamps
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(2));
  });

  it("keeps an external scrollOffsetValue in sync with the controller", async () => {
    let sv!: SharedValue<number>;
    const ref = React.createRef<CarouselRef>();
    function Harness() {
      sv = useSharedValue(0);
      return (
        <Carousel
          ref={ref}
          data={[0, 1, 2, 3]}
          scrollMode="native"
          itemSize={100}
          scrollOffsetValue={sv}
          style={{ width: 100, height: 100 }}
          testID="carousel"
          renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
        />
      );
    }
    render(<Harness />);

    act(() => ref.current?.scrollTo({ index: 3, animated: false }));
    // offset px = -index * pageSize.
    await waitFor(() => expect(sv.value).toBe(-300));
  });

  it("mirrors a user scroll into progress / the active index", async () => {
    const onProgressChange = jest.fn();
    const onIndexChange = jest.fn();
    renderNative({ data: [0, 1, 2, 3], onProgressChange, onIndexChange });

    const scroll = screen.getByTestId("carousel-scroll");
    // jsdom has no layout, so the scrollLeft getter is inert — define it so the
    // handler reads a real value, then dispatch the scroll event.
    Object.defineProperty(scroll, "scrollLeft", { value: 200, configurable: true });
    fireEvent.scroll(scroll);

    // scrollLeft 200 @ pageSize 100 → offset -200 → progress/index 2.
    await waitFor(() => expect(onIndexChange).toHaveBeenCalledWith(2));
    expect(onProgressChange).toHaveBeenCalled();
  });

  it("supports vertical native scrolling", () => {
    renderNative({ data: [0, 1, 2], vertical: true, loop: false });
    expect(screen.getByText("slide-0")).toBeTruthy();
    expect(screen.getByTestId("carousel-scroll")).toBeTruthy();
  });

  it("follows a controlled index", async () => {
    const onIndexChange = jest.fn();
    const Controlled = ({ index }: { index: number }) => (
      <Carousel
        data={[0, 1, 2, 3]}
        scrollMode="native"
        index={index}
        itemSize={100}
        onIndexChange={onIndexChange}
        style={{ width: 100, height: 100 }}
        testID="carousel"
        renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
      />
    );
    const { rerender } = render(<Controlled index={0} />);
    rerender(<Controlled index={2} />);
    await waitFor(() => expect(onIndexChange).toHaveBeenCalledWith(2));
  });
});
