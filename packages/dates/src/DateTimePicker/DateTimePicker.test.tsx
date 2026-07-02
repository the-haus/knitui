import * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
import { DateTimePicker } from "./DateTimePicker";

/** The trigger surfaces as a (read-only) textbox displaying the formatted value. */
function trigger(): HTMLInputElement {
  return screen.getByRole("textbox") as HTMLInputElement;
}

/** Click the day cell whose label is exactly `day` within the day grid. */
function clickDay(day: string) {
  const cells = screen.getAllByText(day, { selector: "*" });
  const button = cells
    .map((node) => node.closest("button"))
    .find((node): node is HTMLButtonElement => node !== null);
  if (!button) {
    throw new Error(`No day button found for "${day}"`);
  }
  fireEvent.click(button);
  return button;
}

describe("DateTimePicker", () => {
  it("renders a trigger with an empty value and placeholder", () => {
    render(<DateTimePicker placeholder="Pick date & time" />);
    expect(screen.getByPlaceholderText("Pick date & time")).toBeInTheDocument();
    expect(trigger()).toHaveValue("");
  });

  it("formats a controlled value with the default DD/MM/YYYY HH:mm format", () => {
    render(<DateTimePicker value={new Date(2024, 0, 15, 13, 30)} onChange={() => {}} />);
    expect(trigger()).toHaveValue("15/01/2024 13:30");
  });

  it("shows seconds in the trigger when withSeconds is set", () => {
    render(
      <DateTimePicker value={new Date(2024, 0, 15, 13, 30, 45)} withSeconds onChange={() => {}} />,
    );
    expect(trigger()).toHaveValue("15/01/2024 13:30:45");
  });

  it("honours a custom string valueFormat", () => {
    render(
      <DateTimePicker
        value={new Date(2024, 0, 15, 13, 30)}
        valueFormat="YYYY-MM-DD HH:mm"
        onChange={() => {}}
      />,
    );
    expect(trigger()).toHaveValue("2024-01-15 13:30");
  });

  it("honours a function valueFormat receiving the date-time string", () => {
    render(
      <DateTimePicker
        value={new Date(2024, 0, 15, 13, 30)}
        valueFormat={(v) => `at ${v}`}
        onChange={() => {}}
      />,
    );
    expect(trigger()).toHaveValue("at 2024-01-15 13:30:00");
  });

  it("does not open the dropdown until the trigger is pressed", () => {
    render(<DateTimePicker defaultDate={new Date(2024, 0, 1)} />);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    fireEvent.click(trigger());
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("fires onChange with a date-time string when a day is picked", () => {
    const onChange = jest.fn();
    render(<DateTimePicker defaultDate={new Date(2024, 0, 1)} onChange={onChange} />);
    fireEvent.click(trigger());
    clickDay("15");
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith("2024-01-15 00:00:00");
  });

  it("applies defaultTimeValue when a day is picked", () => {
    const onChange = jest.fn();
    render(
      <DateTimePicker
        defaultDate={new Date(2024, 0, 1)}
        defaultTimeValue="09:15"
        onChange={onChange}
      />,
    );
    fireEvent.click(trigger());
    clickDay("20");
    expect(onChange).toHaveBeenLastCalledWith("2024-01-20 09:15:00");
  });

  it("renders the time inputs inside the dropdown via timePickerProps labels", () => {
    render(
      <DateTimePicker
        value={new Date(2024, 0, 15, 13, 30)}
        onChange={() => {}}
        timePickerProps={{ hoursInputLabel: "hh", minutesInputLabel: "mm" }}
      />,
    );
    fireEvent.click(trigger());
    expect((screen.getByLabelText("hh") as HTMLInputElement).value).toBe("13");
    expect((screen.getByLabelText("mm") as HTMLInputElement).value).toBe("30");
  });

  it("renders a label, description and required marker", () => {
    render(<DateTimePicker label="Appointment" description="When?" required />);
    expect(screen.getByText("Appointment")).toBeInTheDocument();
    expect(screen.getByText("When?")).toBeInTheDocument();
  });

  it("shows a clear button when clearable with a value and clears on press", () => {
    const onChange = jest.fn();
    render(<DateTimePicker value={new Date(2024, 0, 15, 13, 30)} clearable onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("does not show a clear button when there is no value", () => {
    render(<DateTimePicker clearable />);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("does not open when disabled", () => {
    render(<DateTimePicker disabled defaultDate={new Date(2024, 0, 1)} />);
    fireEvent.click(trigger());
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("renders a hidden form input mirroring the value (with time) when name is set", () => {
    const { container } = render(
      <DateTimePicker name="appt" value={new Date(2024, 0, 15, 13, 30)} onChange={() => {}} />,
    );
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden).toHaveAttribute("name", "appt");
    expect(hidden).toHaveValue("2024-01-15 13:30:00");
  });

  it("formats a range value with the label separator in the trigger", () => {
    render(
      <DateTimePicker
        type="range"
        value={[new Date(2024, 0, 1, 8, 0), new Date(2024, 0, 5, 9, 30)]}
        onChange={() => {}}
      />,
    );
    expect(trigger()).toHaveValue("01/01/2024 08:00 – 05/01/2024 09:30");
  });

  it("forwards a ref to the trigger element", () => {
    const ref = React.createRef<HTMLElement>();
    render(<DateTimePicker ref={ref as never} />);
    expect(ref.current).not.toBeNull();
  });

  it("commits and closes the dropdown when the submit button is pressed", () => {
    render(
      <DateTimePicker
        defaultDate={new Date(2024, 0, 1)}
        submitButtonProps={{ "aria-label": "Done" }}
      />,
    );
    fireEvent.click(trigger());
    clickDay("15");
    expect(screen.getByRole("grid")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("forwards submitButtonProps content to the submit button", () => {
    render(
      <DateTimePicker defaultDate={new Date(2024, 0, 1)} submitButtonProps={{ children: "OK" }} />,
    );
    fireEvent.click(trigger());
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("renders the picker inside a modal when dropdownType is modal", () => {
    render(<DateTimePicker dropdownType="modal" defaultDate={new Date(2024, 0, 1)} />);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    fireEvent.click(trigger());
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("does not open a modal dropdown when disabled", () => {
    render(<DateTimePicker dropdownType="modal" disabled defaultDate={new Date(2024, 0, 1)} />);
    fireEvent.click(trigger());
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("keeps the value in default mode when picking within bounds", () => {
    const onChange = jest.fn();
    render(
      <DateTimePicker
        defaultDate={new Date(2024, 0, 1)}
        minDate={new Date(2024, 0, 10)}
        maxDate={new Date(2024, 0, 20)}
        onChange={onChange}
      />,
    );
    fireEvent.click(trigger());
    clickDay("15");
    expect(onChange).toHaveBeenLastCalledWith("2024-01-15 00:00:00");
  });
});
