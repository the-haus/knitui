import * as React from "react";

import { Box, Text } from "@knitui/components";

import { Carousel } from "../index";
import { act, render, screen, waitFor } from "../test-utils";
import type { CarouselProps, CarouselRef } from "../types";

function renderCarousel(
  props: Partial<CarouselProps<number>> & { data: number[] },
  ref?: React.Ref<CarouselRef>,
) {
  const { data, ...rest } = props;
  return render(
    <Carousel
      ref={ref}
      data={data}
      itemSize={100}
      style={{ width: 100, height: 100 }}
      renderItem={({ item }) => (
        <Box>
          <Text>{`slide-${item}`}</Text>
        </Box>
      )}
      {...rest}
    />,
  );
}

describe("Carousel — rendering & virtualization", () => {
  it("renders the initial slide", () => {
    renderCarousel({ data: [0, 1, 2], loop: false });
    expect(screen.getByText("slide-0")).toBeTruthy();
  });

  it("mounts only the windowed subset for large data sets", () => {
    renderCarousel({ data: Array.from({ length: 10 }, (_, i) => i), loop: false, windowSize: 3 });
    // window around index 0 (non-loop) = [0,1,2]
    expect(screen.getByText("slide-0")).toBeTruthy();
    expect(screen.getByText("slide-2")).toBeTruthy();
    expect(screen.queryByText("slide-5")).toBeNull();
  });

  it("honours defaultIndex for the initial window", () => {
    renderCarousel({
      data: Array.from({ length: 10 }, (_, i) => i),
      loop: false,
      windowSize: 3,
      defaultIndex: 5,
    });
    expect(screen.getByText("slide-5")).toBeTruthy();
    expect(screen.queryByText("slide-0")).toBeNull();
  });
});

describe("Carousel — imperative controller", () => {
  it("scrollTo({ index }) reports the new active index", async () => {
    const onIndexChange = jest.fn();
    const ref = React.createRef<CarouselRef>();
    renderCarousel({ data: [0, 1, 2, 3], loop: false, onIndexChange }, ref);

    act(() => {
      ref.current?.scrollTo({ index: 2, animated: false });
    });

    await waitFor(() => expect(onIndexChange).toHaveBeenCalledWith(2));
    expect(ref.current?.getCurrentIndex()).toBe(2);
  });

  it("next() advances and prev() goes back", async () => {
    const onIndexChange = jest.fn();
    const ref = React.createRef<CarouselRef>();
    renderCarousel({ data: [0, 1, 2, 3], loop: false, onIndexChange }, ref);

    act(() => {
      ref.current?.next({ animated: false });
    });
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(1));

    act(() => {
      ref.current?.next({ animated: false });
    });
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(2));

    act(() => {
      ref.current?.prev({ animated: false });
    });
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(1));
  });

  it("clamps at the boundaries in non-loop mode", async () => {
    const ref = React.createRef<CarouselRef>();
    renderCarousel({ data: [0, 1, 2], loop: false }, ref);

    act(() => {
      ref.current?.prev({ animated: false }); // already at 0
    });
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(0));

    act(() => {
      ref.current?.scrollTo({ index: 99, animated: false }); // past the end
    });
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(2));
  });

  it("fires onSnapToItem and onScrollEnd", async () => {
    const onSnapToItem = jest.fn();
    const onScrollEnd = jest.fn();
    const ref = React.createRef<CarouselRef>();
    renderCarousel({ data: [0, 1, 2, 3], loop: false, onSnapToItem, onScrollEnd }, ref);

    act(() => {
      ref.current?.scrollTo({ index: 3, animated: false });
    });

    await waitFor(() => expect(onSnapToItem).toHaveBeenCalledWith(3));
    await waitFor(() => expect(onScrollEnd).toHaveBeenCalledWith(3));
  });
});

describe("Carousel — controlled index", () => {
  it("follows a controlled `index` prop", async () => {
    const onIndexChange = jest.fn();
    const Controlled = ({ index }: { index: number }) => (
      <Carousel
        data={[0, 1, 2, 3]}
        index={index}
        itemSize={100}
        loop={false}
        onIndexChange={onIndexChange}
        style={{ width: 100, height: 100 }}
        withAnimation={{ type: "timing", config: { duration: 1 } }}
        renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
      />
    );
    const { rerender } = render(<Controlled index={0} />);
    rerender(<Controlled index={2} />);
    await waitFor(() => expect(onIndexChange).toHaveBeenCalledWith(2));
  });
});
