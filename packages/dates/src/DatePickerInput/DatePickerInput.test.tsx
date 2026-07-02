/**
 * Tests for {@link DatePickerInput} — the input-trigger day picker
 * (`useDatesInput` + `PickerInputBase` wrapping an inline `DatePicker`). Asserts
 * the full public surface: label/placeholder chrome, a controlled value rendered
 * with the `'MMMM D, YYYY'` default (and a custom `valueFormat`), press-to-open
 * the dropdown (day grid appears), selecting a day firing `onChange` +
 * filling the trigger, the clearable affordance (`onChange(null)`), disabled /
 * readOnly suppressing the open, `error` chrome, and the `range`/`multiple`
 * types. Day cells expose `aria-label` like `"15 January 2023"`; the trigger is a
 * read-only `InputBase` whose press opens the `Popover` (fired by
 * `fireEvent.click`). FIXED dates only.
 */
import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { DatePickerInput } from "./DatePickerInput";

function openDropdown(placeholder = "pick") {
  fireEvent.click(screen.getByPlaceholderText(placeholder));
}

describe("DatePickerInput chrome", () => {
  it("renders the label and placeholder", () => {
    render(<DatePickerInput label="Date" placeholder="pick" />);
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("pick")).toBeInTheDocument();
  });

  it("renders an error message", () => {
    render(<DatePickerInput placeholder="pick" error="Bad date" />);
    expect(screen.getByText("Bad date")).toBeInTheDocument();
  });

  it("shows a controlled value with the default MMMM D, YYYY format", () => {
    render(<DatePickerInput placeholder="pick" value="2023-01-15" />);
    expect(screen.getByDisplayValue("January 15, 2023")).toBeInTheDocument();
  });

  it("honours a custom valueFormat", () => {
    render(<DatePickerInput placeholder="pick" value="2023-01-15" valueFormat="YYYY-MM-DD" />);
    expect(screen.getByDisplayValue("2023-01-15")).toBeInTheDocument();
  });

  it("renders the defaultValue (uncontrolled)", () => {
    render(<DatePickerInput placeholder="pick" defaultValue="2023-02-20" />);
    expect(screen.getByDisplayValue("February 20, 2023")).toBeInTheDocument();
  });
});

describe("DatePickerInput dropdown", () => {
  it("does not render the day grid until opened", () => {
    render(<DatePickerInput placeholder="pick" defaultDate="2023-01-15" />);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("opens the day picker when the trigger is pressed", () => {
    render(<DatePickerInput placeholder="pick" defaultDate="2023-01-15" />);
    openDropdown();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("January 2023")).toBeInTheDocument();
    expect(screen.getByLabelText("15 January 2023")).toBeInTheDocument();
  });

  it("selecting a day fires onChange and fills the trigger", () => {
    const onChange = jest.fn();
    render(<DatePickerInput placeholder="pick" defaultDate="2023-01-15" onChange={onChange} />);
    openDropdown();
    fireEvent.click(screen.getByLabelText("20 January 2023"));
    expect(onChange).toHaveBeenCalledWith("2023-01-20");
    expect(screen.getByDisplayValue("January 20, 2023")).toBeInTheDocument();
  });

  it("closes the dropdown after a selection by default (closeOnChange)", () => {
    render(<DatePickerInput placeholder="pick" defaultDate="2023-01-15" />);
    openDropdown();
    fireEvent.click(screen.getByLabelText("20 January 2023"));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});

describe("DatePickerInput clearable", () => {
  it("shows the clear button and fires onChange(null) on clear", () => {
    const onChange = jest.fn();
    render(<DatePickerInput placeholder="pick" value="2023-01-15" clearable onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("does not show a clear button without a value", () => {
    render(<DatePickerInput placeholder="pick" clearable />);
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });

  it("does not show a clear button when not clearable", () => {
    render(<DatePickerInput placeholder="pick" value="2023-01-15" />);
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });
});

describe("DatePickerInput disabled / readOnly", () => {
  it("does not open when disabled", () => {
    render(<DatePickerInput placeholder="pick" defaultDate="2023-01-15" disabled />);
    openDropdown();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("does not open when readOnly", () => {
    render(<DatePickerInput placeholder="pick" defaultDate="2023-01-15" readOnly />);
    openDropdown();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});

describe("DatePickerInput min/max", () => {
  it("disables days before minDate", () => {
    render(<DatePickerInput placeholder="pick" defaultDate="2023-01-15" minDate="2023-01-10" />);
    openDropdown();
    expect(screen.getByLabelText("5 January 2023")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByLabelText("15 January 2023")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("disables days after maxDate", () => {
    render(<DatePickerInput placeholder="pick" defaultDate="2023-01-15" maxDate="2023-01-20" />);
    openDropdown();
    expect(screen.getByLabelText("25 January 2023")).toHaveAttribute("aria-disabled", "true");
  });
});

describe("DatePickerInput range", () => {
  it("renders a range value as start – end in the trigger", () => {
    render(
      <DatePickerInput type="range" placeholder="pick" value={["2023-01-10", "2023-01-20"]} />,
    );
    expect(screen.getByDisplayValue("January 10, 2023 – January 20, 2023")).toBeInTheDocument();
  });

  it("picks a range start and end via the grid", () => {
    const onChange = jest.fn();
    render(
      <DatePickerInput
        type="range"
        placeholder="pick"
        defaultDate="2023-01-15"
        onChange={onChange}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByLabelText("10 January 2023"));
    fireEvent.click(screen.getByLabelText("20 January 2023"));
    expect(onChange).toHaveBeenLastCalledWith(["2023-01-10", "2023-01-20"]);
  });
});

describe("DatePickerInput multiple", () => {
  it("keeps the dropdown open while toggling days", () => {
    const onChange = jest.fn();
    render(
      <DatePickerInput
        type="multiple"
        placeholder="pick"
        defaultDate="2023-01-15"
        onChange={onChange}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByLabelText("10 January 2023"));
    // dropdown stays open for multiple
    expect(screen.getByRole("grid")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("12 January 2023"));
    expect(onChange).toHaveBeenLastCalledWith(["2023-01-10", "2023-01-12"]);
  });
});

describe("DatePickerInput trigger", () => {
  it("forwards a ref to the trigger element", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<DatePickerInput placeholder="pick" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("opens the picker inside a modal when dropdownType=modal", () => {
    render(<DatePickerInput placeholder="pick" defaultDate="2023-01-15" dropdownType="modal" />);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    openDropdown();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByLabelText("15 January 2023")).toBeInTheDocument();
  });
});

describe("DatePickerInput valueFormatter", () => {
  it("formats the trigger string via a custom valueFormatter", () => {
    render(
      <DatePickerInput
        placeholder="pick"
        value="2023-01-15"
        valueFormatter={() => "CUSTOM TRIGGER"}
      />,
    );
    expect(screen.getByDisplayValue("CUSTOM TRIGGER")).toBeInTheDocument();
  });

  it("threads the DatesProvider through without breaking rendering", () => {
    render(
      <DatesProvider settings={{ firstDayOfWeek: 0 }}>
        <DatePickerInput placeholder="pick" value="2023-01-15" />
      </DatesProvider>,
    );
    expect(screen.getByDisplayValue("January 15, 2023")).toBeInTheDocument();
  });
});
