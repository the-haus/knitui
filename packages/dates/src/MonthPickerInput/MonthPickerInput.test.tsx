/**
 * Tests for {@link MonthPickerInput} — the input-trigger month picker
 * (`useDatesInput` + `PickerInputBase` wrapping an inline `MonthPicker`). Asserts
 * the public surface: label/placeholder chrome, a controlled value rendered with
 * the `'MMMM YYYY'` default (and a custom `valueFormat`), press-to-open the
 * dropdown (month grid of `Jan`…`Dec` appears), selecting a month firing
 * `onChange` + filling the trigger and closing, the clearable affordance
 * (`onChange(null)`), disabled / readOnly suppressing the open, `error` chrome,
 * and `range`/`multiple` types. Month cells are buttons labelled `Jan`…`Dec`; the
 * trigger is a read-only `InputBase` whose press opens the `Popover` (fired by
 * `fireEvent.click`). FIXED dates only.
 */
import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { MonthPickerInput } from "./MonthPickerInput";

function openDropdown(placeholder = "pick") {
  fireEvent.click(screen.getByPlaceholderText(placeholder));
}

describe("MonthPickerInput chrome", () => {
  it("renders the label and placeholder", () => {
    render(<MonthPickerInput label="Month" placeholder="pick" />);
    expect(screen.getByText("Month")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("pick")).toBeInTheDocument();
  });

  it("renders an error message", () => {
    render(<MonthPickerInput placeholder="pick" error="Bad month" />);
    expect(screen.getByText("Bad month")).toBeInTheDocument();
  });

  it("shows a controlled value with the default MMMM YYYY format", () => {
    render(<MonthPickerInput placeholder="pick" value="2023-01-15" />);
    expect(screen.getByDisplayValue("January 2023")).toBeInTheDocument();
  });

  it("honours a custom valueFormat", () => {
    render(<MonthPickerInput placeholder="pick" value="2023-01-15" valueFormat="MM/YYYY" />);
    expect(screen.getByDisplayValue("01/2023")).toBeInTheDocument();
  });

  it("renders the defaultValue (uncontrolled)", () => {
    render(<MonthPickerInput placeholder="pick" defaultValue="2023-03-15" />);
    expect(screen.getByDisplayValue("March 2023")).toBeInTheDocument();
  });
});

describe("MonthPickerInput dropdown", () => {
  it("does not render the month grid until opened", () => {
    render(<MonthPickerInput placeholder="pick" defaultDate="2023-01-15" />);
    expect(screen.queryByText("Jan")).not.toBeInTheDocument();
  });

  it("opens the month picker when the trigger is pressed", () => {
    render(<MonthPickerInput placeholder="pick" defaultDate="2023-01-15" />);
    openDropdown();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();
  });

  it("selecting a month fires onChange and fills the trigger", () => {
    const onChange = jest.fn();
    render(<MonthPickerInput placeholder="pick" defaultDate="2023-01-15" onChange={onChange} />);
    openDropdown();
    fireEvent.click(screen.getByText("Mar"));
    expect(onChange).toHaveBeenCalledWith("2023-03-01");
    expect(screen.getByDisplayValue("March 2023")).toBeInTheDocument();
  });

  it("closes the dropdown after a selection by default", () => {
    render(<MonthPickerInput placeholder="pick" defaultDate="2023-01-15" />);
    openDropdown();
    fireEvent.click(screen.getByText("Mar"));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});

describe("MonthPickerInput clearable", () => {
  it("shows the clear button and fires onChange(null) on clear", () => {
    const onChange = jest.fn();
    render(
      <MonthPickerInput placeholder="pick" value="2023-01-15" clearable onChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("does not show a clear button without a value", () => {
    render(<MonthPickerInput placeholder="pick" clearable />);
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });

  it("does not show a clear button when not clearable", () => {
    render(<MonthPickerInput placeholder="pick" value="2023-01-15" />);
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });
});

describe("MonthPickerInput disabled / readOnly", () => {
  it("does not open when disabled", () => {
    render(<MonthPickerInput placeholder="pick" defaultDate="2023-01-15" disabled />);
    openDropdown();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("does not open when readOnly", () => {
    render(<MonthPickerInput placeholder="pick" defaultDate="2023-01-15" readOnly />);
    openDropdown();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});

describe("MonthPickerInput min/max", () => {
  it("disables months before the minDate bound", () => {
    render(<MonthPickerInput placeholder="pick" defaultDate="2023-06-15" minDate="2023-04-01" />);
    openDropdown();
    const jan = screen.getByText("Jan").closest('[role="button"]');
    const may = screen.getByText("May").closest('[role="button"]');
    expect(jan).toHaveAttribute("aria-disabled", "true");
    expect(may).not.toHaveAttribute("aria-disabled", "true");
  });

  it("disables months outside the maxDate bound", () => {
    render(<MonthPickerInput placeholder="pick" defaultDate="2023-06-15" maxDate="2023-03-31" />);
    openDropdown();
    const june = screen.getByText("Jun").closest('[role="button"]');
    expect(june).toHaveAttribute("aria-disabled", "true");
  });
});

describe("MonthPickerInput range", () => {
  it("renders a range value as start – end in the trigger", () => {
    render(
      <MonthPickerInput type="range" placeholder="pick" value={["2023-01-15", "2023-03-15"]} />,
    );
    expect(screen.getByDisplayValue("January 2023 – March 2023")).toBeInTheDocument();
  });

  it("picks a range start and end via the grid", () => {
    const onChange = jest.fn();
    render(
      <MonthPickerInput
        type="range"
        placeholder="pick"
        defaultDate="2023-01-15"
        onChange={onChange}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByText("Feb"));
    fireEvent.click(screen.getByText("Apr"));
    expect(onChange).toHaveBeenLastCalledWith(["2023-02-01", "2023-04-01"]);
  });
});

describe("MonthPickerInput multiple", () => {
  it("keeps the dropdown open while toggling months", () => {
    const onChange = jest.fn();
    render(
      <MonthPickerInput
        type="multiple"
        placeholder="pick"
        defaultDate="2023-01-15"
        onChange={onChange}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByText("Feb"));
    expect(screen.getByRole("grid")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Apr"));
    expect(onChange).toHaveBeenLastCalledWith(["2023-02-01", "2023-04-01"]);
  });
});

describe("MonthPickerInput trigger", () => {
  it("forwards a ref to the trigger element", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<MonthPickerInput placeholder="pick" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("opens the picker inside a modal when dropdownType=modal", () => {
    render(<MonthPickerInput placeholder="pick" defaultDate="2023-01-15" dropdownType="modal" />);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    openDropdown();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();
  });
});

describe("MonthPickerInput valueFormatter", () => {
  it("formats the trigger string via a custom valueFormatter", () => {
    render(
      <MonthPickerInput
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
        <MonthPickerInput placeholder="pick" value="2023-01-15" />
      </DatesProvider>,
    );
    expect(screen.getByDisplayValue("January 2023")).toBeInTheDocument();
  });
});
