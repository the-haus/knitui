/**
 * v3 chrome invariants of the carousel, asserted on the injected CSS rules.
 *
 * CRITICAL (repo memory `carousel-tamagui-slots`): `Carousel` (Frame) and its
 * viewport must be `position: relative`, or the absolutely-stacked slides anchor
 * to the wrong ancestor and mis-size. A Tamagui `Box` is `static` on web, so the
 * styled bases carry it, and no slot style / prop path may clear it.
 */
import * as React from "react";

import { Text } from "@knitui/components";

import { cssRulesOf, declarationsOf } from "../__tests__/css-rules.test.helper";
import { Carousel } from "../index";
import { render, screen } from "../test-utils";
import type { CarouselProps } from "../types";

const DATA = [0, 1, 2];
const renderItem: CarouselProps<number>["renderItem"] = ({ item }) => (
  <Text>{`slide-${item}`}</Text>
);

function lastValue(el: Element, prop: string): string | undefined {
  return declarationsOf(el)
    .filter((d) => d.startsWith(`${prop}:`))
    .at(-1)
    ?.slice(prop.length + 1)
    .trim();
}

function renderCarousel(props: Partial<CarouselProps<number>> = {}) {
  return render(
    <Carousel
      testID="frame"
      data={DATA}
      itemSize={100}
      style={{ width: 100, height: 100 }}
      renderItem={renderItem}
      styles={{ viewport: { testID: "viewport" }, slide: { testID: "slide" } }}
      {...props}
    />,
  );
}

describe("Carousel v3 chrome invariants", () => {
  it.each([
    ["transform", {}],
    ["vertical", { vertical: true }],
    ["native scroll", { scrollMode: "native" as const, loop: false }],
  ])("Frame and Viewport are position: relative (%s)", (_label, extra) => {
    renderCarousel(extra);
    expect(lastValue(screen.getByTestId("frame"), "position")).toBe("relative");
    expect(lastValue(screen.getByTestId("viewport"), "position")).toBe("relative");
  });

  it("keeps position: relative when slot styles restyle Frame and Viewport", () => {
    renderCarousel({
      styles: {
        root: { backgroundColor: "color3", padding: "sm" },
        viewport: { testID: "viewport", borderRadius: "md" },
      },
    });
    expect(lastValue(screen.getByTestId("frame"), "position")).toBe("relative");
    expect(lastValue(screen.getByTestId("viewport"), "position")).toBe("relative");
    expect(lastValue(screen.getByTestId("viewport"), "border-radius")).toBe("var(--t-radius-md)");
  });

  it("maps orientation onto the frame's flex direction", () => {
    renderCarousel({ vertical: true });
    expect(lastValue(screen.getByTestId("frame"), "flex-direction")).toBe("column");
  });

  it("slide hosts are box-none through the prop, never an invalid inline CSS value", () => {
    renderCarousel();
    const host = screen.getAllByTestId("slide")[0].parentElement as HTMLElement;
    expect(host.style.position).toBe("absolute");
    expect(host.getAttribute("style") ?? "").not.toMatch(/pointer-events:\s*box-none/);
  });

  it("scopes the indicator dot transition to the properties its states change", () => {
    renderCarousel({ withIndicators: true, loop: false });
    const dot = screen.getByLabelText("Go to slide 1 of 3").firstElementChild as HTMLElement;
    expect(dot.style.transition).not.toMatch(/\ball\b/);
    expect(dot.style.transition).toMatch(/\bopacity\b/);
    expect(dot.style.transition).toMatch(/background-color/);
  });

  it("never forwards a styled() option as a DOM attribute", () => {
    renderCarousel({ withIndicators: true });
    expect(document.querySelector("[name]")).toBeNull();
    // and the frame's atomic rules exist (it is a real styled frame)
    expect(cssRulesOf(screen.getByTestId("frame")).length).toBeGreaterThan(0);
  });
});

describe("Carousel slide cells are memoised", () => {
  it("does not re-render slide content when the parent re-renders with stable props", () => {
    const calls: number[] = [];
    const counting: CarouselProps<number>["renderItem"] = ({ item }) => {
      calls.push(item);
      return <Text>{`slide-${item}`}</Text>;
    };
    function Host({ tick }: { tick: number }) {
      return (
        <>
          <Text>{`tick-${tick}`}</Text>
          <Carousel data={DATA} itemSize={100} style={STYLE} renderItem={counting} />
        </>
      );
    }
    const STYLE = { width: 100, height: 100 };
    const { rerender } = render(<Host tick={0} />);
    const before = calls.length;
    expect(before).toBeGreaterThan(0);
    rerender(<Host tick={1} />);
    expect(calls.length).toBe(before);
  });
});
