/**
 * Keyboard navigation across every calendar level (day / month / year grids),
 * multi-panel roving focus, disabled-cell skipping, the roving tab stop, and the
 * Calendar-level shortcuts (Ctrl/Cmd + arrows, `y` to zoom out).
 *
 * Focus is asserted on the real host (`document.activeElement`), so these tests
 * cover the whole chain: the cell's `onKeyDown` → `handleControlKeyDown` →
 * the `FocusableControl` descriptor `Month`/`MonthsList`/`YearsList` register →
 * `focusElement(node)`.
 */
import { Calendar } from "../Calendar";
import { DatePicker } from "../DatePicker";
import { act, fireEvent, render, screen } from "../test-utils";

/** The interactive cell whose visible label is exactly `text`. */
function cell(text: string): HTMLElement {
  const button = screen
    .getAllByText(text, { selector: "span" })
    .map((node) => node.closest("button"))
    .find((node): node is HTMLButtonElement => node !== null);
  if (!button) throw new Error(`No cell "${text}"`);
  return button;
}

function press(key: string, target: Element = document.activeElement!, init: object = {}) {
  fireEvent.keyDown(target, { key, ...init });
}

function focus(el: HTMLElement) {
  act(() => el.focus());
  expect(document.activeElement).toBe(el);
}

const JAN_2024 = "2024-01-01";

describe("day grid (month level)", () => {
  it("arrows move focus by one day / one week", () => {
    render(<DatePicker defaultDate={JAN_2024} />);
    focus(cell("15"));

    press("ArrowRight");
    expect(document.activeElement).toBe(cell("16"));
    press("ArrowDown");
    expect(document.activeElement).toBe(cell("23"));
    press("ArrowUp");
    expect(document.activeElement).toBe(cell("16"));
    press("ArrowLeft");
    expect(document.activeElement).toBe(cell("15"));
  });

  it("skips disabled days in the direction of travel", () => {
    render(<DatePicker defaultDate={JAN_2024} excludeDate={(d) => d === "2024-01-16"} />);
    focus(cell("15"));
    press("ArrowRight");
    expect(document.activeElement).toBe(cell("17"));
  });

  it("crosses into the next panel with numberOfColumns > 1", () => {
    render(<DatePicker defaultDate={JAN_2024} numberOfColumns={2} hideOutsideDates />);
    // Jan 31 2024 is the last in-month day of January's grid.
    focus(cell("31"));
    press("ArrowRight");
    const focused = document.activeElement as HTMLElement;
    expect(focused.getAttribute("aria-label")).toMatch(/February 2024/);
  });

  it("keeps exactly one day in the tab order (roving tab stop on the selection)", () => {
    render(<DatePicker defaultDate={JAN_2024} defaultValue="2024-01-20" />);
    const tabbable = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-label")?.includes("January 2024"))
      .filter((b) => b.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(cell("20"));
  });

  it("Enter/press on the focused day selects it", () => {
    const onChange = jest.fn();
    render(<DatePicker defaultDate={JAN_2024} onChange={onChange} />);
    focus(cell("15"));
    press("ArrowRight");
    fireEvent.click(document.activeElement!);
    expect(onChange).toHaveBeenLastCalledWith("2024-01-16");
  });
});

describe("month grid (year level)", () => {
  it("arrows move between months (3 columns)", () => {
    render(<Calendar defaultDate={JAN_2024} defaultLevel="year" />);
    focus(cell("Jan"));
    press("ArrowRight");
    expect(document.activeElement).toBe(cell("Feb"));
    press("ArrowDown");
    expect(document.activeElement).toBe(cell("May"));
    press("ArrowLeft");
    expect(document.activeElement).toBe(cell("Apr"));
    press("ArrowUp");
    expect(document.activeElement).toBe(cell("Jan"));
  });
});

describe("year grid (decade level)", () => {
  it("arrows move between years (ragged 3/3/3/1 grid)", () => {
    render(<Calendar defaultDate={JAN_2024} defaultLevel="decade" />);
    focus(cell("2021"));
    press("ArrowDown");
    expect(document.activeElement).toBe(cell("2024"));
    press("ArrowRight");
    expect(document.activeElement).toBe(cell("2025"));
    press("ArrowUp");
    expect(document.activeElement).toBe(cell("2022"));
  });
});

describe("Calendar shortcuts (web, focus inside the calendar)", () => {
  it("Ctrl+ArrowDown / Ctrl+ArrowUp step a year; Ctrl+Shift steps a decade", () => {
    render(<Calendar defaultDate={JAN_2024} />);
    focus(cell("15"));

    press("ArrowDown", document.activeElement!, { ctrlKey: true });
    expect(screen.getByText("January 2025")).toBeInTheDocument();

    // The day cells are keyed by date, so a new month remounts them: focus a
    // cell of the new grid before the next shortcut (the handler only acts
    // while focus is inside the calendar).
    focus(cell("15"));
    press("ArrowUp", document.activeElement!, { ctrlKey: true });
    expect(screen.getByText("January 2024")).toBeInTheDocument();

    focus(cell("15"));
    press("ArrowDown", document.activeElement!, { ctrlKey: true, shiftKey: true });
    expect(screen.getByText("January 2034")).toBeInTheDocument();
  });

  it("`y` zooms out from the month to the year level", () => {
    render(<Calendar defaultDate={JAN_2024} />);
    focus(cell("15"));
    press("y");
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(cell("Jan")).toBeInTheDocument();
  });

  it("shortcuts are inert when enableKeyboardNavigation is false", () => {
    render(<Calendar defaultDate={JAN_2024} enableKeyboardNavigation={false} />);
    focus(cell("15"));
    press("ArrowDown", document.activeElement!, { ctrlKey: true });
    expect(screen.getByText("January 2024")).toBeInTheDocument();
  });
});
