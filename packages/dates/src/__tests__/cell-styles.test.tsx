/**
 * Cell state → style resolution for the calendar's hot-path leaves (`Day`,
 * `PickerControl`, the `TimeGrid` control) on Tamagui v3.
 *
 * Asserts the emitted atomic CSS (docs/v3/conventions.md §8 — behaviour, not
 * class spellings): the resolved base value per property, and the `:hover` /
 * `:active` clauses. v3 merges style slots per (property, condition) before
 * emitting, so each property has exactly one winning value per condition — these
 * tests pin the variant PRECEDENCE (`selected` over `inRange`, the range edges
 * over `inRange`'s squared corners, `disabled` gating) as well as the values.
 */
import dayjs from "dayjs";

import { DatePicker } from "../DatePicker";
import { Day } from "../Day";
import { PickerControl } from "../PickerControl";
import { fireEvent, render, screen } from "../test-utils";
import { TimeControlsList } from "../TimeControlsList/TimeControlsList";
import { TimeGrid } from "../TimeGrid";
import { TimePresets } from "../TimePresets/TimePresets";
import { baseStyle, stateStyle } from "./css-rules.test.helper";

const DATE = "2024-01-15";

const dayButton = (label = "15") =>
  screen.getByText(label, { selector: "span" }).closest("button") as HTMLElement;

const label = (text: string) => screen.getByText(text, { selector: "span" });

