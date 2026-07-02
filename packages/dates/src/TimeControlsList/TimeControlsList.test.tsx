import { fireEvent, render, screen } from "../test-utils";
import { AmPmControlsList } from "./AmPmControlsList";
import { TimeControlsList } from "./TimeControlsList";

describe("TimeControlsList", () => {
  it("renders one zero-padded control per stepped value in [min, max]", () => {
    render(
      <TimeControlsList
        min={0}
        max={5}
        step={1}
        value={null}
        onSelect={() => {}}
        reversed={false}
      />,
    );
    // 0..5 inclusive => 6 controls
    for (const v of ["00", "01", "02", "03", "04", "05"]) {
      expect(screen.getByText(v)).toBeInTheDocument();
    }
  });

  it("honours step when building the range", () => {
    render(
      <TimeControlsList
        min={0}
        max={59}
        step={15}
        value={null}
        onSelect={() => {}}
        reversed={false}
      />,
    );
    expect(screen.getByText("00")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    // 60 is out of range
    expect(screen.queryByText("60")).not.toBeInTheDocument();
    // 16 was never stepped to
    expect(screen.queryByText("16")).not.toBeInTheDocument();
  });

  it("calls onSelect with the pressed numeric value", () => {
    const onSelect = jest.fn();
    render(
      <TimeControlsList
        min={0}
        max={5}
        step={1}
        value={null}
        onSelect={onSelect}
        reversed={false}
      />,
    );
    fireEvent.click(screen.getByText("03"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("marks the active control via aria-selected", () => {
    render(
      <TimeControlsList min={0} max={5} step={1} value={2} onSelect={() => {}} reversed={false} />,
    );
    const active = screen.getByText("02").closest("button");
    expect(active).toHaveAttribute("aria-selected", "true");
    const inactive = screen.getByText("01").closest("button");
    expect(inactive).not.toHaveAttribute("aria-selected", "true");
  });

  it("reverses the visual order when reversed is set", () => {
    const { container } = render(
      <TimeControlsList min={0} max={3} step={1} value={null} onSelect={() => {}} reversed />,
    );
    const labels = Array.from(container.querySelectorAll("button")).map((b) => b.textContent);
    expect(labels).toEqual(["03", "02", "01", "00"]);
  });

  it("renders ascending order by default (reversed undefined)", () => {
    const { container } = render(
      <TimeControlsList
        min={0}
        max={3}
        step={1}
        value={null}
        onSelect={() => {}}
        reversed={undefined}
      />,
    );
    const labels = Array.from(container.querySelectorAll("button")).map((b) => b.textContent);
    expect(labels).toEqual(["00", "01", "02", "03"]);
  });

  it("does not loop infinitely with a non-positive step", () => {
    // step <= 0 should produce a single element and break
    const { container } = render(
      <TimeControlsList
        min={0}
        max={5}
        step={0}
        value={null}
        onSelect={() => {}}
        reversed={false}
      />,
    );
    expect(container.querySelectorAll("button")).toHaveLength(1);
  });

  it("gives each control the listbox-option role inside a list", () => {
    const { container } = render(
      <TimeControlsList
        min={0}
        max={2}
        step={1}
        value={null}
        onSelect={() => {}}
        reversed={false}
      />,
    );
    expect(container.querySelector('[role="list"]')).toBeInTheDocument();
    const options = container.querySelectorAll('[role="option"]');
    expect(options).toHaveLength(3);
  });

  it("passes per-value props through getControlProps", () => {
    render(
      <TimeControlsList
        min={0}
        max={2}
        step={1}
        value={null}
        onSelect={() => {}}
        reversed={false}
        getControlProps={(v) => (v === 1 ? { "aria-label": "the-one" } : {})}
      />,
    );
    expect(screen.getByText("01").closest("button")).toHaveAttribute("aria-label", "the-one");
  });

  it("applies per-slot styles sugar to the control parts", () => {
    render(
      <TimeControlsList
        min={0}
        max={2}
        step={1}
        value={null}
        onSelect={() => {}}
        reversed={false}
        styles={{ control: { "aria-label": "styled" } }}
      />,
    );
    expect(screen.getByText("00").closest("button")).toHaveAttribute("aria-label", "styled");
  });

  it("lets getControlProps win over the control style slot", () => {
    render(
      <TimeControlsList
        min={0}
        max={2}
        step={1}
        value={null}
        onSelect={() => {}}
        reversed={false}
        styles={{ control: { "aria-label": "from-styles" } }}
        getControlProps={(v) => (v === 0 ? { "aria-label": "from-callback" } : {})}
      />,
    );
    expect(screen.getByText("00").closest("button")).toHaveAttribute("aria-label", "from-callback");
    // value 1 falls back to the styles slot
    expect(screen.getByText("01").closest("button")).toHaveAttribute("aria-label", "from-styles");
  });

  it("exposes the styled parts as static properties", () => {
    expect(TimeControlsList.Frame).toBeDefined();
    expect(TimeControlsList.Column).toBeDefined();
    expect(TimeControlsList.Control).toBeDefined();
  });
});

describe("AmPmControlsList", () => {
  const labels = { am: "AM", pm: "PM" };

  it("renders both am and pm controls from labels", () => {
    render(<AmPmControlsList labels={labels} value={null} onSelect={() => {}} />);
    expect(screen.getByText("AM")).toBeInTheDocument();
    expect(screen.getByText("PM")).toBeInTheDocument();
  });

  it("renders custom labels", () => {
    render(
      <AmPmControlsList labels={{ am: "vorm.", pm: "nachm." }} value={null} onSelect={() => {}} />,
    );
    expect(screen.getByText("vorm.")).toBeInTheDocument();
    expect(screen.getByText("nachm.")).toBeInTheDocument();
  });

  it("marks the matching control active", () => {
    render(<AmPmControlsList labels={labels} value="PM" onSelect={() => {}} />);
    expect(screen.getByText("PM").closest("button")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("AM").closest("button")).not.toHaveAttribute("aria-selected", "true");
  });

  it("calls onSelect with the pressed label", () => {
    const onSelect = jest.fn();
    render(<AmPmControlsList labels={labels} value={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("PM"));
    expect(onSelect).toHaveBeenCalledWith("PM");
  });
});
