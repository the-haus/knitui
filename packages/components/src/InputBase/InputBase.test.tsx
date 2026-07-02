import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { InputBase } from "./InputBase";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("InputBase", () => {
  it("renders a textbox", () => {
    render(<InputBase />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders its label", () => {
    render(<InputBase label="Username" />);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("renders its description", () => {
    render(<InputBase description="Helper text" />);
    expect(screen.getByText("Helper text")).toBeInTheDocument();
  });

  it("renders an error message", () => {
    render(<InputBase error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it.each(SIZES)("supports %s size", (size) => {
    render(<InputBase size={size} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("fires onChangeText as the user types", () => {
    const onChangeText = jest.fn();
    render(<InputBase onChangeText={onChangeText} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
    expect(onChangeText).toHaveBeenCalledWith("hello");
  });

  it("forwards a ref to the input element", () => {
    const ref = React.createRef<GetRef<typeof InputBase>>();
    render(<InputBase ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
