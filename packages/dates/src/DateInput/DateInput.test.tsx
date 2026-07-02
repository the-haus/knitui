import * as React from "react";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { DateInput } from "./DateInput";

/** The editable trigger input surfaces with the textbox role. */
function input(): HTMLInputElement {
  return screen.getByRole("textbox") as HTMLInputElement;
}

function type(value: string) {
  fireEvent.change(input(), { target: { value } });
}

describe("DateInput", () => {
  it("renders an editable textbox", () => {
    render(<DateInput placeholder="Pick a date" />);
    expect(screen.getByPlaceholderText("Pick a date")).toBeInTheDocument();
  });

  it("formats a controlled value with the default valueFormat", () => {
    render(<DateInput value={new Date(2024, 0, 15)} onChange={() => {}} />);
    expect(input()).toHaveValue("January 15, 2024");
  });

  it("formats a controlled value with a custom valueFormat", () => {
    render(
      <DateInput value={new Date(2024, 0, 15)} valueFormat="DD/MM/YYYY" onChange={() => {}} />,
    );
    expect(input()).toHaveValue("15/01/2024");
  });

  it("formats an uncontrolled defaultValue", () => {
    render(<DateInput defaultValue={new Date(2024, 2, 9)} />);
    expect(input()).toHaveValue("March 9, 2024");
  });

  it("parses a typed value matching valueFormat and fires onChange with a date string", () => {
    const onChange = jest.fn();
    render(<DateInput onChange={onChange} />);
    type("March 9, 2024");
    expect(onChange).toHaveBeenLastCalledWith("2024-03-09");
  });

  it("parses a typed value with a custom valueFormat", () => {
    const onChange = jest.fn();
    render(<DateInput valueFormat="DD/MM/YYYY" onChange={onChange} />);
    type("09/03/2024");
    expect(onChange).toHaveBeenLastCalledWith("2024-03-09");
  });

  it("preserves unparseable input while typing without firing onChange", () => {
    const onChange = jest.fn();
    render(<DateInput onChange={onChange} />);
    type("not a date");
    expect(input()).toHaveValue("not a date");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses a custom dateParser when provided", () => {
    const onChange = jest.fn();
    const dateParser = jest.fn(() => "2024-12-25");
    render(<DateInput dateParser={dateParser} onChange={onChange} />);
    type("xmas");
    expect(dateParser).toHaveBeenCalledWith("xmas");
    expect(onChange).toHaveBeenLastCalledWith("2024-12-25");
  });

  it("does not select a parsed value outside minDate/maxDate bounds", () => {
    const onChange = jest.fn();
    render(
      <DateInput
        onChange={onChange}
        minDate={new Date(2024, 0, 1)}
        maxDate={new Date(2024, 0, 31)}
      />,
    );
    type("March 9, 2024");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects a parsed value within minDate/maxDate bounds", () => {
    const onChange = jest.fn();
    render(
      <DateInput
        onChange={onChange}
        minDate={new Date(2024, 0, 1)}
        maxDate={new Date(2024, 0, 31)}
      />,
    );
    type("January 15, 2024");
    expect(onChange).toHaveBeenLastCalledWith("2024-01-15");
  });

  it("preserves the time portion when withTime is set", () => {
    const onChange = jest.fn();
    render(<DateInput onChange={onChange} withTime valueFormat="MMMM D, YYYY HH:mm" />);
    type("March 9, 2024 13:30");
    expect(onChange).toHaveBeenLastCalledWith("2024-03-09 13:30:00");
  });

  it("clears the value on empty input when allowDeselect is set", () => {
    const onChange = jest.fn();
    render(<DateInput defaultValue={new Date(2024, 0, 15)} allowDeselect onChange={onChange} />);
    type("");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("does not clear on empty input when allowDeselect is false", () => {
    const onChange = jest.fn();
    render(
      <DateInput defaultValue={new Date(2024, 0, 15)} allowDeselect={false} onChange={onChange} />,
    );
    type("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("restores the last valid value on blur when fixOnBlur is true (default)", () => {
    render(<DateInput defaultValue={new Date(2024, 0, 15)} />);
    type("garbage");
    expect(input()).toHaveValue("garbage");
    fireEvent.blur(input());
    expect(input()).toHaveValue("January 15, 2024");
  });

  it("keeps the typed text on blur when fixOnBlur is false", () => {
    render(<DateInput defaultValue={new Date(2024, 0, 15)} fixOnBlur={false} />);
    type("garbage");
    fireEvent.blur(input());
    expect(input()).toHaveValue("garbage");
  });

  it("renders a clear button when clearable and a value is set", () => {
    render(<DateInput defaultValue={new Date(2024, 0, 15)} clearable />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("does not render a clear button when there is no value", () => {
    render(<DateInput clearable />);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("clears the value when the clear button is pressed", () => {
    const onChange = jest.fn();
    render(<DateInput defaultValue={new Date(2024, 0, 15)} clearable onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input()).toHaveValue("");
  });

  it("opens the dropdown calendar on focus", () => {
    render(<DateInput defaultValue={new Date(2024, 0, 15)} />);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    fireEvent.focus(input());
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("keeps the dropdown open when a press lands after focus (no press-toggle double-fire)", () => {
    // A real tap/click delivers focus AND a press. The press must OPEN (not
    // toggle), or the dropdown opened by focus closes again within the same
    // gesture — exactly how a single tap broke the picker on native.
    render(<DateInput defaultValue={new Date(2024, 0, 15)} />);
    fireEvent.focus(input());
    fireEvent.click(input());
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("opens the dropdown on a press while already focused", () => {
    render(<DateInput defaultValue={new Date(2024, 0, 15)} />);
    fireEvent.click(input());
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders a label and description via Input.Wrapper", () => {
    render(<DateInput label="Birthday" description="Pick your birthday" />);
    expect(screen.getByText("Birthday")).toBeInTheDocument();
    expect(screen.getByText("Pick your birthday")).toBeInTheDocument();
  });

  it("disables the input when disabled", () => {
    render(<DateInput disabled />);
    expect(input()).toBeDisabled();
  });

  it("does not open the dropdown when readOnly on focus", () => {
    render(<DateInput readOnly value={new Date(2024, 0, 15)} onChange={() => {}} />);
    fireEvent.focus(input());
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("syncs the displayed text when a controlled value changes externally", () => {
    const { rerender } = render(<DateInput value={new Date(2024, 0, 15)} onChange={() => {}} />);
    expect(input()).toHaveValue("January 15, 2024");
    rerender(<DateInput value={new Date(2024, 5, 20)} onChange={() => {}} />);
    expect(input()).toHaveValue("June 20, 2024");
  });

  it("renders a hidden form input mirroring the value when name is set", () => {
    const { container } = render(<DateInput name="dob" defaultValue={new Date(2024, 0, 15)} />);
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden).toHaveAttribute("name", "dob");
    expect(hidden).toHaveValue("2024-01-15");
  });

  it("keeps formatting working when wrapped in a DatesProvider locale", () => {
    render(
      <DatesProvider settings={{ locale: "ru" }}>
        <DateInput value={new Date(2024, 0, 15)} valueFormat="DD/MM/YYYY" onChange={() => {}} />
      </DatesProvider>,
    );
    expect(input()).toHaveValue("15/01/2024");
  });

  it("forwards a ref to the input element", () => {
    const ref = React.createRef<HTMLElement>();
    render(<DateInput ref={ref as never} />);
    expect(ref.current).not.toBeNull();
  });

  it("spreads styles.input sugar onto the editable trigger", () => {
    render(<DateInput placeholder="Pick" styles={{ input: { testID: "trigger" } }} />);
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
  });

  it("spreads styles.wrapper sugar onto the Input.Wrapper", () => {
    render(<DateInput label="Birthday" styles={{ wrapper: { testID: "wrap" } }} />);
    expect(screen.getByTestId("wrap")).toBeInTheDocument();
  });

  it("spreads styles.calendar sugar onto the dropdown calendar", () => {
    render(
      <DateInput defaultValue={new Date(2024, 0, 15)} styles={{ calendar: { testID: "cal" } }} />,
    );
    fireEvent.focus(input());
    expect(screen.getByTestId("cal")).toBeInTheDocument();
  });
});
