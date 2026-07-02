import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { TextInput } from "./TextInput";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("TextInput", () => {
  it("renders a textbox", () => {
    render(<TextInput />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders its label", () => {
    render(<TextInput label="Username" />);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("renders its description", () => {
    render(<TextInput description="Helper text" />);
    expect(screen.getByText("Helper text")).toBeInTheDocument();
  });

  it("renders an error message", () => {
    render(<TextInput error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("forwards the styles map through InputBase to Input.Wrapper slots", () => {
    render(
      <TextInput
        label="Username"
        description="Helper text"
        error="Required field"
        styles={{
          label: { testID: "ti-label" },
          description: { testID: "ti-description" },
          error: { testID: "ti-error" },
        }}
      />,
    );
    // The label/description/error sugar reaches the matching Input.Wrapper part.
    expect(screen.getByTestId("ti-label")).toHaveTextContent("Username");
    expect(screen.getByTestId("ti-description")).toHaveTextContent("Helper text");
    expect(screen.getByTestId("ti-error")).toHaveTextContent("Required field");
  });

  it("lets an explicit labelProps win over the styles label slot (explicit beats sugar)", () => {
    render(
      <TextInput
        label="Username"
        styles={{ label: { testID: "ti-sugar-label" } }}
        labelProps={{ testID: "ti-explicit-label" }}
      />,
    );
    expect(screen.getByTestId("ti-explicit-label")).toHaveTextContent("Username");
    expect(screen.queryByTestId("ti-sugar-label")).not.toBeInTheDocument();
  });

  it("renders the controlled value", () => {
    render(<TextInput value="hello" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("hello");
  });

  it("renders the uncontrolled default value", () => {
    render(<TextInput defaultValue="hello" />);
    expect(screen.getByRole("textbox")).toHaveValue("hello");
  });

  it.each(SIZES)("supports %s size", (size) => {
    render(<TextInput size={size} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("links description and error text to the textbox", () => {
    render(<TextInput id="email" description="Use your work email" error="Email is required" />);
    const input = screen.getByRole("textbox");
    const describedBy = input.getAttribute("aria-describedby");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(describedBy).toContain("email-description");
    expect(describedBy).toContain("email-error");
  });

  it("fires onChangeText as the user types", () => {
    const onChangeText = jest.fn();
    render(<TextInput onChangeText={onChangeText} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "world" } });
    expect(onChangeText).toHaveBeenCalledWith("world");
  });

  it("forwards a ref to the input element", () => {
    const ref = React.createRef<GetRef<typeof TextInput>>();
    render(<TextInput ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
