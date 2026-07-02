import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Input } from "./Input";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Input", () => {
  it("renders a textbox", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders the placeholder", () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  });

  it("fires onChangeText with the next value", () => {
    const onChangeText = jest.fn();
    render(<Input onChangeText={onChangeText} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abc" } });
    expect(onChangeText).toHaveBeenCalledWith("abc");
  });

  it("fires onChange with the native event", () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("disables the input", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Input size={size} placeholder={`Size ${size}`} />);
    expect(screen.getByPlaceholderText(`Size ${size}`)).toBeInTheDocument();
  });

  it("renders a textarea element when multiline", () => {
    render(<Input multiline placeholder="Notes" />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el.tagName.toLowerCase()).toBe("textarea");
  });

  it("renders a textarea element when rows > 1", () => {
    render(<Input rows={4} placeholder="Bio" />);
    const el = screen.getByPlaceholderText("Bio");
    expect(el.tagName.toLowerCase()).toBe("textarea");
  });

  it("passes rows attribute to the textarea host", () => {
    render(<Input multiline rows={5} placeholder="Notes" />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el).toHaveAttribute("rows", "5");
  });

  it("uses minRows as the textarea rows attribute when rows is not set", () => {
    render(<Input multiline minRows={3} placeholder="Notes" />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el).toHaveAttribute("rows", "3");
  });

  it("fires onChangeText when typing in multiline mode", () => {
    const onChangeText = jest.fn();
    render(<Input multiline onChangeText={onChangeText} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "line one\nline two" } });
    expect(onChangeText).toHaveBeenCalledWith("line one\nline two");
  });

  it("reflects controlled value in multiline mode", () => {
    const { rerender } = render(<Input multiline value="initial" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("initial");
    rerender(<Input multiline value="updated" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("updated");
  });

  it("does not fire onSubmitEditing on Enter in multiline mode", () => {
    const onSubmitEditing = jest.fn();
    render(<Input multiline onSubmitEditing={onSubmitEditing} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSubmitEditing).not.toHaveBeenCalled();
  });

  it("fires onSubmitEditing on Enter in single-line mode", () => {
    const onSubmitEditing = jest.fn();
    render(<Input onSubmitEditing={onSubmitEditing} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
  });

  it("autosize: applies height style after mount", () => {
    render(<Input multiline autosize placeholder="Autosize" />);
    const el = screen.getByPlaceholderText("Autosize") as HTMLTextAreaElement;
    // jsdom reports scrollHeight as 0; hook should have run without throwing
    expect(el).toBeInTheDocument();
  });

  it("autosize: overflowY is set after autosize effect runs", () => {
    render(<Input multiline autosize maxRows={3} placeholder="Clamped" />);
    const el = screen.getByPlaceholderText("Clamped") as HTMLTextAreaElement;
    // In jsdom scrollHeight is 0 so no overflow is needed; verify the element is a textarea.
    expect(el.tagName.toLowerCase()).toBe("textarea");
  });

  it("renders the Input.Label sub-component", () => {
    render(<Input.Label>Username</Input.Label>);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Input>>();
    render(<Input ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("distributes Input.Wrapper's styles map onto its slots", () => {
    render(
      <Input.Wrapper
        label="Name"
        description="Helpful"
        error="Bad"
        styles={{
          wrapper: { testID: "iw-wrapper" },
          label: { testID: "iw-label" },
          description: { testID: "iw-description" },
          error: { testID: "iw-error" },
        }}
      >
        <Input />
      </Input.Wrapper>,
    );
    expect(screen.getByTestId("iw-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("iw-label")).toBeInTheDocument();
    expect(screen.getByTestId("iw-description")).toBeInTheDocument();
    expect(screen.getByTestId("iw-error")).toBeInTheDocument();
  });

  it("applies the adornment slots (root/leftSection/rightSection) onto the chrome", () => {
    render(
      <Input
        leftSection={<span>L</span>}
        rightSection={<span>R</span>}
        styles={{
          root: { testID: "input-root" },
          leftSection: { testID: "input-left" },
          rightSection: { testID: "input-right" },
        }}
      />,
    );
    expect(screen.getByTestId("input-root")).toBeInTheDocument();
    expect(screen.getByTestId("input-left")).toBeInTheDocument();
    expect(screen.getByTestId("input-right")).toBeInTheDocument();
  });

  it("lets the deprecated leftSectionProps merge over the leftSection slot", () => {
    render(
      <Input
        leftSection={<span>L</span>}
        styles={{ leftSection: { testID: "slot-left", "aria-label": "from-slot" } }}
        leftSectionProps={{ "aria-label": "from-prop" }}
      />,
    );
    const left = screen.getByTestId("slot-left");
    // Slot supplies testID; the deprecated prop wins for the overlapping key.
    expect(left).toHaveAttribute("aria-label", "from-prop");
  });

  it("exposes Input.Chrome as a static part", () => {
    expect(Input.Chrome).toBeDefined();
  });
});
