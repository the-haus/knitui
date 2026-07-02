import { getWeekNumber } from "./get-week-number";

describe("getWeekNumber", () => {
  // 2024-06-10 is a Monday and the start of ISO week 24.
  const week = [
    "2024-06-10",
    "2024-06-11",
    "2024-06-12",
    "2024-06-13",
    "2024-06-14",
    "2024-06-15",
    "2024-06-16",
  ];

  it("derives the ISO week number from the week's Monday", () => {
    expect(getWeekNumber(week)).toBe(24);
  });

  it("is order-independent — it finds the Monday wherever it sits", () => {
    expect(getWeekNumber([...week].reverse())).toBe(24);
  });

  it("returns ISO week 1 for the first week of 2024 (Monday 2024-01-01)", () => {
    expect(
      getWeekNumber([
        "2024-01-01",
        "2024-01-02",
        "2024-01-03",
        "2024-01-04",
        "2024-01-05",
        "2024-01-06",
        "2024-01-07",
      ]),
    ).toBe(1);
  });
});
