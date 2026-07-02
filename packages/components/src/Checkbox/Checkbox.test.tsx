import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("exposes the checkbox role by default", () => {
    render(<Checkbox />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("defaults to unchecked", () => {
    render(<Checkbox />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  it("honours defaultChecked (uncontrolled)", () => {
    render(<Checkbox defaultChecked />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });

  it("forwards the styles map onto the InlineControl chrome slots", () => {
    render(
      <Checkbox
        label="Accept"
        description="Helper text"
        error="Required"
        styles={{
          label: { testID: "cb-label" },
          description: { testID: "cb-description" },
          error: { testID: "cb-error" },
        }}
      />,
    );
    expect(screen.getByTestId("cb-label")).toHaveTextContent("Accept");
    expect(screen.getByTestId("cb-description")).toHaveTextContent("Helper text");
    expect(screen.getByTestId("cb-error")).toHaveTextContent("Required");
  });

  it("applies the box and icon slots to the rendered parts", () => {
    render(
      <Checkbox
        defaultChecked
        styles={{ box: { testID: "cb-box" }, icon: { testID: "cb-icon" } }}
      />,
    );
    // box slot lands on the square; it carries the checkbox role.
    expect(screen.getByTestId("cb-box")).toHaveAttribute("role", "checkbox");
    // icon slot reaches the glyph (only rendered when checked).
    expect(screen.getByTestId("cb-icon")).toBeInTheDocument();
  });

  it("applies own slots AND still forwards chrome slots together", () => {
    render(
      <Checkbox
        defaultChecked
        label="Accept"
        styles={{ box: { testID: "cb-box2" }, label: { testID: "cb-label2" } }}
      />,
    );
    expect(screen.getByTestId("cb-box2")).toHaveAttribute("role", "checkbox");
    expect(screen.getByTestId("cb-label2")).toHaveTextContent("Accept");
  });

  it("toggles and fires onChange with the next boolean (uncontrolled)", () => {
    const onChange = jest.fn();
    render(<Checkbox onChange={onChange} />);
    const box = screen.getByRole("checkbox");
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(box).toHaveAttribute("aria-checked", "true");
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("toggles from the keyboard", () => {
    const onChange = jest.fn();
    render(<Checkbox onChange={onChange} />);
    const box = screen.getByRole("checkbox");
    fireEvent.keyDown(box, { key: " " });
    expect(onChange).toHaveBeenCalledWith(true);
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("respects the controlled checked prop", () => {
    const onChange = jest.fn();
    const { rerender } = render(<Checkbox checked={false} onChange={onChange} />);
    const box = screen.getByRole("checkbox");
    expect(box).toHaveAttribute("aria-checked", "false");
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(box).toHaveAttribute("aria-checked", "false");
    rerender(<Checkbox checked onChange={onChange} />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });

  it("reports the mixed state when indeterminate", () => {
    render(<Checkbox indeterminate />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "mixed");
  });

  it("does not toggle when disabled", () => {
    const onChange = jest.fn();
    render(<Checkbox disabled onChange={onChange} />);
    const box = screen.getByRole("checkbox");
    fireEvent.click(box);
    expect(onChange).not.toHaveBeenCalled();
    expect(box).toHaveAttribute("aria-disabled", "true");
  });

  it("does not toggle when readOnly", () => {
    const onChange = jest.fn();
    render(<Checkbox readOnly onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders its label", () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText("Accept terms")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeInTheDocument();
  });

  it("links description and error text to the checkbox", () => {
    render(<Checkbox label="Accept terms" description="Required for signup." error="Required." />);
    const box = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(box).toHaveAccessibleDescription("Required for signup. Required.");
  });

  it("supports the full seven-step size scale", () => {
    render(
      <>
        <Checkbox size="xxs" aria-label="smallest" />
        <Checkbox size="xxl" aria-label="largest" />
      </>,
    );
    expect(screen.getByRole("checkbox", { name: "smallest" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "largest" })).toBeInTheDocument();
  });

  it("forwards refs to the control element", () => {
    const ref = React.createRef<GetRef<typeof Checkbox>>();
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeTruthy();
  });

  describe("Checkbox.Group", () => {
    it("reflects the controlled value and fires onChange into an array", () => {
      const onChange = jest.fn();
      render(
        <Checkbox.Group value={["a"]} onChange={onChange}>
          <Checkbox value="a" label="A" />
          <Checkbox value="b" label="B" />
        </Checkbox.Group>,
      );
      const boxes = screen.getAllByRole("checkbox");
      expect(boxes).toHaveLength(2);
      expect(boxes[0]).toHaveAttribute("aria-checked", "true");
      expect(boxes[1]).toHaveAttribute("aria-checked", "false");
      fireEvent.click(boxes[1]);
      expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    });

    it("removes a value when an already-selected box is toggled off", () => {
      const onChange = jest.fn();
      render(
        <Checkbox.Group defaultValue={["a", "b"]} onChange={onChange}>
          <Checkbox value="a" label="A" />
          <Checkbox value="b" label="B" />
        </Checkbox.Group>,
      );
      fireEvent.click(screen.getAllByRole("checkbox")[0]);
      expect(onChange).toHaveBeenCalledWith(["b"]);
    });
  });

  describe("Checkbox.Card", () => {
    it("renders as a checkbox and toggles on press", () => {
      const onChange = jest.fn();
      render(
        <Checkbox.Card onChange={onChange}>
          <Checkbox.Indicator />
        </Checkbox.Card>,
      );
      const card = screen.getByRole("checkbox");
      fireEvent.click(card);
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });
});
