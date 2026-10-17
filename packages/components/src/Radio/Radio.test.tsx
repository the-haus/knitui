import * as React from "react";

import { type GetRef } from "@knitui/core";

import { baseValue, declarationsUnder, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { Radio } from "./Radio";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Radio", () => {
  it("exposes the radio role", () => {
    render(<Radio />);
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });

  it("renders its label", () => {
    render(<Radio label="Pick me" />);
    expect(screen.getByText("Pick me")).toBeInTheDocument();
  });

  it("defaults to unchecked", () => {
    render(<Radio />);
    expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "false");
  });

  it("honours defaultChecked (uncontrolled)", () => {
    render(<Radio defaultChecked />);
    expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "true");
  });

  it("becomes checked and fires onChange(true) on press", () => {
    const onChange = jest.fn();
    render(<Radio onChange={onChange} />);
    const radio = screen.getByRole("radio");
    fireEvent.click(radio);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(radio).toHaveAttribute("aria-checked", "true");
  });

  it("supports controlled checked state", () => {
    const onChange = jest.fn();
    render(<Radio checked={false} onChange={onChange} />);
    const radio = screen.getByRole("radio");
    fireEvent.click(radio);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(radio).toHaveAttribute("aria-checked", "false");
  });

  it("activates from the keyboard", () => {
    const onChange = jest.fn();
    render(<Radio onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("radio"), { key: " " });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not fire onChange when disabled", () => {
    const onChange = jest.fn();
    render(<Radio disabled onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio")).toHaveAttribute("aria-disabled", "true");
  });

  it("links label, description, and error to the radio", () => {
    render(<Radio id="choice" label="Choice" description="Additional context" error="Required" />);
    const radio = screen.getByRole("radio");
    expect(radio).toHaveAttribute("aria-labelledby", "choice-label");
    expect(radio).toHaveAttribute("aria-describedby", "choice-description choice-error");
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Radio size={size} label={size} />);
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });

  it("forwards refs to the radio control", () => {
    const ref = React.createRef<GetRef<typeof Radio>>();
    render(<Radio ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("wires up Radio.Group selection by value", () => {
    const onChange = jest.fn();
    render(
      <Radio.Group onChange={onChange}>
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </Radio.Group>,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    fireEvent.click(radios[1]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("does not change a readOnly group", () => {
    const onChange = jest.fn();
    render(
      <Radio.Group readOnly defaultValue="a" onChange={onChange}>
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </Radio.Group>,
    );
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[1]);
    expect(onChange).not.toHaveBeenCalled();
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
  });

  it("forwards the styles map onto the InlineControl chrome slots", () => {
    render(
      <Radio
        label="Pick me"
        description="Helper"
        error="Required"
        styles={{
          label: { testID: "radio-label" },
          description: { testID: "radio-description" },
          error: { testID: "radio-error" },
        }}
      />,
    );
    expect(screen.getByTestId("radio-label")).toHaveTextContent("Pick me");
    expect(screen.getByTestId("radio-description")).toHaveTextContent("Helper");
    expect(screen.getByTestId("radio-error")).toHaveTextContent("Required");
  });

  it("applies the circle and dot slots to the rendered parts", () => {
    render(
      <Radio
        defaultChecked
        styles={{ circle: { testID: "radio-circle" }, dot: { testID: "radio-dot" } }}
      />,
    );
    expect(screen.getByTestId("radio-circle")).toHaveAttribute("role", "radio");
    expect(screen.getByTestId("radio-dot")).toBeInTheDocument();
  });

  it("applies own slots AND still forwards chrome slots together", () => {
    render(
      <Radio
        defaultChecked
        label="Pick me"
        styles={{ circle: { testID: "radio-c2" }, label: { testID: "radio-l2" } }}
      />,
    );
    expect(screen.getByTestId("radio-c2")).toHaveAttribute("role", "radio");
    expect(screen.getByTestId("radio-l2")).toHaveTextContent("Pick me");
  });

  describe("v3 style resolution (web CSS)", () => {
    it.each([
      ["filled", "var(--color9)", "var(--color1)"],
      ["outline", "transparent", "var(--color9)"],
    ] as const)("checked variant=%s paints fill %s and dot %s", (variant, bg, dot) => {
      render(<Radio aria-label="r" variant={variant} defaultChecked />);
      const circle = screen.getByRole("radio");
      expect(baseValue(circle, "background-color")).toBe(bg);
      expect(baseValue(circle, "border-color")).toBe("var(--color9)");
      const glyph = circle.firstElementChild!;
      expect(baseValue(glyph, "background-color")).toBe(dot);
      expect(baseValue(glyph, "width")).toBe("var(--t-size-md)");
    });

    it("unchecked paints the resting tone and the error tone; no dot", () => {
      render(
        <>
          <Radio aria-label="off" />
          <Radio aria-label="err" error="Pick one" />
        </>,
      );
      const off = screen.getByRole("radio", { name: "off" });
      expect(baseValue(off, "background-color")).toBe("var(--background)");
      expect(baseValue(off, "border-color")).toBe("var(--borderColor)");
      expect(off.childElementCount).toBe(0);
      expect(baseValue(screen.getByRole("radio", { name: "err" }), "border-color")).toBe(
        "var(--red8)",
      );
    });

    it("eases the circle colours and checks on press", () => {
      render(<Radio aria-label="t" />);
      const circle = screen.getByRole("radio");
      expect(circle.getAttribute("style") ?? "").toMatch(/background-color 150ms/);
      fireEvent.click(circle);
      expect(circle).toHaveAttribute("aria-checked", "true");
      expect(baseValue(circle, "background-color")).toBe("var(--color9)");
    });

    it("rings the focusable circle and the card, not the Indicator", () => {
      render(
        <>
          <Radio aria-label="focus" />
          <Radio.Indicator testID="ind" />
          <Radio.Card aria-label="card">Body</Radio.Card>
        </>,
      );
      const circle = screen.getByRole("radio", { name: "focus" });
      expect(circle).toHaveAttribute("tabindex", "0");
      expect(hasFocusRing(circle)).toBe(true);
      expect(hasFocusRing(screen.getByTestId("ind"))).toBe(false);
      expect(hasFocusRing(screen.getByRole("radio", { name: "card" }))).toBe(true);
    });

    it.each(SIZES)("size=%s maps the circle to the size token", (size) => {
      render(<Radio aria-label="s" size={size} />);
      expect(baseValue(screen.getByRole("radio"), "height")).toBe(`var(--t-size-${size})`);
    });

    it("dims a disabled radio", () => {
      render(<Radio aria-label="d" disabled />);
      const circle = screen.getByRole("radio");
      expect(circle).toHaveAttribute("aria-disabled", "true");
      expect(baseValue(circle, "opacity")).toBe("0.6");
    });

    it("exposes a radiogroup and keeps one radio checked", () => {
      render(
        <Radio.Group defaultValue="a">
          <Radio value="a" aria-label="a" />
          <Radio value="b" aria-label="b" />
        </Radio.Group>,
      );
      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("radio", { name: "b" }));
      expect(screen.getByRole("radio", { name: "a" })).toHaveAttribute("aria-checked", "false");
      expect(screen.getByRole("radio", { name: "b" })).toHaveAttribute("aria-checked", "true");
    });

    it("Radio.Card hover/press clauses and checked border", () => {
      render(
        <Radio.Card aria-label="card" defaultChecked>
          Body
        </Radio.Card>,
      );
      const card = screen.getByRole("radio", { name: "card" });
      expect(card).toHaveAttribute("aria-checked", "true");
      expect(baseValue(card, "border-color")).toBe("var(--color9)");
      expect(declarationsUnder(card, ":hover")).toContain("background-color: var(--color2)");
      expect(declarationsUnder(card, ":active")).toContain("background-color: var(--color3)");
    });

    it("does not leak a `name` attribute onto the host", () => {
      render(<Radio aria-label="n" />);
      expect(screen.getByRole("radio")).not.toHaveAttribute("name");
    });
  });
});
