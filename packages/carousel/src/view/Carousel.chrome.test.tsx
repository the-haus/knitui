import * as React from "react";

import { Text } from "@knitui/components";

import { Carousel } from "../index";
import { render, screen } from "../test-utils";
import type { CarouselProps } from "../types";

const DATA = [0, 1, 2, 3];
const renderItem: CarouselProps<number>["renderItem"] = ({ item }) => (
  <Text>{`slide-${item}`}</Text>
);

function renderCarousel(props: Partial<CarouselProps<number>>) {
  return render(
    <Carousel
      data={DATA}
      itemSize={100}
      style={{ width: 100, height: 100 }}
      renderItem={renderItem}
      {...props}
    />,
  );
}

describe("Carousel — built-in controls", () => {
  it("renders prev/next buttons when `withControls`", () => {
    renderCarousel({ withControls: true });
    expect(screen.getByLabelText("Previous slide")).toBeTruthy();
    expect(screen.getByLabelText("Next slide")).toBeTruthy();
  });

  it("renders no controls by default", () => {
    renderCarousel({});
    expect(screen.queryByLabelText("Previous slide")).toBeNull();
  });

  it("disables prev at the first slide in non-loop mode", () => {
    renderCarousel({ withControls: true, loop: false });
    expect(screen.getByLabelText("Previous slide")).toBeDisabled();
    expect(screen.getByLabelText("Next slide")).not.toBeDisabled();
  });

  it("`renderControl` fully overrides the built-in button", () => {
    renderCarousel({
      withControls: true,
      renderControl: (dir) => <Text testID={`ctl-${dir}`}>{dir}</Text>,
    });
    expect(screen.getByTestId("ctl-prev")).toBeTruthy();
    expect(screen.getByTestId("ctl-next")).toBeTruthy();
    expect(screen.queryByLabelText("Previous slide")).toBeNull();
  });
});

describe("Carousel — built-in indicators", () => {
  it("renders one dot per real item when `withIndicators`", () => {
    renderCarousel({ withIndicators: true, loop: false });
    expect(screen.getAllByRole("button")).toHaveLength(DATA.length);
    expect(screen.getByLabelText("Go to slide 1 of 4")).toBeTruthy();
  });
});

describe("Carousel — marker slots", () => {
  it("renders custom `Carousel.Controls` instead of the built-in ones", () => {
    render(
      <Carousel
        data={DATA}
        itemSize={100}
        style={{ width: 100, height: 100 }}
        renderItem={renderItem}
      >
        <Carousel.Controls>
          <Text testID="custom-prev">prev</Text>
          <Text testID="custom-next">next</Text>
        </Carousel.Controls>
      </Carousel>,
    );
    expect(screen.getByTestId("custom-prev")).toBeTruthy();
    expect(screen.queryByLabelText("Previous slide")).toBeNull();
  });

  it("renders `Carousel.Overlay` children", () => {
    render(
      <Carousel
        data={DATA}
        itemSize={100}
        style={{ width: 100, height: 100 }}
        renderItem={renderItem}
      >
        <Carousel.Overlay>
          <Text testID="overlay">Featured</Text>
        </Carousel.Overlay>
      </Carousel>,
    );
    expect(screen.getByTestId("overlay")).toBeTruthy();
  });
});

describe("Carousel — styles prop", () => {
  it("dev-warns on an unknown slot key", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    // @ts-expect-error — intentionally passing an unknown slot key.
    renderCarousel({ styles: { nope: { padding: 4 } } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown slot "nope"'));
    warn.mockRestore();
  });
});
