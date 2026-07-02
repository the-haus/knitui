import * as React from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

import { Text } from "@knitui/components";

import { Carousel } from "../index";
import { act, render, waitFor } from "../test-utils";
import type { CarouselProps, CarouselRef } from "../types";

type Props = Partial<CarouselProps<number>> & { data: number[] };

function mount(props: Props, ref?: React.Ref<CarouselRef>) {
  const { data, ...rest } = props;
  return render(
    <Carousel
      ref={ref}
      data={data}
      style={{ width: 100, height: 100 }}
      renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
      {...rest}
    />,
  );
}

describe("Carousel — external scrollOffsetValue", () => {
  it("writes the live scroll offset into the provided shared value", async () => {
    const ref = React.createRef<CarouselRef>();
    let sv!: SharedValue<number>;
    function Wrapper() {
      sv = useSharedValue(0);
      return (
        <Carousel
          ref={ref}
          data={[0, 1, 2, 3]}
          loop={false}
          itemSize={100}
          scrollOffsetValue={sv}
          style={{ width: 100, height: 100 }}
          renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
        />
      );
    }
    render(<Wrapper />);

    act(() => {
      ref.current?.scrollTo({ index: 2, animated: false });
    });
    // offsetFor(2, 100) === -200
    await waitFor(() => expect(sv.value).toBe(-200));
  });
});

describe("Carousel — onProgressChange shared value", () => {
  it("writes the absolute progress into a SharedValue", async () => {
    const ref = React.createRef<CarouselRef>();
    let prog!: SharedValue<number>;
    function Wrapper() {
      prog = useSharedValue(0);
      return (
        <Carousel
          ref={ref}
          data={[0, 1, 2, 3]}
          loop={false}
          itemSize={100}
          onProgressChange={prog}
          style={{ width: 100, height: 100 }}
          renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
        />
      );
    }
    render(<Wrapper />);

    act(() => {
      ref.current?.scrollTo({ index: 2, animated: false });
    });
    await waitFor(() => expect(prog.value).toBe(2));
  });

  it("still supports the callback form", async () => {
    const onProgressChange = jest.fn();
    const ref = React.createRef<CarouselRef>();
    mount({ data: [0, 1, 2, 3], loop: false, itemSize: 100, onProgressChange }, ref);

    act(() => {
      ref.current?.scrollTo({ index: 2, animated: false });
    });
    await waitFor(() => expect(onProgressChange).toHaveBeenCalledWith(expect.any(Number), 2));
  });
});

describe("Carousel — itemWidth / itemHeight page-size aliases", () => {
  it("uses itemWidth as the horizontal page size (no measurement needed)", async () => {
    const ref = React.createRef<CarouselRef>();
    mount({ data: [0, 1, 2, 3], loop: false, itemWidth: 100 }, ref);

    act(() => {
      ref.current?.scrollTo({ index: 1, animated: false });
    });
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(1));
  });

  it("uses itemHeight as the vertical page size", async () => {
    const ref = React.createRef<CarouselRef>();
    mount({ data: [0, 1, 2, 3], loop: false, vertical: true, itemHeight: 100 }, ref);

    act(() => {
      ref.current?.scrollTo({ index: 2, animated: false });
    });
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(2));
  });
});

describe("Carousel — fixedDirection", () => {
  it('"positive" travels forward to the nearest copy in loop mode', async () => {
    const ref = React.createRef<CarouselRef>();
    let sv!: SharedValue<number>;
    function Wrapper() {
      sv = useSharedValue(0);
      return (
        <Carousel
          ref={ref}
          data={[0, 1, 2, 3, 4]}
          loop
          itemSize={100}
          fixedDirection="positive"
          scrollOffsetValue={sv}
          style={{ width: 100, height: 100 }}
          renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
        />
      );
    }
    render(<Wrapper />);

    // From index 0 the short way to index 4 is backward (offset +100); forcing
    // "positive" should travel forward to offset -400 instead.
    act(() => {
      ref.current?.scrollTo({ index: 4, animated: false });
    });
    await waitFor(() => expect(sv.value).toBe(-400));
  });

  it('"negative" travels backward to the nearest copy in loop mode', async () => {
    const ref = React.createRef<CarouselRef>();
    let sv!: SharedValue<number>;
    function Wrapper() {
      sv = useSharedValue(0);
      return (
        <Carousel
          ref={ref}
          data={[0, 1, 2, 3, 4]}
          loop
          itemSize={100}
          fixedDirection="negative"
          scrollOffsetValue={sv}
          style={{ width: 100, height: 100 }}
          renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
        />
      );
    }
    render(<Wrapper />);

    // Short way to index 1 is forward (offset -100); "negative" forces backward
    // to offset +400.
    act(() => {
      ref.current?.scrollTo({ index: 1, animated: false });
    });
    await waitFor(() => expect(sv.value).toBe(400));
  });
});