describe("Day — state variants resolve to the theme ramp", () => {
  it("idle: transparent, hover color2, press color3, pointer cursor, md square", () => {
    render(<Day date={DATE} />);
    const el = dayButton();
    expect(baseStyle(el)).toMatchObject({
      "background-color": "transparent",
      cursor: "pointer",
      width: "42px",
      height: "42px",
      "min-height": "42px",
      "border-radius": "var(--t-radius-sm)",
    });
    expect(stateStyle(el, ":hover")).toMatchObject({ "background-color": "var(--color2)" });
    expect(stateStyle(el, ":active")).toMatchObject({ "background-color": "var(--color3)" });
    expect(baseStyle(label("15"))).toMatchObject({ color: "var(--color)", "font-size": "15px" });
  });

  it("selected: solid accent with its own hover/press steps and a contrast label", () => {
    render(<Day date={DATE} selected />);
    const el = dayButton();
    expect(baseStyle(el)["background-color"]).toBe("var(--color9)");
    expect(stateStyle(el, ":hover")["background-color"]).toBe("var(--color10)");
    expect(stateStyle(el, ":active")["background-color"]).toBe("var(--color8)");
    expect(baseStyle(label("15")).color).toBe("var(--color1)");
  });

  it("inRange: subtle tint and squared corners", () => {
    render(<Day date={DATE} inRange />);
    const el = dayButton();
    expect(baseStyle(el)).toMatchObject({
      "background-color": "var(--color4)",
      "border-radius": "0px",
    });
    expect(stateStyle(el, ":hover")["background-color"]).toBe("var(--color5)");
  });

  it("firstInRange / lastInRange round only their own edge", () => {
    const { unmount } = render(<Day date={DATE} inRange firstInRange />);
    const first = baseStyle(dayButton());
    expect(first["border-top-left-radius"]).toBe("var(--t-radius-sm)");
    expect(first["border-bottom-left-radius"]).toBe("var(--t-radius-sm)");
    expect(first["border-top-right-radius"]).toBeUndefined();
    unmount();

    render(<Day date={DATE} inRange lastInRange />);
    const last = baseStyle(dayButton());
    expect(last["border-top-right-radius"]).toBe("var(--t-radius-sm)");
    expect(last["border-bottom-right-radius"]).toBe("var(--t-radius-sm)");
    expect(last["border-top-left-radius"]).toBeUndefined();
  });

  it("selected wins over inRange on background (prop order)", () => {
    render(<Day date={DATE} inRange selected />);
    expect(baseStyle(dayButton())["background-color"]).toBe("var(--color9)");
  });

  it("weekend: red label; selected weekend: contrast label", () => {
    const { unmount } = render(<Day date={DATE} weekend />);
    expect(baseStyle(label("15")).color).toBe("var(--red9)");
    unmount();
    render(<Day date={DATE} weekend selected />);
    expect(baseStyle(label("15")).color).toBe("var(--color1)");
  });

  it("outside: dimmed", () => {
    render(<Day date={DATE} outside />);
    expect(baseStyle(dayButton()).opacity).toBe("0.5");
  });

  it("today: accent outline only when highlightToday, and not once selected", () => {
    const today = dayjs().format("YYYY-MM-DD");
    const dayNum = String(dayjs().date());
    const { unmount } = render(<Day date={today} highlightToday />);
    expect(baseStyle(dayButton(dayNum))).toMatchObject({
      "border-width": "1px",
      "border-color": "var(--color7)",
    });
    unmount();

    render(<Day date={today} highlightToday selected />);
    expect(baseStyle(dayButton(dayNum))["border-color"]).toBe("transparent");
  });

  it("disabled: dimmed, not-allowed cursor, no pointer events, and no selection styling", () => {
    render(<Day date={DATE} disabled selected inRange weekend />);
    const el = dayButton();
    expect(baseStyle(el)).toMatchObject({
      opacity: "0.5",
      cursor: "not-allowed",
      "pointer-events": "none",
      "background-color": "transparent",
    });
    expect(baseStyle(label("15")).color).toBe("var(--color)");
    expect(el).toBeDisabled();
  });

  it("static: a div with the default cursor and no hover/press affordance", () => {
    render(<Day date={DATE} static data-testid="d" />);
    const el = screen.getByTestId("d");
    expect(el.tagName).toBe("DIV");
    expect(baseStyle(el).cursor).toBe("default");
    expect(stateStyle(el, ":hover")["background-color"]).toBe("transparent");
    expect(stateStyle(el, ":active")["background-color"]).toBe("transparent");
  });

  it("hidden: display none", () => {
    render(<Day date={DATE} hidden data-testid="d" />);
    expect(baseStyle(screen.getByTestId("d")).display).toBe("none");
  });

  it.each([
    ["xxs", 24, 11],
    ["sm", 36, 14],
    ["lg", 48, 17],
    ["xxl", 60, 21],
  ] as const)(
    "size=%s → %ipx square, %ipx label (label reads size via context)",
    (size, px, font) => {
      render(<Day date={DATE} size={size} />);
      expect(baseStyle(dayButton())).toMatchObject({ width: `${px}px`, height: `${px}px` });
      expect(baseStyle(label("15"))["font-size"]).toBe(`${font}px`);
    },
  );

  it("fullWidth fills the cell in both axes and keeps the square floor", () => {
    render(<Day date={DATE} fullWidth />);
    expect(baseStyle(dayButton())).toMatchObject({
      width: "100%",
      height: "100%",
      "min-height": "42px",
    });
  });

  it("does not leak the v2 `name` styled option as a DOM name of its own", () => {
    render(<Day date={DATE} />);
    // v3 forwards a styled() `name:` default prop to the host. Dates frames use
    // `displayName`, so the cell never claims `name="Day"`.
    expect(dayButton()).not.toHaveAttribute("name", "Day");
  });
});

describe("PickerControl — state variants", () => {
  it("idle → wide md cell (98 × 42) with the shared hover/press ramp", () => {
    render(<PickerControl>Jan</PickerControl>);
    const el = screen.getByRole("button");
    expect(baseStyle(el)).toMatchObject({
      width: "98px",
      height: "42px",
      "background-color": "transparent",
    });
    expect(stateStyle(el, ":hover")["background-color"]).toBe("var(--color2)");
  });

  it("selected suppresses the in-range tint; label flips to contrast", () => {
    render(
      <PickerControl selected inRange>
        Jan
      </PickerControl>,
    );
    expect(baseStyle(screen.getByRole("button"))["background-color"]).toBe("var(--color9)");
    expect(baseStyle(label("Jan")).color).toBe("var(--color1)");
  });

  it("inRange (not selected) tints and squares; edges round", () => {
    render(
      <PickerControl inRange firstInRange>
        Jan
      </PickerControl>,
    );
    const style = baseStyle(screen.getByRole("button"));
    expect(style["background-color"]).toBe("var(--color4)");
    expect(style["border-top-left-radius"]).toBe("var(--t-radius-sm)");
  });

  it("disabled: dimmed, not-allowed, hover/press neutralised", () => {
    render(<PickerControl disabled>Jan</PickerControl>);
    const el = screen.getByRole("button");
    expect(baseStyle(el)).toMatchObject({ opacity: "0.5", cursor: "not-allowed" });
    expect(stateStyle(el, ":hover")["background-color"]).toBe("transparent");
  });

  it("size=sm → 84 × 36 with a 14px label", () => {
    render(<PickerControl size="sm">Jan</PickerControl>);
    expect(baseStyle(screen.getByRole("button"))).toMatchObject({ width: "84px", height: "36px" });
    expect(baseStyle(label("Jan"))["font-size"]).toBe("14px");
  });
});

