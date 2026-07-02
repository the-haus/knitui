import { clampDate } from "./clamp-date";

describe("clampDate", () => {
  const min = "2024-06-10";
  const max = "2024-06-20";

  it("returns the date (normalised to date-time) when there are no bounds", () => {
    expect(clampDate(undefined, undefined, "2024-06-15")).toBe("2024-06-15 00:00:00");
  });

  it("clamps a date below minDate up to minDate", () => {
    expect(clampDate(min, max, "2024-06-01")).toBe("2024-06-10 00:00:00");
  });

  it("clamps a date above maxDate down to maxDate", () => {
    expect(clampDate(min, max, "2024-06-25")).toBe("2024-06-20 00:00:00");
  });

  it("passes a date already inside the window straight through", () => {
    expect(clampDate(min, max, "2024-06-15")).toBe("2024-06-15 00:00:00");
  });

  it("honours a single (min-only) bound", () => {
    expect(clampDate(min, undefined, "2024-06-01")).toBe("2024-06-10 00:00:00");
    expect(clampDate(min, undefined, "2024-12-31")).toBe("2024-12-31 00:00:00");
  });

  it("accepts Date instances as input", () => {
    expect(clampDate(min, max, new Date("2024-06-15T00:00:00"))).toBe("2024-06-15 00:00:00");
  });
});
