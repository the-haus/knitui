import * as React from "react";

import { act } from "@testing-library/react";

import { baseValue, declarationsUnder, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { RangeSlider, Slider } from "./Slider";

// jsdom has no PointerEvent; a MouseEvent carries the clientX/clientY useMove reads.
const pointer = (type: string, clientX: number, clientY = 0) =>
  new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY });

/** Give the thumb's hit-area (the move target) a 200×20 box at x=0, y=0. */
const stubTrackRect = (thumb: HTMLElement, height = 20, width = 200) => {
  const container = thumb.parentElement!;
  container.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0 }) as DOMRect;
  return container;
};

/** The filled bar (the track's only child). */
const barOf = (thumb: HTMLElement) =>
  thumb.parentElement!.firstElementChild!.firstElementChild as HTMLElement;

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

  describe("keyboard", () => {
    it.each([
      ["ArrowRight", 55],
      ["ArrowUp", 55],
      ["ArrowLeft", 45],
      ["ArrowDown", 45],
      ["PageUp", 100],
      ["PageDown", 0],
      ["Home", 0],
      ["End", 100],
    ])("%s moves the value to %d and commits it", (key, expected) => {
      const onChangeEnd = jest.fn();
      render(<Slider defaultValue={50} step={5} onChangeEnd={onChangeEnd} />);
      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key });
      expect(thumb).toHaveAttribute("aria-valuenow", String(expected));
      expect(onChangeEnd).toHaveBeenLastCalledWith(expected);
    });

    it("clamps at the bounds", () => {
      render(<Slider defaultValue={99} />);
      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "PageUp" });
      expect(thumb).toHaveAttribute("aria-valuenow", "100");
    });

    it("ignores unrelated keys", () => {
      const onChange = jest.fn();
      render(<Slider defaultValue={10} onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole("slider"), { key: "a" });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("pointer drag (web)", () => {
    it("maps pointer position along the track to the value and fires onChangeEnd on release", () => {
      const onChange = jest.fn();
      const onChangeEnd = jest.fn();
      render(<Slider onChange={onChange} onChangeEnd={onChangeEnd} />);
      const thumb = screen.getByRole("slider");
      const container = stubTrackRect(thumb);
      act(() => {
        container.dispatchEvent(pointer("pointerdown", 50));
      });
      expect(thumb).toHaveAttribute("aria-valuenow", "25");
      act(() => {
        window.dispatchEvent(pointer("pointermove", 150));
      });
      expect(thumb).toHaveAttribute("aria-valuenow", "75");
      expect(thumb.style.left).toBe("75%");
      expect(barOf(thumb).style.width).toBe("75%");
      act(() => {
        window.dispatchEvent(pointer("pointerup", 180));
      });
      expect(onChangeEnd).toHaveBeenCalledWith(90);
      expect(onChange).toHaveBeenLastCalledWith(90);
    });

    it("inverts the y axis when vertical", () => {
      render(<Slider orientation="vertical" />);
      const thumb = screen.getByRole("slider");
      const container = stubTrackRect(thumb, 200, 20);
      act(() => {
        container.dispatchEvent(pointer("pointerdown", 10, 50));
        window.dispatchEvent(pointer("pointerup", 10, 50));
      });
      expect(thumb).toHaveAttribute("aria-valuenow", "75");
      expect(thumb).toHaveAttribute("aria-orientation", "vertical");
      expect(thumb.style.bottom).toBe("75%");
      expect(barOf(thumb).style.height).toBe("75%");
    });

    it("snaps a drag to the nearest mark with restrictToMarks", () => {
      render(<Slider restrictToMarks marks={[{ value: 0 }, { value: 40 }, { value: 100 }]} />);
      const thumb = screen.getByRole("slider");
      const container = stubTrackRect(thumb);
      act(() => {
        container.dispatchEvent(pointer("pointerdown", 60));
        window.dispatchEvent(pointer("pointerup", 60));
      });
      expect(thumb).toHaveAttribute("aria-valuenow", "40");
    });

    it("ignores drags while disabled", () => {
      const onChange = jest.fn();
      render(<Slider disabled defaultValue={10} onChange={onChange} />);
      const thumb = screen.getByRole("slider");
      const container = stubTrackRect(thumb);
      act(() => {
        container.dispatchEvent(pointer("pointerdown", 150));
        window.dispatchEvent(pointer("pointerup", 150));
      });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("geometry", () => {
    it("positions the thumb and bar through inline style (no per-value CSS rules)", () => {
      render(<Slider defaultValue={37} />);
      const thumb = screen.getByRole("slider");
      expect(thumb.style.left).toBe("37%");
      expect(barOf(thumb).style.width).toBe("37%");
      expect(baseValue(thumb, "left")).toBeUndefined();
    });

    it("fills from the far end when inverted", () => {
      render(<Slider defaultValue={30} inverted />);
      const bar = barOf(screen.getByRole("slider"));
      expect(bar.style.right).toBe("0px");
      expect(bar.style.width).toBe("70%");
    });

    it("grows the bar out from startPointValue", () => {
      render(<Slider defaultValue={20} startPointValue={50} />);
      const bar = barOf(screen.getByRole("slider"));
      expect(bar.style.left).toBe("20%");
      expect(bar.style.width).toBe("30%");
    });

    it("sizes the thumb and track from the size ladder or a number", () => {
      render(
        <>
          <Slider size="lg" thumbLabel="lg" />
          <Slider size={10} thumbLabel="n" />
          <Slider thumbSize="28px" thumbLabel="t" />
        </>,
      );
      const lg = screen.getByRole("slider", { name: "lg" });
      expect(baseValue(lg, "width")).toBe("24px");
      expect(baseValue(lg.parentElement!.firstElementChild!, "height")).toBe("8px");
      const n = screen.getByRole("slider", { name: "n" });
      expect(baseValue(n, "width")).toBe("22px");
      expect(baseValue(n.parentElement!.firstElementChild!, "height")).toBe("10px");
      expect(baseValue(screen.getByRole("slider", { name: "t" }), "height")).toBe("28px");
    });

    it("merges a thumb-slot style over the inline geometry", () => {
      render(<Slider defaultValue={40} styles={{ thumb: { style: { opacity: 0.5 } } }} />);
      const thumb = screen.getByRole("slider");
      expect(thumb.style.left).toBe("40%");
      expect(thumb.style.opacity).toBe("0.5");
    });
  });

  describe("marks", () => {
    it("renders labels and marks the filled ones", () => {
      render(
        <Slider
          defaultValue={50}
          marks={[
            { value: 20, label: "20%" },
            { value: 80, label: "80%" },
          ]}
        />,
      );
      expect(screen.getByText("20%")).toBeInTheDocument();
      expect(screen.getByText("80%")).toBeInTheDocument();
      const dots = Array.from(screen.getByRole("slider").parentElement!.children)
        .filter((el) => el.tagName === "DIV" && el.getAttribute("role") !== "slider")
        .slice(1);
      expect(baseValue(dots[0]!, "border-color")).toBe("var(--color9)");
      expect(baseValue(dots[1]!, "border-color")).toBe("var(--color3)");
    });
  });

  describe("v3 style resolution (web CSS)", () => {
    it("paints the (mirrored) track, bar and thumb ramp steps", () => {
      render(<Slider defaultValue={50} />);
      const thumb = screen.getByRole("slider");
      const track = thumb.parentElement!.firstElementChild!;
      expect(baseValue(track, "background-color")).toBe("var(--color10)");
      expect(baseValue(track, "border-radius")).toBe("var(--t-radius-xl)");
      expect(baseValue(barOf(thumb), "background-color")).toBe("var(--color4)");
      expect(baseValue(thumb, "background-color")).toBe("var(--color12)");
      expect(baseValue(thumb, "border-color")).toBe("var(--color4)");
      expect(declarationsUnder(thumb, ":hover")).toContain("border-color: var(--color3)");
    });

    it("carries the focus ring on the focusable thumb", () => {
      render(<Slider />);
      const thumb = screen.getByRole("slider");
      expect(thumb).toHaveAttribute("tabindex", "0");
      expect(hasFocusRing(thumb)).toBe(true);
    });

    it("dims, blocks pointer events and drops the thumb from the tab order when disabled", () => {
      render(<Slider disabled testID="root" />);
      const thumb = screen.getByRole("slider");
      expect(thumb).toHaveAttribute("tabindex", "-1");
      expect(thumb).toHaveAttribute("aria-disabled", "true");
      const root = screen.getByTestId("root");
      expect(baseValue(root, "opacity")).toBe("0.6");
      expect(baseValue(root, "pointer-events")).toBe("none");
    });

    it("radius accepts a key or a number on track and bar", () => {
      render(<Slider radius={2} defaultValue={10} />);
      const thumb = screen.getByRole("slider");
      expect(baseValue(thumb.parentElement!.firstElementChild!, "border-radius")).toBe("2px");
      expect(baseValue(barOf(thumb), "border-radius")).toBe("2px");
    });

    it("does not leak a `name` attribute onto any host but the hidden input", () => {
      const { container } = render(<Slider name="vol" />);
      const named = Array.from(container.querySelectorAll("[name]"));
      expect(named.map((el) => el.tagName)).toEqual(["INPUT"]);
    });
  });

  it("forwards its ref to the root element", () => {
    const ref = React.createRef<HTMLElement>();
    render(<Slider ref={ref as never} testID="root" />);
    expect(ref.current).toBe(screen.getByTestId("root"));
  });
});

describe("RangeSlider", () => {
  it("renders two sliders with their own aria values", () => {
    render(<RangeSlider defaultValue={[20, 60]} />);
    const [a, b] = screen.getAllByRole("slider");
    expect(a).toHaveAttribute("aria-valuenow", "20");
    expect(b).toHaveAttribute("aria-valuenow", "60");
    expect(a).toHaveAttribute("aria-valuemax", "100");
    expect(a!.style.left).toBe("20%");
    expect(b!.style.left).toBe("60%");
    const bar = barOf(a!);
    expect(bar.style.left).toBe("20%");
    expect(bar.style.width).toBe("40%");
  });

  it("steps each thumb with the keyboard and commits", () => {
    const onChangeEnd = jest.fn();
    render(<RangeSlider defaultValue={[20, 60]} onChangeEnd={onChangeEnd} />);
    const [a, b] = screen.getAllByRole("slider");
    fireEvent.keyDown(a!, { key: "ArrowRight" });
    expect(onChangeEnd).toHaveBeenLastCalledWith([21, 60]);
    fireEvent.keyDown(b!, { key: "PageDown" });
    expect(onChangeEnd).toHaveBeenLastCalledWith([21, 50]);
    fireEvent.keyDown(b!, { key: "End" });
    expect(onChangeEnd).toHaveBeenLastCalledWith([21, 100]);
    fireEvent.keyDown(a!, { key: "Home" });
    expect(onChangeEnd).toHaveBeenLastCalledWith([0, 100]);
  });

  it("pushes the other thumb to keep minRange", () => {
    render(<RangeSlider defaultValue={[40, 50]} minRange={10} />);
    const [a, b] = screen.getAllByRole("slider");
    fireEvent.keyDown(a!, { key: "ArrowRight" });
    expect(a).toHaveAttribute("aria-valuenow", "41");
    expect(b).toHaveAttribute("aria-valuenow", "51");
  });

  it("blocks instead of pushing when pushOnOverlap is false", () => {
    render(<RangeSlider defaultValue={[40, 50]} minRange={10} pushOnOverlap={false} />);
    const [a, b] = screen.getAllByRole("slider");
    fireEvent.keyDown(a!, { key: "ArrowRight" });
    expect(a).toHaveAttribute("aria-valuenow", "40");
    expect(b).toHaveAttribute("aria-valuenow", "50");
  });

  it("drags the nearer thumb", () => {
    render(<RangeSlider defaultValue={[20, 80]} />);
    const [a, b] = screen.getAllByRole("slider");
    const container = stubTrackRect(a!);
    act(() => {
      container.dispatchEvent(pointer("pointerdown", 180));
      window.dispatchEvent(pointer("pointerup", 180));
    });
    expect(a).toHaveAttribute("aria-valuenow", "20");
    expect(b).toHaveAttribute("aria-valuenow", "90");
  });

  it("disables both thumbs", () => {
    const onChange = jest.fn();
    render(<RangeSlider disabled onChange={onChange} />);
    for (const thumb of screen.getAllByRole("slider")) {
      expect(thumb).toHaveAttribute("tabindex", "-1");
      expect(thumb).toHaveAttribute("aria-disabled", "true");
      fireEvent.keyDown(thumb, { key: "ArrowRight" });
    }
    expect(onChange).not.toHaveBeenCalled();
  });
});
