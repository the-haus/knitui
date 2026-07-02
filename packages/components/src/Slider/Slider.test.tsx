import * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
import { Slider } from "./Slider";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Slider", () => {
  it.each(SIZES)("supports the %s size", (size) => {
    render(<Slider size={size} />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("exposes a slider role with default aria bounds", () => {
    render(<Slider />);
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "100");
  });

  it("reflects defaultValue in aria-valuenow", () => {
    render(<Slider defaultValue={30} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
  });

  it("preserves decimal values in aria-valuenow on web", () => {
    render(<Slider min={0} max={5} step={0.1} precision={1} defaultValue={2.5} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "2.5");
  });

  it("respects custom min and max bounds", () => {
    render(<Slider min={10} max={50} defaultValue={20} />);
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-valuemin", "10");
    expect(thumb).toHaveAttribute("aria-valuemax", "50");
  });

  it("fires onChange when stepping with the keyboard", () => {
    const onChange = jest.fn();
    render(<Slider defaultValue={50} step={5} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalled();
  });

  it("jumps to max on End key", () => {
    const onChange = jest.fn();
    render(<Slider defaultValue={10} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it("does not fire onChange when disabled", () => {
    const onChange = jest.fn();
    render(<Slider defaultValue={50} disabled onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("sets aria-label on the thumb", () => {
    render(<Slider thumbLabel="Volume" />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-label", "Volume");
  });

  it("renders a hidden form input on web when name is provided", () => {
    const { container } = render(<Slider name="volume" defaultValue={25} />);
    const input = container.querySelector("input[name='volume']");
    expect(input).toHaveAttribute("type", "hidden");
    expect(input).toHaveValue("25");
  });

  describe("composable parts", () => {
    it("exposes the styled parts as statics", () => {
      expect(Slider.Root).toBeDefined();
      expect(Slider.Track).toBeDefined();
      expect(Slider.Bar).toBeDefined();
      expect(Slider.Thumb).toBeDefined();
      expect(Slider.Mark).toBeDefined();
      expect(Slider.MarkLabel).toBeDefined();
      expect(Slider.Label).toBeDefined();
      expect(Slider.TrackContainer).toBeDefined();
      expect(Slider.LabelAnchor).toBeDefined();
    });

    it("renders a thumb composed from Slider.Thumb directly", () => {
      render(
        <Slider.Root>
          <Slider.Thumb role="slider" aria-label="composed" data-testid="thumb" />
        </Slider.Root>,
      );
      expect(screen.getByRole("slider", { name: "composed" })).toBeInTheDocument();
    });
  });

  describe("styles slot", () => {
    it("reaches the thumb part via the thumb slot", () => {
      render(<Slider styles={{ thumb: { testID: "styled-thumb" } }} />);
      expect(screen.getByTestId("styled-thumb")).toBe(screen.getByRole("slider"));
    });

    it("lets the deprecated thumbProps win over the thumb slot", () => {
      render(
        <Slider
          styles={{ thumb: { "aria-label": "from-slot" } }}
          thumbProps={{ "aria-label": "from-props" }}
        />,
      );
      expect(screen.getByRole("slider")).toHaveAttribute("aria-label", "from-props");
    });
  });
});
