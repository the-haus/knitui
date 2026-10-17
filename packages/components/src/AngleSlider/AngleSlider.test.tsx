import * as React from "react";

import { act } from "@testing-library/react";

import type { GetRef } from "@knitui/core";

import { baseValue, cssRulesOf, hasFocusRing } from "../__tests__/css-rules.test.helper";
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

  describe("keyboard", () => {
    it.each([
      ["ArrowRight", 100],
      ["ArrowUp", 100],
      ["ArrowLeft", 80],
      ["ArrowDown", 80],
      ["PageUp", 190],
      ["PageDown", 350],
      ["Home", 0],
      ["End", 359],
    ])("%s → %d", (key, expected) => {
      const onChangeEnd = jest.fn();
      render(<AngleSlider aria-label="a" defaultValue={90} step={10} onChangeEnd={onChangeEnd} />);
      const slider = screen.getByRole("slider");
      fireEvent.keyDown(slider, { key });
      expect(slider).toHaveAttribute("aria-valuenow", String(expected));
      expect(onChangeEnd).toHaveBeenLastCalledWith(expected);
    });

    it("wraps around past 359", () => {
      render(<AngleSlider aria-label="a" defaultValue={355} step={10} />);
      const slider = screen.getByRole("slider");
      fireEvent.keyDown(slider, { key: "ArrowRight" });
      expect(slider).toHaveAttribute("aria-valuenow", "5");
    });

    it("cycles through marks with restrictToMarks", () => {
      const marks = [{ value: 0 }, { value: 90 }, { value: 180 }, { value: 270 }];
      render(<AngleSlider aria-label="a" defaultValue={90} marks={marks} restrictToMarks />);
      const slider = screen.getByRole("slider");
      fireEvent.keyDown(slider, { key: "ArrowRight" });
      expect(slider).toHaveAttribute("aria-valuenow", "180");
      fireEvent.keyDown(slider, { key: "End" });
      expect(slider).toHaveAttribute("aria-valuenow", "270");
      fireEvent.keyDown(slider, { key: "ArrowRight" });
      expect(slider).toHaveAttribute("aria-valuenow", "0");
    });
  });

  it("maps a pointer drag to the angle around the centre (web)", () => {
    const onChangeEnd = jest.fn();
    render(<AngleSlider aria-label="a" onChangeEnd={onChangeEnd} />);
    const ring = screen.getByRole("slider");
    ring.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
      }) as DOMRect;
    const ev = (type: string, x: number, y: number) =>
      new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
    act(() => {
      ring.dispatchEvent(ev("pointerdown", 100, 50)); // due east → 90°
    });
    expect(ring).toHaveAttribute("aria-valuenow", "90");
    act(() => {
      window.dispatchEvent(ev("pointermove", 50, 100)); // due south → 180°
      window.dispatchEvent(ev("pointerup", 50, 100));
    });
    expect(ring).toHaveAttribute("aria-valuenow", "180");
    expect(onChangeEnd).toHaveBeenLastCalledWith(180);
  });

  it("rotates the thumb to the current angle", () => {
    render(<AngleSlider aria-label="a" defaultValue={45} />);
    const ring = screen.getByRole("slider");
    const rotated = Array.from(ring.querySelectorAll("div")).filter((el) =>
      cssRulesOf(el).some((rule) => rule.includes("rotate: 45deg")),
    );
    expect(rotated).toHaveLength(1);
    fireEvent.keyDown(ring, { key: "ArrowRight" });
    expect(cssRulesOf(rotated[0]!).some((rule) => rule.includes("rotate: 46deg"))).toBe(true);
  });

  it("sizes the ring from the size token scale or a px number", () => {
    render(
      <>
        <AngleSlider aria-label="k" size="lg" />
        <AngleSlider aria-label="n" size={120} />
      </>,
    );
    const k = screen.getByRole("slider", { name: "k" });
    expect(baseValue(k, "width")).toBe("var(--t-size-lg)");
    expect(baseValue(k, "height")).toBe("var(--t-size-lg)");
    expect(baseValue(screen.getByRole("slider", { name: "n" }), "width")).toBe("120px");
  });

  it("paints the ring and knob from the theme ramp and carries the focus ring", () => {
    render(<AngleSlider aria-label="a" />);
    const ring = screen.getByRole("slider");
    expect(ring).toHaveAttribute("tabindex", "0");
    expect(baseValue(ring, "background-color")).toBe("var(--color3)");
    expect(hasFocusRing(ring)).toBe(true);
  });

  it("dims, blocks pointer events and leaves the tab order when disabled", () => {
    render(<AngleSlider aria-label="a" disabled />);
    const ring = screen.getByRole("slider");
    expect(ring).toHaveAttribute("tabindex", "-1");
    expect(baseValue(ring, "opacity")).toBe("0.6");
    expect(baseValue(ring, "pointer-events")).toBe("none");
  });

  it("renders mark labels and a hidden input, with no `name` leak on the ring", () => {
    const { container } = render(
      <AngleSlider
        aria-label="a"
        name="angle"
        defaultValue={30}
        marks={[{ value: 90, label: "E" }]}
      />,
    );
    expect(screen.getByText("E")).toBeInTheDocument();
    const named = Array.from(container.querySelectorAll("[name]"));
    expect(named.map((el) => el.tagName)).toEqual(["INPUT"]);
    expect(container.querySelector("input[name='angle']")).toHaveValue("30");
  });

  it("hides the centre label with withLabel={false}", () => {
    render(<AngleSlider aria-label="a" defaultValue={45} withLabel={false} />);
    expect(screen.queryByText("45")).not.toBeInTheDocument();
  });
});
