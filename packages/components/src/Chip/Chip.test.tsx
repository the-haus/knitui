import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("renders its label", () => {
    render(<Chip>Awesome</Chip>);
    expect(screen.getByText("Awesome")).toBeInTheDocument();
  });

  it("exposes the checkbox role by default", () => {
    render(<Chip>Tag</Chip>);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("defaults to unchecked", () => {
    render(<Chip>Tag</Chip>);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  it("honours defaultChecked (uncontrolled)", () => {
    render(<Chip defaultChecked>Tag</Chip>);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });

  it("toggles and fires onChange with the next boolean (uncontrolled)", () => {
    const onChange = jest.fn();
    render(<Chip onChange={onChange}>Tag</Chip>);
    const chip = screen.getByRole("checkbox");
    fireEvent.click(chip);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(chip).toHaveAttribute("aria-checked", "true");
    fireEvent.click(chip);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("toggles from the keyboard", () => {
    const onChange = jest.fn();
    render(<Chip onChange={onChange}>Tag</Chip>);
    const chip = screen.getByRole("checkbox");
    fireEvent.keyDown(chip, { key: " " });
    expect(onChange).toHaveBeenCalledWith(true);
    expect(chip).toHaveAttribute("aria-checked", "true");
  });

  it("respects the controlled checked prop", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <Chip checked={false} onChange={onChange}>
        Tag
      </Chip>,
    );
    const chip = screen.getByRole("checkbox");
    expect(chip).toHaveAttribute("aria-checked", "false");
    fireEvent.click(chip);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(chip).toHaveAttribute("aria-checked", "false");
    rerender(
      <Chip checked onChange={onChange}>
        Tag
      </Chip>,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });

  it("shows the default check glyph when checked", () => {
    render(<Chip defaultChecked>Tag</Chip>);
    expect(document.querySelector(".tabler-icon-check")).toBeInTheDocument();
  });

  it("renders a custom icon when checked", () => {
    render(
      <Chip defaultChecked icon={<span>★</span>}>
        Tag
      </Chip>,
    );
    expect(screen.getByText("★")).toBeInTheDocument();
  });

  it("does not toggle when disabled", () => {
    const onChange = jest.fn();
    render(
      <Chip disabled onChange={onChange}>
        Tag
      </Chip>,
    );
    const chip = screen.getByRole("checkbox");
    fireEvent.click(chip);
    expect(onChange).not.toHaveBeenCalled();
    expect(chip).toHaveAttribute("aria-disabled", "true");
  });

  it("honours a custom aria-label", () => {
    render(<Chip aria-label="Toggle tag" icon={<span>•</span>} />);
    expect(screen.getByRole("checkbox", { name: "Toggle tag" })).toBeInTheDocument();
  });

  it.each(["outline", "filled", "light"] as const)("renders the %s variant", (variant) => {
    render(
      <Chip variant={variant} defaultChecked>
        {variant}
      </Chip>,
    );
    expect(screen.getByText(variant)).toBeInTheDocument();
  });

  it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)("renders size %s", (size) => {
    render(<Chip size={size}>{`s-${size}`}</Chip>);
    expect(screen.getByText(`s-${size}`)).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Chip>>();
    render(<Chip ref={ref}>Tag</Chip>);
    expect(ref.current).not.toBeNull();
  });

  describe("Chip.Group (single-select)", () => {
    it("derives the radio role for chips inside a single-select group", () => {
      render(
        <Chip.Group defaultValue="a">
          <Chip value="a">A</Chip>
          <Chip value="b">B</Chip>
        </Chip.Group>,
      );
      expect(screen.getAllByRole("radio")).toHaveLength(2);
    });

    it("reflects the controlled value and fires onChange on selection", () => {
      const onChange = jest.fn();
      render(
        <Chip.Group value="a" onChange={onChange}>
          <Chip value="a">A</Chip>
          <Chip value="b">B</Chip>
        </Chip.Group>,
      );
      expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute("aria-checked", "false");
      fireEvent.click(screen.getByRole("radio", { name: "B" }));
      expect(onChange).toHaveBeenCalledWith("b");
    });
  });

  describe("Chip.Group (multiple)", () => {
    it("uses the checkbox role and toggles into an array", () => {
      const onChange = jest.fn();
      render(
        <Chip.Group multiple defaultValue={["a"]} onChange={onChange}>
          <Chip value="a">A</Chip>
          <Chip value="b">B</Chip>
        </Chip.Group>,
      );
      expect(screen.getAllByRole("checkbox")).toHaveLength(2);
      expect(screen.getByRole("checkbox", { name: "A" })).toHaveAttribute("aria-checked", "true");
      fireEvent.click(screen.getByRole("checkbox", { name: "B" }));
      expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    });

    it("removes a value when an already-selected chip is toggled off", () => {
      const onChange = jest.fn();
      render(
        <Chip.Group multiple defaultValue={["a", "b"]} onChange={onChange}>
          <Chip value="a">A</Chip>
          <Chip value="b">B</Chip>
        </Chip.Group>,
      );
      fireEvent.click(screen.getByRole("checkbox", { name: "A" }));
      expect(onChange).toHaveBeenCalledWith(["b"]);
    });
  });

  describe("slots", () => {
    it("applies the root, label and icon slots to the rendered parts", () => {
      render(
        <Chip
          defaultChecked
          styles={{
            root: { testID: "chip-root" },
            label: { testID: "chip-label" },
            icon: { testID: "chip-icon" },
          }}
        >
          Awesome
        </Chip>,
      );
      expect(screen.getByTestId("chip-root")).toHaveAttribute("role", "checkbox");
      expect(screen.getByTestId("chip-label")).toHaveTextContent("Awesome");
      // The default check glyph is rendered when checked and carries the icon slot.
      expect(
        screen.getByTestId("chip-icon").querySelector(".tabler-icon-check"),
      ).toBeInTheDocument();
    });

    it("exposes the Icon static", () => {
      expect(Chip.Icon).toBeDefined();
    });
  });
});
