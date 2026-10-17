import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseDeclarations, baseValue } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { RollingNumber } from "./RollingNumber";

describe("RollingNumber", () => {
  it("renders with role=img by default and an accessible label", () => {
    render(<RollingNumber value={42} />);
    const region = screen.getByRole("img");
    expect(region).toHaveAttribute("aria-label", "42");
  });

  it("uses an aria-live status region when withLiveRegion is set", () => {
    render(<RollingNumber value={7} withLiveRegion />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("includes prefix and suffix in the accessible label", () => {
    render(<RollingNumber value={1000} prefix="$" thousandSeparator suffix=" USD" />);
    const region = screen.getByRole("img");
    expect(region).toHaveAttribute("aria-label", "$1,000 USD");
  });

  it("applies decimalScale with fixedDecimalScale in the label", () => {
    render(<RollingNumber value={5} decimalScale={2} fixedDecimalScale />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "5.00");
  });

  it("renders without throwing for a negative value", () => {
    render(<RollingNumber value={-3} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "-3");
  });

  it("accepts font-size token values", () => {
    render(<RollingNumber value={12} fontSize="xxs" />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "12");
  });

  it("accepts a numeric custom font size", () => {
    render(<RollingNumber value={12} fontSize={40} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "12");
  });

  it("forwards refs to the root frame", () => {
    const ref = React.createRef<GetRef<typeof RollingNumber>>();
    render(<RollingNumber ref={ref} value={42} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("exposes styled subparts", () => {
    render(<RollingNumber.Root data-testid="root" />);
    expect(screen.getByTestId("root")).toBeInTheDocument();
  });

  it("threads the digit-column slots through every digit", () => {
    render(
      <RollingNumber
        value={42}
        styles={{
          digitViewport: { testID: "viewport" },
          digitText: { testID: "digit-text" },
        }}
      />,
    );
    // Two digits → two viewports, each with a 10-glyph strip → 20 glyph texts.
    expect(screen.getAllByTestId("viewport")).toHaveLength(2);
    expect(screen.getAllByTestId("digit-text")).toHaveLength(20);
  });
});

describe("RollingNumber v3 style resolution (web CSS)", () => {
  const columns = (id: string) =>
    Array.from(screen.getByTestId(id).children).filter((el) => el.children.length > 0);

  it("rolls each strip by translateY with one shared timed transition", () => {
    render(<RollingNumber testID="r" value={12} fontSize="md" />);
    const [tens, ones] = columns("r");
    const strip = (col: Element) => col.firstElementChild as HTMLElement;
    expect(strip(tens!).style.transition).toBe("all 600ms ease");
    expect((tens as HTMLElement).style.transition).toBe("all 600ms ease");
    const digit = baseValue(strip(tens!).firstElementChild!, "height")!;
    const px = parseInt(digit, 10);
    expect(baseDeclarations(strip(tens!)).join(";")).toContain(`-${px}px`);
    expect(baseDeclarations(strip(ones!)).join(";")).toContain(`-${2 * px}px`);
  });

  it("uses the bare font token and tabular mono digits by default", () => {
    render(<RollingNumber testID="r" value={3} fontSize="md" />);
    const glyph = columns("r")[0]!.firstElementChild!.firstElementChild!;
    expect(baseValue(glyph, "font-size")).toBe("var(--f-size-md)");
    expect(glyph.className).toContain("font_mono");
  });

  it("drops the mono family (no explicit undefined) when tabularNumbers is off", () => {
    render(<RollingNumber testID="r" value={3} tabularNumbers={false} fontSize={20} />);
    const glyph = columns("r")[0]!.firstElementChild!.firstElementChild!;
    expect(glyph.className).not.toContain("font_mono");
    expect(baseValue(glyph, "font-size")).toBe("20px");
    expect(baseValue(glyph, "height")).toBe("25px"); // round(20 * 1.25)
    // an absolute line box, NOT v3's unitless ratio (`line-height: 25` = 25×)
    expect(baseValue(glyph, "line-height")).toBe("25px");
  });

  it("snaps (transition none) with animationDuration=0", () => {
    render(<RollingNumber testID="r" value={5} animationDuration={0} />);
    const strip = columns("r")[0]!.firstElementChild as HTMLElement;
    expect(strip.style.transition).not.toContain("600ms");
  });

  it("does not forward animationDuration as a CSS property", () => {
    render(<RollingNumber testID="r" value={5} animationDuration={900} />);
    const root = screen.getByTestId("r");
    expect(root.style.animationDuration).toBe("");
    expect(baseValue(root, "animation-duration")).toBeUndefined();
  });
});
