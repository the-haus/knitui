import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { Rating } from "./Rating";

describe("Rating", () => {
  it("exposes a radiogroup role", () => {
    render(<Rating />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  it("renders one interactive radio per symbol (default count 5)", () => {
    render(<Rating />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("renders count symbols when count is set", () => {
    render(<Rating count={3} />);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("fires onChange with the selected value on press", () => {
    const onChange = jest.fn();
    render(<Rating onChange={onChange} />);
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[2]);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("supports keyboard activation for interactive symbols", () => {
    const onChange = jest.fn();
    render(<Rating onChange={onChange} />);
    const radios = screen.getAllByRole("radio");
    fireEvent.keyDown(radios[2], { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("marks the matching symbol as checked for a controlled value", () => {
    render(<Rating value={2} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
  });

  it("does not render interactive symbols when readOnly", () => {
    render(<Rating value={3} readOnly />);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("does not fire onChange when disabled", () => {
    const onChange = jest.fn();
    render(<Rating onChange={onChange} disabled />);
    fireEvent.click(screen.getAllByRole("radio")[2]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders fractions sub-segments per symbol", () => {
    render(<Rating count={2} fractions={2} />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("renders all named sizes without throwing", () => {
    const sizes = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
    render(
      <>
        {sizes.map((size) => (
          <Rating key={size} size={size} aria-label={`Rating ${size}`} />
        ))}
      </>,
    );
    expect(screen.getAllByRole("radiogroup")).toHaveLength(sizes.length);
  });

  it("renders a hidden input when name is provided", () => {
    const { container } = render(<Rating value={2.5} name="score" />);
    const input = container.querySelector('input[name="score"]');
    expect(input).toHaveAttribute("type", "hidden");
    expect(input).toHaveValue("2.5");
  });

  it("forwards the root ref", () => {
    const ref = React.createRef<GetRef<typeof Rating>>();
    render(<Rating ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("spreads the slot map onto its parts", () => {
    render(
      <Rating
        count={3}
        fractions={1}
        styles={{
          root: { testID: "rating-root" },
          symbol: { testID: "rating-symbol" },
          segment: { testID: "rating-segment" },
        }}
      />,
    );
    expect(screen.getByTestId("rating-root")).toBeInTheDocument();
    // One symbol frame per symbol (count=3); one segment per symbol (fractions=1).
    expect(screen.getAllByTestId("rating-symbol").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByTestId("rating-segment")).toHaveLength(3);
  });
});

describe("Rating v3 behaviour + style resolution", () => {
  it("fills the selected symbols with color9 over color6 empties", () => {
    render(<Rating defaultValue={2} />);
    const stars = screen.getAllByText("★");
    // per symbol: empty glyph, then (when filled) the clipped full glyph
    expect(baseValue(stars[0]!, "color")).toBe("var(--color6)");
    expect(baseValue(stars[1]!, "color")).toBe("var(--color9)");
    expect(stars).toHaveLength(5 + 2);
  });

  it("sizes the glyph to the symbol square (one px scale)", () => {
    render(<Rating size={30} />);
    const glyph = screen.getAllByText("★")[0]!;
    expect(baseValue(glyph, "font-size")).toBe("30px");
    expect(baseValue(glyph, "line-height")).toBe("30px");
    expect(baseValue(glyph.parentElement!, "width")).toBe("30px");
  });

  it("clips a half-star fill to 50%", () => {
    render(<Rating value={1.5} fractions={2} readOnly />);
    const fill = screen.getAllByText("★")[3]!.parentElement!.parentElement!;
    expect(baseValue(fill, "width")).toBe("50%");
    expect(baseValue(fill, "overflow")).toBe("hidden");
  });

  it("radios are focusable and carry the kit focus ring", () => {
    render(<Rating defaultValue={3} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
    expect(radios[0]).toHaveAttribute("tabindex", "0");
    expect(hasFocusRing(radios[0]!)).toBe(true);
  });

  it("previews on hover and reports it through onHover", () => {
    const onHover = jest.fn();
    render(<Rating onHover={onHover} />);
    fireEvent.mouseEnter(screen.getAllByRole("radio")[3]!);
    fireEvent.pointerEnter(screen.getAllByRole("radio")[3]!);
    expect(onHover).toHaveBeenCalledWith(4);
  });

  it("dims and marks the group when disabled", () => {
    render(<Rating disabled />);
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-disabled", "true");
    expect(baseValue(group, "opacity")).toBe("0.6");
  });
});
