import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { ColorSwatch, type ColorSwatchSize } from "./ColorSwatch";

const SIZES: ColorSwatchSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

describe("ColorSwatch", () => {
  it("renders without throwing", () => {
    const { container } = render(<ColorSwatch color="#ff0000" />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders its children", () => {
    render(<ColorSwatch color="#00ff00">picked</ColorSwatch>);
    expect(screen.getByText("picked")).toBeInTheDocument();
  });

  it.each([16, 28, 48] as const)("renders with numeric size %s", (size) => {
    render(
      <ColorSwatch color="#0000ff" size={size}>
        {`s-${size}`}
      </ColorSwatch>,
    );
    expect(screen.getByText(`s-${size}`)).toBeInTheDocument();
  });

  it.each(SIZES)("renders with token size %s", (size) => {
    render(
      <ColorSwatch color="#0000ff" size={size}>
        {`s-${size}`}
      </ColorSwatch>,
    );
    expect(screen.getByText(`s-${size}`)).toBeInTheDocument();
  });

  it("renders with withShadow disabled", () => {
    render(
      <ColorSwatch color="#123456" withShadow={false}>
        no-shadow
      </ColorSwatch>,
    );
    expect(screen.getByText("no-shadow")).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof ColorSwatch>>();
    render(<ColorSwatch ref={ref} color="#abcdef" />);
    expect(ref.current).not.toBeNull();
  });

  it("exposes its styled subparts", () => {
    expect(ColorSwatch.Frame).toBeDefined();
    expect(ColorSwatch.Overlay).toBeDefined();
  });

  it("reaches the inset overlay ring via the `overlay` slot", () => {
    render(<ColorSwatch color="#ff0000" styles={{ overlay: { testID: "ring" } }} />);
    expect(screen.getByTestId("ring")).toBeInTheDocument();
  });

  it("does not render the overlay slot target when withShadow is false", () => {
    render(
      <ColorSwatch color="#ff0000" withShadow={false} styles={{ overlay: { testID: "ring" } }} />,
    );
    expect(screen.queryByTestId("ring")).not.toBeInTheDocument();
  });

  describe("v3 style resolution (web CSS)", () => {
    it("paints the colour with a themed drop shadow (bare dropShadowColor)", () => {
      render(<ColorSwatch color="#ff0000" testID="s" />);
      const swatch = screen.getByTestId("s");
      expect(baseValue(swatch, "background-color")).toBe("#ff0000");
      expect(baseValue(swatch, "box-shadow")).toBe("0px 1px 2px 0px var(--dropShadowColor)");
    });

    it("withShadow={false} drops the shadow", () => {
      render(<ColorSwatch color="#ff0000" withShadow={false} testID="s" />);
      expect(baseValue(screen.getByTestId("s"), "box-shadow")).toBeUndefined();
    });

    it.each(SIZES)("size=%s is a square", (size) => {
      render(<ColorSwatch color="#000" size={size} testID="s" />);
      expect(baseValue(screen.getByTestId("s"), "width")).toBe(`var(--t-size-${size})`);
      expect(baseValue(screen.getByTestId("s"), "height")).toBe(`var(--t-size-${size})`);
    });

    it("radius takes a key, a number, or the 9999 pill default", () => {
      render(
        <>
          <ColorSwatch color="#000" radius="sm" testID="k" />
          <ColorSwatch color="#000" radius={4} testID="n" />
          <ColorSwatch color="#000" testID="d" />
        </>,
      );
      expect(baseValue(screen.getByTestId("k"), "border-radius")).toBe("var(--t-radius-sm)");
      expect(baseValue(screen.getByTestId("n"), "border-radius")).toBe("4px");
      expect(baseValue(screen.getByTestId("d"), "border-radius")).toBe("9999px");
    });
  });
});
