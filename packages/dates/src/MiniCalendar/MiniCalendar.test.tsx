import { fireEvent, render, screen } from "../test-utils";
import { MiniCalendar } from "./MiniCalendar";

const START = "2024-01-15";

describe("MiniCalendar", () => {
  it("renders a group with numberOfDays day buttons plus prev/next (default 7)", () => {
    render(<MiniCalendar defaultDate={START} />);
    expect(screen.getByRole("group")).toBeInTheDocument();
    // 7 days + previous + next = 9 buttons
    expect(screen.getAllByRole("button")).toHaveLength(9);
  });

  it("labels each day button with its YYYY-MM-DD date", () => {
    render(<MiniCalendar defaultDate={START} />);
    expect(screen.getByRole("button", { name: "2024-01-15" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2024-01-21" })).toBeInTheDocument();
  });

  it("honours numberOfDays", () => {
    render(<MiniCalendar defaultDate={START} numberOfDays={3} />);
    // 3 days + prev + next
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "2024-01-15" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2024-01-17" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "2024-01-18" })).not.toBeInTheDocument();
  });

  describe("selection", () => {
    it("marks the controlled value day as selected", () => {
      render(<MiniCalendar defaultDate={START} value="2024-01-16" />);
      expect(screen.getByRole("button", { name: "2024-01-16" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("button", { name: "2024-01-15" })).not.toHaveAttribute(
        "aria-selected",
      );
    });

    it("calls onChange with the pressed day (uncontrolled)", () => {
      const onChange = jest.fn();
      render(<MiniCalendar defaultDate={START} onChange={onChange} />);
      fireEvent.click(screen.getByRole("button", { name: "2024-01-16" }));
      expect(onChange).toHaveBeenCalledWith("2024-01-16");
    });

    it("updates selection in uncontrolled mode after a press", () => {
      render(<MiniCalendar defaultDate={START} />);
      const day = screen.getByRole("button", { name: "2024-01-16" });
      fireEvent.click(day);
      expect(screen.getByRole("button", { name: "2024-01-16" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });

  describe("navigation", () => {
    it("shifts the window forward by a page on next, calling onNext", () => {
      const onNext = jest.fn();
      const onDateChange = jest.fn();
      render(<MiniCalendar defaultDate={START} onNext={onNext} onDateChange={onDateChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(onNext).toHaveBeenCalledTimes(1);
      // window advances by numberOfDays (7)
      expect(onDateChange).toHaveBeenCalledWith("2024-01-22");
    });

    it("shifts the window backward by a page on previous, calling onPrevious", () => {
      const onPrevious = jest.fn();
      const onDateChange = jest.fn();
      render(
        <MiniCalendar defaultDate={START} onPrevious={onPrevious} onDateChange={onDateChange} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Previous" }));
      expect(onPrevious).toHaveBeenCalledTimes(1);
      expect(onDateChange).toHaveBeenCalledWith("2024-01-08");
    });

    it("renders the shifted days after pressing next (uncontrolled)", () => {
      render(<MiniCalendar defaultDate={START} numberOfDays={3} />);
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(screen.getByRole("button", { name: "2024-01-18" })).toBeInTheDocument();
    });
  });

  describe("min / max bounds", () => {
    it("disables out-of-range day buttons", () => {
      render(<MiniCalendar defaultDate={START} minDate="2024-01-16" maxDate="2024-01-18" />);
      expect(screen.getByRole("button", { name: "2024-01-15" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByRole("button", { name: "2024-01-16" })).not.toHaveAttribute(
        "aria-disabled",
      );
      expect(screen.getByRole("button", { name: "2024-01-19" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    it("disables the previous control when stepping back crosses minDate", () => {
      render(<MiniCalendar defaultDate={START} minDate="2024-01-15" />);
      expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    it("disables the next control when the next window crosses maxDate", () => {
      render(<MiniCalendar defaultDate={START} maxDate="2024-01-20" />);
      expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("getDayProps", () => {
    it("applies returned props to the matching day button", () => {
      render(
        <MiniCalendar
          defaultDate={START}
          getDayProps={(date) => (date === "2024-01-16" ? { id: "marked" } : {})}
        />,
      );
      expect(document.getElementById("marked")).toHaveAttribute("aria-label", "2024-01-16");
    });

    it("still commits selection while preserving the consumer onPress", () => {
      const consumerPress = jest.fn();
      const onChange = jest.fn();
      render(
        <MiniCalendar
          defaultDate={START}
          onChange={onChange}
          getDayProps={() => ({ onPress: consumerPress })}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "2024-01-16" }));
      expect(consumerPress).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith("2024-01-16");
    });
  });

  describe("styles sugar (per-slot passthrough)", () => {
    it("spreads styles.day onto every day button", () => {
      render(<MiniCalendar defaultDate={START} styles={{ day: { id: "day-slot" } }} />);
      // `id` is not unique across cells; the first day carries it (the prop landed).
      expect(document.getElementById("day-slot")).toHaveAttribute("aria-label", "2024-01-15");
    });

    it("lets explicit getDayProps win over the styles.day slot", () => {
      render(
        <MiniCalendar
          defaultDate={START}
          styles={{ day: { id: "from-slot" } }}
          getDayProps={() => ({ id: "from-explicit" })}
        />,
      );
      expect(document.getElementById("from-slot")).toBeNull();
      expect(document.getElementById("from-explicit")).toHaveAttribute("aria-label", "2024-01-15");
    });

    it("spreads styles.control onto the prev/next controls", () => {
      render(<MiniCalendar defaultDate={START} styles={{ control: { id: "a-control" } }} />);
      // Both controls receive the slot props; the first one carries the id.
      expect(document.getElementById("a-control")).toHaveAttribute("aria-label", "Previous");
    });
  });

  describe("public parts (withStaticProperties)", () => {
    it("exposes the styled parts for composition/extension", () => {
      expect(MiniCalendar.Frame).toBeDefined();
      expect(MiniCalendar.Control).toBeDefined();
      expect(MiniCalendar.Days).toBeDefined();
      expect(MiniCalendar.Day).toBeDefined();
      expect(MiniCalendar.DayMonth).toBeDefined();
      expect(MiniCalendar.DayNumber).toBeDefined();
      expect(MiniCalendar.Chevron).toBeDefined();
    });
  });

  // Regression for the shipped #15 compiler-safety bug: a dynamic `opacity` on the
  // month label got its `0` branch flattened onto the whole cell, blanking BOTH the
  // month label and the day number. The selected/today day cell must keep its
  // content visible. The month label is now a constant `opacity: 0.65` baked into
  // the style and the selected look is a boolean variant — never a dynamic prop.
  describe("compiler-safe content (regression: #15 blanked cell)", () => {
    it("keeps the selected day's month label AND number visible", () => {
      render(<MiniCalendar defaultDate="2024-01-15" value="2024-01-15" monthLabelFormat="MMMM" />);
      const selected = screen.getByRole("button", { name: "2024-01-15" });
      expect(selected).toHaveAttribute("aria-selected", "true");
      // Both stacked labels are present inside the selected cell.
      expect(screen.getAllByText("January").length).toBeGreaterThan(0);
      expect(selected).toHaveTextContent("15");
    });

    it("keeps every day cell's month label + number visible across a month boundary", () => {
      render(<MiniCalendar defaultDate="2024-01-30" numberOfDays={5} monthLabelFormat="MMMM" />);
      // No cell is blanked: both months render, and each day number is present.
      expect(screen.getAllByText("January").length).toBeGreaterThan(0);
      expect(screen.getAllByText("February").length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: "2024-01-30" })).toHaveTextContent("30");
      expect(screen.getByRole("button", { name: "2024-02-01" })).toHaveTextContent("1");
    });
  });

  describe("month label", () => {
    it("formats the month label with monthLabelFormat", () => {
      // every day is labelled with its month, so a window crossing into February
      // shows both January and February labels.
      render(<MiniCalendar defaultDate="2024-01-30" numberOfDays={5} monthLabelFormat="MMMM" />);
      expect(screen.getAllByText("February").length).toBeGreaterThan(0);
      expect(screen.getAllByText("January").length).toBeGreaterThan(0);
    });
  });

  describe("custom control content", () => {
    it("renders custom previous/next control children", () => {
      render(
        <MiniCalendar
          defaultDate={START}
          previousControlProps={{ children: "PREV" }}
          nextControlProps={{ children: "NEXT" }}
        />,
      );
      expect(screen.getByText("PREV")).toBeInTheDocument();
      expect(screen.getByText("NEXT")).toBeInTheDocument();
    });
  });

  it("forwards a ref to the root", () => {
    const ref = jest.fn();
    render(<MiniCalendar defaultDate={START} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("forwards arbitrary props (data-*) to the root", () => {
    render(<MiniCalendar defaultDate={START} data-testid="mini-root" />);
    expect(screen.getByTestId("mini-root")).toBeInTheDocument();
  });
});
