/**
 * v3: `name` is NOT a styled() option — an unknown option key becomes a default
 * prop and is forwarded to the host, so `styled(Box, { name: "Day" })` would put
 * `name="Day"` on the DOM (and into FormData inside a `<form>`). Every dates
 * frame uses `displayName`; the ONLY `name` attributes allowed are the real form
 * fields a consumer asked for (`HiddenDatesInput` / `TimePicker` hidden input).
 */
import { DatePicker } from "../DatePicker";
import { DatePickerInput } from "../DatePickerInput";
import { MiniCalendar } from "../MiniCalendar";
import { render } from "../test-utils";
import { TimeGrid } from "../TimeGrid";
import { TimePicker } from "../TimePicker";

const named = (root: HTMLElement) =>
  Array.from(root.querySelectorAll("[name]")).map((el) => el.getAttribute("name"));

describe("no styled-config `name` leaks onto hosts", () => {
  it("calendar grids, header, cells, mini calendar and time grid carry no name attribute", () => {
    const { container } = render(
      <>
        <DatePicker type="range" defaultDate="2024-01-01" numberOfColumns={2} withWeekNumbers />
        <DatePicker defaultDate="2024-01-01" defaultLevel="year" />
        <DatePicker defaultDate="2024-01-01" defaultLevel="decade" />
        <MiniCalendar defaultDate="2024-01-01" />
        <TimeGrid data={["10:00", "11:00"]} />
        <TimePicker withSeconds format="12h" />
      </>,
    );
    expect(named(container)).toEqual([]);
  });

  it("only the consumer's real form-field names reach the DOM", () => {
    const { baseElement } = render(
      <>
        <DatePickerInput name="appointment" defaultValue="2024-01-15" />
        <TimePicker name="start" defaultValue="10:00" />
      </>,
    );
    expect(named(baseElement).sort()).toEqual(["appointment", "start"]);
  });
});