describe("TimeGrid control — state variants", () => {
  it("selected control fills with the accent; disabled one dims", () => {
    render(<TimeGrid data={["10:00", "11:00"]} value="10:00" maxTime="10:30" />);
    const [active, disabled] = screen.getAllByRole("button");
    expect(baseStyle(active!)).toMatchObject({
      "background-color": "var(--color9)",
      "border-color": "var(--color9)",
    });
    expect(baseStyle(label("10:00")).color).toBe("var(--color1)");
    expect(baseStyle(disabled!)).toMatchObject({ opacity: "0.5", cursor: "not-allowed" });
  });

  it("size drives min-height and label font (sm default: 36 / 14)", () => {
    render(<TimeGrid data={["10:00"]} />);
    expect(baseStyle(screen.getByRole("button"))["min-height"]).toBe("36px");
    expect(baseStyle(label("10:00"))["font-size"]).toBe("14px");
  });
});

describe("time dropdown cells — active variants", () => {
  it("TimeControl: active fill + contrast label (a variant, not a dynamic color prop)", () => {
    render(
      <TimeControlsList min={0} max={2} step={1} value={1} onSelect={() => {}} reversed={false} />,
    );
    const active = label("01");
    expect(baseStyle(active).color).toBe("var(--color1)");
    expect(baseStyle(active.closest("button")!)["background-color"]).toBe("var(--color9)");
    expect(baseStyle(label("00")).color).toBe("var(--color)");
  });

  it("TimePresetControl: active fill + contrast label through styled(TimeValue)", () => {
    render(
      <TimePresets
        presets={["10:00", "12:30"]}
        format="24h"
        amPmLabels={{ am: "AM", pm: "PM" }}
        withSeconds={false}
        value="12:30"
        onChange={() => {}}
      />,
    );
    expect(baseStyle(label("12:30")).color).toBe("var(--color1)");
    expect(baseStyle(label("12:30").closest("button")!)["background-color"]).toBe("var(--color9)");
    expect(baseStyle(label("10:00")).color).toBe("var(--color)");
  });
});

describe("range selection visuals (DatePicker type='range')", () => {
  it("endpoints are selected, days between are tinted, edges are rounded", () => {
    render(
      <DatePicker
        type="range"
        defaultDate={new Date(2024, 0, 1)}
        value={["2024-01-10", "2024-01-13"]}
        onChange={jest.fn()}
      />,
    );
    const start = dayButton("10");
    const middle = dayButton("11");
    const end = dayButton("13");

    expect(start).toHaveAttribute("aria-selected", "true");
    expect(end).toHaveAttribute("aria-selected", "true");
    expect(middle).not.toHaveAttribute("aria-selected");

    expect(baseStyle(start)["background-color"]).toBe("var(--color9)");
    expect(baseStyle(start)["border-top-left-radius"]).toBe("var(--t-radius-sm)");
    expect(baseStyle(end)["background-color"]).toBe("var(--color9)");
    expect(baseStyle(end)["border-top-right-radius"]).toBe("var(--t-radius-sm)");

    expect(baseStyle(middle)).toMatchObject({
      "background-color": "var(--color4)",
      "border-radius": "0px",
    });
    // A day outside the range keeps the idle look.
    expect(baseStyle(dayButton("20"))["background-color"]).toBe("transparent");
  });

  it("previews the range under the pointer after the first click (web hover)", () => {
    render(<DatePicker type="range" defaultDate={new Date(2024, 0, 1)} />);
    fireEvent.click(dayButton("10"));
    fireEvent.mouseEnter(dayButton("13"));
    expect(baseStyle(dayButton("11"))["background-color"]).toBe("var(--color4)");
    expect(baseStyle(dayButton("20"))["background-color"]).toBe("transparent");
  });
});
