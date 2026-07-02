import * as React from "react";

import type { GetRef } from "@knitui/core";

import { act, fireEvent, render, screen } from "../test-utils";
import { MaskInput } from "./MaskInput";

/** The underlying host is a real `<input>`, exposed with the textbox role. */
function getInput(): HTMLInputElement {
  return screen.getByRole("textbox") as HTMLInputElement;
}

describe("MaskInput", () => {
  it("renders an input with the textbox role", () => {
    render(<MaskInput mask="999-999" />);
    expect(getInput()).toBeInTheDocument();
  });

  it("forwards refs to the input host", () => {
    const ref = React.createRef<GetRef<typeof MaskInput>>();
    render(<MaskInput ref={ref} mask="999-999" />);
    expect(ref.current).toBe(getInput());
  });

  it("formats typed digits against the mask", () => {
    render(<MaskInput mask="999-999" />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "123456" } });
    expect(input.value).toBe("123-456");
  });

  it("removes only one raw character when deleting from a formatted value", () => {
    render(<MaskInput mask="999-999" />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.change(input, { target: { value: "123" } });
    fireEvent.change(input, { target: { value: "123-4" } });
    fireEvent.change(input, { target: { value: "123-45" } });
    fireEvent.change(input, { target: { value: "123-456" } });

    fireEvent.change(input, { target: { value: "123-45" } });

    expect(input.value).toBe("123-45");
  });

  it("backspacing an auto-inserted trailing literal deletes the preceding character", () => {
    render(<MaskInput mask="999-999" />);
    const input = getInput();

    // Typing three digits auto-appends the separator: "123-".
    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.change(input, { target: { value: "123" } });
    expect(input.value).toBe("123-");

    // Backspacing the separator must remove the "3", not regenerate "123-".
    fireEvent.change(input, { target: { value: "123" } });
    expect(input.value).toBe("12");

    // And again removes the "2".
    fireEvent.change(input, { target: { value: "1" } });
    expect(input.value).toBe("1");
  });

  it("only accepts characters allowed by the token", () => {
    render(<MaskInput mask="999" />);
    const input = getInput();
    // Letters are rejected by the `9` (digit) token; the digit is kept.
    fireEvent.change(input, { target: { value: "a1b" } });
    expect(input.value).toBe("1");
  });

  it("transforms characters before validation", () => {
    render(<MaskInput mask="AA-99" transform={(char) => char.toUpperCase()} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "ab12" } });
    expect(input.value).toBe("AB-12");
  });

  it("calls onChange with the masked display value", () => {
    const onChange = jest.fn();
    render(<MaskInput mask="(999)" onChange={onChange} />);
    fireEvent.change(getInput(), { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith("(12");
  });

  it("calls onChangeRaw with raw and masked values", () => {
    const onChangeRaw = jest.fn();
    render(<MaskInput mask="999-99" onChangeRaw={onChangeRaw} />);
    fireEvent.change(getInput(), { target: { value: "12345" } });
    expect(onChangeRaw).toHaveBeenLastCalledWith("12345", "123-45");
  });

  it("calls onComplete once when every required slot is filled", () => {
    const onComplete = jest.fn();
    render(<MaskInput mask="99-99" onComplete={onComplete} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "12" } });
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "1234" } });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("12-34", "1234");
  });

  it("supports a controlled value", () => {
    const { rerender } = render(<MaskInput mask="999-999" value="111-222" onChange={jest.fn()} />);
    expect(getInput().value).toBe("111-222");
    rerender(<MaskInput mask="999-999" value="333-444" onChange={jest.fn()} />);
    expect(getInput().value).toBe("333-444");
  });

  it("respects an uncontrolled defaultValue", () => {
    render(<MaskInput mask="999-999" defaultValue="555-666" />);
    expect(getInput().value).toBe("555-666");
  });

  it("shows the mask template when alwaysShowMask is set", () => {
    render(<MaskInput mask="99-99" alwaysShowMask slotChar="_" />);
    expect(getInput().value).toBe("__-__");
  });

  it("exposes a reset function via resetRef", () => {
    const resetRef = React.createRef<() => void>();
    render(<MaskInput mask="999" defaultValue="123" resetRef={resetRef} />);
    const input = getInput();
    expect(input.value).toBe("123");
    expect(typeof resetRef.current).toBe("function");
    act(() => {
      resetRef.current?.();
    });
    expect(input.value).toBe("");
  });

  it("supports array masks with RegExp tokens", () => {
    render(<MaskInput mask={[/[0-9]/, "-", /[A-Z]/]} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: "1X" } });
    expect(input.value).toBe("1-X");
  });
});
