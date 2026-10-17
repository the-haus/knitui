import * as React from "react";

import { baseValue, declarationsUnder, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { SegmentedControl } from "./SegmentedControl";

const DATA = ["React", "Vue", "Svelte"];

describe("SegmentedControl", () => {
  it("renders an option for each data entry", () => {
    render(<SegmentedControl data={DATA} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Vue")).toBeInTheDocument();
    expect(screen.getByText("Svelte")).toBeInTheDocument();
  });

  it("exposes the radiogroup role with radio options", () => {
    render(<SegmentedControl data={DATA} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("checks the first option by default (uncontrolled)", () => {
    render(<SegmentedControl data={DATA} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
  });

  it("fires onChange with the selected value on press", () => {
    const onChange = jest.fn();
    render(<SegmentedControl data={DATA} onChange={onChange} />);
    fireEvent.click(screen.getByText("Vue"));
    expect(onChange).toHaveBeenCalledWith("Vue");
  });

  it("moves selection with arrow keys and skips disabled items", () => {
    render(
      <SegmentedControl
        data={[
          { value: "react", label: "React" },
          { value: "vue", label: "Vue", disabled: true },
          { value: "svelte", label: "Svelte" },
        ]}
      />,
    );

    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "Svelte" })).toHaveAttribute("aria-checked", "true");
  });

  it("selects a focused item with Enter", () => {
    render(<SegmentedControl data={DATA} />);
    fireEvent.keyDown(screen.getByRole("radio", { name: "Vue" }), { key: "Enter" });
    expect(screen.getByRole("radio", { name: "Vue" })).toHaveAttribute("aria-checked", "true");
  });

  it("respects the controlled value prop", () => {
    render(<SegmentedControl data={DATA} value="Svelte" onChange={jest.fn()} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
  });

  it("renders a hidden input for form submission when name is provided", () => {
    const { container } = render(
      <SegmentedControl data={DATA} defaultValue="Vue" name="framework" />,
    );
    expect(container.querySelector('input[name="framework"]')).toHaveValue("Vue");
  });

  it("does not fire onChange when readOnly", () => {
    const onChange = jest.fn();
    render(<SegmentedControl data={DATA} readOnly onChange={onChange} />);
    fireEvent.click(screen.getByText("Vue"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the group and items disabled when disabled", () => {
    render(<SegmentedControl data={DATA} disabled />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByRole("radio")[0]).toHaveAttribute("aria-disabled", "true");
  });

  it("marks a disabled item with aria-disabled", () => {
    render(
      <SegmentedControl
        data={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta", disabled: true },
        ]}
      />,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios[1]).toHaveAttribute("aria-disabled", "true");
  });

  it("exposes styled subparts", () => {
    expect(SegmentedControl.Root).toBeDefined();
    expect(SegmentedControl.Control).toBeDefined();
    expect(SegmentedControl.Label).toBeDefined();
  });
});

describe("SegmentedControl v3 style resolution (web CSS)", () => {
  it("paints a color3 track sized by the size variant", () => {
    render(<SegmentedControl testID="sc" data={["a", "b"]} size="lg" />);
    const root = screen.getByTestId("sc");
    expect(baseValue(root, "background-color")).toBe("var(--color3)");
    expect(baseValue(root, "padding")).toBe("var(--t-space-xxs)");
    expect(baseValue(root, "border-radius")).toBe("var(--t-radius-md)");
    expect(baseValue(screen.getAllByRole("radio")[0]!, "height")).toBe("var(--t-size-lg)");
  });

  it("floats a shadowed background indicator that slides on its layout box", () => {
    render(<SegmentedControl testID="sc" data={["a", "b"]} />);
    const indicator = screen.getByTestId("sc").querySelector("div:not([role])") as HTMLElement;
    expect(indicator).toBeTruthy();
    expect(baseValue(indicator, "background-color")).toBe("var(--background)");
    expect(baseValue(indicator, "box-shadow")).toBe("0px 1px 4px 0px var(--dropShadowColor)");
    expect(baseValue(indicator, "border-radius")).toBe("var(--t-radius-sm)");
    expect(indicator.style.transition).toBe(
      "left 200ms ease, top 200ms ease, width 200ms ease, height 200ms ease",
    );
  });

  it("inactive segments hover to color4; every segment dips on press and rings on focus", () => {
    render(<SegmentedControl data={["a", "b"]} />);
    const [active, inactive] = screen.getAllByRole("radio");
    expect(declarationsUnder(inactive!, ":hover")).toContain("background-color: var(--color4)");
    expect(declarationsUnder(active!, ":hover")).toEqual([]);
    expect(baseValue(inactive!, "background-color")).toBe("transparent");
    expect(declarationsUnder(active!, ":active")).toContain("--t-scale-x: 0.97");
    expect(hasFocusRing(active!)).toBe(true);
  });

  it("labels the active segment color12 and the rest color11", () => {
    render(<SegmentedControl data={["a", "b"]} />);
    expect(baseValue(screen.getByText("a"), "color")).toBe("var(--color12)");
    expect(baseValue(screen.getByText("b"), "color")).toBe("var(--color11)");
  });

  it("does not forward transitionDuration as a CSS property", () => {
    render(<SegmentedControl testID="sc" data={["a"]} transitionDuration={500} />);
    expect(screen.getByTestId("sc").style.transitionDuration).toBe("");
  });

  it("dims the whole control when disabled", () => {
    render(<SegmentedControl testID="sc" data={["a"]} disabled />);
    expect(baseValue(screen.getByTestId("sc"), "opacity")).toBe("0.6");
  });
});
