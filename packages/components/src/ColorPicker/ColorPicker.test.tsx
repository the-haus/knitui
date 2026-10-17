import * as React from "react";

import type { GetRef } from "@knitui/core";

import { act, fireEvent, render, screen } from "../test-utils";
import { ColorPicker } from "./ColorPicker";

describe("ColorPicker", () => {
  it("renders the saturation + hue sliders by default", () => {
    render(<ColorPicker defaultValue="#ff0000" />);
    // saturation area + hue slider both use role="slider"
    expect(screen.getAllByRole("slider").length).toBeGreaterThanOrEqual(2);
  });

  it("renders only swatches when withPicker is false", () => {
    render(
      <ColorPicker withPicker={false} swatches={["#ff0000", "#00ff00"]} defaultValue="#ff0000" />,
    );
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "#00ff00" })).toBeInTheDocument();
  });

  it("renders one swatch button per provided color", () => {
    render(<ColorPicker withPicker={false} swatches={["#ff0000", "#00ff00", "#0000ff"]} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("fires onChange and onColorSwatchClick when a swatch is clicked", () => {
    const onChange = jest.fn();
    const onColorSwatchClick = jest.fn();
    render(
      <ColorPicker
        withPicker={false}
        swatches={["#ff0000", "#00ff00"]}
        onChange={onChange}
        onColorSwatchClick={onColorSwatchClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "#00ff00" }));
    expect(onColorSwatchClick).toHaveBeenCalledWith("#00ff00");
    expect(onChange).toHaveBeenCalled();
  });

  it("renders the alpha slider for alpha formats", () => {
    render(<ColorPicker defaultValue="#ff0000" format="rgba" />);
    // saturation + hue + alpha => 3 sliders
    expect(screen.getAllByRole("slider")).toHaveLength(3);
  });

  it("exposes accessible labels on the sliders", () => {
    render(<ColorPicker defaultValue="#ff0000" saturationLabel="Saturation" hueLabel="Hue" />);
    expect(screen.getByRole("slider", { name: "Saturation" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Hue" })).toBeInTheDocument();
  });

  it("supports the full size scale", () => {
    const { rerender } = render(<ColorPicker defaultValue="#ff0000" size="xxs" />);
    expect(screen.getAllByRole("slider").length).toBeGreaterThanOrEqual(2);

    rerender(<ColorPicker defaultValue="#ff0000" size="xxl" />);
    expect(screen.getAllByRole("slider").length).toBeGreaterThanOrEqual(2);
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof ColorPicker>>();
    render(<ColorPicker ref={ref} defaultValue="#ff0000" />);
    expect(ref.current).not.toBeNull();
  });

  it("exposes its composable parts", () => {
    expect(ColorPicker.Root).toBeDefined();
    expect(ColorPicker.Saturation).toBeDefined();
    expect(ColorPicker.HueSlider).toBeDefined();
    expect(ColorPicker.AlphaSlider).toBeDefined();
    expect(ColorPicker.Preview).toBeDefined();
    expect(ColorPicker.Swatches).toBeDefined();
    expect(ColorPicker.Swatch).toBeDefined();
  });

  it("renders hand-composed parts under ColorPicker.Root", () => {
    render(
      <ColorPicker.Root defaultValue="#ff0000" saturationLabel="Sat" hueLabel="Hue">
        <ColorPicker.Saturation />
        <ColorPicker.HueSlider />
      </ColorPicker.Root>,
    );
    expect(screen.getByRole("slider", { name: "Sat" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Hue" })).toBeInTheDocument();
  });

  it("composes a swatch grid from ColorPicker.Swatch parts", () => {
    const onColorSwatchClick = jest.fn();
    render(
      <ColorPicker.Root defaultValue="#ff0000" onColorSwatchClick={onColorSwatchClick}>
        <ColorPicker.Swatches>
          <ColorPicker.Swatch color="#00ff00" />
        </ColorPicker.Swatches>
      </ColorPicker.Root>,
    );
    const swatch = screen.getByRole("button", { name: "#00ff00" });
    fireEvent.click(swatch);
    expect(onColorSwatchClick).toHaveBeenCalledWith("#00ff00");
  });

  it("reaches a part through a styles slot", () => {
    render(
      <ColorPicker
        defaultValue="#ff0000"
        saturationLabel="Sat"
        styles={{ saturation: { testID: "sat-slot" } }}
      />,
    );
    expect(screen.getByTestId("sat-slot")).toBeInTheDocument();
    // the styles slot lands on the same element exposing the saturation slider role
    expect(screen.getByTestId("sat-slot")).toHaveAttribute("role", "slider");
  });

  describe("drag", () => {
    const stubRect = (el: Element) => {
      el.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: 200,
          height: 100,
          right: 200,
          bottom: 100,
          x: 0,
          y: 0,
        }) as DOMRect;
    };
    const pointer = (type: string, clientX: number, clientY: number) =>
      new MouseEvent(type, { bubbles: true, clientX, clientY });

    it("drags the saturation area: onChange per move, onChangeEnd once on release", () => {
      const onChange = jest.fn();
      const onChangeEnd = jest.fn();
      render(
        <ColorPicker
          defaultValue="#ff0000"
          onChange={onChange}
          onChangeEnd={onChangeEnd}
          saturationLabel="Saturation"
        />,
      );
      const area = screen.getByRole("slider", { name: "Saturation" });
      stubRect(area);
      act(() => {
        area.dispatchEvent(pointer("pointerdown", 100, 50));
      });
      act(() => {
        window.dispatchEvent(pointer("pointermove", 200, 0));
      });
      expect(onChange).toHaveBeenLastCalledWith("#ff0000");
      act(() => {
        window.dispatchEvent(pointer("pointermove", 0, 100));
      });
      expect(onChange).toHaveBeenLastCalledWith("#000000");
      expect(onChangeEnd).not.toHaveBeenCalled();
      act(() => {
        window.dispatchEvent(pointer("pointerup", 0, 100));
      });
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect(onChangeEnd).toHaveBeenCalledWith("#000000");
      expect(area).toHaveAttribute("aria-valuenow", "0");
    });

    it("drags the hue slider and positions its thumb with inline style", () => {
      const onChange = jest.fn();
      render(<ColorPicker defaultValue="#ff0000" onChange={onChange} hueLabel="Hue" />);
      const hue = screen.getByRole("slider", { name: "Hue" });
      stubRect(hue);
      act(() => {
        hue.dispatchEvent(pointer("pointerdown", 100, 10));
      });
      act(() => {
        window.dispatchEvent(pointer("pointerup", 100, 10));
      });
      expect(hue).toHaveAttribute("aria-valuenow", "180");
      expect(onChange).toHaveBeenLastCalledWith("#00ffff");
      const thumb = hue.lastElementChild as HTMLElement;
      expect(thumb.style.left).toBe("50%");
    });

    it("nudges with the arrow keys", () => {
      const onChangeEnd = jest.fn();
      render(<ColorPicker defaultValue="#ff0000" onChangeEnd={onChangeEnd} hueLabel="Hue" />);
      const hue = screen.getByRole("slider", { name: "Hue" });
      fireEvent.keyDown(hue, { key: "ArrowRight" });
      expect(onChangeEnd).toHaveBeenCalledWith("#ff4d00");
    });

    it("never leaks a `name` attribute from the styled config", () => {
      const { container } = render(<ColorPicker name="color" />);
      const named = Array.from(container.querySelectorAll("[name]"));
      expect(named).toHaveLength(1);
      expect(named[0]).toHaveAttribute("type", "hidden");
      expect(named[0]).toHaveAttribute("name", "color");
    });
  });
});
