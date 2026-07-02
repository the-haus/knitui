import * as React from "react";

import { type GetRef } from "@knitui/core";

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
});
