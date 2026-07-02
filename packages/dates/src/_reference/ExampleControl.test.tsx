import { fireEvent, render, screen } from "../test-utils";
import { ExampleControl } from "./ExampleControl";

const WEEK = ["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19"];

describe("ExampleControl (reference)", () => {
  it("renders a group with one button per data item", () => {
    render(<ExampleControl data={WEEK} />);
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(WEEK.length);
  });

  it("labels each option button with its YYYY-MM-DD date", () => {
    render(<ExampleControl data={WEEK} />);
    expect(screen.getByRole("button", { name: "2026-06-15" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026-06-19" })).toBeInTheDocument();
  });

  it("formats labels with labelFormat", () => {
    render(<ExampleControl data={["2026-06-15"]} labelFormat="MMM D" />);
    expect(screen.getByText("Jun 15")).toBeInTheDocument();
  });

  describe("selection", () => {
    it("marks the controlled value as selected", () => {
      render(<ExampleControl data={WEEK} value="2026-06-17" />);
      expect(screen.getByRole("button", { name: "2026-06-17" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("calls onChange with the pressed date (uncontrolled)", () => {
      const onChange = jest.fn();
      render(<ExampleControl data={WEEK} onChange={onChange} />);
      fireEvent.click(screen.getByRole("button", { name: "2026-06-18" }));
      expect(onChange).toHaveBeenCalledWith("2026-06-18");
    });

    it("updates selection after a press in uncontrolled mode", () => {
      render(<ExampleControl data={WEEK} defaultValue="2026-06-15" />);
      const target = screen.getByRole("button", { name: "2026-06-16" });
      fireEvent.click(target);
      expect(target).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("min / max bounds", () => {
    it("disables out-of-range options", () => {
      render(<ExampleControl data={WEEK} minDate="2026-06-16" maxDate="2026-06-18" />);
      expect(screen.getByRole("button", { name: "2026-06-15" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByRole("button", { name: "2026-06-19" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByRole("button", { name: "2026-06-17" })).not.toHaveAttribute(
        "aria-disabled",
      );
    });
  });

  describe("getOptionProps", () => {
    it("applies returned props and preserves the consumer onPress", () => {
      const onPress = jest.fn();
      render(<ExampleControl data={WEEK} getOptionProps={() => ({ onPress })} />);
      fireEvent.click(screen.getByRole("button", { name: "2026-06-15" }));
      expect(onPress).toHaveBeenCalled();
    });
  });

  describe("composition", () => {
    it("renders Lead / Trail marker-slot content", () => {
      render(
        <ExampleControl data={WEEK}>
          <ExampleControl.Lead>LEAD</ExampleControl.Lead>
          <ExampleControl.Trail>TRAIL</ExampleControl.Trail>
        </ExampleControl>,
      );
      expect(screen.getByText("LEAD")).toBeInTheDocument();
      expect(screen.getByText("TRAIL")).toBeInTheDocument();
    });
  });
});
