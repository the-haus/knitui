import * as React from "react";

import type { GetRef } from "@knitui/core";

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
