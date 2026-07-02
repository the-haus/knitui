import * as React from "react";

import type { GetRef } from "@knitui/core";

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
});
