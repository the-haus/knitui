import { fireEvent, render, screen } from "../test-utils";
import { TimeGrid } from "./TimeGrid";

const DATA = ["10:00", "12:30", "18:00", "22:15"];

describe("TimeGrid", () => {
  it("renders a control per data entry, 24h formatted by default", () => {
    render(<TimeGrid data={DATA} />);
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("12:30")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(screen.getByText("22:15")).toBeInTheDocument();
  });

  it("formats labels as 12h when format='12h'", () => {
    render(<TimeGrid data={["00:00", "10:00", "12:00", "18:30"]} format="12h" />);
    expect(screen.getByText("12:00 AM")).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();
    expect(screen.getByText("12:00 PM")).toBeInTheDocument();
    expect(screen.getByText("6:30 PM")).toBeInTheDocument();
  });

  it("uses custom amPmLabels in 12h mode", () => {
    render(<TimeGrid data={["09:00", "21:00"]} format="12h" amPmLabels={{ am: "vm", pm: "nm" }} />);
    expect(screen.getByText("9:00 vm")).toBeInTheDocument();
    expect(screen.getByText("9:00 nm")).toBeInTheDocument();
  });

  it("shows seconds when withSeconds is set", () => {
    render(<TimeGrid data={["10:00:30", "18:00:45"]} withSeconds />);
    expect(screen.getByText("10:00:30")).toBeInTheDocument();
    expect(screen.getByText("18:00:45")).toBeInTheDocument();
  });

  it("marks the controlled value as active via aria-selected", () => {
    render(<TimeGrid data={DATA} value="12:30" />);
    expect(screen.getByText("12:30").closest("button")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("10:00").closest("button")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("calls onChange with the pressed time (controlled, no internal update)", () => {
    const onChange = jest.fn();
    render(<TimeGrid data={DATA} value={null} onChange={onChange} />);
    fireEvent.click(screen.getByText("18:00"));
    expect(onChange).toHaveBeenCalledWith("18:00");
  });

  it("selects via defaultValue and updates uncontrolled on press", () => {
    const onChange = jest.fn();
    render(<TimeGrid data={DATA} defaultValue="10:00" onChange={onChange} />);
    expect(screen.getByText("10:00").closest("button")).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByText("22:15"));
    expect(onChange).toHaveBeenCalledWith("22:15");
    expect(screen.getByText("22:15").closest("button")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("10:00").closest("button")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("does not deselect the active value on re-press by default", () => {
    const onChange = jest.fn();
    render(<TimeGrid data={DATA} defaultValue="10:00" onChange={onChange} />);
    fireEvent.click(screen.getByText("10:00"));
    // value already === time and allowDeselect false => no change emitted
    expect(onChange).not.toHaveBeenCalled();
  });

  it("deselects the active value (onChange null) when allowDeselect is set", () => {
    const onChange = jest.fn();
    render(<TimeGrid data={DATA} defaultValue="10:00" allowDeselect onChange={onChange} />);
    fireEvent.click(screen.getByText("10:00"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("disables all controls when disabled is set", () => {
    const onChange = jest.fn();
    render(<TimeGrid data={DATA} disabled onChange={onChange} />);
    for (const t of DATA) {
      expect(screen.getByText(t).closest("button")).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("disables controls before minTime", () => {
    render(<TimeGrid data={DATA} minTime="12:30" />);
    expect(screen.getByText("10:00").closest("button")).toHaveAttribute("aria-disabled", "true");
    // exactly minTime stays enabled (strict before)
    expect(screen.getByText("12:30").closest("button")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("18:00").closest("button")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("disables controls after maxTime", () => {
    render(<TimeGrid data={DATA} maxTime="18:00" />);
    expect(screen.getByText("22:15").closest("button")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("18:00").closest("button")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("10:00").closest("button")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("disables controls listed in a disableTime array", () => {
    render(<TimeGrid data={DATA} disableTime={["12:30", "22:15"]} />);
    expect(screen.getByText("12:30").closest("button")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("22:15").closest("button")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("10:00").closest("button")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("disables controls via a disableTime predicate", () => {
    render(<TimeGrid data={DATA} disableTime={(time) => time.startsWith("1")} />);
    expect(screen.getByText("10:00").closest("button")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("12:30").closest("button")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("18:00").closest("button")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("22:15").closest("button")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("applies per-control props via getControlProps", () => {
    render(
      <TimeGrid
        data={DATA}
        getControlProps={(time) => (time === "10:00" ? { "aria-label": "morning slot" } : {})}
      />,
    );
    expect(screen.getByLabelText("morning slot")).toBeInTheDocument();
  });

  it("renders controls with role=button", () => {
    render(<TimeGrid data={["10:00"]} />);
    expect(screen.getByRole("button", { name: /10:00/ })).toBeInTheDocument();
  });

  it("exposes the host frame as role=group", () => {
    render(<TimeGrid data={DATA} />);
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("routes the `control` styles slot onto each control (getControlProps wins)", () => {
    render(
      <TimeGrid
        data={DATA}
        styles={{ control: { "aria-label": "slot label" } }}
        getControlProps={(time) => (time === "10:00" ? { "aria-label": "explicit wins" } : {})}
      />,
    );
    // explicit beats sugar on the 10:00 control
    expect(screen.getByLabelText("explicit wins")).toBeInTheDocument();
    // the slug sugar applies to the others
    expect(screen.getAllByLabelText("slot label").length).toBe(DATA.length - 1);
  });

  it("preserves a consumer onPress from getControlProps and still updates the value", () => {
    const onPress = jest.fn();
    const onChange = jest.fn();
    render(<TimeGrid data={DATA} onChange={onChange} getControlProps={() => ({ onPress })} />);
    fireEvent.click(screen.getByText("18:00"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("18:00");
  });

  it("exposes the styled parts as static properties", () => {
    expect(TimeGrid.Frame).toBeDefined();
    expect(TimeGrid.Grid).toBeDefined();
    expect(TimeGrid.Control).toBeDefined();
    expect(TimeGrid.ControlLabel).toBeDefined();
  });
});
