/**
 * Tests for {@link YearPickerInput} — the input-trigger year picker
 * (`useDatesInput` + `PickerInputBase` wrapping an inline `YearPicker`). Asserts
 * the public surface: label/placeholder chrome, a controlled value rendered with
 * the `'YYYY'` default (and a custom `valueFormat`), press-to-open the dropdown
 * (decade grid of years appears), selecting a year firing `onChange` + filling
 * the trigger and closing, the clearable affordance (`onChange(null)`), disabled /
 * readOnly suppressing the open, `error` chrome, and `range`/`multiple` types.
 * Year cells are buttons labelled `2020`…`2029`; the trigger is a read-only
 * `InputBase` whose press opens the `Popover` (fired by `fireEvent.click`). FIXED
 * dates only.
 */
import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { YearPickerInput } from "./YearPickerInput";

function openDropdown(placeholder = "pick") {
  fireEvent.click(screen.getByPlaceholderText(placeholder));
}

describe("YearPickerInput chrome", () => {
  it("renders the label and placeholder", () => {
    render(<YearPickerInput label="Year" placeholder="pick" />);
    expect(screen.getByText("Year")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("pick")).toBeInTheDocument();
  });

  it("renders an error message", () => {
    render(<YearPickerInput placeholder="pick" error="Bad year" />);
    expect(screen.getByText("Bad year")).toBeInTheDocument();
  });

  it("shows a controlled value with the default YYYY format", () => {
    render(<YearPickerInput placeholder="pick" value="2023-01-15" />);
    expect(screen.getByDisplayValue("2023")).toBeInTheDocument();
  });

  it("honours a custom valueFormat", () => {
    render(<YearPickerInput placeholder="pick" value="2023-01-15" valueFormat="YY" />);
    expect(screen.getByDisplayValue("23")).toBeInTheDocument();
  });

  it("renders the defaultValue (uncontrolled)", () => {
    render(<YearPickerInput placeholder="pick" defaultValue="2021-03-15" />);
    expect(screen.getByDisplayValue("2021")).toBeInTheDocument();
  });
});

describe("YearPickerInput dropdown", () => {
  it("does not render the year grid until opened", () => {
    render(<YearPickerInput placeholder="pick" defaultDate="2023-01-15" />);
    expect(screen.queryByText("2023")).not.toBeInTheDocument();
  });

  it("opens the year picker when the trigger is pressed", () => {
    render(<YearPickerInput placeholder="pick" defaultDate="2023-01-15" />);
    openDropdown();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("2020")).toBeInTheDocument();
  });

  it("selecting a year fires onChange and fills the trigger", () => {
    const onChange = jest.fn();
    render(<YearPickerInput placeholder="pick" defaultDate="2023-01-15" onChange={onChange} />);
    openDropdown();
    fireEvent.click(screen.getByText("2025"));
    expect(onChange).toHaveBeenCalledWith("2025-01-01");
    expect(screen.getByDisplayValue("2025")).toBeInTheDocument();
  });

  it("closes the dropdown after a selection by default", () => {
    render(<YearPickerInput placeholder="pick" defaultDate="2023-01-15" />);
    openDropdown();
    fireEvent.click(screen.getByText("2025"));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});

describe("YearPickerInput clearable", () => {
  it("shows the clear button and fires onChange(null) on clear", () => {
    const onChange = jest.fn();
    render(<YearPickerInput placeholder="pick" value="2023-01-15" clearable onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("does not show a clear button without a value", () => {
    render(<YearPickerInput placeholder="pick" clearable />);
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });

  it("does not show a clear button when not clearable", () => {
    render(<YearPickerInput placeholder="pick" value="2023-01-15" />);
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });
});

describe("YearPickerInput disabled / readOnly", () => {
  it("does not open when disabled", () => {
    render(<YearPickerInput placeholder="pick" defaultDate="2023-01-15" disabled />);
    openDropdown();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("does not open when readOnly", () => {
    render(<YearPickerInput placeholder="pick" defaultDate="2023-01-15" readOnly />);
    openDropdown();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});

describe("YearPickerInput min/max", () => {
  it("disables years outside the maxDate bound", () => {
    render(<YearPickerInput placeholder="pick" defaultDate="2023-01-15" maxDate="2024-12-31" />);
    openDropdown();
    const y2026 = screen.getByText("2026").closest('[role="button"]');
    expect(y2026).toHaveAttribute("aria-disabled", "true");
  });
});

describe("YearPickerInput range", () => {
  it("renders a range value as start – end in the trigger", () => {
    render(
      <YearPickerInput type="range" placeholder="pick" value={["2021-01-15", "2024-03-15"]} />,
    );
    expect(screen.getByDisplayValue("2021 – 2024")).toBeInTheDocument();
  });

  it("picks a range start and end via the grid", () => {
    const onChange = jest.fn();
    render(
      <YearPickerInput
        type="range"
        placeholder="pick"
        defaultDate="2023-01-15"
        onChange={onChange}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByText("2021"));
    fireEvent.click(screen.getByText("2024"));
    expect(onChange).toHaveBeenLastCalledWith(["2021-01-01", "2024-01-01"]);
  });
});

describe("YearPickerInput multiple", () => {
  it("keeps the dropdown open while toggling years", () => {
    const onChange = jest.fn();
    render(
      <YearPickerInput
        type="multiple"
        placeholder="pick"
        defaultDate="2023-01-15"
        onChange={onChange}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByText("2021"));
    expect(screen.getByRole("grid")).toBeInTheDocument();
    fireEvent.click(screen.getByText("2024"));
    expect(onChange).toHaveBeenLastCalledWith(["2021-01-01", "2024-01-01"]);
  });
});

describe("YearPickerInput trigger", () => {
  it("forwards a ref to the trigger element", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<YearPickerInput placeholder="pick" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("opens the picker inside a modal when dropdownType=modal", () => {
    render(<YearPickerInput placeholder="pick" defaultDate="2023-01-15" dropdownType="modal" />);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    openDropdown();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });
});

describe("YearPickerInput valueFormatter", () => {
  it("formats the trigger string via a custom valueFormatter", () => {
    render(
      <YearPickerInput
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
        <YearPickerInput placeholder="pick" value="2023-01-15" />
      </DatesProvider>,
    );
    expect(screen.getByDisplayValue("2023")).toBeInTheDocument();
  });
});
