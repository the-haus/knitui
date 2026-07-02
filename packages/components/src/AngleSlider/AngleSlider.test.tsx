import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { AngleSlider, type AngleSliderSize } from "./AngleSlider";

const SIZES: AngleSliderSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

describe("AngleSlider", () => {
  it("exposes the slider role", () => {
    render(<AngleSlider aria-label="angle" />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("reflects the current value via aria-valuenow", () => {
    render(<AngleSlider aria-label="angle" defaultValue={90} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "90");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuemax", "359");
  });

  it("renders the value label by default", () => {
    render(<AngleSlider aria-label="angle" defaultValue={45} />);
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("changes value on arrow key press and fires onChangeEnd", () => {
    const onChangeEnd = jest.fn();
    render(<AngleSlider aria-label="angle" defaultValue={0} step={10} onChangeEnd={onChangeEnd} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "10");
    expect(onChangeEnd).toHaveBeenCalledWith(10);
  });

  it("respects a controlled value", () => {
    render(<AngleSlider aria-label="angle" value={180} onChange={() => {}} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "180");
  });

  it("accepts every token size", () => {
    for (const size of SIZES) {
      const { unmount } = render(<AngleSlider aria-label={`angle ${size}`} size={size} />);
      expect(screen.getByRole("slider", { name: `angle ${size}` })).toBeInTheDocument();
      unmount();
    }
  });

  it("accepts a numeric custom size", () => {
    render(<AngleSlider aria-label="angle" size={96} />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("does not respond to keys when disabled", () => {
    const onChangeEnd = jest.fn();
    render(<AngleSlider aria-label="angle" defaultValue={0} disabled onChangeEnd={onChangeEnd} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChangeEnd).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-disabled", "true");
  });

  it("forwards refs to the slider root", () => {
    const ref = React.createRef<GetRef<typeof AngleSlider>>();
    render(<AngleSlider ref={ref} aria-label="angle" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("exposes the styled parts as statics", () => {
    expect(AngleSlider.Frame).toBeDefined();
    expect(AngleSlider.Label).toBeDefined();
    expect(AngleSlider.Thumb).toBeDefined();
    expect(AngleSlider.ThumbKnob).toBeDefined();
    expect(AngleSlider.Marks).toBeDefined();
    expect(AngleSlider.Mark).toBeDefined();
    expect(AngleSlider.MarkTick).toBeDefined();
    expect(AngleSlider.MarkLabel).toBeDefined();
  });

  it("reaches the frame part via the frame styles slot", () => {
    render(<AngleSlider aria-label="angle" styles={{ frame: { testID: "ring" } }} />);
    expect(screen.getByTestId("ring")).toBe(screen.getByRole("slider"));
  });

  it("reaches the centre label via the label styles slot", () => {
    render(
      <AngleSlider
        aria-label="angle"
        defaultValue={45}
        styles={{ label: { testID: "centre-label" } }}
      />,
    );
    expect(screen.getByTestId("centre-label")).toHaveTextContent("45");
  });
});
